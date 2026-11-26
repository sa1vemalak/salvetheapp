"""Render horn stems (trumpet, tenor sax, trombone) from real recorded samples.

Trumpet and trombone: VSCO 2 Community Edition (Versilian Studios, CC0).
Tenor sax: MTG Solo Saxophones (Music Technology Group, UPF, CC-BY-4.0; SFZ by kinwie).

Input: <song>.events.json written by mscx2mid.py (notes in ms with velocity, legato and grace flags,
plus CC11 expression points). Output: one stereo float WAV per horn part.
"""
import json, os, re, subprocess, sys
import numpy as np
from scipy.signal import fftconvolve

SR = 48000
LIBS = os.environ.get('HORN_LIBS', '/opt/libs')
_cache = {}


def load(path):
    """Decode any audio file to float32 stereo at SR (cached)."""
    if path not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                             capture_output=True, check=True).stdout
        _cache[path] = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    return _cache[path]


def parse_vsco(sfz):
    """Regions of a simple VSCO sfz: list of dicts with path, lokey, hikey, center, lovel, hivel, gain_db, rr."""
    base = os.path.dirname(sfz)
    text = open(sfz, encoding='utf8', errors='ignore').read()
    dpath = re.search(r'default_path=([^\n]+)', text).group(1).strip().replace('\\', '/')
    regions, group = [], {}
    for block in re.split(r'(?=<group>|<region>)', text):
        kv = dict(re.findall(r'(\w+)=([^\n]+)', block))
        kv = {k: v.strip() for k, v in kv.items()}
        if block.startswith('<group>'):
            group = kv
        elif block.startswith('<region>') and 'sample' in kv:
            r = {**group, **kv}
            regions.append(dict(path=os.path.join(base, dpath, r['sample']), lokey=int(r.get('lokey', r.get('key', 0))),
                                hikey=int(r.get('hikey', r.get('key', 127))), center=int(r.get('pitch_keycenter', r.get('key', 60))),
                                lovel=int(r.get('lovel', 0)), hivel=int(r.get('hivel', 127)), gain_db=float(r.get('volume', 0)),
                                tune=float(r.get('tune', 0)), rr=r.get('seq_position', r.get('lorand', '0'))))
    return regions


def parse_mtg_tenor():
    base = os.path.join(LIBS, 'mtgsax', 'MTG Solo Saxophones')
    regions = []
    for layer, lo, hi in (('p', 0, 100), ('f', 101, 127)):
        for rr in (1, 2, 3):
            for line in open(os.path.join(base, 'Data', f'ten_{layer}_rr{rr}.txt'), encoding='utf8'):
                kv = dict(re.findall(r'(\w+)=(\S+)', line))
                if 'sample' not in kv:
                    continue
                key = int(kv['key'])
                regions.append(dict(path=os.path.join(base, 'Samples', kv['sample'].replace('$EXT', 'flac')), lokey=key, hikey=key,
                                    center=int(kv.get('pitch_keycenter', key)), lovel=lo, hivel=hi, gain_db=float(kv.get('volume', 0)),
                                    tune=float(kv.get('tune', 0)), rr=str(rr)))
    return regions


def instrument(name):
    v = os.path.join(LIBS, 'vsco')
    if name == 'trumpet':
        return dict(sus=parse_vsco(os.path.join(v, 'TrumpetSus.sfz')), stac=parse_vsco(os.path.join(v, 'TrumpetStac.sfz')), level=0.71)
    if name == 'trombone':
        return dict(sus=parse_vsco(os.path.join(v, 'TromboneSus.sfz')), stac=parse_vsco(os.path.join(v, 'TromboneStac.sfz')), level=2.2)
    if name == 'tenor-sax':
        return dict(sus=parse_mtg_tenor(), stac=None, level=3.2)
    raise ValueError(name)


_fix_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tuning_fix.json')
try:
    _fix = json.load(open(_fix_path))
except Exception:
    _fix = {}


