"""
Ferramentas de gerenciamento de artwork em arquivos FLAC.
Consolida fix_artwork.py, fix_covers.py e remove_duplicate_artwork.py.
"""

import os
import sys
import hashlib
from collections import Counter
from mutagen.flac import FLAC, Picture


def get_artwork_hash(picture):
    return hashlib.md5(picture.data).hexdigest() if picture else None


def remove_duplicate_artwork(folder):
    """Remove artwork duplicado de todos os FLACs em uma pasta."""
    folder_path = folder
    if not os.path.exists(folder_path):
        print(f"Pasta nao encontrada: {folder_path}")
        return

    flac_files = []
    for root, dirs, files in os.walk(folder_path):
        for f in files:
            if f.lower().endswith('.flac'):
                flac_files.append(os.path.join(root, f))

    if not flac_files:
        print("Nenhum arquivo FLAC encontrado.")
        return

    print(f"Encontrados {len(flac_files)} arquivos FLAC\n")

    removed_count = 0
    errors = 0

    for path in flac_files:
        try:
            audio = FLAC(path)
            pics = audio.pictures
            if len(pics) <= 1:
                continue

            seen = {}
            dupes = []
            for i, pic in enumerate(pics):
                h = get_artwork_hash(pic)
                if h in seen:
                    dupes.append(i)
                else:
                    seen[h] = i

            if dupes:
                for idx in sorted(dupes, reverse=True):
                    audio.pictures.pop(idx)
                audio.save()
                removed_count += 1
                print(f"[OK] {os.path.basename(path)}: {len(dupes)} duplicata(s) removida(s)")
        except Exception as e:
            errors += 1
            print(f"[ERRO] {os.path.basename(path)}: {e}")

    print(f"\nConcluido! {removed_count} corrigidos, {errors} erros")


def normalize_covers(folder, dry_run=False):
    """Normaliza capas de albuns FLAC e cria cover.jpg em cada pasta."""

    def get_first_artwork(path):
        try:
            a = FLAC(path)
            pics = a.pictures
            if pics:
                return pics[0].data, pics[0].mime
            return None, None
        except Exception:
            return None, None

    def process_album(album_path):
        flacs = sorted([f for f in os.listdir(album_path) if f.lower().endswith('.flac')])
        if not flacs:
            return None

        print(f"\nAlbum: {os.path.basename(album_path)} ({len(flacs)} FLACs)")

        artwork = {}
        hash_counter = Counter()

        for f in flacs:
            fp = os.path.join(album_path, f)
            data, mime = get_first_artwork(fp)
            if data:
                h = hashlib.md5(data).hexdigest()
                artwork[f] = (data, h, mime)
                hash_counter[h] += 1

        if not hash_counter:
            print("  Nenhum artwork encontrado")
            return "sem_artwork"

        dominant = hash_counter.most_common(1)[0][0]
        dom_data = None
        dom_mime = None
        for f, (d, h, m) in artwork.items():
            if h == dominant:
                dom_data, dom_mime = d, m
                break

        if not dom_data:
            return "erro"

        actions = []
        cover_path = os.path.join(album_path, 'cover.jpg')

        if not os.path.exists(cover_path):
            actions.append('criar cover.jpg')

        non_matching = [f for f, (_, h, _) in artwork.items() if h != dominant]
        if non_matching:
            actions.append(f'normalizar {len(non_matching)} FLACs')

        if not actions:
            print("  Ja normalizado")
            return "ok"

        print("  Acoes: " + ', '.join(actions))

        if dry_run:
            return "dry_run"

        if not os.path.exists(cover_path):
            try:
                with open(cover_path, 'wb') as f:
                    f.write(dom_data)
                print("  [+] cover.jpg criado")
            except Exception as e:
                print(f"  [ERRO] cover.jpg: {e}")

        fixed = 0
        for f in non_matching:
            fp = os.path.join(album_path, f)
            try:
                audio = FLAC(fp)
                audio.clear_pictures()
                pic = Picture()
                pic.data = dom_data
                pic.type = 3
                pic.mime = dom_mime
                audio.add_picture(pic)
                audio.save()
                fixed += 1
                print(f"  [+] {f[:60]}")
            except Exception as e:
                print(f"  [ERRO] {f[:60]}: {e}")

        return "fixed" if fixed else "skipped"

    folders = sorted([d for d in os.listdir(folder) if os.path.isdir(os.path.join(folder, d))])

    results = {'ok': 0, 'fixed': 0, 'sem_artwork': 0, 'erro': 0, 'dry_run': 0}
    for d in folders:
        r = process_album(os.path.join(folder, d))
        if r:
            results[r] = results.get(r, 0) + 1

    print("\n" + "=" * 60)
    print("RESUMO:")
    print(f"  Ja normalizados: {results['ok']}")
    print(f"  Corrigidos: {results['fixed']}")
    print(f"  Sem artwork: {results['sem_artwork']}")
    print(f"  Erros: {results['erro']}")
    if dry_run:
        print(f"  (seriam corrigidos: {results['dry_run']})")
