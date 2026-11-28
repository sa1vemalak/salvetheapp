"""Publica o app (pasta app/ do repositório) no Firebase Hosting.

Uso (da raiz do repositório):
    python3 ferramentas/deploy.py            # publica nos dois endereços do app (salvetheapp-3cceb e salvetheapp)
    SITE=salvetheapp python3 ferramentas/deploy.py   # só um deles
    DRY=1 python3 ferramentas/deploy.py      # só confere, não publica
    FULL=1 python3 ferramentas/deploy.py     # conferência pesada depois de publicar (baixa todos os áudios)

Chave: ferramentas/.t, ou a variável TOKEN, ou `gcloud auth print-access-token`.

Cuidados que o script toma sozinho:
- Só publica o que está salvo no repositório (recusa se houver mudança não salva em app/, app-src/ ou modo-local/).
- Antes de publicar, baixa o código que está no ar e recusa se algum arquivo do ar não existir em nenhuma
  versão salva do repositório (alguém publicou sem salvar). Salve esse código no repositório primeiro.
  FORCE=1 publica mesmo assim (apaga o que só estava no ar).
- As partituras e áudios das bandas (scores/ e _blob/) não ficam no repositório: eles são copiados da versão
  que está no ar, nunca apagados.
- Não mexe nos arquivos do repositório: monta a publicação numa pasta temporária.
"""
import gzip, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
PROJ = 'salvetheapp-3cceb'
API = 'https://firebasehosting.googleapis.com/v1beta1'
SITES = os.environ['SITE'].split(',') if os.environ.get('SITE') else ['salvetheapp-3cceb', 'salvetheapp']
DADOS = re.compile(r'^/?(scores|_blob)/')          # dados das bandas: ficam no ar, não no repositório
GERADOS = {'index.html', 'fb.js', 'version.json', 'local/manifest.json', 'local/index.html', 'local/local.js', 'local/servidor.js'}
DRY, FORCE = bool(os.environ.get('DRY')), bool(os.environ.get('FORCE'))
FULL = bool(os.environ.get('FULL'))  # conferência pesada: baixa cada arquivo das bandas inteiro (a normal só confirma que existe)


def pare(msg):
    print('\nPAROU:', msg); sys.exit(1)


def git(*a):
    return subprocess.run(['git', '-C', RAIZ, *a], capture_output=True, text=True)


def token():
    if os.environ.get('TOKEN'): return os.environ['TOKEN']
    t = os.path.join(AQUI, '.t')
    if os.path.exists(t): return open(t).read().strip()
    r = subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True)
    if r.returncode == 0 and r.stdout.strip(): return r.stdout.strip()
    pare('sem chave: crie ferramentas/.t, defina TOKEN ou entre no gcloud')


def existe(site, path):
    """Confirma que o arquivo está no ar sem baixar (rápido); tenta de novo se a conexão cair."""
    for i in range(4):
        try:
            urllib.request.urlopen(urllib.request.Request(f'https://{site}.web.app/{path}', method='HEAD'), timeout=30); return True
        except urllib.error.HTTPError as e:
            if e.code == 404: return False
        except Exception: pass
        time.sleep(1 + i)
    return True  # a conexão caiu 4 vezes: não dá para afirmar que sumiu


def baixa(site, path):
    url = f'https://{site}.web.app/{path}?nocache={time.time()}'
    try: return urllib.request.urlopen(url, timeout=120).read()
    except urllib.error.HTTPError as e:
        if e.code == 404: return None
        raise


def sem_versao(html):
    return re.sub(rb"window\.APP_VERSION = '[^']*';", b'', html)


# 1. só o que está salvo
suja = git('status', '--porcelain', '--', 'app', 'app-src', 'modo-local').stdout.strip()
if suja and not FORCE: pare('há mudanças não salvas no repositório:\n' + suja)
commit = git('rev-parse', '--short', 'HEAD').stdout.strip()


# 2. código no ar que não está no repositório?
def no_git(b):
    sha = subprocess.run(['git', '-C', RAIZ, 'hash-object', '--stdin'], input=b, capture_output=True).stdout.decode().strip()
    return git('cat-file', '-e', sha).returncode == 0


indices = set()
for c in git('rev-list', '--all', '--', 'app/index.html').stdout.split():
    s = subprocess.run(['git', '-C', RAIZ, 'show', f'{c}:app/index.html'], capture_output=True).stdout
    indices.add(hashlib.md5(sem_versao(s)).hexdigest())


def md5_repo(rel):
    p = os.path.join(RAIZ, 'app', rel)
    return hashlib.md5(open(p, 'rb').read()).hexdigest() if os.path.exists(p) else None


