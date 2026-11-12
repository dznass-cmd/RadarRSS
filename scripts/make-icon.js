// Generates build/icon.ico (+ icon.png) with all standard Windows resolutions:
// 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256.
// If public/icon.png exists on Windows, uses .NET System.Drawing for high-quality bicubic resampling.
// Otherwise falls back to pure Node.js supersampling & PNG encoding.

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outDir = join(rootDir, 'build');
mkdirSync(outDir, { recursive: true });

const publicIconPath = join(rootDir, 'public', 'icon.png');
const outIcoPath = join(outDir, 'icon.ico');
const outPngPath = join(outDir, 'icon.png');

const SIZES = [16, 24, 32, 48, 64, 128, 256];

function tryGenerateWithPowerShell() {
  if (process.platform !== 'win32' || !existsSync(publicIconPath)) {
    return false;
  }
  try {
    const psScript = `
Add-Type -AssemblyName System.Drawing
$srcPath = "${publicIconPath.replace(/\\/g, '\\\\')}"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$pngStreams = @()

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $s, $s)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $bytes = $ms.ToArray()
    $ms.Dispose()

    $pngStreams += @{ Size = $s; Bytes = $bytes }
}
$src.Dispose()

$icoMs = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $icoMs
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$sizes.Count)

$offset = 6 + ($sizes.Count * 16)
foreach ($entry in $pngStreams) {
    $w = if ($entry.Size -eq 256) { [byte]0 } else { [byte]$entry.Size }
    $h = if ($entry.Size -eq 256) { [byte]0 } else { [byte]$entry.Size }
    $bw.Write($w)
    $bw.Write($h)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$entry.Bytes.Length)
    $bw.Write([uint32]$offset)
    $offset += $entry.Bytes.Length
}
foreach ($entry in $pngStreams) {
    $bw.Write($entry.Bytes)
}
$bw.Flush()
[System.IO.File]::WriteAllBytes("${outIcoPath.replace(/\\/g, '\\\\')}", $icoMs.ToArray())
$icoMs.Dispose()
`;
    execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    copyFileSync(publicIconPath, outPngPath);
    console.log('✓ Generated multi-resolution build/icon.ico and build/icon.png using public/icon.png');
    return true;
  } catch (err) {
    console.warn('PowerShell generation warning, falling back to pure Node:', err.message);
    return false;
  }
}

// Pure Node.js fallback
function generatePureNode() {
  const SRC = 1024;
  const buf = Buffer.alloc(SRC * SRC * 4);

  const cx = 0.31 * SRC;
  const cy = 0.31 * SRC;
  const dotR = 0.08 * SRC;
  const arcs = [
    { r: 0.155 * SRC, t: 0.05 * SRC },
    { r: 0.27 * SRC, t: 0.05 * SRC },
  ];

  const x0 = 0.02 * SRC, y0 = 0.02 * SRC, x1 = 0.98 * SRC, y1 = 0.98 * SRC;
  const corner = 0.24 * SRC;
  const BG_TOP = [30, 36, 52];
  const BG_BOT = [12, 16, 26];
  const FG = [255, 138, 76];

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
            const a = Math.atan2(dy, dx);
            if (a >= -Math.PI / 2 && a <= 0) { color = FG; break; }
          }
        }
      }
      if (color) {
        buf[i] = color[0];
        buf[i + 1] = color[1];
        buf[i + 2] = color[2];
        buf[i + 3] = 255;
      }
    }
  }

  let crcTable = null;
  function crc32(b) {
    if (!crcTable) {
      crcTable = new Int32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c;
      }
    }
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
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
    ihdr[8] = 8;
    ihdr[9] = 6;
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

  function downsample(targetSize) {
    const out = Buffer.alloc(targetSize * targetSize * 4);
    const step = SRC / targetSize;
    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        const x0s = Math.floor(x * step), y0s = Math.floor(y * step);
        for (let yy = y0s; yy < y0s + step; yy++) {
          for (let xx = x0s; xx < x0s + step; xx++) {
            const i = (yy * SRC + xx) * 4;
            r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3];
          }
        }
        const n = step * step;
        const o = (y * targetSize + x) * 4;
        out[o] = Math.round(r / n);
        out[o + 1] = Math.round(g / n);
        out[o + 2] = Math.round(b / n);
        out[o + 3] = Math.round(a / n);
      }
    }
    return out;
  }

  const pngEntries = SIZES.map((size) => {
    const downsampled = downsample(size);
    return {
      size,
      png: encodePng(downsampled, size),
    };
  });

  // Write highest res PNG to build/icon.png
  writeFileSync(outPngPath, pngEntries[pngEntries.length - 1].png);

  // Build multi-res ICO
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(pngEntries.length, 4);

  let offset = 6 + pngEntries.length * 16;
  const dirEntries = pngEntries.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  const fullIco = Buffer.concat([
    icoHeader,
    ...dirEntries,
    ...pngEntries.map((e) => e.png),
  ]);

  writeFileSync(outIcoPath, fullIco);
  console.log(`✓ Generated multi-resolution build/icon.ico (${SIZES.join(', ')}) and build/icon.png via pure Node.js`);
}

if (existsSync(publicIconPath)) {
  copyFileSync(publicIconPath, outPngPath);
  const tauriIco = join(rootDir, 'src-tauri', 'icons', 'icon.ico');
  if (existsSync(tauriIco)) {
    copyFileSync(tauriIco, outIcoPath);
    console.log('✓ Synchronized Radar RSS icon from public/icon.png and src-tauri/icons/icon.ico');
  } else if (!tryGenerateWithPowerShell()) {
    generatePureNode();
  }
} else if (!tryGenerateWithPowerShell()) {
  generatePureNode();
  // Keep the original application artwork for Linux packaging and runtime icons.
  if (existsSync(publicIconPath)) copyFileSync(publicIconPath, outPngPath);
}

