@echo off
echo ============================================
echo  DESATIVAR WINDOWS UPDATE
echo  Execute como Administrador
echo ============================================
echo.

echo [1/7] Parando servicos do Windows Update...
net stop wuauserv
net stop UsoSvc
net stop bits
net stop cryptsvc
echo Servicos parados.
echo.

echo [2/7] Desativando servicos do Windows Update...
sc config wuauserv start= disabled
sc config UsoSvc start= disabled
sc config bits start= demand
sc config cryptsvc start= auto
echo Servicos desativados.
echo.

echo [3/7] Configurando Group Policy (Local)...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" /v NoAutoUpdate /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" /v DisableWindowsUpdateAccess /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" /v DoNotConnectToWindowsUpdateInternetLocations /t REG_DWORD /d 1 /f
echo Group Policy configurado.
echo.

echo [4/7] Configurando Registro do Windows...
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" /v AUOptions /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" /v NoAutoUpdate /t REG_DWORD /d 1 /f
echo Registro configurado.
echo.

echo [5/7] Desativando tarefas agendadas do Windows Update...
schtasks /Change /TN "\Microsoft\Windows\WindowsUpdate\Scheduled Start" /Disable 2>nul
schtasks /Change /TN "\Microsoft\Windows\WindowsUpdate\sihpostreboot" /Disable 2>nul
echo Tarefas agendadas desativadas.
echo.

echo [6/7] Bloqueando acesso ao site do Windows Update...
netsh advfirewall firewall add rule name="Block Windows Update" dir=out action=block remoteip=13.107.4.50,13.107.5.52 enable=yes
netsh advfirewall firewall add rule name="Block Windows Update 2" dir=out action=block remoteip=20.190.159.0/24 enable=yes
echo Acesso bloqueado.
echo.

echo [7/7] Limpando cache do Windows Update...
del /q /f /s "%ALLUSERSPROFILE%\Application Data\Microsoft\Network\Downloader\qmgr*.dat" 2>nul
rd /s /q "%SystemRoot%\SoftwareDistribution" 2>nul
mkdir "%SystemRoot%\SoftwareDistribution" 2>nul
echo Cache limpo.
echo.

echo ============================================
echo  WINDOWS UPDATE DESATIVADO COM SUCESSO!
echo  Reinicie o computador para aplicar
echo  todas as alteracoes.
echo ============================================
echo.
pause