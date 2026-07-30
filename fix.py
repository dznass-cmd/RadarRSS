import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.3

# 1. Fechar navegador com Ctrl+W
pg.hotkey('ctrl', 'w')
time.sleep(0.5)

# 2. Forcar foco no AyuGram
subprocess.run(["powershell", "-Command", (
    "Add-Type ' "
    "using System; using System.Runtime.InteropServices; "
    "public class W { "
    "[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); "
    "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); "
    "} ' ; "
    "$p = Get-Process AyuGram -EA 0 | Select -First 1; "
    "if ($p) { "
    "[W]::ShowWindow($p.MainWindowHandle, 9); "
    "Start-Sleep -Milliseconds 300; "
    "[W]::SetForegroundWindow($p.MainWindowHandle); "
    "Start-Sleep -Milliseconds 500; "
    "Write-Host 'OK' "
    "} else { Write-Host 'ERRO' }"
)], capture_output=True, text=True)
time.sleep(1)

# 3. Screenshot
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\voltou.png')
print('Voltou pro AyuGram')
