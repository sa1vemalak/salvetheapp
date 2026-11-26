import json, sys, numpy as np
sys.path.insert(0, 'server/mestrinho'); import arranjo as AR
OFF = 11.01  # score time = audio time + OFF (the recording starts at bar 15)
gab = json.load(open('mest/gab/capricorniana.events.json'))['parts']
REF = {k: [(n[0] / 1000, n[2]) for n in gab[g]['notes']] for k, g in (('tpt', 'trumpet'), ('sax', 'tenor-sax'), ('tbn', 'trombone'))}
def f1(ref, est, tol, pc=False):
    est = sorted(est); used = set(); tp = 0; es = np.array([e[0] for e in est]) if est else np.array([])
    for t, p in ref:
        i0, i1 = np.searchsorted(es, t - tol), np.searchsorted(es, t + tol)
        for j in range(i0, i1):
            if j in used: continue
            if (est[j][1] % 12 == p % 12) if pc else (est[j][1] == p):
                used.add(j); tp += 1; break
    P = tp / max(1, len(est)); R = tp / max(1, len(ref)); return tp, P, R, 2 * P * R / max(1e-9, P + R)
def report(name, parts):
    out = []
    for k in ('tpt', 'sax', 'tbn'):
        est = [(s + OFF, p) for s, p in parts[k]]
        _, P, R, F = f1(REF[k], est, 0.2); _, _, _, Fpc = f1(REF[k], est, 0.2, pc=True)
        out.append(f'{k}: F1 {F:.0%} (achou {R:.0%} das notas oficiais, {P:.0%} do que escreveu está certo; mesma nota em qualquer oitava F1 {Fpc:.0%})')
    print(name); print('   ' + '\n   '.join(out))
ev = json.load(open(sys.argv[1]))
report('IA arranjadora', {k: [(e[0], e[2]) for e in v] for k, v in ev.items()})
# rule-based arranger (before), same input
notas = json.load(open('mest/out2/notas.json')); cif = json.load(open('mest/out2/cifras.json'))
ct = [(c['t'], c['cifra']) for c in cif]
def chord_at(t):
    c = [x for x in ct if x[0] <= t]; return c[-1][1] if c else None
leak = notas.get('guitar', []) + notas.get('piano', [])
r = AR.arrange(notas['other'], chord_at, leak)
report('arranjador por regras (antes)', {'tpt': [(s, p) for s, e, p in r['trompete']], 'sax': [(s, p) for s, e, p in r['sax']], 'tbn': [(s, p) for s, e, p in r['trombone']]})
print('notas oficiais:', {k: len(v) for k, v in REF.items()}, '| escritas pela IA:', {k: len(v) for k, v in ev.items()})
