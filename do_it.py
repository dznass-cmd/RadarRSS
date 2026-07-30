import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.2

def focus_ayugram():
    subprocess.run(["powershell", "-NoProfile", "-Command",
        "Add-Type 'using System;using System.Runtime.InteropServices;public class F{"
        "[DllImport(\"user32.dll\")]public static extern bool SetForegroundWindow(IntPtr h);"
        "[DllImport(\"user32.dll\")]public static extern bool ShowWindow(IntPtr h,int c);"
        "[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();}';"
        "$p=Get-Process AyuGram -EA 0|Select -First 1;"
        "if($p){[F]::ShowWindow($p.MainWindowHandle,3);"
        "sleep -m 200;"
        "[F]::SetForegroundWindow($p.MainWindowHandle);"
        "sleep -m 300;"
        "$h=[F]::GetForegroundWindow();"
        "if($h -eq $p.MainWindowHandle){'OK'}else{'FAIL'}}"
    ], capture_output=True, text=True, timeout=10)

# 1. Focar AyuGram
r = focus_ayugram()
print(f"Foco: {r}")

# 2. Clicar na posicao do segundo canal na sidebar
# Posicao baseada em janela maximizada: sidebar x~160, canais y~240
pg.click(160, 240)
time.sleep(2)

# 3. Screenshot pra ver
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\step2.png')

# 4. Curtir - clicar na area do post (centro da tela)
# No Telegram, o botao de like fica no canto inferior esquerdo do post
pg.click(500, 500)
time.sleep(0.5)

# 5. Screenshot
s2 = pg.screenshot()
s2.save('C:\\Users\\Dznas\\Documents\\Default Project\\step3.png')

# 6. Focar AyuGram de novo
focus_ayugram()
time.sleep(0.3)

# 7. Colar comentario via clipboard
text = "Muito bom!"
subprocess.run(["powershell", "-NoProfile", "-Command",
    "Add-Type -AssemblyName System.Windows.Forms;"
    "[System.Windows.Forms.Clipboard]::SetText('" + text + "')"
], capture_output=True, timeout=5)
time.sleep(0.2)

# 8. Clicar na caixa de mensagem (rodape do canal, ~centro)
pg.click(800, 780)
time.sleep(0.3)
pg.hotkey('ctrl', 'v')
time.sleep(0.3)
pg.press('enter')
time.sleep(0.5)

# 9. Screenshot final
s3 = pg.screenshot()
s3.save('C:\\Users\\Dznas\\Documents\\Default Project\\done.png')
print('Pronto!')
