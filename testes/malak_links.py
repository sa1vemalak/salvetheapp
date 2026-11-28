"""O Malak abre os PDFs das músicas da turnê, que ficam salvos como caminho do site ("scores/...").

Roda sem internet e sem conta: tira só a função full_url do robo.py e confere os links.
    python3 testes/malak_links.py
"""
import ast, os, re, sys, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(AQUI, '..', 'server', 'malak', 'robo.py'), encoding='utf-8').read()
arv = ast.parse(src)
fn = next(n for n in arv.body if isinstance(n, ast.FunctionDef) and n.name == 'full_url')
ns = {'re': re, 'urllib': urllib, 'SITE': 'https://salvetheapp.web.app/'}
exec(compile(ast.Module(body=[fn], type_ignores=[]), 'robo.py', 'exec'), ns)
full_url = ns['full_url']

casos = [
    ('scores/teu-popo/v20261125/grade.pdf', 'https://salvetheapp.web.app/scores/teu-popo/v20261125/grade.pdf'),
    ('/scores/teu-popo/v20261125/grade.pdf', 'https://salvetheapp.web.app/scores/teu-popo/v20261125/grade.pdf'),
    ('scores/céu azul/Trompete Bb.pdf', 'https://salvetheapp.web.app/scores/c%C3%A9u%20azul/Trompete%20Bb.pdf'),
    ('https://firebasestorage.googleapis.com/v0/b/x/o/bands%2Fa%2Fb.pdf?alt=media&token=1',
     'https://firebasestorage.googleapis.com/v0/b/x/o/bands%2Fa%2Fb.pdf?alt=media&token=1'),
    ('  https://salvetheapp.web.app/scores/a.pdf ', 'https://salvetheapp.web.app/scores/a.pdf'),
]
falhas = 0
for entrada, esperado in casos:
    saiu = full_url(entrada)
    ok = saiu == esperado
    falhas += not ok
    print('ok  ' if ok else 'FAIL', repr(entrada), '->', saiu)
assert 'urlopen(full_url(url)' in src, 'download() precisa usar full_url'
print('ok   download() usa full_url')
sys.exit(1 if falhas else 0)
