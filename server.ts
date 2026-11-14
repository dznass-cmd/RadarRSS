import express, { Request, Response } from 'express';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Agent } from 'undici';
import path from 'path';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import DOMPurify from 'dompurify';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST || (process.env.K_SERVICE ? '0.0.0.0' : '127.0.0.1');
const MAX_REMOTE_BYTES = 5 * 1024 * 1024;
const MAX_FEEDS_PER_REQUEST = 30;
if (process.env.K_SERVICE) app.set('trust proxy', 1);
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'tauri://localhost',
]);
if (process.env.APP_URL) {
  try { allowedOrigins.add(new URL(process.env.APP_URL).origin); } catch {}
}
const secureDispatcher = new Agent({
  connect: {
    lookup: (hostname: string, options: any, callback: (...args: any[]) => void) => {
      lookup(hostname, { all: true, verbatim: true }).then((addresses) => {
        if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
          callback(new Error('A URL precisa apontar para um endereço público'));
          return;
        }
        if (options?.all) callback(null, addresses);
        else callback(null, addresses[0].address, addresses[0].family);
      }).catch(callback);
    },
  },
});

app.use(express.json({ limit: '1mb' }));

function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const octets = address.split('.').map(Number);
    const [a, b, c] = octets;
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168) ) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) || a >= 240);
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase().split('%')[0];
    // Only globally routable unicast space is allowed. This rejects loopback,
    // link-local, unique-local, multicast, IPv4-mapped and documentation ranges.
    return normalized.startsWith('2') && !normalized.startsWith('2001:db8:');
  }
  return false;
}

async function assertPublicHttpUrl(value: string): Promise<URL> {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('URL inválida'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('A URL deve usar HTTP(S) e não pode conter credenciais');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('Endereços locais não são permitidos');
  }
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error('A URL precisa apontar para um endereço público');
  }
  return url;
}

async function fetchPublicUrl(value: string, headers: Record<string, string>, timeoutMs: number): Promise<globalThis.Response> {
  let currentUrl = value;
  for (let redirects = 0; redirects <= 5; redirects++) {
    const url = await assertPublicHttpUrl(currentUrl);
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'manual',
      dispatcher: secureDispatcher,
    } as any);
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    if (!location) return response;
    await response.body?.cancel();
    currentUrl = new URL(location, url).toString();
  }
  throw new Error('A URL excedeu o limite de redirecionamentos');
}

async function readLimitedText(response: globalThis.Response, maxBytes = MAX_REMOTE_BYTES): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new Error('Resposta remota excede o limite de tamanho');
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('Resposta remota excede o limite de tamanho');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

// Cross-origin access is only needed by local dev and the Tauri webview.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const requestOrigin = `${req.protocol}://${req.get('host')}`;
  const isAllowedOrigin = !origin || allowedOrigins.has(origin) || origin === requestOrigin;
  if (!isAllowedOrigin) return res.sendStatus(403);
  if (origin && origin !== requestOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(origin && !allowedOrigins.has(origin) ? 403 : 204);
  }
  next();
});

function createRateLimiter(maxRequests: number, windowMs: number) {
  const clients = new Map<string, { startedAt: number; count: number }>();
  return (req: Request, res: Response, next: () => void) => {
    const now = Date.now();
    const clientId = req.ip || req.socket.remoteAddress || 'unknown';
    let window = clients.get(clientId);
    if (!window || now - window.startedAt >= windowMs) {
      if (clients.size >= 10_000) {
        for (const [ip, entry] of clients) {
          if (now - entry.startedAt >= windowMs) clients.delete(ip);
        }
        if (clients.size >= 10_000) {
          return res.status(503).json({ success: false, error: 'Servidor ocupado. Tente novamente em instantes.' });
        }
      }
      window = { startedAt: now, count: 0 };
      clients.set(clientId, window);
    }
    if (window.count >= maxRequests) {
      res.set('Retry-After', String(Math.ceil((window.startedAt + windowMs - now) / 1000)));
      return res.status(429).json({ success: false, error: 'Muitas solicitações. Tente novamente em instantes.' });
    }
    window.count++;
    next();
  };
}

app.use('/api', createRateLimiter(120, 60_000));
app.use('/api/gemini', createRateLimiter(20, 60_000));

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['media:group', 'mediaGroup'],
      ['enclosure', 'enclosure', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
      ['image', 'image'],
      ['thumbnail', 'thumbnail'],
      ['thumb', 'thumb'],
      ['og:image', 'ogImage'],
      ['twitter:image', 'twitterImage'],
    ],
  },
  timeout: 4500,
});

