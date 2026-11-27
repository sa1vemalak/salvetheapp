# how much of the official horn parts each candidate stem lets us hear, and how much junk comes with it
import sys, json; sys.path.insert(0, 'server/mestrinho'); import treino
cand = json.load(open(sys.argv[1]))
of = treino.oficial_eventos('rtest/oficial-capricorniana.musicxml')
ref = sorted({(round(s, 2), p) for v in of.values() for s, e, p in v})   # official horn attacks (sounding)
ref_tpt = [(s, p) for s, e, p in of['tpt']]
print(f'{"canal":34s} {"notas":>6s} {"desloc":>7s} {"teto trompete":>14s} {"teto todos":>11s} {"limpeza":>8s}')
for k, ns in cand.items():
    heard = [(n[0], n[2]) for n in ns if 50 <= n[2] <= 88]
    off = treino.melhor_deslocamento(ref, heard)
    h = [(t + off, p) for t, p in heard]
    teto_t = treino.f1(ref_tpt, h, tol=0.1, pc=True)['achou']
    r = treino.f1(ref, h, tol=0.1, pc=True)
    print(f'{k:34s} {len(heard):6d} {off:7.2f} {teto_t:14.0%} {r["achou"]:11.0%} {r["certas"]:8.0%}')
print('teto = parte das notas oficiais que aparecem no canal (mesma nota, qualquer oitava, até 0,1 s)')
print('limpeza = parte das notas do canal que são notas dos metais (o resto é outro instrumento ou ruído)')
