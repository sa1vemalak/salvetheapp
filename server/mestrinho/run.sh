set +e
apt-get update -qq && apt-get install -y -qq ffmpeg > /dev/null
pip install -q --no-cache-dir torch torchaudio --extra-index-url https://download.pytorch.org/whl/cpu
pip install -q --no-cache-dir --upgrade pip setuptools wheel "flit_core>=3.11,<4" cython
pip install -q --no-cache-dir --prefer-binary --no-build-isolation demucs "basic-pitch[onnx]" onnxruntime panns-inference librosa music21 soundfile google-cloud-storage "numpy<2"
pip uninstall -y -q tflite-runtime || true
python3 - <<'PY'
from google.cloud import storage
b = storage.Client().bucket('salvetheapp-3cceb-acervo')
import os
for s, d in [('mestrinho-testes/capricorniana.mp3', '/tmp/in.mp3'), ('mestrinho-testes/mestrinho.py', '/tmp/mestrinho.py'), ('mestrinho-testes/metais.py', '/tmp/metais.py')]:
    b.blob(s).download_to_filename(d)
for bl in b.list_blobs(prefix='mestrinho-testes/out/stems/'):
    os.makedirs('/tmp/out/stems', exist_ok=True); bl.download_to_filename('/tmp/out/stems/' + bl.name.split('/')[-1]); print('reaproveitando', bl.name)
PY
python3 /tmp/mestrinho.py /tmp/in.mp3 /tmp/out || echo FALHOU
python3 /tmp/metais.py /tmp/out/stems/other.wav /tmp/out/metais.json || echo FALHOU METAIS
python3 - <<'PY'
import os
from google.cloud import storage
b = storage.Client().bucket('salvetheapp-3cceb-acervo')
for root, _, files in os.walk('/tmp/out'):
    for f in files:
        p = os.path.join(root, f)
        if '/demucs/' in p: continue
        b.blob('mestrinho-testes/out/' + os.path.relpath(p, '/tmp/out')).upload_from_filename(p)
print('enviado')
PY
