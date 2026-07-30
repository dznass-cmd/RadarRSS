#Requires -RunAsAdministrator
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " CONFIGURANDO NAVEGADORES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Matar Edge
Write-Host "[1/4] Fechando Microsoft Edge..." -ForegroundColor Yellow
Get-Process -Name msedge -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Desativar Edge via policy
Write-Host "[2/4] Desativando Microsoft Edge..." -ForegroundColor Yellow
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Name "AllowPrelaunch" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Name "BackgroundModeEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Name "HideFirstRunExperience" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Name "DefaultBrowserSettingEnabled" -Value 0 -Type DWord

# Desabilitar tarefas do Edge
Get-ScheduledTask -TaskPath "*\Microsoft\Edge*" -ErrorAction SilentlyContinue | Disable-ScheduledTask -ErrorAction SilentlyContinue

# Desabilitar services do Edge
Get-Service -Name "edgeupdate", "edgeupdatem" -ErrorAction SilentlyContinue | Set-Service -StartupType Disabled -ErrorAction SilentlyContinue
Write-Host "Edge desativado." -ForegroundColor Green

# 3. Definir Chrome Beta como padrao
Write-Host "[3/4] Abrindo configuracoes de navegador padrao..." -ForegroundColor Yellow
Write-Host "NA JANELA QUE ABRIU:" -ForegroundColor Red
Write-Host "  1. Clique em 'Web browser' ou 'Navegador da Web'" -ForegroundColor White
Write-Host "  2. Selecione 'Google Chrome Beta'" -ForegroundColor White
Write-Host "  3. Confirme com 'OK'" -ForegroundColor White
Start-Process "ms-settings:defaultapps"
Write-Host "Pressione ENTER quando terminar de configurar o navegador padrao..." -ForegroundColor Yellow
Read-Host

# 4. Baixar e instalar Firefox Nightly
Write-Host "[4/4] Baixando Firefox Nightly..." -ForegroundColor Yellow
$url = "https://download.mozilla.org/?product=firefox-nightly-latest&os=win64&lang=pt-BR"
$output = "$env:TEMP\FirefoxNightlySetup.exe"
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing -TimeoutSec 300
    Write-Host "Instalando Firefox Nightly..." -ForegroundColor Yellow
    Start-Process -FilePath $output -ArgumentList "/S" -Wait
    Remove-Item $output -Force -ErrorAction SilentlyContinue
    Write-Host "Firefox Nightly instalado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao instalar Firefox Nightly: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " CONCLUIDO!" -ForegroundColor Cyan
Write-Host " - Edge: Desativado" -ForegroundColor White
Write-Host " - Chrome Beta: Configurado como padrao" -ForegroundColor White
Write-Host " - Firefox Nightly: Instalado" -ForegroundColor White
Write-Host " Reinicie o PC para aplicar todas mudancas." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione ENTER para fechar"