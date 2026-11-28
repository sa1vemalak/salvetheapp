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


TIMESIG = {0xE080 + i: i for i in range(10)}
TUPLET_DIG = {0xE880 + i: i for i in range(10)}
# n notes in the time of m: the usual meaning of a tuplet number
TUPLET_RATIO = {2: 3, 3: 2, 4: 3, 5: 4, 6: 4, 7: 4, 9: 8, 10: 8, 11: 8, 12: 8}


# Finale's own font (Maestro, and the look-alikes Petrucci/Jazz) has no SMuFL codes: its symbols sit on plain letters,
# which a PDF printed from Finale shows as 0xF000 + the letter. Same meaning, SMuFL code.
MAESTRO = {
    0xF0CF: 0xE0A4, 0xF0FA: 0xE0A3, 0xF077: 0xE0A2, 0xF057: 0xE0A0,                  # noteheads: black, half, whole, breve
    0xF0B7: 0xE4E3, 0xF0EE: 0xE4E4, 0xF0CE: 0xE4E5, 0xF0E4: 0xE4E6, 0xF0C5: 0xE4E7,  # rests: whole .. 16th
    0xF0A8: 0xE4E8,                                                                    # 32nd rest
    0xF06A: 0xE240, 0xF04A: 0xE241, 0xF072: 0xE242, 0xF052: 0xE243,                  # flags 8th/16th up/down
    0xF078: 0xE244, 0xF058: 0xE245,                                                    # 32nd flags
    0xF02E: 0xE1E7,                                                                    # dot (augmentation or staccato)
    0xF03E: 0xE4A0, 0xF055: 0xE4C0, 0xF075: 0xE4C1,                                  # accent, fermata
    0xF023: 0xE262, 0xF062: 0xE260, 0xF06E: 0xE261, 0xF0DC: 0xE263, 0xF0BA: 0xE264,  # accidentals
    0xF026: 0xE050, 0xF03F: 0xE062, 0xF042: 0xE05C, 0xF056: 0xE052,                  # clefs
    0xF063: 0xE08A, 0xF043: 0xE08B,                                                    # common / cut time
    0xF0D5: 0xE101,                                                                    # rhythm slash
    **{0xF030 + i: 0xE080 + i for i in range(10)},                                    # time signature digits
}


def _maestro(glyphs):
    """Finale (Maestro) symbols to SMuFL codes, when the page has no SMuFL noteheads. Small ones (chord-symbol sharps,
    tempo marks, cue notes) keep their own code, so they are not read as notes or key signatures."""
    if any(g['c'] in HEAD for g in glyphs):
        return glyphs
    sizes = collections.Counter(round(g['size']) for g in glyphs if g['c'] in (0xF0CF, 0xF0FA, 0xF077, 0xF0B7, 0xF0CE, 0xF0D5))
    if not sizes:
        return glyphs
    norm = sizes.most_common(1)[0][0]
    for g in glyphs:
        if isinstance(g['c'], int) and g['c'] in MAESTRO and g['size'] >= 0.8 * norm:
            g['c'] = MAESTRO[g['c']]
    return glyphs


