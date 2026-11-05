const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAutoStart } = require('../electron/autostart.cjs');

function fixture(t, overrides = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'radarrss-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const app = { isPackaged: true, getPath: () => home, getAppPath: () => '/source/Radar RSS' };
  const env = { XDG_CONFIG_HOME: path.join(home, 'custom-config'), APPIMAGE: '/apps/Radar RSS.AppImage' };
  const settings = { platform: 'linux', execPath: '/usr/bin/radar-rss', env, ...overrides };
  return { app, env, home, settings, file: path.join(env.XDG_CONFIG_HOME, 'autostart/com.dznasscmd.radarrss.desktop') };
}

test('Linux AppImage autostart uses its permanent path and can be disabled', (t) => {
  const f = fixture(t);
  const auto = createAutoStart(f.app, f.settings);
  assert.equal(auto.get(), false);
  assert.equal(auto.set(true), true);
  const entry = fs.readFileSync(f.file, 'utf8');
  assert.match(entry, /^Exec="\/apps\/Radar RSS.AppImage"$/m);
  assert.doesNotMatch(entry, /--hidden/);
  fs.appendFileSync(f.file, 'Hidden=true\n');
  assert.equal(auto.get(), false);
  assert.equal(auto.set(false), false);
  assert.equal(auto.set(false), false);
});

test('Linux .deb and development launches use the correct executable arguments', (t) => {
  const f = fixture(t);
  delete f.env.APPIMAGE;
  const auto = createAutoStart(f.app, f.settings);
  auto.set(true);
  assert.match(fs.readFileSync(f.file, 'utf8'), /^Exec="\/usr\/bin\/radar-rss"$/m);
  f.app.isPackaged = false;
  auto.set(true);
  assert.match(fs.readFileSync(f.file, 'utf8'), /^Exec="\/usr\/bin\/radar-rss" "\/source\/Radar RSS"$/m);
});

test('Linux autostart escapes desktop field codes and rejects line injection', (t) => {
  const f = fixture(t);
  f.env.APPIMAGE = '/apps/100% RSS "$`\\.AppImage';
  const auto = createAutoStart(f.app, f.settings);
  auto.set(true);
  const exec = fs.readFileSync(f.file, 'utf8').split('\n').find(line => line.startsWith('Exec='));
  assert.ok(exec.includes('100%%'));
  for (const char of ['"', '$', '`']) assert.ok(exec.includes('\\\\' + char));
  assert.ok(exec.includes('\\\\\\\\.AppImage'));
  f.env.APPIMAGE = '/apps/bad\nHidden=true';
  assert.throws(() => auto.set(true), /Invalid autostart/);
});

test('Linux ignores a relative XDG_CONFIG_HOME and honors desktop disable settings', (t) => {
  const f = fixture(t);
  f.env.XDG_CONFIG_HOME = 'relative';
  const auto = createAutoStart(f.app, f.settings);
  auto.set(true);
  const file = path.join(f.home, '.config/autostart/com.dznasscmd.radarrss.desktop');
  assert.ok(fs.existsSync(file));
  fs.appendFileSync(file, 'X-GNOME-Autostart-enabled=false\n');
  assert.equal(auto.get(), false);
});

test('Windows keeps using Electron login-item settings', () => {
  let enabled = false;
  const app = { getPath: () => '/unused', getLoginItemSettings: () => ({ openAtLogin: enabled }), setLoginItemSettings: value => { enabled = value.openAtLogin; } };
  const auto = createAutoStart(app, { platform: 'win32', env: {} });
  assert.equal(auto.get(), false);
  assert.equal(auto.set(true), true);
  assert.equal(auto.set(false), false);
});
