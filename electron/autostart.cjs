const fs = require('node:fs');
const path = require('node:path');

// Electron's login-item API is only implemented on Windows and macOS.
function createAutoStart(app, { platform = process.platform, env = process.env, execPath = process.execPath } = {}) {
  const configDir = env.XDG_CONFIG_HOME && path.isAbsolute(env.XDG_CONFIG_HOME)
    ? env.XDG_CONFIG_HOME : path.join(app.getPath('home'), '.config');
  const desktopFile = path.join(configDir, 'autostart', 'com.dznasscmd.radarrss.desktop');
  const quote = (value) => {
    if (/[\r\n\0]/.test(value)) throw new Error('Invalid autostart executable path');
    // Exec arguments have their own quoting, followed by desktop-entry escaping.
    return '"' + value.replace(/%/g, '%%').replace(/[\\"`$]/g, '\\$&').replace(/\\/g, '\\\\') + '"';
  };
  return {
    get() {
      if (platform !== 'linux') return app.getLoginItemSettings().openAtLogin;
      try {
        const entry = fs.readFileSync(desktopFile, 'utf8');
        return !/^Hidden\s*=\s*true\s*$/m.test(entry) && !/^X-GNOME-Autostart-enabled\s*=\s*false\s*$/m.test(entry);
      } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
      }
    },
    set(enabled) {
      if (platform !== 'linux') {
        app.setLoginItemSettings({ openAtLogin: Boolean(enabled), openAsHidden: true });
        return this.get();
      }
      if (enabled) {
        const executable = app.isPackaged ? (env.APPIMAGE || execPath) : execPath;
        const args = app.isPackaged ? [executable] : [executable, app.getAppPath()];
        const entry = '[Desktop Entry]\nType=Application\nName=Radar RSS\nExec=' + args.map(quote).join(' ') + '\nTerminal=false\nX-GNOME-Autostart-enabled=true\n';
        fs.mkdirSync(path.dirname(desktopFile), { recursive: true });
        fs.writeFileSync(desktopFile, entry, { mode: 0o644 });
      } else {
        try { fs.unlinkSync(desktopFile); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      return this.get();
    },
  };
}

module.exports = { createAutoStart };
