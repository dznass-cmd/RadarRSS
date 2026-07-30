"""
Remove artwork duplicado de arquivos FLAC.
Uso: python remove_duplicate_artwork.py "C:\caminho\da\musica"
"""

import os
import sys
import hashlib
from pathlib import Path
from mutagen.flac import FLAC, Picture

def get_artwork_hash(picture: Picture) -> str:
    """Gera hash do artwork para comparar imagens."""
    if picture is None:
        return None
    return hashlib.md5(picture.data).hexdigest()

def remove_duplicate_artwork(music_folder: str):
    """Remove artwork duplicado de todos os FLACs na pasta."""
    folder = Path(music_folder)
    if not folder.exists():
        print(f"Pasta não encontrada: {music_folder}")
        return

    flac_files = list(folder.rglob("*.flac"))
    if not flac_files:
        print("Nenhum arquivo FLAC encontrado.")
        return

    print(f"Encontrados {len(flac_files)} arquivos FLAC\n")

    removed_count = 0
    for flac_file in flac_files:
        try:
            audio = FLAC(str(flac_file))
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
                # Remove duplicados (de trás para frente para manter índices)
                for idx in sorted(duplicates, reverse=True):
                    audio.pictures.pop(idx)

                audio.save()
                removed_count += 1
                print(f"[REMOVIDO] {flac_file.name}: {len(duplicates)} duplicata(s)")

        except Exception as e:
            print(f"[ERRO] {flac_file.name}: {e}")

    print(f"\nConcluído! {removed_count} arquivo(s) corrigido(s)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python remove_duplicate_artwork.py \"C:\\caminho\\da\\musica\"")
        sys.exit(1)

    music_folder = sys.argv[1]
    remove_duplicate_artwork(music_folder)
