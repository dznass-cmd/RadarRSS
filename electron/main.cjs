// Electron main process for the "Radar RSS" desktop app.
// Starts the bundled Express server (dist/server.cjs) on a free local port
// and opens the app in a native window with full Windows integration.
const { app, BrowserWindow, shell, dialog, Menu, Tray, ipcMain, Notification, screen, clipboard, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const net = require('net');
const dotenv = require('dotenv');

// Set Application User Model ID and Name for Windows notifications and taskbar
app.setName('Radar RSS');
app.setAppUserModelId('com.dznasscmd.radarrss');

function getAppIconPaths() {
  const appPath = app.getAppPath();
  const searchDirs = [
    path.join(appPath, 'build'),
    path.join(__dirname, '..', 'build'),
    path.join(path.dirname(process.execPath), 'resources', 'app', 'build'),
    path.join(process.resourcesPath || '', 'build'),
  ];

  let icoPath = null;
  let pngPath = null;

  for (const dir of searchDirs) {
    const ico = path.join(dir, 'icon.ico');
    const png = path.join(dir, 'icon.png');
    if (!icoPath && fs.existsSync(ico)) icoPath = ico;
    if (!pngPath && fs.existsSync(png)) pngPath = png;
  }

  return {
    icoPath,
    pngPath,
    primaryIcon: icoPath || pngPath,
  };
}

function registerWindowsShortcut(icoPath) {
  if (process.platform !== 'win32') return;
  try {
    const programsDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const shortcutPath = path.join(programsDir, 'Radar RSS.lnk');
    shell.writeShortcutLink(shortcutPath, 'create', {
      target: process.execPath,
      args: '',
      description: 'Radar RSS - Leitor de Notícias Inteligente',
      icon: icoPath || process.execPath,
      iconIndex: 0,
      appUserModelId: 'com.dznasscmd.radarrss',
    });
    debugLog('Created/verified Start Menu shortcut with AppUserModelId at:', shortcutPath);
  } catch (err) {
    debugLog('Notice: Could not write Start Menu shortcut:', err?.message || err);
  }
}

// Allow users to set GEMINI_API_KEY via a .env file next to the .exe
const exeDir = path.dirname(process.execPath);
dotenv.config({ path: path.join(exeDir, '.env') });
dotenv.config({ path: path.join(app.getAppPath(), '.env') });

process.env.NODE_ENV = 'production';

function debugLog(...args) {
  try {
    const msg = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}\n`;
    try {
      const userData = app.getPath('userData');
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      fs.appendFileSync(path.join(userData, 'radar-debug.log'), msg);
    } catch (_) {}
    try {
      fs.appendFileSync(path.join(app.getAppPath(), 'radar-debug.log'), msg);
    } catch (_) {}
  } catch (_) {}
}

process.on('uncaughtException', (err) => {
  debugLog('uncaughtException:', err?.stack || err);
});
process.on('unhandledRejection', (err) => {
  debugLog('unhandledRejection:', err?.stack || err);
});

debugLog('App starting. Process ID:', process.pid, 'Argv:', process.argv);

const gotTheLock = app.requestSingleInstanceLock();
debugLog('gotTheLock:', gotTheLock);
if (!gotTheLock) {
  debugLog('Lock NOT acquired, calling app.quit()');
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    debugLog('second-instance triggered with args:', commandLine);
    showAndFocusWindow();
  });
}

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasShownTrayBalloon = false;

// --- Desktop Settings Persistence ---
function getDesktopSettingsPath() {
  return path.join(app.getPath('userData'), 'desktop-settings.json');
}

function loadDesktopSettings() {
  try {
    const file = getDesktopSettingsPath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (err) {
    console.warn('[DesktopSettings] Failed to read settings:', err);
  }
  return { minimizeToTray: true, flashOnBreaking: true };
}

function saveDesktopSettings(settings) {
  try {
    const file = getDesktopSettingsPath();
    fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DesktopSettings] Failed to save settings:', err);
  }
}

let desktopSettings = loadDesktopSettings();

// --- Window State Persistence ---
function getWindowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const defaultState = { width: 1380, height: 880, isMaximized: false };
  try {
    const file = getWindowStatePath();
    if (fs.existsSync(file)) {
      const state = JSON.parse(fs.readFileSync(file, 'utf-8'));
      // Verify the saved position intersects with an active monitor
      if (typeof state.x === 'number' && typeof state.y === 'number') {
        const visibleOnDisplay = screen.getAllDisplays().some((display) => {
          const { x, y, width, height } = display.bounds;
          return (
            state.x >= x - 20 &&
            state.y >= y - 20 &&
            state.x < x + width &&
            state.y < y + height
          );
        });
        if (visibleOnDisplay) {
          return state;
        }
      }
      return { ...defaultState, width: state.width || defaultState.width, height: state.height || defaultState.height };
    }
  } catch (err) {
    console.warn('[WindowState] Failed to load state:', err);
  }
  return defaultState;
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const isMaximized = mainWindow.isMaximized();
    let bounds = { isMaximized };
    if (!isMaximized) {
      bounds = { ...mainWindow.getBounds(), isMaximized: false };
    } else {
      const existing = loadWindowState();
      bounds = { ...existing, isMaximized: true };
    }
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(bounds, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WindowState] Failed to save state:', err);
  }
}

let saveStateTimeout = null;
function debouncedSaveWindowState() {
  if (saveStateTimeout) clearTimeout(saveStateTimeout);
  saveStateTimeout = setTimeout(saveWindowState, 400);
}

function showAndFocusWindow() {
  debugLog('showAndFocusWindow called. mainWindow exists:', Boolean(mainWindow));
  if (!mainWindow) return;
  debugLog('Before show - isMinimized:', mainWindow.isMinimized(), 'isVisible:', mainWindow.isVisible());
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);
  debugLog('After show - isMinimized:', mainWindow.isMinimized(), 'isVisible:', mainWindow.isVisible(), 'bounds:', mainWindow.getBounds());
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitForServer(url, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  return false;
}

// --- System Tray Setup ---
function createTray(iconPath) {
  if (tray) return;

  try {
    let img = nativeImage.createFromPath(iconPath);
    if (!img || img.isEmpty()) {
      const { pngPath, icoPath } = getAppIconPaths();
      if (pngPath) img = nativeImage.createFromPath(pngPath);
      else if (icoPath) img = nativeImage.createFromPath(icoPath);
    }
    if (img && !img.isEmpty()) {
      img = img.resize({ width: 16, height: 16 });
    }
    tray = new Tray(img);
  } catch (err) {
    console.warn('[Tray] Failed to create tray:', err);
    return;
  }

  const updateContextMenu = () => {
    const isAutoStart = app.getLoginItemSettings().openAtLogin;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Radar RSS v${app.getVersion()}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Abrir Radar RSS',
        click: () => showAndFocusWindow(),
      },
      {
        label: 'Atualizar Feeds Agora',
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('desktop:refresh-feeds');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Minimizar para a Bandeja ao Fechar',
        type: 'checkbox',
        checked: desktopSettings.minimizeToTray,
        click: (item) => {
          desktopSettings.minimizeToTray = item.checked;
          saveDesktopSettings(desktopSettings);
        },
      },
      {
        label: 'Iniciar com o Windows',
        type: 'checkbox',
        checked: isAutoStart,
        click: (item) => {
          app.setLoginItemSettings({
            openAtLogin: item.checked,
            openAsHidden: true,
          });
          updateContextMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Verificar Atualizações...',
        click: () => {
          autoUpdater.checkForUpdates().catch((err) => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Atualizações',
              message: 'Não foi possível verificar atualizações agora.',
              detail: err?.message || String(err),
            });
          });
        },
      },
      { type: 'separator' },
      {
        label: 'Sair do Radar RSS',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  tray.setToolTip('Radar RSS - Leitor de Notícias Inteligente');
  updateContextMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        showAndFocusWindow();
      }
    }
  });

  tray.on('double-click', () => {
    showAndFocusWindow();
  });
}

// --- Context Menu for WebContents ---
function setupContextMenu(window) {
  window.webContents.on('context-menu', (_event, params) => {
    const menuTemplate = [];

    if (params.isEditable) {
      menuTemplate.push(
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      );
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      menuTemplate.push(
        { role: 'copy', label: 'Copiar' },
        { type: 'separator' },
        {
          label: `Pesquisar "${params.selectionText.trim().substring(0, 20)}..." no Google`,
          click: () => {
            shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(params.selectionText.trim())}`);
          },
        }
      );
    }

    if (params.linkURL) {
      menuTemplate.push(
        { type: 'separator' },
        {
          label: 'Abrir link no Navegador',
          click: () => shell.openExternal(params.linkURL),
        },
        {
          label: 'Copiar endereço do link',
          click: () => clipboard.writeText(params.linkURL),
        }
      );
    }

    if (menuTemplate.length > 0) {
      const menu = Menu.buildFromTemplate(menuTemplate);
      menu.popup({ window });
    }
  });
}

