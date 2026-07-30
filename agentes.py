import pyautogui as pg
import time
import subprocess
import threading

pg.FAILSAFE = False
pg.PAUSE = 0.2

PROJ = r'C:\Users\Dznas\Documents\Default Project'

def focus_ayugram():
    """Agente 1: Foca no AyuGram e mantem ele em primeiro plano"""
    subprocess.run(["powershell", "-Command", (
        "Add-Type @' using System; using System.Runtime.InteropServices; "
        "public class W { [DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h); "
        "[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); } '@; "
        "$p = Get-Process AyuGram -EA 0 | Select -First 1; "
        "if ($p) { [W]::SetForegroundWindow($p.MainWindowHandle); "
        "[W]::ShowWindow($p.MainWindowHandle, 9); Write-Host 'OK' }"
    )], capture_output=True, text=True)

def click_canal(y=160):
    """Clica no canal pela posicao Y na sidebar"""
    pg.click(200, y)
    time.sleep(2)

def reagir_post():
    """Agente 2: Reage ao post mais recente com emoji de like"""
    time.sleep(1)
    # Clicar na area do post (centro da tela, area de conteudo)
    pg.click(650, 400)
    time.sleep(0.5)

    # Clique longo para abrir menu de reacoes (segurar ~1s no post)
    pg.mouseDown(650, 400)
    time.sleep(1.0)
    pg.mouseUp(650, 400)
    time.sleep(1)

    # Screenshot para debug
    s = pg.screenshot()
    s.save(f'{PROJ}\\reacao_menu.png')

    # Tentar clicar no primeiro emoji de reacao (like/coracao)
    # Posicao tipica do primeiro emoji na popup de reacoes
    pg.click(590, 340)
    time.sleep(1)

    # Screenshot final
    s2 = pg.screenshot()
    s2.save(f'{PROJ}\\reacao_feita.png')

def iniciar_agentes():
    print("=== Agentes Iniciados ===")

    # Agente 1: Focar no AyuGram
    print("[Agente 1] Focando no AyuGram...")
    focus_ayugram()
    time.sleep(1)

    # Abrir um canal (primeiro da lista - Tamagotics y=160)
    print("[Agente 1] Abrindo canal...")
    click_canal(160)

    # Agente 2: Reagir ao post
    print("[Agente 2] Reagindo ao post...")
    reagir_post()

    print("=== Todos os agentes concluidos ===")

if __name__ == "__main__":
    iniciar_agentes()
