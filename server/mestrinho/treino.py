"""Training round (Equipe page -> "Treinar"): an arranger uploads a recording and the official score he wrote for it.
The Mestrinho arranges the recording without seeing the official score, then compares, gives the score and suggests
lessons in words, which the arranger accepts or not. Called by job.py for documents in treino/regras/rodadas/{id}.

Comparison (same method as testes/avaliar_arr.py): both arrangements as sounding notes in seconds; the official score
is placed on the recording by the best match between its horn attacks and the notes heard in the horn range; a note
counts when the same pitch starts within 0.2 s. "Teto" = how many official notes can be heard in the recording at all.
"""
import json, os, re, subprocess
import numpy as np

import arranjador as A

AVISOS = []
KINDS = (('tpt', r'trompete|trumpet|tpt|flugel'), ('sax', r'sax'), ('tbn', r'trombone|tbn|trb'))


def oficial_eventos(path, bpm=None):
    """official score -> {'tpt'|'sax'|'tbn': [(start_s, midi)]} sounding, repeats written out"""
    import music21 as m21
    if path.lower().endswith(('.mscz', '.mscx')):
        out = path + '.musicxml'
        subprocess.run(['mscore3', '-o', out, path], check=True, capture_output=True, timeout=600,
                       env=dict(os.environ, QT_QPA_PLATFORM='offscreen'))
        path = out
    s = m21.converter.parse(path)
    try:
        s = s.expandRepeats()
    except Exception as e:
        print('repetições da partitura oficial não foram escritas por extenso:', e, flush=True)
        AVISOS.append('As repetições (ritornelos, casas 1 e 2) da partitura oficial não puderam ser abertas: a comparação '
                      'considerou a partitura sem repetir. Para uma nota mais justa, exporte o MusicXML com as repetições '
                      'escritas por extenso.')
    try:
        s = s.toSoundingPitch()
    except Exception:
        pass
    # seconds per quarter from the metronome marks (first one if the score has a single tempo)
    marks = sorted(((float(mm.getOffsetInHierarchy(s)), mm.getQuarterBPM() or 120.0)
                    for mm in s.recurse().getElementsByClass(m21.tempo.MetronomeMark)), key=lambda x: x[0]) or [(0.0, float(bpm or 120.0))]

    def secs(q):
        t, last_q, bpm = 0.0, 0.0, marks[0][1]
        for off, b in marks:
            if off >= q:
                break
            t += (off - last_q) * 60.0 / bpm; last_q, bpm = off, b
        return t + (q - last_q) * 60.0 / bpm

    out = {}
    for pt in s.parts:
        name = (pt.partName or '') + ' ' + (pt.getInstrument().instrumentName or '' if pt.getInstrument() else '')
        kind = next((k for k, rx in KINDS if re.search(rx, name, re.I)), None)
        if not kind or kind in out:
            continue
        ev = []
        for n in pt.flatten().stripTies().notes:
            q = float(n.getOffsetInHierarchy(pt))
            for p in n.pitches:
                ev.append((secs(q), secs(q + float(n.quarterLength)), p.midi))
        out[kind] = sorted(ev)
    return out


def melhor_deslocamento(ref, heard, janela=60.0):
    """seconds to add to the recording's times to land on the official score. ref / heard: [(start_s, midi)].
    Songs repeat riffs every few bars, so onsets alone give many equal peaks: only pairs with the same note (any
    octave) vote, then the best few peaks are checked by how many official notes they really match."""
    ref = sorted(ref); heard = sorted(heard)
    if not ref or not heard:
        return 0.0
    by_pc = {}
    for t, p in heard:
        by_pc.setdefault(p % 12, []).append(t)
    diffs = []
    for t, p in ref:
        hs = by_pc.get(p % 12)
        if hs:
            a = np.asarray(hs); d = t - a; diffs.append(d[np.abs(d) < janela])
    if not diffs:
        return 0.0
    d = np.concatenate(diffs)
    h, e = np.histogram(d, bins=np.arange(-janela, janela + 0.05, 0.05))
    h = np.convolve(h, [1, 2, 1], mode='same')
    top = np.argsort(h)[::-1]
    cands = []
    for c in top:
        x = float((e[c] + e[c + 1]) / 2)
        if all(abs(x - y) > 0.5 for y in cands):
            cands.append(x)
        if len(cands) >= 8:
            break
    best = max(cands, key=lambda x: f1(ref, [(t + x, p) for t, p in heard], tol=0.12, pc=True)['achou'])
    fine = np.arange(best - 0.2, best + 0.2, 0.01)
    return float(max(fine, key=lambda x: f1(ref, [(t + x, p) for t, p in heard], tol=0.07, pc=True)['achou']))


def f1(ref, est, tol=0.2, pc=False):
    est = sorted(est); used = set(); tp = 0; es = np.array([e[0] for e in est]) if est else np.array([])
    for t, p in ref:
        i0, i1 = np.searchsorted(es, t - tol), np.searchsorted(es, t + tol)
        for j in range(i0, i1):
            if j not in used and ((est[j][1] % 12 == p % 12) if pc else est[j][1] == p):
                used.add(j); tp += 1; break
    P = tp / max(1, len(est)); R = tp / max(1, len(ref))
    return {'f1': round(2 * P * R / max(1e-9, P + R), 3), 'achou': round(R, 3), 'certas': round(P, 3), 'oficiais': len(ref), 'escritas': len(est)}