ar = {}
for site in SITES:
    raw = baixa(site, 'local/manifest.json')
    if raw is None: pare(f'{site}: não achei local/manifest.json no ar')
    man = json.loads(raw)
    ar[site] = man
    problemas = []
    for e in man['files']:
        p = e['path']
        if DADOS.match(p) or p in GERADOS: continue
        if e['md5'] == md5_repo(p): continue
        b = baixa(site, p)
        if b is None or no_git(b): continue
        problemas.append(p)
    idx = baixa(site, 'index.html')
    if idx and hashlib.md5(sem_versao(idx)).hexdigest() not in indices: problemas.append('index.html')
    fb = baixa(site, 'fb.js')
    if fb and not no_git(fb): problemas.append('fb.js')
    if problemas:
        msg = f'{site}: estes arquivos do ar não existem em nenhuma versão salva do repositório: {problemas}. ' \
              'Salve-os no repositório antes (ou FORCE=1 para apagar).'
        if not FORCE: pare(msg)
        print('AVISO (FORCE):', msg)
    print(f'{site}: no ar versão {man["version"]}; nada que só exista no ar')

# 3. monta a publicação numa pasta temporária
ver = time.strftime('%Y%m%d%H%M%S', time.gmtime())
tmp = tempfile.mkdtemp(prefix='deploy-')
root = os.path.join(tmp, 'app')
shutil.copytree(os.path.join(RAIZ, 'app'), root, ignore=shutil.ignore_patterns('.*', '*.bak', 'scores', '_blob'))
ip = os.path.join(root, 'index.html'); h = open(ip).read()
h = re.sub(r"window\.APP_VERSION = '[^']*';", "window.APP_VERSION = '" + ver + "';", h); open(ip, 'w').write(h)
json.dump({'v': ver, 'commit': commit}, open(os.path.join(root, 'version.json'), 'w'))
os.makedirs(os.path.join(root, 'local'), exist_ok=True)
lh = h.replace('<script src="fb.js"></script>', '<script src="local.js"></script>')
lh = re.sub(r"window\.APP_VERSION = '[^']*';", "window.APP_VERSION = 'dev';", lh)
open(os.path.join(root, 'local', 'index.html'), 'w').write(lh)
shutil.copyfile(os.path.join(RAIZ, 'modo-local', 'local.js'), os.path.join(root, 'local', 'local.js'))
# o programa do modo local, para o app montar o .zip que a banda baixa (Seguir a DAW › Tocar sem internet)
shutil.copyfile(os.path.join(RAIZ, 'modo-local', 'servidor.js'), os.path.join(root, 'local', 'servidor.js'))

app_man = []
for dp, _, fs in os.walk(root):
    for f in fs:
        full = os.path.join(dp, f); rel = os.path.relpath(full, root).replace(os.sep, '/')
        if rel in ('index.html', 'fb.js', 'version.json', 'local/manifest.json', 'local/servidor.js'): continue
        b = open(full, 'rb').read()
        e = {'path': rel, 'size': len(b), 'md5': hashlib.md5(b).hexdigest()}
        to = {'local/index.html': 'index.html', 'local/local.js': 'local.js'}.get(rel)
        if to: e['to'] = to
        app_man.append(e)

files = {}
for dp, _, fs in os.walk(root):
    for f in fs:
        p = os.path.join(dp, f); rel = '/' + os.path.relpath(p, root).replace(os.sep, '/')
        z = gzip.compress(open(p, 'rb').read(), compresslevel=6 if not rel.endswith('.mp4') else 1, mtime=0)
        files[rel] = (hashlib.sha256(z).hexdigest(), z)

T = token() if not DRY else None
H = {'Authorization': f'Bearer {T}', 'Content-Type': 'application/json', 'X-Goog-User-Project': PROJ}


def call(url, body=None, method='POST'):
    r = urllib.request.Request(url, json.dumps(body).encode() if body is not None else None, method=method, headers=H)
    try: return json.load(urllib.request.urlopen(r, timeout=300))
    except urllib.error.HTTPError as e: pare(f'{method} {url} -> {e.code} {e.read().decode()[:500]}')


cfg = {'headers': [
    {'glob': '/_blob/**', 'headers': {'Cache-Control': 'public, max-age=31536000, immutable'}},
    {'glob': '**/*.@(html|js|json|webmanifest)', 'headers': {'Cache-Control': 'no-cache'}},
    {'regex': '^/$', 'headers': {'Cache-Control': 'no-cache'}},
    {'glob': '/scores/**', 'headers': {'Cache-Control': 'no-cache'}}],
    'cleanUrls': False}

