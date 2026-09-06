import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { NewsItem } from '../types';

export const NOTIFICATION_CHANNEL_ID = 'radar_rss_news';

function stringToId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 2147483647) || Math.floor(Math.random() * 1000000);
}

let channelInitialized = false;

export async function initializeNotificationChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (channelInitialized) return;
  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Radar RSS - Notícias e Alertas',
      description: 'Notificações de notícias urgentes e novidades do Radar RSS',
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#f97316',
    });
    channelInitialized = true;
  } catch (e) {
    console.warn('[NotificationService] Channel creation warning:', e);
  }
}

export function isNotificationSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function';
}

export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function') {
    const perm = Notification.permission;
    if (perm === 'granted') return 'granted';
    if (perm === 'denied') return 'denied';
    return 'prompt';
  }
  return 'unsupported';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initializeNotificationChannels();
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('[NotificationService] Request permission error:', err);
      return false;
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function') {
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch (err) {
      console.warn('[NotificationService] Web notification permission error:', err);
      return false;
    }
  }
  return false;
}

export interface SendNotificationOptions {
  title: string;
  body: string;
  id?: string;
  imageUrl?: string;
  article?: NewsItem;
  onClick?: () => void;
}

export async function sendNativeNotification(options: SendNotificationOptions): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      let perm = await checkNotificationPermission();
      if (perm !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return false;
      }
      await initializeNotificationChannels();

      const notifId = stringToId(options.id || `${options.title}-${Date.now()}`);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: options.title,
            body: options.body,
            largeBody: options.body,
            summaryText: 'Radar RSS',
            channelId: NOTIFICATION_CHANNEL_ID,
            autoCancel: true,
            isExactNotification: false,
            extra: options.article ? { article: options.article } : undefined,
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('[NotificationService] LocalNotification error:', err);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function') {
    try {
      if (Notification.permission === 'granted') {
        const notif = new Notification(options.title, {
          body: options.body,
          icon: options.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&q=80',
          tag: options.id,
        });
        if (options.onClick) {
          notif.onclick = () => {
            window.focus();
            options.onClick?.();
            notif.close();
          };
        }
        return true;
      }
    } catch (err) {
      console.warn('[NotificationService] Web notification dispatch error:', err);
    }
  }

  return false;
}

export function addNotificationActionListener(callback: (article: NewsItem) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  let listenerPromise: Promise<PluginListenerHandle> | null = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action: ActionPerformed) => {
      const extra = action.notification.extra;
      if (extra && extra.article) {
        callback(extra.article as NewsItem);
      }
    }
  );

  return () => {
    if (listenerPromise) {
      listenerPromise.then(handle => handle.remove()).catch(() => {});
    }
  };
}
