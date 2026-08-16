// Generates build/icon.ico (+ icon.png preview) with a simple RSS-style icon.
// Uses only Node built-ins (zlib, fs) — no image dependencies.
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = 1024; // supersampled render size
const SIZE = 256; // final icon size

const buf = Buffer.alloc(SRC * SRC * 4);

// RSS motif geometry
const cx = 0.31 * SRC;
const cy = 0.31 * SRC;
const dotR = 0.08 * SRC;
const arcs = [
  { r: 0.155 * SRC, t: 0.05 * SRC },
  { r: 0.27 * SRC, t: 0.05 * SRC },
];

// Rounded-rect background
const x0 = 0.02 * SRC, y0 = 0.02 * SRC, x1 = 0.98 * SRC, y1 = 0.98 * SRC;
const corner = 0.24 * SRC;
const BG_TOP = [30, 36, 52];
const BG_BOT = [12, 16, 26];
const FG = [255, 138, 76]; // warm orange for the RSS marks

function insideRoundRect(x, y) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cxp = Math.max(x0 + corner, Math.min(x, x1 - corner));
  const cyp = Math.max(y0 + corner, Math.min(y, y1 - corner));
  const dx = x - cxp, dy = y - cyp;
  return dx * dx + dy * dy <= corner * corner;
}

for (let y = 0; y < SRC; y++) {
  for (let x = 0; x < SRC; x++) {
    const i = (y * SRC + x) * 4;
    if (!insideRoundRect(x, y)) continue;
    const t = y / SRC;
    const r = Math.round(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t);
    const g = Math.round(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t);
    const b = Math.round(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t);
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;

    const dx = x - cx, dy = y - cy;
    const d = Math.hypot(dx, dy);
    let color = null;

    if (d <= dotR) color = FG;
    else {
      for (const arc of arcs) {
        if (d >= arc.r && d <= arc.r + arc.t) {
          const a = Math.atan2(dy, dx); // 0 = right, -PI/2 = top
          if (a >= -Math.PI / 2 && a <= 0) { color = FG; break; }
        }
      }
    }
    if (color) {
      // blend FG over background
      const a = 1;
      buf[i] = Math.round(color[0] * a + r * (1 - a));
      buf[i + 1] = Math.round(color[1] * a + g * (1 - a));
      buf[i + 2] = Math.round(color[2] * a + b * (1 - a));
      buf[i + 3] = 255;
    }
  }
}

// Box-downsample SRC -> SIZE (4x4 average)
const out = Buffer.alloc(SIZE * SIZE * 4);
const step = SRC / SIZE;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    const x0s = Math.floor(x * step), y0s = Math.floor(y * step);
    for (let yy = y0s; yy < y0s + step; yy++) {
      for (let xx = x0s; xx < x0s + step; xx++) {
        const i = (yy * SRC + xx) * 4;
        r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3];
      }
    }
    const n = step * step;
    const o = (y * SIZE + x) * 4;
    out[o] = Math.round(r / n);
    out[o + 1] = Math.round(g / n);
    out[o + 2] = Math.round(b / n);
    out[o + 3] = Math.round(a / n);
  }
}

// ---- PNG encoding ----
let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // rows: filter byte 0 + RGBA
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    rgba.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = encodePng(out, SIZE);

// ---- ICO wrapping (single 256x256 PNG entry) ----
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: icon
icoHeader.writeUInt16LE(1, 4); // count
const entry = Buffer.alloc(16);
entry[0] = 0; // width 256 (0 means 256)
entry[1] = 0; // height 256
entry[2] = 0; // colors
entry[3] = 0; // reserved
entry.writeUInt16LE(1, 4);  // planes
entry.writeUInt16LE(32, 6); // bit count
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12); // offset

const outDir = join(__dirname, '..', 'build');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'icon.ico'), Buffer.concat([icoHeader, entry, png]));
writeFileSync(join(outDir, 'icon.png'), png);
console.log('Generated build/icon.ico and build/icon.png');
