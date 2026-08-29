import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const SIZES = [
  { dir: 'android/app/src/main/res/mipmap-mdpi', size: 48 },
  { dir: 'android/app/src/main/res/mipmap-hdpi', size: 72 },
  { dir: 'android/app/src/main/res/mipmap-xhdpi', size: 96 },
  { dir: 'android/app/src/main/res/mipmap-xxhdpi', size: 144 },
  { dir: 'android/app/src/main/res/mipmap-xxxhdpi', size: 192 },
];

const SVG_SQUARE = `
<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#0F131A"/>
  <circle cx="50" cy="50" r="38" stroke="#F59E0B" stroke-width="1.8" opacity="0.25"/>
  <circle cx="50" cy="50" r="26" stroke="#F59E0B" stroke-width="1.8" opacity="0.4"/>
  <circle cx="50" cy="50" r="15" stroke="#F59E0B" stroke-width="1.8" opacity="0.6"/>
  <line x1="50" y1="10" x2="50" y2="90" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.35"/>
  <line x1="10" y1="50" x2="90" y2="50" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.35"/>
  <circle cx="50" cy="50" r="9" stroke="#FBBF24" stroke-width="2" opacity="0.9"/>
  <circle cx="50" cy="50" r="5" fill="#F59E0B"/>
  <circle cx="68" cy="34" r="4.5" fill="#10B981"/>
  <circle cx="33" cy="38" r="3.5" fill="#38BDF8"/>
  <circle cx="66" cy="66" r="3.5" fill="#F43F5E"/>
</svg>
`;

const SVG_ROUND = `
<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#0F131A"/>
  <circle cx="50" cy="50" r="38" stroke="#F59E0B" stroke-width="1.8" opacity="0.25"/>
  <circle cx="50" cy="50" r="26" stroke="#F59E0B" stroke-width="1.8" opacity="0.4"/>
  <circle cx="50" cy="50" r="15" stroke="#F59E0B" stroke-width="1.8" opacity="0.6"/>
  <line x1="50" y1="10" x2="50" y2="90" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.35"/>
  <line x1="10" y1="50" x2="90" y2="50" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.35"/>
  <circle cx="50" cy="50" r="9" stroke="#FBBF24" stroke-width="2" opacity="0.9"/>
  <circle cx="50" cy="50" r="5" fill="#F59E0B"/>
  <circle cx="68" cy="34" r="4.5" fill="#10B981"/>
  <circle cx="33" cy="38" r="3.5" fill="#38BDF8"/>
  <circle cx="66" cy="66" r="3.5" fill="#F43F5E"/>
</svg>
`;

async function renderSvgToPng(browser, svgContent, size, outputPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.screenshot({ path: outputPath, omitBackground: true });
  await page.close();
}

async function run() {
  console.log('Iniciando renderizador de ícones Android...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const item of SIZES) {
    fs.mkdirSync(item.dir, { recursive: true });

    // Square icon
    const squarePath = path.join(item.dir, 'ic_launcher.png');
    await renderSvgToPng(browser, SVG_SQUARE, item.size, squarePath);
    console.log(`✓ Gerado ${squarePath} (${item.size}x${item.size})`);

    // Round icon
    const roundPath = path.join(item.dir, 'ic_launcher_round.png');
    await renderSvgToPng(browser, SVG_ROUND, item.size, roundPath);
    console.log(`✓ Gerado ${roundPath} (${item.size}x${item.size})`);
  }

  // Generate public icons
  fs.mkdirSync('public', { recursive: true });
  await renderSvgToPng(browser, SVG_SQUARE, 512, 'public/icon.png');
  await renderSvgToPng(browser, SVG_SQUARE, 64, 'public/favicon.png');
  console.log('✓ Gerado public/icon.png (512x512) e public/favicon.png (64x64)');

  await browser.close();
  console.log('Sucesso! Todos os ícones rasterizados foram gerados.');
}

run().catch(console.error);
