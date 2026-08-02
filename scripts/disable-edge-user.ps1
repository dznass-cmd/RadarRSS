# ============================================================
# Script: disable-edge-user.ps1
# Descricao: Configuracoes de nivel de usuario para desativar Edge
# Nao requer privilegios de administrador
# ============================================================

Write-Host "=== Configuracoes de Usuario para Edge ===" -ForegroundColor Cyan

# --- 1. Desativar Edge como navegador padrao (HKCU) ---
Write-Host "`n[1/4] Desativando Edge como navegador padrao..." -ForegroundColor Yellow

$edgeUserPolicyPath = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
if (-not (Test-Path $edgeUserPolicyPath)) {
    New-Item -Path $edgeUserPolicyPath -Force | Out-Null
}

$userPolicies = @{
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
    "AIAccessEnabled"              = 0
    "StartupBoostEnabled"          = 0
}

foreach ($key in $userPolicies.Keys) {
    Set-ItemProperty -Path $edgeUserPolicyPath -Name $key -Value $userPolicies[$key] -Type DWord -Force
}
Write-Host "  Politicas de usuario aplicadas." -ForegroundColor Green

# --- 2. Desativar notificacoes do Edge ---
Write-Host "`n[2/4] Desativando notificacoes..." -ForegroundColor Yellow
$edgeNotifPath = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
Set-ItemProperty -Path $edgeNotifPath -Name "EdgeShoppingAssistantEnabled" -Value 0 -Type DWord -Force

# Desativar push notifications
$edgePushPath = "HKCU:\SOFTWARE\Microsoft\Edge\Profile\Default"
if (Test-Path $edgePushPath) {
    Set-ItemProperty -Path $edgePushPath -Name "DefaultPushSetting" -Value 2 -Type DWord -Force -ErrorAction SilentlyContinue
}
Write-Host "  Notificacoes desativadas." -ForegroundColor Green

# --- 3. Desativar extensoes automaticas ---
Write-Host "`n[3/4] Desativando extensoes automaticas..." -ForegroundColor Yellow
$edgeExtPath = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
Set-ItemProperty -Path $edgeExtPath -Name "ExtensionInstallBlocklist" -Value "*" -Type String -Force
Set-ItemProperty -Path $edgeExtPath -Name "ExtensionInstallForcelist" -Value "" -Type String -Force
Write-Host "  Extensoes bloqueadas." -ForegroundColor Green

# --- 4. Desativar sincronizacao ---
Write-Host "`n[4/4] Desativando sincronizacao..." -ForegroundColor Yellow
Set-ItemProperty -Path $edgeExtPath -Name "SyncDisabled" -Value 1 -Type DWord -Force
Set-ItemProperty -Path $edgeExtPath -Name "SigninAllowed" -Value 0 -Type DWord -Force
Write-Host "  Sincronizacao desativada." -ForegroundColor Green

Write-Host "`n=== Configuracoes de usuario aplicadas ===" -ForegroundColor Green
Write-Host "Reinicie o Edge (se aberto) para aplicar." -ForegroundColor Cyan
