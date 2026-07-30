$ErrorActionPreference = "Stop"

# Disable Windows Defender
Write-Host "Disabling Windows Defender..." -ForegroundColor Yellow

# Disable real-time monitoring
Set-MpPreference -DisableRealTimeMonitoring $true -ErrorAction SilentlyContinue

# Disable behavior monitoring
Set-MpPreference -DisableBehaviorMonitoring $true -ErrorAction SilentlyContinue

# Disable scan on startup
Set-MpPreference -DisableScanningNetworkDrives $true -ErrorAction SilentlyContinue

# Disable cloud-based protection
Set-MpPreference -DisableCloudProtection $true -ErrorAction SilentlyContinue

# Disable submission of samples
Set-MpPreference -SubmitSamplesConsent 2 -ErrorAction SilentlyContinue

# Turn off Windows Defender Service
Stop-Service -Name "WinDefend" -Force -ErrorAction SilentlyContinue
Set-Service -Name "WinDefend" -StartupType "Disabled" -ErrorAction SilentlyContinue

Write-Host "Windows Defender has been disabled." -ForegroundColor Green