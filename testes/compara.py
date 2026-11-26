# compares the notes the robot read with the original score, part by part and bar by bar
import sys, music21 as m21, difflib
a = m21.converter.parse(sys.argv[1]); b = m21.converter.parse(sys.argv[2])
def seq(part):
    out = []
    for m in part.getElementsByClass('Measure'):
        for n in m.recurse().notesAndRests:
            if n.isRest: out.append(('R', float(n.quarterLength)))
            else: out.append((tuple(sorted(p.midi for p in n.pitches)), float(n.quarterLength)))
    return out
tot = ok = okp = 0
for i, (pa, pb) in enumerate(zip(a.parts, b.parts)):
    sa, sb = seq(pa), seq(pb)
    notes = [x for x in sa if x[0] != 'R']
    sm = difflib.SequenceMatcher(None, sa, sb, autojunk=False)
    same = sum(bl.size for bl in sm.get_matching_blocks())
    smp = difflib.SequenceMatcher(None, [x[0] for x in sa], [x[0] for x in sb], autojunk=False)
    samep = sum(bl.size for bl in smp.get_matching_blocks())
    tot += len(sa); ok += same; okp += samep
    print(f'{pa.partName or i} x {pb.partName}: {len(sa)} eventos no original, {len(sb)} lidos; nota+duração certas {same/len(sa):.0%}, só altura certa {samep/len(sa):.0%}')
print(f'TOTAL: nota+duração {ok/tot:.0%} · só altura {okp/tot:.0%} · compassos {len(a.parts[0].getElementsByClass("Measure"))} x {len(b.parts[0].getElementsByClass("Measure"))}')
