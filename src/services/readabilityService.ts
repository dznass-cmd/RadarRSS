import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { getApiBaseUrl } from './apiAdapter';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { ExtractedArticle } from '../types';

const clientCache = new Map<string, ExtractedArticle>();

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Resolves relative URLs (e.g. /images/pic.jpg) into absolute URLs
 * based on the article's destination webpage URL.
 */
function fixRelativeUrls(container: Element, baseUrl: string): void {
  const images = Array.from(container.querySelectorAll('img'));
  for (const img of images) {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        img.setAttribute('src', new URL(src, baseUrl).toString());
      } catch {}
    }
    img.setAttribute('loading', 'lazy');
  }

  const links = Array.from(container.querySelectorAll('a'));
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
      try {
        link.setAttribute('href', new URL(href, baseUrl).toString());
      } catch {}
    }
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }
}

/**
 * Client-side fallback extractor for Capacitor Native or offline environments
 */
async function extractClientSide(url: string): Promise<ExtractedArticle> {
  let html = '';

  if (isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 RadarRSS/0.2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      connectTimeout: 10000,
      readTimeout: 15000,
    });
    if (typeof res.data === 'string') {
      html = res.data;
    } else if (res.data) {
      html = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
    }
  } else {
    const resp = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    html = await resp.text();
  }

  if (!html || html.length < 100) {
    throw new Error('Conteúdo HTML retornado é insuficiente para extração');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract lead image from OpenGraph / meta
  let leadImageUrl: string | undefined;
  const ogImg = doc.querySelector('meta[property="og:image"], meta[name="twitter:image"], meta[name="image"]');
  if (ogImg) {
    const src = ogImg.getAttribute('content');
    if (src && (src.startsWith('http') || src.startsWith('//'))) {
      leadImageUrl = src.startsWith('//') ? `https:${src}` : src;
    }
  }

  const reader = new Readability(doc, {
    charThreshold: 80,
  });
  const parsed = reader.parse();

  if (!parsed || !parsed.textContent || parsed.textContent.trim().length < 80) {
    throw new Error('Não foi possível identificar o corpo do artigo na página');
  }

  // Sanitize via DOMPurify
  const sanitized = DOMPurify.sanitize(parsed.content, {
    ALLOWED_TAGS: [
      'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i',
      'u', 'a', 'img', 'figure', 'figcaption', 'code', 'pre', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'time'
    ],
    ALLOWED_ATTR: ['src', 'href', 'alt', 'title', 'target', 'rel', 'class', 'id', 'loading', 'datetime'],
  });

  const wrapper = document.createElement('div');
  wrapper.innerHTML = sanitized;
  fixRelativeUrls(wrapper, url);

  const textContent = parsed.textContent.trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    title: parsed.title || doc.title || 'Artigo',
    byline: parsed.byline || undefined,
    siteName: parsed.siteName || new URL(url).hostname.replace('www.', ''),
    excerpt: parsed.excerpt || textContent.slice(0, 200) + '...',
    contentHtml: wrapper.innerHTML,
    textContent,
    length: textContent.length,
    wordCount,
    readingTimeMinutes,
    leadImageUrl,
    url,
    extractedAt: Date.now(),
  };
}

/**
 * Fetches and extracts the full readable article from the given URL.
 * Automatically leverages server-side proxy extraction with client-side fallback.
 */
export async function fetchFullArticle(url: string): Promise<ExtractedArticle> {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('URL inválida para extração de artigo');
  }

  // 1. Fast in-memory cache check
  const cached = clientCache.get(url);
  if (cached && Date.now() - cached.extractedAt < 2 * 60 * 60 * 1000) {
    return cached;
  }

  // 2. Try server-side extraction endpoint first
  try {
    const apiBase = getApiBaseUrl();
    const endpoint = `${apiBase}/api/article/extract?url=${encodeURIComponent(url)}`;
    const resp = await fetch(endpoint, {
      signal: AbortSignal.timeout(12000),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.article) {
        clientCache.set(url, data.article);
        return data.article;
      }
    }
  } catch (serverErr) {
    console.warn('[ReadabilityService] Server extract failed, trying client fallback:', serverErr);
  }

  // 3. Client-side extraction fallback
  const clientArticle = await extractClientSide(url);
  clientCache.set(url, clientArticle);
  return clientArticle;
}

export function getCachedArticle(url: string): ExtractedArticle | undefined {
  return clientCache.get(url);
}

export function clearArticleCache(): void {
  clientCache.clear();
}
