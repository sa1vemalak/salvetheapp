"""Mestrinho job (Cloud Run Job `mestrinho`): a band uploads only the recording of a song; the Mestrinho listens,
the AI arranger writes the horn section, and the score goes to the Malak for the study audio and the bar map.

  JOB=bands/{band}/jobs/{id}  python3 job.py

Steps: download the recording (song.guia) -> mestrinho.py (instruments apart, beats, notes, chords) -> metais.py (where
the horns sound) -> arranjador (skeleton -> Claude -> MusicXML with trumpet, tenor sax, trombone and base) ->
MuseScore engraves the full score and each part as PDF -> the song gets the PDFs and the MusicXML -> a Malak job.
"""
import json, os, re, subprocess, sys, tempfile, time, traceback, urllib.parse, urllib.request, uuid, shutil, copy

from google.cloud import firestore, storage

PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT', 'salvetheapp-3cceb')
BUCKET = os.environ.get('BUCKET', 'salvetheapp-3cceb.firebasestorage.app')
HERE = os.path.dirname(os.path.abspath(__file__))
db = firestore.Client(project=PROJECT)
gcs = storage.Client(project=PROJECT).bucket(BUCKET)
sys.path.insert(0, HERE)
import arranjador as A  # noqa: E402


class Job:
    def __init__(self, path):
        self.ref = db.document(path)
        self.data = self.ref.get().to_dict() or {}

    def step(self, msg, pct):
        print(f'[{pct:3d}%] {msg}', flush=True)
        self.ref.update({'status': 'rodando', 'msg': msg, 'progresso': pct, 'atualizado': int(time.time() * 1000)})


def download(url, dest):
    with urllib.request.urlopen(url, timeout=300) as r, open(dest, 'wb') as f:
        shutil.copyfileobj(r, f)
    return dest


def upload(path, dest, ctype):
    tok = str(uuid.uuid4())
    b = gcs.blob(dest)
    b.metadata = {'firebaseStorageDownloadTokens': tok}
    b.upload_from_filename(path, content_type=ctype)
    return f'https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o/{urllib.parse.quote(dest, safe="")}?alt=media&token={tok}'


def run_logged(cmd, job, msg, pct_from, pct_to, marks):
    """run a step, moving the progress bar when its log prints one of the marks"""
    job.step(msg, pct_from)
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    tail = []
    for line in p.stdout:
        print(line, end='', flush=True)
        tail = (tail + [line.strip()])[-15:]
        for i, (k, m) in enumerate(marks):
            if k in line:
                job.step(m, pct_from + int((pct_to - pct_from) * (i + 1) / (len(marks) + 1)))
    if p.wait() != 0:
        raise RuntimeError(msg + ' falhou: ' + ' | '.join(tail[-3:]))


def engrave(xml, pdf):
    subprocess.run(['mscore3', '-o', pdf, xml], check=True, capture_output=True, timeout=600,
                   env=dict(os.environ, QT_QPA_PLATFORM='offscreen'))
    return pdf


def slug(s):
    import unicodedata
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'parte'


def log_llm(band, arr):
    u = arr.get('_uso') or {}
    try:
        db.collection('sistema').document('llm').collection('log').add({
            'rota': 'arranjador', 'banda': band, 'modelo': u.get('modelo'), 'entrada': u.get('entrada'),
            'saida': u.get('saida'), 'cacheLido': u.get('cache_lido'), 'criadoEm': int(time.time() * 1000)})
    except Exception as e:
        print('log do LLM:', e)


