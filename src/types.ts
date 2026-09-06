export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  contentSnippet: string;
  contentHtml?: string;
  pubDate: string; // ISO or formatted
  timestamp: number;
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  author?: string;
  imageUrl?: string;
  sentiment?: Sentiment;
  isRead?: boolean;
  isBookmarked?: boolean;
  isBreaking?: boolean;
  tags?: string[];
}

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  category: 'tech' | 'brazil' | 'world' | 'finance' | 'sports' | 'entertainment' | 'ai' | 'custom';
  icon?: string;
  active: boolean;
  status: 'ok' | 'error' | 'loading';
  lastUpdated?: number;
  errorMsg?: string;
}

export type BlockLayout = 'hero' | 'grid' | 'compact' | 'list' | 'media-wall' | 'ticker';

export interface DynamicBlock {
  id: string;
  title: string;
  categoryFilter?: string; // 'all' or specific feed category
  feedIds?: string[]; // specific feeds to pull from (if empty, pulls from all active category feeds)
  filterKeyword?: string; // e.g. "Inteligência Artificial" or "Mercado"
  layout: BlockLayout;
  itemCount: number; // 3 to 20
  autoRefreshSec: number;
  isPinned?: boolean;
  aiSummary?: string;
  aiSummaryDate?: number;
  accentColor?: string;
}

export type AccentColor = 'orange' | 'emerald' | 'cyan' | 'purple' | 'red' | 'amber' | 'blue' | 'pink';

export interface ClusterSource {
  sourceName: string;
  sourceId: string;
  link: string;
  title: string;
  timestamp: number;
  pubDate: string;
  author?: string;
  imageUrl?: string;
  contentSnippet: string;
  contentHtml?: string;
}

export interface NewsStory extends NewsItem {
  articles: NewsItem[];
  sourcesCount: number;
  uniqueSources: ClusterSource[];
  isCluster: boolean;
  clusterId: string;
  consolidatedAiSummary?: string;
}

export type ClusteringStrategy = 'balanced' | 'conservative' | 'aggressive';

export interface DeduplicationSettings {
  enabled: boolean;
  similarityThreshold: number; // 0.0 to 1.0 (e.g. 0.62)
  timeWindowHours: number; // hours e.g. 48
  maxArticlesPerCluster: number; // e.g. 10
  strategy: ClusteringStrategy;
}

export interface AppSettings {
  language?: 'en' | 'pt';
  theme: 'dark' | 'light';
  accentColor?: AccentColor;
  globalRefreshSec: number; // e.g., 60
  soundAlerts: boolean;
  browserNotifications: boolean;
  breakingKeywords: string[];
  layoutCols: number; // 1, 2, 3
  geminiApiKey?: string;
  deduplication?: DeduplicationSettings;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  imageUrl?: string;
  article?: NewsItem;
  timestamp?: number;
  type?: 'breaking' | 'info' | 'success' | 'warning';
}
