/**
 * Text normalization, canonicalization, tokenization, and entity extraction utilities
 * for multi-source news clustering.
 */

// Common multilingual stopwords (PT, EN, ES)
const STOPWORDS = new Set([
  // Portuguese
  'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'ate',
  'com', 'como', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles', 'depois', 'do',
  'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre', 'era', 'eram', 'eramos',
  'essa', 'essas', 'esse', 'esses', 'esta', 'estas', 'este', 'estes', 'eu', 'foi',
  'fomos', 'foram', 'ha', 'isso', 'isto', 'ja', 'mais', 'mas', 'me', 'mesmo', 'meu',
  'meus', 'minha', 'minhas', 'muito', 'na', 'nao', 'nas', 'nem', 'no', 'nos', 'nossa',
  'nossas', 'nosso', 'nossos', 'num', 'numa', 'o', 'os', 'ou', 'para', 'pela', 'pelas',
  'pelo', 'pelos', 'por', 'qual', 'quando', 'que', 'quem', 'se', 'seja', 'sem', 'sendo',
  'seu', 'seus', 'so', 'sua', 'suas', 'tambem', 'te', 'tem', 'tendo', 'ter', 'teu',
  'teus', 'tinha', 'tinham', 'toda', 'todas', 'todo', 'todos', 'tu', 'tua', 'tuas',
  'um', 'uma', 'umas', 'uns', 'voce', 'voces', 'vai', 'vou', 'diz', 'dizem', 'sobre',
  'apos', 'segundo', 'contra', 'onde', 'desde', 'durante', 'pode', 'podem',

  // English
  'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
  'both', 'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'if', 'in',
  'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
  'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', 'wasn', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'says', 'said', 'will', 'new', 'after', 'also', 'first', 'day', 'days', 'week', 'year',

  // Spanish
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'del',
  'al', 'con', 'por', 'para', 'en', 'es', 'son', 'fue', 'era', 'este', 'esta', 'estos',
  'estas', 'ese', 'esa', 'esos', 'esas', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'como'
]);

// Action/Event semantic clusters to distinguish events on the same topic
export const ACTION_GROUPS: Record<string, string[]> = {
  launch: [
    'lanca', 'lancamento', 'apresenta', 'revela', 'anuncia', 'estreia', 'chega', 'inicia',
    'debut', 'unveil', 'unveils', 'unveiled', 'release', 'releases', 'released',
    'announce', 'announces', 'announced', 'launch', 'launches', 'launched', 'reveal',
    'reveals', 'revealed', 'introduces', 'introduced', 'introduce'
  ],
  price_finance: [
    'preco', 'precos', 'aumenta', 'aumento', 'encarece', 'sobe', 'subida', 'cai', 'queda',
    'inflacao', 'taxa', 'taxas', 'corte', 'valor', 'lucro', 'prejuizo', 'receita',
    'price', 'prices', 'hike', 'hikes', 'hiked', 'cost', 'costs', 'increase', 'increases',
    'expensive', 'drops', 'drop', 'cut', 'cuts', 'tax', 'revenue', 'profit', 'loss'
  ],
  legal_dispute: [
    'processa', 'processo', 'multa', 'multas', 'investiga', 'investigacao', 'tribunal',
    'stf', 'justica', 'condena', 'condenacao', 'acao', 'bloqueio', 'suspensao',
    'sue', 'sues', 'sued', 'lawsuit', 'fine', 'fined', 'fines', 'probe', 'probed',
    'antitrust', 'court', 'judge', 'ban', 'banned', 'block', 'blocked'
  ],
  security_incident: [
    'ataque', 'ataques', 'hacker', 'hackers', 'hackeado', 'invasao', 'vazamento', 'vaza',
    'falha', 'falhas', 'golpe', 'golpes', 'ameaca', 'ameacas', 'virus', 'ransomware',
    'hack', 'hacked', 'breach', 'breached', 'leak', 'leaked', 'exploit', 'vulnerability',
    'scam', 'threat', 'cyberattack'
  ],
  deal_business: [
    'compra', 'comprado', 'adquire', 'aquisicao', 'fusao', 'vende', 'venda', 'acordo', 'parceria',
    'buy', 'buys', 'bought', 'acquire', 'acquires', 'acquired', 'acquisition', 'merger',
    'deal', 'partnership', 'sell', 'sells', 'sold'
  ],
  incident_disaster: [
    'morre', 'mortes', 'acidente', 'queda', 'terremoto', 'incendio', 'tragedia', 'feridos',
    'die', 'dies', 'died', 'dead', 'death', 'crash', 'quake', 'fire', 'tragedy', 'injured'
  ]
};

