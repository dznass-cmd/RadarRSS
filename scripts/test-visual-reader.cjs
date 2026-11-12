const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');

const outDir = '/home/dznas/.gemini/antigravity/brain/1dca84a7-1f90-4274-9ebc-0a16a9885401';

async function run() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.webContents.on('console-message', (e, level, msg) => {
    console.log('[Browser Console]:', msg);
  });

  console.log('Loading app in http://localhost:3000 ...');
  await win.loadURL('http://localhost:3000');
  await new Promise((r) => setTimeout(r, 4000));

  // 1. Capture Dashboard
  console.log('Capturing initial dashboard...');
  const imgDash = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '01_dashboard_with_stories.png'), imgDash.toPNG());

  // 2. Click article card
  console.log('Clicking article card...');
  const clickRes = await win.webContents.executeJavaScript(`
    (() => {
      // Find cards with cursor-pointer
      const cards = Array.from(document.querySelectorAll('.group.cursor-pointer, [class*="cursor-pointer"]'));
      console.log('Total clickable candidates:', cards.length);
      const card = cards.find(c => c.innerText && c.innerText.length > 30 && !c.closest('nav') && !c.closest('footer'));
      if (card) {
        console.log('Clicking card text snippet:', card.innerText.slice(0, 50));
        card.click();
        return { success: true, text: card.innerText.slice(0, 50) };
      }
      return { success: false };
    })()
  `);
  console.log('Click result:', clickRes);

  // Poll for modal presence
  let modalFound = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    modalFound = await win.webContents.executeJavaScript(`
      (() => {
        const modal = document.querySelector('.stories-scroll-container');
        return !!modal;
      })()
    `);
    if (modalFound) {
      console.log(`Modal detected in DOM after ${(i + 1) * 500}ms!`);
      break;
    }
  }

  // Wait extra 3 seconds for Readability extraction to complete
  await new Promise((r) => setTimeout(r, 3000));

  const modalStatus = await win.webContents.executeJavaScript(`
    (() => {
      const modal = document.querySelector('.stories-scroll-container');
      const prose = document.querySelector('.prose');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      return {
        hasModal: !!modal,
        hasProse: !!prose,
        proseLength: prose ? prose.innerText.length : 0,
        buttons: buttons.filter(Boolean),
      };
    })()
  `);
  console.log('Modal status inside DOM:', modalStatus);

  // 3. Capture Reader View (Full Article)
  console.log('Capturing Full Article Reader Mode...');
  const imgReaderFull = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '02_reader_view_full_article.png'), imgReaderFull.toPNG());
  console.log('Saved 02_reader_view_full_article.png, size:', imgReaderFull.toPNG().length);

  // 4. Click 'Resumo do Feed' / 'Feed Summary'
  console.log('Switching to Feed Summary mode...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const snippetBtn = buttons.find(b => b.textContent && (b.textContent.includes('Resumo') || b.textContent.includes('Summary')));
      if (snippetBtn) {
        snippetBtn.click();
        return true;
      }
      return false;
    })()
  `);

  await new Promise((r) => setTimeout(r, 1200));

  // 5. Capture Snippet Mode
  console.log('Capturing Feed Summary mode...');
  const imgSnippet = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '03_reader_view_snippet_mode.png'), imgSnippet.toPNG());
  console.log('Saved 03_reader_view_snippet_mode.png, size:', imgSnippet.toPNG().length);

  console.log('Done! All screenshots captured.');
  app.exit(0);
}

app.whenReady().then(run).catch(err => {
  console.error('Test error:', err);
  app.exit(1);
});
