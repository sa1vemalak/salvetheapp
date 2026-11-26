"""Mestrinho, IA arranjadora: writes the horn section (trumpet in Bb, tenor sax, trombone) for a song from what the
Mestrinho heard in the recording.

  1. esqueleto  python3 arranjador.py esqueleto <mestrinho_out_dir> esqueleto.json
                bar grid, chord, how likely horns are playing, the notes heard in the horn range and the sung melody,
                bar by bar (all pitches sounding)
  2. escrever   python3 arranjador.py escrever esqueleto.json arranjo.json
                Claude writes the three voices from the skeleton, with the arranging rules of the band's arrangers
  3. montar     python3 arranjador.py montar esqueleto.json arranjo.json out_dir
                arranjo.musicxml (written pitch, ready for the app / MuseScore) + eventos.json (sounding, in seconds)

Token language used between the steps (sounding pitch, durations in quarter notes):
  "B4:2 D5:1.5> R:0.5"   note:duration, R = rest
  suffixes: > accent, . staccato, - tenuto, ^ marcato, ~ tied to the next note; "(" before a note starts a slur,
  ")" after it ends the slur
"""
import json, math, os, re, sys

NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
STEP = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pname(m):
    return f'{NAMES[m % 12]}{m // 12 - 1}'


def pmidi(s):
    m = re.fullmatch(r'([A-G])([#b]{0,2})(-?\d)', s.strip())
    if not m:
        raise ValueError(s)
    return STEP[m.group(1)] + m.group(2).count('#') - m.group(2).count('b') + 12 * (int(m.group(3)) + 1)


# ---------------------------------------------------------------- 1. skeleton
def esqueleto(d):
    bat = json.load(open(f'{d}/batidas.json'))
    notas = json.load(open(f'{d}/notas.json'))
    cif = json.load(open(f'{d}/cifras.json'))
    met = json.load(open(f'{d}/metais.json')) if os.path.exists(f'{d}/metais.json') else None
    bpm = float(bat['bpm']); P = 60.0 / bpm
    beats = bat['batidas']
    # steady grid (the songs are recorded to a click): phase = circular median of the detected beats
    ang = [2 * math.pi * ((b / P) % 1) for b in beats]
    ph = math.atan2(sum(math.sin(a) for a in ang), sum(math.cos(a) for a in ang)) / (2 * math.pi) % 1
    t0 = ph * P
    end = max([n[1] for v in notas.values() for n in v] + [beats[-1] if beats else 0]) + P
    nb = int((end - t0) / P) + 1
    grid = [t0 + k * P for k in range(nb)]
    # beat 1 of the bar: where the bass attacks most (and chords change)
    bass = notas.get('bass', [])
    score = [0.0] * 4
    for s, e, p, a in bass:
        k = round((s - t0) / P)
        if abs(s - (t0 + k * P)) < 0.08:
            score[k % 4] += a * (e - s)
    one = max(range(4), key=lambda i: score[i])
    starts = [grid[k] for k in range(one, nb, 4)]
    if one > 0:
        starts = [grid[one] - 4 * P] + starts
    cif_t = [(c['t'], c['cifra']) for c in cif]

    def chord_at(a, b):
        cs = [c for t, c in cif_t if a - 0.05 <= t < b - 0.05 and c]
        return max(set(cs), key=cs.count) if cs else None

    if met:  # the detector's raw values are small: scale so the loudest 5% of the song reads as 1
        _s = sorted(met['prob']); ref = max(1e-6, _s[int(0.95 * (len(_s) - 1))])

    def brass(a, b):
        if not met:
            return None
        pr = met['prob']; f = met['fps']
        seg = pr[int(a * f):int(b * f)]
        return round(min(1.0, sum(seg) / len(seg) / ref), 1) if seg else 0.0

    E = P / 2  # eighth note
    leak_on = {}
    for s_, e_, p_, a_ in notas.get('guitar', []) + notas.get('piano', []):
        leak_on.setdefault(p_ % 12, []).append(s_)
    for k_ in leak_on:
        leak_on[k_].sort()
    import bisect

    def leaked(s_, p_):
        arr = leak_on.get(p_ % 12, [])
        i = bisect.bisect_left(arr, s_ - 0.05)
        return i < len(arr) and arr[i] <= s_ + 0.05

    def slots(ns, a, lo, hi, hits=True):
        out = {}
        for s, e, p, amp in ns:
            if not (lo <= p <= hi) or not (a - E / 2 <= s < a + 4 * P - E / 2):
                continue
            k = int(round((s - a) / E))
            out.setdefault(k, []).append((p, max(1, int(round((e - s) / E))), amp))
        txt = []
        for k in sorted(out):
            ps = sorted(out[k], key=lambda x: -x[2])
            pcs = sorted({x[0] for x in ps}, reverse=True)
            octv = hits and any(x - y == 12 for x in pcs for y in pcs)
            if hits and not octv and all(leaked(s_, p_) for s_, e_, p_, a_ in ns if lo <= p_ <= hi and int(round((s_ - a) / E)) == k):
                continue  # the same notes start in the guitar/piano: that instrument leaking into the horn stem
            mark = ('8' if octv else '*') if hits and len(pcs) >= 2 else ''
            pos = f'{k // 2 + 1}{"&" if k % 2 else ""}'
            txt.append(f'{pos}:' + '+'.join(pname(p) for p in pcs[:3]) + f'({max(x[1] for x in ps)}){mark}')
        return ' '.join(txt)

    bars = []
    for i, a in enumerate(starts):
        b = a + 4 * P
        bars.append({'n': i + 1, 't': round(a, 3), 'cifra': chord_at(a, b), 'metais': brass(a, b),
                     'guia': slots(notas.get('other', []), a, 50, 88),
                     'voz': slots(notas.get('vocals', []), a, 48, 84, hits=False)})
    return {'bpm': round(bpm, 2), 'compasso': '4/4', 'tempo_1': round(starts[0], 3), 'compassos': bars}


