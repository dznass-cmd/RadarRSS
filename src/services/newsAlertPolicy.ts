import { NewsItem } from '../types';

export function newsAlertKey(item: NewsItem): string {
  try {
    const url = new URL(item.link);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString();
  } catch { return item.title.trim().toLowerCase(); }
}

export function selectNewsAlert(items: NewsItem[], seen: Set<string>, initial: boolean,
  lastAlertAt: number, now: number, isBreaking: (item: NewsItem) => boolean): NewsItem | undefined {
  let selected: NewsItem | undefined;
  for (const item of [...items].sort((a, b) => b.timestamp - a.timestamp)) {
    const key = newsAlertKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!initial && !selected && isBreaking(item) && item.timestamp <= now &&
      now - item.timestamp < 30 * 60_000 && now - lastAlertAt >= 60_000) selected = item;
  }
  return selected;
}
