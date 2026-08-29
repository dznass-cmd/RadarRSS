import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('Iniciando captura de telas reais com Microsoft Edge...');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1920,1080',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1600,
      height: 960,
      deviceScaleFactor: 2,
    });

    console.log('Navegando para http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Aguardando carregamento dos feeds RSS...');
    await page.waitForSelector('.group', { timeout: 20000 }).catch(() => console.log('Aviso: timeout esperando seletor, prosseguindo...'));
    
    // Aguarda 4 segundos para os dados renderizarem e imagens carregarem
    await new Promise((r) => setTimeout(r, 4000));

    const imagesDir = path.resolve('images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const dashboardPath = path.join(imagesDir, 'dashboard_preview.jpg');
    console.log(`Salvando captura real do Dashboard em ${dashboardPath}...`);
    await page.screenshot({
      path: dashboardPath,
      type: 'jpeg',
      quality: 92,
      fullPage: false,
    });
    console.log('✓ Captura do Dashboard salva com sucesso!');

    // Clica no primeiro card de notícia para abrir o modal de leitura real
    console.log('Abrindo modal de leitura de notícia...');
    const card = await page.$('.group.cursor-pointer');
    if (card) {
      await card.click();
      await new Promise((r) => setTimeout(r, 1500));

      const readerPath = path.join(imagesDir, 'article_reader_preview.jpg');
      console.log(`Salvando captura real do Modal de Leitura em ${readerPath}...`);
      await page.screenshot({
        path: readerPath,
        type: 'jpeg',
        quality: 92,
        fullPage: false,
      });
      console.log('✓ Captura do Modal de Leitura salva com sucesso!');
    } else {
      console.warn('Card de notícia não encontrado para clicar.');
    }

    console.log('Todas as capturas reais foram geradas com sucesso!');
  } catch (error) {
    console.error('Erro ao capturar telas:', error);
  } finally {
    await browser.close();
  }
}

run();
