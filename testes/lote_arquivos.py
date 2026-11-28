"""Arquivos de teste do "Enviar várias partituras" (testes/lote.js): PDFs com texto como os do MuseScore/Finale,
um PDF escaneado (sem texto), uma grade, MusicXML, MuseScore (.mscz) e um .zip com pasta. Nada aqui é partitura de
verdade: só os títulos, o nome do instrumento e uns sinais soltos, no lugar onde os programas costumam escrever.
   python3 testes/lote_arquivos.py PASTA        (precisa do reportlab)"""
import io, os, sys, zipfile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

W, H = A4


def pauta(c, y0, n=5):
    for i in range(n):
        y = y0 - i * 7
        c.line(60, y, W - 40, y)


def parte(caminho, titulo, instrumento, credito='Arr. Fulano de Tal', extra=None, sub=None):
    c = canvas.Canvas(caminho, pagesize=A4)
    c.setFont('Helvetica', 11); c.drawString(40, H - 40, instrumento)                  # nome da parte no alto, à esquerda
    c.setFont('Helvetica-Bold', 24); c.drawCentredString(W / 2, H - 70, titulo)       # título grande, no meio
    if sub: c.setFont('Helvetica', 13); c.drawCentredString(W / 2, H - 92, sub)
    c.setFont('Helvetica', 10); c.drawRightString(W - 40, H - 110, credito)
    c.setFont('Helvetica-Bold', 10); c.drawString(60, H - 140, 'Swing  q = 120')
    for k in range(8):
        y = H - 170 - k * 80
        pauta(c, y)
        c.setFont('Helvetica', 10); c.drawString(70, y + 14, ['Cm7', 'F7', 'Bbmaj7', 'Eb6'][k % 4])
        c.setFont('Helvetica', 8); c.drawString(50, y + 4, str(k * 4 + 1))
        if k == 2: c.setFont('Helvetica-Bold', 12); c.drawString(62, y + 26, 'A')
    if extra: c.setFont('Helvetica', 9); c.drawCentredString(W / 2, 30, extra)
    c.showPage(); c.save()


def grade(caminho, titulo, nomes):
    c = canvas.Canvas(caminho, pagesize=A4)
    c.setFont('Helvetica-Bold', 22); c.drawCentredString(W / 2, H - 60, titulo)
    c.setFont('Helvetica', 10); c.drawRightString(W - 40, H - 90, 'Música: Beltrano · Arranjo: Fulano')
    for k, n in enumerate(nomes):                                                       # nome de cada pauta, à esquerda
        y = H - 150 - k * 60
        c.setFont('Helvetica', 9); c.drawString(20, y - 14, n)
        pauta(c, y)
    c.showPage(); c.save()


def escaneado(caminho):
    c = canvas.Canvas(caminho, pagesize=A4)                                             # só desenho, nenhum texto (como uma foto)
    for k in range(10):
        pauta(c, H - 100 - k * 70)
    c.showPage(); c.save()


def musicxml(titulo, partes):
    sp = ''.join(f'<score-part id="P{i+1}"><part-name>{p}</part-name></score-part>' for i, p in enumerate(partes))
    ps = ''.join(f'<part id="P{i+1}"><measure number="1"><attributes><divisions>1</divisions></attributes><note><rest/><duration>4</duration></note></measure></part>' for i in range(len(partes)))
    return (f'<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>{titulo}</work-title></work>'
            f'<part-list>{sp}</part-list>{ps}</score-partwise>')


def mscx(titulo, partes):
    ps = ''.join(f'<Part><trackName>{p}</trackName><Instrument><longName>{p}</longName></Instrument></Part>' for p in partes)
    return f'<?xml version="1.0" encoding="UTF-8"?><museScore version="4.20"><Score><metaTag name="workTitle">{titulo}</metaTag>{ps}</Score></museScore>'


def main(d):
    os.makedirs(d, exist_ok=True)
    j = lambda n: os.path.join(d, n)
    parte(j('Céu Azul - Trumpet in Bb.pdf'), 'Céu Azul', 'Trumpet in Bb')                       # já está na estante: parte nova
    parte(j('ceu azul sax.pdf'), 'Céu Azul', 'Tenor Saxophone')                                   # nome do arquivo não diz qual sax
    grade(j('Score.pdf'), 'Paris', ['Trumpet in Bb', 'Tenor Sax', 'Trombone', 'Base'])            # o arquivo não diz a música: a página diz
    parte(j('Part 3.pdf'), 'Nova Canção', 'Trombone')                                             # música nova, parte pelo texto
    parte(j('Teu Popô - Base.pdf'), 'Teu Popô', 'Base')                                           # versão antiga
    parte(j('Teu Popô - Base v2.pdf'), 'Teu Popô', 'Base')                                        # versão nova: fica esta
    parte(j('06 Canto de Ossanha - Trompete 2.pdf'), 'Canto de Ossanha', 'Trumpet 2 in Bb')     # "Canto" é nome da música, não voz
    escaneado(j('Sobre Nós - Trombone.pdf'))                                                       # escaneado: só o nome do arquivo
    escaneado(j('documento.pdf'))                                                                  # escaneado e sem nome: a pessoa escreve
    open(j('paris.musicxml'), 'w').write(musicxml('Paris', ['Trumpet in Bb', 'Tenor Sax', 'Trombone']))
    with zipfile.ZipFile(j('Melhor Forma.mscz'), 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('Melhor Forma.mscx', mscx('Melhor Forma', ['Trompete em Si♭']))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:                                  # .zip com pasta: a pasta é a música
        for nome, inst in [('Trompete.pdf', 'Trompete em Sib'), ('Trombone.pdf', None)]:
            b = io.BytesIO()
            if inst:
                c = canvas.Canvas(b, pagesize=A4); c.setFont('Helvetica', 11); c.drawString(40, H - 40, inst); pauta(c, H - 200); c.showPage(); c.save()
            else:
                c = canvas.Canvas(b, pagesize=A4); pauta(c, H - 200); c.showPage(); c.save()
            z.writestr('Capricorniana/' + nome, b.getvalue())
        z.writestr('__MACOSX/Capricorniana/._Trompete.pdf', b'lixo do Mac')
    open(j('Capricorniana.zip'), 'wb').write(buf.getvalue())
    open(j('ensaio.mp3'), 'wb').write(b'ID3' + b'\0' * 64)                                       # gravação: fica de fora


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'lote-arquivos')
