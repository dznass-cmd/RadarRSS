import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface ShareData {
  title: string;
  text?: string;
  url: string;
  dialogTitle?: string;
}

export async function shareArticle(data: ShareData): Promise<{ success: boolean; method: 'native' | 'web-share' | 'clipboard' }> {
  try {
    // 1. Native Capacitor (Android)
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (_) {}

      await Share.share({
        title: data.title,
        text: data.text || data.title,
        url: data.url,
        dialogTitle: data.dialogTitle || 'Compartilhar notícia via Radar RSS',
      });
      return { success: true, method: 'native' };
    }

    // 2. Web Share API (Desktop/Mobile Browsers)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ url: data.url })) {
      await navigator.share({
        title: data.title,
        text: data.text || data.title,
        url: data.url,
      });
      return { success: true, method: 'web-share' };
    }

    // 3. Fallback: Copy to Clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${data.title}\n${data.url}`);
      return { success: true, method: 'clipboard' };
    }

    return { success: false, method: 'clipboard' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User simply canceled the share dialog
      return { success: true, method: 'native' };
    }
    console.warn('Erro ao compartilhar:', err);
    return { success: false, method: 'clipboard' };
  }
}
