import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.3

# Copiar texto pro clipboard
text = "Conteudo incrivel, obrigado por compartilhar!"
subprocess.run(["powershell", "-Command",
    "Add-Type -AssemblyName System.Windows.Forms; "
    "[System.Windows.Forms.Clipboard]::SetText('" + text + "')"
], capture_output=True)
time.sleep(0.3)

# 1. Curtir o post - botao do coracao (x=710, y=580)
pg.click(710, 580)
time.sleep(0.5)

# 2. Clicar no campo "Broadcast a message..." (x=940, y=665)
pg.click(940, 665)
time.sleep(0.5)

# 3. Colar texto
pg.hotkey('ctrl', 'v')
time.sleep(0.5)

# 4. Enviar com Enter
pg.press('enter')
time.sleep(1)

# 5. Screenshot final
s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\finalizado.png')
print('Feito!')
