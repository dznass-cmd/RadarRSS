<div align="center">

# 📡 RadarRSS

**Conjunto de ferramentas de automacao para Windows — Telegram, FLAC e utilidades**

[![License](https://img.shields.io/github/license/dznass-cmd/RadarRSS?style=flat-square)](LICENSE)

</div>

---

## 🎯 O que e?

Ferramentas de automacao para Windows que incluem:

-   **Bot de Telegram/AyuGram** — automacao de reacoes e comentarios via pyautogui
-   **Gerenciador de FLAC** — remocao de artwork duplicado e normalizacao de capas
-   **Scripts de sistema** — configuracao de navegadores, otimizacao, desativacao do Edge

## 📁 Estrutura

```
RadarRSS/
├── src/
│   ├── telegram_bot.py     # Bot de automacao do Telegram/AyuGram
│   └── flac_tools.py       # Ferramentas de artwork FLAC
├── scripts/                 # Scripts PowerShell/Batch do Windows
├── docs/screenshots/        # Screenshots de referencia
├── config/                  # Arquivos de configuracao
├── create-release.ps1       # Script de criacao de releases
├── setup-opencode-wsl.ps1   # Setup do OpenCode no WSL
├── requirements.txt
└── README.md
```

## 🚀 Como Usar

### Pre-requisitos

-   Windows 10/11
-   Python 3.8+
-   PowerShell 5.1+

### Instalacao

```bash
git clone https://github.com/dznass-cmd/RadarRSS.git
cd RadarRSS
pip install -r requirements.txt
```

### Bot Telegram

```python
from src.telegram_bot import interact, focus_app

# Abrir canal especifico, reagir e comentar
interact(channel_y=160, message="Muito bom!")
```

### Ferramentas FLAC

```bash
# Remover artwork duplicado
python -c "from src.flac_tools import remove_duplicate_artwork; remove_duplicate_artwork('D:\\Musica')"

# Normalizar capas (dry-run primeiro)
python -c "from src.flac_tools import normalize_covers; normalize_covers('D:\\Musica', dry_run=True)"

# Normalizar capas (aplicar)
python -c "from src.flac_tools import normalize_covers; normalize_covers('D:\\Musica')"
```

## 🛠 Tecnologias

-   **Python 3.8+** — pyautogui, mutagen
-   **PowerShell 5.1+** — automacao Windows
-   **Batch/VBS** — scripts legados

## 🤝 Contribuir

1.  Fork o repositorio
2.  Crie uma branch (`git checkout -b feature/nova-feature`)
3.  Commit (`git commit -m 'feat: add nova feature'`)
4.  Push e abra um Pull Request

## 📄 Licenca

MIT — veja [LICENSE](LICENSE).

---

<div align="center">

**⭐ Deixe uma estrela se este projeto te ajudou!**

</div>
