import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.3

# 1. Forcar foco no AyuGram via PowerShell
subprocess.run(["powershell", "-Command", (
    "Add-Type @' using System; using System.Runtime.InteropServices; "
    "public class W { [DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); "
    "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); } '@; "
    "$p = Get-Process AyuGram -EA 0 | Select -First 1; "
    "if ($p) { [W]::SetForegroundWindow($p.MainWindowHandle); [W]::ShowWindow($p.MainWindowHandle, 9); "
    "Write-Host 'OK' }"
)], capture_output=True, text=True)
time.sleep(1)

# 2. Clicar no segundo canal da lista (popMODS ~ y=160)
pg.click(200, 160)
time.sleep(2)

# 3. Screenshot pra ver se abriu
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\canal_aberto.png')

# 4. Curtir post recente (like button ~ x=400, y=500 area)
pg.click(400, 500)
time.sleep(0.5)

# 5. Copiar comentario pro clipboard e colar
text = "Obrigado pelo conteudo!"
subprocess.run(["powershell", "-Command",
    f"Add-Type -AssemblyName System.Windows.Forms; "
    f"[System.Windows.Forms.Clipboard]::SetText('{text}')"
], capture_output=True)
time.sleep(0.3)

# 6. Clicar na caixa de mensagem (rodape)
pg.click(700, 780)
time.sleep(0.5)
pg.hotkey('ctrl', 'v')
time.sleep(0.5)
pg.press('enter')
time.sleep(1)

# 7. Screenshot final
s2 = pg.screenshot()
s2.save('C:\\Users\\Dznas\\Documents\\Default Project\\feito.png')
print('Feito!')
