import express, { Request, Response } from 'express';
import path from 'path';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

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
            const resp = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html;q=0.9, */*;q=0.8',
              },
              signal: AbortSignal.timeout(4500),
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const text = await resp.text();
            const cleanXml = text.trim().replace(/^\uFEFF/, '');
            feed = await rssParser.parseString(cleanXml);
          } catch {
            feed = await rssParser.parseURL(url);
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

    const feed = await rssParser.parseURL(url);
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

// 3. Gemini Helper setup
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
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
    const { items, topic } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Itens de notícias inválidos' });
    }

    const ai = getGeminiClient();

    const headlinesText = items.slice(0, 10).map((it: any, idx: number) => 
      `${idx + 1}. [${it.sourceName}] "${it.title}" - ${it.contentSnippet}`
    ).join('\n');

    const prompt = `Você é um editor sênior de jornalismo executivo. 
Analise as manchetes abaixo do tópico "${topic || 'Geral'}" e gere um briefing em português (PT-BR) contendo:
1. Um resumo executivo direto de 2 a 3 frases destacando os pontos principais.
2. 3 a 5 tópicos em bullet points com as tendências ou acontecimentos mais relevantes.
3. Uma linha final com o "Veredito do Radar".

Manchetes:
${headlinesText}`;

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RSS Realtime News Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
