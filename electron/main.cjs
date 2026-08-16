// Electron main process for the "Radar RSS" desktop app.
// Starts the bundled Express server (dist/server.cjs) on a free local port
// and opens the app in a native window.
const { app, BrowserWindow, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const net = require('net');
const dotenv = require('dotenv');

// Allow users to set GEMINI_API_KEY via a .env file next to the .exe
const exeDir = path.dirname(process.execPath);
dotenv.config({ path: path.join(exeDir, '.env') });
dotenv.config({ path: path.join(app.getAppPath(), '.env') });

process.env.NODE_ENV = 'production';

let mainWindow = null;

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

async function waitForServer(url, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

app.whenReady().then(async () => {
  const port = await getFreePort();
  process.env.PORT = String(port);

  // The bundled server resolves the static path from cwd, so point cwd at the app dir.
  try {
    process.chdir(app.getAppPath());
  } catch {
    // ignore
  }

  require(path.join(app.getAppPath(), 'dist', 'server.cjs'));

  const serverUrl = `http://127.0.0.1:${port}`;
  await waitForServer(serverUrl);

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 940,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: '#0c101c',
    title: 'Radar RSS',
    icon: path.join(app.getAppPath(), 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(serverUrl);

  // Open external links in the system browser instead of inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(serverUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupAutoUpdater();
});

// --- Automatic updates (electron-updater) ---
// Only the installed (NSIS) app self-updates. The portable .exe cannot be
// updated in place, and dev builds should never check for updates.
function setupAutoUpdater() {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) {
    console.log('[AutoUpdater] Disabled (unpacked or portable build)');
    return;
  }

  // Feed resolution, in priority order:
  //   1. UPDATE_FEED_URL (generic server) from the .env
  //   2. GH_OWNER + GH_REPO from the .env (GitHub Releases, no rebuild needed)
  //   3. The publish config baked into the app at build time (app-update.yml)
  const feedUrl = process.env.UPDATE_FEED_URL;
  const ghOwner = process.env.GH_OWNER;
  const ghRepo = process.env.GH_REPO;
  if (feedUrl) {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });
    console.log(`[AutoUpdater] Feed (env): ${feedUrl}`);
  } else if (ghOwner && ghRepo) {
    // electron-updater's GitHub provider reads GH_TOKEN for private repositories
    if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
      process.env.GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    }
    autoUpdater.setFeedURL({ provider: 'github', owner: ghOwner, repo: ghRepo });
    console.log(`[AutoUpdater] Feed (github): ${ghOwner}/${ghRepo}`);
  } else {
    console.log('[AutoUpdater] Feed: build-time config (app-update.yml)');
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
  });
  autoUpdater.on('update-available', () => {
    console.log('[AutoUpdater] New version available, downloading...');
  });
  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Up to date');
  });
  autoUpdater.on('download-progress', (p) => {
    if (p.percent % 25 === 0 || p.percent === 100) {
      console.log(`[AutoUpdater] Downloading... ${Math.round(p.percent)}%`);
    }
  });
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
    // Log quietly — a wrong/missing feed must never break the app.
    console.warn('[AutoUpdater] Error:', err?.message || err);
  });

  // Give the app a few seconds to boot before checking for updates
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[AutoUpdater] Check failed:', err?.message || err);
    });
  }, 5000);
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.quit();
  }
});
