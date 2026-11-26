"""Compares Mestrinho's output with the official score (events from mscx2mid).

  python3 avaliar.py out_dir gabarito.events.json gabarito.json
"""
import json, sys, os
import numpy as np

out, ev_path, meta_path = sys.argv[1:4]
notas = json.load(open(f'{out}/notas.json'))
bat = json.load(open(f'{out}/batidas.json'))
cif = json.load(open(f'{out}/cifras.json'))
ref = json.load(open(ev_path))['parts']
meta = json.load(open(meta_path))

# reference notes in seconds
R = {k: [(n[0] / 1000, n[1] / 1000, n[2]) for n in v['notes']] for k, v in ref.items()}
horns = sorted(R['trumpet'] + R['tenor-sax'] + R['trombone'])
base = sorted(R['base'])
if not base:  # the base (chords) comes from the rendered MIDI of the chart part
    import mido, glob
    f = glob.glob(os.path.join(os.path.dirname(ev_path), '*__so-base.mid'))[0]
    mid = mido.MidiFile(f); t = 0.0; on = {}
    for msg in mid:
        t += msg.time
        if msg.type == 'note_on' and msg.velocity: on.setdefault(msg.note, []).append(t)
        elif msg.type in ('note_off', 'note_on') and on.get(msg.note):
            base.append((on[msg.note].pop(0), t, msg.note))
    base.sort()

# ---- global time offset between the recording and the score: best match of horn onsets ----
est_h = [(s, e, p) for s, e, p, a in notas.get('other', [])]
def matches(ref_on, est_on, off, tol=0.07):
    est = np.array(sorted(est_on)) + off
    if not len(est): return 0
    idx = np.searchsorted(est, ref_on)
    hit = 0
    for r, i in zip(ref_on, idx):
        d = min(abs(est[j] - r) for j in (i - 1, i) if 0 <= j < len(est))
        hit += d <= tol
    return hit
ref_on = np.array([s for s, e, p in horns])
# the recording may start later in the form (intro outside the DAW project): look for the best shift up to ±40 s
eo = np.array(sorted(s for s, e, p in est_h))
diffs = (ref_on[:, None] - eo[None, :]).ravel()
diffs = diffs[np.abs(diffs) < 40]
hist, edges_ = np.histogram(diffs, bins=np.arange(-40, 40.02, 0.02))
c = int(np.argmax(hist)); off0 = (edges_[c] + edges_[c + 1]) / 2
offs = np.arange(off0 - 0.1, off0 + 0.1, 0.005)
score = [matches(ref_on, list(eo), o, 0.05) for o in offs]
off = float(offs[int(np.argmax(score))])
print(f'deslocamento do áudio em relação à partitura: {off:+.2f} s')

# ---- tempo ----
m = meta['measures']; beats_ref = meta['beats']
q = [(m[i + 1][1] - m[i][1]) / beats_ref[i] for i in range(len(m) - 1) if beats_ref[i]]
bpm_ref = 60 / np.median(q)
print(f'andamento: Mestrinho {bat["bpm"]:.1f} bpm | partitura {bpm_ref:.1f} bpm (mediana; {"bate" if abs(bat["bpm"] - bpm_ref) / bpm_ref < 0.04 or abs(bat["bpm"] / 2 - bpm_ref) / bpm_ref < 0.04 or abs(bat["bpm"] * 2 - bpm_ref) / bpm_ref < 0.04 else "NÃO bate"})')
eb = np.array(bat['batidas']) + off
rb = []
for i in range(len(m) - 1):
    for k in range(int(beats_ref[i])):
        rb.append(m[i][1] + k * (m[i + 1][1] - m[i][1]) / beats_ref[i])
rb = np.array(rb)
if len(eb):
    d = np.array([np.min(np.abs(eb - t)) for t in rb])
    print(f'batidas da partitura encontradas no áudio (até 70 ms): {np.mean(d <= 0.07):.0%}')

# ---- notes (horns vs "other"), onset within 70 ms ----
def f1(refn, estn, off, tol=0.07, mode='exact'):
    est = sorted([(s + off, p) for s, e, p in estn])
    used = set(); tp = 0
    es = np.array([x[0] for x in est])
    for s, e, p in refn:
        i0, i1 = np.searchsorted(es, s - tol), np.searchsorted(es, s + tol)
        for j in range(i0, i1):
            if j in used: continue
            ep = est[j][1]
            ok = ep == p if mode == 'exact' else (ep % 12 == p % 12)
            if ok: used.add(j); tp += 1; break
    prec = tp / max(1, len(est)); rec = tp / max(1, len(refn))
    return tp, prec, rec, 2 * prec * rec / max(1e-9, prec + rec)
for mode, lab in (('exact', 'altura exata'), ('pc', 'mesma nota, qualquer oitava')):
    tp, p, r, f = f1(horns, est_h, off, mode=mode)
    print(f'sopros ({lab}): acertou {tp} de {len(horns)} notas da partitura (cobertura {r:.0%}), {p:.0%} do que transcreveu está certo, F1 {f:.0%}')
for nm in ('trumpet', 'tenor-sax', 'trombone'):
    tp, p, r, f = f1(R[nm], est_h, off, mode='exact')
    print(f'   {nm}: cobertura {r:.0%}')

# ---- bass: lowest base note pitch class at each estimated bass note ----
est_b = notas.get('bass', [])
ok = n = 0
for s, e, p, a in est_b:
    t = (s + e) / 2 + off
    sound = [x for x in base if x[0] <= t < x[1]]
    if not sound: continue
    n += 1; ok += (min(x[2] for x in sound) % 12) == p % 12
print(f'baixo: {ok}/{n} notas com a mesma nota da fundamental da base ({ok / max(1, n):.0%})')

# ---- chords: estimated chord vs pitch classes the base plays on that beat ----
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9]}
def pcs(name):
    for r in sorted(NAMES, key=len, reverse=True):
        if name.startswith(r):
            q = name[len(r):]; root = NAMES.index(r)
            return root, {(root + i) % 12 for i in QUAL.get(q, [0, 4, 7])}
    return None, set()
root_ok = n = 0; jac = []
for c in cif:
    if not c['cifra']: continue
    t = c['t'] + off + 0.05
    sound = [x for x in base if x[0] <= t < x[1]]
    if not sound: continue
    n += 1
    rroot = min(x[2] for x in sound) % 12; rset = {x[2] % 12 for x in sound}
    root, eset = pcs(c['cifra'])
    root_ok += root == rroot
    jac.append(len(eset & rset) / len(eset | rset))
print(f'cifras: fundamental certa em {root_ok / max(1, n):.0%} das batidas; notas do acorde em comum {np.mean(jac):.0%} (média)')
print(f'voz (melodia): {len(notas.get("vocals", []))} notas transcritas (a partitura não tem a voz para comparar)')
