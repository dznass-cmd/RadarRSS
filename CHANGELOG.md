# Changelog

Todas as alteracoes notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.0.5] (Beta) - 2026-08-29

### Adicionado
- Novo componente `SafeImage` com placeholder visual elegante e indicador de carregamento para imagens que falham ou demoram a carregar.
- Identificação visual de versão Beta nas configurações.

### Corrigido / Melhorado
- Extração de imagens RSS aprimorada: suporte estendido para tags `media:content`, `media:thumbnail`, `enclosure` e tags `<img>` embutidas no conteúdo HTML.
- Tratamento automático de URLs relativas e relativas a protocolo (`//`).
- Filtragem automática de pixels e beacons de rastreamento (1x1, trackers).

---

## [2.0.4] - 2026-08-16

### Adicionado
- Lançamento desktop oficial Windows com auto-updater via GitHub Releases.

---

## [2.0.2] - 2026-08-11

### Adicionado
- Build Windows via electron-builder: `RSS Radar-2.0.1-portable-x64.exe` e `RSS Radar-2.0.1-setup-x64.exe`
- Script `build:win` e config de build (portable + NSIS) no `package.json`
- `electron` como devDependency e script `start` para rodar no Windows

### Corrigido
- `process.chdir(__dirname)` falhava dentro do `app.asar` (ENOENT) — chdir agora só em dev
- `distPath` resolvia `dist/dist` no bundle empacotado — usa `__dirname` (raiz do dist)

---

## [2.0.1] - 2026-08-02

### Adicionado
- Integração com Google Gemini AI para resumos automatizados e curadoria.
- Suporte a múltiplos tópicos e feeds nacionais/internacionais.
- Suporte para empacotamento Windows via Electron.

---

## [2.0.0] - 2026-08-02

### Adicionado
- Nova interface gráfica moderna desenvolvida em React 19 + Vite + Tailwind CSS.
- Backend local em Express para agregação e processamento de feeds RSS em tempo real.
- Suporte a categorização dinâmica e temas visuais personalizáveis.

---

## [1.0.0] - 2026-07-30

### Adicionado
- Lançamento inicial do projeto Radar RSS.
- Monitoramento de portais de notícias em tempo real e agregação básica de feeds.

---

## [Legenda]

- `ADICIONADO` para novas features
- `ALTERADO` para alteracoes em features existentes
- `DEPRECIADO` para features que serao removidas
- `REMOVIDO` para features removidas
- `CORRIGIDO` para correcoes de bugs
- `SEGURANCA` para vulnerabilidades