// Cache map with 60 seconds TTL
interface CacheEntry {
  timestamp: number;
  data: any[];
}
const feedCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

// Cache map for extracted full articles (2 hours TTL)
interface ArticleCacheEntry {
  timestamp: number;
  data: any;
}
const articleExtractCache = new Map<string, ArticleCacheEntry>();
const ARTICLE_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

// Utility to decode HTML entities
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Utility to extract image URL from item
function extractImageUrl(item: any, baseUrl?: string): string | undefined {
  let src: string | undefined = undefined;

  // 1. Check enclosure (object or array)
  if (item.enclosure) {
    const arr = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
    for (const enc of arr) {
      const url = enc.url || enc.$?.url || enc.href;
      const type = enc.type || enc.$?.type || '';
      if (url && (type.includes('image') || /\.(jpg|jpeg|gif|png|webp|bmp|svg|avif)/i.test(url) || !type)) {
        src = url;
        break;
      }
    }
  }

  // 2. Check mediaContent
  if (!src && item.mediaContent && item.mediaContent.length > 0) {
    const img = item.mediaContent.find((m: any) => m.$?.url || m.url || m.href);
    if (img) src = img.$?.url || img.url || img.href;
  }

  // 3. Check mediaThumbnail
  if (!src && item.mediaThumbnail && item.mediaThumbnail.length > 0) {
    const img = item.mediaThumbnail.find((m: any) => m.$?.url || m.url || m.href);
    if (img) src = img.$?.url || img.url || img.href;
  }

  // 4. Check mediaGroup
  if (!src && item.mediaGroup) {
    const group = item.mediaGroup;
    const content = group['media:content'] || group.mediaContent;
    if (content) {
      const arr = Array.isArray(content) ? content : [content];
      const img = arr.find((m: any) => m.$?.url || m.url || m.href);
      if (img) src = img.$?.url || img.url || img.href;
    }
    
    if (!src) {
      const thumbnail = group['media:thumbnail'] || group.mediaThumbnail;
      if (thumbnail) {
        const arr = Array.isArray(thumbnail) ? thumbnail : [thumbnail];
        const img = arr.find((m: any) => m.$?.url || m.url || m.href);
        if (img) src = img.$?.url || img.url || img.href;
      }
    }
  }

  // 5. Check item.image, thumbnail, thumb, ogImage, twitterImage
  if (!src && item.image) {
    if (typeof item.image === 'string') src = item.image;
    else if (typeof item.image === 'object') src = item.image.url || item.image.$?.url || item.image.href;
  }
  if (!src && item.thumbnail) {
    if (typeof item.thumbnail === 'string') src = item.thumbnail;
    else if (typeof item.thumbnail === 'object') src = item.thumbnail.url || item.thumbnail.$?.url || item.thumbnail.href;
  }
  if (!src && item.thumb) {
    if (typeof item.thumb === 'string') src = item.thumb;
    else if (typeof item.thumb === 'object') src = item.thumb.url || item.thumb.$?.url;
  }
  if (!src && (item.ogImage || item.twitterImage)) {
    src = item.ogImage || item.twitterImage;
  }

  // 6. Regex scan description / content / contentEncoded / summary with decoded HTML
  if (!src) {
    const rawHtml = `${item.contentEncoded || ''} ${item.content || ''} ${item.description || ''} ${item.summary || ''}`;
    const decoded = decodeHtmlEntities(rawHtml);

    // Look for data-src, data-original, data-lazy-src, src attributes
    const imgRegexes = [
      /<img[^>]+(?:data-src|data-original|data-lazy-src|data-hi-res-src)=["']([^"'\s>]+)["']/i,
      /<img[^>]+src=["']([^"'\s>]+)["']/i,
      /<img[^>]+srcset=["']([^"'\s,>]+)/i,
      /<source[^>]+srcset=["']([^"'\s,>]+)/i,
      /url\(["']?(https?:\/\/[^'"\)\s]+\.(?:jpg|jpeg|png|webp|avif|gif))["']?\)/i
    ];

    for (const rx of imgRegexes) {
      const match = decoded.match(rx);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (!candidate.startsWith('data:image') && !candidate.includes('1x1') && !candidate.includes('pixel') && !candidate.includes('tracker')) {
          src = candidate;
          break;
        }
      }
    }
  }

  if (!src) return undefined;

  src = decodeHtmlEntities(src).trim();

  // Filter out tracking pixels / web beacons
  if (src.includes('pixel') || src.includes('tracker') || src.includes('1x1') || src.includes('statcounter') || src.includes('doubleclick')) {
    return undefined;
  }

  // Handle protocol-relative URL
  if (src.startsWith('//')) {
    src = `https:${src}`;
  }

  // Handle relative URL
  if (src.startsWith('/') && baseUrl) {
    try {
      src = new URL(src, baseUrl).toString();
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  return src;
}

// Simple heuristic sentiment analyzer
function calculateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const posWords = ['sucesso', 'cresce', 'lucro', 'recorde', 'avanço', 'alta', 'inovação', 'vitória', 'ganho', 'lançado', 'revolução', 'supera', 'bom'];
  const negWords = ['queda', 'crise', 'alerta', 'morte', 'risco', 'prejuízo', 'falha', 'ataque', 'crime', 'violência', 'guerra', 'ameaça', 'multa', 'processo'];

  let posCount = 0;
  let negCount = 0;
  posWords.forEach(w => { if (lower.includes(w)) posCount++; });
  negWords.forEach(w => { if (lower.includes(w)) negCount++; });

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

// 1. Fetch & parse RSS Feeds endpoint
app.get('/api/rss', async (req: Request, res: Response) => {
  try {
    const urlsParam = req.query.urls as string;
    if (!urlsParam) {
      return res.json({ success: true, items: [] });
    }

    const urls = urlsParam.split(',').map(u => u.trim()).filter(Boolean);
    if (urls.length > MAX_FEEDS_PER_REQUEST) {
      return res.status(400).json({ success: false, error: `Limite de ${MAX_FEEDS_PER_REQUEST} feeds por solicitação` });
    }
    const allItems: any[] = [];

    await Promise.allSettled(
      urls.map(async (url) => {
        const cached = feedCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          allItems.push(...cached.data);
          return;
        }

        try {
          let feed: any;
          try {
            const resp = await fetchPublicUrl(url, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html;q=0.9, */*;q=0.8',
              }, 4500);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const text = await readLimitedText(resp);
            const cleanXml = text.trim().replace(/^\uFEFF/, '');
            feed = await rssParser.parseString(cleanXml);
          } catch {
            throw new Error('Não foi possível carregar um feed de endereço público');
          }

          const sourceTitle = feed.title || new URL(url).hostname.replace('www.', '');

          const parsedItems = (feed.items || []).map((item: any, idx: number) => {
            const rawSnippet = (item.contentSnippet || item.summary || item.content || '').replace(/<[^>]*>?/gm, '').trim();
            const cleanSnippet = rawSnippet.slice(0, 300) + (rawSnippet.length > 300 ? '...' : '');
            const imageUrl = extractImageUrl(item, feed.link || url);
            const pubTime = item.isoDate ? new Date(item.isoDate).getTime() : (item.pubDate ? new Date(item.pubDate).getTime() : Date.now());

            const baseGuid = (typeof item.guid === 'string' && item.guid.trim()) ? item.guid.trim() : (item.link || url);
            const itemId = `${baseGuid}#${idx}-${pubTime}`;

            return {
              id: itemId,
              title: (item.title || 'Sem título').trim(),
              link: item.link || url,
              contentSnippet: cleanSnippet,
              contentHtml: item.contentEncoded || item.content || item.description || '',
              pubDate: item.pubDate || new Date(pubTime).toLocaleString('pt-BR'),
              timestamp: isNaN(pubTime) ? Date.now() : pubTime,
              sourceId: url,
              sourceName: sourceTitle,
              sourceCategory: 'general',
              author: item.creator || item.author || sourceTitle,
              imageUrl,
              sentiment: calculateSentiment((item.title || '') + ' ' + cleanSnippet),
            };
          });

          feedCache.set(url, { timestamp: Date.now(), data: parsedItems });
          allItems.push(...parsedItems);
        } catch (err: any) {
          console.warn(`[RSS Parser] Error fetching ${url}:`, err?.message);
        }
      })
    );

    // Sort combined items by newest first
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ success: true, items: allItems });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Validate Custom Feed URL
app.post('/api/rss/validate', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL é obrigatória' });

    const safeUrl = await assertPublicHttpUrl(url);
    const response = await fetchPublicUrl(safeUrl.toString(), {
      'User-Agent': 'RadarRSS/0.2.0',
      'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
    }, 4500);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = await rssParser.parseString((await readLimitedText(response)).trim().replace(/^\uFEFF/, ''));
    res.json({
      success: true,
      title: feed.title || new URL(url).hostname,
      description: feed.description || '',
      itemCount: feed.items ? feed.items.length : 0,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: `Não foi possível carregar o feed RSS: ${err.message}` });
  }
});

// 2.5. Extract Full Clean Article (Reader Mode)
app.get('/api/article/extract', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'URL válida é obrigatória' });
    }
    await assertPublicHttpUrl(targetUrl);

    // 1. Check cache
    const cached = articleExtractCache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < ARTICLE_CACHE_TTL_MS) {
      return res.json({ success: true, article: cached.data });
    }

    // 2. Fetch page HTML
    const response = await fetchPublicUrl(targetUrl, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }, 10000);

    if (!response.ok) {
      return res.status(422).json({
        success: false,
        error: `Servidor remoto respondeu com status ${response.status}`,
      });
    }

    const html = await readLimitedText(response);
    if (!html || html.length < 100) {
      return res.status(422).json({
        success: false,
        error: 'Página HTML vazia ou muito curta para extração',
      });
    }

    // 3. Parse HTML DOM
    const { document, window } = parseHTML(html);

    // Lead image extraction from metadata if available
    let leadImageUrl: string | undefined;
    const ogImg = document.querySelector('meta[property="og:image"], meta[name="twitter:image"], meta[name="image"]');
    if (ogImg) {
      const src = ogImg.getAttribute('content');
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        leadImageUrl = src.startsWith('//') ? `https:${src}` : src;
      }
    }

    // 4. Run Readability
    const reader = new Readability(document as any, {
      charThreshold: 80,
    });
    const parsed = reader.parse();

    if (!parsed || !parsed.textContent || parsed.textContent.trim().length < 80) {
      return res.status(422).json({
        success: false,
        error: 'Não foi possível isolar o corpo do artigo na página selecionada',
      });
    }

    // 5. Sanitize HTML and fix relative URLs
    const purify = DOMPurify(window);
    const sanitizedHtml = purify.sanitize(parsed.content, {
      ALLOWED_TAGS: [
        'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i',
        'u', 'a', 'img', 'figure', 'figcaption', 'code', 'pre', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'time'
      ],
      ALLOWED_ATTR: ['src', 'href', 'alt', 'title', 'target', 'rel', 'class', 'id', 'loading', 'datetime'],
    });

    // Make relative src and href absolute
    const { document: cleanDoc } = parseHTML(`<div>${sanitizedHtml}</div>`);
    const imgs = cleanDoc.querySelectorAll('img');
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
        try {
          img.setAttribute('src', new URL(src, targetUrl).toString());
        } catch {}
      }
      img.setAttribute('loading', 'lazy');
    }

    const anchors = cleanDoc.querySelectorAll('a');
    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
        try {
          a.setAttribute('href', new URL(href, targetUrl).toString());
        } catch {}
      }
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }

    const finalHtml = cleanDoc.querySelector('div')?.innerHTML || sanitizedHtml;

    // Word count & reading time
    const textContent = parsed.textContent.trim();
    const wordCount = textContent ? textContent.split(/\s+/).length : 0;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const extractedArticle = {
      title: parsed.title || document.querySelector('title')?.textContent || 'Artigo',
      byline: parsed.byline || undefined,
      siteName: parsed.siteName || new URL(targetUrl).hostname.replace('www.', ''),
      excerpt: parsed.excerpt || textContent.slice(0, 200) + '...',
      contentHtml: finalHtml,
      textContent,
      length: textContent.length,
      wordCount,
      readingTimeMinutes,
      leadImageUrl: leadImageUrl || undefined,
      url: targetUrl,
      extractedAt: Date.now(),
    };

    articleExtractCache.set(targetUrl, { timestamp: Date.now(), data: extractedArticle });
    res.json({ success: true, article: extractedArticle });
  } catch (err: any) {
    console.warn('[Article Extractor Error]:', err?.message);
    res.status(500).json({ success: false, error: err?.message || 'Erro ao extrair artigo' });
  }
});

// 3. Gemini Helper setup
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY não configurada no servidor. Configure sua chave no arquivo .env ou nas Configurações.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 4. AI Block Summarizer Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const { items, topic, isMultiSourceStory } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Itens de notícias inválidos' });
    }

    const ai = getGeminiClient();

    let prompt: string;

    if (isMultiSourceStory && items.length > 1) {
      const sourcesText = items.slice(0, 10).map((it: any, idx: number) => 
        `Fonte ${idx + 1}: [${it.sourceName}] "${it.title}"\nTrecho da cobertura: ${it.contentSnippet || ''}`
      ).join('\n\n');

      prompt = `Você é um editor sênior de jornalismo investigativo e executivo.
As ${items.length} fontes abaixo cobrem o MESMO ACONTECIMENTO ("${topic || 'História Consolidada'}"):

${sourcesText}

Gere um resumo jornalístico consolidado em português (PT-BR) contendo:
1. **Resumo Consolidado**: Síntese direta e objetiva dos fatos centrais confirmados pelas fontes (2 a 3 frases).
2. **Fatos Compartilhados**: Pontos comuns acordados pelas diferentes coberturas.
3. **Nuances e Detalhes Específicos**: Destaques, dados ou declarações adicionais trazidos por fontes específicas (mencione os veículos correspondentes).
4. **Veredito do Radar**: Avaliação neutra e conclusiva do impacto do acontecimento.

IMPORTANTE: Limite-se aos fatos citados pelas fontes acima. Não invente informações.`;
    } else {
      const headlinesText = items.slice(0, 10).map((it: any, idx: number) => 
        `${idx + 1}. [${it.sourceName}] "${it.title}" - ${it.contentSnippet}`
      ).join('\n');

      prompt = `Você é um editor sênior de jornalismo executivo. 
Analise as manchetes abaixo do tópico "${topic || 'Geral'}" e gere um briefing em português (PT-BR) contendo:
1. Um resumo executivo direto de 2 a 3 frases destacando os pontos principais.
2. 3 a 5 tópicos em bullet points com as tendências ou acontecimentos mais relevantes.
3. Uma linha final com o "Veredito do Radar".

Manchetes:
${headlinesText}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    res.json({ success: true, summary: response.text });
  } catch (err: any) {
    console.error('[Gemini Summarize Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao gerar resumo da IA' });
  }
});

// 5. AI Smart Block Curator Endpoint
app.post('/api/gemini/curate', async (req: Request, res: Response) => {
  try {
    const { userPrompt } = req.body;
    if (!userPrompt) return res.status(400).json({ success: false, error: 'Prompt é obrigatório' });

    const ai = getGeminiClient();

    const prompt = `Crie uma configuração de Bloco Dinâmico de Notícias baseado no desejo do usuário: "${userPrompt}".
Responda APENAS em formato JSON válido com este esquema:
{
  "title": "Título criativo e com emoji para o bloco",
  "filterKeyword": "palavras-chave separadas por barra vertical | para filtrar",
  "categoryFilter": "tech" | "brazil" | "world" | "finance" | "sports" | "entertainment" | "ai" | "all",
  "layout": "hero" | "grid" | "compact" | "list" | "media-wall" | "ticker",
  "itemCount": 5,
  "explanation": "Breve motivo do porquê esse bloco foi estruturado assim"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, blockConfig: parsed });
  } catch (err: any) {
    console.error('[Gemini Curate Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao curar bloco com IA' });
  }
});

// 6. AI Translation Endpoint
app.post('/api/gemini/translate', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Traduz o título e conteúdo a seguir de forma fluida para o português do Brasil:\nTítulo: ${title}\nConteúdo: ${content}`,
    });

    res.json({ success: true, translation: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite Development or Production Server configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Lazy-loaded so the production bundle never needs vite at runtime.
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Resolve static assets across dev, standard electron, and portable electron
    const candidatePaths = [
      process.env.DIST_PATH,
      __dirname,
      path.join(process.cwd(), 'dist'),
      path.join(__dirname, '..', 'dist'),
    ].filter(Boolean) as string[];

    const distPath = candidatePaths.find((p) => {
      try {
        return require('fs').existsSync(path.join(p, 'index.html'));
      } catch {
        return false;
      }
    }) || candidatePaths[0] || path.join(process.cwd(), 'dist');

    console.log(`[RSS Realtime News Server] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[RSS Realtime News Server] Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
