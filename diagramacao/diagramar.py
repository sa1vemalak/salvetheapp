#!/usr/bin/env python3
"""Diagramação no padrão da Turnê 10 Anos.

Recebe uma partitura em MusicXML (.musicxml / .xml / .mxl) e gera, com o MuseScore e o estilo das partituras da turnê:
  - a grade (todas as partes), 4 compassos por linha e linha nova em cada letra de ensaio;
  - uma parte por instrumento, com pausas longas agrupadas e o layout automático das partes da turnê;
  - cabeçalho padrão: título, subtítulo (Turnê 10 Anos), PineappleStorm e "Arr.: ...".

Uso:
  diagramar.py entrada.musicxml saida/ --titulo "Poesia Acústica #7: Céu Azul" --arranjo "Caio Brandão e Malak"
           [--subtitulo "Turnê 10 Anos"] [--autor PineappleStorm] [--estilo pasta_com_mss] [--compassos 4]
"""
import argparse, copy, os, re, subprocess, sys, tempfile, zipfile
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
MSCORE = os.environ.get('MSCORE', os.path.join(HERE, '..', 'squashfs-root', 'bin', 'mscore4portable'))
DEFAULT_STYLE = os.path.join(HERE, 'estilo_turne')


def read_musicxml(path):
    if path.lower().endswith('.mxl'):
        with zipfile.ZipFile(path) as z:
            cont = ET.fromstring(z.read('META-INF/container.xml'))
            root = cont.find('.//{*}rootfile').get('full-path')
            return ET.ElementTree(ET.fromstring(z.read(root)))
    return ET.parse(path)


def has_rehearsal(measure):
    return any(d.find('.//rehearsal') is not None for d in measure.findall('direction'))


def clear_layout(measure):
    for p in measure.findall('print'):
        for a in ('new-system', 'new-page'):
            p.attrib.pop(a, None)
        if not p.attrib and len(p) == 0:
            measure.remove(p)


def set_break(measure):
    p = measure.find('print')
    if p is None:
        p = ET.Element('print')
        measure.insert(0, p)
    p.set('new-system', 'yes')


def system_starts(first_part, per_line):
    """measure indexes (0-based) where a new line starts: every N bars, and at each rehearsal letter"""
    starts, count = [], 0
    for i, m in enumerate(first_part.findall('measure')):
        if i == 0:
            count = 1
            continue
        if has_rehearsal(m) or count >= per_line:
            starts.append(i)
            count = 1
        else:
            count += 1
    return starts


def is_empty(measure):
    """a bar with only rests and nothing written on it (these get grouped into one long rest in the parts)"""
    if any(d.find('.//rehearsal') is not None or d.find('.//words') is not None or d.find('.//metronome') is not None for d in measure.findall('direction')):
        return False
    if measure.find('harmony') is not None:
        return False
    notes = measure.findall('note')
    return bool(notes) and all(n.find('rest') is not None for n in notes)


def is_chart(part):
    """a harmony part (chords over slashes, like the band's base and lead sheets)"""
    ms = part.findall('measure')
    return bool(ms) and sum(1 for m in ms if m.find('harmony') is not None) >= 0.4 * len(ms)


def bar_cost(measure):
    """lead sheets as in the band's charts: 6 bars of slashes/light rhythm per line, 4 bars of written melody"""
    pitched = [n for n in measure.findall('note') if n.find('rest') is None and n.findtext('notehead') != 'slash' and n.find('chord') is None]
    return 1.0 if len(pitched) >= 6 else 4 / 6


def chart_starts(part):
    starts, used = [], 0.0
    for i, m in enumerate(part.findall('measure')):
        c = bar_cost(m)
        if i and used + c > 4.0 + 1e-6:
            starts.append(i); used = 0.0
        used += c
    return starts


def part_starts(part, per_line):
    """parts as in the tour: 4 'blocks' per line, a run of empty bars (one long rest) counts as one block"""
    ms = part.findall('measure')
    starts, blocks, i = [], 0, 0
    while i < len(ms):
        j = i
        if is_empty(ms[i]):
            while j + 1 < len(ms) and is_empty(ms[j + 1]) and not has_rehearsal(ms[j + 1]):
                j += 1
        if blocks >= per_line:
            starts.append(i)
            blocks = 0
        blocks += 1
        i = j + 1
    return starts


def strip_credits(root):
    for c in root.findall('credit'):
        root.remove(c)


def mscore(args, log):
    env = dict(os.environ, QT_QPA_PLATFORM='offscreen')
    r = subprocess.run([MSCORE] + args, capture_output=True, text=True, env=env, timeout=600)
    if r.returncode != 0:
        log.write(r.stderr[-3000:])
        raise RuntimeError(f'MuseScore falhou ({r.returncode}) em {args[-1]}')


