$ErrorActionPreference = "Stop"

$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManager = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "=== 1. Gravando arquivos de licenca oficiais do Android SDK ==="
$licDir = "$sdkRoot\licenses"
New-Item -ItemType Directory -Force -Path $licDir | Out-Null

$sdkLicenses = @"
8933ed6d1053b84d0b8bed0d1614834a661de51d
d56f5187479451eabf01fb78af6dfcb131a6481e
24333f8a63b6825ea9c5514f83c2829b004d1fee
84831b9409646a53ee4421a4b9263e40f9441617
"@
$sdkLicenses | Out-File -FilePath "$licDir\android-sdk-license" -Encoding ascii

$previewLicenses = @"
84831b9409646a53ee4421a4b9263e40f9441617
"@
$previewLicenses | Out-File -FilePath "$licDir\android-sdk-preview-license" -Encoding ascii

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot

Write-Host "=== 2. Instalando platforms;android-34 e build-tools;34.0.0... ==="
& cmd /c "`"$sdkManager`" `"platform-tools`" `"platforms;android-34`" `"build-tools;34.0.0`""

Write-Host "=== 3. Configurando local.properties no projeto Android... ==="
$escapedSdkRoot = $sdkRoot.Replace("\", "\\")
"sdk.dir=$escapedSdkRoot" | Out-File -FilePath "android\local.properties" -Encoding ascii

Write-Host "=== 4. Compilando o APK (assembleDebug)... ==="
Set-Location android
& .\gradlew.bat assembleDebug

Write-Host "=== 5. Verificando APK gerado... ==="
Set-Location ..
$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkSource) {
    New-Item -ItemType Directory -Force -Path "release" | Out-Null
    Copy-Item $apkSource -Destination "release\Radar-RSS-0.0.1.apk" -Force
    Copy-Item $apkSource -Destination "$env:USERPROFILE\Pictures\RadarRSS\Radar-RSS-0.0.1.apk" -Force
    Write-Host "SUCESSO! APK gerado em release\Radar-RSS-0.0.1.apk"
    Get-Item "release\Radar-RSS-0.0.1.apk" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "Aviso: APK nao encontrado no caminho padrao."
}
