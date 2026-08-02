@echo off
echo ============================================
echo  Converter Windows 11 IoT Enterprise LTSC
echo  Evaluation para Full Version
echo ============================================
echo.

echo [1/6] Re-instalando arquivos de licenca...
cscript.exe %windir%\system32\slmgr.vbs /rilc
echo.

echo [2/6] Removendo chave do produto...
cscript.exe %windir%\system32\slmgr.vbs /upk >nul 2>&1
echo OK
echo.

echo [3/6] Limpando KMS...
cscript.exe %windir%\system32\slmgr.vbs /ckms >nul 2>&1
echo OK
echo.

echo [4/6] Removendo chave do registro...
cscript.exe %windir%\system32\slmgr.vbs /cpky >nul 2>&1
echo OK
echo.

echo [5/6] Instalando chave generica IoT Enterprise LTSC...
cscript.exe %windir%\system32\slmgr.vbs /ipk KBN8V-HFGQ4-MGXVD-347P6-PDQGT
echo.

echo [6/6] Iniciando servicos...
sc config LicenseManager start= auto & net start LicenseManager
sc config wuauserv start= auto & net start wuauserv
echo.

echo ============================================
echo  Processo concluido!
echo  Agora va em Configuracoes ^> Sistema ^>
echo  Ativacao ^> Alterar chave do produto
echo  e insira sua chave genuina.
echo ============================================
pause