def esqueleto_texto(sk):
    lines = [f'Andamento {sk["bpm"]} bpm, {sk["compasso"]}. Uma linha por compasso: número, cifra ouvida, metais (0 a 1, detector fraco de som de metais: '
             f'use só como pista), guia (notas ouvidas na região dos metais: posição no compasso em tempos, '
             f'1& = contratempo do 1; nota(duração em colcheias); 8 = a mesma nota em oitavas atacando junto, a assinatura do '
             f'naipe; * = notas diferentes atacando juntas; notas que vazaram da guitarra/teclado já foram tiradas), '
             f'voz (melodia cantada).']
    for b in sk['compassos']:
        if not b['guia'] and not b['voz'] and (b['metais'] or 0) < 0.2:
            lines.append(f'c{b["n"]} {b["cifra"] or "-"} m={b["metais"]} | (nada)')
            continue
        lines.append(f'c{b["n"]} {b["cifra"] or "-"} m={b["metais"]} | guia: {b["guia"] or "-"} | voz: {b["voz"] or "-"}')
    return '\n'.join(lines)


# ---------------------------------------------------------------- 2. writing (Claude)
REGRAS = """Você é o Mestrinho, arranjador de naipe de metais (Trompete em Sib, Sax Tenor, Trombone) de uma banda brasileira.
Recebe o esqueleto de uma música, tirado da gravação por computador, e escreve as partes dos metais como um arranjador
experiente faria. O esqueleto é rascunho: tem erros, notas de outros instrumentos vazando e enfeites.

O que os arranjadores desta banda fazem (medido em partituras oficiais):
1. Na maior parte das músicas o naipe toca UMA linha em oitavas: trompete em cima; sax tenor e trombone em uníssono uma
   oitava abaixo. Só use vozes diferentes (harmonia em 3 vozes, de cima pra baixo trompete/sax/trombone, sem cruzar,
   andando por grau) nos trechos em que a guia mostra notas diferentes atacando juntas (*) de forma consistente.
2. Regiões em som real: trompete Lá4 a Láb5 (pode ir até Dó6); a linha de baixo (sax/trombone) Láb3 a Láb4 (até Dó5).
3. A pista mais forte de que os metais estão tocando é a mesma nota em oitavas atacando junto (marca 8), quase
   sempre com duração longa. Notas curtas repetidas sem oitava costumam ser outro instrumento (guitarra, teclado,
   synth) que vazou para a guia: não transforme isso em riff de metais. Os metais desta banda muitas vezes seguram notas
   longas (semibreve ligada, mínima) e tocam frases curtas em compassos alternados. Escreva poucas notas e bem
   escolhidas: uma partitura de metais típica tem metade das notas que a guia mostra, ou menos.
   Os metais entram onde a guia mostra notas na região deles; nos outros compassos, pausa. Não invente "cama"
   de notas longas onde não há metais. Não dobre a melodia cantada o tempo todo: metais respondem à voz, tocam riffs,
   convenções e frases de ligação.
4. Use as notas e o contorno da guia, mas reescreva o ritmo limpo: riffs claros com pausas, notas em colcheias e
   semínimas, sem picotar. Descarte enfeites (~30% do que soa na guia). Confira cada nota contra a cifra; nota fora do
   acorde só como passagem.
5. Expressão escrita: dinâmica na entrada de cada frase (f nas frases fortes, mf/f nos riffs), ligaduras curtas de
   frase (2 a 5 notas), acento > e tenuto - nos riffs, staccato . nas notas curtas, ligadura de duração ~ para notas
   que passam da barra de compasso.
6. Repetições da música (refrões que voltam) devem ter o mesmo arranjo nas repetições.

Formato de cada compasso (som real, durações em semínimas, cada compasso soma exatamente 4):
  "B4:2 D5:1.5> R:0.5"  nota:duração; R = pausa; sufixos: > acento, . staccato, - tenuto, ^ marcato, ~ ligada à próxima
  nota (mesma altura); "(" antes da nota abre ligadura de frase e ")" depois da nota fecha.
Em "linha" escreva a voz de cima (trompete, som real). Em textura "oitavas" deixe "sax" e "tbn" vazios: o programa
coloca a oitava abaixo. Em textura "vozes" escreva também "sax" e "tbn". Inclua só os compassos em que os metais tocam."""

