"""Turn a MuseScore 4 .mscx (unzipped .mscz) into MIDI files for rehearsal playback.

Staff order in these scores: 1 trumpet, 2 tenor sax, 3 trombone, 4 base (chord symbols over slashes).
Writes <out>/<song>__<mix>.mid for each mix, and <out>/<song>.json with the measure time map.
"""
import json, sys, re
import xml.etree.ElementTree as ET
from fractions import Fraction
import mido

DIV = 480
DUR = {'whole': 1920, 'half': 960, 'quarter': 480, 'eighth': 240, '16th': 120, '32nd': 60, '64th': 30, 'breve': 3840, '128th': 15}
GRACE = {'acciaccatura', 'appoggiatura', 'grace4', 'grace16', 'grace32', 'grace8after', 'grace16after', 'grace32after'}
QUAL = {'m7': [0, 3, 7, 10], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6, 9],
        'm': [0, 3, 7], '': [0, 4, 7], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], 'sus4': [0, 5, 7], '7sus4': [0, 5, 7, 10],
        'dim7': [0, 3, 6, 9], 'aug': [0, 4, 8], 'add9': [0, 4, 7, 14], 'm9': [0, 3, 7, 10, 14], '9': [0, 4, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14],
        '7(b13)': [0, 4, 10, 20], '7b13': [0, 4, 10, 20], '7alt': [0, 4, 10, 15, 20], '7(b9)': [0, 4, 10, 13], '7(#9)': [0, 4, 10, 15], '7(9)': [0, 4, 10, 14], 'm7(9)': [0, 3, 10, 14], 'maj7(9)': [0, 4, 11, 14]}
PARTS = ['trumpet', 'tenor-sax', 'trombone', 'base']


def tpc_pc(t):
    return ((int(t) - 14) * 7) % 12


def frac_ticks(s):
    return int(Fraction(s) * 1920)


