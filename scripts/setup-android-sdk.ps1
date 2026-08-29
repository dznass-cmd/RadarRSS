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

Write-Host "=== 3. Garantindo Keystore de Release Oficial... ==="
$keystorePath = "android\app\radar-rss-release.keystore"
$keytool = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot\bin\keytool.exe"

if (-not (Test-Path $keystorePath)) {
    & $keytool -genkeypair -v `
      -keystore $keystorePath `
      -alias radarrss `
      -keyalg RSA `
      -keysize 2048 `
      -validity 10000 `
      -storepass "RadarRss2026Secure!" `
      -keypass "RadarRss2026Secure!" `
      -dname "CN=Radar RSS, OU=Radar RSS Production, O=Radar RSS OpenSource, L=Sao Paulo, ST=SP, C=BR"
}

Write-Host "=== 4. Configurando local.properties no projeto Android... ==="
$escapedSdkRoot = $sdkRoot.Replace("\", "\\")
"sdk.dir=$escapedSdkRoot" | Out-File -FilePath "android\local.properties" -Encoding ascii

Write-Host "=== 5. Compilando o APK Release Assinado (assembleRelease)... ==="
Set-Location android
& .\gradlew.bat assembleRelease
Set-Location ..

Write-Host "=== 6. Verificando e Assinando APK Release... ==="
$apkSource = "android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkSource) {
    New-Item -ItemType Directory -Force -Path "release" | Out-Null
    Copy-Item $apkSource -Destination "release\Radar-RSS-0.0.1.apk" -Force
    
    $userPicturesDir = "$env:USERPROFILE\Pictures\RadarRSS"
    New-Item -ItemType Directory -Force -Path $userPicturesDir | Out-Null
    Copy-Item $apkSource -Destination "$userPicturesDir\Radar-RSS-0.0.1.apk" -Force

    Write-Host "=== Verificando assinatura do APK ==="
    $apksigner = "$sdkRoot\build-tools\34.0.0\apksigner.bat"
    & cmd /c "`"$apksigner`" verify --verbose `"release\Radar-RSS-0.0.1.apk`""

    Write-Host "SUCESSO! APK Release assinado gerado em release\Radar-RSS-0.0.1.apk"
    Get-Item "release\Radar-RSS-0.0.1.apk" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "Aviso: APK Release nao encontrado no caminho padrao."
}
