<div align="center">

# 📡 Radar RSS

**Agregador de noticias com IA que monitora portais em tempo real**

[![GitHub release](https://img.shields.io/github/v/release/dznass-cmd/RadarRSS?style=flat-square)](https://github.com/dznass-cmd/RadarRSS/releases)
[![GitHub issues](https://img.shields.io/github/issues/dznass-cmd/RadarRSS?style=flat-square)](https://github.com/dznass-cmd/RadarRSS/issues)
[![GitHub stars](https://img.shields.io/github/stars/dznass-cmd/RadarRSS?style=flat-square)](https://github.com/dznass-cmd/RadarRSS/stargazers)
[![License](https://img.shields.io/github/license/dznass-cmd/RadarRSS?style=flat-square)](LICENSE)

</div>

---

## 🎯 O que e?

O Radar RSS e um agregador de noticias dinamico e centralizado que monitora multiplos portais em tempo real. O sistema organiza os feeds automaticamente por categorias personalizadas e utiliza Inteligencia Artificial para fazer a curadoria e filtrar conteudos relevantes.

## ✨ Features

- 🔄 **Monitoramento em Tempo Real** - Verifica novos articles a cada 5 minutos
- 🤖 **Curadoria com IA** - Filtra e prioriza noticias relevantes
- 📂 **Organizacao Automatica** - Categorias: Manchetes, Tecnologia, Economia, etc
- 🎯 **Filtro Inteligente** - Remove duplicatas e conteudo irrelevante
- 📊 **Dashboard Limpa** - Interface rapida e intuitiva

## 📥 Download

| Versao | Sistema | Download |
|--------|---------|----------|
| v1.0.5 | Windows | [RSS.Radar.Setup.1.0.5.exe](https://github.com/dznass-cmd/RadarRSS/releases/download/v1.0.5/RSS.Radar.Setup.1.0.5.exe) |

## 🚀 Como Usar

### Instalacao (Windows)

1. Baixe o instalador na pagina de [Releases](https://github.com/dznass-cmd/RadarRSS/releases)
2. Execute `RSS.Radar.Setup.1.0.5.exe`
3. Siga as instrucoes de instalacao
4. Abra o Radar RSS e adicione seus feeds

### Para Desenvolvedores

```bash
# Clonar repositorio
git clone https://github.com/dznass-cmd/RadarRSS.git

# Entrar na pasta
cd RadarRSS

# Instalar dependencias
pip install -r requirements.txt

# Executar
python main.py
```

## 📁 Estrutura do Projeto

```
Radar RSS/
├── main.py                 # Ponto de entrada
├── requirements.txt        # Dependencias Python
├── config/                 # Configuracoes
│   └── feeds.json         # Lista de feeds RSS
├── src/                    # Codigo fonte
│   ├── collector.py       # Coletor de feeds
│   ├── ai_curator.py      # IA para curadoria
│   └── categorizer.py     # Organizacao por categorias
├── scripts/                # Scripts de automacao
│   ├── create-release.ps1 # Criar releases
│   └── setup.ps1          # Setup inicial
└── docs/                   # Documentacao
```

## 🛠️ Tecnologias

- **Backend**: Python 3.x
- **IA**: OpenAI / Modelos locais
- **Automacao**: PowerShell 5.1+
- **Banco**: SQLite (local)
- **Sistema**: Windows 10/11

## 📋 Requisitos

| Componente | Versao Minima |
|------------|---------------|
| Sistema Operacional | Windows 10/11 |
| Python | 3.8+ |
| PowerShell | 5.1+ |
| Git | 2.30+ |
| Espaco em Disco | 500 MB |

## 🤝 Contribuir

Contribuicoes sao bem-vindas! Veja como:

1. Fork o repositorio
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudancas (`git commit -m 'feat: add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Issues e Sugestoes

- Abra uma [Issue](https://github.com/dznass-cmd/RadarRSS/issues) para bugs ou sugestoes
- Use as labels para categorizar

## 📄 Licenca

Este projeto esta licenciado sob a Licenca MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Contato

- **GitHub**: [@dznass-cmd](https://github.com/dznass-cmd)
- **Issues**: [GitHub Issues](https://github.com/dznass-cmd/RadarRSS/issues)

---

<div align="center">

**Se este projeto te ajudou, deixe um ⭐ no GitHub!**

</div>
