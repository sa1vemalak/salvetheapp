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
harm = None
for st in ('guitar', 'piano', 'other', 'bass'):
    if st in stems:
        a = librosa.load(stems[st], sr=SR, mono=True)[0]
        harm = a if harm is None else harm[:len(a)] + a[:len(harm)]
chroma = librosa.feature.chroma_cqt(y=harm, sr=SR, hop_length=512)
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9]}
temps = []
for r in range(12):
    for q, iv in QUAL.items():
        v = np.zeros(12); v[[(r + i) % 12 for i in iv]] = 1; v[r] += 0.5
        temps.append((NAMES[r] + q, v / np.linalg.norm(v), r))
bass_notes = notas.get('bass', [])
cifras = []
edges = beats + [len(y) / SR]
for i in range(len(beats)):
    f0, f1 = librosa.time_to_frames([edges[i], edges[i + 1]], sr=SR, hop_length=512)
    c = chroma[:, f0:max(f0 + 1, f1)].mean(1)
    if c.sum() < 1e-6:
        cifras.append(None); continue
    c = c / (np.linalg.norm(c) + 1e-9)
    bn = [n[2] % 12 for n in bass_notes if n[0] < edges[i + 1] and n[1] > edges[i]]
    broot = max(set(bn), key=bn.count) if bn else None
    best = max(temps, key=lambda t: float(c @ t[1]) + (0.15 if broot is not None and t[2] == broot else 0))
    cifras.append(best[0])
# smooth: a chord must last at least 2 beats
sm = list(cifras)
for i in range(1, len(sm) - 1):
    if sm[i] != sm[i - 1] and sm[i] != sm[i + 1] and sm[i - 1] == sm[i + 1]:
        sm[i] = sm[i - 1]
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
oth = notas.get('other', [])
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
