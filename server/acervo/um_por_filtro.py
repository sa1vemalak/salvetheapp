"""One score per Musica Brasilis filter (genres + instruments/formations), slowly, with its license and metadata."""
import re, html, json, time, os, sys, urllib.request, urllib.parse, gzip
BASE = 'https://musicabrasilis.org.br'
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36', 'Accept-Encoding': 'gzip', 'Accept-Language': 'pt-BR'}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'acervo')
PAUSA = 3.0

def get(url, binary=False):
    time.sleep(PAUSA)
    r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)
    b = r.read()
    if r.headers.get('Content-Encoding') == 'gzip': b = gzip.decompress(b)
    return b if binary else b.decode('utf-8', 'ignore')

def text(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'(?s)<(script|style).*?</\1>', '', s)))).strip()

home = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'partituras.html'), encoding='utf-8', errors='ignore').read()
filtros = []
for v in dict.fromkeys(re.findall(r'<option[^>]*value="(genres:[^"]+)"', home)): filtros.append(html.unescape(v))
for v in dict.fromkeys(re.findall(r'value="(hierarchy_instrument:[^"]+)"', home)): filtros.append(html.unescape(v))
print(len(filtros), 'filtros', flush=True)

man_path = os.path.join(OUT, 'manifesto.json')
man = json.load(open(man_path)) if os.path.exists(man_path) else []
man = [m for m in man if not m.get('erro') or m.get('erro') == 'sem partituras novas']
for m in man:
    if m.get('licenca'): m['licenca'] = m['licenca'].replace('-->', '').strip()
feitos = {m['filtro'] for m in man}; usados = {m['pagina'] for m in man}
for f in filtros:
    if f in feitos: continue
    try:
        lista = get(BASE + '/pt-br/partituras/?' + urllib.parse.urlencode({'filters': f}))
        links = [l for l in dict.fromkeys(re.findall(r'href="(/pt-br/partituras/[a-z0-9-]+/)"', lista)) if l not in usados]
        if not links:
            man.append({'filtro': f, 'pagina': None, 'erro': 'sem partituras novas'}); continue
        pagina = links[0]; usados.add(pagina)
        p = get(BASE + pagina); t = text(p)
        pdf = re.search(r'href="(/media/[^"]+\.pdf)"', p)
        def campo(k):
            m = re.search(re.escape(k) + r':\s*(.{1,120}?)(?=\s+(?:ISMN|[A-ZÁ-Ú][a-zá-ú ]+):|\s+-->|\s+Baixar|$)', t)
            return m.group(1).replace('-->', '').strip() if m else None
        meta = {k: campo(k) for k in ['Direitos', 'Gênero', 'Período', 'Edição', 'Proveniência', 'Data da primeira manifestação', 'Formação']}
        titulo = re.search(r'<title>([^<]*)</title>', p); titulo = html.unescape(titulo.group(1)).split('|')[0].strip() if titulo else pagina
        item = {'filtro': f, 'pagina': BASE + pagina, 'titulo': titulo, 'licenca': meta.pop('Direitos'), **{k.lower(): v for k, v in meta.items()}}
        if pdf:
            nome = re.sub(r'[^a-z0-9-]+', '-', f.split(':', 1)[1].lower().encode('ascii', 'ignore').decode()).strip('-') + '__' + os.path.basename(pdf.group(1))
            open(os.path.join(OUT, nome), 'wb').write(get(BASE + urllib.parse.quote(pdf.group(1)), True))
            item['arquivo'] = nome
        else:
            item['erro'] = 'sem PDF na página'
        man.append(item)
        print(f'{len(man):3d}/{len(filtros)} {f} -> {titulo[:60]} [{item["licenca"]}]', flush=True)
    except Exception as e:
        man.append({'filtro': f, 'pagina': None, 'erro': str(e)[:200]}); print('ERRO', f, e, flush=True)
    json.dump(man, open(man_path, 'w'), ensure_ascii=False, indent=1)
print('fim', len([m for m in man if m.get('arquivo')]), 'PDFs', flush=True)
