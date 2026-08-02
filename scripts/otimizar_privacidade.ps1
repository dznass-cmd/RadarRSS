#Requires -RunAsAdministrator

$ErrorActionPreference = "SilentlyContinue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " OTIMIZANDO PRIVACIDADE E DESATIVANDO TELEMETRIA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ===============================================================
# 1. DESATIVAR CORTANA
# ===============================================================
Write-Host "[1/6] Desativando Cortana..." -ForegroundColor Yellow

$cortanaPaths = @(
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search",
    "HKLM:\SOFTWARE\Microsoft\PolicyManager\current\device\Experience"
)

foreach ($path in $cortanaPaths) {
    New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search" -Name "AllowCortana" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search" -Name "CortanaEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search" -Name "CortanaConsent" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\PolicyManager\current\device\Experience" -Name "AllowCortana" -Value 0 -Type DWord

Get-AppxPackage -AllUsers *Microsoft.549981C3F5F10* | Remove-AppxPackage
Get-AppxPackage -AllUsers *Cortana* | Remove-AppxPackage
Get-AppxProvisionedPackage -Online | Where-Object { $_.DisplayName -like "*Cortana*" } | Remove-AppxProvisionedPackage -Online
Get-AppxProvisionedPackage -Online | Where-Object { $_.DisplayName -like "*Microsoft.549981C3F5F10*" } | Remove-AppxProvisionedPackage -Online

Write-Host "  Cortana desativada e removida." -ForegroundColor Green

# ===============================================================
# 2. DESATIVAR BING SEARCH NO MENU INICIAR
# ===============================================================
Write-Host "[2/6] Desativando Bing Search no Menu Iniciar..." -ForegroundColor Yellow

$bingPaths = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search"
)

