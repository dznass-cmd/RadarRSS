# Radar RSS

O Radar RSS e um agregador de noticias dinamico e centralizado que monitora multiplos portais em tempo real. O sistema organiza os feeds automaticamente por categorias personalizadas (como Manchetes, Tecnologia, Economia) e utiliza Inteligencia Artificial para fazer a curadoria, filtrar conteudos relevantes e gerar insights rapidos.

## Scripts Disponiveis

### Automacao
- `auto_gram.py` - Automacao Instagram
- `auto2.py` / `auto3.py` - Automacoes diversas
- `like_comment.py` - Curtir e comentar posts
- `comentar.py` - Comentar automaticamente
- `fast.py` / `final.py` / `do_it.py` - Scripts de automacao

### Arte e Audio
- `fix_artwork.py` - Corrigir artwork de musicas
- `fix_covers.py` - Corrigir capas
- `remove_duplicate_artwork.py` - Remover artwork duplicada
- `smart.py` - Script inteligente

### Windows e Privacidade
- `disable-edge.ps1` - Desativar Microsoft Edge
- `otimizar_privacidade.ps1` - Otimizar privacidade
- `disable_windows_defender.ps1` - Desativar Windows Defender
- `ativar_windows_update.bat` / `desativar_windows_update.bat` - Controle do Windows Update
- `configurar_navegadores.bat` - Configurar navegadores

### Utilitarios
- `avatar_desktop.ps1` / `avatar_signal.ps1` - Scripts de avatar
- `setup-opencode-wsl.ps1` - Setup OpenCode no WSL
- `Ghost Toolbox.cmd` - Toolbox de manutencao

## Requisitos

- Windows 10/11
- Python 3.x (para scripts .py)
- PowerShell 5.1+ (para scripts .ps1)
- Git (para versionamento)

## Downloads

Baixe a versao mais recente em: [Releases](https://github.com/dznass-cmd/RadarRSS/releases)

## Uso

### Radar RSS
1. Baixe o instalador na pagina de Releases
2. Execute `RSS Radar Setup 1.0.5.exe`
3. Siga as instrucoes de instalacao

### Scripts
Cada script pode ser executado individualmente. Consulte os comentarios dentro de cada arquivo para mais detalhes.

### Criar Nova Release
```powershell
.\create-release.ps1 -Version "1.0.6" -ExePath "C:\caminho\para\arquivo.exe"
```