SCHEMA = {
    'type': 'object', 'additionalProperties': False,
    'required': ['tom', 'resumo', 'secoes', 'compassos'],
    'properties': {
        'tom': {'type': 'string'},
        'resumo': {'type': 'string'},
        'secoes': {'type': 'array', 'items': {
            'type': 'object', 'additionalProperties': False, 'required': ['de', 'ate', 'nome', 'textura'],
            'properties': {'de': {'type': 'integer'}, 'ate': {'type': 'integer'}, 'nome': {'type': 'string'},
                           'textura': {'type': 'string', 'enum': ['oitavas', 'vozes', 'solo', 'pausa']}}}},
        'compassos': {'type': 'array', 'items': {
            'type': 'object', 'additionalProperties': False, 'required': ['n', 'linha', 'sax', 'tbn', 'din'],
            'properties': {'n': {'type': 'integer'}, 'linha': {'type': 'string'}, 'sax': {'type': 'string'},
                           'tbn': {'type': 'string'}, 'din': {'type': 'string'}}}},
    },
}


def escrever(sk, model=None, effort=None):
    import anthropic
    client = anthropic.Anthropic()
    model = model or os.environ.get('ARRANJO_MODELO', 'claude-opus-5-5')
    effort = effort or os.environ.get('ARRANJO_ESFORCO', 'high')
    texto = esqueleto_texto(sk)
    with client.beta.messages.stream(
        model=model, max_tokens=64000,
        betas=['server-side-fallback-2026-07-01'], fallbacks='default',
        system=[{'type': 'text', 'text': REGRAS, 'cache_control': {'type': 'ephemeral'}}],
        output_config={'effort': effort, 'format': {'type': 'json_schema', 'schema': SCHEMA}},
        messages=[{'role': 'user', 'content': 'Esqueleto da música:\n\n' + texto +
                   '\n\nEscreva o arranjo dos metais para a música inteira.'}],
    ) as st:
        msg = st.get_final_message()
    if msg.stop_reason == 'refusal':
        raise RuntimeError('o modelo recusou o pedido')
    if msg.stop_reason == 'max_tokens':
        raise RuntimeError('resposta cortada (limite de tokens)')
    txt = next(b.text for b in msg.content if b.type == 'text')
    out = json.loads(txt)
    u = msg.usage
    out['_uso'] = {'modelo': msg.model, 'entrada': u.input_tokens, 'saida': u.output_tokens,
                   'cache_lido': getattr(u, 'cache_read_input_tokens', 0) or 0}
    return out


