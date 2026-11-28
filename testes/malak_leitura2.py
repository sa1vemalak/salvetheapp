"""Mais acertos do Malak ao ler o PDF, achados comparando a leitura com partituras de referência.

Roda sem internet e sem conta (precisa de pymupdf):
    python3 testes/malak_leitura2.py

As páginas são montadas aqui mesmo, sem nenhuma partitura real:
  1. a parte começa com vários compassos de espera: a clave, a armadura e a fórmula de compasso desse primeiro
     quadro valem para o resto (antes ficavam perdidas e as tercinas não eram vistas);
  2. o número da pausa de vários compassos (impresso com os mesmos algarismos da fórmula) não vira fórmula;
  3. tercina com menos notas e mais longas (semínima + colcheia debaixo do "3");
  4. nota ligada por cima da barra de compasso mantém o acidente no compasso seguinte; um bequadro escrito vale mais.
"""
import os, sys
from fractions import Fraction as F
from unittest import mock

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
TOP = 100.0
W, H = 600.0, 800.0


def g(code, x, y, w=6.4, size=20.0):
    return {'c': code, 'x': x, 'y': y, 'x1': x + w, 'size': size}


def page(glyphs, stems=(), curves=()):
    return {'W': W, 'H': H, 'g': list(glyphs), 'stems': list(stems), 'beams': [], 'curves': list(curves),
            'staves': [(TOP, SP, 40.0, 560.0)], 'ledgers': []}


def box(mf, ml, x0, x1):
    return [mf, ml, 1, x0 / W, 85 / H, x1 / W, 135 / H]


def ler(pg, boxes):
    class R:
        def __init__(self, pdf):
            pass

        def page(self, n):
            return pg
    meta = {}
    with mock.patch.object(vetor, 'Reader', R):
        ev = vetor.read('x.pdf', boxes, 1, meta)
    return [e[0] for e in ev], meta


def resumo(e):
    if e is None:
        return None
    return [('r' if x['rest'] else '+'.join(f'{s}{"#" if a > 0 else "b" if a < 0 else ""}{o}' for s, a, o in x['pitches']))
            + ':' + str(x['dur']) for x in e]


Y = lambda step: TOP + 20 - step * SP / 2  # staff position: 0 = bottom line (E4 in treble clef)
SHARP, NATURAL, WHOLE, HALF_REST, BLACK, FLAG8 = 0xE262, 0xE261, 0xE0A2, 0xE4E4, 0xE0A4, 0xE240
stem = lambda x: (x + 6.2, Y(2) - 17, Y(2) - 0.5, 0.5)

# 1 + 2. six bars of rest (3/4, two sharps, the "6" over the staff), then a bar with an F and a tuplet
mrest = [g(0xE050, 45, Y(2)), g(SHARP, 60, Y(8)), g(SHARP, 66, Y(5)),  # clef, key: F#, C#
         g(0xE083, 75, TOP + 5), g(0xE084, 75, TOP + 15),            # 3/4
         g(0xE086, 130, TOP - 8)]                                     # the multi-rest count "6"
bar7 = [g(BLACK, 220, Y(1)), g(BLACK, 250, Y(2)), g(BLACK, 270, Y(3)), g(FLAG8, 276.2, Y(2) - 17),
        {'c': 'tuplet', 'n': 3, 'x': 258, 'y': TOP - 8, 'x1': 262, 'size': 10}, g(0xE4E5, 310, Y(4))]
ev, meta = ler(page(mrest + bar7, [stem(220), stem(250), stem(270)]), [box(1, 6, 40, 200), box(7, 7, 200, 350)])
confere('fórmula 3/4 do primeiro quadro (pausa de 6 compassos) vale para o compasso seguinte', meta['bar_len'] == [F(3), F(3)], meta['bar_len'])
confere('armadura do primeiro quadro vale: o Fá do compasso 7 é Fá#', resumo(ev[1])[:1] == ['F#4:1'], resumo(ev[1]))
confere('tercina de semínima + colcheia soma 1 tempo', [x['dur'] for x in ev[1]] == [1, F(2, 3), F(1, 3), 1], resumo(ev[1]))

ev, meta = ler(page([g(0xE084, 75, TOP + 5), g(0xE084, 75, TOP + 15), g(0xE086, 130, TOP - 8)] +
                    [g(WHOLE, 220, Y(2))]), [box(1, 6, 40, 200), box(7, 7, 200, 350)])
confere('o "6" da pausa longa não vira fórmula de compasso', meta['bar_len'] == [F(4), F(4)], meta['bar_len'])

# 3. without the "3", nothing is invented
ev, meta = ler(page(mrest + bar7[:4] + bar7[5:], [stem(220), stem(250), stem(270)]), [box(1, 6, 40, 200), box(7, 7, 200, 350)])
confere('sem o número da tercina a duração fica como está', [x['dur'] for x in ev[1]] == [1, 1, F(1, 2), 1], resumo(ev[1]))

# 4. G# whole note tied over the barline to a G with no accidental
tie = [((228, Y(2) + 3), (305, Y(2) + 3))]
ev, _ = ler(page([g(SHARP, 210, Y(2)), g(WHOLE, 220, Y(2)), g(WHOLE, 300, Y(2))], curves=tie),
            [box(1, 1, 200, 290), box(2, 2, 290, 380)])
confere('nota ligada por cima da barra continua sustenida', resumo(ev[1]) == ['G#4:4'], (resumo(ev[0]), resumo(ev[1])))
ev, _ = ler(page([g(SHARP, 210, Y(2)), g(WHOLE, 220, Y(2)), g(NATURAL, 292, Y(2)), g(WHOLE, 300, Y(2))], curves=tie),
            [box(1, 1, 200, 290), box(2, 2, 290, 380)])
confere('bequadro escrito no compasso seguinte vale mais que a ligadura', resumo(ev[1]) == ['G4:4'], resumo(ev[1]))
ev, _ = ler(page([g(SHARP, 210, Y(2)), g(WHOLE, 220, Y(2)), g(WHOLE, 300, Y(2))]), [box(1, 1, 200, 290), box(2, 2, 290, 380)])
confere('sem ligadura o acidente não passa a barra', resumo(ev[1]) == ['G4:4'], resumo(ev[1]))

sys.exit(1 if falhas else 0)
