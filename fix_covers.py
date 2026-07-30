"""
Normaliza capas de álbuns FLAC e cria cover.jpg em cada pasta.
Garante que todos os FLACs no mesmo álbum tenham a mesma capa.
Uso: python fix_covers.py "D:\Musica FLAC"
"""

import os, sys, hashlib
from collections import Counter
from mutagen.flac import FLAC

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def get_first_artwork_data(flac_path):
    """Retorna os dados da primeira imagem embedada no FLAC."""
    try:
        audio = FLAC(flac_path)
        pics = audio.pictures
        if pics:
            return pics[0].data, pics[0].type, pics[0].mime, pics[0]
        return None, None, None, None
    except:
        return None, None, None, None

def normalize_album(folder_path, dry_run=False):
    """Normaliza a capa de um álbum e cria cover.jpg."""
    flac_files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith('.flac')])

    if not flac_files:
        return None

    print(f"\nProcessando: {os.path.basename(folder_path)} ({len(flac_files)} FLACs)")

    # Coleta todos os artworks e seus hashes
    artwork_map = {}  # filename -> (data, hash, mime)
    hash_counts = Counter()

    for f in flac_files:
        fp = os.path.join(folder_path, f)
        data, _, mime, _ = get_first_artwork_data(fp)
        if data:
            h = hashlib.md5(data).hexdigest()
            artwork_map[f] = (data, h, mime)
            hash_counts[h] += 1

    if not hash_counts:
        print("  Nenhum artwork embedado encontrado")
        return "sem_artwork"

    # Pega o hash mais comum
    dominant_hash = hash_counts.most_common(1)[0][0]
    dominant_data = None
    dominant_mime = None

    for f, (data, h, mime) in artwork_map.items():
        if h == dominant_hash:
            dominant_data = data
            dominant_mime = mime
            break

    if not dominant_data:
        return "erro"

    # Verifica se precisa normalizar
    non_matching = []
    for f in flac_files:
        if f in artwork_map:
            _, h, _ = artwork_map[f]
            if h != dominant_hash:
                non_matching.append(f)

    # Cria cover.jpg se não existir
    cover_jpg = os.path.join(folder_path, 'cover.jpg')
    cover_exists = os.path.exists(cover_jpg)

    actions = []
    if not cover_exists:
        actions.append('criar cover.jpg')
    if non_matching:
        actions.append('normalizar {} FLACs'.format(len(non_matching)))

    if not actions:
        print("  Ja normalizado")
        return "ok"

    print("  Acoes: " + ', '.join(actions))

    if dry_run:
        return "dry_run"

    # Cria cover.jpg
    if not cover_exists:
        try:
            with open(cover_jpg, 'wb') as f:
                f.write(dominant_data)
            print("  [+] cover.jpg criado")
        except Exception as e:
            print("  [ERRO] cover.jpg: " + str(e))

    # Normaliza FLACs com artwork diferente
    fixed = 0
    for f in non_matching:
        fp = os.path.join(folder_path, f)
        try:
            audio = FLAC(fp)
            # Substitui todas as imagens pela dominante
            audio.clear_pictures()
            from mutagen.flac import Picture
            pic = Picture()
            pic.data = dominant_data
            pic.type = 3  # front cover
            pic.mime = dominant_mime
            audio.add_picture(pic)
            audio.save()
            fixed += 1
            print("  [+] " + f[:60])
        except Exception as e:
            print("  [ERRO] " + f[:60] + ": " + str(e))

    return "fixed" if fixed + (0 if cover_exists else 1) > 0 else "skipped"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Uso: python fix_covers.py "D:\\Musica FLAC" [--dry-run]')
        sys.exit(1)

    base = sys.argv[1]
    dry_run = '--dry-run' in sys.argv

    if dry_run:
        print("*** MODO DRY-RUN (sem alteracoes) ***\n")

    folders = sorted([d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d))])

    results = {'ok': 0, 'fixed': 0, 'sem_artwork': 0, 'erro': 0, 'dry_run': 0}
    for folder in folders:
        folder_path = os.path.join(base, folder)
        result = normalize_album(folder_path, dry_run=dry_run)
        if result:
            results[result] = results.get(result, 0) + 1

    print("\n" + "=" * 60)
    print("RESUMO:")
    print("  Ja normalizados: " + str(results['ok']))
    print("  Corrigidos: " + str(results['fixed']))
    print("  Sem artwork: " + str(results['sem_artwork']))
    print("  Erros: " + str(results['erro']))
    if dry_run:
        print("  (seriam corrigidos: " + str(results.get('dry_run', 0)) + ")")