for site in SITES:
    # o manifesto do modo local lista o app novo + os dados das bandas que estão no ar
    dados = [e for e in ar[site]['files'] if DADOS.match(e['path'])]
    man = {'version': ver, 'files': sorted(app_man + dados, key=lambda x: x['path'])}
    mb = json.dumps(man).encode(); z = gzip.compress(mb, mtime=0)
    meus = dict(files); meus['/local/manifest.json'] = (hashlib.sha256(z).hexdigest(), z)
    print(f'{site}: {len(meus)} arquivos do app (commit {commit}) + {len(dados)} das bandas copiados do ar')
    if DRY: continue

    S = f'sites/{site}'
    atual = call(f'{API}/{S}/releases?pageSize=1', method='GET')['releases'][0]['version']['name']
    # nova versão = cópia inteira da versão no ar, sem finalizar; os arquivos do app são trocados por cima.
    # (o filtro include/exclude do clone devolveu uma cópia vazia em 27/11/2026: não usar)
    op = call(f'{API}/{S}/versions:clone', {'sourceVersion': atual, 'finalize': False})
    while not op.get('done'):
        time.sleep(3); op = call(f'{API}/{op["name"]}', method='GET')
    if 'error' in op: pare(f'{site}: cópia falhou {op["error"]}')
    name = op['response']['name']

    def arquivos(v):
        out, tok = [], ''
        while True:
            r = call(f'{API}/{v}/files?pageSize=1000' + (f'&pageToken={tok}' if tok else ''), method='GET')
            out += [f['path'] for f in r.get('files', [])]
            tok = r.get('nextPageToken')
            if not tok: return out

    copiados = [p for p in arquivos(name) if DADOS.match(p)]
    if len(copiados) < len(dados): pare(f'{site}: a cópia tem {len(copiados)} arquivos das bandas, o ar tem {len(dados)}; nada foi publicado')
    sobras = [p for p in arquivos(name) if not DADOS.match(p) and p not in meus and not p.startswith('/__/')]
    if sobras: print(f'{site}: AVISO, arquivos antigos do app que continuam no ar (não estão mais no repositório): {sobras}')
    call(f'{API}/{name}?update_mask=config', {'config': cfg}, 'PATCH')
    pf = call(f'{API}/{name}:populateFiles', {'files': {k: h for k, (h, _) in meus.items()}})
    need = set(pf.get('uploadRequiredHashes', [])); up = pf.get('uploadUrl')
    byh = {h: z for h, z in meus.values()}

    def send(hh):
        err = None
        for i in range(4):
            try:
                r = urllib.request.Request(f'{up}/{hh}', byh[hh], method='POST',
                                           headers={**H, 'Content-Type': 'application/octet-stream'})
                urllib.request.urlopen(r, timeout=300).read(); return True
            except Exception as e:
                err = e; time.sleep(2 ** i)
        print('falhou', hh, err); return False

    with ThreadPoolExecutor(8) as ex: ok = sum(ex.map(send, need))
    if ok != len(need): pare(f'{site}: {len(need) - ok} arquivos não subiram; nada foi publicado')
    final = arquivos(name)
    if sum(1 for p in final if DADOS.match(p)) < len(dados) or not all(k in final for k in meus):
        pare(f'{site}: a versão nova está incompleta; nada foi publicado')
    call(f'{API}/{name}?update_mask=status', {'status': 'FINALIZED'}, 'PATCH')
    rel = call(f'{API}/{S}/releases?versionName={name}', {'message': f'commit {commit}'})
    print(f'{site}: publicado {ver} ({rel.get("name")})')
    # confere (o ar leva alguns segundos para mudar); se faltar dado das bandas, volta para a versão anterior
    for i in range(12):
        v = json.loads(baixa(site, 'version.json'))
        if v.get('v') == ver: break
        time.sleep(5)
    else: pare(f'{site}: version.json no ar é {v}, esperado {ver}')
    q = [urllib.parse.quote(e['path']) for e in dados]
    with ThreadPoolExecutor(16) as ex:
        tem = list(ex.map((lambda x: baixa(site, x) is not None) if FULL else (lambda x: existe(site, x)), q))
    faltam = [e['path'] for e, t in zip(dados, tem) if not t]
    if faltam:
        call(f'{API}/{S}/releases?versionName={atual}', {'message': 'volta automática: faltaram dados das bandas'})
        pare(f'{site}: {len(faltam)} arquivos das bandas sumiram; voltei para a versão anterior ({atual})')
    print(f'{site}: conferido (versão nova no ar, dados das bandas presentes)')

shutil.rmtree(tmp, ignore_errors=True)
