import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { NewsItem, RssFeed } from '../types';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Client-side image extractor from XML / HTML
function extractImageFromXmlItem(itemXml: Element, defaultBaseUrl?: string): string | undefined {
  // 1. Check enclosure (RSS 2.0)
  const enclosures = Array.from(itemXml.querySelectorAll('enclosure'));
  for (const enc of enclosures) {
    const url = enc.getAttribute('url');
    const type = enc.getAttribute('type') || '';
    if (url && (type.includes('image') || /\.(jpg|jpeg|gif|png|webp|bmp|svg|avif)/i.test(url) || !type)) {
      return url.replace(/&amp;/g, '&').trim();
    }
  }

  // 2. Check media:content / media:thumbnail / media:group (Yahoo Media RSS)
  const mediaNodes = [
    ...Array.from(itemXml.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')),
    ...Array.from(itemXml.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')),
    ...Array.from(itemXml.querySelectorAll('media\\:content, media\\:thumbnail, content, thumbnail, [medium="image"]'))
  ];

  for (const node of mediaNodes) {
    const url = node.getAttribute('url') || node.getAttribute('href') || node.textContent?.trim();
    if (url && !url.includes('pixel') && !url.includes('1x1') && !url.startsWith('data:image')) {
      return url.replace(/&amp;/g, '&').trim();
    }
  }

  // 3. Check <image><url> or <thumbnail>
  const imgUrlNode = itemXml.querySelector('image > url, thumbnail > url, image, thumbnail, thumb');
  if (imgUrlNode && imgUrlNode.textContent) {
    const url = imgUrlNode.textContent.replace(/&amp;/g, '&').trim();
    if (url.startsWith('http') || url.startsWith('//')) return url;
  }

  // 4. Regex scan description / content:encoded / summary / content with HTML entity decoding
  const rawHtml = (
    (itemXml.querySelector('description')?.textContent || '') + ' ' +
    (itemXml.querySelector('content\\:encoded')?.textContent || '') + ' ' +
    (itemXml.querySelector('summary')?.textContent || '') + ' ' +
    (itemXml.querySelector('content')?.textContent || '')
  );

  const decodedHtml = rawHtml
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const imgRegexes = [
    /<img[^>]+(?:data-src|data-original|data-lazy-src|data-hi-res-src)=["']([^"'\s>]+)["']/i,
    /<img[^>]+src=["']([^"'\s>]+)["']/i,
    /<img[^>]+srcset=["']([^"'\s,>]+)/i,
    /<source[^>]+srcset=["']([^"'\s,>]+)/i,
    /url\(["']?(https?:\/\/[^'"\)\s]+\.(?:jpg|jpeg|png|webp|avif|gif))["']?\)/i
  ];

  for (const rx of imgRegexes) {
    const match = decodedHtml.match(rx);
    if (match && match[1]) {
      let src = match[1].replace(/&amp;/g, '&').trim();
      if (!src.includes('pixel') && !src.includes('tracker') && !src.includes('1x1') && !src.startsWith('data:image')) {
        if (src.startsWith('//')) src = `https:${src}`;
        if (src.startsWith('/') && defaultBaseUrl) {
          try {
            src = new URL(src, defaultBaseUrl).toString();
          } catch {}
        }
        return src;
      }
    }
  }

  return undefined;
}

// Client-side RSS Parser for native Android direct fetching
async function parseRssClientSide(url: string): Promise<NewsItem[]> {
  let text = '';

  // 1. Tenta CapacitorHttp nativo primeiro no Android para bypass completo de CORS
  if (isNativePlatform()) {
    try {
      const res = await CapacitorHttp.get({
        url,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 RadarRSS/0.0.7',
        },
        connectTimeout: 10000,
        readTimeout: 15000,
      });
      if (typeof res.data === 'string') {
        text = res.data;
      } else if (res.data) {
        text = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
      }
    } catch (httpErr) {
      console.warn('[CapacitorHttp failed, trying fetch fallback]:', httpErr);
    }
  }

  // 2. Fallback para fetch com timeout estendido de 10s
  if (!text) {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    });
    text = await response.text();
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');

  const channelTitle = xml.querySelector('channel > title')?.textContent?.trim() ||
    xml.querySelector('feed > title')?.textContent?.trim() ||
    new URL(url).hostname;

  const items = Array.from(xml.querySelectorAll('item, entry'));

  return items.map((item, idx) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Sem título';
    
    // Suporte aprimorado a links em RSS 2.0 e Atom feeds
    const linkElem = item.querySelector('link[rel="alternate"]') ||
      item.querySelector('link:not([rel])') ||
      item.querySelector('link');
    const link = linkElem?.getAttribute('href')?.trim() ||
      linkElem?.textContent?.trim() ||
      url;

    const rawSnippet = (item.querySelector('description')?.textContent ||
      item.querySelector('summary')?.textContent ||
      item.querySelector('content')?.textContent || '').replace(/<[^>]*>?/gm, '').trim();
    const cleanSnippet = rawSnippet.slice(0, 300) + (rawSnippet.length > 300 ? '...' : '');

    const pubDateStr = item.querySelector('pubDate')?.textContent ||
      item.querySelector('published')?.textContent ||
      item.querySelector('updated')?.textContent ||
      item.querySelector('dc\\:date')?.textContent;
    const timestamp = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();
    
    // Suporte a identificador único (guid em RSS e id em Atom)
    const guid = item.querySelector('guid')?.textContent?.trim() ||
      item.querySelector('id')?.textContent?.trim() ||
      link;
    const imageUrl = extractImageFromXmlItem(item, url);

    // Simple sentiment analyzer
    const lower = `${title} ${cleanSnippet}`.toLowerCase();
    const pos = ['cresce', 'avanço', 'vitória', 'lucro', 'cura', 'alta', 'sucesso', 'inova', 'recorde'];
    const neg = ['queda', 'crise', 'morte', 'alerta', 'fraude', 'golpe', 'ameaça', 'guerra', 'prejuízo'];
    const pScore = pos.filter((w) => lower.includes(w)).length;
    const nScore = neg.filter((w) => lower.includes(w)).length;
    const sentiment = pScore > nScore ? 'positive' : nScore > pScore ? 'negative' : 'neutral';

    return {
      id: `${guid}-${idx}`,
      title,
      link,
      contentSnippet: cleanSnippet,
      pubDate: pubDateStr || new Date().toLocaleString('pt-BR'),
      timestamp: isNaN(timestamp) ? Date.now() : timestamp,
      sourceName: channelTitle,
      sourceId: url,
      sourceCategory: 'custom',
      imageUrl,
      sentiment,
      isBreaking: /urgente|bomba|breaking|alerta/i.test(title),
    };
  });
}

// 1. Fetch RSS Feeds
export async function fetchRssFeeds(urls: string[]): Promise<{ success: boolean; items: NewsItem[] }> {
  if (urls.length === 0) return { success: true, items: [] };

  // On Native Mobile, fetch and parse directly
  if (isNativePlatform()) {
    try {
      const results = await Promise.allSettled(urls.map((u) => parseRssClientSide(u)));
      const allItems: NewsItem[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled') {
          allItems.push(...res.value);
        }
      }
      // Sort newest first
      allItems.sort((a, b) => b.timestamp - a.timestamp);
      return { success: true, items: allItems };
    } catch (err: any) {
      console.error('[Native RSS Fetch Error]:', err);
      return { success: false, items: [] };
    }
  }

  // On Desktop / Web, use local Express server
  const res = await fetch(`/api/rss?urls=${encodeURIComponent(urls.join(','))}`);
  return await res.json();
}