def tuning_fix(r, short):
    """Cents to shift this recording so it sits exactly on its key centre (measured once, cached).
    Replaces the library's own tune value; falls back to it when the measurement is unreliable."""
    key = r['path'] + '|' + str(r['center']) + '|' + str(r['tune'])
    if key not in _fix:
        src = load(r['path'])
        st = int(np.argmax(np.abs(src).mean(1) > 0.05 * np.abs(src).max()))
        a, b = (0.04, 0.16) if short else (0.3, 0.9)
        x = src[st + int(a * SR):st + int(b * SR)].mean(1)
        x = x - x.mean(); n = len(x)
        c = np.fft.irfft(np.abs(np.fft.rfft(x, 2 * n)) ** 2)[:n]
        lo, hi = int(SR / 1400), int(SR / 55); k = lo + int(np.argmax(c[lo:hi]))
        y0, y1, y2 = c[k - 1], c[k], c[k + 1]; kk = k + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)
        exp = 440 * 2 ** ((r['center'] - 69) / 12)
        cents = 1200 * np.log2((SR / kk) / exp)
        cents = (cents + 600) % 1200 - 600
        _fix[key] = float(-cents) if abs(cents) < 70 and abs(-cents - r['tune']) < 45 else float(r['tune'])
        json.dump(_fix, open(_fix_path, 'w'))
    return _fix[key]


def pick(regions, pitch, vel, counter):
    """Closest key region for the velocity, rotating round robins."""
    cand = [r for r in regions if r['lovel'] <= vel <= r['hivel']] or regions
    inside = [r for r in cand if r['lokey'] <= pitch <= r['hikey']]
    if not inside:
        d = min(abs(pitch - r['center']) for r in cand)
        inside = [r for r in cand if abs(pitch - r['center']) == d]
    inside.sort(key=lambda r: r['rr'])
    best = inside
    counter[pitch] = counter.get(pitch, -1) + 1
    return best[counter[pitch] % len(best)]


