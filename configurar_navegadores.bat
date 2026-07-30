@echo off
echo ============================================
echo  CONFIGURAR NAVEGADORES
echo  Execute como Administrador
echo ============================================
echo.

echo [1/4] Definindo Chrome Beta como navegador padrao...
reg add "HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\ftp\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.htm\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.html\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.svg\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.xht\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.xhtml\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f
echo Chrome Beta definido como padrao.
echo.

echo [2/4] Desativando Microsoft Edge...
taskkill /F /IM msedge.exe 2>nul
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v AllowPrelaunch /t REG_DWORD /d 0 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v BackgroundModeEnabled /t REG_DWORD /d 0 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v HubsSidebarEnabled /t REG_DWORD /d 0 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\Startup\Boost" /v Enabled /t REG_DWORD /d 0 /f
echo Edge desativado.
echo.

echo [3/4] Desativando Edge como padrao...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.htm\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f 2>nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.html\UserChoice" /v ProgId /t REG_SZ /d ChromeBETAHTML /f 2>nul
echo Edge removido como padrao.
echo.

echo [4/4] Instalando Firefox Nightly...
echo Baixando Firefox Nightly...
curl -L -o "%TEMP%\FirefoxNightly.exe" "https://download.mozilla.org/?product=firefox-nightly-latest&os=win64&lang=pt-BR"
if exist "%TEMP%\FirefoxNightly.exe" (
    echo Instalando Firefox Nightly silenciosamente...
    "%TEMP%\FirefoxNightly.exe" /S
    timeout /t 15 /nobreak >nul
    del "%TEMP%\FirefoxNightly.exe" 2>nul
    echo Firefox Nightly instalado.
) else (
    echo ERRO: Falha ao baixar Firefox Nightly.
)
echo.

echo ============================================
echo  CONFIGURACAO CONCLUIDA!
echo  - Chrome Beta: Navegador padrao
echo  - Edge: Desativado
echo  - Firefox Nightly: Instalando/Instalado
echo  Reinicie o PC para aplicar todas mudancas.
echo ============================================
echo.
pause