def _glyphs(page):
    """music-font characters, plus the lone digits printed in a text font (MuseScore writes tuplet numbers that way);
    those come as {'c': 'tuplet', 'n': digit}"""
    out = []
    for b in page.get_text('rawdict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                txt = ''.join(c['c'] for c in s['chars']).strip()
                for c in s['chars']:
                    o = ord(c['c'])
                    if 0xE000 <= o <= 0xF8FF:
                        if o in TUPLET_DIG:
                            out.append({'c': 'tuplet', 'n': TUPLET_DIG[o], 'x': c['origin'][0], 'y': c['origin'][1], 'x1': c['bbox'][2], 'size': s['size']})
                        else:
                            out.append({'c': o, 'x': c['origin'][0], 'y': c['origin'][1], 'x1': c['bbox'][2], 'size': s['size']})
                    elif len(txt) == 1 and txt.isdigit() and c['c'] == txt and int(txt) in TUPLET_RATIO:
                        out.append({'c': 'tuplet', 'n': int(txt), 'x': c['origin'][0], 'y': c['origin'][1], 'x1': c['bbox'][2], 'size': s['size']})
    return _maestro(out)


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
            # a beam is a thin dark band; the white page background (MuseScore 4 paints one) is not
            fill = d.get('fill') or (0, 0, 0)
            if min(fill) > 0.5 or d['rect'].height > 20:
                continue
            pts = [i[1] for i in items] + [items[-1][2]]
            beams.append(pts)
        elif d['type'] == 'f' and items and all(i[0] in ('re', 'qu') for i in items):
            # Finale (printed to PDF) draws flat beams as filled rectangles
            fill = d.get('fill') or (0, 0, 0)
            if min(fill) > 0.5:
                continue
            for i in items:
                q = i[1].quad if i[0] == 're' else i[1]
                pts = [q.ul, q.ur, q.lr, q.ll]
                ys = [pt.y for pt in pts]; xs = [pt.x for pt in pts]
                if max(ys) - min(ys) <= 6 and max(xs) - min(xs) > 3:
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
                             'beams': beams, 'curves': curves, 'staves': _staves(hl),
                             'ledgers': [(x0, x1, y) for x0, x1, y, w in hl if x1 - x0 <= 25]}
        return self.pages[n]


def _head_staff(g, sv, ledgers):
    """staff of a notehead: the one it sits on, or, in the gap between two staves, the one its ledger lines lead to
    (a high sax note with four ledger lines is closer to the trumpet staff above than to its own)"""
    for i, (top, sp, _, _) in enumerate(sv):
        if top - 0.75 * sp <= g['y'] <= top + 4.75 * sp:
            return i
    cx = (g['x'] + g['x1']) / 2
    led = [y for x0, x1, y in ledgers if x0 - 1 <= cx <= x1 + 1]
    best, why = None, None
    for i, (top, sp, _, _) in enumerate(sv):
        bot = top + 4 * sp
        if g['y'] < top:  # above this staff: ledger lines at top - sp, top - 2sp ... down to the note
            need = [top - k * sp for k in range(1, int((top - g['y']) / sp + 0.25) + 1)]
        else:
            need = [bot + k * sp for k in range(1, int((g['y'] - bot) / sp + 0.25) + 1)]
        ok = all(any(abs(y - n) < 0.3 * sp for y in led) for n in need)
        dist = min(abs(g['y'] - top), abs(g['y'] - bot))
        score = (0 if ok else 1, dist)
        if best is None or score < why:
            best, why = i, score
    return best


def staff_owner(gs, sv, ledgers, stems=()):
    """{id(glyph): staff index}. Noteheads follow their ledger lines; everything else (rests, flags, dots, articulations)
    goes with the nearest notehead when one is close, else with the nearest staff."""
    own = {}
    if not sv:
        return own
    heads = [g for g in gs if g['c'] in HEAD or g['c'] in SLASH]
    for g in heads:
        own[id(g)] = _head_staff(g, sv, ledgers)
    for g in gs:  # a flag goes with the note at the other end of its stem
        if g['c'] not in FLAG:
            continue
        sp = sv[0][1]
        for sx, sy0, sy1, _w in stems:
            if abs(sx - g['x']) < 0.6 * sp and (abs(sy0 - g['y']) < 1.2 * sp or abs(sy1 - g['y']) < 1.2 * sp):
                far = sy1 if abs(sy0 - g['y']) < abs(sy1 - g['y']) else sy0
                hs = [h for h in heads if abs(h['y'] - far) < 0.8 * sp and (abs(h['x'] - sx) < 0.5 * sp or abs(h['x1'] - sx) < 0.5 * sp)]
                if hs:
                    own[id(g)] = own[id(hs[0])]
                    break
    for g in gs:
        if id(g) in own:
            continue
        mids = [abs(g['y'] - (t + 2 * s)) for t, s, _, _ in sv]
        i = mids.index(min(mids))
        top, sp = sv[i][0], sv[i][1]
        if not (top - sp <= g['y'] <= top + 5 * sp) and g['c'] not in REST and g['c'] not in CLEF:
            near = [(abs(h['x'] - g['x']) + abs(h['y'] - g['y']), own[id(h)]) for h in heads
                    if abs(h['x'] - g['x']) < 2.5 * sp and abs(h['y'] - g['y']) < 4 * sp]
            if near:
                i = min(near)[1]
        own[id(g)] = i
    return own