def extended(src, need, loopable):
    """Make the source at least `need` frames long by crossfade-looping its steady middle part."""
    if len(src) >= need or not loopable:
        return src
    a, b = int(len(src) * 0.45), int(len(src) * 0.85)
    if b - a < SR // 4:
        a, b = len(src) // 3, len(src) - SR // 20
    seg = src[a:b]
    xf = min(int(0.12 * SR), len(seg) // 3)
    out = [src[:b]]
    total = b
    ramp = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
    while total < need + xf:
        prev = out[-1]
        out[-1] = prev[:-xf]
        out.append(prev[-xf:] * (1 - ramp) + seg[:xf] * ramp)
        out.append(seg[xf:])
        total += len(seg) - xf
    return np.concatenate(out)


def render_part(name, notes, ccs, length_ms):
    inst = instrument(name)
    n_out = int((length_ms / 1000 + 3) * SR)
    buf = np.zeros((n_out, 2), dtype=np.float32)
    counter = {}
    prev_end = -1
    for i, (ms, me, pitch, vel, leg, grace) in enumerate(notes):
        dur = (me - ms) / 1000
        short = inst['stac'] is not None and (dur < 0.26 or grace)
        regs = inst['stac'] if short else inst['sus']
        r = pick(regs, pitch, vel, counter)
        src = load(r['path'])
        ratio = 2 ** ((pitch - r['center']) / 12 + tuning_fix(r, short) / 1200)
        follows_legato = i > 0 and notes[i - 1][4] and abs(notes[i - 1][1] - ms) < 60
        start_off = int(0.035 * SR) if follows_legato and not short else 0
        rel = 0.09 if short else (0.06 if leg else 0.16)
        n_note = int((dur + rel) * SR) if not short else min(len(src) - start_off, int((dur + 0.35) * SR))
        need_src = int(start_off + n_note * ratio) + 2
        src_x = extended(src, need_src, loopable=not short)
        pos = start_off + np.arange(n_note, dtype=np.float64) * ratio
        pos = pos[pos < len(src_x) - 1]
        if not len(pos):
            continue
        sig = np.stack([np.interp(pos, np.arange(len(src_x)), src_x[:, c]) for c in (0, 1)], axis=1).astype(np.float32)
        # envelope: gentle fade-in when joined by a slur, release at the note end
        env = np.ones(len(sig), dtype=np.float32)
        if follows_legato:
            k = min(len(env), int(0.03 * SR)); env[:k] = np.linspace(0.2, 1, k)
        r_n = min(len(env), int(rel * SR))
        if not short:
            env[-r_n:] *= np.linspace(1, 0, r_n) ** 1.5
        else:
            cut = min(len(env), int((dur + 0.05) * SR))
            tail = env[cut:]
            if len(tail):
                env[cut:] = np.linspace(1, 0, len(tail)) ** 2
        gain = 10 ** (r['gain_db'] / 20) * (vel / 127) ** 1.25 * inst['level'] * (0.7 if grace else 1)
        s0 = int(ms / 1000 * SR)
        e0 = min(n_out, s0 + len(sig))
        buf[s0:e0] += sig[:e0 - s0] * env[:e0 - s0, None] * gain
        prev_end = me
    # expression (hairpins): smooth gain curve from the CC11 points
    if ccs:
        t = np.array([c[0] for c in ccs], dtype=np.float64) / 1000 * SR
        v = np.array([c[1] for c in ccs], dtype=np.float64)
        tt = np.concatenate([[0], t, [n_out]]); vv = np.concatenate([[100], v, [v[-1]]])
        curve = (np.interp(np.arange(n_out), tt, vv) / 100) ** 1.4
        buf *= curve[:, None].astype(np.float32)
    return buf


_IR = None


def hall_ir():
    """Stereo concert-hall impulse response: pre-delay, early reflections, a tail that darkens as it decays."""
    global _IR
    if _IR is not None:
        return _IR
    from scipy.signal import butter, lfilter
    rng = np.random.default_rng(11)
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    pre = int(0.022 * SR)
    ir = np.zeros((n, 2), dtype=np.float64)
    # early reflections, different on each side
    for ch in (0, 1):
        for _ in range(14):
            d = rng.uniform(0.006, 0.075)
            ir[pre + int(d * SR), ch] += rng.uniform(0.25, 0.6) * (1 - d / 0.09) * rng.choice([-1, 1])
    # diffuse tail: a bright part that dies fast and a dark part that lasts (RT60 ~ 2.0 s)
    bl, al = butter(2, 2600 / (SR / 2), 'low')
    for ch in (0, 1):
        noise = rng.standard_normal(n)
        bright = noise * np.exp(-6.9 * t / 0.9)
        dark = lfilter(bl, al, rng.standard_normal(n)) * np.exp(-6.9 * t / 2.0) * 1.6
        tail = (bright + dark) * np.clip((t - 0.035) / 0.05, 0, 1)
        ir[:, ch] += np.concatenate([np.zeros(pre), tail[:n - pre]]) * 0.35
    # keep the low end of the reverb clean
    bh, ah = butter(2, 180 / (SR / 2), 'high')
    ir = lfilter(bh, ah, ir, axis=0)
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
    _IR = ir.astype(np.float32)
    return _IR


def room(buf, wet):
    """Dry signal plus the shared hall reverb at `wet` level."""
    ir = hall_ir()
    out = buf.copy()
    for c in (0, 1):
        out[:, c] += wet * fftconvolve(buf[:, c], ir[:, c])[:len(buf)].astype(np.float32)
    return out


def pan(buf, p, width=0.35):
    """Place a stereo stem: p in [0,127] (64 centre), keeping `width` of the recording's own stereo image."""
    mid = buf.mean(1)
    side = (buf[:, 0] - buf[:, 1]) / 2 * width
    th = (p / 127) * np.pi / 2
    l = mid * np.cos(th) * 1.41 + side
    r = mid * np.sin(th) * 1.41 - side
    return np.stack([l, r], axis=1).astype(np.float32)


def write(path, buf):
    raw = buf.astype(np.float32).tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', path],
                   input=raw, check=True)


if __name__ == '__main__':
    events_path, outdir = sys.argv[1], sys.argv[2]
    song = os.path.basename(events_path).replace('.events.json', '')
    ev = json.load(open(events_path))
    PAN = {'trumpet': 36, 'tenor-sax': 92, 'trombone': 62}
    for part in ('trumpet', 'tenor-sax', 'trombone'):
        d = ev['parts'][part]
        if not d['notes']:
            continue
        b = render_part(part, d['notes'], d['cc'], ev['end_ms'])
        b = room(pan(b, PAN[part]), 0.30)
        write(os.path.join(outdir, f'{song}__stem-{part}.wav'), b)
        print(song, part, 'peak', round(float(np.abs(b).max()), 3))
