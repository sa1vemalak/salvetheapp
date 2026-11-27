# Teste de separadores (Capricorniana, 27/11/2026)

Pergunta: um separador de sopros grátis ajuda o Mestrinho a ouvir os metais melhor que o canal "other" do Demucs?

| Canal | Teto trompete | Teto naipe | Limpeza |
|---|---|---|---|
| Demucs htdemucs_6s "other" (atual) | 78% | 61% | 7% |
| UVR 17_HP-Wind_Inst (Woodwinds) sobre o "other" | 21% | 16% | 31% |

- Teto = notas oficiais dos metais que aparecem no canal (mesma nota em qualquer oitava, até 0,1 s).
- Limpeza = parte das notas do canal que são notas dos metais.

Conclusão: o modelo grátis é de madeiras (sax, flauta, clarinete) e perde trompete e trombone. Fica o Demucs.
Separador de metais de verdade hoje só em serviços pagos e fechados (Moises/Music.AI, só com convite; LALAL.AI).
`separa.py` roda como Cloud Run Job `separador-teste` (imagem do Mestrinho); `medir.py` compara com a partitura oficial.
