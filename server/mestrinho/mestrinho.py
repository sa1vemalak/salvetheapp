"""Mestrinho: audio -> score material (first version).

  python3 mestrinho.py audio.mp3 out_dir

Writes out_dir/:
  stems/*.wav            separated instruments (Demucs htdemucs_6s: vocals, drums, bass, guitar, piano, other)
  notas.json             transcribed notes per stem [[start_s, end_s, midi, amp], ...] (Basic Pitch)
  batidas.json           tempo, beat times, downbeat guess
  cifras.json            one chord per beat (chroma templates + bass), smoothed
  rascunho.musicxml      quantized draft: Voz, Sopros 1-3 (from the "other" stem), Baixo, Base (chord symbols)
"""
import json, os, subprocess, sys, glob
import numpy as np
import librosa

AUDIO, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
SR = 22050


def log(*a):
    print('[mestrinho]', *a, flush=True)


# ---------------- 1. separate ----------------
stems_dir = os.path.join(OUT, 'stems')
if not glob.glob(os.path.join(stems_dir, '*.wav')):
    log('separando instrumentos (Demucs htdemucs_6s)')
    subprocess.run([sys.executable, '-m', 'demucs', '-n', 'htdemucs_6s', '-j', str(os.cpu_count() or 4), '-o', os.path.join(OUT, 'demucs'), AUDIO], check=True)
    src = glob.glob(os.path.join(OUT, 'demucs', 'htdemucs_6s', '*'))[0]
    os.makedirs(stems_dir, exist_ok=True)
    for f in glob.glob(os.path.join(src, '*.wav')):
        os.replace(f, os.path.join(stems_dir, os.path.basename(f)))
stems = {os.path.splitext(os.path.basename(f))[0]: f for f in glob.glob(os.path.join(stems_dir, '*.wav'))}
log('stems:', sorted(stems))

# ---------------- 2. beats ----------------
y, _ = librosa.load(AUDIO, sr=SR, mono=True)
perc = librosa.load(stems['drums'], sr=SR, mono=True)[0] if 'drums' in stems else y
onset = librosa.onset.onset_strength(y=perc + 0.5 * y, sr=SR)
tempo, beats = librosa.beat.beat_track(onset_envelope=onset, sr=SR, units='time', tightness=200)
tempo = float(np.atleast_1d(tempo)[0])
beats = [float(b) for b in beats]
# downbeat: the beat phase (of 4) where the bass hits hardest
bass_y = librosa.load(stems['bass'], sr=SR, mono=True)[0] if 'bass' in stems else y
bon = librosa.onset.onset_strength(y=bass_y, sr=SR)
bt = librosa.time_to_frames(beats, sr=SR)
bt = bt[bt < len(bon)]
phase = int(np.argmax([bon[bt[i::4]].mean() if len(bt[i::4]) else 0 for i in range(4)]))
json.dump({'bpm': tempo, 'batidas': beats, 'fase_do_1': phase}, open(os.path.join(OUT, 'batidas.json'), 'w'))
log(f'andamento ~{tempo:.1f} bpm, {len(beats)} batidas, o "1" cai na batida {phase} de cada 4')

# ---------------- 3. notes ----------------
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import pathlib
_onnx = pathlib.Path(ICASSP_2022_MODEL_PATH).parent / 'nmp.onnx'
MODEL = str(_onnx) if _onnx.exists() else ICASSP_2022_MODEL_PATH  # the ONNX model runs everywhere
CFG = {  # stem: (min Hz, max Hz, onset threshold, frame threshold, min note ms)
    'vocals': (80, 1100, 0.5, 0.3, 90), 'bass': (30, 400, 0.5, 0.3, 90), 'other': (100, 2000, 0.45, 0.3, 70),
    'guitar': (70, 1400, 0.5, 0.3, 70), 'piano': (27, 4200, 0.5, 0.3, 60),
}
notas = {}
for st, (lo, hi, on, fr, mn) in CFG.items():
    if st not in stems:
        continue
    log('transcrevendo', st)
    _, _, ev = predict(stems[st], MODEL, onset_threshold=on, frame_threshold=fr, minimum_note_length=mn,
                       minimum_frequency=lo, maximum_frequency=hi, multiple_pitch_bends=False, melodia_trick=True)
    notas[st] = sorted([[round(float(s), 3), round(float(e), 3), int(p), round(float(a), 3)] for s, e, p, a, *_ in ev])
    log(f'  {len(notas[st])} notas')
json.dump(notas, open(os.path.join(OUT, 'notas.json'), 'w'))

