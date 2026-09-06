/**
 * High-performance News Clustering and Deduplication Service.
 * Implements an inverted-index temporal window pipeline to cluster articles
 * into consolidated stories with sub-quadratic O(N * k) time complexity.
 */

import { NewsItem, NewsStory, ClusterSource, DeduplicationSettings } from '../../types';
import {
  extractArticleFeatures,
  calculateArticleSimilarity,
  ArticleFeatures,
} from './similarityEngine';

export const DEFAULT_DEDUPLICATION_SETTINGS: DeduplicationSettings = {
  enabled: true,
  similarityThreshold: 0.58, // Balanced default threshold
  timeWindowHours: 48,
  maxArticlesPerCluster: 12,
  strategy: 'balanced',
};

interface InternalCluster {
  clusterId: string;
  leadArticle: NewsItem;
  leadFeatures: ArticleFeatures;
  articles: NewsItem[];
  allFeatures: ArticleFeatures[];
  uniqueSources: Map<string, ClusterSource>;
  latestTimestamp: number;
  bestImageUrl?: string;
}

/**
 * Clusters an array of NewsItems into consolidated NewsStories.
 */
export function clusterNewsItems(
  items: NewsItem[],
  customSettings?: Partial<DeduplicationSettings>
): NewsStory[] {
  const settings: DeduplicationSettings = {
    ...DEFAULT_DEDUPLICATION_SETTINGS,
    ...customSettings,
  };

  if (!items || items.length === 0) return [];

  // Helper to convert a single article to a 1-source story
  const toSingleStory = (item: NewsItem): NewsStory => {
    const source: ClusterSource = {
      sourceName: item.sourceName,
      sourceId: item.sourceId,
      link: item.link,
      title: item.title,
      timestamp: item.timestamp,
      pubDate: item.pubDate,
      author: item.author,
      imageUrl: item.imageUrl,
      contentSnippet: item.contentSnippet,
      contentHtml: item.contentHtml,
    };

    return {
      ...item,
      articles: [item],
      sourcesCount: 1,
      uniqueSources: [source],
      isCluster: false,
      clusterId: `story-${item.id}`,
    };
  };

  // If deduplication is disabled, return 1:1 stories
  if (!settings.enabled) {
    return items.map(toSingleStory);
  }

  const timeWindowMs = (settings.timeWindowHours || 48) * 60 * 60 * 1000;
  const maxArticles = settings.maxArticlesPerCluster || 12;

  // 1. Sort items newest first to maintain temporal hierarchy
  const sortedItems = [...items].sort((a, b) => b.timestamp - a.timestamp);

  // 2. Pre-extract features for all items
  const featuresList = sortedItems.map((item) => extractArticleFeatures(item));

  // 3. Inverted index: token -> list of cluster indexes
  const tokenIndex = new Map<string, number[]>();
  const canonicalUrlIndex = new Map<string, number>();

  const clusters: InternalCluster[] = [];

  // 4. Incremental clustering with inverted index
  for (let i = 0; i < featuresList.length; i++) {
    const feat = featuresList[i];
    const item = feat.article;

    // Fast Check: exact canonical URL match
    if (feat.canonicalUrl && canonicalUrlIndex.has(feat.canonicalUrl)) {
      const clusterIdx = canonicalUrlIndex.get(feat.canonicalUrl)!;
      const targetCluster = clusters[clusterIdx];
      if (targetCluster.articles.length < maxArticles) {
        addArticleToCluster(targetCluster, item, feat);
        continue;
      }
    }

    // Candidate selection via inverted index:
    // Count shared candidate tokens per cluster to rank most probable matches
    const candidateHitCounts = new Map<number, number>();
    for (const token of feat.candidateIndexTokens) {
      const matchingClusters = tokenIndex.get(token);
      if (matchingClusters) {
        for (const cIdx of matchingClusters) {
          candidateHitCounts.set(cIdx, (candidateHitCounts.get(cIdx) || 0) + 1);
        }
      }
    }

    // Filter and sort candidates: prioritize clusters sharing >= 2 tokens or high overlap
    // Cap candidate evaluation at top 20 candidates per article for O(N * k) guaranteed speed
    const candidateClusterIndices: number[] = [];
    for (const [cIdx, hits] of candidateHitCounts.entries()) {
      if (hits >= 2 || candidateHitCounts.size <= 10) {
        candidateClusterIndices.push(cIdx);
      }
    }

    if (candidateClusterIndices.length > 20) {
      candidateClusterIndices.sort((a, b) => (candidateHitCounts.get(b) || 0) - (candidateHitCounts.get(a) || 0));
      candidateClusterIndices.length = 20;
    }

    let bestClusterIdx = -1;
    let highestSimilarity = 0;

    for (const cIdx of candidateClusterIndices) {
      const cluster = clusters[cIdx];

      // Verify time window
      if (Math.abs(item.timestamp - cluster.latestTimestamp) > timeWindowMs) {
        continue;
      }

      // Check max articles limit
      if (cluster.articles.length >= maxArticles) {
        continue;
      }

      // Calculate similarity against the lead article
      const simResult = calculateArticleSimilarity(feat, cluster.leadFeatures, {
        threshold: settings.similarityThreshold,
        timeWindowMs,
        strategy: settings.strategy,
      });

      if (simResult.isMatch && simResult.similarity > highestSimilarity) {
        highestSimilarity = simResult.similarity;
        bestClusterIdx = cIdx;
      }
    }

    if (bestClusterIdx >= 0) {
      // Merge into best matching cluster
      const cluster = clusters[bestClusterIdx];
      addArticleToCluster(cluster, item, feat);

      // Index any new tokens into tokenIndex
      for (const token of feat.candidateIndexTokens) {
        let list = tokenIndex.get(token);
        if (!list) {
          list = [];
          tokenIndex.set(token, list);
        }
        if (!list.includes(bestClusterIdx)) {
          list.push(bestClusterIdx);
        }
      }

      if (feat.canonicalUrl) {
        canonicalUrlIndex.set(feat.canonicalUrl, bestClusterIdx);
      }
    } else {
      // Create new cluster
      const newClusterIdx = clusters.length;
      const sourceKey = `${item.sourceName.toLowerCase()}-${item.sourceId}`;
      const sourcesMap = new Map<string, ClusterSource>();
      sourcesMap.set(sourceKey, {
        sourceName: item.sourceName,
        sourceId: item.sourceId,
        link: item.link,
        title: item.title,
        timestamp: item.timestamp,
        pubDate: item.pubDate,
        author: item.author,
        imageUrl: item.imageUrl,
        contentSnippet: item.contentSnippet,
        contentHtml: item.contentHtml,
      });

      const newCluster: InternalCluster = {
        clusterId: `cluster-${item.id}-${Date.now().toString(36)}`,
        leadArticle: item,
        leadFeatures: feat,
        articles: [item],
        allFeatures: [feat],
        uniqueSources: sourcesMap,
        latestTimestamp: item.timestamp,
        bestImageUrl: item.imageUrl,
      };

      clusters.push(newCluster);

      // Index tokens of this new cluster
      for (const token of feat.candidateIndexTokens) {
        let list = tokenIndex.get(token);
        if (!list) {
          list = [];
          tokenIndex.set(token, list);
        }
        list.push(newClusterIdx);
      }

      if (feat.canonicalUrl) {
        canonicalUrlIndex.set(feat.canonicalUrl, newClusterIdx);
      }
    }
  }

  // 5. Convert internal clusters to public NewsStory objects
  const stories: NewsStory[] = clusters.map((c) => {
    const isCluster = c.articles.length > 1;
    const sourcesList = Array.from(c.uniqueSources.values());
    const lead = c.leadArticle;

    // Pick best image among all articles in cluster if lead has none
    let bestImage = lead.imageUrl;
    if (!bestImage) {
      for (const art of c.articles) {
        if (art.imageUrl) {
          bestImage = art.imageUrl;
          break;
        }
      }
    }

    // Select the cleanest, most complete snippet if lead snippet is tiny
    let bestSnippet = lead.contentSnippet;
    if (bestSnippet.length < 50) {
      for (const art of c.articles) {
        if (art.contentSnippet && art.contentSnippet.length > bestSnippet.length) {
          bestSnippet = art.contentSnippet;
        }
      }
    }

    // Check if any article in cluster was breaking
    const hasBreaking = c.articles.some((a) => a.isBreaking);

    return {
      ...lead,
      imageUrl: bestImage,
      contentSnippet: bestSnippet,
      isBreaking: hasBreaking || lead.isBreaking,
      articles: c.articles,
      sourcesCount: sourcesList.length,
      uniqueSources: sourcesList,
      isCluster,
      clusterId: c.clusterId,
    };
  });

  // Sort stories newest first
  stories.sort((a, b) => b.timestamp - a.timestamp);

  return stories;
}

/**
 * Helper to add an article into an existing cluster and update aggregate state.
 */
function addArticleToCluster(cluster: InternalCluster, item: NewsItem, feat: ArticleFeatures) {
  cluster.articles.push(item);
  cluster.allFeatures.push(feat);

  // Update latest timestamp
  if (item.timestamp > cluster.latestTimestamp) {
    cluster.latestTimestamp = item.timestamp;
  }

  // If cluster has no image, inherit image
  if (!cluster.bestImageUrl && item.imageUrl) {
    cluster.bestImageUrl = item.imageUrl;
  }

  // Register unique source
  const sourceKey = `${item.sourceName.toLowerCase()}-${item.sourceId}`;
  if (!cluster.uniqueSources.has(sourceKey)) {
    cluster.uniqueSources.set(sourceKey, {
      sourceName: item.sourceName,
      sourceId: item.sourceId,
      link: item.link,
      title: item.title,
      timestamp: item.timestamp,
      pubDate: item.pubDate,
      author: item.author,
      imageUrl: item.imageUrl,
      contentSnippet: item.contentSnippet,
      contentHtml: item.contentHtml,
    });
  }
}
