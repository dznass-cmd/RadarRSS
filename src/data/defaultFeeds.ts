import { RssFeed } from '../types';

export const DEFAULT_FEEDS: RssFeed[] = [
  // International Tech & Dev
  {
    id: 'techcrunch',
    title: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    icon: '🔥',
    active: true,
    status: 'ok',
  },
  {
    id: 'hackernews',
    title: 'Hacker News (YC)',
    url: 'https://news.ycombinator.com/rss',
    category: 'tech',
    icon: '🚀',
    active: true,
    status: 'ok',
  },
  {
    id: 'theverge',
    title: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    icon: '⚡',
    active: true,
    status: 'ok',
  },
  {
    id: 'wired',
    title: 'WIRED',
    url: 'https://www.wired.com/feed/rss',
    category: 'tech',
    icon: '💡',
    active: true,
    status: 'ok',
  },
  {
    id: 'devto',
    title: 'Dev.to',
    url: 'https://dev.to/feed',
    category: 'tech',
    icon: '👨‍💻',
    active: true,
    status: 'ok',
  },
  {
    id: 'tecnoblog',
    title: 'Tecnoblog',
    url: 'https://tecnoblog.net/feed/',
    category: 'tech',
    icon: '💻',
    active: true,
    status: 'ok',
  },

  // Global & World News
  {
    id: 'bbc_world',
    title: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    icon: '🌍',
    active: true,
    status: 'ok',
  },
  {
    id: 'guardian_world',
    title: 'The Guardian (World)',
    url: 'https://www.theguardian.com/world/rss',
    category: 'world',
    icon: '📰',
    active: true,
    status: 'ok',
  },

  // Regional (Brasil) & General
  {
    id: 'g1_brasil',
    title: 'G1 - Brasil',
    url: 'https://g1.globo.com/rss/g1/brasil/',
    category: 'brazil',
    icon: '🇧🇷',
    active: true,
    status: 'ok',
  },
  {
    id: 'cnn_brasil',
    title: 'CNN Brasil',
    url: 'https://www.cnnbrasil.com.br/feed/',
    category: 'brazil',
    icon: '📰',
    active: true,
    status: 'ok',
  },
  {
    id: 'agencia_brasil',
    title: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
    category: 'brazil',
    icon: '🏛️',
    active: true,
    status: 'ok',
  },
  {
    id: 'bbc_brasil',
    title: 'BBC News Brasil',
    url: 'https://feeds.bbci.co.uk/portuguese/rss.xml',
    category: 'brazil',
    icon: '🌐',
    active: true,
    status: 'ok',
  },

  // Economia & Negócios
  {
    id: 'infomoney',
    title: 'InfoMoney',
    url: 'https://www.infomoney.com.br/feed/',
    category: 'finance',
    icon: '📈',
    active: true,
    status: 'ok',
  },
  {
    id: 'exame',
    title: 'Exame Negócios',
    url: 'https://exame.com/feed/',
    category: 'finance',
    icon: '💼',
    active: true,
    status: 'ok',
  },

  // IA & Inovação
  {
    id: 'mit_tech_ai',
    title: 'MIT Tech Review (AI)',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    category: 'ai',
    icon: '🤖',
    active: true,
    status: 'ok',
  },
  {
    id: 'techcrunch_ai',
    title: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'ai',
    icon: '🧠',
    active: true,
    status: 'ok',
  },

  // Esportes
  {
    id: 'ge_globo',
    title: 'GE (Globo Esporte)',
    url: 'https://ge.globo.com/rss/ge/',
    category: 'sports',
    icon: '⚽',
    active: true,
    status: 'ok',
  },

  // Cultura & Entretenimento
  {
    id: 'b9',
    title: 'B9 Cultura e Mídia',
    url: 'https://www.b9.com.br/feed/',
    category: 'entertainment',
    icon: '🎬',
    active: true,
    status: 'ok',
  }
];
