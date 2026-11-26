# runs inside the Cloud Run job: fetch code + skeleton from GCS, ask Claude, save the arrangement back
import subprocess, sys, json, urllib.request, os
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'anthropic', 'google-cloud-storage'], check=True)
from google.cloud import storage
b = storage.Client().bucket('salvetheapp-3cceb-acervo'); D = 'arranjador-testes/'
for f in ('arranjador.py', 'esqueleto.json'):
    b.blob(D + f).download_to_filename(f)
tag = os.environ.get('TAG', 'v1')
r = subprocess.run([sys.executable, 'arranjador.py', 'escrever', 'esqueleto.json', 'arranjo.json'])
if os.path.exists('arranjo.json'):
    b.blob(D + f'arranjo-{tag}.json').upload_from_filename('arranjo.json'); print('salvo', tag)
sys.exit(r.returncode)