// --- In-App Desktop Keyboard Shortcuts ---
function setupDesktopShortcuts(window) {
  window.webContents.on('before-input-event', (event, input) => {
    // F5 or Ctrl+R (without Shift) -> Smooth feed refresh without full web reload
    if ((input.key === 'F5' || (input.key === 'r' && (input.control || input.meta))) && !input.shift) {
      event.preventDefault();
      window.webContents.send('desktop:refresh-feeds');
      return;
    }

    // Ctrl+F -> Focus global search
    if (input.key === 'f' && (input.control || input.meta) && !input.shift && !input.alt) {
      event.preventDefault();
      window.webContents.send('desktop:focus-search');
      return;
    }

    // Ctrl+, -> Open Settings modal
    if (input.key === ',' && (input.control || input.meta)) {
      event.preventDefault();
      window.webContents.send('desktop:open-settings');
      return;
    }

    // Ctrl+B -> Toggle Bookmarks
    if (input.key === 'b' && (input.control || input.meta) && !input.shift && !input.alt) {
      event.preventDefault();
      window.webContents.send('desktop:toggle-bookmarks');
      return;
    }

    // Ctrl+N -> New Dynamic Block
    if (input.key === 'n' && (input.control || input.meta) && !input.shift && !input.alt) {
      event.preventDefault();
      window.webContents.send('desktop:open-create-block');
      return;
    }

    // Ctrl+D -> Toggle Dark/Light Theme
    if (input.key === 'd' && (input.control || input.meta) && !input.shift && !input.alt) {
      event.preventDefault();
      window.webContents.send('desktop:toggle-theme');
      return;
    }
  });
}

