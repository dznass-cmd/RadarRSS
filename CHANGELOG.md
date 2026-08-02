# Changelog

Todas as alteracoes notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [2.0.0] - 2026-08-02

### Adicionado
- Estrutura organizada: `src/`, `scripts/`, `docs/screenshots/`, `config/`
- Modulo consolidado `src/telegram_bot.py` (unifica 10+ scripts duplicados)
- Modulo `src/flac_tools.py` para gerenciamento de artwork FLAC
- `requirements.txt` com dependencias declaradas

### Alterado
- README.md reescrito para refletir o projeto real
- Scripts PowerShell/Batch movidos para `scripts/`
- Screenshots movidos para `docs/screenshots/`
- `.gitignore` atualizado com regras para AppImage e builds

### Removido
- Scripts Python duplicados da raiz (agentes.py, auto2.py, etc.)
- Scripts de risco removidos (disable_windows_defender.ps1)

---

## [1.0.5] - 2026-07-30

### Adicionado
- Agregador de noticias com IA
- Monitoramento de multiplos portais em tempo real
- Organizacao automatica por categorias
- Curadoria inteligente de conteudos
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