# ---------------------------------------------------------------- 3. assembly
TOK = re.compile(r'^(\(?)(R|[A-G][#b]{0,2}-?\d(?:\+[A-G][#b]{0,2}-?\d)*):(\d+(?:\.\d+)?)([>.\-^~]*)(\)?)$')


def parse_bar(s, length=4.0):
    """tokens -> [{'off','dur','pitches','acc','stac','ten','marc','tie','slur_start','slur_stop'}]; fixed to the bar length"""
    evs, off = [], 0.0
    for t in (s or '').split():
        m = TOK.match(t)
        if not m:
            continue
        dur = float(m.group(3))
        if dur <= 0 or off >= length - 1e-6:
            continue
        dur = min(dur, length - off)
        ps = [] if m.group(2) == 'R' else [pmidi(x) for x in m.group(2).split('+')]
        sx = m.group(4)
        evs.append({'off': off, 'dur': dur, 'pitches': ps, 'acc': '>' in sx, 'stac': '.' in sx, 'ten': '-' in sx,
                    'marc': '^' in sx, 'tie': '~' in sx, 'slur_start': bool(m.group(1)), 'slur_stop': bool(m.group(5))})
        off += dur
    if off < length - 1e-6:
        evs.append({'off': off, 'dur': length - off, 'pitches': [], 'acc': False, 'stac': False, 'ten': False,
                    'marc': False, 'tie': False, 'slur_start': False, 'slur_stop': False})
    return evs


def fit(p, lo, hi):
    while p > hi:
        p -= 12
    while p < lo:
        p += 12
    return p


RANGE = {'tpt': (55, 86), 'sax': (44, 75), 'tbn': (40, 72)}


def vozes(arr):
    """bar -> {'tpt': events, 'sax': events, 'tbn': events} (sounding); 'oitavas' bars get sax/tbn an octave below"""
    out = {}
    for c in arr['compassos']:
        line = parse_bar(c['linha'])
        if c.get('sax', '').strip() or c.get('tbn', '').strip():
            sx, tb = parse_bar(c['sax']), parse_bar(c['tbn'])
        else:
            def down(evs, rng):
                r = []
                for e in evs:
                    e = dict(e); e['pitches'] = [fit(p - 12, *rng) for p in e['pitches'][:1]]; r.append(e)
                return r
            sx, tb = down(line, RANGE['sax']), down(line, RANGE['tbn'])
        out[int(c['n'])] = {'tpt': [dict(e, pitches=e['pitches'][:1]) for e in line], 'sax': sx, 'tbn': tb, 'din': c.get('din', '')}
    return out


def eventos(sk, arr):
    """sounding note events in seconds per part: [start, end, midi, velocity, legato, accent]"""
    P = 60.0 / sk['bpm']; start = {b['n']: b['t'] for b in sk['compassos']}
    DYN = {'pp': 45, 'p': 55, 'mp': 66, 'mf': 78, 'f': 92, 'ff': 104, 'sfz': 104, 'fp': 92}
    res = {'tpt': [], 'sax': [], 'tbn': []}
    for n, v in sorted(vozes(arr).items()):
        if n not in start:
            continue
        base = DYN.get((v['din'] or '').strip().lower(), 82)
        for k in res:
            slur = False
            for e in v[k]:
                if e['slur_start']:
                    slur = True
                if e['pitches']:
                    a = start[n] + e['off'] * P
                    d = e['dur'] * P
                    if e['stac']:
                        d = min(d, 0.6 * P)
                    elif not e['tie'] and not slur:
                        d *= 0.92
                    vel = base + (14 if e['acc'] or e['marc'] else 0) - (4 if e['ten'] else 0)
                    for p in e['pitches']:
                        if res[k] and e is not None and res[k][-1][2] == p and abs(res[k][-1][1] - a) < 0.02 and res[k][-1][6]:
                            res[k][-1][1] = a + d  # tie: extend the previous note
                            res[k][-1][6] = e['tie']
                            continue
                        res[k].append([a, a + d, p, min(120, vel), slur, e['acc'] or e['marc'], e['tie']])
                if e['slur_stop']:
                    slur = False
    return {k: [x[:6] for x in v] for k, v in res.items()}