/**
 * Strips tracking query parameters, hashes, protocols, and standardizes URL.
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    // Strip common tracking and referral parameters
    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const k = key.toLowerCase();
      if (
        k.startsWith('utm_') ||
        k.startsWith('fbclid') ||
        k.startsWith('gclid') ||
        k === 'ref' ||
        k === 'source' ||
        k === 'referrer' ||
        k === 'ncid' ||
        k === 'spm' ||
        k === 'cmp' ||
        k === 'mkt_tok'
      ) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach((k) => parsed.searchParams.delete(k));

    // Strip hostname 'www.'
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);

    // Normalize path by stripping trailing slash
    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname) pathname = '/';

    const search = parsed.searchParams.toString();
    return `${host}${pathname}${search ? `?${search}` : ''}`;
  } catch {
    // If invalid URL, strip common cruft via regex
    return rawUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('#')[0]
      .split('?utm_')[0]
      .replace(/\/+$/, '');
  }
}

/**
 * Normalizes text: strips accents, decodes entities, trims, and converts to lowercase.
 */
export function stripAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Cleans a news headline: removes common editorial prefixes and source suffixes.
 * e.g., "URGENTE: Apple lança novo iPhone - G1" -> "Apple lança novo iPhone"
 */
export function cleanHeadline(rawTitle: string): string {
  if (!rawTitle) return '';
  let title = rawTitle.trim();

  // Remove HTML tags if present
  title = title.replace(/<[^>]*>?/gm, '');

  // Common editorial prefixes
  const prefixRegex = /^(?:urgente|breaking(?:\s+news)?|alerta|exclusivo|exclusive|bomba|opiniao|analise|analysis|watch|video|fotos|ao\s+vivo|live|atualizacao|update|review|hands-on)\s*[:\-\—\|]\s*/i;
  title = title.replace(prefixRegex, '');

  // Common trailing source mentions: e.g. " - Reuters", " | The Verge", " - TechCrunch", " - G1"
  const suffixRegex = /\s*(?:[-–—|•·]\s*(?:reuters|the\s+verge|techcrunch|g1|folha|uol|cnn(?:\s+brasil)?|bbc(?:\s+news)?|guardian|wired|bloomberg|forbes|ap\s+news|associated\s+press|ign|engadget|the\s+guardian|elpais|estadao|poder360|metropoles|canaltech|gizmodo|macrumors|arstechnica|tecmundo|olhar\s+digital))\s*$/i;
  title = title.replace(suffixRegex, '');

  return title.trim();
}

/**
 * Tokenizes a string into clean alphanumeric words and key entities.
 */
export function tokenizeText(
  text: string,
  options: { removeStopwords?: boolean; minLength?: number } = { removeStopwords: true, minLength: 2 }
): string[] {
  if (!text) return [];
  const normalized = stripAccents(text);

  // Extract words and compound numbers/acronyms (e.g., "iphone-16", "gpt4", "r$100", "5g")
  const matches = normalized.match(/[a-z0-9]+(?:[\-_][a-z0-9]+)*/g) || [];
  const minLen = options.minLength ?? 2;
  const filterStop = options.removeStopwords ?? true;

  const result: string[] = [];
  for (const token of matches) {
    if (token.length < minLen) continue;
    if (filterStop && STOPWORDS.has(token)) continue;
    result.push(token);
  }

  return result;
}

/**
 * Extracts distinct action/event categories present in the headline.
 */
export function getActionCategories(tokens: string[]): Set<string> {
  const matchedGroups = new Set<string>();
  for (const token of tokens) {
    for (const [groupName, words] of Object.entries(ACTION_GROUPS)) {
      if (words.some((w) => token === w || (token.startsWith(w) && token.length <= w.length + 3))) {
        matchedGroups.add(groupName);
      }
    }
  }
  return matchedGroups;
}

/**
 * Extracts proper nouns, numbers, and distinctive entities.
 */
export function extractEntitiesAndNumbers(text: string): {
  numbers: Set<string>;
  entities: Set<string>;
} {
  const numbers = new Set<string>();
  const entities = new Set<string>();

  if (!text) return { numbers, entities };

  // Match numbers, versions, percentages, currency
  const numMatches = text.match(/\b(?:\d+(?:[\.,]\d+)*|us\$|\$|r\$|€|%)\b/gi) || [];
  numMatches.forEach((n) => numbers.add(n.toLowerCase().trim()));

  // Match capitalized words from original text (Proper Nouns)
  const capMatches = text.match(/\b[A-Z][a-zA-Z0-9\-_]{2,}\b/g) || [];
  capMatches.forEach((e) => {
    const clean = stripAccents(e);
    if (!STOPWORDS.has(clean)) {
      entities.add(clean);
    }
  });

  return { numbers, entities };
}

/**
 * Computes n-grams from tokens for phrase alignment.
 */
export function generateNgrams(tokens: string[], n: number = 2): Set<string> {
  const ngrams = new Set<string>();
  if (tokens.length < n) return ngrams;
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join('_'));
  }
  return ngrams;
}
