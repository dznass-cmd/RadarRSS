import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.3

# Copiar texto pro clipboard
text = "Haha, muito bom!"
subprocess.run(["powershell", "-Command",
    "Add-Type -AssemblyName System.Windows.Forms; "
    "[System.Windows.Forms.Clipboard]::SetText('" + text + "')"
], capture_output=True)
time.sleep(0.3)

# 1. Curtir - botao do coracao com "2" (x=713, y=203)
pg.click(713, 203)
time.sleep(0.5)

# 2. Clicar no campo de mensagem "Broadcast a message..."
pg.click(940, 665)
time.sleep(0.5)

# 3. Colar texto
pg.hotkey('ctrl', 'v')
time.sleep(0.5)

# 4. Enviar
pg.press('enter')
time.sleep(1)

s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\feito2.png')
print('Feito!')
