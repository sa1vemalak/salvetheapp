pip install -q google-cloud-storage
python3 - <<'PY'
import json, urllib.request, shutil, os
from google.cloud import storage
b = storage.Client().bucket('salvetheapp-3cceb-acervo')
d = json.load(urllib.request.urlopen('https://zenodo.org/api/records/15571083', timeout=60))
keep = ('subset_paths.tar.gz', 'mxl.tar.gz', 'metadata.tar.gz', 'PDMX.csv', 'README')
lines = []
for f in d['files']:
    n = f['key']
    if not n.startswith(keep):
        print('pulando', n, f['size'] // 1_000_000, 'MB'); continue
    print('baixando', n, f['size'] // 1_000_000, 'MB', flush=True)
    dest = '/tmp/' + n
    with urllib.request.urlopen(f['links']['self'], timeout=900) as r, open(dest, 'wb') as o:
        shutil.copyfileobj(r, o, 8 << 20)
    b.blob('pdmx/' + n).upload_from_filename(dest); os.remove(dest)
    lines.append(f"pdmx\t{n}\t{f['size']}\thttps://zenodo.org/records/15571083\tCC0/domínio público (conjunto CC-BY-4.0)")
m = b.blob('MANIFESTO.tsv'); txt = m.download_as_text() if m.exists() else 'conjunto\tarquivo\tbytes\torigem\tlicenca\n'
m.upload_from_string(txt.rstrip('\n') + '\n' + '\n'.join(lines) + '\n')
print('pronto', flush=True)
PY
