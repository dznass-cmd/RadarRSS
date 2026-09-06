/**
 * Multi-signal similarity engine for news deduplication and story clustering.
 * Evaluates titles, snippets, entities, action verbs, cross-lingual equivalence,
 * and temporal windows while enforcing false-positive guardrails.
 */

import { NewsItem } from '../../types';
import {
  cleanHeadline,
  tokenizeText,
  stripAccents,
  normalizeCanonicalUrl,
  getActionCategories,
  extractEntitiesAndNumbers,
  generateNgrams,
} from './textUtils';

// Cross-lingual synonym map (PT <-> EN) for common news and tech vocabulary
const CROSS_LINGUAL_SYNONYMS: Record<string, string[]> = {
  // Verbs / Actions
  lanca: ['launch', 'launches', 'launched', 'unveil', 'unveils', 'unveiled', 'announce', 'announces', 'announced', 'release', 'releases', 'introduce'],
  lancamento: ['launch', 'release', 'debut', 'unveiling', 'announcement'],
  anuncia: ['announce', 'announces', 'announced', 'declares', 'unveils', 'reveals'],
  apresenta: ['unveil', 'unveils', 'present', 'presents', 'introduces', 'reveals'],
  revela: ['reveals', 'revealed', 'unveils', 'unveiled', 'uncovers'],
  aumenta: ['increases', 'increased', 'hikes', 'hiked', 'raises', 'raised'],
  aumento: ['hike', 'increase', 'rise', 'surge'],
  cai: ['falls', 'drops', 'plunges', 'slumps'],
  queda: ['drop', 'fall', 'plunge', 'slump', 'decline'],
  compra: ['buys', 'bought', 'acquires', 'acquired', 'purchase'],
  vende: ['sells', 'sold', 'divests'],
  processa: ['sues', 'sued', 'files', 'lawsuit'],
  investiga: ['probes', 'probed', 'investigates', 'investigated'],
  multa: ['fines', 'fined', 'penalty'],
  morre: ['dies', 'dead', 'passes'],

  // Nouns / Concepts
  novo: ['new', 'latest', 'fresh'],
  nova: ['new', 'latest', 'fresh'],
  preco: ['price', 'prices', 'cost', 'costs'],
  precos: ['prices', 'costs'],
  governo: ['government', 'administration'],
  presidente: ['president', 'ceo', 'chief'],
  acordo: ['deal', 'agreement', 'pact'],
  empresa: ['company', 'firm', 'corp'],
  mercado: ['market', 'markets'],
  inteligencia: ['intelligence', 'ai'],
  artificial: ['artificial', 'ai'],
  usuario: ['user', 'users'],
  usuarios: ['users'],
  seguranca: ['security', 'safety'],
  ataque: ['attack', 'cyberattack', 'hack'],
  brasil: ['brazil', 'brazilian'],
  eua: ['us', 'usa', 'america', 'american'],
};

// Inverted lookup map for fast O(1) cross-lingual synonym matching
const REVERSE_SYNONYM_MAP = new Map<string, string>();
for (const [ptWord, enWords] of Object.entries(CROSS_LINGUAL_SYNONYMS)) {
  const normPt = stripAccents(ptWord);
  REVERSE_SYNONYM_MAP.set(normPt, normPt);
  for (const en of enWords) {
    const normEn = stripAccents(en);
    REVERSE_SYNONYM_MAP.set(normEn, normPt);
  }
}

/**
 * Standardizes a token to its cross-lingual root concept if known.
 */
export function canonicalizeToken(token: string): string {
  const norm = stripAccents(token);
  return REVERSE_SYNONYM_MAP.get(norm) || norm;
}

export interface ArticleFeatures {
  article: NewsItem;
  cleanTitle: string;
  tokens: string[];
  canonicalTokens: Set<string>;
  tokenFrequency: Map<string, number>;
  bigrams: Set<string>;
  actionCategories: Set<string>;
  numbers: Set<string>;
  entities: Set<string>;
  canonicalUrl: string;
  snippetTokens: Set<string>;
  candidateIndexTokens: Set<string>;
  normalizedCleanTitle: string;
  hasShortTitle: boolean;
}

/**
 * Extracts and pre-computes features for an article to avoid repeated work.
 */
