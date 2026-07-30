import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.2

# 1. Maximizar AyuGram e forcar foco
subprocess.run(["powershell", "-Command", (
    "Add-Type ' "
    "using System; using System.Runtime.InteropServices; "
    "public class W { "
    "[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); "
    "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); "
    "} ' ; "
    "$p = Get-Process AyuGram -EA 0 | Select -First 1; "
    "[W]::ShowWindow($p.MainWindowHandle, 3); "
    "Start-Sleep 300; "
    "[W]::SetForegroundWindow($p.MainWindowHandle); "
    "Start-Sleep 500"
)], capture_output=True, text=True)
time.sleep(1)

# 2. Screenshot pra calibrar
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\max.png')
w, h = s.size
print(f"Tela: {w}x{h}")

# 3. Clicar no segundo canal da lista (popMODS)
# Na sidebar de canais, o segundo item fica em ~y=240 (a partir do topo da janela maximizada)
pg.click(160, 240)
time.sleep(2)

# 4. Screenshot do canal
s2 = pg.screenshot()
s2.save('C:\\Users\\Dznas\\Documents\\Default Project\\canal2.png')
print('Canal aberto')
