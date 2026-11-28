"""O Malak lê a partitura sem perder pausas nem notas, confere os compassos e não gasta à toa.

Roda sem internet e sem conta (precisa de pymupdf e music21):
    python3 testes/malak_leitura.py

Cada caso imita um erro achado nas grades da turnê (Era uma Vez, Sobre Nós, Capricorniana, Poesia 13, Teu Popô,
Céu Azul) com uma página montada aqui mesmo, sem os PDFs da banda:
  1. o fundo branco da página (MuseScore 4) era lido como barra de colcheia em toda nota do meio da página;
  2. nota aguda com linhas suplementares (sax, trombone) caía na pauta de cima;
  3. a 2ª barra de semicolcheias com haste para cima não era contada;
  4. o ponto de uma pausa pontuada virava ponto da nota antes dela;
  5. quiálteras (3, 6, 2) somavam tempo a mais;
  6. a bandeirola ia para a pauta de baixo quando duas notas ficam uma em cima da outra;
  7. PDFs do Finale (fonte Maestro, barras como retângulos) não eram lidos;
  8. conferência dos compassos antes do áudio, e "nada mudou" não gera de novo nem gasta.
"""
import os, sys
from fractions import Fraction as F
from unittest import mock
import xml.etree.ElementTree as ET

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'server', 'malak'))
import pymupdf  # noqa: E402
import vetor  # noqa: E402

falhas = 0


def confere(nome, ok, extra=''):
    global falhas
    falhas += not ok
    print('ok  ' if ok else 'FAIL', nome, '' if ok else extra)


SP = 5.0
TOPS = [100.0, 150.0]  # two staves, 5 pt between lines
W, H = 600.0, 800.0


def g(code, x, y, w=6.4, size=20.0):
    return {'c': code, 'x': x, 'y': y, 'x1': x + w, 'size': size}


def page(glyphs, stems=(), beams=(), ledgers=()):
    return {'W': W, 'H': H, 'g': list(glyphs), 'stems': list(stems), 'beams': [list(b) for b in beams], 'curves': [],
            'staves': [(t, SP, 40.0, 560.0) for t in TOPS], 'ledgers': list(ledgers)}


class P:  # a point, like pymupdf's
    def __init__(self, x, y):
        self.x, self.y = x, y


def band(x0, x1, y0, y1):
    return [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1), P(x0, y0)]


BOX = [1, 1, 1, 50 / W, 90 / H, 300 / W, 180 / H]


def ler(pg, nst=2):
    class R:
        def __init__(self, pdf):
            pass

        def page(self, n):
            return pg
    meta = {}
    with mock.patch.object(vetor, 'Reader', R):
        try:
            ev = vetor.read('x.pdf', [BOX], nst, meta)
        except TypeError:  # an older vetor.py (to see these cases fail there)
            ev = vetor.read('x.pdf', [BOX], nst)
    return ev[0], meta


def resumo(e):
    if e is None:
        return None
    return [('r' if x['rest'] else '+'.join(f'{s}{o}' for s, a, o in x['pitches'])) + ':' + str(x['dur']) for x in e]


soma = lambda e: sum(x['dur'] for x in e) if e else None
WREST = 0xE4E3
TS4 = [g(0xE084, 62, TOPS[0] + 5), g(0xE084, 62, TOPS[0] + 15), g(0xE084, 62, TOPS[1] + 5), g(0xE084, 62, TOPS[1] + 15)]

# 1. white page background is not a beam; Finale's rectangle beams are
doc = pymupdf.open(); pg = doc.new_page(width=W, height=H)
sh = pg.new_shape(); sh.draw_polyline([(0, 0), (W, 0), (W, H), (0, H), (0, 0)]); sh.finish(color=None, fill=(1, 1, 1)); sh.commit()  # as MuseScore 4 paints it
pg.draw_rect(pymupdf.Rect(100, 300, 140, 302.5), color=None, fill=(0, 0, 0))
sh = pg.new_shape(); sh.draw_polyline([(200, 300), (240, 302), (240, 304.5), (200, 302.5), (200, 300)]); sh.finish(color=None, fill=(0, 0, 0)); sh.commit()
_hl, _vl, beams, _c = vetor._lines(pg)
spans = sorted((round(min(p.x for p in b)), round(max(p.x for p in b))) for b in beams)
confere('fundo branco da página não é barra; barra em retângulo (Finale) e em polígono contam', spans == [(100, 140), (200, 240)], spans)

# 2. high note of the lower staff, with its ledger lines, stays on its staff
top1 = TOPS[1]
ledg = [(118, 130, top1 - k * SP) for k in range(1, 5)]
ev, _ = ler(page([g(WREST, 150, TOPS[0] + 10), g(0xE0A2, 120, top1 - 4 * SP, w=8)], ledgers=ledg))
confere('nota aguda com 4 linhas suplementares fica na pauta de baixo', resumo(ev[0]) == ['r:4'] and resumo(ev[1]) == ['G6:4'], (resumo(ev[0]), resumo(ev[1])))
ev, _ = ler(page([g(WREST, 150, TOPS[0] + 10), g(0xE0A2, 120, TOPS[0] + 4 * SP + 2 * SP, w=8)], ledgers=[(118, 130, TOPS[0] + 5 * SP)]))
confere('nota grave da pauta de cima (linha suplementar embaixo) fica em cima', resumo(ev[0]) == ['A3:4'] and resumo(ev[1]) is None or resumo(ev[1]) == [], (resumo(ev[0]), resumo(ev[1])))

