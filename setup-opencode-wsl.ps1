# =======================================================
# SETUP COMPLETO: OPECODE NO WSL 2 (WINDOWS 11)
# Execute no PowerShell como Administrador
# =======================================================

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# --- Verifica privilégios de Admin ---
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Execute este script como Administrador (PowerShell -> Executar como administrador)."
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " SETUP OPECODE + WSL 2" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# =============================================
# ETAPA 1: Verificar/habilitar recursos do WSL
# =============================================
Write-Host "`n[1/5] Verificando recursos do WSL..." -ForegroundColor Cyan

$featuresOk = $true
$needsReboot = $false

$wslFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue
if ($wslFeature.State -ne "Enabled") {
    Write-Host "  Habilitando Microsoft-Windows-Subsystem-Linux..."
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart
    if (-not $?) {
        Write-Error "ERRO: Falha ao habilitar WSL. Verifique se o Windows Update está desbloqueado."
        exit 1
    }
    $needsReboot = $true
} else {
    Write-Host "  WSL: ja habilitado." -ForegroundColor Green
}

$vmFeature = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue
if ($vmFeature.State -ne "Enabled") {
    Write-Host "  Habilitando VirtualMachinePlatform..."
    Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
    if (-not $?) {
        Write-Error "ERRO: Falha ao habilitar VirtualMachinePlatform."
        exit 1
    }
    $needsReboot = $true
} else {
    Write-Host "  VirtualMachinePlatform: ja habilitado." -ForegroundColor Green
}

if ($needsReboot) {
    Write-Host "`n  >>> REINICIE O COMPUTADOR e execute este script novamente <<<" -ForegroundColor Yellow
    Write-Host "  Apos reiniciar, o script continuara da etapa 2 automaticamente."
    exit 0
}

# =============================================
# ETAPA 2: Atualizar kernel e definir WSL 2
# =============================================
Write-Host "`n[2/5] Atualizando kernel do WSL e definindo versao 2..." -ForegroundColor Cyan

wsl --update
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERRO: Falha ao atualizar o kernel do WSL (wsl --update)."
    exit 1
}
Write-Host "  Kernel WSL atualizado." -ForegroundColor Green

wsl --set-default-version 2
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERRO: Falha ao definir WSL 2 como versao padrao."
    exit 1
}
Write-Host "  WSL 2 definido como versao padrao." -ForegroundColor Green

# =============================================
# ETAPA 3: Instalar Ubuntu
# =============================================
Write-Host "`n[3/5] Verificando/instalando Ubuntu..." -ForegroundColor Cyan

$ubuntuDistro = wsl -l -q 2>$null | Where-Object { $_ -match "Ubuntu" }
if (-not $ubuntuDistro) {
    Write-Host "  Instalando Ubuntu (isso pode levar alguns minutos)..."
    wsl --install -d Ubuntu
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERRO: Falha ao instalar Ubuntu."
        exit 1
    }
    Write-Host "`n  >>> PRIMEIRA EXECUCAO DO UBUNTU <<<" -ForegroundColor Yellow
    Write-Host "  Abra um novo terminal e execute: wsl"
    Write-Host "  Crie seu usuario e senha. Depois feche o terminal e reexecute este script."
    Write-Host "  O script continuara da etapa 4 automaticamente."
    exit 0
} else {
    Write-Host "  Ubuntu ja instalado: $ubuntuDistro" -ForegroundColor Green
}

# =============================================
# ETAPA 4: Configurar Node.js, OpenCode e AGENTS.md
# =============================================
Write-Host "`n[4/5] Configurando Node.js (LTS), OpenCode e regras de autonomia..." -ForegroundColor Cyan

# Verifica se o Ubuntu está inicializado e acessível
$testWsl = wsl -d Ubuntu -u root -e echo "ok" 2>&1
if ($LASTEXITCODE -ne 0 -or $testWsl -notmatch "ok") {
    Write-Error "ERRO: Nao foi possivel acessar o Ubuntu. Execute 'wsl' manualmente primeiro para criar seu usuario."
    exit 1
}

