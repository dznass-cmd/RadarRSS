import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.3

# 1. Restaurar AyuGram via PowerShell
subprocess.run(["powershell", "-Command", (
    "Add-Type ' "
    "using System; using System.Runtime.InteropServices; "
    "public class W { "
    "[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); "
    "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); "
    "[DllImport(\"user32.dll\")] public static extern bool IsIconic(IntPtr h); "
    "} ' ; "
    "$p = Get-Process AyuGram -EA 0 | Select -First 1; "
    "if ($p) { "
    "if ([W]::IsIconic($p.MainWindowHandle)) { "
    "[W]::ShowWindow($p.MainWindowHandle, 9); "
    "Start-Sleep -Milliseconds 300 "
    "}; "
    "[W]::SetForegroundWindow($p.MainWindowHandle); "
    "Start-Sleep -Milliseconds 500; "
    "Write-Host 'OK' "
    "} else { Write-Host 'ERRO' }"
)], capture_output=True, text=True)
time.sleep(1)

# 2. Screenshot pra ver estado
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\restaurado.png')
print('Restaurado')
