"""
Automacao do Telegram/AyuGram via pyautogui.
Consolida agentes.py, auto2.py, auto3.py, auto_gram.py, comentar.py,
do_it.py, fast.py, final.py, fix.py, like_comment.py, smart.py.
"""

import pyautogui as pg
import time
import subprocess

pg.FAILSAFE = False
pg.PAUSE = 0.2


def focus_app(process_name="AyuGram"):
    """Foca a janela do aplicativo usando PowerShell (Windows)."""
    ps = (
        "Add-Type 'using System;using System.Runtime.InteropServices;"
        "public class W{[DllImport(\"user32.dll\")]"
        "public static extern bool SetForegroundWindow(IntPtr h);"
        "[DllImport(\"user32.dll\")]"
        "public static extern bool ShowWindow(IntPtr h,int c);}';"
        f"$p=Get-Process {process_name} -EA 0|Select -First 1;"
        "if($p){{[W]::ShowWindow($p.MainWindowHandle,9);sleep -m 300;"
        "[W]::SetForegroundWindow($p.MainWindowHandle);'OK'}}else{{'ERRO'}}"
    )
    result = subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps],
        capture_output=True, text=True, timeout=10
    )
    time.sleep(0.5)
    return "OK" in result.stdout


def copy_to_clipboard(text):
    """Copia texto para o clipboard via PowerShell (Windows)."""
    ps = (
        "Add-Type -AssemblyName System.Windows.Forms;"
        f"[System.Windows.Forms.Clipboard]::SetText('{text}')"
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps],
        capture_output=True, timeout=5
    )
    time.sleep(0.2)


def interact(channel_y=160, post_x=650, post_y=400, message=""):
    """
    Fluxo completo: focar app > abrir canal > reagir > comentar.

    channel_y: posicao Y do canal na sidebar
    post_x, post_y: posicao do post para reacao
    message: texto do comentario (vazio = so reagir, sem comentar)
    """
    if not focus_app():
        print("ERRO: AyuGram nao encontrado")
        return False

    # Abrir canal
    pg.click(200, channel_y)
    time.sleep(2)

    # Reagir ao post
    pg.click(post_x, post_y)
    time.sleep(0.5)

    # Comentar (se tiver mensagem)
    if message:
        copy_to_clipboard(message)
        pg.click(800, 780)
        time.sleep(0.3)
        pg.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pg.press('enter')

    time.sleep(0.5)
    return True


def take_screenshot(filename="screenshot.png"):
    """Tira screenshot e salva."""
    s = pg.screenshot()
    s.save(filename)
    print(f"Screenshot salvo: {filename}")