def read(pdf, boxes, nstaves, meta=None):
    """events[bar index][staff index] (None where the bar can't be read). meta['bar_len'] gets each bar's length in
    quarters from the printed time signature (None until one is seen)."""
    R = Reader(pdf)
    clef = {}; key = {}; tsig = {}  # per staff index: clef name, key (fifths), bar length (quarters)
    carry = {}  # per staff index: {(step, octave): alter} of the notes tied into the next bar
    out = []
    lens = []
    for bi, b in enumerate(boxes):
        mf, ml, pg, x0, y0, x1, y1 = b
        P = R.page(pg); W, H = P['W'], P['H']
        X0, X1, Y0, Y1 = x0 * W, x1 * W, y0 * H, y1 * H
        sv = [s for s in P['staves'] if Y0 - 3 <= s[0] and s[0] + 4 * s[1] <= Y1 + 3 and s[2] <= (X0 + X1) / 2 <= s[3]]
        if len(sv) != nstaves:
            out.append([None] * nstaves); lens.append(next((tsig[i] for i in sorted(tsig)), None)); continue
        first_in_line = bi == 0 or boxes[bi - 1][2] != pg or abs(boxes[bi - 1][4] - y0) > 1e-3
        inbar = [gl for gl in P['g'] if X0 - 0.5 <= gl['x'] < X1 - 0.5]
        owner = staff_owner([g for g in inbar if g['c'] != 'tuplet'], sv, P['ledgers'], P['stems'])
        if mf != ml:
            # a multi-bar rest has no notes, but a part often opens with one: its clef, key and time signature
            # still count for the bars after it
            for si, (top, sp, sx0, sx1) in enumerate(sv):
                gs = [gl for gl in inbar if gl['c'] != 'tuplet' and owner[id(gl)] == si and abs(gl['y'] - top - 2 * sp) < 9 * sp]
                t = _time_sig(gs, sp)
                if t:
                    tsig[si] = t
                try:
                    _bar(gs, P, top, sp, si, clef, key, first_in_line, X1)
                except Exception:  # noqa
                    pass
            out.append([None] * nstaves)
            lens.append(next((tsig[i] for i in range(len(sv)) if i in tsig), None))
            continue
        tuplets = [g for g in inbar if g['c'] == 'tuplet']
        row = []
        for si, (top, sp, sx0, sx1) in enumerate(sv):
            mid = top + 2 * sp
            gs = [gl for gl in inbar if gl['c'] != 'tuplet' and owner[id(gl)] == si and abs(gl['y'] - mid) < 9 * sp]
            t = _time_sig(gs, sp)
            if t:
                tsig[si] = t
            near_t = [g for g in tuplets if top - 7 * sp < g['y'] < top + 11 * sp]
            try:
                evs = _bar(gs, P, top, sp, si, clef, key, first_in_line, X1, near_t, tsig.get(si))
            except Exception as e:  # noqa
                evs = None
            # a note tied over the barline keeps its accidental in the new bar
            notes = [e for e in evs or [] if not e['rest']]
            if notes and carry.get(si):
                ex = notes[0].get('acc') or [False] * len(notes[0]['pitches'])
                notes[0]['pitches'] = [(stp, alt if x else carry[si].get((stp, octv), alt), octv)
                                       for (stp, alt, octv), x in zip(notes[0]['pitches'], ex)]
            carry[si] = {(stp, octv): alt for e in notes[-1:] for (stp, alt, octv), t in zip(e['pitches'], e['tie']) if t}
            row.append(evs)
        out.append(row)
        lens.append(next((tsig[i] for i in range(len(sv)) if i in tsig), None))
    if meta is not None:
        meta['bar_len'] = lens
    return out