def musicxml(sk, arr, path, titulo='Arranjo do Mestrinho'):
    import music21 as m21
    insts = [('tpt', m21.instrument.Trumpet(), 'Trompete em B♭'), ('sax', m21.instrument.TenorSaxophone(), 'Sax Tenor'),
             ('tbn', m21.instrument.Trombone(), 'Trombone')]
    vv = vozes(arr)
    last = max([b['n'] for b in sk['compassos']] + [0])
    score = m21.stream.Score(); score.metadata = m21.metadata.Metadata(title=titulo); score.metadata.composer = 'Mestrinho (IA arranjadora)'
    for k, inst, nome in insts:
        part = m21.stream.Part(); part.partName = nome; part.insert(0, inst)
        prev_tie = set()
        for n in range(1, last + 1):
            m = m21.stream.Measure(number=n)
            if n == 1:
                if k == 'tbn':
                    m.insert(0, m21.clef.BassClef())
                m.insert(0, m21.meter.TimeSignature('4/4'))
                if k == 'tpt':
                    m.insert(0, m21.tempo.MetronomeMark(number=round(sk['bpm'])))
            bar = vv.get(n)
            if not bar or not any(e['pitches'] for e in bar[k]):
                m.append(m21.note.Rest(quarterLength=4)); part.append(m); prev_tie = set(); continue
            if bar['din']:
                try:
                    m.insert(0, m21.dynamics.Dynamic(bar['din']))
                except Exception:
                    pass
            for e in bar[k]:
                if not e['pitches']:
                    m.insert(e['off'], m21.note.Rest(quarterLength=e['dur'])); continue
                el = m21.note.Note(e['pitches'][0], quarterLength=e['dur']) if len(e['pitches']) == 1 else m21.chord.Chord(e['pitches'], quarterLength=e['dur'])
                arts = []
                if e['acc']: arts.append(m21.articulations.Accent())
                if e['stac']: arts.append(m21.articulations.Staccato())
                if e['ten']: arts.append(m21.articulations.Tenuto())
                if e['marc']: arts.append(m21.articulations.StrongAccent())
                el.articulations = arts
                if e['tie']:
                    el.tie = m21.tie.Tie('start')
                m.insert(e['off'], el)
            part.append(m)
        part.atSoundingPitch = True
        score.insert(0, part)
    try:  # key signature from the notes (sounding), then each part gets its own written key
        ks = m21.key.KeySignature(score.analyze('key').sharps)
        for p in score.parts:
            p.getElementsByClass('Measure')[0].insert(0, m21.key.KeySignature(ks.sharps))
    except Exception:
        pass
    written = score.toWrittenPitch(inPlace=False)
    written.write('musicxml', fp=path)
    return path


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'esqueleto':
        sk = esqueleto(sys.argv[2]); json.dump(sk, open(sys.argv[3], 'w'), ensure_ascii=False)
        print(esqueleto_texto(sk)[:3000])
    elif cmd == 'escrever':
        sk = json.load(open(sys.argv[2])); arr = escrever(sk)
        json.dump(arr, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1); print(arr.get('resumo'), arr.get('_uso'))
    elif cmd == 'montar':
        sk = json.load(open(sys.argv[2])); arr = json.load(open(sys.argv[3])); out = sys.argv[4]; os.makedirs(out, exist_ok=True)
        json.dump(eventos(sk, arr), open(f'{out}/eventos.json', 'w'))
        musicxml(sk, arr, f'{out}/arranjo.musicxml'); print('ok', out)
