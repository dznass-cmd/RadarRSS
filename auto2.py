import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.3

# 1. Minimizar todas as janelas (Win+D)
pg.hotkey('win', 'd')
time.sleep(1)

# 2. Forcar foco no AyuGram via PowerShell
subprocess.run(["powershell", "-Command", (
    "Add-Type @' "
    "using System; using System.Runtime.InteropServices; "
    "public class W { "
    "[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); "
    "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); "
    "} "
    "'@; "
    "$p = Get-Process AyuGram -EA 0 | Select -First 1; "
    "if ($p) { "
    "[W]::SetForegroundWindow($p.MainWindowHandle); "
    "[W]::ShowWindow($p.MainWindowHandle, 9); "
    "Start-Sleep -Milliseconds 500; "
    "Write-Host 'AyuGram focado' "
    "} else { Write-Host 'AyuGram nao encontrado' }"
)], capture_output=True, text=True)
time.sleep(1)

# 3. Clicar no segundo canal (popMODS)
pg.click(200, 160)
time.sleep(2)

# 4. Screenshot
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\passo3.png')
print('Canal aberto')
