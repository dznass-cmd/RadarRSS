# Script para criar releases automaticamente
# Uso: .\create-release.ps1 -Version "1.0.6" -ExePath "C:\caminho\para\arquivo.exe"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$true)]
    [string]$ExePath,
    
    [string]$Repo = "dznass-cmd/RadarRSS"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criando Release v$Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo existe
if (-not (Test-Path $ExePath)) {
    Write-Host "ERRO: Arquivo nao encontrado: $ExePath" -ForegroundColor Red
    exit 1
}

# Extrair notas do CHANGELOG.md
$changelog = Get-Content "CHANGELOG.md" -Raw
$pattern = "## \[$Version\].*?\n(.*?)(?=## \[|\z)"
if ($changelog -match $pattern) {
    $notes = $matches[1].Trim()
} else {
    $notes = "Versao $Version do Radar RSS"
}

Write-Host "Arquivo: $ExePath" -ForegroundColor Yellow
Write-Host "Repo: $Repo" -ForegroundColor Yellow
Write-Host "Notas: $notes" -ForegroundColor Yellow
Write-Host ""

# Criar release
Write-Host "Criando release..." -ForegroundColor Green
$releaseUrl = gh release create "v$Version" $ExePath `
    --repo $Repo `
    --title "Radar RSS v$Version" `
    --notes $notes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Release criada com sucesso!" -ForegroundColor Green
    Write-Host "URL: $releaseUrl" -ForegroundColor Cyan
} else {
    Write-Host "ERRO ao criar release" -ForegroundColor Red
    exit 1
}