export function extractArticleFeatures(article: NewsItem): ArticleFeatures {
  const cleanTitle = cleanHeadline(article.title);
  const rawTokens = tokenizeText(cleanTitle, { removeStopwords: true, minLength: 2 });
  const canonicalTokens = new Set<string>();
  const tokenFrequency = new Map<string, number>();

  rawTokens.forEach((t) => {
    const canon = canonicalizeToken(t);
    canonicalTokens.add(canon);
    canonicalTokens.add(t);
    tokenFrequency.set(canon, (tokenFrequency.get(canon) || 0) + 1);
  });

  const bigrams = generateNgrams(rawTokens, 2);
  const actionCategories = getActionCategories(rawTokens);
  const { numbers, entities } = extractEntitiesAndNumbers(cleanTitle);

  // Extract snippet tokens & entities
  const rawSnippetTokens = tokenizeText(article.contentSnippet || '', { removeStopwords: true, minLength: 3 });
  const snippetTokens = new Set<string>();
  rawSnippetTokens.forEach((t) => {
    snippetTokens.add(canonicalizeToken(t));
    snippetTokens.add(t);
  });

  const { numbers: snippetNumbers, entities: snippetEntities } = extractEntitiesAndNumbers(article.contentSnippet || '');
  snippetNumbers.forEach((n) => numbers.add(n));
  snippetEntities.forEach((e) => entities.add(e));

  // Candidate index tokens: combine title tokens + distinctive entities/numbers from snippet
  const candidateIndexTokens = new Set<string>(canonicalTokens);
  entities.forEach((e) => candidateIndexTokens.add(e));
  numbers.forEach((n) => candidateIndexTokens.add(n));
  // Add up to 5 distinctive snippet tokens to inverted index
  let addedSnippet = 0;
  for (const st of snippetTokens) {
    if (!candidateIndexTokens.has(st) && st.length >= 4) {
      candidateIndexTokens.add(st);
      addedSnippet++;
      if (addedSnippet >= 5) break;
    }
  }

  const normalizedCleanTitle = stripAccents(cleanTitle).replace(/[^a-z0-9]/g, '');

  return {
    article,
    cleanTitle,
    tokens: rawTokens,
    canonicalTokens,
    tokenFrequency,
    bigrams,
    actionCategories,
    numbers,
    entities,
    canonicalUrl: normalizeCanonicalUrl(article.link),
    snippetTokens,
    candidateIndexTokens,
    normalizedCleanTitle,
    hasShortTitle: rawTokens.length < 3,
  };
}

export interface SimilarityResult {
  similarity: number; // 0.0 to 1.0
  isMatch: boolean;
  reasons: string[];
  divergenceDetected: boolean;
}

export interface SimilarityEngineOptions {
  threshold: number; // default 0.60 - 0.65
  timeWindowMs: number; // default 48h
  strategy?: 'balanced' | 'conservative' | 'aggressive';
}

/**
 * Evaluates similarity between two articles across multiple signals.
 */