def tokens_no_compasso(evs, t0, P):
    """notes (start, end, midi) inside one bar -> 'B4:2 R:1 D5:1' (quarters, rounded to eighths)"""
    out, pos = [], 0.0
    for s, e, m in sorted(evs):
        q = round((s - t0) / P * 2) / 2
        if q < 0 or q >= 4:
            continue
        if q > pos:
            out.append(f'R:{q - pos:g}')
        d = max(0.5, round((e - s) / P * 2) / 2)
        out.append(f'{A.pname(m)}:{d:g}'); pos = q + d
    return ' '.join(out) or '-'


LICOES_SCHEMA = {'type': 'object', 'additionalProperties': False, 'required': ['licoes'],
                 'properties': {'licoes': {'type': 'array', 'items': {'type': 'object', 'additionalProperties': False,
                                'required': ['texto', 'compassos'], 'properties': {'texto': {'type': 'string'}, 'compassos': {'type': 'string'}}}}}}


def sugerir_licoes(comparacao, titulo, regras):
    """Claude reads where the AI and the arranger differ and writes general lessons (not note lists)"""
    import anthropic
    client = anthropic.Anthropic()
    msg = client.beta.messages.create(
        model=os.environ.get('ARRANJO_MODELO', 'claude-opus-5-5'), max_tokens=16000,
        betas=['server-side-fallback-2026-07-01'], fallbacks='default',
        output_config={'effort': 'medium', 'format': {'type': 'json_schema', 'schema': LICOES_SCHEMA}},
        system='Você ajuda a treinar uma IA que escreve arranjos de metais (trompete, sax tenor, trombone) para uma banda '
               'brasileira. Compare o que a IA escreveu com o que o arranjador da banda escreveu e tire lições gerais, que '
               'sirvam para as próximas músicas: textura, onde os metais entram, duração das notas, ritmo, região, articulação, '
               'repetições. Escreva em português simples, uma lição por item, no máximo 8, sem repetir o que as regras atuais '
               'já dizem. Em "compassos" diga em que compassos da comparação isso aparece.\n\nRegras atuais da IA:\n' + (regras or A.REGRAS),
        messages=[{'role': 'user', 'content': f'Música: {titulo}\nCompasso a compasso (som real; durações em semínimas; - = pausa), '
                   f'só a voz de cima (trompete):\n\n{comparacao}'}],
    )
    if msg.stop_reason == 'refusal':
        return [], msg.usage
    txt = next((b.text for b in msg.content if b.type == 'text'), '{}')
    return json.loads(txt).get('licoes', [])[:8], msg.usage


def avaliar(out_dir, sk, arr, oficial_path, titulo, regras):
    """returns the result dict saved on the training round"""
    of = oficial_eventos(oficial_path, sk.get('bpm'))
    if not of:
        raise RuntimeError('Não achei trompete, sax ou trombone na partitura oficial (confira os nomes das partes).')
    notas = json.load(open(os.path.join(out_dir, 'notas.json')))
    heard = [n for n in notas.get('other', []) if 50 <= n[2] <= 88]
    off = melhor_deslocamento([(s, p) for v in of.values() for s, e, p in v], [(n[0], n[2]) for n in heard])
    ia = A.eventos(sk, arr)
    res = {'deslocamento': round(off, 2), 'instrumentos': {}}
    for k in ('tpt', 'sax', 'tbn'):
        if k not in of:
            continue
        ref = [(s, p) for s, e, p in of[k]]
        est = [(e[0] + off, e[2]) for e in ia.get(k, [])]
        r = f1(ref, est); r['mesma_nota_qualquer_oitava'] = f1(ref, est, pc=True)['f1']
        r['teto'] = f1(ref, [(n[0] + off, n[2]) for n in heard], pc=True)['achou']
        res['instrumentos'][k] = r
    # bar by bar, trumpet line: where the AI and the arranger differ
    P = 60.0 / sk['bpm']; lines = []; differ = 0
    top = of.get('tpt') or next(iter(of.values()))
    for b in sk['compassos']:
        t0 = b['t'] + off
        o = [(s, e, p) for s, e, p in top if t0 - 0.05 <= s < t0 + 4 * P - 0.05]
        a = [(s + off, e + off, p) for s, e, p, *_ in ia.get('tpt', []) if t0 - 0.05 <= s + off < t0 + 4 * P - 0.05]
        to, ta = tokens_no_compasso(o, t0, P), tokens_no_compasso(a, t0, P)
        if to == '-' and ta == '-':
            continue
        if to != ta:
            differ += 1
        lines.append(f'c{b["n"]} [{b["cifra"] or "-"}] IA: {ta} | arranjador: {to}')
    res['compassos_diferentes'] = differ
    res['avisos'] = list(dict.fromkeys(AVISOS))
    licoes, uso = sugerir_licoes('\n'.join(lines[:220]), titulo, regras)
    res['licoes_sugeridas'] = licoes
    res['media_f1'] = round(float(np.mean([v['f1'] for v in res['instrumentos'].values()])), 3) if res['instrumentos'] else 0.0
    return res, uso
