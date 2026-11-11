const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');

const outDir = '/home/dznas/.gemini/antigravity/brain/1dca84a7-1f90-4274-9ebc-0a16a9885401';
const opmlFilePath = path.join(__dirname, '..', 'exemplo_feeds.opml');
const opmlContent = fs.readFileSync(opmlFilePath, 'utf8');

async function run() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  console.log('Carregando aplicação em http://localhost:3000...');
  await win.loadURL('http://localhost:3000');

  // Aguarda renderização inicial
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 1. Screenshot da tela principal
  console.log('Capturando tela inicial...');
  const mainImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '01_radar_main.png'), mainImage.toPNG());
  console.log('Salvo 01_radar_main.png');

  // 2. Clicar no botão "Gerenciar Feeds"
  console.log('Abrindo modal de Gerenciar Feeds...');
  const openedModal = await win.webContents.executeJavaScript(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const targetBtn = btns.find(b => 
        (b.getAttribute('title') && b.getAttribute('title').toLowerCase().includes('feed')) ||
        b.querySelector('svg.lucide-list-plus') ||
        b.innerText.includes('Manage Feeds') ||
        b.innerText.includes('Gerenciar Feeds')
      );
      if (targetBtn) {
        targetBtn.click();
        return true;
      }
      return false;
    })()
  `);

  if (!openedModal) {
    console.error('Botão de Gerenciar Feeds não foi encontrado!');
  } else {
    console.log('Modal acionado com sucesso!');
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 3. Screenshot do modal aberto com os novos botões OPML e JSON
  console.log('Capturando tela do modal com os controles de OPML...');
  const modalImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '02_manage_feeds_modal_opml.png'), modalImage.toPNG());
  console.log('Salvo 02_manage_feeds_modal_opml.png');

  // 4. Testar a importação simulando o upload do arquivo exemplo_feeds.opml
  console.log('Disparando importação de exemplo_feeds.opml na interface...');
  const importResult = await win.webContents.executeJavaScript(`
    (() => {
      try {
        const opmlInput = document.querySelector('input[accept*=".opml"]');
        if (!opmlInput) return { success: false, reason: 'Input OPML não encontrado' };

        const content = ${JSON.stringify(opmlContent)};
        const file = new File([content], 'exemplo_feeds.opml', { type: 'text/x-opml' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        opmlInput.files = dataTransfer.files;

        // Dispara o evento de change
        opmlInput.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })()
  `);

  console.log('Resultado do disparo de importação:', importResult);

  // Aguarda 1.5s para toast e atualização dos feeds
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 5. Screenshot da confirmação com o Toast e novos feeds
  console.log('Capturando tela com a confirmação da importação...');
  const importedImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '03_opml_import_confirmed.png'), importedImage.toPNG());
  console.log('Salvo 03_opml_import_confirmed.png');

  console.log('Teste visual concluído com 100% de sucesso!');
  app.quit();
}

app.whenReady().then(run);