def run(job):
    band = job.ref.parent.parent.id
    song_id = job.data['song']
    song_ref = db.document(f'bands/{band}/songs/{song_id}')
    song = song_ref.get().to_dict()
    if not song:
        raise RuntimeError('A música não existe mais.')
    guia = song.get('guia') or {}
    if not guia.get('src'):
        raise RuntimeError('Esta música não tem gravação para o Mestrinho ouvir.')
    title = song.get('title') or song_id
    with tempfile.TemporaryDirectory() as tmp:
        ext = os.path.splitext(guia.get('name') or 'guia.mp3')[1].lower() or '.mp3'
        job.step('Baixando a gravação', 2)
        audio = download(guia['src'], os.path.join(tmp, 'guia' + ext))
        out = os.path.join(tmp, 'out')
        run_logged([sys.executable, os.path.join(HERE, 'mestrinho.py'), audio, out], job,
                   'Separando os instrumentos da gravação', 5, 55,
                   [('stems:', 'Achando o andamento e os compassos'), ('transcrevendo vocals', 'Ouvindo a melodia cantada'),
                    ('transcrevendo other', 'Ouvindo os metais e outros instrumentos'), ('transcrevendo piano', 'Ouvindo a harmonia'),
                    ('cifras:', 'Escrevendo o rascunho')])
        run_logged([sys.executable, os.path.join(HERE, 'metais.py'), os.path.join(out, 'stems', 'other.wav'),
                    os.path.join(out, 'metais.json')], job, 'Procurando onde os metais tocam', 56, 60, [])

        job.step('Montando o esqueleto da música', 61)
        sk = A.esqueleto(out)
        json.dump(sk, open(os.path.join(tmp, 'esqueleto.json'), 'w'), ensure_ascii=False)
        job.step('A IA arranjadora está escrevendo os metais (leva alguns minutos)', 62)
        arr = A.escrever(sk)
        log_llm(band, arr)
        json.dump(arr, open(os.path.join(tmp, 'arranjo.json'), 'w'), ensure_ascii=False)

        job.step('Escrevendo a partitura', 85)
        xml = A.musicxml(sk, arr, os.path.join(tmp, 'arranjo.musicxml'), titulo=f'{title} (arranjo do Mestrinho)')
        import music21 as m21
        full = m21.converter.parse(xml)
        job.step('Desenhando a grade e as partes em PDF', 88)
        ver = time.strftime('%Y%m%d%H%M%S')
        base = f'bands/{band}/arquivos/{song_id}-arranjo-{ver}'
        parts = [{'key': 'grade', 'name': 'Grade', 'src': upload(engrave(xml, os.path.join(tmp, 'grade.pdf')), f'{base}/grade.pdf', 'application/pdf')}]
        for i, pt in enumerate(full.parts):
            name = pt.partName or f'Parte {i + 1}'
            one = m21.stream.Score(); one.metadata = m21.metadata.Metadata(title=f'{title} · {name}')
            one.metadata.composer = 'Mestrinho (IA arranjadora)'
            one.insert(0, copy.deepcopy(pt))
            px = os.path.join(tmp, f'parte{i}.musicxml'); one.write('musicxml', fp=px)
            parts.append({'key': slug(name), 'name': name,
                          'src': upload(engrave(px, os.path.join(tmp, f'parte{i}.pdf')), f'{base}/{slug(name)}.pdf', 'application/pdf')})
        fonte = {'name': 'arranjo-mestrinho.musicxml', 'src': upload(xml, f'{base}/arranjo-mestrinho.musicxml', 'application/vnd.recordare.musicxml+xml')}

        job.step('Guardando o arranjo na música', 92)
        u = arr.get('_uso') or {}
        custo = round((u.get('entrada') or 0) / 1e6 * 4 + (u.get('saida') or 0) / 1e6 * 20, 2)
        song_ref.update({
            'parts': parts,
            'fontes': (song.get('fontes') or []) + [fonte],
            'arranjo': {'resumo': arr.get('resumo', ''), 'tom': arr.get('tom', ''), 'secoes': arr.get('secoes', []),
                        'bpm': sk['bpm'], 'feitoEm': int(time.time() * 1000), 'modelo': u.get('modelo'), 'custoUSD': custo,
                        'notas': sum(1 for c in arr.get('compassos', []) for t in c.get('linha', '').split() if not t.startswith(('R', '(R'))),
                        'fonte': 'Mestrinho: gravação -> IA arranjadora'},
        })
        # the Malak makes the study audio and the bar map from the new score
        mj = db.collection(f'bands/{band}/jobs').document(f'{song_id}__{int(time.time() * 1000)}')
        mj.set({'song': song_id, 'tipo': 'audio', 'status': 'pendente', 'criadoEm': int(time.time() * 1000),
                'uid': job.data.get('uid', ''), 'fonte': 'pdf'})
        job.ref.update({'status': 'pronto', 'progresso': 100, 'atualizado': int(time.time() * 1000), 'malak': mj.path,
                        'msg': 'Arranjo escrito. O Malak está gerando o áudio de estudo.'})


if __name__ == '__main__':
    job = Job(os.environ['JOB'])
    try:
        run(job)
    except Exception as e:
        traceback.print_exc()
        job.ref.update({'status': 'erro', 'msg': str(e)[:500], 'atualizado': int(time.time() * 1000)})
        sys.exit(1)
