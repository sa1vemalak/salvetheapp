"""Vector reader for score PDFs exported from notation programs (MuseScore, Dorico, Sibelius with SMuFL fonts).

In those PDFs every notehead, rest, flag, dot and accidental is a character of a music font (Leland, Bravura...) at its
exact place, staff lines and stems are lines, beams are filled polygons and ties are filled curves. Reading them is exact,
unlike reading the page image. `read(pdf, boxes)` returns, for each bar box of the bar map (layout2) and each staff of
that system, the list of events found:

    {'off': quarter offset, 'dur': quarters, 'rest': bool, 'pitches': [(step, alter, octave)], 'tie': [starts per pitch],
     'slur_start': bool, 'slur_stop': bool, 'staccato': bool, 'accent': bool, 'fermata': bool, 'measure_rest': bool}

`patch_musicxml(root, events_by_bar, boxes)` replaces the notes of each bar of the image reading (Audiveris) by the vector
reading when the vector bar adds up to the right length; any bar it can't read stays as Audiveris read it.
"""
import collections
import xml.etree.ElementTree as ET
from fractions import Fraction as F

import pymupdf

HEAD = {0xE0A0: 8, 0xE0A2: 4, 0xE0A3: 2, 0xE0A4: 1}  # double whole, whole, half, black
REST = {0xE4E2: 8, 0xE4E3: 4, 0xE4E4: 2, 0xE4E5: 1, 0xE4E6: F(1, 2), 0xE4E7: F(1, 4), 0xE4E8: F(1, 8)}
FLAG = {0xE240: 1, 0xE241: 1, 0xE242: 2, 0xE243: 2, 0xE244: 3, 0xE245: 3, 0xE246: 4, 0xE247: 4}
ACC = {0xE260: -1, 0xE261: 0, 0xE262: 1, 0xE263: 2, 0xE264: -2}
CLEF = {0xE050: ('G', 2), 0xE062: ('F', 4), 0xE05C: ('C', 3), 0xE05D: ('C', 4), 0xE052: ('G8vb', 2), 0xE069: ('perc', 3)}
DOT, STACC, STACC2, ACCENT, ACCENT2, FERMATA, FERMATA2 = 0xE1E7, 0xE4A2, 0xE4A3, 0xE4A0, 0xE4A1, 0xE4C0, 0xE4C1
SLASH = {0xE100, 0xE101, 0xE102, 0xE103, 0xE104, 0xE105, 0xE0A9}  # slash / x noteheads: a rhythm part, not pitches
STEPS = 'CDEFGAB'
SHARP_ORDER, FLAT_ORDER = 'FCGDAEB', 'BEADGCF'
# diatonic index (octave*7 + step) of the bottom staff line for each clef
BOTTOM = {'G': 4 * 7 + 2, 'G8vb': 3 * 7 + 2, 'F': 2 * 7 + 4, 'C': 3 * 7 + 3, 'perc': 4 * 7 + 2}