def _time_sig(gs, sp):
    """bar length in quarters from time signature digits stacked on the staff (or common / cut time)"""
    for g in gs:
        if g['c'] == 0xE08A:
            return F(4)
        if g['c'] == 0xE08B:
            return F(2)
    dig = [g for g in gs if g['c'] in TIMESIG]
    # only the digits stacked at the left: MuseScore prints the count of a multi-bar rest with the same digits
    if dig:
        x0 = min(g['x'] for g in dig)
        dig = [g for g in dig if g['x'] - x0 < 2.5 * sp]
    if len(dig) < 2:
        return None
    ys = sorted({round(g['y'] / sp) for g in dig})
    if len(ys) < 2:
        return None
    num = int(''.join(str(TIMESIG[g['c']]) for g in sorted((g for g in dig if round(g['y'] / sp) == ys[0]), key=lambda g: g['x'])))
    den = int(''.join(str(TIMESIG[g['c']]) for g in sorted((g for g in dig if round(g['y'] / sp) == ys[-1]), key=lambda g: g['x'])))
    if num <= 0 or den not in (1, 2, 4, 8, 16, 32):
        return None
    return F(num * 4, den)


def _apply_tuplets(events, tuplets, sp, want):
    """A bar that doesn't add up and has tuplet numbers over/under it: scale the n notes under each number (n in the
    time of m) and keep the choice that makes the bar add up. Nothing changes when no choice does."""
    import itertools
    total = sum(e['dur'] for e in events)
    if want is None or total == want or not tuplets:
        return events
    cands = []
    for t in tuplets:
        n = t['n']; m = TUPLET_RATIO.get(n)
        tx = (t['x'] + t['x1']) / 2
        # n notes under the number, or fewer when some are longer (a quarter + an eighth under a "3")
        for L in range(n, 1, -1) if n > 1 else (n,):
            best = None
            for i in range(0, len(events) - L + 1):
                grp = events[i:i + L]
                a, b = grp[0]['x'], max(grp[-1].get('x1', grp[-1]['x']), grp[-1]['x'])
                if not (a - 1.0 * sp <= tx <= b + 1.5 * sp) or L > 1 and not (a < tx):
                    continue
                if L < n and sum(e['dur'] for e in grp) != n * min(e['dur'] for e in grp):
                    continue
                d = abs((a + b) / 2 - tx)
                if best is None or d < best[0]:
                    best = (d, i)
            if best is not None and m:
                cands.append((best[1], L, F(m, n)))
    cands = list(dict.fromkeys(cands))[:8]
    for k in range(1, len(cands) + 1):
        for combo in itertools.combinations(cands, k):
            idx = [i for i, L, f in combo for i in range(i, i + L)]
            if len(idx) != len(set(idx)):
                continue
            scale = {}
            for i, L, f in combo:
                for j in range(i, i + L):
                    scale[j] = f
            if sum(e['dur'] * scale.get(j, 1) for j, e in enumerate(events)) == want:
                for j, f in scale.items():
                    events[j]['dur'] = events[j]['dur'] * f
                    events[j]['tuplet'] = True
                return events
    return events