# 3. four 16ths, stems up, two beams; then a quarter rest and a half rest
top = TOPS[0]
xs = [80, 95, 110, 125]
heads = [g(0xE0A4, x, top + 15) for x in xs]
stems = [(x + 6.2, top - 2, top + 14.5, 0.5) for x in xs]
bms = [band(86, 131.2, top - 2, top + 0.5), band(86, 131.2, top + 1.75, top + 4.25)]
rests = [g(0xE4E5, 160, top + 10), g(0xE4E4, 200, top + 10)]
ev, _ = ler(page(heads + rests + [g(WREST, 150, TOPS[1] + 10)], stems, bms))
confere('2ª barra de semicolcheias com haste para cima', [x['dur'] for x in ev[0]] == [F(1, 4)] * 4 + [1, 2], resumo(ev[0]))

# 4. dotted 8th, 16th, dotted 8th rest, 16th, half rest: the rest's dot is not the 16th's
DOT, R8 = 0xE1E7, 0xE4E6
gl = [g(0xE0A4, 80, top + 15), g(DOT, 88, top + 12.5, w=2),            # dotted 8th (stem + flag)
      g(0xE0A4, 100, top + 15),                                            # 16th
      g(R8, 108, top + 10), g(DOT, 114, top + 12.5, w=2),                  # dotted 8th rest, its dot close to the 16th
      g(0xE0A4, 135, top + 15),                                            # 16th
      g(0xE4E4, 170, top + 10),                                            # half rest
      g(0xE240, 86.2, top - 2), g(0xE242, 106.2, top - 2), g(0xE242, 141.2, top - 2),
      g(WREST, 150, TOPS[1] + 10)]
st = [(86.2, top - 2, top + 14.5, 0.5), (106.2, top - 2, top + 14.5, 0.5), (141.2, top - 2, top + 14.5, 0.5)]
ev, _ = ler(page(gl, st))
confere('ponto da pausa pontuada não vai para a nota antes dela', [x['dur'] for x in ev[0]] == [F(3, 4), F(1, 4), F(3, 4), F(1, 4), 2], resumo(ev[0]))

# 5. tuplets: six 8ths under a "6", then a quarter and a quarter rest (4/4 printed); a "3" over three quarters
xs = [80, 92, 104, 116, 128, 140]
gl = TS4 + [g(0xE0A4, x, top + 15) for x in xs] + [g(0xE240, x + 6.2, top - 2) for x in xs] + \
     [g(0xE0A4, 170, top + 15), g(0xE4E5, 200, top + 10), {'c': 'tuplet', 'n': 6, 'x': 108, 'y': top + 30, 'x1': 112, 'size': 10}]
st = [(x + 6.2, top - 2, top + 14.5, 0.5) for x in xs + [170]]
top1 = TOPS[1]
gl += [g(0xE4E4, 75, top1 + 10)] + [g(0xE0A4, x, top1 + 15) for x in (120, 150, 180)] + \
      [{'c': 'tuplet', 'n': 3, 'x': 148, 'y': top1 - 8, 'x1': 152, 'size': 10}]
st += [(x + 6.2, top1 - 2, top1 + 14.5, 0.5) for x in (120, 150, 180)]
ev, meta = ler(page(gl, st))
confere('compasso 4/4 lido da armadura de tempo', meta['bar_len'] == [4], meta)
confere('sextina de colcheias soma 2 tempos', soma(ev[0]) == 4 and ev[0][0]['dur'] == F(1, 3), resumo(ev[0]))
confere('tercina de semínimas soma 2 tempos', soma(ev[1]) == 4 and ev[1][1]['dur'] == F(2, 3), resumo(ev[1]))
ev2, _ = ler(page([x for x in gl if x['c'] != 'tuplet'], st))
confere('sem o número da quiáltera nada é inventado', soma(ev2[0]) == 5, resumo(ev2[0]))

# 6. the 8th flag between two stacked notes goes with the note whose stem ends at it
t0, t1 = TOPS
gl = [g(0xE0A3, 60, t0 + 15), g(0xE4E5, 150, t0 + 10),                     # staff 0: half + ... (quarter added below)
      g(0xE0A4, 100, t0 + 15), g(0xE0A4, 120, t0 + 25),                   # staff 0 quarter ; staff 0 8th low (stem down)
      g(0xE241, 120, t0 + 41.5),                                           # its flag, closer to staff 1's middle
      g(0xE0A3, 60, t1 + 15), g(0xE0A3, 100, t1 + 15)]
