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

Write-Host "=== 3. Verificando a assinatura de release... ==="
$projectSigning = "android\signing.properties"
$userSigning = Join-Path $env:USERPROFILE ".config\RadarRSS\signing.properties"
$hasSigningEnv = $env:RADARRSS_STORE_FILE -and $env:RADARRSS_STORE_PASSWORD -and $env:RADARRSS_KEY_ALIAS -and $env:RADARRSS_KEY_PASSWORD
if (-not (Test-Path $projectSigning) -and -not (Test-Path $userSigning) -and -not $hasSigningEnv) {
    Write-Error "Configure uma chave privada em android\signing.properties ou $userSigning antes de compilar o APK release."
    exit 1
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
    Copy-Item $apkSource -Destination "release\Radar-RSS-0.2.0.apk" -Force
    
    $userPicturesDir = "$env:USERPROFILE\Pictures\RadarRSS"
    New-Item -ItemType Directory -Force -Path $userPicturesDir | Out-Null
    Copy-Item $apkSource -Destination "$userPicturesDir\Radar-RSS-0.2.0.apk" -Force

    Write-Host "=== Verificando assinatura do APK ==="
    $apksigner = "$sdkRoot\build-tools\34.0.0\apksigner.bat"
    & cmd /c "`"$apksigner`" verify --verbose `"release\Radar-RSS-0.2.0.apk`""

    Write-Host "SUCESSO! APK Release assinado gerado em release\Radar-RSS-0.2.0.apk"
    Get-Item "release\Radar-RSS-0.2.0.apk" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "Aviso: APK Release nao encontrado no caminho padrao."
}