def _bar(gs, P, top, sp, si, clef, key, first_in_line, X1, tuplets=(), want=None):
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
    # an augmentation dot belongs to the nearest note or rest on its left (a dotted rest right after a 16th note
    # must not make the note dotted)
    # Finale's font uses the same dot for staccato: a dot over or under a head (not right of it) is a staccato.
    objs = [('c', i, c['x'], max(h['x1'] for h in c['heads']), c['heads']) for i, c in enumerate(chords)] + \
           [('r', i, r['x'], r['x1'], [r]) for i, r in enumerate(rests)]
    dot_of = collections.Counter()
    stacc_dot = set()
    for d in gs:
        if d['c'] != DOT:
            continue
        cand = [(d['x'] - x, kind, i) for kind, i, x, x1, hs in objs if 0.3 * sp < d['x'] - x < 3.5 * sp and d['x'] >= x1 - 0.15 * sp
                and min(h['y'] for h in hs) - (1.5 if kind == 'r' else 1) * sp <= d['y'] <= max(h['y'] for h in hs) + (1.5 if kind == 'r' else 1) * sp]
        if cand:
            _, kind, i = min(cand)
            dot_of[(kind, i, round(d['x']))] += 1
        else:
            for kind, i, x, x1, hs in objs:
                if kind == 'c' and x - 0.3 * sp <= d['x'] <= x1 + 0.3 * sp:
                    stacc_dot.add(i)
    ndots = collections.Counter(k[:2] for k in dot_of)
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
                        if not r:
                            continue
                        # beams stack from the stem's tip toward the head: the 2nd/3rd beam of an up stem sits below
                        # its tip, of a down stem above it
                        lo, hi = (tip - 0.4 * sp, tip + 2.6 * sp) if up else (tip - 2.6 * sp, tip + 0.4 * sp)
                        if r[1] >= lo and r[0] <= hi and (s[1] - 0.4 * sp <= (r[0] + r[1]) / 2 <= s[2] + 0.4 * sp):
                            n += 1
            dur = dur / (2 ** n)
            c['stem_up'] = up
        dur = dur * (2 - F(1, 2 ** ndots[('c', chords.index(c))]))
        pitches = []
        expl = []
        for h in sorted(c['heads'], key=lambda h: -h['y']):
            stp, octv = pitch_of(h['y'])
            acc = [g for g in gs if g['c'] in ACC and 0 < h['x'] - g['x'] < 2.6 * sp and abs(g['y'] - h['y']) < 0.6 * sp]
            expl.append(bool(acc) or (stp, octv) in barmem)
            if acc:
                barmem[(stp, octv)] = ACC[acc[-1]['c']]
            alt = barmem.get((stp, octv), keyalt.get(stp, 0))
            pitches.append((stp, alt, octv))
        near = lambda code, r=3.5: any(g['c'] == code and abs(g['x'] - c['x']) < 1.2 * sp and abs(g['y'] - sum(ys) / len(ys)) < r * sp for g in gs)
        events.append({'x': c['x'], 'x1': c['x1'], 'ys': ys, 'dur': dur, 'rest': False, 'pitches': pitches,
                       'staccato': near(STACC) or near(STACC2) or chords.index(c) in stacc_dot, 'accent': near(ACCENT) or near(ACCENT2),
                       'fermata': near(FERMATA, 6) or near(FERMATA2, 6), 'tie': [False] * len(pitches), 'acc': expl,
                       'slur_start': False, 'slur_stop': False, 'measure_rest': False})
    for ri, r in enumerate(rests):
        dur = F(REST[r['c']]) * (2 - F(1, 2 ** ndots[('r', ri)]))
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
    events = _apply_tuplets(events, list(tuplets), sp, want)
    off = F(0)
    for e in events:
        e['off'] = off; off += e['dur']
    return events


DIV = 960  # divisions per quarter: fits 64ths, triplets, quintuplets and sextuplets


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


def patch_musicxml(root, events, nstaves, bar_len=None):
    """replace each Audiveris bar by the vector reading when it adds up (to the time signature Audiveris read, or to
    the one printed in the PDF). Returns (bars replaced, bars kept)."""
    parts = list(root.iter('part'))
    if len(parts) != nstaves:
        print(f'leitura vetorial: {nstaves} pautas no PDF e {len(parts)} na leitura por imagem', flush=True)
        return 0, 0
    done = kept = 0
    for si, part in enumerate(parts):
        normalize_divisions(part)
        ms = list(part.iter('measure'))
        if len(ms) != len(events):
            print(f'leitura vetorial: {len(events)} compassos no PDF e {len(ms)} na leitura por imagem', flush=True)
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
            vlen = bar_len[bi] if bar_len and bi < len(bar_len) else None
            if total not in (blen, vlen) or any((e['dur'] * DIV).denominator != 1 for e in ev):
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
