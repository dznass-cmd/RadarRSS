#Requires -RunAsAdministrator
# ============================================================
# Script: cleanup-edge.ps1
# Descricao: Limpa dados residuais do Edge
# Requisito: Executar como Administrador
# ============================================================

Write-Host "=== Limpando dados residuais do Edge ===" -ForegroundColor Cyan

# Limpar cache temporario
$tempPaths = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker\CacheStorage",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\GPUCache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\ShaderCache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\GrShaderCache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\BrowserMetrics",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\SmartScreen"
)

foreach ($path in $tempPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removido: $path" -ForegroundColor Green
    }
}

# Limpar logs
$logPaths = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\debug.log",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Crashpad",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\MEIPreload"
)

foreach ($path in $logPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removido: $path" -ForegroundColor Green
    }
}

Write-Host "`n=== Limpeza concluida ===" -ForegroundColor Green
