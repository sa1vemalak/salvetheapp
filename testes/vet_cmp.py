import sys, json, copy, numpy as np
sys.path.insert(0, 'server/robo'); import robo, music21 as m21
pdf = '/root/.claude/uploads/7639134b-da79-503b-9d91-2316ae46b5a7/8b42b664-04_-_Poesia_3_Capricorniana-Grade.pdf'
boxes, _ = robo.layout2.layout(pdf, None)
gab = json.load(open('mest/gab/capricorniana.events.json'))['parts']
names = ['Trompete em B♭', 'Saxofone Tenor', 'Trombone', 'Base']
for label, use in (('antes (só imagem)', None), ('agora (símbolos do PDF)', pdf)):
    s = robo.load_score(['rtest/raw/grade.mxl'], boxes, use)
    s = robo.unfold(s, robo.LAST_PLAN) if robo.LAST_PLAN else s
    for pt, nm in zip(s.parts, names): robo.set_transposition(pt, nm)
    tot = 0; res = []
    for pt, k in zip(s.parts[:3], ['trumpet', 'tenor-sax', 'trombone']):
        q = pt.toSoundingPitch() if pt.atSoundingPitch is False else pt
        est = []
        for n in q.flatten().stripTies().notes:
            t = float(n.getOffsetInHierarchy(q)) * 60 / 152
            for p in n.pitches: est.append((t, p.midi, float(n.quarterLength) * 60 / 152))
        ref = [(a / 1000, p, (b - a) / 1000) for a, b, p, *_ in gab[k]['notes']]
        # best global shift (the official starts the same; allow small offset)
        used = set(); hit = durok = 0
        es = sorted(est)
        for r in ref:
            for j, e in enumerate(es):
                if j in used: continue
                if abs(e[0] - r[0]) < 0.08 and e[1] == r[1]:
                    used.add(j); hit += 1; durok += abs(e[2] - r[2]) < 0.2; break
                if e[0] > r[0] + 0.1: break
        res.append(f'{k}: {hit}/{len(ref)} notas no tempo e altura certos ({hit/len(ref):.0%}), duração certa {durok/len(ref):.0%}, sobrando {len(es)-hit}')
    print(label, '|', robo.LAST_PLAN and 'repetições ok', '\n  ' + '\n  '.join(res))