# ---------------- 4. chords ----------------
# from the transcribed notes of guitar + piano + "other", one chord per bar (4 beats), the bass note weighs in;
# measured on Capricorniana: root right 65%, chord tones 80% (the chroma version had 57% / 69%)
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9]}
temps = []
for r in range(12):
    for q, iv in QUAL.items():
        v = np.zeros(12); v[[(r + i) % 12 for i in iv]] = 1
        temps.append((NAMES[r] + q, r, v / np.linalg.norm(v)))
harm_notes = [n for st in ('guitar', 'piano', 'other') for n in notas.get(st, [])]
bass_notes = notas.get('bass', [])
edges = beats + [beats[-1] + 60.0 / tempo] if beats else [0.0]


def pcs_in(ns, a, b):
    h = np.zeros(12)
    for s0, e0, p, amp in ns:
        ov = min(b, e0) - max(a, s0)
        if ov > 0:
            h[p % 12] += ov * amp
    return h


SPAN, BASS_W, KEEP_W = 4, 0.2, 0.1
cifras = []
start = phase % SPAN
for i in range(0, start):
    cifras.append(None)
for i in range(start, len(beats), SPAN):
    a, b = edges[i], edges[min(i + SPAN, len(beats))]
    h, hb = pcs_in(harm_notes, a, b), pcs_in(bass_notes, a, b)
    if h.sum() + hb.sum() == 0:
        cifras += [None] * SPAN; continue
    v = h / (np.linalg.norm(h) + 1e-9); broot = int(np.argmax(hb)) if hb.sum() else None
    prev = next((c for c in reversed(cifras) if c), None)
    best = max(temps, key=lambda t: float(v @ t[2]) + (BASS_W if t[1] == broot else 0) + (KEEP_W if prev == t[0] else 0))
    cifras += [best[0]] * SPAN
sm = cifras[:len(beats)]
json.dump([{'t': beats[i], 'cifra': sm[i]} for i in range(len(beats))], open(os.path.join(OUT, 'cifras.json'), 'w'))
log('cifras:', len(set(x for x in sm if x)), 'acordes diferentes')

# ---------------- 5. draft score ----------------
import music21 as m21
beat_dur = 60.0 / tempo
t0 = beats[phase] if beats else 0.0


def ql_at(t):  # seconds -> quarter-note offset on the beat grid (interpolated between detected beats)
    b = np.interp(t, beats, np.arange(len(beats))) if beats else t / beat_dur
    return round((b - phase) * 4) / 4  # nearest 16th


def part_from(notes, name, inst, lo=0, hi=127):
    p = m21.stream.Part(); p.partName = name; p.insert(0, inst)
    last_end = 0.0
    for s, e, pitch, amp in notes:
        if not (lo <= pitch <= hi):
            continue
        a, b = ql_at(s), ql_at(e)
        if a < 0 or b - a < 0.25 or a < last_end:
            continue
        n = m21.note.Note(pitch, quarterLength=max(0.25, b - a)); n.volume.velocity = int(40 + 80 * amp)
        p.insert(a, n); last_end = a + n.quarterLength
    return p


score = m21.stream.Score()
if 'vocals' in notas:
    score.insert(0, part_from(notas['vocals'], 'Voz (melodia)', m21.instrument.Vocalist()))
def section_hits(ns, lo=52, hi=84, win=0.05):
    ns = sorted(n for n in ns if lo <= n[2] <= hi and n[1] - n[0] >= 0.08)
    out, i = [], 0
    while i < len(ns):
        j = i
        while j + 1 < len(ns) and ns[j + 1][0] - ns[i][0] <= win:
            j += 1
        if j > i:
            out += ns[i:j + 1]
        i = j + 1
    return out


oth = section_hits(notas.get('other', []))
score.insert(0, part_from(oth, 'Sopro 1 (rascunho)', m21.instrument.Trumpet(), 64, 84))
score.insert(0, part_from(oth, 'Sopro 2 (rascunho)', m21.instrument.TenorSaxophone(), 52, 72))
score.insert(0, part_from(oth, 'Sopro 3 (rascunho)', m21.instrument.Trombone(), 40, 62))
if 'bass' in notas:
    score.insert(0, part_from(notas['bass'], 'Baixo', m21.instrument.ElectricBass()))
base = m21.stream.Part(); base.partName = 'Base (cifras)'; base.insert(0, m21.instrument.ElectricGuitar())
prev = None
for i, c in enumerate(sm):
    if c and c != prev and i >= phase:
        try:
            base.insert((i - phase), m21.harmony.ChordSymbol(c.replace('b', '-', 1) if len(c) > 1 and c[1] == 'b' else c))
        except Exception:
            pass
        prev = c
score.insert(0, base)
score.insert(0, m21.tempo.MetronomeMark(number=round(tempo)))
try:
    score.makeMeasures(inPlace=True)
except Exception as e:
    log('compassos:', e)
score.write('musicxml', fp=os.path.join(OUT, 'rascunho.musicxml'))
log('pronto')
