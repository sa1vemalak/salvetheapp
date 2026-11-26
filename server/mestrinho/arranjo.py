"""Mestrinho: horn section arrangement (trumpet / tenor sax / trombone) from what was heard.
  lead  = the highest note of each section hit in the "other" stem (where the horns attack together)
  inner = chord tones under the lead (sax), and a guide tone / root below (trombone), each in its range,
          moving as little as possible from one hit to the next.
All pitches here are sounding (concert) MIDI numbers."""
import numpy as np

RANGES = {'trompete': (58, 84), 'sax': (48, 74), 'trombone': (40, 65)}
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9]}


def chord_pcs(name):
    if not name:
        return None, []
    for r in sorted(NAMES, key=len, reverse=True):
        if name.startswith(r):
            root = NAMES.index(r); iv = QUAL.get(name[len(r):], [0, 4, 7])
            return root, [(root + i) % 12 for i in iv]
    return None, []


def hits_from(other, lo=52, hi=86, win=0.05, mindur=0.08):
    """section hits: 2+ notes starting together (within 50 ms) in the horn range -> (start, end, [pitches])"""
    ns = sorted(n for n in other if lo <= n[2] <= hi and n[1] - n[0] >= mindur)
    out, i = [], 0
    while i < len(ns):
        j = i
        while j + 1 < len(ns) and ns[j + 1][0] - ns[i][0] <= win:
            j += 1
        if j > i:
            clu = ns[i:j + 1]
            out.append((clu[0][0], float(np.median([c[1] for c in clu])), sorted({c[2] for c in clu})))
        i = j + 1
    return out


def nearest(pc_list, target, lo, hi, below=None):
    cands = [p for p in range(lo, hi + 1) if p % 12 in pc_list and (below is None or p < below)]
    return min(cands, key=lambda p: abs(p - target)) if cands else None


def drop_leakage(hits, others, win=0.05):
    """a 'hit' whose notes are also starting in the guitar/piano stems at the same moment is that instrument leaking"""
    if not others:
        return hits
    ons = {}
    for s, e, p, *_ in others:
        ons.setdefault(p % 12, []).append(s)
    for k in ons:
        ons[k] = np.array(sorted(ons[k]))
    out = []
    for s, e, ps in hits:
        shared = 0
        for p in ps:
            a = ons.get(p % 12)
            if a is not None and len(a) and np.min(np.abs(a - s)) < win:
                shared += 1
        if shared < len(ps) / 2:
            out.append((s, e, ps))
    return out


def texture(ps):
    """'oitavas' when the section plays one note in octaves/unison, else 'vozes'"""
    return 'oitavas' if len({p % 12 for p in ps}) == 1 else 'vozes'


def fit(p, lo, hi):
    while p > hi: p -= 12
    while p < lo: p += 12
    return p


def arrange(other, chord_at, leak=None, min_len=0.0):
    """returns {'trompete': [(s, e, pitch)], 'sax': [...], 'trombone': [...]}"""
    parts = {k: [] for k in RANGES}
    prev = {'trompete': 72, 'sax': 62, 'trombone': 52}
    hits = [h for h in drop_leakage(hits_from(other), leak) if h[1] - h[0] >= min_len]
    for s, e, ps in hits:
        if texture(ps) == 'oitavas':
            lead = fit(max(ps), *RANGES['trompete'])
            for k, p in (('trompete', lead), ('sax', fit(lead - 12, *RANGES['sax'])), ('trombone', fit(lead - 12, *RANGES['trombone']))):
                parts[k].append((s, e, p)); prev[k] = p
            continue
        root, pcs = chord_pcs(chord_at(s))
        lead = max(ps)
        while lead > RANGES['trompete'][1]: lead -= 12
        while lead < RANGES['trompete'][0]: lead += 12
        if not pcs:
            pcs = [p % 12 for p in ps]
        guide = [pc for pc in pcs if root is None or (pc - root) % 12 in (3, 4, 10, 11)] or pcs
        sax = nearest([pc for pc in pcs if pc != lead % 12] or pcs, min(prev['sax'], lead - 3), *RANGES['sax'], below=lead)
        tbn = nearest([pc for pc in guide if sax is None or pc != sax % 12] or pcs, prev['trombone'], *RANGES['trombone'], below=sax if sax else lead)
        for k, p in (('trompete', lead), ('sax', sax), ('trombone', tbn)):
            if p is not None:
                parts[k].append((s, e, p)); prev[k] = p
    return parts
