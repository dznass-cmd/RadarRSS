// Run under xvfb as an ordinary user, preserving Chromium's sandbox.
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'radarrss-smoke-'));
const child = spawn(path.resolve('release/linux-unpacked/radar-rss'), ['--user-data-dir=' + profile], {
  env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
let stopping = false;
let debug = '';
const poll = setInterval(() => {
  try { debug = fs.readFileSync(path.join(profile, 'radar-debug.log'), 'utf8'); } catch (_) {}
  verify();
}, 200);
const timer = setTimeout(() => finish(new Error('Packaged application did not load within 45 seconds')), 45000);

function finish(error) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  clearInterval(poll);
  if (error) { console.error(error, output); process.exitCode = 1; }
  else console.log('Packaged Linux desktop loaded its local server and renderer.');
  child.kill('SIGTERM');
  const killTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
  killTimer.unref();
}
function collect(data) {
  output += data.toString();
  verify();
}
function verify() {
  if (/Server URL: http:\/\/127\.0\.0\.1:\d+ isUp: true/.test(debug) && output.includes('Page did-finish-load successfully!')) finish();
}
child.stdout.on('data', collect);
child.stderr.on('data', collect);
child.on('error', finish);
child.on('exit', (code, signal) => {
  if (!stopping) finish(new Error(`Packaged application exited early: ${code || signal}`));
  fs.rmSync(profile, { recursive: true, force: true });
});
