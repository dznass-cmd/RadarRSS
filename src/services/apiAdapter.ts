import { Capacitor } from '@capacitor/core';
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
    if (url && (type.includes('image') || /\.(jpg|jpeg|gif|png|webp|bmp|svg|avif)/i.test(url))) {
      return url.replace(/&amp;/g, '&').trim();
    }
  }

  // 2. Check media:content / media:thumbnail (Yahoo Media RSS)
  const mediaNodes = [
    ...Array.from(itemXml.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')),
    ...Array.from(itemXml.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')),
    ...Array.from(itemXml.querySelectorAll('media\\:content, media\\:thumbnail, content, thumbnail'))
  ];

  for (const node of mediaNodes) {
    const url = node.getAttribute('url');
    if (url && !url.includes('pixel') && !url.includes('1x1')) {
      return url.replace(/&amp;/g, '&').trim();
    }
  }

  // 3. Check <image><url>
  const imgUrlNode = itemXml.querySelector('image > url');
  if (imgUrlNode && imgUrlNode.textContent) {
    return imgUrlNode.textContent.replace(/&amp;/g, '&').trim();
  }

  // 4. Regex scan description / content:encoded / summary
  const fullHtml = (
    (itemXml.querySelector('description')?.textContent || '') + ' ' +
    (itemXml.querySelector('content\\:encoded')?.textContent || '') + ' ' +
    (itemXml.querySelector('summary')?.textContent || '') + ' ' +
    (itemXml.querySelector('content')?.textContent || '')
  );

  const imgRegex = /<img[^>]+(?:src|data-src|data-original|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif|avif)[^"']*)["']/i;
  const match = fullHtml.match(imgRegex);
  if (match && match[1]) {
    let src = match[1].replace(/&amp;/g, '&').trim();
    if (!src.includes('pixel') && !src.includes('tracker') && !src.includes('1x1')) {
      if (src.startsWith('//')) src = `https:${src}`;
      return src;
    }
  }

  // 5. Fallback regex for any <img> src
  const anyImgMatch = fullHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (anyImgMatch && anyImgMatch[1]) {
    let src = anyImgMatch[1].replace(/&amp;/g, '&').trim();
    if (!src.includes('pixel') && !src.includes('tracker') && !src.includes('1x1') && !src.startsWith('data:image')) {
      if (src.startsWith('//')) src = `https:${src}`;
      return src;
    }
  }

  return undefined;
}

// Client-side RSS Parser for native Android direct fetching
async function parseRssClientSide(url: string): Promise<NewsItem[]> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');

  const channelTitle = xml.querySelector('channel > title')?.textContent ||
                       xml.querySelector('feed > title')?.textContent ||
                       new URL(url).hostname;

  const items = Array.from(xml.querySelectorAll('item, entry'));

  return items.map((item, idx) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Sem título';
    const link = item.querySelector('link')?.textContent?.trim() ||
                 item.querySelector('link')?.getAttribute('href') ||
                 url;
    const rawSnippet = (item.querySelector('description')?.textContent ||
                        item.querySelector('summary')?.textContent ||
                        item.querySelector('content')?.textContent || '').replace(/<[^>]*>?/gm, '').trim();
    const cleanSnippet = rawSnippet.slice(0, 300) + (rawSnippet.length > 300 ? '...' : '');
    const pubDateStr = item.querySelector('pubDate')?.textContent ||
                       item.querySelector('published')?.textContent ||
                       item.querySelector('updated')?.textContent;
    const timestamp = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();
    const guid = item.querySelector('guid')?.textContent?.trim() || link;
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

// 3. AI Summarize Block
export async function summarizeBlockWithAi(items: NewsItem[], topic?: string): Promise<{ success: boolean; summary?: string; error?: string }> {
  const res = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, topic }),
  });
  return await res.json();
}

// 4. AI Curate Block
export async function curateBlockWithAi(userPrompt: string): Promise<{ success: boolean; blockConfig?: any; error?: string }> {
  const res = await fetch('/api/gemini/curate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt }),
  });
  return await res.json();
}

// 5. AI Translate Text
export async function translateWithAi(title: string, content: string): Promise<{ success: boolean; translation?: string; error?: string }> {
  const res = await fetch('/api/gemini/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  return await res.json();
}
