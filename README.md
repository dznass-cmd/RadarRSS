<div align="center">

# 📡 Radar RSS

**Agregador de notícias com IA que monitora portais em tempo real**

[![License](https://img.shields.io/github/license/dznass-cmd/RadarRSS?style=flat-square)](LICENSE)

</div>

---

## 🎯 O que é?

O **Radar RSS** é um aplicativo desktop (Electron) que coleta feeds RSS de múltiplos
portais em tempo real e usa Inteligência Artificial (Google Gemini) para fazer a
curadoria: filtra conteúdos relevantes, organiza automaticamente por categorias
(Manchetes, Tecnologia, Economia, etc.) e gera resumos rápidos — tudo em uma
interface única e centralizada.

## 🚀 Download

| Plataforma | Arquivo |
|---|---|
| Linux (AppImage) | [RadarRSS-x86_64.AppImage](https://github.com/dznass-cmd/RadarRSS/releases/latest) |

## ✨ Funcionalidades

-   **Monitoramento em tempo real** — coleta e atualização contínua de feeds RSS de vários portais
-   **Categorias automáticas** — organização dos artigos por categorias personalizadas (Manchetes, Tecnologia, Economia)
-   **Curadoria com IA** — filtragem de conteúdos relevantes via Google Gemini
-   **Resumos rápidos** — resumo automático de notícias com IA (`/api/gemini/summarize`)
-   **Tradução** — tradução de conteúdos com IA (`/api/gemini/translate`)
-   **Validação de feeds** — endpoint de validação de fontes RSS (`/api/rss/validate`)
-   **Interface moderna** — React 19 + Tailwind CSS, tema escuro

## 🔌 API Interna (servidor local na porta 3000)

| Endpoint | Descrição |
|---|---|
| `GET /api/rss` | Lista notícias coletadas dos feeds monitorados |
| `POST /api/rss/validate` | Valida se uma URL é um feed RSS válido |
| `POST /api/gemini/summarize` | Gera resumo de uma notícia com IA |
| `POST /api/gemini/curate` | Curadoria/filtragem de conteúdos com IA |
| `POST /api/gemini/translate` | Traduz conteúdo com IA |

## 📁 Estrutura

```
RadarRSS/
├── AppDir/                        # App desktop (Electron + React)
│   └── usr/bin/app/
│       ├── electron-main.cjs     # Entry point do Electron (porta 3000)
│       └── dist/                 # Frontend React + servidor Express
├── marketing/                     # Materiais de divulgação
├── create-release.ps1             # Script de criação de releases
├── setup-opencode-wsl.ps1         # Setup do OpenCode no WSL
├── config/                        # Arquivos de configuração
├── LICENSE
├── CHANGELOG.md
└── README.md
```

## 🛠 Tecnologias

-   **Electron + React 19 + Vite + Tailwind CSS** — app desktop
-   **Express + rss-parser** — servidor e coleta de feeds
-   **Google Gemini (@google/genai)** — curadoria, resumos e tradução

## 🤝 Contribuir

1.  Fork o repositório
2.  Crie uma branch (`git checkout -b feature/nova-feature`)
3.  Commit (`git commit -m 'feat: add nova feature'`)
4.  Push e abra um Pull Request

## 📄 Licença

MIT — veja [LICENSE](LICENSE).

---

<div align="center">

**⭐ Deixe uma estrela se este projeto te ajudou!**

</div>
