# Changelog

Todas as alteracoes notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [2.0.1] - 2026-08-02

### Corrigido
- README.md reescrito para refletir o projeto real: **RSS Radar** (app desktop
  Electron de agregador de noticias com IA) como produto principal, com as
  ferramentas FLAC e scripts Windows como utilitarios auxiliares
- Estrutura do README agora inclui `AppDir/` (app Electron) e `marketing/`

---

## [2.0.0] - 2026-08-02

### Adicionado
- Estrutura organizada: `src/`, `scripts/`, `config/`
- Modulo `src/flac_tools.py` para gerenciamento de artwork FLAC
- `requirements.txt` com dependencias declaradas

### Alterado
- README.md reescrito para refletir o projeto real
- Scripts PowerShell/Batch movidos para `scripts/`
- `.gitignore` atualizado com regras para AppImage e builds

### Removido
- Scripts Python duplicados da raiz
- Scripts de automacao Telegram/AyuGram
- Screenshots de automação Telegram
- Scripts de risco (disable_windows_defender.ps1, Ghost Toolbox.cmd)

---

## [1.0.5] - 2026-07-30

### Adicionado
- Monitoramento de multiplos portais em tempo real
- Organizacao automatica por categorias
- Suporte a feeds RSS padronizados

---

## [1.0.0] - 2026-07-30

### Adicionado
- Projeto inicial no GitHub
- Scripts de automacao Python
- Scripts de configuracao PowerShell
- Documentacao README.md
- Configuracao .gitignore
- Regras de disciplina (AGENTS.md)

---

## [Legenda]

- `ADICIONADO` para novas features
- `ALTERADO` para alteracoes em features existentes
- `DEPRECIADO` para features que serao removidas
- `REMOVIDO` para features removidas
- `CORRIGIDO` para correcoes de bugs
- `SEGURANCA` para vulnerabilidades
