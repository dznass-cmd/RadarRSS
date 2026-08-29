import { NewsItem } from '../types';

const BOOKMARKS_KEY = 'radarrss_saved_articles_v1';

export function getSavedBookmarks(): NewsItem[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Erro ao carregar favoritos:', err);
    return [];
  }
}

export function isArticleBookmarked(id: string): boolean {
  const bookmarks = getSavedBookmarks();
  return bookmarks.some(item => item.id === id || item.link === id);
}

export function toggleArticleBookmark(item: NewsItem): boolean {
  try {
    const bookmarks = getSavedBookmarks();
    const existingIndex = bookmarks.findIndex(b => b.id === item.id || b.link === item.link);

    let isSaved = false;
    let updated: NewsItem[];

    if (existingIndex >= 0) {
      // Remove
      updated = bookmarks.filter((_, idx) => idx !== existingIndex);
      isSaved = false;
    } else {
      // Add to beginning
      const itemToSave = { ...item, isBookmarked: true };
      updated = [itemToSave, ...bookmarks];
      isSaved = true;
    }

    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('radarrss:bookmarks_updated', { detail: { bookmarks: updated, isSaved } }));
    return isSaved;
  } catch (err) {
    console.error('Erro ao alternar favorito:', err);
    return false;
  }
}

export function removeArticleBookmark(id: string): void {
  try {
    const bookmarks = getSavedBookmarks();
    const updated = bookmarks.filter(b => b.id !== id && b.link !== id);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('radarrss:bookmarks_updated', { detail: { bookmarks: updated } }));
  } catch (err) {
    console.error('Erro ao remover favorito:', err);
  }
}