// --- IPC Handlers ---
function setupIpcHandlers() {
  ipcMain.handle('desktop:show-notification', async (_event, options) => {
    if (!Notification.isSupported()) return false;
    try {
      const { pngPath, icoPath } = getAppIconPaths();
      // On Windows 10/11, notification toasts require PNG or JPEG format
      const notifIcon = options.icon || pngPath || icoPath;

      const notif = new Notification({
        title: options.title || 'Radar RSS',
        body: options.body || '',
        icon: notifIcon || undefined,
        silent: options.silent || false,
      });

      notif.on('click', () => {
        showAndFocusWindow();
        if (options.article && mainWindow) {
          mainWindow.webContents.send('desktop:navigate-to-article', options.article);
        }
      });

      notif.show();
      return true;
    } catch (err) {
      console.warn('[IPC] Show notification failed:', err);
      return false;
    }
  });

  ipcMain.handle('desktop:flash-frame', (_event, flag) => {
    if (mainWindow && !mainWindow.isFocused()) {
      mainWindow.flashFrame(Boolean(flag));
    }
  });

  ipcMain.handle('desktop:get-auto-start', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('desktop:set-auto-start', (_event, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      openAsHidden: true,
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('desktop:get-minimize-to-tray', () => {
    return desktopSettings.minimizeToTray;
  });

  ipcMain.handle('desktop:set-minimize-to-tray', (_event, enabled) => {
    desktopSettings.minimizeToTray = Boolean(enabled);
    saveDesktopSettings(desktopSettings);
    return desktopSettings.minimizeToTray;
  });

  ipcMain.handle('desktop:check-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (err) {
      console.warn('[AutoUpdater] Manual check error:', err);
      return null;
    }
  });

  ipcMain.handle('desktop:open-external', (_event, url) => {
    if (typeof url === 'string') {
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(async () => {
  const { icoPath, pngPath, primaryIcon } = getAppIconPaths();
  registerWindowsShortcut(icoPath || pngPath);

  let appNativeImage = null;
  if (primaryIcon) {
    try {
      appNativeImage = nativeImage.createFromPath(primaryIcon);
    } catch (_) {}
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const defaultWidth = Math.min(1380, workArea.width - 40);
  const defaultHeight = Math.min(840, workArea.height - 40);

  const windowState = loadWindowState();
  const isHidden = process.argv.includes('--hidden');

  let initialWidth = windowState.width || defaultWidth;
  let initialHeight = windowState.height || defaultHeight;
  if (initialWidth > workArea.width) initialWidth = workArea.width;
  if (initialHeight > workArea.height) initialHeight = workArea.height;

  let initialX = windowState.x;
  let initialY = windowState.y;
  if (
    initialX === undefined ||
    initialY === undefined ||
    initialX < workArea.x ||
    initialY < workArea.y ||
    initialX + 100 > workArea.x + workArea.width ||
    initialY + 100 > workArea.y + workArea.height
  ) {
    initialX = undefined;
    initialY = undefined;
  }

  mainWindow = new BrowserWindow({
    x: initialX,
    y: initialY,
    width: initialWidth,
    height: initialHeight,
    minWidth: 940,
    minHeight: 600,
    center: initialX === undefined,
    show: !isHidden,
    autoHideMenuBar: true,
    backgroundColor: '#0a0b0e',
    title: 'Radar RSS',
    icon: appNativeImage || primaryIcon || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (appNativeImage && !appNativeImage.isEmpty()) {
    try {
      mainWindow.setIcon(appNativeImage);
    } catch (_) {}
  }

  console.log('[Electron Main] Window created. Bounds:', mainWindow.getBounds(), 'isVisible:', mainWindow.isVisible());

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron Main] Page did-finish-load successfully!');
  });
  mainWindow.webContents.on('console-message', (_e, level, message) => {
    console.log(`[Renderer Console L${level}]:`, message);
  });
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('[Renderer Gone]:', details);
  });

  if (!isHidden) {
    showAndFocusWindow();
  }

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Open external links in the system browser instead of inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://127.0.0.1')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Track window resizing and moving for persistence
  mainWindow.on('resize', debouncedSaveWindowState);
  mainWindow.on('move', debouncedSaveWindowState);

  mainWindow.on('focus', () => {
    mainWindow.flashFrame(false);
  });

  // Handle minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!isQuitting && desktopSettings.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();

      if (!hasShownTrayBalloon && tray) {
        hasShownTrayBalloon = true;
        tray.displayBalloon({
          iconType: 'info',
          title: 'Radar RSS em Segundo Plano',
          content: 'O aplicativo continua ativo na bandeja do sistema para monitorar notícias em tempo real.',
        });
      }
    } else {
      saveWindowState();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron Main] Failed to load ${validatedURL}: ${errorCode} - ${errorDescription}`);
    if (mainWindow && typeof validatedURL === 'string' && !validatedURL.startsWith('file://')) {
      const fallbackFile = path.join(app.getAppPath(), 'dist', 'index.html');
      mainWindow.loadFile(fallbackFile);
    }
  });

  // Setup Windows features
  setupContextMenu(mainWindow);
  setupDesktopShortcuts(mainWindow);
  setupIpcHandlers();

  if (primaryIcon) {
    createTray(icoPath || pngPath || primaryIcon);
  }

  const port = await getFreePort();
  const appPath = app.getAppPath();
  const distDir = path.join(appPath, 'dist');
  process.env.DIST_PATH = distDir;
  process.env.PORT = String(port);

  // Load bundled server
  try {
    require(path.join(distDir, 'server.cjs'));
  } catch (err) {
    console.error('[Electron Main] Failed to load server.cjs:', err);
  }

  const serverUrl = `http://127.0.0.1:${port}`;
  const isUp = await waitForServer(serverUrl);

  debugLog('Server URL:', serverUrl, 'isUp:', isUp);

  if (mainWindow) {
    if (isUp) {
      debugLog('Loading serverUrl:', serverUrl);
      mainWindow.loadURL(serverUrl);
    } else {
      debugLog('Fallback loading index.html');
      mainWindow.loadURL(`file://${path.join(distDir, 'index.html')}`);
    }
    if (!isHidden) {
      debugLog('Calling showAndFocusWindow after loadURL');
      showAndFocusWindow();
    }
  }

  setupAutoUpdater();
});

// --- Automatic updates (electron-updater) ---
function setupAutoUpdater() {
  const appUpdateFile = path.join(process.resourcesPath || '', 'app-update.yml');
  let hasAppUpdate = false;
  try { hasAppUpdate = fs.existsSync(appUpdateFile); } catch (_) {}

  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR || !hasAppUpdate) {
    console.log('[AutoUpdater] Disabled (unpacked, portable build, or no app-update.yml)');
    return;
  }

  const feedUrl = process.env.UPDATE_FEED_URL;
  const ghOwner = process.env.GH_OWNER;
  const ghRepo = process.env.GH_REPO;
  if (feedUrl) {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });
  } else if (ghOwner && ghRepo) {
    if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
      process.env.GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    }
    autoUpdater.setFeedURL({ provider: 'github', owner: ghOwner, repo: ghRepo });
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-downloaded', async (info) => {
    console.log(`[AutoUpdater] Downloaded ${info.version}`);
    const win = BrowserWindow.getAllWindows()[0];
    const { response } = await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Atualização disponível',
      message: `Nova versão ${info.version} baixada.`,
      detail: 'Reinicie o app agora para instalar a atualização.',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Error:', err?.message || err);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[AutoUpdater] Check failed:', err?.message || err);
    });
  }, 5000);
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && (!desktopSettings.minimizeToTray || isQuitting)) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.quit();
  } else {
    showAndFocusWindow();
  }
});
