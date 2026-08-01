const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;

function waitForServer(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function tryConnect() {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Server start timeout'));
        setTimeout(tryConnect, 300);
      });
    })();
  });
}

function createWindow() {
  const possiblePaths = [
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(process.resourcesPath || __dirname, 'assets', 'icon.png'),
    path.join(__dirname, 'resources', 'app', 'assets', 'icon.png'),
  ];

  let iconPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      iconPath = p;
      break;
    }
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'RSS Radar',
    icon: iconPath || path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  process.env.NODE_ENV = 'production';
  process.chdir(__dirname);

  try {
    require(path.join(__dirname, 'dist', 'server.cjs'));
  } catch (e) {
    console.error('[APP] Server FAILED:', e.message);
  }

  try {
    await waitForServer('http://localhost:3000');
  } catch (e) {
    console.error(e.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
