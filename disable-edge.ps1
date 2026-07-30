#Requires -RunAsAdministrator
# ============================================================
# Script: disable-edge.ps1
# Descricao: Desativa e bloqueia Microsoft Edge completamente
# Requisito: Executar como Administrador
# ============================================================

Write-Host "=== Desativando Microsoft Edge ===" -ForegroundColor Cyan

# --- 1. Matar processos Edge ---
Write-Host "`n[1/7] Encerrando processos Edge..." -ForegroundColor Yellow
$edgeProcs = @("MicrosoftEdgeUpdate", "msedge")
foreach ($proc in $edgeProcs) {
    Get-Process -Name $proc -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    taskkill /F /IM "$proc.exe" 2>$null | Out-Null
}
Write-Host "  Processos encerrados." -ForegroundColor Green

# --- 2. Desabilitar servicos de atualizacao ---
Write-Host "`n[2/7] Desabilitando servicos de atualizacao..." -ForegroundColor Yellow
$services = @("edgeupdate", "edgeupdatem", "MicrosoftEdgeElevationService")
foreach ($svc in $services) {
    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
    Write-Host "  Servico '$svc' desabilitado." -ForegroundColor Green
}

# --- 3. Bloquear Edge via Group Policy (HKLM) ---
Write-Host "`n[3/7] Aplicando politicas de bloqueio..." -ForegroundColor Yellow
$policyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"

$policies = @{
    "DefaultBrowserSettingEnabled" = 0
    "HideFirstRunExperience"       = 1
    "BackgroundModeEnabled"        = 0
    "AllowPrelaunch"               = 0
    "EdgeCollectionsEnabled"       = 0
    "EdgeShoppingAssistantEnabled" = 0
    "HubsSidebarEnabled"           = 0
    "ShowRecommendationsEnabled"   = 0
    "SpotlightExperiencesAndRecommendationsEnabled" = 0
    "WalletServiceEnabled"         = 0
    "DiscoverPageDisabled"         = 1
    "ShoppingServiceEnabled"       = 0
    "TabServicesEnabled"           = 0
    "EdgeFollowEnabled"            = 0
    "ResolveNavigationErrorsUseURL" = 0
    "ExternalAssistantEnabled"     = 0
    "WebAppsGpoPolicyEnabled"      = 0
    "AIAccessEnabled"              = 0
}

foreach ($key in $policies.Keys) {
    Set-ItemProperty -Path $policyPath -Name $key -Value $policies[$key] -Type DWord -Force
}
Write-Host "  Politicas aplicadas." -ForegroundColor Green

# --- 4. Bloquear Edge como navegador padrao ---
Write-Host "`n[4/7] Desativando Edge como navegador padrao..." -ForegroundColor Yellow
$edgeOpenWithPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\filexts\.htm\OpenWithProgids"
$edgeOpenHtmlPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\filexts\.html\OpenWithProgids"

# Remover Edge das associacoes de arquivos HTML
Remove-ItemProperty -Path $edgeOpenWithPath -Name "MSEdgeHTM" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path $edgeOpenHtmlPath -Name "MSEdgeHTM" -ErrorAction SilentlyContinue
Write-Host "  Associacoes de arquivo removidas." -ForegroundColor Green

# --- 5. Impedir Edge de ser redefinido ---
Write-Host "`n[5/7] Impedindo Edge de assumir navegador padrao..." -ForegroundColor Yellow
$edgeUserChoicePath = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
if (-not (Test-Path $edgeUserChoicePath)) {
    New-Item -Path $edgeUserChoicePath -Force | Out-Null
}
Set-ItemProperty -Path $edgeUserChoicePath -Name "DefaultBrowserSettingEnabled" -Value 0 -Type DWord -Force
Write-Host "  Protecao aplicada." -ForegroundColor Green

# --- 6. Desabilitar tarefas agendadas ---
Write-Host "`n[6/7] Desabilitando tarefas agendadas do Edge..." -ForegroundColor Yellow
$taskPaths = @(
    '\Microsoft\Windows\EdgeUpdate\',
    '\Microsoft\Windows\Edge\'
)
foreach ($tp in $taskPaths) {
    Get-ScheduledTask -TaskPath $tp -ErrorAction SilentlyContinue | Disable-ScheduledTask -ErrorAction SilentlyContinue
    Write-Host "  Tarefas em '$tp' desabilitadas." -ForegroundColor Green
}

# --- 7. Impedir reinstalacao via Windows Update ---
Write-Host "`n[7/7] Bloqueando reinstalacao via Windows Update..." -ForegroundColor Yellow
$wuPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"
if (-not (Test-Path $wuPath)) {
    New-Item -Path $wuPath -Force | Out-Null
}
Set-ItemProperty -Path $wuPath -Name "DoNotConnectToWindowsUpdateInternetLocations" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $wuPath -Name "ExcludeWUDriversInQualityUpdate" -Value 1 -Type DWord -Force

# Bloquear especificamente o Edge no Windows Update
$edgeWUPath = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
if (-not (Test-Path $edgeWUPath)) {
    New-Item -Path $edgeWUPath -Force | Out-Null
}
Set-ItemProperty -Path $edgeWUPath -Name "BlockEdgeUpdate" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

# Remover pasta de instalacao do Edge Update
$edgeUpdatePath = "${env:ProgramFiles(x86)}\Microsoft\EdgeUpdate"
if (Test-Path $edgeUpdatePath) {
    Remove-Item -Path $edgeUpdatePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Pasta EdgeUpdate removida." -ForegroundColor Green
}

Write-Host "`n=== Concluido! ===" -ForegroundColor Green
Write-Host "Reinicie o computador para aplicar todas as mudancas." -ForegroundColor Cyan
Write-Host "O Edge sera completamente desativado apos a reinicializacao." -ForegroundColor Cyan
