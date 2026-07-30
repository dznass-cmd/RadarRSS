import pyautogui as pg
import time
import subprocess
pg.FAILSAFE = False
pg.PAUSE = 0.3

# Copiar texto pro clipboard via PowerShell
text = "Obrigado pelo conteudo!"
ps_cmd = f'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText("{text}")'
subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True)

# Clicar na caixa de comentario
pg.click(560, 780)
time.sleep(0.5)

# Colar com Ctrl+V
pg.hotkey('ctrl', 'v')
time.sleep(0.5)

# Enviar
pg.press('enter')
time.sleep(1)

s = pg.screenshot()
s.save('C:\\Users\\Dznas\\Documents\\Default Project\\telafeito.png')
print('Pronto!')
