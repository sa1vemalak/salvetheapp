"""Downloads the files of Zenodo records into /workspace/acervo/<name> and appends them to the manifest."""
import json, os, re, sys, urllib.request, shutil
W = '/workspace/acervo'
SETS = [  # record, folder, license, keep regex, max bytes per file
    ('15571083', 'pdmx', 'PDMX: CC0/domínio público (conjunto CC-BY)', r'.', 30_000_000_000),
    ('4603870', 'slakh-baby', 'CC BY 4.0', r'.', 15_000_000_000),
]
man = open(os.path.join(W, 'MANIFESTO.tsv'), 'a')
for rec, name, lic, keep, mx in SETS:
    os.makedirs(os.path.join(W, name), exist_ok=True)
    try:
        d = json.load(urllib.request.urlopen(f'https://zenodo.org/api/records/{rec}', timeout=60))
    except Exception as e:
        print('ERRO', rec, e, flush=True); continue
    print(name, '-', d.get('metadata', {}).get('title'), '| licença Zenodo:', d.get('metadata', {}).get('license'), flush=True)
    for f in d.get('files', []):
        n, s = f['key'], f.get('size', 0); u = f['links'].get('self') or f['links'].get('content')
        if not re.search(keep, n, re.I) or s > mx:
            print('  pulando', n, s, flush=True); continue
        print(f'  baixando {n} ({s // 1_000_000} MB)', flush=True)
        dest = os.path.join(W, name, n)
        for tent in range(5):
            try:
                with urllib.request.urlopen(u, timeout=600) as r, open(dest, 'wb') as o:
                    shutil.copyfileobj(r, o, 8 << 20)
                break
            except Exception as e:
                print('   tentativa', tent + 1, 'falhou:', e, flush=True)
        man.write(f'{name}\t{n}\t{s}\thttps://zenodo.org/records/{rec}\t{lic}\n')