st = [(60, t0 + 16, t0 + 32, 0.5), (100, t0 + 16, t0 + 32, 0.5), (120, t0 + 26, t0 + 42, 0.5), (60, t1 + 16, t1 + 32, 0.5), (100, t1 + 16, t1 + 32, 0.5)]
ev, _ = ler(page(gl + [g(0xE4E6, 140, t0 + 10)], st))
confere('bandeirola fica com a nota da própria haste', [x['dur'] for x in ev[0]] == [2, 1, F(1, 2), F(1, 2), 1][:len(ev[0])] and soma(ev[0]) == 5 and soma(ev[1]) == 4, (resumo(ev[0]), resumo(ev[1])))

# 7. Finale (Maestro font) symbols become the same SMuFL symbols; small chord-symbol sharps don't
mg = [g(0xF0CF, 80, top + 15, size=19.3), g(0xF0FA, 100, top + 15, size=19.3), g(0xF0CE, 130, top + 10, size=19.3),
      g(0xF023, 70, top + 15, size=19.3), g(0xF023, 200, top + 40, size=11.3), g(0xF02E, 108, top + 12.5, w=2, size=19.3)]
out = vetor._maestro([dict(x) for x in mg])
confere('fonte Maestro do Finale vira SMuFL', [x['c'] for x in out] == [0xE0A4, 0xE0A3, 0xE4E5, 0xE262, 0xF023, 0xE1E7], [hex(x['c']) for x in out])
smufl = [g(0xE0A4, 80, top + 15), g(0xF0CF, 90, top + 15)]
confere('página com SMuFL não é mexida', [x['c'] for x in vetor._maestro([dict(x) for x in smufl])] == [0xE0A4, 0xF0CF])

# 8. patch: vector bar replaces the image reading when it adds up to the printed time signature
xml = """<score-partwise><part-list/><part id="P1"><measure number="1"><attributes><divisions>1</divisions>
<time><beats>3</beats><beat-type>4</beat-type></time></attributes><note><rest/><duration>3</duration></note></measure></part></score-partwise>"""
root = ET.fromstring(xml)
ev = [[[{'x': 0, 'x1': 1, 'ys': [0], 'dur': F(1, 3), 'rest': False, 'pitches': [('C', 0, 5)], 'tie': [False]} for _ in range(6)] +
       [{'x': 0, 'dur': F(2), 'rest': True, 'pitches': []}]]]
done, kept = vetor.patch_musicxml(root, ev, 1, [F(4)])
durs = [int(n.findtext('duration')) for n in root.iter('note')]
confere('compasso lido dos símbolos entra quando soma o tempo impresso no PDF', (done, kept) == (1, 0) and durs == [320] * 6 + [1920], (done, kept, durs))

# 9. robo.py: check bars before the audio; skip a run that changes nothing
for m in ['google', 'google.cloud', 'google.cloud.firestore', 'google.cloud.storage', 'soundfile', 'layout2', 'hornsampler']:
    sys.modules.setdefault(m, mock.MagicMock())
import music21 as m21  # noqa: E402
import robo  # noqa: E402

s = m21.stream.Score()
for nome, curto in (('Trompete', False), ('Trombone', True)):
    p = m21.stream.Part(); p.partName = nome
    for i in range(1, 4):
        mm = m21.stream.Measure(number=i)
        if i == 1:
            mm.timeSignature = m21.meter.TimeSignature('4/4')
        mm.append(m21.note.Note('C4', quarterLength=3.5 if (curto and i == 2) else 4))
        p.append(mm)
    s.insert(0, p)
confere('conferência acha o compasso curto antes do áudio', robo.compassos_errados(s) == {'Trombone': [2]}, robo.compassos_errados(s))

song = {'parts': [{'src': 'scores/a/grade.pdf', 'key': 'grade'}], 'player': {'mixes': {'tudo': 'x'}, 'lido': 'l1'}}
song['player']['entrada'] = robo.entrada_do_trabalho(song, {'fonte': 'pdf'})
confere('mesmo PDF, mesmo andamento, mesmo robô: nada mudou', robo.nada_mudou(song, {'fonte': 'pdf'}))
confere('"da partitura lida" sem correções também não muda nada', robo.nada_mudou(song, {'fonte': 'lido'}))
confere('outro andamento gera de novo', not robo.nada_mudou(song, {'fonte': 'pdf', 'bpm': 90}))
confere('correção pendente gera de novo', not robo.nada_mudou({**song, 'correcoes': [{'compasso': 3}]}, {'fonte': 'lido'}))
confere('PDF novo gera de novo', not robo.nada_mudou({**song, 'parts': [{'src': 'scores/a/v2/grade.pdf'}]}, {'fonte': 'pdf'}))
confere('robô novo gera de novo', not robo.nada_mudou({**song, 'player': {**song['player'], 'entrada': {**song['player']['entrada'], 'v': 'velho'}}}, {'fonte': 'pdf'}))
confere('áudio antigo, sem registro da entrada, gera de novo', not robo.nada_mudou({**song, 'player': {'mixes': {'tudo': 'x'}}}, {'fonte': 'pdf'}))
confere('pedido de forçar gera de novo', not robo.nada_mudou(song, {'fonte': 'pdf', 'forcar': True}))

sys.exit(1 if falhas else 0)