def parse_staff(staff, nstaff):
    """Return list of measures: dict(len, events, harm, slashes, tempo, start, end, endings)."""
    out = []
    sig = 1920
    for m in staff.findall('Measure'):
        rec = {'events': [], 'harm': [], 'slashes': [], 'tempo': [], 'dyn': [], 'hp': [], 'slur': [], 'start': m.find('startRepeat') is not None,
               'end': int(m.findtext('endRepeat')) if m.find('endRepeat') is not None else 0, 'volta': None}
        # time signature (first voice usually)
        for ts in m.iter('TimeSig'):
            sig = 1920 * int(ts.findtext('sigN')) // int(ts.findtext('sigD'))
        mlen = frac_ticks(m.get('len')) if m.get('len') else sig
        rec['len'] = mlen
        def span_len(sp):
            loc = sp.find('next/location')
            if loc is None:
                return None
            return int(loc.findtext('measures') or 0) * mlen + (frac_ticks(loc.findtext('fractions')) if loc.findtext('fractions') else 0)
        for voice in m.findall('voice'):
            pos = 0
            tup = Fraction(1)
            graces = []
            for e in voice:
                tag = e.tag
                if tag == 'location':
                    fr = e.findtext('fractions')
                    if fr:
                        pos += frac_ticks(fr)
                elif tag == 'Tuplet':
                    tup = Fraction(int(e.findtext('normalNotes')), int(e.findtext('actualNotes')))
                elif tag == 'endTuplet':
                    tup = Fraction(1)
                elif tag == 'Tempo':
                    rec['tempo'].append((pos, float(e.findtext('tempo'))))
                elif tag == 'Dynamic':
                    rec['dyn'].append((pos, e.findtext('subtype') or '', int(e.findtext('velocity') or 0)))
                elif tag == 'Spanner' and e.get('type') == 'HairPin' and e.find('HairPin') is not None:
                    L = span_len(e)
                    if L:
                        rec['hp'].append((pos, L, int(e.find('HairPin').findtext('subtype') or 0)))
                elif tag == 'Spanner' and e.get('type') == 'Slur' and e.find('Slur') is not None:
                    L = span_len(e)
                    if L:
                        rec['slur'].append((pos, L))
                elif tag == 'Spanner' and e.get('type') == 'Volta' and e.find('Volta') is not None:
                    ends = e.find('Volta').findtext('endings') or '1'
                    n = int(e.findtext('next/location/measures') or 1)
                    rec['volta'] = ([int(x) for x in re.split(r'[ ,]+', ends.strip()) if x], n)
                elif tag == 'Harmony':
                    hi = e.find('harmonyInfo')
                    if hi is None or hi.findtext('root') is None:
                        continue
                    rec['harm'].append((pos, tpc_pc(hi.findtext('root')), hi.findtext('name') or '',
                                        tpc_pc(hi.findtext('bass')) if hi.findtext('bass') else None))
                elif tag in ('Chord', 'Rest'):
                    if tag == 'Chord' and any(e.find(g) is not None for g in GRACE):
                        graces += [int(n.findtext('pitch')) for n in e.findall('Note') if n.findtext('play') != '0']
                        continue
                    if tag == 'Chord':
                        for sp in e.findall('Spanner'):
                            if sp.get('type') == 'Slur' and sp.find('Slur') is not None:
                                L = span_len(sp)
                                if L:
                                    rec['slur'].append((pos, L))
                    dt = e.findtext('durationType')
                    if dt == 'measure':
                        d = frac_ticks(e.findtext('duration')) if e.findtext('duration') else mlen
                    else:
                        d = DUR.get(dt, 480)
                        dots = int(e.findtext('dots') or 0)
                        d = d * (2 - Fraction(1, 2 ** dots))
                        d = int(d * tup)
                    if tag == 'Chord':
                        notes = e.findall('Note')
                        arts = [(a.findtext('subtype') or '') for a in e.findall('Articulation')]
                        stacc = any(a.startswith('articStaccato') for a in arts)
                        acc = any(a.startswith('articAccent') or a.startswith('articMarcato') for a in arts)
                        ten = any(a.startswith('articTenuto') for a in arts)
                        gr, graces = graces, []
                        fixed = any(n.findtext('fixed') == '1' or n.findtext('play') == '0' for n in notes)
                        if fixed:
                            rec['slashes'].append((pos, d, e.find('noStem') is not None))
                        else:
                            for n in notes:
                                if n.findtext('play') == '0':
                                    continue
                                tie_next = tie_prev = False
                                for sp in n.findall('Spanner'):
                                    if sp.get('type') == 'Tie':
                                        if sp.find('next') is not None:
                                            tie_next = True
                                        if sp.find('prev') is not None:
                                            tie_prev = True
                                rec['events'].append({'pos': pos, 'dur': d, 'pitch': int(n.findtext('pitch')),
                                                      'tn': tie_next, 'tp': tie_prev, 'st': stacc, 'acc': acc, 'ten': ten, 'gr': gr})
                                gr = []
                    pos += d
        out.append(rec)
    return out


def unfold(meas):
    n = len(meas)
    voltas = {}
    for i, m in enumerate(meas):
        if m['volta']:
            ends, k = m['volta']
            for j in range(i, min(n, i + k)):
                voltas[j] = set(ends)
    order = []
    i, start, pas, jumped = 0, 0, 1, False
    guard = 0
    while i < n and guard < 10000:
        guard += 1
        m = meas[i]
        if m['start'] and not jumped:
            start, pas = i, 1
        jumped = False
        if i in voltas and pas not in voltas[i]:
            i += 1
            continue
        order.append(i)
        if m['end']:
            if pas < m['end']:
                pas += 1
                i = start
                jumped = True
                continue
            pas, start = 1, i + 1
        i += 1
    return order


def voicing(root, name, bass):
    iv = QUAL.get(name)
    if iv is None:
        iv = QUAL['m7'] if name.startswith('m') and not name.startswith('maj') else QUAL['7'] if '7' in name else QUAL['']
    # middle-register voicing (around G3-D5): low close chords sound muddy and out of tune on the piano
    base = 53 + ((root - 53) % 12)  # root between F3 and E4
    tones = sorted(base + x for x in iv)
    while tones[-1] > 76:
        tones = sorted(tones[:-1] + [tones[-1] - 12])
    bpc = root if bass is None else bass
    b = 36 + ((bpc - 36) % 12)
    return tones, b