def set_header(mscx_path, title, subtitle, composer, arranger, part_name=None):
    """write the standard header in the first frame of a MuseScore file"""
    tree = ET.parse(mscx_path)
    score = tree.getroot().find('Score')
    staff = score.find('Staff')
    vbox = staff.find('VBox')
    if vbox is None:
        vbox = ET.Element('VBox')
        ET.SubElement(vbox, 'height').text = '10'
        staff.insert(0, vbox)
    for t in vbox.findall('Text'):
        vbox.remove(t)

    def add(style, text):
        if not text:
            return
        t = ET.SubElement(vbox, 'Text')
        ET.SubElement(t, 'style').text = style
        ET.SubElement(t, 'text').text = text
    add('title', title)
    add('subtitle', subtitle)
    # as in the tour scores: band and arranger right-aligned, one under the other; part name top-left
    add('composer', '\n'.join(x for x in (composer, arranger) if x))
    add('instrument_excerpt', part_name or 'Score')
    # the tour scores: title words, no "Score" type text duplicated
    tree.write(mscx_path, encoding='UTF-8', xml_declaration=True)


def engrave(src, out_dir, title, subtitle, composer, arranger, style_dir, per_line, log=sys.stderr):
    os.makedirs(out_dir, exist_ok=True)
    tree = read_musicxml(src)
    root = tree.getroot()
    if root.tag != 'score-partwise':
        raise SystemExit('Use MusicXML "partwise" (o padrão de exportação do MuseScore, Finale, Sibelius e Dorico).')
    strip_credits(root)
    parts = root.findall('part')
    plist = root.find('part-list')
    names = {sp.get('id'): (sp.findtext('part-name') or sp.get('id')).strip() for sp in plist.findall('score-part')}
    for p in parts:
        for m in p.findall('measure'):
            clear_layout(m)
    starts = system_starts(parts[0], per_line)
    made = []
    with tempfile.TemporaryDirectory() as tmp:
        # ----- grade -----
        g = copy.deepcopy(tree)
        for p in g.getroot().findall('part'):
            ms = p.findall('measure')
            for i in starts:
                if i < len(ms):
                    set_break(ms[i])
        gx = os.path.join(tmp, 'grade.musicxml'); g.write(gx, encoding='UTF-8', xml_declaration=True)
        gm = os.path.join(tmp, 'grade.mscx')
        mscore(['-S', os.path.join(style_dir, 'grade.mss'), '-o', gm, gx], log)
        set_header(gm, title, subtitle, composer, arranger)
        mscore(['-o', os.path.join(out_dir, 'grade.pdf'), gm], log)
        made.append('grade.pdf')
        # ----- one part per instrument -----
        for p in parts:
            pid = p.get('id')
            t = copy.deepcopy(tree); r = t.getroot()
            pl = r.find('part-list')
            for sp in list(pl):
                if sp.tag == 'score-part' and sp.get('id') != pid:
                    pl.remove(sp)
                elif sp.tag == 'part-group':
                    pl.remove(sp)
            for q in list(r.findall('part')):
                if q.get('id') != pid:
                    r.remove(q)
            only = r.find('part')
            pms = only.findall('measure')
            for i in (chart_starts(only) if is_chart(only) else part_starts(only, per_line)):
                set_break(pms[i])
            slug = re.sub(r'[^a-z0-9]+', '-', names[pid].lower()).strip('-') or pid.lower()
            px = os.path.join(tmp, slug + '.musicxml'); t.write(px, encoding='UTF-8', xml_declaration=True)
            pm = os.path.join(tmp, slug + '.mscx')
            mscore(['-S', os.path.join(style_dir, 'parte.mss'), '-o', pm, px], log)
            set_header(pm, title, subtitle, composer, arranger, part_name=names[pid])
            mscore(['-o', os.path.join(out_dir, slug + '.pdf'), pm], log)
            made.append(slug + '.pdf')
    return made


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument('entrada'); a.add_argument('saida')
    a.add_argument('--titulo', required=True)
    a.add_argument('--subtitulo', default='Turnê 10 Anos')
    a.add_argument('--autor', default='PineappleStorm')
    a.add_argument('--arranjo', default='')
    a.add_argument('--estilo', default=DEFAULT_STYLE)
    a.add_argument('--compassos', type=int, default=4, help='compassos por linha na grade')
    o = a.parse_args()
    arr = ('Arr.: ' + o.arranjo) if o.arranjo and not o.arranjo.lower().startswith('arr') else o.arranjo
    made = engrave(o.entrada, o.saida, o.titulo, o.subtitulo, o.autor, arr, o.estilo, o.compassos)
    print('\n'.join(made))


if __name__ == '__main__':
    main()
