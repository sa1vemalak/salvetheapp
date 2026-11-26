"""When are horns sounding? Sound event detection (PANNs, trained on AudioSet) over the 'other' stem.
  python3 metais.py other.wav metais.json   ->  {"fps": 10, "classes": [...], "prob": [...]} (max over brass classes)"""
import json, sys
import numpy as np, librosa
from panns_inference import SoundEventDetection, labels

src, out = sys.argv[1], sys.argv[2]
y, _ = librosa.load(src, sr=32000, mono=True)
sed = SoundEventDetection(checkpoint_path=None, device='cpu')
WANT = ['Brass instrument', 'Trumpet', 'Trombone', 'Saxophone', 'French horn', 'Wind instrument, woodwind instrument', 'Clarinet', 'Flute']
idx = [labels.index(w) for w in WANT if w in labels]
probs = []
step = 32000 * 30  # 30 s chunks keep memory low
for a in range(0, len(y), step):
    seg = y[a:a + step]
    if len(seg) < 32000:
        seg = np.pad(seg, (0, 32000 - len(seg)))
    fw = sed.inference(seg[None, :])[0]  # (frames at 100 fps, 527)
    p = fw[:, idx].max(1)
    n = int(len(y[a:a + step]) / 32000 * 100)
    probs.append(p[:max(1, n)])
p = np.concatenate(probs)
p10 = p[: len(p) // 10 * 10].reshape(-1, 10).max(1)  # 10 frames per second
json.dump({'fps': 10, 'classes': [WANT[i] for i in range(len(idx))], 'prob': [round(float(x), 3) for x in p10]}, open(out, 'w'))
print('[metais] média', float(p10.mean()), 'máximo', float(p10.max()), flush=True)