foreach ($path in $bingPaths) {
    New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search" -Name "BingSearchEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search" -Name "AllowSearchToUseLocation" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search" -Name "CortanaConsent" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search" -Name "DisableWebSearch" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search" -Name "ConnectedSearchUseWeb" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search" -Name "AllowSearchToUseLocation" -Value 0 -Type DWord

Write-Host "  Bing Search desativado." -ForegroundColor Green

# ===============================================================
# 3. DESATIVAR ACTIVITY HISTORY
# ===============================================================
Write-Host "[3/6] Desativando Activity History..." -ForegroundColor Yellow

$activityPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"
New-Item -Path $activityPath -Force | Out-Null
Set-ItemProperty -Path $activityPath -Name "EnableActivityFeed" -Value 0 -Type DWord
Set-ItemProperty -Path $activityPath -Name "PublishUserActivities" -Value 0 -Type DWord
Set-ItemProperty -Path $activityPath -Name "UploadUserActivities" -Value 0 -Type DWord

Write-Host "  Activity History desativado." -ForegroundColor Green

# ===============================================================
# 4. DESATIVAR COLETA DE DADOS E DIAGTRACK
# ===============================================================
Write-Host "[4/6] Desativando DiagTrack e coleta de dados..." -ForegroundColor Yellow

$telemetryServices = @(
    "DiagTrack",
    "diagnosticshub.standardcollector.service",
    "dmwappushservice",
    "WpcMonSvc",
    "PcaSvc",
    "DoSvc",
    "WAPUService",
    "lfsvc"
)

foreach ($svc in $telemetryServices) {
    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
}

$telemetryDataPaths = @(
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection",
    "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Policies\DataCollection"
)

foreach ($path in $telemetryDataPaths) {
    New-Item -Path $path -Force | Out-Null
    Set-ItemProperty -Path $path -Name "AllowTelemetry" -Value 0 -Type DWord
}

Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "DoNotShowFeedbackNotifications" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "LimitDiagnosticLogCollection" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "AllowDeviceNameInTelemetry" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "DisableTelemetry" -Value 1 -Type DWord

Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Device Metadata" -Name "PreventDeviceMetadataFromNetwork" -Value 1 -Type DWord

$advertisingPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo"
New-Item -Path $advertisingPath -Force | Out-Null
Set-ItemProperty -Path $advertisingPath -Name "Enabled" -Value 0 -Type DWord

$inputPath = "HKCU:\Software\Microsoft\InputPersonalization"
New-Item -Path $inputPath -Force | Out-Null
Set-ItemProperty -Path $inputPath -Name "RestrictImplicitTextCollection" -Value 1 -Type DWord
Set-ItemProperty -Path $inputPath -Name "RestrictImplicitInkCollection" -Value 1 -Type DWord

$privacyPath = "HKCU:\Software\Microsoft\Personalization\Settings"
New-Item -Path $privacyPath -Force | Out-Null
Set-ItemProperty -Path $privacyPath -Name "AcceptedPrivacyPolicy" -Value 0 -Type DWord

Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessAccountInfo" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessCalendar" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessCamera" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessContacts" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessEmail" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessLocation" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessMessaging" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessMicrophone" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessMotion" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessNotifications" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessPhone" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessRadios" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessTasks" -Value 2 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy" -Name "LetAppsAccessTrustedDevices" -Value 2 -Type DWord -Force

$siufPath = "HKCU:\Software\Microsoft\Siuf\Rules"
New-Item -Path $siufPath -Force | Out-Null
Set-ItemProperty -Path $siufPath -Name "NumberOfSIUFInPeriod" -Value 0 -Type DWord
Set-ItemProperty -Path $siufPath -Name "PeriodInNanoSeconds" -Value 0 -Type DWord

Get-ScheduledTask -TaskPath "*\Microsoft\Windows\Application Experience\*" -ErrorAction SilentlyContinue | Disable-ScheduledTask
Get-ScheduledTask -TaskPath "*\Microsoft\Windows\Customer Experience Improvement Program\*" -ErrorAction SilentlyContinue | Disable-ScheduledTask
Get-ScheduledTask -TaskPath "*\Microsoft\Windows\DiskDiagnostic\*" -ErrorAction SilentlyContinue | Disable-ScheduledTask
Get-ScheduledTask -TaskPath "*\Microsoft\Windows\Feedback\Siuf\*" -ErrorAction SilentlyContinue | Disable-ScheduledTask

Write-Host "  DiagTrack e coleta de dados desativados." -ForegroundColor Green

# ===============================================================
# 5. DESATIVAR TELEMETRIA DO OFFICE
# ===============================================================
Write-Host "[5/6] Desativando telemetria do Office..." -ForegroundColor Yellow

$officeVersions = @("16.0", "15.0")

foreach ($ver in $officeVersions) {
    $officeCommon = "HKCU:\Software\Policies\Microsoft\Office\$ver\Common"
    $officePrivacy = "HKCU:\Software\Policies\Microsoft\Office\$ver\Common\Privacy"

    New-Item -Path $officeCommon -Force | Out-Null
    New-Item -Path $officePrivacy -Force | Out-Null

    Set-ItemProperty -Path $officeCommon -Name "SendCustomerData" -Value 0 -Type DWord
    Set-ItemProperty -Path $officeCommon -Name "qmenable" -Value 0 -Type DWord
    Set-ItemProperty -Path $officeCommon -Name "updatereliabilitydata" -Value 0 -Type DWord
    Set-ItemProperty -Path $officeCommon -Name "disableboottoofficestart" -Value 1 -Type DWord

    Set-ItemProperty -Path $officePrivacy -Name "disconnectedstate" -Value 3 -Type DWord
    Set-ItemProperty -Path $officePrivacy -Name "controllerconnectedservicesenabled" -Value 0 -Type DWord
    Set-ItemProperty -Path $officePrivacy -Name "disablecloudfileanalysis" -Value 1 -Type DWord
    Set-ItemProperty -Path $officePrivacy -Name "showsendcustomerdataoptin" -Value 0 -Type DWord
    Set-ItemProperty -Path $officePrivacy -Name "usercontentdisabled" -Value 1 -Type DWord
    Set-ItemProperty -Path $officePrivacy -Name "downloadcontentdisabled" -Value 1 -Type DWord
    Set-ItemProperty -Path $officePrivacy -Name "sendpersonalinfo" -Value 0 -Type DWord

    $officeNonPolicy = "HKCU:\Software\Microsoft\Office\$ver\Common"
    New-Item -Path $officeNonPolicy -Force | Out-Null
    Set-ItemProperty -Path $officeNonPolicy -Name "SendPersonalInfo" -Value 0 -Type DWord

    $officeLync = "HKCU:\Software\Policies\Microsoft\Office\$ver\Lync"
    New-Item -Path $officeLync -Force | Out-Null
    Set-ItemProperty -Path $officeLync -Name "disableautomaticsendtracing" -Value 1 -Type DWord

    foreach ($app in @("Word", "Excel", "PowerPoint", "Outlook", "OneNote", "Access", "Publisher", "Groove")) {
        $officeApp = "HKCU:\Software\Policies\Microsoft\Office\$ver\$app\Options\General"
        New-Item -Path $officeApp -Force | Out-Null
        Set-ItemProperty -Path $officeApp -Name "DisableBootToOfficeStart" -Value 1 -Type DWord
    }

    $officeFirstRun = "HKCU:\Software\Policies\Microsoft\Office\$ver\Common\General"
    New-Item -Path $officeFirstRun -Force | Out-Null
    Set-ItemProperty -Path $officeFirstRun -Name "ShownFirstRunOptin" -Value 1 -Type DWord
    Set-ItemProperty -Path $officeFirstRun -Name "DisableBootToOfficeStart" -Value 1 -Type DWord
}

Write-Host "  Telemetria do Office desativada." -ForegroundColor Green

# ===============================================================
# 6. DESATIVAR TELEMETRIA DE TERCEIROS E SERVIÇOS EXTRAS
# ===============================================================
Write-Host "[6/6] Desativando telemetria adicional..." -ForegroundColor Yellow

$nvTelemetry = @(
    "NvTelemetryContainer",
    "NVIDIA Display Container LS"
)
foreach ($svc in $nvTelemetry) {
    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
}

$nvScheduledTasks = @(
    "*\NvTmRep*",
    "*\NVIDIA GeForce Experience\*Telemetry*"
)
foreach ($task in $nvScheduledTasks) {
    Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue | Disable-ScheduledTask
}

Set-ItemProperty -Path "HKLM:\SOFTWARE\NVIDIA Corporation\Global\FTS" -Name "EnableFTS" -Value 0 -Type DWord -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\NVIDIA Corporation\NvControlPanel2\Client" -Name "OptInOrOutPreference" -Value 0 -Type DWord -Force

Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NvTelemetryContainer" -Name "Start" -Value 4 -Type DWord -Force

Get-ScheduledTask -TaskName "GoogleUpdateTaskMachine*" -ErrorAction SilentlyContinue | Disable-ScheduledTask
Get-ScheduledTask -TaskName "GoogleUpdateTaskUser*" -ErrorAction SilentlyContinue | Disable-ScheduledTask

$chromePath = "HKLM:\SOFTWARE\Policies\Google\Chrome"
New-Item -Path $chromePath -Force | Out-Null
Set-ItemProperty -Path $chromePath -Name "MetricsReportingEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path $chromePath -Name "ChromeCleanupReportingEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path $chromePath -Name "SafeBrowsingExtendedReportingEnabled" -Value 0 -Type DWord

Write-Host "  Telemetria adicional desativada." -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " PRIVACIDADE OTIMIZADA COM SUCESSO!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  + Cortana: Desativada e removida" -ForegroundColor White
Write-Host "  + Bing Search no Iniciar: Desativado" -ForegroundColor White
Write-Host "  + Activity History: Desativado" -ForegroundColor White
Write-Host "  + DiagTrack / Telemetria: Desativado" -ForegroundColor White
Write-Host "  + Telemetria do Office: Desativada" -ForegroundColor White
Write-Host "  + Telemetria NVIDIA/Chrome: Desativada" -ForegroundColor White
Write-Host ""
Write-Host "  Reinicie o PC para aplicar todas as mudancas." -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione ENTER para fechar"
