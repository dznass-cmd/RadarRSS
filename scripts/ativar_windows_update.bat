@echo off
echo ============================================
echo  ATIVAR WINDOWS UPDATE
echo  Execute como Administrador
echo ============================================
echo.

echo [1/6] Removendo regras de firewall...
netsh advfirewall firewall delete rule name="Block Windows Update" 2>nul
netsh advfirewall firewall delete rule name="Block Windows Update 2" 2>nul
echo Firewall limpo.
echo.

echo [2/6] Ativando servicos do Windows Update...
sc config wuauserv start= auto
sc config UsoSvc start= auto
sc config bits start= delayed-auto
sc config cryptsvc start= auto
net start wuauserv
net start UsoSvc
net start bits
net start cryptsvc
echo Servicos ativados.
echo.

echo [3/6] Removendo Group Policy...
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" /v NoAutoUpdate /f 2>nul
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" /v DisableWindowsUpdateAccess /f 2>nul
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" /v DoNotConnectToWindowsUpdateInternetLocations /f 2>nul
echo Group Policy removido.
echo.

echo [4/6] Limpando Registro do Windows...
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" /v AUOptions /f 2>nul
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" /v NoAutoUpdate /f 2>nul
echo Registro limpo.
echo.

echo [5/6] Ativando tarefas agendadas do Windows Update...
schtasks /Change /TN "\Microsoft\Windows\WindowsUpdate\Scheduled Start" /Enable 2>nul
schtasks /Change /TN "\Microsoft\Windows\WindowsUpdate\sihpostreboot" /Enable 2>nul
echo Tarefas agendadas ativadas.
echo.

echo [6/6] Iniciando verificacao de updates...
wuauclt /detectnow /resetauthorization
wuauclt /updatenow
echo Verificacao iniciada.
echo.

echo ============================================
echo  WINDOWS UPDATE ATIVADO COM SUCESSO!
echo  Reinicie o computador para aplicar
echo  todas as alteracoes.
echo ============================================
echo.
pause