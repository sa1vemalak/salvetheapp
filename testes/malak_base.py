"""A base da grade não vira trompete (Teu Popô: a pauta da base não tinha nome no 1º sistema e ganhou "B♭ Tpt.").

Roda sem internet e sem conta (precisa do music21):
    python3 testes/malak_base.py
"""
import os, sys
from unittest import mock

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'server', 'malak'))
for m in ['google', 'google.cloud', 'google.cloud.firestore', 'google.cloud.storage', 'soundfile', 'vetor', 'layout2', 'hornsampler']:
    sys.modules[m] = mock.MagicMock()
import music21 as m21  # noqa: E402
import robo  # noqa: E402

falhas = 0


def confere(nome, ok):
    global falhas
    falhas += not ok
    print('ok  ' if ok else 'FAIL', nome)


# 1. os nomes da grade param no 2º sistema (nomes curtos), sem pular para a pauta da base
primeiro = ['Trumpet in B', 'Tenor Sax', 'Trombone']
confere('"B Tpt." depois de "Trumpet in B" é o 2º sistema', robo.repeats_instrument('B Tpt.', primeiro))
confere('"T. Sx." depois de "Tenor Sax" é o 2º sistema', robo.repeats_instrument('T. Sx.', primeiro[1:]))
confere('"Tbn." depois de "Trombone" é o 2º sistema', robo.repeats_instrument('Tbn.', ['Trombone']))
confere('"Trombone" no 1º sistema continua', not robo.repeats_instrument('Trombone', primeiro[:2]))
confere('"Fl." sem flauta antes continua', not robo.repeats_instrument('Fl.', primeiro))

# 2. a parte de cifras se chama Base e toca como base (piano + baixo), sem transposição
confere('chart_name("B Tpt.") = Base', robo.chart_name('B Tpt.') == 'Base')
confere('chart_name("Guitarra") fica Guitarra', robo.chart_name('Guitarra') == 'Guitarra')
prog, drums = robo.program_for(None, robo.chart_name('B Tpt.'))
confere('Base não usa as gravações de sopro', prog not in robo.SAMPLED and not drums)
pt = m21.stream.Part()
confere('Base não é transposta', robo.set_transposition(pt, 'Base') is None)

# 3. uma base salva com nome de trompete (rodada antiga) é reconhecida pelos acordes
ref = m21.stream.Score()
horn = m21.stream.Part()
for i in range(12):
    mm = m21.stream.Measure(number=i + 1); mm.append(m21.note.Note('A4', quarterLength=4)); horn.append(mm)
ref.insert(0, horn)
chords = {i + 1: [(0.0, 'G' if i % 2 == 0 else 'D7')] for i in range(12)}
base = robo.comping_part(ref, chords, 'B Tpt.')  # the base as the robot makes it from the grade's chord symbols
confere('a base de acordes é reconhecida', robo.is_comping(base))
confere('o trompete não é base', not robo.is_comping(horn))

sys.exit(1 if falhas else 0)