def _glyphs(page):
    out = []
    for b in page.get_text('rawdict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                for c in s['chars']:
                    o = ord(c['c'])
                    if 0xE000 <= o <= 0xF8FF:
                        out.append({'c': o, 'x': c['origin'][0], 'y': c['origin'][1], 'x1': c['bbox'][2], 'size': s['size']})
    return out


def _lines(page):
    hl, vl, beams, curves = [], [], [], []
    for d in page.get_drawings():
        items = d['items']
        if d['type'] == 's' and all(i[0] == 'l' for i in items):
            for i in items:
                a, b = i[1], i[2]
                if abs(a.y - b.y) < 0.2 and abs(a.x - b.x) > 3:
                    hl.append((min(a.x, b.x), max(a.x, b.x), (a.y + b.y) / 2, d.get('width') or 0))
                elif abs(a.x - b.x) < 0.2 and abs(a.y - b.y) > 2:
                    vl.append(((a.x + b.x) / 2, min(a.y, b.y), max(a.y, b.y), d.get('width') or 0))
        elif d['type'] == 'f' and items and all(i[0] == 'l' for i in items):
            pts = [i[1] for i in items] + [items[-1][2]]
            beams.append(pts)
        elif 'f' in d['type'] and items and items[0][0] == 'c':
            p0 = items[0][1]; p1 = items[0][4]
            curves.append(((p0.x, p0.y), (p1.x, p1.y)) if p0.x <= p1.x else ((p1.x, p1.y), (p0.x, p0.y)))
    return hl, vl, beams, curves


def _staves(hl):
    """groups of five equally spaced horizontal lines: [(top_y, spacing, x0, x1)]"""
    ys = collections.defaultdict(lambda: [1e9, -1e9])
    for x0, x1, y, w in hl:
        if 0.3 < w < 0.8 and x1 - x0 > 25:  # staff lines run across the bar; ledger lines are short
            k = round(y * 2) / 2
            ys[k][0] = min(ys[k][0], x0); ys[k][1] = max(ys[k][1], x1)
    keys = sorted(ys)
    out, i = [], 0
    while i + 4 < len(keys):
        g = keys[i:i + 5]; d = [g[j + 1] - g[j] for j in range(4)]
        if max(d) - min(d) < 0.6 and 2 < d[0] < 15:
            out.append((g[0], (g[4] - g[0]) / 4, min(ys[k][0] for k in g), max(ys[k][1] for k in g))); i += 5
        else:
            i += 1
    return out


def _beam_y(pts, x):
    """y range of a beam polygon at x (None if x is outside it)"""
    xs = [p.x for p in pts]
    if not (min(xs) - 0.5 <= x <= max(xs) + 0.5):
        return None
    ys = []
    for a, b in zip(pts, pts[1:] + pts[:1]):
        if abs(b.x - a.x) > 1e-6 and min(a.x, b.x) - 0.5 <= x <= max(a.x, b.x) + 0.5:
            t = min(1, max(0, (x - a.x) / (b.x - a.x))); ys.append(a.y + t * (b.y - a.y))
    return (min(ys), max(ys)) if ys else None


class Reader:
    def __init__(self, pdf):
        self.doc = pymupdf.open(pdf)
        self.pages = {}

    def page(self, n):
        if n not in self.pages:
            p = self.doc[n - 1]
            g = _glyphs(p); hl, vl, beams, curves = _lines(p)
            self.pages[n] = {'W': p.rect.width, 'H': p.rect.height, 'g': g, 'stems': [v for v in vl if v[3] < 0.7],
                             'beams': beams, 'curves': curves, 'staves': _staves(hl)}
        return self.pages[n]


def read(pdf, boxes, nstaves):
    """events[bar index][staff index] (None where the bar can't be read)"""
    R = Reader(pdf)
    clef = {}; key = {}  # per staff index: clef name, key (fifths)
    out = []
    for bi, b in enumerate(boxes):
        mf, ml, pg, x0, y0, x1, y1 = b
        P = R.page(pg); W, H = P['W'], P['H']
        X0, X1, Y0, Y1 = x0 * W, x1 * W, y0 * H, y1 * H
        sv = [s for s in P['staves'] if Y0 - 3 <= s[0] and s[0] + 4 * s[1] <= Y1 + 3 and s[2] <= (X0 + X1) / 2 <= s[3]]
        if len(sv) != nstaves or mf != ml:
            out.append([None] * nstaves); continue
        first_in_line = bi == 0 or boxes[bi - 1][2] != pg or abs(boxes[bi - 1][4] - y0) > 1e-3
        row = []
        for si, (top, sp, sx0, sx1) in enumerate(sv):
            mid = top + 2 * sp
            # glyphs of this staff: inside the bar, nearest staff by vertical distance
            def mine(gl):
                d = [abs(gl['y'] - (t + 2 * s)) for t, s, _, _ in sv]
                return d.index(min(d)) == si
            gs = [gl for gl in P['g'] if X0 - 0.5 <= gl['x'] < X1 - 0.5 and abs(gl['y'] - mid) < 9 * sp and mine(gl)]
            try:
                row.append(_bar(gs, P, top, sp, si, clef, key, first_in_line, X1))
            except Exception as e:  # noqa
                row.append(None)
        out.append(row)
    return out


def _bar(gs, P, top, sp, si, clef, key, first_in_line, X1):
    bottom = top + 4 * sp
    gs = sorted(gs, key=lambda g: g['x'])
    if any(g['c'] in SLASH for g in gs):
        return None
    norm = max((g['size'] for g in gs if g['c'] in HEAD or g['c'] in REST), default=0)
    heads = [g for g in gs if g['c'] in HEAD and g['size'] > 0.8 * norm]
    rests = [g for g in gs if g['c'] in REST]
    # clef and key at the start of a line (or wherever a clef appears)
    for g in gs:
        if g['c'] in CLEF:
            clef[si] = CLEF[g['c']][0]
    cl = clef.get(si, 'G')
    first_x = min([g['x'] for g in heads + rests], default=1e9)

    def attached(a):
        return any(0 < h['x'] - a['x'] < 2.6 * sp and abs(h['y'] - a['y']) < 0.6 * sp for h in heads)
    loose = [g for g in gs if g['c'] in ACC and g['x'] < first_x and not attached(g)]
    if loose:
        sh = sum(1 for g in loose if g['c'] == 0xE262); fl = sum(1 for g in loose if g['c'] == 0xE260)
        key[si] = sh - fl if (sh or fl) else 0
    k = key.get(si, 0)
    keyalt = {s: 1 for s in SHARP_ORDER[:k]} if k > 0 else {s: -1 for s in FLAT_ORDER[:-k]}

    def pitch_of(y):
        steps = round((bottom - y) / (sp / 2))
        d = BOTTOM[cl] + steps
        return STEPS[d % 7], d // 7

    # group heads into chords by stem (black/half) or by x (whole)
    chords = []
    for h in heads:
        for c in chords:
            if abs(c['x'] - h['x']) < 0.4 * sp and c['val'] == HEAD[h['c']]:
                c['heads'].append(h); break
        else:
            chords.append({'x': h['x'], 'val': HEAD[h['c']], 'heads': [h], 'x1': h['x1']})
    events = []
    barmem = {}
    for c in chords:
        ys = [h['y'] for h in c['heads']]
        dur = F(c['val'])
        if c['val'] <= 2:  # stem: a thin vertical line touching the chord at its left or right edge
            st = [s for s in P['stems'] if (abs(s[0] - c['x']) < 0.35 * sp or abs(s[0] - c['x1']) < 0.35 * sp)
                  and s[1] - 0.6 * sp <= min(ys) and max(ys) <= s[2] + 0.6 * sp]
            if not st:
                return None
            s = min(st, key=lambda s: min(abs(s[0] - c['x']), abs(s[0] - c['x1'])))
            up = abs(s[0] - c['x1']) < abs(s[0] - c['x'])
            tip = s[1] if up else s[2]
            n = 0
            if c['val'] == 1:
                fl = [g for g in gs if g['c'] in FLAG and abs(g['x'] - s[0]) < 0.6 * sp and abs(g['y'] - tip) < 2 * sp]
                if fl:
                    n = FLAG[fl[0]['c']]
                else:
                    for bm in P['beams']:
                        r = _beam_y(bm, s[0])
                        if r and r[0] - 0.4 * sp <= (s[1] if up else s[2]) <= r[1] + 0.4 * sp + 2.2 * sp and \
                                (s[1] - 0.4 * sp <= (r[0] + r[1]) / 2 <= s[2] + 0.4 * sp):
                            n += 1
            dur = dur / (2 ** n)
            c['stem_up'] = up
        dots = [g for g in gs if g['c'] == DOT and 0.3 * sp < g['x'] - c['x'] < 3.5 * sp and min(ys) - sp <= g['y'] <= max(ys) + sp]
        nd = len({round(g['x']) for g in dots})
        dur = dur * (2 - F(1, 2 ** nd))
        pitches = []
        for h in sorted(c['heads'], key=lambda h: -h['y']):
            stp, octv = pitch_of(h['y'])
            acc = [g for g in gs if g['c'] in ACC and 0 < h['x'] - g['x'] < 2.6 * sp and abs(g['y'] - h['y']) < 0.6 * sp]
            if acc:
                barmem[(stp, octv)] = ACC[acc[-1]['c']]
            alt = barmem.get((stp, octv), keyalt.get(stp, 0))
            pitches.append((stp, alt, octv))
        near = lambda code, r=3.5: any(g['c'] == code and abs(g['x'] - c['x']) < 1.2 * sp and abs(g['y'] - sum(ys) / len(ys)) < r * sp for g in gs)
        events.append({'x': c['x'], 'x1': c['x1'], 'ys': ys, 'dur': dur, 'rest': False, 'pitches': pitches,
                       'staccato': near(STACC) or near(STACC2), 'accent': near(ACCENT) or near(ACCENT2),
                       'fermata': near(FERMATA, 6) or near(FERMATA2, 6), 'tie': [False] * len(pitches),
                       'slur_start': False, 'slur_stop': False, 'measure_rest': False})
    for r in rests:
        dur = F(REST[r['c']])
        dots = [g for g in gs if g['c'] == DOT and 0.3 * sp < g['x'] - r['x'] < 3 * sp and abs(g['y'] - r['y']) < 1.5 * sp]
        dur = dur * (2 - F(1, 2 ** len(dots)))
        events.append({'x': r['x'], 'dur': dur, 'rest': True, 'pitches': [], 'measure_rest': r['c'] == 0xE4E3 and not heads and len(rests) == 1})
    events.sort(key=lambda e: e['x'])
    # ties and slurs: curves between two heads
    for a_, b_ in P['curves']:
        (xa, ya), (xb, yb) = a_, b_
        if not events or xb < events[0]['x'] - 3 * sp or xa > X1 + sp:
            continue
        L = [e for e in events if not e['rest'] and -2.2 * sp < xa - e['x'] < 2.2 * sp + (e['x1'] - e['x']) and any(abs(y - ya) < 1.6 * sp for y in e['ys'])]
        Rr = [e for e in events if not e['rest'] and -0.8 * sp < e['x'] - xb < 1.5 * sp and any(abs(y - yb) < 1.6 * sp for y in e['ys'])]
        if L and not Rr and xb > X1 - 3 * sp:  # tie leaving the bar
            e = L[-1]; j = min(range(len(e['ys'])), key=lambda j: abs(e['ys'][j] - ya)); e['tie'][j] = True
        elif L and Rr and L[-1] is not Rr[0]:
            e, f = L[-1], Rr[0]
            same = [j for j, p in enumerate(e['pitches']) if p in f['pitches']]
            if same and abs(xb - xa) < 12 * sp and events.index(f) == events.index(e) + 1:
                for j in same:
                    e['tie'][j] = True
            else:
                e['slur_start'] = True; f['slur_stop'] = True
    off = F(0)
    for e in events:
        e['off'] = off; off += e['dur']
    return events


DIV = 24


def normalize_divisions(part):
    """every duration of the part in the same unit (DIV per quarter), so bars can be swapped freely"""
    div = 1
    for m in part.iter('measure'):
        for el in m.iter():
            if el.tag == 'divisions':
                div = max(1, int(float(el.text or 1))); el.text = str(DIV)
            elif el.tag == 'duration':
                el.text = str(int(round(float(el.text or 0) * DIV / div)))


def _bar_len(m, cur):
    t = m.find('attributes/time')
    if t is not None and t.findtext('beats') and t.findtext('beat-type'):
        try:
            cur = F(int(t.findtext('beats').split('+')[0]) * 4, int(t.findtext('beat-type')))
        except ValueError:
            pass
    return cur


def patch_musicxml(root, events, nstaves):
    """replace each Audiveris bar by the vector reading when it adds up. Returns (bars replaced, bars kept)."""
    parts = list(root.iter('part'))
    if len(parts) != nstaves:
        return 0, 0
    done = kept = 0
    for si, part in enumerate(parts):
        normalize_divisions(part)
        ms = list(part.iter('measure'))
        if len(ms) != len(events):
            return 0, 0
        blen = F(4); open_ties = set()
        for bi, m in enumerate(ms):
            blen = _bar_len(m, blen)
            ev = events[bi][si]
            if ev is None or not ev:
                kept += 1; open_ties = set(); continue
            total = sum(e['dur'] for e in ev)
            if len(ev) == 1 and ev[0].get('measure_rest'):
                total = blen; ev[0]['dur'] = blen
            if total != blen or any((e['dur'] * DIV).denominator != 1 for e in ev):
                kept += 1; open_ties = set(); continue
            old = [el for el in list(m) if el.tag in ('note', 'backup', 'forward')]
            pos = list(m).index(old[0]) if old else len(list(m))
            for el in old:
                m.remove(el)
            new = []
            for e in ev:
                if e['rest']:
                    n = ET.Element('note'); r = ET.SubElement(n, 'rest')
                    if e.get('measure_rest'):
                        r.set('measure', 'yes')
                    ET.SubElement(n, 'duration').text = str(int(e['dur'] * DIV)); ET.SubElement(n, 'voice').text = '1'
                    new.append(n); open_ties = set(); continue
                still = set()
                for j, (stp, alt, octv) in enumerate(e['pitches']):
                    n = ET.Element('note')
                    if j:
                        ET.SubElement(n, 'chord')
                    p = ET.SubElement(n, 'pitch'); ET.SubElement(p, 'step').text = stp
                    if alt:
                        ET.SubElement(p, 'alter').text = str(alt)
                    ET.SubElement(p, 'octave').text = str(octv)
                    ET.SubElement(n, 'duration').text = str(int(e['dur'] * DIV))
                    stop = (stp, alt, octv) in open_ties; start = e['tie'][j]
                    for tt in (['stop'] if stop else []) + (['start'] if start else []):
                        ET.SubElement(n, 'tie', {'type': tt})
                    ET.SubElement(n, 'voice').text = '1'
                    nt = None
                    def nots():
                        nonlocal nt
                        if nt is None:
                            nt = ET.SubElement(n, 'notations')
                        return nt
                    for tt in (['stop'] if stop else []) + (['start'] if start else []):
                        ET.SubElement(nots(), 'tied', {'type': tt})
                    if j == 0:
                        if e.get('slur_stop'):
                            ET.SubElement(nots(), 'slur', {'type': 'stop', 'number': '1'})
                        if e.get('slur_start'):
                            ET.SubElement(nots(), 'slur', {'type': 'start', 'number': '1'})
                        arts = [a for a in ('staccato', 'accent') if e.get(a)]
                        if arts:
                            ar = ET.SubElement(nots(), 'articulations')
                            for a in arts:
                                ET.SubElement(ar, a)
                        if e.get('fermata'):
                            ET.SubElement(nots(), 'fermata')
                    if start:
                        still.add((stp, alt, octv))
                    new.append(n)
                open_ties = still
            for k, n in enumerate(new):
                m.insert(pos + k, n)
            done += 1
    return done, kept
