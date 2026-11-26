"""Render one song: horn stems from real samples + base from the soundfont, then every mixer combination."""
import sys, os, json, subprocess, itertools
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hornsampler as H

S = '/tmp/claude-0/-home-user/7639134b-da79-503b-9d91-2316ae46b5a7/scratchpad'
song = sys.argv[1]
IN = os.environ.get('MIX_IN', os.path.join(S, 'out4'))
OUT = os.environ.get('MIX_OUT', os.path.join(S, 'audio5')); os.makedirs(OUT, exist_ok=True)
STEMS = os.environ.get('MIX_STEMS', os.path.join(S, 'stems5')); os.makedirs(STEMS, exist_ok=True)
ev = json.load(open(f'{IN}/{song}.events.json'))
PAN = {'trumpet': 36, 'tenor-sax': 92, 'trombone': 62}
PARTS = ['trumpet', 'tenor-sax', 'trombone', 'base']
stems = {}
for part in PARTS[:3]:
    d = ev['parts'][part]
    if d['notes']:
        b = H.render_part(part, d['notes'], d['cc'], ev['end_ms'])
        stems[part] = H.room(H.pan(b, PAN[part]), 0.30)
# base: soundfont piano + bass, dry, then the same hall
wav = f'{STEMS}/{song}__base-dry.wav'
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.5', '-r', str(H.SR), '-o', 'synth.reverb.active=0', '-F', wav,
                '/usr/share/sounds/sf2/MuseScore_General_Full.sf2', f'{IN}/{song}__so-base.mid'], check=True, capture_output=True)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '2', '-ar', str(H.SR), '-'], capture_output=True, check=True).stdout
stems['base'] = H.room(np.frombuffer(raw, dtype=np.float32).reshape(-1, 2) * 2.8, 0.18)
n = max(len(v) for v in stems.values())
for k in stems:
    if len(stems[k]) < n:
        stems[k] = np.concatenate([stems[k], np.zeros((n - len(stems[k]), 2), np.float32)])
avail = [p for p in PARTS if p in stems]
mixes = {'tudo': avail}
for p in avail:
    mixes['so-' + p] = [p]
    if len(avail) == 4:
        mixes['sem-' + p] = [x for x in avail if x != p]
for a, b in itertools.combinations(avail, 2):
    if len(avail) > 2:
        mixes[f'duo-{a}+{b}'] = [a, b]
# trim to the song length (same as before) so the bar map stays in sync
L = int((ev['end_ms'] / 1000 + 2.0) * H.SR)
for name, parts in mixes.items():
    mix = sum(stems[p] for p in parts)[:L]
    peak = float(np.abs(mix).max()) or 1
    gain = min(10 ** (14 / 20), 10 ** (-1.5 / 20) / peak)
    m4a = f'{OUT}/{song}__{name}.m4a'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(H.SR), '-ac', '2', '-i', '-', '-c:a', 'aac', '-b:a', '128k', m4a],
                   input=(mix * gain).astype(np.float32).tobytes(), check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=1', '-i', m4a, '-map', '0:v', '-map', '1:a',
                    '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart',
                    f'{OUT}/{song}__{name}.mp4'], check=True)
print(song, 'mixes', len(mixes), 'stems', list(stems))
