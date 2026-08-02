<div align="center">

# 📡 RadarRSS

**Ferramentas de gerenciamento de arquivos FLAC e utilitários Windows**

[![License](https://img.shields.io/github/license/dznass-cmd/RadarRSS?style=flat-square)](LICENSE)

</div>

---

## 🎯 O que é?

Conjunto de ferramentas para Windows:

-   **Gerenciador de FLAC** — remoção de artwork duplicado e normalização de capas de álbuns
-   **Scripts de sistema** — configuração de navegadores, otimização e gerenciamento do Windows

## 📁 Estrutura

```
RadarRSS/
├── src/
│   └── flac_tools.py          # Ferramentas de artwork FLAC
├── scripts/                    # Scripts PowerShell/Batch do Windows
│   ├── disable-edge.ps1       # Desativar Microsoft Edge
│   ├── disable-edge-user.ps1  # Configurações de usuário do Edge
│   ├── cleanup-edge.ps1       # Limpeza de dados do Edge
│   ├── otimizar_privacidade.ps1
│   ├── configurar_navegadores.ps1
│   └── ...
├── config/                     # Arquivos de configuração
├── create-release.ps1          # Script de criação de releases
├── setup-opencode-wsl.ps1      # Setup do OpenCode no WSL
├── requirements.txt
└── README.md
```

## 🚀 Como Usar

### Pré-requisitos

-   Windows 10/11
-   Python 3.8+
-   PowerShell 5.1+

### Instalação

```bash
git clone https://github.com/dznass-cmd/RadarRSS.git
cd RadarRSS
pip install -r requirements.txt
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

### Scripts do Windows

Execute via PowerShell (Admin):

```powershell
# Desativar Microsoft Edge
.\scripts\disable-edge.ps1

# Otimizar privacidade
.\scripts\otimizar_privacidade.ps1
```

## 🛠 Tecnologias

-   **Python 3.8+** — mutagen
-   **PowerShell 5.1+** — automação Windows

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
