import pyautogui as pg
import time
import subprocess
import ctypes

pg.FAILSAFE = False
pg.PAUSE = 0.2

# Usar ctypes direto pra garantir foco
user32 = ctypes.windll.user32

def focus_ayugram():
    import win32process, win32gui
    # Encontrar handle por titulo
    def callback(hwnd, results):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            if 'AyuGram' in title or 'Telegram' in title:
                results.append(hwnd)
    results = []
    win32gui.EnumWindows(callback, results)
    if results:
        hwnd = results[0]
        win32gui.ShowWindow(hwnd, 9)  # SW_RESTORE
        time.sleep(0.3)
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.5)
        return True
    return False

# Tentar sem win32gui se nao tiver
try:
    import win32gui, win32process
    has_win32 = True
except:
    has_win32 = False

if has_win32:
    ok = focus_ayugram()
    print(f"Foco: {ok}")
else:
    # Fallback: usar PowerShell
    subprocess.run(["powershell", "-NoProfile", "-Command",
        "Add-Type 'using System;using System.Runtime.InteropServices;public class F{"
        "[DllImport(\"user32.dll\")]public static extern bool SetForegroundWindow(IntPtr h);"
        "[DllImport(\"user32.dll\")]public static extern bool ShowWindow(IntPtr h,int c);}';"
        "$p=Get-Process AyuGram -EA 0|Select -First 1;"
        "if($p){[F]::ShowWindow($p.MainWindowHandle,9);sleep -m 300;"
        "[F]::SetForegroundWindow($p.MainWindowHandle);'OK'}else{'ERRO'}"
    ], capture_output=True, text=True, timeout=10)
    print("Foco via PowerShell")

time.sleep(1)

# Verificar foco atual
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\foco_check.png')

# Se nao esta no AyuGram (fundo nao e cinza escuro do Telegram), tentar de novo
# Assumir que AyuGram esta aberto e na aba Canais
# Clicar na segunda aba "Canais" na sidebar esquerda (x=37, y=175)
pg.click(37, 175)
time.sleep(1.5)

# Screenshot
s2 = pg.screenshot()
s2.save('C:\\Users\\Dznas\\Documents\\Default Project\\canal_aberto.png')
print('Canal aberto')

# Agora clicar no primeiro canal da lista (x=200, y=180)
pg.click(200, 180)
time.sleep(2)

# Screenshot
s3 = pg.screenshot()
s3.save('C:\\Users\\Dznas\\Documents\\Default Project\\no_canal.png')
print('No canal')

# Curtir - clicar no espaco vazio do post pra ver se tem botao de like
# No Telegram, o like fica no hover do post, canto inferior esquerdo
# Primeiro passar o mouse sobre o post pra aparecer os botoes
pg.moveTo(700, 400)
time.sleep(0.5)

# Screenshot pra ver botoes
s4 = pg.screenshot()
s4.save('C:\\Users\\Dznas\\Documents\\Default Project\\hover.png')

# Clicar no like (coracao) - geralmente canto inferior esquerdo do post
pg.click(700, 400)
time.sleep(0.5)

# Copiar texto
text = "Muito bom!"
subprocess.run(["powershell", "-NoProfile", "-Command",
    "Add-Type -AssemblyName System.Windows.Forms;"
    "[System.Windows.Forms.Clipboard]::SetText('" + text + "')"
], capture_output=True, timeout=5)
time.sleep(0.2)

# Clicar na caixa de mensagem
pg.click(900, 780)
time.sleep(0.5)
pg.hotkey('ctrl', 'v')
time.sleep(0.3)
pg.press('enter')
time.sleep(1)

# Screenshot final
s5 = pg.screenshot()
s5.save('C:\\Users\\Dznas\\Documents\\Default Project\\final_final.png')
print('Feito!')
