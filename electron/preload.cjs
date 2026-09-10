const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Windows Notifications & Taskbar
  showNotification: (options) => ipcRenderer.invoke('desktop:show-notification', options),
  flashFrame: (flag) => ipcRenderer.invoke('desktop:flash-frame', flag),

  // Auto-Start on Boot & Window Behavior
  getAutoStart: () => ipcRenderer.invoke('desktop:get-auto-start'),
  setAutoStart: (enabled) => ipcRenderer.invoke('desktop:set-auto-start', enabled),
  getMinimizeToTray: () => ipcRenderer.invoke('desktop:get-minimize-to-tray'),
  setMinimizeToTray: (enabled) => ipcRenderer.invoke('desktop:set-minimize-to-tray', enabled),

  // Updates & External Links
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
  openExternal: (url) => ipcRenderer.invoke('desktop:open-external', url),

  // Events from Main process (Tray, Shortcuts, Notifications)
  onNavigateToArticle: (callback) => {
    const handler = (_event, articleData) => callback(articleData);
    ipcRenderer.on('desktop:navigate-to-article', handler);
    return () => ipcRenderer.removeListener('desktop:navigate-to-article', handler);
  },
  onRefreshFeeds: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop:refresh-feeds', handler);
    return () => ipcRenderer.removeListener('desktop:refresh-feeds', handler);
  },
  onOpenSettings: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop:open-settings', handler);
    return () => ipcRenderer.removeListener('desktop:open-settings', handler);
  },
  onFocusSearch: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop:focus-search', handler);
    return () => ipcRenderer.removeListener('desktop:focus-search', handler);
  },
  onToggleBookmarks: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop:toggle-bookmarks', handler);
    return () => ipcRenderer.removeListener('desktop:toggle-bookmarks', handler);
  },
  onOpenCreateBlock: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop:open-create-block', handler);
    return () => ipcRenderer.removeListener('desktop:open-create-block', handler);
  },
  onToggleTheme: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop:toggle-theme', handler);
    return () => ipcRenderer.removeListener('desktop:toggle-theme', handler);
  },
});