export function calculateArticleSimilarity(
  featA: ArticleFeatures,
  featB: ArticleFeatures,
  options: SimilarityEngineOptions
): SimilarityResult {
  const reasons: string[] = [];

  // Signal 0: Identical or Duplicate Canonical URL
  if (featA.canonicalUrl && featB.canonicalUrl && featA.canonicalUrl === featB.canonicalUrl) {
    return {
      similarity: 1.0,
      isMatch: true,
      reasons: ['identical_url'],
      divergenceDetected: false,
    };
  }

  // Signal 0.1: Temporal Window Check
  const timeDiff = Math.abs(featA.article.timestamp - featB.article.timestamp);
  if (timeDiff > options.timeWindowMs) {
    return {
      similarity: 0.0,
      isMatch: false,
      reasons: ['outside_time_window'],
      divergenceDetected: false,
    };
  }

  // Signal 1: Title Exact / Cleaned Match
  if (featA.normalizedCleanTitle.length > 8 && featA.normalizedCleanTitle === featB.normalizedCleanTitle) {
    return {
      similarity: 1.0,
      isMatch: true,
      reasons: ['exact_cleaned_title'],
      divergenceDetected: false,
    };
  }

  // Signal 2: Guardrail for Short Titles
  // Very short titles (e.g. "Apple", "Guerra", "Update") must NOT cluster easily
  if (featA.hasShortTitle || featB.hasShortTitle) {
    // Both must have at least 2 common tokens OR snippet confirmation
    let commonTitleCount = 0;
    for (const t of featA.canonicalTokens) {
      if (featB.canonicalTokens.has(t)) commonTitleCount++;
    }

    // Snippet overlap check for short titles
    let sharedSnippetCount = 0;
    for (const st of featA.snippetTokens) {
      if (featB.snippetTokens.has(st)) sharedSnippetCount++;
    }
    const snippetRatio = Math.min(featA.snippetTokens.size, featB.snippetTokens.size) > 0
      ? sharedSnippetCount / Math.min(featA.snippetTokens.size, featB.snippetTokens.size)
      : 0;

    if (commonTitleCount < 2 && snippetRatio < 0.35) {
      return {
        similarity: 0.1,
        isMatch: false,
        reasons: ['short_title_guardrail'],
        divergenceDetected: false,
      };
    }
  }

  // Signal 3: Action / Event Divergence Guardrail (Crucial False Positive Prevention)
  // e.g.: "Apple lança novo iPhone" vs "Apple aumenta preço do iPhone no Brasil"
  // Both have action groups, but no intersection!
  let divergenceDetected = false;
  if (featA.actionCategories.size > 0 && featB.actionCategories.size > 0) {
    let hasSharedAction = false;
    for (const act of featA.actionCategories) {
      if (featB.actionCategories.has(act)) {
        hasSharedAction = true;
        break;
      }
    }

    if (!hasSharedAction) {
      divergenceDetected = true;
      reasons.push('conflicting_action_events');
    }
  }

  // Signal 4: Specific Number Inconsistency (e.g. iPhone 16 vs iPhone 15, or $50 vs $200)
  if (featA.numbers.size > 0 && featB.numbers.size > 0) {
    let numberIntersection = 0;
    for (const n of featA.numbers) {
      if (featB.numbers.has(n)) numberIntersection++;
    }
    // If both mention distinct versions/numbers with zero overlap, apply penalty
    if (numberIntersection === 0 && featA.numbers.size === 1 && featB.numbers.size === 1) {
      divergenceDetected = true;
      reasons.push('conflicting_numbers');
    }
  }

  // Signal 5: Token Overlap & Jaccard / Dice Calculation
  let sharedTokens = 0;
  for (const token of featA.canonicalTokens) {
    if (featB.canonicalTokens.has(token)) {
      sharedTokens++;
    }
  }

  const unionSize = new Set([...featA.canonicalTokens, ...featB.canonicalTokens]).size;
  const minSize = Math.min(featA.canonicalTokens.size, featB.canonicalTokens.size);
  const jaccard = unionSize > 0 ? sharedTokens / unionSize : 0;
  const overlap = minSize > 0 ? sharedTokens / minSize : 0;
  const dice = (featA.canonicalTokens.size + featB.canonicalTokens.size) > 0
    ? (2 * sharedTokens) / (featA.canonicalTokens.size + featB.canonicalTokens.size)
    : 0;

  // Signal 6: Bigram / Phrase Overlap
  let sharedBigrams = 0;
  for (const bg of featA.bigrams) {
    if (featB.bigrams.has(bg)) sharedBigrams++;
  }
  const bigramBonus = sharedBigrams > 0 ? Math.min(sharedBigrams * 0.12, 0.25) : 0;

  // Signal 7: Snippet / Content Overlap (Crucial for completely different headlines)
  let sharedSnippetTokens = 0;
  if (featA.snippetTokens.size > 0 && featB.snippetTokens.size > 0) {
    for (const st of featA.snippetTokens) {
      if (featB.snippetTokens.has(st)) {
        sharedSnippetTokens++;
      }
    }
  }
  const snippetOverlapRatio = Math.min(featA.snippetTokens.size, featB.snippetTokens.size) > 0
    ? sharedSnippetTokens / Math.min(featA.snippetTokens.size, featB.snippetTokens.size)
    : 0;

  // Signal 8: Temporal Decay
  // Articles within 12h get 1.0 weight; 12h-48h decay gracefully down to 0.85
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  const temporalFactor = hoursDiff <= 12 ? 1.0 : Math.max(0.85, 1.0 - ((hoursDiff - 12) / 72) * 0.15);

  // Compute composite similarity score
  let baseScore = (dice * 0.55) + (overlap * 0.30) + bigramBonus;

  // Content/Snippet Support:
  // If snippet overlap is very strong (handles Case 2: different titles covering the same story)
  if (snippetOverlapRatio >= 0.38 && sharedSnippetTokens >= 3) {
    const snippetScore = (snippetOverlapRatio * 0.70) + Math.min(sharedSnippetTokens * 0.04, 0.25);
    baseScore = Math.max(baseScore, snippetScore);
    reasons.push('content_snippet_agreement');
  } else if (snippetOverlapRatio >= 0.28 && sharedTokens >= 1) {
    baseScore = Math.max(baseScore, (baseScore * 0.5) + (snippetOverlapRatio * 0.5) + 0.15);
    reasons.push('content_snippet_agreement');
  }

  // Apply temporal weight
  let finalScore = baseScore * temporalFactor;

  // Severe Penalty on Divergence (prevents false positive grouping)
  if (divergenceDetected) {
    finalScore = Math.max(0, finalScore - 0.45);
  }

  // Adjust threshold according to strategy
  let effectiveThreshold = options.threshold;
  if (options.strategy === 'conservative') {
    effectiveThreshold += 0.08;
  } else if (options.strategy === 'aggressive') {
    effectiveThreshold -= 0.08;
  }

  const isMatch = finalScore >= effectiveThreshold && !divergenceDetected;

  return {
    similarity: Math.min(1.0, Math.max(0.0, finalScore)),
    isMatch,
    reasons,
    divergenceDetected,
  };
}