def main(mscx, song, outdir):
    root = ET.parse(mscx).getroot().find('Score')
    staves = root.findall('Staff')
    parts = [parse_staff(s, k) for k, s in enumerate(staves)]
    ref = parts[0]
    n = len(ref)
    # merge repeat/volta flags across staves (usually only in staff 1)
    for k in range(1, len(parts)):
        for i in range(min(n, len(parts[k]))):
            m, o = ref[i], parts[k][i]
            m['start'] |= o['start']; m['end'] = m['end'] or o['end']; m['volta'] = m['volta'] or o['volta']
    order = unfold(ref)
    # tempo map in unfolded ticks
    tempos = []  # (abs_tick, qps)
    starts = []
    t = 0
    for i in order:
        starts.append(t)
        for p in parts:
            if i < len(p):
                for pos, q in p[i]['tempo']:
                    tempos.append((t + pos, q))
        t += ref[i]['len']
    total = t
    tempos.sort()
    if not tempos or tempos[0][0] > 0:
        tempos.insert(0, (0, tempos[0][1] if tempos else 2.0))

    def sec(tick):
        s, last_t, q = 0.0, 0, tempos[0][1]
        for tt, qq in tempos:
            if tt >= tick:
                break
            s += (tt - last_t) / DIV / q
            last_t, q = tt, qq
        return s + (tick - last_t) / DIV / q

    # build notes per part: (start_tick, end_tick, pitch, channel, vel)
    import random
    rnd = random.Random(song)
    DYN = {'pppp': 24, 'ppp': 32, 'pp': 42, 'p': 54, 'mp': 66, 'mf': 80, 'f': 94, 'ff': 108, 'fff': 118, 'ffff': 124,
           'sfz': 112, 'sf': 110, 'sffz': 120, 'fp': 96, 'sfp': 108, 'rfz': 104, 'fz': 110}
    ONE_NOTE = {'sfz', 'sf', 'sffz', 'rfz', 'fz'}
    notes = {k: [] for k in PARTS}
    ccs = {k: [] for k in PARTS}      # (tick, cc11 value) expression automation per part
    progs = {'trumpet': (0, 56), 'tenor-sax': (1, 66), 'trombone': (2, 57)}
    # piano-only scores (no horns): every staff is played by the base piano
    piano_only = all('piano' in (st.findtext('.//instrumentId') or '') for st in root.findall('Part')) and root.findall('Part')
    assign = [] if piano_only else [(k, key, progs[key][0]) for k, key in enumerate(PARTS[:3])]
    for k, key, ch in assign:
        if k >= len(parts):
            continue
        open_ties = {}
        level = 80
        slurs, pins = [], []
        for u, i in enumerate(order):
            if i >= len(parts[k]):
                continue
            meas = parts[k][i]
            for pos, L in meas['slur']:
                slurs.append((starts[u] + pos, starts[u] + pos + L))
            for pos, L, kind in meas['hp']:
                pins.append((starts[u] + pos, starts[u] + pos + L, kind))
            dyns = sorted(meas['dyn'])
            for ev in sorted(meas['events'], key=lambda e: e['pos']):
                one = None
                for dpos, sub, dv in dyns:
                    if dpos <= ev['pos']:
                        v = DYN.get(sub, dv or level)
                        if sub in ONE_NOTE and dpos == ev['pos']:
                            one = v
                        elif sub == 'fp':
                            level = DYN['p'] if dpos < ev['pos'] else level
                            one = DYN['fp'] if dpos == ev['pos'] else one
                        elif sub not in ONE_NOTE:
                            level = v
                dyns = [d for d in dyns if d[0] > ev['pos']]
                vel = one or level
                if ev['acc']:
                    vel += 16
                vel = max(20, min(127, vel + rnd.randint(-4, 4)))
                s = starts[u] + ev['pos']
                e = s + (ev['dur'] // 2 if ev['st'] else ev['dur'])
                p = ev['pitch']
                if ev['tp'] and p in open_ties:
                    open_ties[p][1] = e
                else:
                    rec = [s, e, p, ch, vel, ev['ten'], 0]
                    notes[key].append(rec)
                    open_ties[p] = rec
                    for gi, gp in enumerate(ev['gr']):
                        notes[key].append([s, s, gp, ch, max(20, vel - 12), False, -(len(ev['gr']) - gi)])
                if not ev['tn']:
                    open_ties.pop(p, None)
        # legato: a note inside a slur runs into the next note of the slur
        main = sorted([n for n in notes[key] if n[6] == 0], key=lambda n: n[0])
        for a, b in zip(main, main[1:]):
            if any(s0 <= a[0] < s1 and b[0] < s1 + 10 for s0, s1 in slurs) and b[0] >= a[0]:
                a[1] = max(a[1], b[0]); a.append('leg')
        # hairpins: smooth expression (CC11) ramps; 100 when nothing is happening
        for s0, s1, kind in pins:
            steps = max(2, (s1 - s0) // 60)
            for j in range(steps + 1):
                x = j / steps
                v = 82 + 45 * x if kind == 0 else 127 - 45 * x
                ccs[key].append((s0 + (s1 - s0) * j // steps, int(v)))
            ccs[key].append((s1 + 1, 100))
    # base: real notes + chord comping on slashes
    for bp in (parts if piano_only else parts[3:4]):
        harm = None
        held = None  # [start, end, harmkey]
        comp = []

        def emit(s, e, h):
            tones, b = voicing(*h)
            for tn in tones:
                notes['base'].append([s, e - 20, tn, 3, 64 + rnd.randint(-3, 3), True, 0])
            notes['base'].append([s, e - 20, b, 4, 92, True, 0])
        for u, i in enumerate(order):
            if i >= len(bp):
                continue
            m = bp[i]
            hs = sorted(m['harm'])
            evs = []
            for pos, d, nostem in m['slashes']:
                evs.append((pos, d, nostem))
            # split slashes at harmony changes inside them
            hi = 0
            for pos, d, nostem in sorted(evs):
                # harmony in effect at this pos
                segs = [pos] + [h[0] for h in hs if pos < h[0] < pos + d] + [pos + d]
                for a, b in zip(segs, segs[1:]):
                    cur = [h for h in hs if h[0] <= a]
                    if cur:
                        harm = cur[-1][1:]
                    if harm is None:
                        continue
                    s, e = starts[u] + a, starts[u] + b
                    if nostem and held and held[2] == harm and held[1] == s and held[3]:
                        held[1] = e
                    else:
                        if held:
                            emit(*held[:3])
                        held = [s, e, harm, nostem]
                        if not nostem:
                            emit(s, s + int((e - s) * .85) + 20, harm)
                            held = None
            if held and held[1] < starts[u] + m['len'] and not any(True for _ in []):
                pass
            for ev in m['events']:
                s = starts[u] + ev['pos']
                notes['base'].append([s, s + ev['dur'] - 20, ev['pitch'], 3, 80, True, 0])
            # keep current harmony across measures even if no slash
            if hs:
                harm = hs[-1][1:]
        if held:
            emit(*held[:3])

    mixes = {'tudo': PARTS}
    for k in PARTS:
        mixes['so-' + k] = [k]
        mixes['sem-' + k] = [x for x in PARTS if x != k]
    for i in range(4):
        for j in range(i + 1, 4):
            mixes['duo-' + PARTS[i] + '+' + PARTS[j]] = [PARTS[i], PARTS[j]]
    only = [x for x in sys.argv[4:]] if len(sys.argv) > 4 else None
    if only:
        mixes = {k: v for k, v in mixes.items() if any(k.startswith(o) for o in only)}
    PROG = {0: 56, 1: 66, 2: 57, 3: 0, 4: 33}
    PAN = {0: 44, 1: 84, 2: 60, 3: 64, 4: 64}      # trumpet left, sax right, trombone near centre
    REV = {0: 46, 1: 42, 2: 46, 3: 30, 4: 12}
    CHAN = {'trumpet': 0, 'tenor-sax': 1, 'trombone': 2, 'base': None}
    jit = random.Random(song + 'timing')
    events = {k: {'notes': [], 'cc': []} for k in PARTS}
    mixes = dict(sorted(mixes.items(), key=lambda kv: kv[0] != 'tudo'))  # 'tudo' first, it fills the event dump
    for mix, keys in mixes.items():
        mf = mido.MidiFile(ticks_per_beat=1000)
        tr = mido.MidiTrack(); mf.tracks.append(tr)
        tr.append(mido.MetaMessage('set_tempo', tempo=1000000, time=0))  # 1 beat = 1 s, 1 tick = 1 ms
        for ch, pg in PROG.items():
            tr.append(mido.Message('program_change', channel=ch, program=pg, time=0))
            tr.append(mido.Message('control_change', channel=ch, control=10, value=PAN[ch], time=0))
            tr.append(mido.Message('control_change', channel=ch, control=91, value=REV[ch], time=0))
            tr.append(mido.Message('control_change', channel=ch, control=11, value=100, time=0))
        msgs = []
        for key in keys:
            ch_k = CHAN[key]
            if ch_k is not None:
                for tk, v in ccs[key]:
                    msgs.append((round(sec(tk) * 1000), 0, mido.Message('control_change', channel=ch_k, control=11, value=max(0, min(127, v)))))
                    if mix == 'tudo':
                        events[key]['cc'].append([round(sec(tk) * 1000), max(0, min(127, v))])
            for nt in notes[key]:
                s_, e_, p_, ch, vel, ten, g = nt[:7]
                leg = len(nt) > 7
                ms, me = round(sec(s_) * 1000), round(sec(e_) * 1000)
                if g:  # grace note just before the main note
                    ms, me = ms + g * 55, ms + (g + 1) * 55 + 5
                elif ch < 3:
                    j = jit.randint(-6, 6)
                    ms += j
                    if leg:
                        me = me + j + 8             # connect into the next note
                    elif ten:
                        me = max(ms + 40, me - 10)
                    else:
                        me = max(ms + 40, me - 30)  # small breath between wind notes
                if me <= ms:
                    me = ms + 40
                if mix == 'tudo' and ch < 3:
                    events[key]['notes'].append([max(0, ms), max(0, me), p_, int(vel), 1 if leg else 0, 1 if g else 0])
                msgs.append((max(0, ms), 1, mido.Message('note_on', channel=ch, note=p_, velocity=int(vel))))
                msgs.append((max(0, me), 0, mido.Message('note_off', channel=ch, note=p_, velocity=0)))
        msgs.sort(key=lambda x: (x[0], x[1]))
        last = 0
        for tm, _, msg in msgs:
            msg.time = tm - last; last = tm; tr.append(msg)
        endms = round(sec(total) * 1000) + 1500
        tr.append(mido.MetaMessage('end_of_track', time=max(0, endms - last)))
        mf.save(f'{outdir}/{song}__{mix}.mid')
        if mix == 'tudo':
            for k in events:
                events[k]['notes'].sort()
            json.dump({'end_ms': endms, 'parts': events}, open(f'{outdir}/{song}.events.json', 'w'))
    tmap = {'beats': [round(ref[i]['len'] / DIV, 3) for i in order], 'measures': [[i + 1, round(sec(s), 3)] for i, s in zip(order, starts)], 'duration': round(sec(total), 3),
            'counts': {k: len(v) for k, v in notes.items()}, 'unfolded': len(order), 'written': n}
    json.dump(tmap, open(f'{outdir}/{song}.json', 'w'))
    print(song, tmap['counts'], 'measures', n, '->', len(order), 'dur', tmap['duration'])


if __name__ == '__main__':
    main(*sys.argv[1:4])
