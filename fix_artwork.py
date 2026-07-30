"""
Remove artwork duplicado de arquivos FLAC (com suporte a caminhos longos).
Uso: python fix_artwork.py "D:\Musica FLAC"
"""

import os
import sys
import hashlib
from pathlib import Path, WindowsPath
from mutagen.flac import FLAC, Picture

def get_artwork_hash(picture: Picture) -> str:
    if picture is None:
        return None
    return hashlib.md5(picture.data).hexdigest()

def remove_duplicate_artwork(music_folder: str):
    folder = Path(music_folder)
    if not folder.exists():
        print(f"Pasta não encontrada: {music_folder}")
        return

    flac_files = []
    for root, dirs, files in os.walk(music_folder):
        for f in files:
            if f.lower().endswith('.flac'):
                flac_files.append(os.path.join(root, f))

    if not flac_files:
        print("Nenhum arquivo FLAC encontrado.")
        return

    print(f"Encontrados {len(flac_files)} arquivos FLAC\n")

    removed_count = 0
    error_count = 0
    for flac_path in flac_files:
        try:
            audio = FLAC(flac_path)
            pictures = audio.pictures

            if len(pictures) <= 1:
                continue

            seen_hashes = {}
            duplicates = []

            for i, pic in enumerate(pictures):
                pic_hash = get_artwork_hash(pic)
                if pic_hash in seen_hashes:
                    duplicates.append(i)
                else:
                    seen_hashes[pic_hash] = i

            if duplicates:
                for idx in sorted(duplicates, reverse=True):
                    audio.pictures.pop(idx)

                audio.save()
                removed_count += 1
                name = os.path.basename(flac_path)
                print(f"[REMOVIDO] {name}: {len(duplicates)} duplicata(s)")

        except Exception as e:
            error_count += 1
            name = os.path.basename(flac_path)
            print(f"[ERRO] {name}: {e}")

    print(f"\nConcluído! {removed_count} arquivo(s) corrigido(s), {error_count} erro(s)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Uso: python fix_artwork.py "D:\\Musica FLAC"')
        sys.exit(1)

    music_folder = sys.argv[1]
    remove_duplicate_artwork(music_folder)