# Bloco de comandos bash (roda como root para evitar prompts de sudo)
$bashBlock = @'
set -euo pipefail

echo '  [1/4] Atualizando pacotes do sistema...'
apt-get update -qq && apt-get upgrade -y -qq

echo '  [2/4] Instalando dependencias (curl, gnupg)...'
apt-get install -y -qq curl gnupg ca-certificates

NODE_MAJOR=22
echo "  [3/4] Instalando Node.js ${NODE_MAJOR} LTS..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
apt-get install -y -qq nodejs

echo "  Node.js: $(node --version)"
echo "  npm:     $(npm --version)"

echo '  [4/4] Instalando OpenCode...'
npm install -g opencode-ai

echo '  Criando arquivo AGENTS.md...'
cat > /root/AGENTS.md << 'AGENTSEOF'
# OpenCode - Codigo de Autonomia Absoluta
- Mantenha um arquivo `todos.md` na raiz como plano mestre e atualize-o a cada passo.
- Atualize obrigatoriamente o `CHANGELOG.md` a cada alteracao funcional.
- Siga rigorosamente o padrao Conventional Commits (feat:, fix:, chore:, docs:).
- Conecte-se automaticamente aos MCPs disponiveis (Supabase para BD, Exa para buscas, Shadcn para UI).
- NUNCA utilize diretorios RAMDisk (evite variaveis TMP/TEMP apontando para eles).
- Prefira sempre solucoes nativas do WSL2 em vez de binarios Windows para maior estabilidade.
AGENTSEOF

# Copia para o home do usuario principal, se existir
USER_HOME=$(getent passwd 1000 | cut -d: -f6 2>/dev/null || echo "")
if [ -n "$USER_HOME" ] && [ -d "$USER_HOME" ]; then
    cp /root/AGENTS.md "$USER_HOME/AGENTS.md"
    chown "$(stat -c '%U' "$USER_HOME")":"$(stat -c '%G' "$USER_HOME")" "$USER_HOME/AGENTS.md"
    echo "  AGENTS.md copiado para $USER_HOME/"
else
    echo "  AGENTS.md criado em /root/. Copie-o manualmente para ~/ apos logar como seu usuario."
fi

echo ''
echo '  Configuracao do Ubuntu finalizada com sucesso!'
'@

wsl -d Ubuntu -u root -e bash -c $bashBlock
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERRO: Falha na configuracao interna do Ubuntu. Verifique os logs acima."
    exit 1
}

# =============================================
# ETAPA 5: Ajustar variáveis de ambiente
# =============================================
Write-Host "`n[5/5] Ajustando variaveis de ambiente do Windows..." -ForegroundColor Cyan

$tempPath = "C:\Temp"
if (-not (Test-Path -LiteralPath $tempPath)) {
    New-Item -ItemType Directory -Path $tempPath -Force | Out-Null
}

$env:TMP   = $tempPath
$env:TEMP  = $tempPath
[Environment]::SetEnvironmentVariable("TMP",  $tempPath, "User")
[Environment]::SetEnvironmentVariable("TEMP", $tempPath, "User")
Write-Host "  TMP/TEMP configurados para $tempPath" -ForegroundColor Green

# =============================================
# FINAL
# =============================================
Write-Host "`n============================================" -ForegroundColor Green
Write-Host " SETUP CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Abra o terminal e digite:  wsl" -ForegroundColor White
Write-Host "  2. Confira se o AGENTS.md esta no seu home:  cat ~/AGENTS.md" -ForegroundColor White
Write-Host "  3. Navegue ate seu projeto e execute:  opencode" -ForegroundColor White
Write-Host ""
Write-Host "Se estiver atras de proxy corporativo, configure dentro do WSL:" -ForegroundColor Yellow
Write-Host "  export HTTP_PROXY=http://IP_DO_PROXY:PORTA" -ForegroundColor Gray
Write-Host "  export HTTPS_PROXY=http://IP_DO_PROXY:PORTA" -ForegroundColor Gray