// 2. Validate RSS Feed
export async function validateRssFeed(url: string): Promise<{ success: boolean; title?: string; error?: string }> {
  if (isNativePlatform()) {
    try {
      const items = await parseRssClientSide(url);
      return {
        success: true,
        title: items[0]?.sourceName || new URL(url).hostname,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const res = await fetch('/api/rss/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return await res.json();
}

function getGeminiApiKey(): string | null {
  try {
    const raw = localStorage.getItem('radar_rss_settings_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.geminiApiKey && typeof parsed.geminiApiKey === 'string' && parsed.geminiApiKey.trim()) {
        return parsed.geminiApiKey.trim();
      }
    }
  } catch {}
  return null;
}

async function geminiRequest(endpoint: string, method: 'GET' | 'POST', body?: any, apiKeyOverride?: string): Promise<any> {
  const apiKey = apiKeyOverride || getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada.');
  }

  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://generativelanguage.googleapis.com/v1beta/${endpoint}${separator}key=${encodeURIComponent(apiKey)}`;

  if (isNativePlatform()) {
    try {
      const res = await CapacitorHttp.request({
        url,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        data: body,
        connectTimeout: 15000,
        readTimeout: 20000,
      });

      let parsedData = res.data;
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch {}
      }

      if (res.status < 200 || res.status >= 300) {
        const errorMsg = parsedData?.error?.message || `Erro HTTP ${res.status} na API Gemini`;
        throw new Error(errorMsg);
      }

      return parsedData;
    } catch (nativeErr: any) {
      throw new Error(nativeErr.message || 'Falha na requisição nativa ao Gemini.');
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Erro HTTP ${response.status} na API Gemini`);
  }

  return data;
}

export async function validateGeminiApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { valid: false, message: 'Por favor, insira a chave da API.' };
  }

  try {
    const data = await geminiRequest('models', 'GET', undefined, cleanKey);
    if (data && Array.isArray(data.models)) {
      return {
        valid: true,
        message: 'Chave Gemini validada com sucesso! Resumos e traduções ativados.',
      };
    }
    return { valid: true, message: 'Chave Gemini conectada com sucesso!' };
  } catch (err: any) {
    const rawMsg = err.message || '';
    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('not valid')) {
      return { valid: false, message: 'Chave de API inválida. Verifique sua chave no Google AI Studio.' };
    }
    if (rawMsg.includes('QUOTA_EXCEEDED') || rawMsg.includes('exhausted')) {
      return { valid: false, message: 'Limite de cota gratuito da Google API excedido.' };
    }
    if (rawMsg.includes('PERMISSION_DENIED')) {
      return { valid: false, message: 'Permissão negada para esta chave no Google Cloud.' };
    }
    return { valid: false, message: rawMsg || 'Falha ao validar chave com o Google.' };
  }
}

async function generateContentWithGeminiDirect(prompt: string, apiKey: string): Promise<string> {
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const data = await geminiRequest(
        `models/${model}:generateContent`,
        'POST',
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        apiKey
      );

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('404')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Nenhuma resposta recebida do Gemini.');
}

// 3. AI Summarize Block
export async function summarizeBlockWithAi(items: NewsItem[], topic?: string): Promise<{ success: boolean; summary?: string; error?: string }> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const headlines = items.map(i => `- [${i.sourceName}] ${i.title}${i.contentSnippet ? ': ' + i.contentSnippet : ''}`).join('\n');
      const prompt = `Você é o analista editorial inteligente do Radar RSS. Sintetize as notícias abaixo em 3 a 4 tópicos analíticos e objetivos, destacando tendências e impactos. Use emojis nos tópicos.\nTópico: ${topic || 'Geral'}\nNotícias:\n${headlines}`;
      const summary = await generateContentWithGeminiDirect(prompt, apiKey);
      return { success: true, summary };
    } catch (err: any) {
      console.warn('[Gemini Direct Summary Error]:', err);
      return { success: false, error: err.message || 'Erro ao conectar à API Gemini.' };
    }
  }

  if (isNativePlatform()) {
    // Client-side smart digest fallback for mobile when no API key is provided
    const digest = [
      `📌 **Síntese Editorial (${items.length} manchetes):**`,
      ...items.slice(0, 4).map((i) => `• **${i.sourceName}**: ${i.title}`),
      `\n💡 *Insira sua chave gratuita da Google Gemini em Configurações para resumos analíticos avançados.*`,
    ].join('\n');
    return { success: true, summary: digest };
  }

  try {
    const res = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, topic }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao conectar com o servidor.' };
  }
}

// 4. AI Curate Block
export async function curateBlockWithAi(userPrompt: string): Promise<{ success: boolean; blockConfig?: any; error?: string }> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const prompt = `Analise a solicitação do usuário para criar um bloco dinâmico no Radar RSS: "${userPrompt}".\nRetorne APENAS um objeto JSON válido (sem tags markdown nem explicações) no formato: {"title": "string", "categoryFilter": "tech"|"brazil"|"world"|"finance"|"sports"|"entertainment"|"ai"|"all", "filterKeyword": "string ou undefined", "layout": "hero"|"grid"|"compact"|"list"|"media-wall"|"ticker", "itemCount": 6}`;
      const rawResponse = await generateContentWithGeminiDirect(prompt, apiKey);
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const blockConfig = JSON.parse(cleanJson);
      return { success: true, blockConfig };
    } catch (err: any) {
      console.warn('[Gemini Direct Curate Error]:', err);
      if (isNativePlatform()) {
        // Fallback to client heuristic
      }
    }
  }

  if (isNativePlatform()) {
    const lower = userPrompt.toLowerCase();
    let categoryFilter = 'all';
    if (/ia|inteligencia artificial|ai|machine learning|gpt|gemini|deep learning/i.test(lower)) categoryFilter = 'ai';
    else if (/tech|tecnologia|software|programação|apple|google|gadget/i.test(lower)) categoryFilter = 'tech';
    else if (/brasil|política|governo|stf|nacional/i.test(lower)) categoryFilter = 'brazil';
    else if (/mercado|economia|dolar|bolsa|ações|invest|cripto|bitcoin/i.test(lower)) categoryFilter = 'finance';
    else if (/esporte|futebol|f1|basquete|jogos/i.test(lower)) categoryFilter = 'sports';
    else if (/cinema|filme|música|cultura|série/i.test(lower)) categoryFilter = 'entertainment';

    return {
      success: true,
      blockConfig: {
        title: `🤖 ${userPrompt.slice(0, 28)}`,
        categoryFilter,
        filterKeyword: userPrompt,
        layout: 'grid',
        itemCount: 6,
      },
    };
  }

  try {
    const res = await fetch('/api/gemini/curate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao conectar com o servidor.' };
  }
}

// 5. AI Translate Text
export async function translateWithAi(title: string, content: string): Promise<{ success: boolean; translation?: string; error?: string }> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const prompt = `Traduza o seguinte título e artigo para o Português com clareza e fluidez jornalística:\n\nTítulo: ${title}\nConteúdo: ${content}`;
      const translation = await generateContentWithGeminiDirect(prompt, apiKey);
      return { success: true, translation };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao traduzir com a API Gemini.' };
    }
  }

  if (isNativePlatform()) {
    return {
      success: false,
      error: 'Insira sua chave gratuita da Google Gemini em Configurações para traduzir no Android.',
    };
  }

  try {
    const res = await fetch('/api/gemini/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao conectar com o servidor.' };
  }
}
