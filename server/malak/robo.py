"""salvetheapp robot: turns a song's score PDFs (or its original MusicXML) into player audio and a bar map.

Runs as a Cloud Run Job. Input: env JOB = "bands/{band}/jobs/{job}". The job doc says which song to process
(and optionally the tempo). Steps:
  1. read the score: MusicXML/MuseScore original if the song has one, else the PDFs through Audiveris (OMR);
  2. one audio track per instrument (MIDI -> FluidSynth), plus the mixes the player needs:
     "tudo", "so-<part>" and "sem-<part>";
  3. when each bar starts in the audio (player.measures) and the bars per page in each PDF (layout boxes);
  4. writes the files to Storage and the results to Firestore; the song is marked "aguardando conferência".
"""
import json, os, re, subprocess, sys, tempfile, time, traceback, uuid, glob, shutil, zipfile
from fractions import Fraction
import xml.etree.ElementTree as ET
import urllib.request, urllib.parse

import numpy as np
import soundfile as sf
from google.cloud import firestore, storage
import music21 as m21

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vetor  # exact notes from the music-font symbols of PDFs exported from notation programs
import layout2  # bar boxes from the PDF pages (same tool used for the tour scores)
import hornsampler as H  # real recorded horns (VSCO 2 CE, MTG Solo Sax), the engine of the tour audio

PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT', 'salvetheapp-3cceb')
BUCKET = os.environ.get('BUCKET', 'salvetheapp-3cceb.firebasestorage.app')
# the app's site: the tour songs' PDFs and audio are files of the site, saved on the song as paths like
# "scores/teu-popo/v20261125/grade.pdf" (the app opens them from its own address; the robot needs the full link)
SITE = os.environ.get('SITE', 'https://salvetheapp.web.app/')
# the fullest General MIDI bank available: 128 instruments + drum kits (MuseScore General, else FluidR3)
SF2 = os.environ.get('SF2') or next((p for p in ('/usr/share/sounds/sf2/MuseScore_General_Full.sf2', '/usr/share/sounds/sf2/MuseScore_General.sf2',
      '/usr/share/sounds/sf3/MuseScore_General.sf3', '/usr/share/sounds/sf3/MuseScore_General_Full.sf3', '/usr/share/sounds/sf2/FluidR3_GM.sf2') if os.path.exists(p)), '/usr/share/sounds/sf2/FluidR3_GM.sf2')
AUDIVERIS = os.environ.get('AUDIVERIS', 'audiveris')
RATE = 48000  # same rate as the horn sampler

db = firestore.Client(project=PROJECT)
gcs = storage.Client(project=PROJECT).bucket(BUCKET)


# ---------------- helpers ----------------
def enc(v):
    """Firestore can't hold arrays inside arrays: the app stores them as {__a: [...]}"""
    if isinstance(v, (list, tuple)):
        return [({'__a': enc(x)} if isinstance(x, (list, tuple)) else enc(x)) for x in v]
    if isinstance(v, dict):
        return {k: enc(x) for k, x in v.items()}
    return v


def slug(s):
    s = re.sub(r'[^a-z0-9]+', '-', s.lower().encode('ascii', 'ignore').decode()).strip('-')
    return s or 'parte'


def full_url(url):
    """a link the robot can open: full links stay as they are, the site's paths ("scores/...") get the site's address"""
    url = (url or '').strip()
    if re.match(r'^[a-z][a-z0-9+.-]*://', url, re.I):
        return url
    return SITE.rstrip('/') + '/' + urllib.parse.quote(url.lstrip('/'), safe='/%?=&')


def download(url, dest):
    with urllib.request.urlopen(full_url(url), timeout=120) as r, open(dest, 'wb') as f:
        shutil.copyfileobj(r, f)
    return dest


def upload(path, dest, ctype):
    """file -> Storage with a download token (the same kind of link the app makes)"""
    tok = str(uuid.uuid4())
    b = gcs.blob(dest)
    b.metadata = {'firebaseStorageDownloadTokens': tok}
    b.upload_from_filename(path, content_type=ctype)
    return f'https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o/{urllib.parse.quote(dest, safe="")}?alt=media&token={tok}'


class Job:
    def __init__(self, path):
        self.ref = db.document(path)
        self.data = self.ref.get().to_dict() or {}

    def step(self, msg, pct):
        print(f'[{pct:3d}%] {msg}', flush=True)
        self.ref.update({'status': 'rodando', 'msg': msg, 'progresso': pct, 'atualizado': int(time.time() * 1000)})


# ---------------- 1. read the score ----------------
# part name (Portuguese or English) -> General MIDI program (0-127); checked in order, most specific first
GM = [
    ('piano eletrico|electric piano|rhodes|wurli', 4), ('cravo|harpsichord', 6), ('celesta', 8), ('glockenspiel|glock', 9),
    ('vibrafone|vibraphone|vibes', 11), ('marimba', 12), ('xilofone|xylophone', 13), ('sinos|tubular|bells', 14),
    ('orgao|organ|hammond', 16), ('acordeon|acordeao|sanfona|accordion', 21), ('gaita|harmonica', 22), ('bandoneon', 23),
    ('violao de nylon|nylon|violao|classical guitar|acoustic guitar', 24), ('aco|steel', 25), ('guitarra limpa|clean', 27),
    ('guitarra|electric guitar|guitar', 29), ('cavaquinho|cavaco|bandolim|mandolin|banjo|ukulele', 105),
    ('baixo acustico|acoustic bass|contrabaixo|double bass|upright', 32), ('fretless', 35), ('baixo|bass', 33),
    ('violino|violin', 40), ('viola', 41), ('violoncelo|cello', 42), ('cordas|strings', 48), ('harpa|harp', 46),
    ('tímpano|timpano|timpani', 47), ('coro|choir|coral', 52), ('voz|vocal|voice|canto|soprano voice|melodia', 53),
    ('trompete|trumpet|flugel|cornet|tpt', 56), ('trombone|tbn', 57), ('tuba|bombardino|euphonium', 58), ('surdina|mute', 59),
    ('trompa|french horn|horn in f|horn', 60), ('metais|brass', 61), ('sax soprano|soprano sax', 64), ('sax alto|alto sax|alto|a\\. ?sx', 65),
    ('sax tenor|tenor sax|tenor|t\\. ?sx', 66), ('sax baritono|baritone sax|bari', 67), ('sax', 65), ('oboe|oboé', 68),
    ('corne ingles|english horn', 69), ('fagote|bassoon', 70), ('clarone|bass clarinet|clarinete|clarinet|requinta', 71),
    ('flautim|piccolo', 72), ('flauta doce|recorder', 74), ('pifano|pife|fife', 72), ('flauta|flute', 73), ('pan flute|flauta pan', 75),
    ('ocarina', 79), ('sintetizador|synth lead|lead', 80), ('pad', 88), ('sitar', 104), ('kalimba', 108), ('steel drum|steel pan', 114),
    ('base', 0), ('teclado|keyboard|keys|piano', 0),
]
DRUMS = 'bateria|drum|percuss|pandeiro|caixa|surdo|tamborim|agogo|agogô|cuica|cuíca|conga|bongo|cajon|cajón|ganza|ganzá|shaker|triangulo|triângulo|chocalho|timbal|repique|zabumba|kit'


BASE_NAME = r'base|cifra|chord|harmonia|teclado|piano|guitarra|viol'


def chart_name(name):
    """a chord-chart part (slashes + chord symbols) is the band's base: never a horn, even when the PDF gave it
    another staff's name (Teu Popô: the base staff has no name on the first system, so it got 'B♭ Tpt.')"""
    return name if re.search(BASE_NAME, name or '', re.I) else 'Base'


def is_comping(part):
    """the base the robot makes from chord symbols: chords of 3+ notes on most attacks (horns play single notes)"""
    ns = [n for n in part.recurse().notes if not isinstance(n, m21.harmony.ChordSymbol)]
    if len(ns) < 8:
        return False
    return sum(1 for n in ns if n.isChord and len(n.pitches) >= 3) >= 0.6 * len(ns)


def repeats_instrument(nm, names):
    """'B♭ Tpt.' after 'Trumpet in B♭': the second system's short names began, so the first system is over"""
    if '.' not in nm or not names:
        return False
    try:
        mine = program_for(None, nm)
    except Exception:
        return False
    if mine[1] or mine[0] == 0:
        return False
    for old in names:
        try:
            if program_for(None, old) == mine:
                return True
        except Exception:
            pass
    return False


def program_for(part, name):
    """(GM program, is drums): the part name first (the PDF reader tags every staff as 'Voice'), then the file's instrument"""
    n = (name or '').lower()
    if re.search(DRUMS, n):
        return 0, True
    plain = __import__('unicodedata').normalize('NFD', n).encode('ascii', 'ignore').decode()
    for pat, prog in GM:
        if re.search(pat, plain) or re.search(pat, n):
            return prog, False
    try:
        inst = m21.instrument.fromString(name)
        if inst.midiProgram is not None and not isinstance(inst, m21.instrument.Vocalist):
            return int(inst.midiProgram), isinstance(inst, m21.instrument.UnpitchedPercussion)
    except Exception:
        pass
    try:
        inst = part.getInstrument(returnDefault=False)
        if inst is not None and inst.midiProgram is not None and not re.search('voice|voz', (inst.instrumentName or '') + (part.partName or ''), re.I):
            if isinstance(inst, m21.instrument.UnpitchedPercussion):
                return 0, True
            return int(inst.midiProgram), False
    except Exception:
        pass
    return 0, False


def omr(pdf, out_dir, progress=None):
    """PDF -> MusicXML with Audiveris (headless)"""
    os.makedirs(out_dir, exist_ok=True)
    # text reading (part names, tempo marks, lyrics): Portuguese, English, Italian (tempo words) and German
    tess = next((d for d in glob.glob('/usr/share/tesseract-ocr/*/tessdata') if os.path.isdir(d)), None)
    env = dict(os.environ, TESSDATA_PREFIX=tess) if tess else os.environ
    # no text reading inside Audiveris: it splits a part in pieces when the (abbreviated) names change between pages.
    # Names, tempo and chord symbols come from the PDF's own text layer instead (pdf_text).
    cmd = [AUDIVERIS, '-batch', '-export', '-output', out_dir, '--', pdf]
    if shutil.which('xvfb-run'):
        cmd = ['xvfb-run', '-a'] + cmd  # some of its libraries want a display even in batch mode
    try:  # pages, to show progress while the reader goes through them
        import pdfplumber
        with pdfplumber.open(pdf) as d:
            pages = len(d.pages)
    except Exception:
        pages = 0
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
    tail, seen, t0 = [], set(), time.time()
    for line in proc.stdout:
        tail = (tail + [line])[-80:]
        m = re.search(r'\[[^\]#]*#(\d+)\]', line)
        if m and progress and pages:
            k = int(m.group(1))
            if k not in seen:
                seen.add(k)
                progress(k, pages)
        if time.time() - t0 > 2400:
            proc.kill(); break
    proc.wait()
    print('audiveris saída:', proc.returncode, ''.join(tail)[-4000:], flush=True)
    found = sorted(glob.glob(os.path.join(out_dir, '**', '*.mxl'), recursive=True)) + sorted(glob.glob(os.path.join(out_dir, '**', '*.musicxml'), recursive=True))
    if not found:
        raise RuntimeError('Não consegui ler as notas deste PDF. Ele é exportado de um programa de partitura (não foto/scan)?')
    return found  # one file per "movement"; usually one


def _systems(part):
    """measures of a part grouped by staff line (system), as read"""
    out = []
    for m in part.iter('measure'):
        pr = m.find('print')
        if not out or (pr is not None and (pr.get('new-system') == 'yes' or pr.get('new-page') == 'yes')):
            out.append([])
        out[-1].append(m)
    return out


def fill_missing_bars(root, boxes):
    """The reader sometimes skips a bar inside a staff line. The PDF bar map (layout2) has every bar: where a line has
    fewer bars than the PDF, find the missing one by its horizontal place and insert an empty bar there, in every part,
    so everything after it (repeats, voltas, chords) stays on the right bar."""
    import collections, copy
    lines = collections.OrderedDict()
    for b in boxes:
        lines.setdefault((b[2], round(b[4], 2)), []).append(b)
    pdf_lines = list(lines.values())
    parts = list(root.iter('part'))
    if not parts:
        return 0
    sys0 = _systems(parts[0])
    if len(sys0) != len(pdf_lines):
        print('linhas diferentes entre PDF e leitura:', len(pdf_lines), len(sys0), '- não preenchi compassos', flush=True)
        return 0
    inserts = []  # (line index, position inside the line)
    for li, (pb, om) in enumerate(zip(pdf_lines, sys0)):
        if len(pb) <= len(om):
            continue
        x0, x1 = pb[0][3], pb[-1][5]
        centers = [((b[3] + b[5]) / 2 - x0) / max(1e-6, x1 - x0) for b in pb]
        w = [float(m.get('width') or 1) for m in om]
        edges = [sum(w[:i]) / sum(w) for i in range(len(w) + 1)]
        owner = [max(0, min(len(om) - 1, next((i for i in range(len(om)) if edges[i] <= c < edges[i + 1]), len(om) - 1))) for c in centers]
        seen = set(); missing = []
        for k, o in enumerate(owner):
            if o in seen:
                missing.append(k)
            seen.add(o)
        while len(missing) < len(pb) - len(om):
            missing.append(len(pb) - 1 - len(missing))
        inserts += [(li, k) for k in missing[:len(pb) - len(om)]]
    for part in parts:
        systems = _systems(part)
        if len(systems) != len(pdf_lines):
            continue
        for li, k in sorted(inserts, reverse=True):
            line = systems[li]
            ref = line[min(k, len(line)) - 1] if k > 0 else line[0]
            new = ET.Element('measure', {'number': '0', 'implicit': 'no'})
            note = ET.SubElement(new, 'note'); r = ET.SubElement(note, 'rest', {'measure': 'yes'})
            ET.SubElement(note, 'duration').text = '1'
            ET.SubElement(note, 'voice').text = '1'
            kids = list(part)
            pos = kids.index(ref) + (1 if k > 0 else 0)
            if k == 0:  # keep the line-break marker on the first bar of the line
                pr = ref.find('print')
                if pr is not None:
                    ref.remove(pr); new.insert(0, pr)
            part.insert(pos, new)
        for i, m in enumerate(part.iter('measure'), 1):
            m.set('number', str(i))
    if inserts:
        print('compassos que a leitura pulou e foram preenchidos:', len(inserts), flush=True)
    return len(inserts)


def fix_endings(root):
    """Voltas as read: an ending 2 that the reader cut in two (\"2 start+discontinue\" then a stray \"1 start\" on the next
    bar) becomes one ending 2 over both bars."""
    fixed = 0
    for part in root.iter('part'):
        ms = list(part.iter('measure'))
        for i in range(len(ms) - 1):
            e1 = [e for b in ms[i].findall('barline') for e in b.findall('ending')]
            e2 = [e for b in ms[i + 1].findall('barline') for e in b.findall('ending')]
            starts1 = [e for e in e1 if e.get('type') == 'start']
            ends1 = [e for e in e1 if e.get('type') in ('stop', 'discontinue')]
            if not (starts1 and ends1 and starts1[0].get('number') == ends1[0].get('number') and starts1[0].get('number') != '1'):
                continue
            if not e2 or any(b.find('repeat') is not None and b.find('repeat').get('direction') == 'forward' for b in ms[i + 1].findall('barline')):
                continue
            num = starts1[0].get('number')
            for b in ms[i].findall('barline'):  # the ending 2 starts here and does not end here
                for e in list(b.findall('ending')):
                    if e.get('type') in ('stop', 'discontinue'):
                        b.remove(e)
            for b in ms[i + 1].findall('barline'):  # ...and ends on the next bar
                for e in list(b.findall('ending')):
                    b.remove(e)
            bl = next((b for b in ms[i + 1].findall('barline') if b.get('location') == 'right'), None)
            if bl is None:
                bl = ET.SubElement(ms[i + 1], 'barline', {'location': 'right'})
            ET.SubElement(bl, 'ending', {'number': num, 'type': 'discontinue'})
            fixed += 1
    return fixed


def repeat_plan(root):
    """The order in which the bars are played (repeats, 1st/2nd endings), from the first part. Returns bar indexes."""
    part = next(iter(root.iter('part')), None)
    if part is None:
        return None
    meas = []
    open_end = None
    for m in part.iter('measure'):
        info = {'start': False, 'end': 0, 'volta': None}
        for b in m.findall('barline'):
            r = b.find('repeat')
            if r is not None and r.get('direction') == 'forward':
                info['start'] = True
            if r is not None and r.get('direction') == 'backward':
                info['end'] = int(r.get('times') or 2)
            for e in b.findall('ending'):
                nums = [int(x) for x in re.findall(r'\d+', e.get('number') or '1')] or [1]
                if e.get('type') == 'start':
                    open_end = (nums, len(meas))
                if e.get('type') in ('stop', 'discontinue') and open_end:
                    for j in range(open_end[1], len(meas) + 1):
                        if j < len(meas):
                            meas[j]['volta'] = set(open_end[0])
                    info['volta'] = set(open_end[0]); open_end = None
        if open_end and info['volta'] is None and open_end[1] == len(meas):
            info['volta'] = set(open_end[0])
        meas.append(info)
    order, i, start, pas, jumped, guard = [], 0, 0, 1, False, 0
    while i < len(meas) and guard < 20000:
        guard += 1
        m = meas[i]
        if m['start'] and not jumped:
            start, pas = i, 1
        jumped = False
        if m['volta'] and pas not in m['volta']:
            i += 1; continue
        order.append(i)
        if m['end']:
            if pas < m['end']:
                pas += 1; i = start; jumped = True; continue
            pas, start = 1, i + 1
        i += 1
    return order


LAST_PLAN = None


def sanitize_musicxml(path, boxes=None, voltas=None, pdf=None):
    """Fix what the reader sometimes writes and music21 can't open: <divisions>0</divisions> (whole-bar rests),
    and whole-bar rests whose duration doesn't fill the bar. Returns the path of a fixed .musicxml."""
    import zipfile
    if path.lower().endswith('.mxl'):
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if n.lower().endswith('.xml') and not n.startswith('META-INF')]
            raw = z.read(names[0])
    else:
        raw = open(path, 'rb').read()
    root = ET.fromstring(raw)
    fixed = 0
    if boxes:
        fixed += fill_missing_bars(root, boxes)
    fixed += fix_endings(root)
    global LAST_PLAN
    LAST_PLAN = repeat_plan(root)
    for part in root.iter('part'):
        div, beats, btype = None, 4, 4
        for meas in part.iter('measure'):
            for at in meas.iter('attributes'):
                d = at.find('divisions')
                if d is not None:
                    v = int(float(d.text or 0))
                    if v <= 0:
                        d.text = str(div or 1); fixed += 1
                    div = int(d.text)
                t = at.find('time')
                if t is not None and t.findtext('beats') and t.findtext('beat-type'):
                    try:
                        beats, btype = int(t.findtext('beats').split('+')[0]), int(t.findtext('beat-type'))
                    except ValueError:
                        pass
            if div is None:
                div = 1
            bar = int(round(beats * 4 / btype * div))
            for n in meas.iter('note'):
                r = n.find('rest')
                du = n.find('duration')
                if r is not None and r.get('measure') == 'yes' and du is not None and int(float(du.text or 0)) != bar:
                    du.text = str(max(1, bar)); fixed += 1
                if du is not None and int(float(du.text or 0)) <= 0 and n.find('grace') is None:
                    du.text = '1'; fixed += 1
    if pdf and boxes:  # PDFs exported from notation programs: read the notes from the vector symbols, bar by bar
        try:
            nst = len(list(root.iter('part')))
            ev = vetor.read(pdf, boxes, nst)
            done, kept = vetor.patch_musicxml(root, ev, nst)
            print(f'leitura vetorial do PDF: {done} compassos lidos dos símbolos, {kept} ficaram da leitura por imagem', flush=True)
        except Exception as e:
            print('leitura vetorial do PDF não deu:', e, flush=True)
    out = os.path.splitext(path)[0] + '.limpo.musicxml'
    ET.ElementTree(root).write(out, encoding='UTF-8', xml_declaration=True)
    if fixed:
        print('MusicXML consertado em', fixed, 'pontos', flush=True)
    return out


def load_score(files, boxes=None, pdf=None):
    files = [sanitize_musicxml(f, boxes if len(files) == 1 else None, pdf=pdf if len(files) == 1 else None) if f.lower().endswith(('.mxl', '.musicxml', '.xml')) else f for f in files]
    s = None
    for f in files:
        x = m21.converter.parse(f)
        if s is None:
            s = x
        else:  # several movements: append measures part by part
            for pa, pb in zip(s.parts, x.parts):
                for m in pb.getElementsByClass('Measure'):
                    pa.append(m)
    return s



# ---------------- text layer of PDFs exported from notation programs ----------------
CHORD = re.compile(r'^[A-G](?:[#b♯♭])?(?:maj|ma|min|mi|m|M|dim|aug|sus|add|°|ø|\+|-|\d|\(|\)|/[A-G][#b♯♭]?|[#b♯♭]|alt|Δ)*$')


# chord symbols written by notation programs draw ♭ ♯ ø Δ with a music text font (SMuFL "csym" glyphs);
# read as text they are private-use characters: B♭m7 would become "B" + "m7"
CSYM = {0xED60: 'b', 0xED61: '', 0xED62: '#', 0xED63: '##', 0xED64: 'bb', 0xE260: 'b', 0xE261: '', 0xE262: '#',
        0xE870: 'dim', 0xE871: 'm7b5', 0xE872: '+', 0xE873: 'maj', 0xE874: 'm', 0xE875: '', 0xE876: '', 0x266D: 'b', 0x266F: '#',
        0xF023: '#', 0xF062: 'b', 0xF06E: ''}  # last three: legacy music fonts (# b n at U+F000 + ASCII)


def chord_words(page):
    """words of the small text on a page (chord symbols), with music-font accidentals turned into b / #"""
    # music-font glyphs have very different boxes from letters: compare baselines, not tops
    bl = lambda c: float(page.height) - float(c['matrix'][5]) if c.get('matrix') else float(c['bottom'])
    chars = sorted((c for c in page.chars if float(c.get('size') or 0) <= 16), key=bl)
    lines = []  # glyphs of other fonts sit a hair higher or lower: group by closeness, not by rounding
    for c in chars:
        if lines and abs(bl(c) - lines[-1][0]) < 0.45 * float(c.get('size') or 10):
            lines[-1][1].append(c)
        else:
            lines.append([bl(c), [c]])
    chars = [c for _, cs in lines for c in sorted(cs, key=lambda c: float(c['x0']))]
    words, cur = [], None
    for c in chars:
        ch = c['text']; o = ord(ch[0]) if ch else 0
        if o in CSYM:
            ch = CSYM[o]
        elif 0xE000 <= o <= 0xF8FF or not ch.strip():
            if cur: words.append(cur); cur = None
            continue
        size = float(c.get('size') or 10)
        if cur and abs(bl(c) - cur['bl']) < 0.5 * size and -0.25 * size < float(c['x0']) - cur['x1'] < 0.3 * size:
            cur['text'] += ch; cur['x1'] = float(c['x1']); cur['bottom'] = max(cur['bottom'], float(c['bottom']))
        else:
            if cur: words.append(cur)
            cur = {'text': ch, 'x0': float(c['x0']), 'x1': float(c['x1']), 'top': float(c['top']), 'bottom': float(c['bottom']), 'size': size, 'bl': bl(c)}
    if cur: words.append(cur)
    # rehearsal letters (A, B, "E"…) are drawn inside a small box: they are not chords
    boxes = [(float(r['x0']), float(r['top']), float(r['x1']), float(r['bottom'])) for r in list(page.rects) + list(page.curves)
             if 6 < float(r['x1']) - float(r['x0']) < 60 and 6 < float(r['bottom']) - float(r['top']) < 40]
    boxed = lambda w: any(x0 - 2 <= w['x0'] and w['x1'] <= x1 + 2 and y0 - 2 <= w['top'] and w['bottom'] <= y1 + 2 for x0, y0, x1, y1 in boxes)
    # a capital letter that starts a lyric cue ("E nessa noite...") is a word of the sentence, not a chord
    def in_text(i):
        w = words[i]; nx = words[i + 1] if i + 1 < len(words) else None
        return bool(nx and abs(nx['bl'] - w['bl']) < 0.5 * w['size'] and 0 <= nx['x0'] - w['x1'] < 0.6 * w['size']
                    and nx['text'][:1].islower())
    return [w for i, w in enumerate(words) if w['text'] and not boxed(w) and not in_text(i)]


def pdf_text(pdf):
    """tempo (♩ = N), part names in the left margin of the first page, and chord symbols with their place"""
    import pdfplumber
    info = {'bpm': None, 'names': [], 'chords': []}
    try:
        with pdfplumber.open(pdf) as doc:
            for pi, page in enumerate(doc.pages):
                W, H = float(page.width), float(page.height)
                words = page.extract_words(keep_blank_chars=False, use_text_flow=False, extra_attrs=['size'])
                if pi == 0:
                    for i, w in enumerate(words):
                        if w['text'] == '=' and i + 1 < len(words) and re.fullmatch(r'\d{2,3}', words[i + 1]['text']):
                            info['bpm'] = int(words[i + 1]['text']); break
                        m = re.fullmatch(r'=\s*(\d{2,3})', w['text'])
                        if m: info['bpm'] = int(m.group(1)); break
                    pua = re.compile('[\ue000-\uf8ff]')
                    lines = {}
                    for w in words:
                        t = pua.sub('', w['text']).strip()
                        if t and w['x0'] < 0.2 * W and w['top'] > 0.12 * H and re.search('[A-Za-zÀ-ú]', t):
                            lines.setdefault(round(w['top'] / 4), []).append({**w, 'text': t})
                    names = []
                    for _, ws in sorted(lines.items()):
                        if all(CHORD.match(x['text'].replace('♭', 'b').replace('♯', '#')) for x in ws):
                            continue  # a line with only chord-like words is not a name
                        nm = ' '.join(x['text'] for x in sorted(ws, key=lambda x: x['x0']))
                        if nm in names or repeats_instrument(nm, names):
                            break  # the names start repeating (abbreviated systems): first system done
                        names.append(nm)
                    info['names'] = names
                for w in chord_words(page):
                    t = w['text']
                    if CHORD.match(t) and len(t) <= 12 and w['x0'] > 0.12 * W:
                        info['chords'].append({'page': pi + 1, 'x': w['x0'] / W, 'y': w['bottom'] / H, 't': t, 'size': float(w.get('size') or 0)})
        # rehearsal letters (A, B...) look like chords: keep the font size most chord symbols use
        if info['chords']:
            sizes = sorted(c['size'] for c in info['chords'])
            med = sizes[len(sizes) // 2]
            info['chords'] = [c for c in info['chords'] if not med or abs(c['size'] - med) <= 0.15 * med]
    except Exception as e:
        print('texto do PDF:', e)
    return info


def chords_to_bars(chords, boxes):
    """chord symbols -> {bar: [(fraction of the bar, symbol)]} using the bar boxes of that PDF"""
    out = {}
    for c in chords:
        cand = [b for b in boxes if b[2] == c['page'] and b[3] - 0.01 <= c['x'] <= b[5] + 0.01 and b[4] - 0.08 <= c['y'] <= b[6] + 0.01]
        if not cand:
            continue
        # the system whose height holds the chord (chords sit low, above the base staff), then the bar whose span really holds the chord's x (the slack above is only for edges)
        b = min(cand, key=lambda b: (round(max(0.0, b[4] - c['y'], c['y'] - b[6]), 3), max(0.0, b[3] - c['x'], c['x'] - b[5])))
        if b[0] != b[1]:
            continue  # a multi-bar rest has no chords
        frac = min(0.99, max(0.0, (c['x'] - b[3]) / max(1e-6, b[5] - b[3])))
        if frac > 0.85:  # the symbol starts just before the barline: it belongs to the first beat of the next bar
            nxt = [n for n in boxes if n[2] == b[2] and abs(n[4] - b[4]) < 1e-3 and abs(n[3] - b[5]) < 0.01 and n[0] == n[1]]
            if not nxt:
                continue
            b, frac = nxt[0], 0.0
        out.setdefault(int(b[0]), []).append((frac, c['t']))
    res = {}
    for k, v in out.items():
        v = sorted(v)
        # first chord starts the bar (the bar box includes clef/key at line starts); the others snap to half bars
        snapped = [(0.0, v[0][1])] + [(max(0.5, round(f * 2) / 2) if f < 0.75 else 0.5, t) for f, t in v[1:]]
        seen, clean = set(), []
        for f, t in snapped:
            if f not in seen:
                seen.add(f); clean.append((f, t))
        res[k] = clean
    return res


QUAL_V = {'m7': [0, 3, 7, 10], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7b5': [0, 3, 6, 10], 'dim': [0, 3, 6, 9], 'm': [0, 3, 7], '': [0, 4, 7],
          '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], 'sus4': [0, 5, 7], '7sus4': [0, 5, 7, 10], 'aug': [0, 4, 8], 'add9': [0, 4, 7, 14], '9': [0, 4, 7, 10, 14], 'm9': [0, 3, 7, 10, 14]}


def m21_chord_name(sym):
    """chord name as printed (Bbm7, Ebmaj7/Bb, Gm7b5) -> music21's spelling (flat = '-' on the root and the bass)"""
    m = re.fullmatch(r'([A-G])([b#]?)(.*?)(?:/([A-G])([b#]?))?', sym.strip())
    if not m:
        return sym
    rest = re.sub(r'(m?(?:maj)?)7\((9|11|13)\)$', r'\1\2', m.group(3))  # 7(13) is a 13 chord, m7(9) is m9
    root = m.group(1) + m.group(2).replace('b', '-'); rest = re.sub(r'[()]', '', rest).replace('º', 'dim').replace('°', 'dim')
    bass = ('/' + m.group(4) + m.group(5).replace('b', '-')) if m.group(4) else ''
    return root + rest + bass


def voicing(sym):
    """the tour charts' voicing: chord in the middle register (around G3-D5), bass note in the low octave"""
    def parse(name):
        cs = m21.harmony.ChordSymbol(name)
        root = cs.root().pitchClass
        bass = cs.bass().pitchClass if cs.bass() is not None else root
        return root, bass, sorted({(p.pitchClass - root) % 12 for p in cs.pitches})
    name = m21_chord_name(sym)
    try:
        root, bass, iv = parse(name)
    except Exception:  # tensions music21 doesn't know (Am7(11)…): play the chord without them
        try:
            root, bass, iv = parse(m21_chord_name(re.sub(r'\(.*?\)', '', sym)))
        except Exception:
            return None, None
    if len(iv) > 4:  # extended chord, four notes: 3rd and 7th first, then the colour notes, then the 5th, root last
        colour = {9: 2.0, 1: 2.1, 3: 2.1, 8: 2.1, 2: 2.2, 6: 2.3, 5: 2.4 if 3 in iv else 3.5}  # 13 first; the 11 clashes with a major 3rd
        rank = lambda x: (0 if x in (3, 4) else 1 if x in (10, 11) else 3 if x == 7 else 4 if x == 0 else colour.get(x, 2.5))
        if 4 in iv and 3 in iv:  # #9 next to the major 3rd: the 3 is the 3rd
            rank = (lambda r: lambda x: 2 if x == 3 else r(x))(rank)
        iv = sorted(sorted(iv, key=rank)[:4])
    base = 53 + ((root - 53) % 12)
    tones = sorted(base + x for x in iv)
    while tones[-1] > 76:
        tones = sorted(tones[:-1] + [tones[-1] - 12])
    return tones[:4], 36 + ((bass - 36) % 12)


def chords_from_part(part):
    """chord symbols written in a part -> {bar: [(fraction of the bar, symbol)]} (same shape as chords_to_bars)"""
    out = {}
    for m in part.getElementsByClass('Measure'):
        bl = float(m.barDuration.quarterLength) if m.barDuration else 4.0
        for cs in m.getElementsByClass(m21.harmony.ChordSymbol):
            fig = (cs.figure or '').replace('-', 'b')
            kt = getattr(cs, 'chordKindStr', '') or ''  # the text as written ("7(#9)", "m7b5") beats music21's rebuilt name
            if fig and kt and cs.root() is not None and voicing(cs.root().name.replace('-', 'b') + kt)[0]:
                fig = cs.root().name.replace('-', 'b') + kt + ('/' + cs.bass().name.replace('-', 'b') if cs.bass() is not None and cs.bass().name != cs.root().name else '')
            if fig:
                out.setdefault(int(m.number or 0), []).append((round(float(cs.offset) / bl, 3), fig))
    return {k: sorted(v) for k, v in out.items()}


def chart_part(score, bar_chords, name='Base'):
    """the chart part as a musician reads it: chord symbols over slashes, one slash per beat"""
    ref = score.parts[0].getElementsByClass('Measure')
    part = m21.stream.Part(); part.partName = name
    inst = m21.instrument.Instrument(); inst.partName = name; inst.instrumentName = name; part.insert(0, inst)
    part.insert(0, m21.clef.TrebleClef())
    last = None
    for m in ref:
        nm = m21.stream.Measure(number=m.number)
        bar_len = float(m.barDuration.quarterLength) if m.barDuration else 4.0
        changes = [(round(f * bar_len * 2) / 2, t) for f, t in bar_chords.get(int(m.number or 0), [])]
        for o, sym in changes:
            try:
                cs = m21.harmony.ChordSymbol(m21_chord_name(sym))
                mk = re.fullmatch(r'[A-G][b#]?(.*?)(?:/[A-G][b#]?)?', sym.strip())
                if mk:  # keep the chord as the arranger wrote it ("7(#9)", "m7b5") on the page and for the app
                    cs.chordKindStr = mk.group(1)
                cs.writeAsChord = False; cs.quarterLength = 0; nm.insert(o, cs)
            except Exception:
                pass
        if changes or last:
            beat, step = 0.0, (1.5 if bar_len in (3.0, 6.0) and m.timeSignature and m.timeSignature.denominator == 8 else 1.0)
            while beat < bar_len - 1e-6:
                n = m21.note.Note('B4', quarterLength=min(step, bar_len - beat)); n.notehead = 'slash'; n.stemDirection = 'noStem'
                nm.insert(beat, n); beat += step
            last = changes[-1][1] if changes else last
        else:
            nm.insert(0, m21.note.Rest(quarterLength=bar_len))
        part.append(nm)
    return part


def partitura_master(score, names, chart_parts, title, bpm=None):
    """the editable score: the parts as read (written pitch, transpositions kept), the chart part as chord symbols over
    slashes, proper names and short names, title and tempo"""
    import copy
    out = m21.stream.Score()
    out.metadata = m21.metadata.Metadata(title=title); out.metadata.composer = ''
    SHORT = [(r'trompete|trumpet', 'Tpt.'), (r'sax\w*\s*tenor|tenor', 'Sax T.'), (r'sax\w*\s*alto|alto', 'Sax A.'),
             (r'bar[ií]tono', 'Sax Bar.'), (r'trombone', 'Tbn.'), (r'trompa|horn', 'Tpa.'), (r'flauta|flute', 'Fl.'),
             (r'clarinete', 'Cl.'), (r'base|cifra', 'Base'), (r'baixo|bass', 'Bx.'), (r'piano|teclado', 'Pno.'), (r'guitarra|viol[aã]o', 'Gt.')]
    for i, (pt, nm) in enumerate(zip(score.parts, names)):
        p = copy.deepcopy(chart_parts[i]) if i in chart_parts else copy.deepcopy(pt)
        p.partName = nm
        p.partAbbreviation = next((ab for rx, ab in SHORT if re.search(rx, nm, re.I)), nm[:6])
        ins = p.getInstrument(returnDefault=False)
        if ins is not None:
            ins.partName = nm; ins.partAbbreviation = p.partAbbreviation; ins.instrumentName = nm
        if i == 0 and bpm:
            ms = p.getElementsByClass('Measure')
            if len(ms) and not list(ms[0].getElementsByClass(m21.tempo.MetronomeMark)):
                ms[0].insert(0, m21.tempo.MetronomeMark(number=round(float(bpm))))
        out.insert(0, p)
    return out


def comping_part(score, bar_chords, name='Base'):
    """piano + bass from chord symbols, like the tour's first version: the chord held in the middle register from each
    chord change, the bass root (or slash bass) held in the low octave."""
    ref = score.parts[0].getElementsByClass('Measure')
    part = m21.stream.Part(); part.partName = name
    part.insert(0, m21.instrument.Piano())
    last = None
    for m in ref:
        nm = m21.stream.Measure(number=m.number)
        bar_len = float(m.barDuration.quarterLength) if m.barDuration else 4.0
        changes = [(round(f * bar_len * 2) / 2, t) for f, t in bar_chords.get(int(m.number or 0), [])]
        if not changes and last:
            changes = [(0.0, last)]
        if not changes:
            nm.append(m21.note.Rest(quarterLength=bar_len)); part.append(nm); continue
        if changes[0][0] > 0 and last:
            changes.insert(0, (0.0, last))
        changes[0] = (0.0, changes[0][1])
        # a soft guide, not a groove: the chord held from each change (re-struck on beat 1), bass root held under it
        starts = sorted({0.0} | {o for o, _ in changes if o < bar_len})
        for k, o in enumerate(starts):
            end = starts[k + 1] if k + 1 < len(starts) else bar_len
            sym = [t for oo, t in changes if oo <= o + 1e-6][-1]
            tones, bass = voicing(sym)
            if tones:
                # one chord with the bass inside: a chord and a note at the same offset are written one after the other in
                # MusicXML (the bar doubles when the score is read back); render_part sends the low notes to the bass
                ch = m21.chord.Chord([bass] + tones, quarterLength=end - o); ch.volume.velocity = 64
                nm.insert(o, ch)
            last = sym
        part.append(nm)
    return part


# transposing instruments: (words in the part name, interval from written to sounding)
TRANSP = [
    (r'sax\w*\s*(tenor)|tenor\s*sax|sax\.?\s*t\b', '-M9'), (r'sax\w*\s*(bar[ií]tono|baritone)|bari\s*sax', '-M13'),
    (r'sax\w*\s*alto|alto\s*sax|sax\.?\s*a\b', '-M6'), (r'sax\w*\s*soprano|soprano\s*sax', '-M2'),
    (r'clarone|bass\s*clarinet', '-M9'), (r'(clarinete|clarineta|clarinet|requinta).*(e\s*b|mi\s*b|e♭)', 'm3'),
    (r'(trompete|trumpet|cornet|flugel|clarinete|clarineta|clarinet|tpt)', '-M2'),
    (r'(trompa|french horn|horn|tpa)', '-P5'),
]


def set_transposition(part, name):
    """A part read from a PDF comes at written pitch: give it the instrument's transposition, so it sounds right."""
    n = (name or '').lower()
    if re.search(r'\b(em|in)\s*(d[oó]|c)\b', n):
        return None  # 'Trompete em Dó' etc.: concert pitch
    for pat, iv in TRANSP:
        if re.search(pat, n):
            inst = part.getInstrument(returnDefault=True)
            inst.transposition = m21.interval.Interval(iv)
            part.atSoundingPitch = False
            return iv
    return None


def unfold(score, plan):
    """Write the repeats out: bars in playing order (our plan; music21's expandRepeats as a fallback)."""
    import copy
    n = len(score.parts[0].getElementsByClass('Measure')) if len(score.parts) else 0
    if plan and len(plan) > n and max(plan) < n:
        out = m21.stream.Score()
        for p in score.parts:
            ms = list(p.getElementsByClass('Measure'))
            np_ = m21.stream.Part(); np_.partName = p.partName
            inst = p.getInstrument(returnDefault=False)
            if inst is not None:
                np_.insert(0, copy.deepcopy(inst))
            np_.atSoundingPitch = p.atSoundingPitch
            off = 0.0
            for i in plan:
                if i < len(ms):
                    m = copy.deepcopy(ms[i])
                    for r in list(m.getElementsByClass(m21.bar.Repeat)):
                        m.remove(r)
                    np_.insert(off, m); off += float(ms[i].barDuration.quarterLength if ms[i].barDuration else ms[i].duration.quarterLength)
            out.insert(0, np_)
        for mm in score.recurse().getElementsByClass('MetronomeMark'):
            pass
        print('repetições escritas:', n, '->', len(plan), 'compassos', flush=True)
        return out
    try:
        return score.expandRepeats()
    except Exception:
        return score


def align_bars(score):
    """Every part's bar N starts at the same moment. A bar read short or long (a dropped 16th rest, a lost tuplet)
    would otherwise push every later note of that part early or late, for the rest of the song. Each bar's length is
    taken from the time signature when some part agrees with it, else from what most parts read (the longest on a
    tie); a pickup (first bar short in the parts) keeps its reading. Returns the bars that were fixed, per part."""
    from collections import Counter
    parts = list(score.parts)
    bars = [list(p.getElementsByClass('Measure')) for p in parts]
    n = max((len(b) for b in bars), default=0)
    ref = []
    for i in range(n):
        lens = [round(float(b[i].duration.quarterLength), 4) for b in bars if i < len(b)]
        sig = next((round(float(b[i].barDuration.quarterLength), 4) for b in bars if i < len(b) and b[i].barDuration), None)
        if sig is not None and sig in lens and not (i == 0 and Counter(lens).most_common(1)[0][0] < sig):
            ref.append(sig)
        else:
            c = Counter(lens).most_common()
            top = c[0][1]
            ref.append(max(v for v, k in c if k == top))
    starts = [0.0]
    for r in ref:
        starts.append(starts[-1] + r)
    fixed = {}
    for p, bs in zip(parts, bars):
        moved, changed = [], False
        for i, m in enumerate(bs):
            got = round(float(m.duration.quarterLength), 4)
            if abs(got - ref[i]) > 1e-3:
                moved.append((m.number, got, ref[i]))
            if abs(float(m.offset) - starts[i]) > 1e-6:
                p.setElementOffset(m, starts[i]); changed = True
        if changed:
            p.coreElementsChanged()
        if moved:
            fixed[p.partName or '?'] = moved
    return fixed


# ---------------- 2. timing ----------------
def tempo_map(score, bpm_default):
    """[(offset in quarters, quarter bpm)] from the score's metronome marks (or the default)"""
    marks = []
    for off, _end, mm in score.metronomeMarkBoundaries():
        try:
            q = mm.getQuarterBPM()
        except Exception:
            q = None
        marks.append((float(off), float(q) if q else None))
    marks = [(o, q) for o, q in marks if q and 20 <= q <= 320]
    marks = [m for i, m in enumerate(marks) if i == 0 or m[0] > marks[i - 1][0]]  # one mark per position
    if bpm_default or not marks:
        return [(0.0, float(bpm_default or 100))], bool(marks)
    if marks[0][0] > 0:
        marks.insert(0, (0.0, marks[0][1]))
    return marks, True


def seconds_at(ql, tmap):
    t, prev_off, prev_bpm = 0.0, 0.0, tmap[0][1]
    for off, bpm in tmap[1:]:
        if off >= ql:
            break
        t += (off - prev_off) * 60.0 / prev_bpm
        prev_off, prev_bpm = off, bpm
    return t + (ql - prev_off) * 60.0 / prev_bpm


def measures_of(score, tmap):
    p = score.parts[0]
    out, beats = [], []
    for m in p.getElementsByClass('Measure'):
        num = m.number if m.number else (out[-1][0] + 1 if out else 1)
        out.append([int(num), round(seconds_at(float(m.offset), tmap), 3)])
        ts = m.timeSignature or m.getContextByClass('TimeSignature')
        beats.append(int(ts.numerator) if ts else 4)
    end = seconds_at(float(p.highestTime), tmap)
    return out, beats, end


# ---------------- 3. audio ----------------
def click_track(measures, beats, end, sr=48000):
    """metronome: a short click on every beat, higher and louder on beat 1, following the bars' time signatures and tempo"""
    buf = np.zeros((int((end + 1.0) * sr), 2), np.float32)
    t = np.arange(int(0.035 * sr)) / sr
    env = np.exp(-t / 0.007)
    hi = (0.42 * np.sin(2 * np.pi * 2093 * t) * env).astype(np.float32)
    lo = (0.26 * np.sin(2 * np.pi * 1568 * t) * env).astype(np.float32)
    for i, (num, t0) in enumerate(measures):
        t1 = measures[i + 1][1] if i + 1 < len(measures) else end
        nb = max(1, beats[i])
        for k in range(nb):
            a = int((t0 + k * (t1 - t0) / nb) * sr); c = hi if k == 0 else lo
            seg = buf[a:a + len(c)]
            seg += c[:len(seg), None]
    return buf


def _gm_instrument(prog, drums, channel):
    inst = m21.instrument.Instrument()
    inst.midiProgram = 0 if drums else int(prog)
    inst.midiChannel = 9 if drums else channel
    return inst


def render_part(part, tmap, prog, drums, path_wav, tmp, split_bass=False):
    """one part -> wav with FluidSynth, on the right General MIDI instrument.
    split_bass: a chord part (base) plays its low notes on an electric bass and the rest on the keyboard program."""
    try:  # transposing instruments (trumpet in Bb, sax, horn in F...): play the real, sounding notes
        part = part.toSoundingPitch(inPlace=False)
    except Exception:
        pass
    flat = part.flatten().notesAndRests.stream()
    groups = [(flat, prog, drums, 0)]
    if split_bass and not drums:
        low, high = m21.stream.Stream(), m21.stream.Stream()
        for n in flat.notes:
            ps = n.pitches if n.isChord else [n.pitch]
            lo_ps = [p for p in ps if p.midi < 48]
            hi_ps = [p for p in ps if p.midi >= 48]
            for p in lo_ps[:1]:  # the bass note, a little louder, like the tour base
                b = m21.note.Note(p, quarterLength=n.quarterLength); b.volume.velocity = 92
                low.insert(n.offset, b)
            if hi_ps:
                h = m21.chord.Chord(hi_ps, quarterLength=n.quarterLength) if len(hi_ps) > 1 else m21.note.Note(hi_ps[0], quarterLength=n.quarterLength)
                h.volume.velocity = n.volume.velocity or 64
                high.insert(n.offset, h)
        if len(low.notes):
            groups = [(high, prog, False, 0), (low, 33, False, 1)]
    s = m21.stream.Score()
    for st, pr, dr, ch in groups:
        p = m21.stream.Part()
        p.insert(0, _gm_instrument(pr, dr, ch))
        for el in st.notesAndRests:
            p.insert(el.offset, el)
        for off, bpm in tmap:
            p.insert(off, m21.tempo.MetronomeMark(number=bpm))
        s.insert(0, p)
    mf = m21.midi.translate.music21ObjectToMidiFile(s)
    mid = os.path.join(tmp, os.path.basename(path_wav) + '.mid')
    mf.open(mid, 'wb'); mf.write(); mf.close()
    humanize_midi(mid, np.random.default_rng(len(path_wav)))
    subprocess.run(['fluidsynth', '-ni', '-g', '0.5' if split_bass else '0.7'] + (['-o', 'synth.reverb.active=0'] if split_bass else []) + ['-r', str(RATE), '-F', path_wav, SF2, mid], check=True, capture_output=True, timeout=900)


SAMPLED = {56: 'trumpet', 59: 'trumpet', 57: 'trombone', 58: 'trombone', 64: 'tenor-sax', 65: 'tenor-sax', 66: 'tenor-sax', 67: 'tenor-sax'}
DYN = {'ppp': 34, 'pp': 44, 'p': 56, 'mp': 68, 'mf': 82, 'f': 96, 'ff': 108, 'fff': 118, 'sfz': 110, 'fp': 96}


def horn_events(part, tmap, rng):
    """notes for the sampler: [start ms, end ms, midi, velocity, legato, grace], at sounding pitch, with the score's
    dynamics, accents, staccato and slurs, and a little human timing and force variation"""
    try:
        part = part.toSoundingPitch(inPlace=False)
    except Exception:
        pass
    flat = part.flatten()
    dyn = sorted((float(d.offset), DYN.get(d.value, 82)) for d in flat.getElementsByClass('Dynamic'))
    slurred = set()
    for sp in part.spannerBundle.getByClass('Slur') if hasattr(part, 'spannerBundle') else []:
        els = sp.getSpannedElements()
        for e in els[:-1]:
            slurred.add(id(e))
    notes = [n for n in flat.notes]
    out = []
    for i, n in enumerate(notes):
        off = float(n.offset)
        t0 = seconds_at(off, tmap); t1 = seconds_at(off + float(n.quarterLength), tmap)
        vel = 82
        for o, v in dyn:
            if o <= off + 1e-6:
                vel = v
        arts = {a.name for a in n.articulations}
        if 'accent' in arts or 'strong accent' in arts:
            vel += 14
        if 'staccato' in arts or 'staccatissimo' in arts:
            t1 = t0 + min(t1 - t0, 0.18)
        # phrase shape: a long note after short ones gets a touch more, the last note of a run a touch less
        vel += int(rng.normal(0, 4))
        leg = id(n) in slurred or (i + 1 < len(notes) and abs(float(notes[i + 1].offset) - (off + float(n.quarterLength))) < 1e-6 and t1 - t0 > 0.3 and 'staccato' not in arts)
        jitter = rng.normal(0, 0.007)
        grace = bool(n.duration.isGrace)
        for p in (n.pitches if n.isChord else [n.pitch]):
            out.append([int((t0 + jitter) * 1000), int(max(t0 + 0.06, t1 - 0.015) * 1000), int(p.midi), int(max(30, min(124, vel))), bool(leg), grace])
    return sorted(out)


def humanize_midi(path, rng):
    """small velocity variation on every note of a rendered General MIDI file"""
    import mido
    mf = mido.MidiFile(path)
    for tr in mf.tracks:
        for msg in tr:
            if msg.type == 'note_on' and msg.velocity > 0:
                msg.velocity = int(max(20, min(127, msg.velocity + rng.normal(0, 6))))
    mf.save(path)


def load_wav(p, n=None):
    a, r = sf.read(p, always_2d=True)
    if a.shape[1] == 1:
        a = np.repeat(a, 2, 1)
    if n is not None:
        a = np.pad(a, ((0, max(0, n - len(a))), (0, 0)))[:n]
    return a


def write_m4a(a, path, tmp):
    peak = float(np.abs(a).max() or 1.0)
    a = a * (0.89 / peak) if peak > 0.89 else a
    wav = os.path.join(tmp, 'mix.wav')
    sf.write(wav, a, RATE)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path], check=True, timeout=600)


# ---------------- corrections (from Caio or the band) ----------------
TOKEN = re.compile(r'^(R|[A-G](?:#|b|##|bb)?-?\d(?:\+[A-G](?:#|b|##|bb)?-?\d)*):(\d+(?:\.\d+)?(?:/\d+)?)([>.\-^~()@]*)$')
# the same note language as app/partitura.js: dynamics and hairpin words before a note, marks after the duration
DYN_WORDS = {'pppp', 'ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff', 'ffff', 'sf', 'sfz', 'sffz', 'sfp', 'fp', 'fz', 'rf', 'rfz'}
HAIRPIN_WORDS = {'cresc', 'dim', 'fim'}


def part_keys(names):
    keys = []
    for n in names:
        k = slug(n)
        while k in keys:
            k += '-2'
        keys.append(k)
    return keys


def parse_tokens(text):
    """'mf D5:1> E5:1/3 F#5:1/3 G5:1/3 R:2 C4+E4+G4:1@' -> music21 notes (written pitch, durations in quarter notes).
    Dynamics come back as zero-length music21 Dynamic objects placed before their note; hairpins and slurs are only
    drawn on the page, so here they are accepted and skipped."""
    out = []
    for tok in str(text).replace(',', ' ').split():
        w = tok.strip().lower()
        if w in DYN_WORDS:
            out.append(m21.dynamics.Dynamic(w)); continue
        if w in HAIRPIN_WORDS:
            continue
        m = TOKEN.match(tok.strip())
        if not m:
            raise ValueError(f'não entendi "{tok}"')
        what, dur, marks = m.group(1), m.group(2), m.group(3) or ''
        a, _, b = dur.partition('/')
        ql = float(a) / float(b) if b else float(a)
        if abs(ql * 3 - round(ql * 3)) < 0.01 and abs(ql * 8 - round(ql * 8)) > 0.01:
            ql = Fraction(round(ql * 24), 24)   # 0.333 -> 1/3, so a triplet sums exactly
        if what == 'R':
            n = m21.note.Rest(quarterLength=ql)
        else:
            ps = [x.replace('b', '-') if len(x) > 1 and x[1] == 'b' else x for x in what.split('+')]
            ps = [p[0] + p[1:].replace('b', '-') for p in ps]
            n = m21.chord.Chord(ps, quarterLength=ql) if len(ps) > 1 else m21.note.Note(ps[0], quarterLength=ql)
            arts = {'>': m21.articulations.Accent, '.': m21.articulations.Staccato, '-': m21.articulations.Tenuto, '^': m21.articulations.StrongAccent}
            for ch in marks:
                if ch in arts:
                    n.articulations.append(arts[ch]())
            if '~' in marks:
                n.tie = m21.tie.Tie('start')
        if '@' in marks:
            n.expressions.append(m21.expressions.Fermata())
        out.append(n)
    return out


def apply_corrections(score, keys, corrections):
    """replace the notes of whole bars; returns (applied, problems)"""
    done, bad = [], []
    for c in corrections:
        try:
            idx = keys.index(c['parte'])
            part = score.parts[idx]
            meas = [m for m in part.getElementsByClass('Measure') if int(m.number or 0) == int(c['compasso'])]
            if not meas:
                raise ValueError(f'compasso {c["compasso"]} não existe')
            m = meas[0]
            bar_len = float(m.barDuration.quarterLength) if m.barDuration else 4.0
            notes = parse_tokens(c['notas'])
            total = float(sum(Fraction(n.quarterLength) for n in notes))
            if total > bar_len + 1e-6:
                raise ValueError(f'as durações somam {total} tempos e o compasso tem {bar_len}')
            for el in list(m.recurse().notesAndRests):
                el.activeSite.remove(el)
            for v in list(m.voices):
                m.remove(v)
            off = 0.0
            for n in notes:
                m.insert(off, n); off += float(n.quarterLength)
            if off < bar_len - 1e-6:
                m.insert(off, m21.note.Rest(quarterLength=bar_len - off))
            done.append(c)
        except Exception as e:
            bad.append(f'{c.get("parte")} c.{c.get("compasso")}: {e}')
    return done, bad


# ---------------- main ----------------
def multi_rests(path):
    """one part's MusicXML: 2+ silent bars in a row -> <multiple-rest>N, broken where the reader needs to see something"""
    tree = ET.parse(path); root = tree.getroot()
    part = root.find('part')
    if part is None:
        return
    ms = part.findall('measure')
    silent = lambda m: all(n.find('pitch') is None and n.find('unpitched') is None for n in m.findall('note'))
    breaks = lambda m: (m.find('attributes/time') is not None or m.find('attributes/key') is not None or m.find('attributes/clef') is not None
                        or m.find('direction/direction-type/rehearsal') is not None or m.find('direction/direction-type/words') is not None
                        or m.find('barline/repeat') is not None or m.find('harmony') is not None)
    ends = lambda m: any((b.findtext('bar-style') or '') in ('light-light', 'light-heavy') or b.find('repeat') is not None for b in m.findall('barline'))
    i = 0
    while i < len(ms):
        if not silent(ms[i]):
            i += 1; continue
        j = i
        while j + 1 < len(ms) and silent(ms[j + 1]) and not breaks(ms[j + 1]) and not ends(ms[j]):
            j += 1
        if j > i:
            at = ms[i].find('attributes')
            if at is None:
                at = ET.Element('attributes'); ms[i].insert(0, at)
            st = ET.SubElement(at, 'measure-style'); ET.SubElement(st, 'multiple-rest').text = str(j - i + 1)
        i = j + 1
    tree.write(path, encoding='UTF-8', xml_declaration=True)


def engrave_parts(xml_path, title, partes, tmp, dest, so=None):
    """a score written in the app has no PDFs: MuseScore draws the full score and one PDF per instrument
    (same as the Mestrinho does), so the band reads it on the stand, writes on it and follows the DAW"""
    import copy
    env = dict(os.environ, QT_QPA_PLATFORM='offscreen')
    mss = os.path.join(tmp, 'parte.mss')  # musicians' parts: long rests as one bar with the count on top
    with open(mss, 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><museScore version="3.02"><Style>'
                '<createMultiMeasureRests>1</createMultiMeasureRests><minEmptyMeasures>2</minEmptyMeasures></Style></museScore>')
    def eng(x, pdf, part=False):
        subprocess.run(['mscore3'] + (['-S', mss] if part else []) + ['-o', pdf, x], check=True, capture_output=True, timeout=600, env=env)
        return pdf
    full = m21.converter.parse(xml_path)
    out = []
    if len(full.parts) > 1 and (not so or 'grade' in so):
        out.append({'key': 'grade', 'name': 'Grade', 'src': upload(eng(xml_path, os.path.join(tmp, 'grade.pdf')), f'{dest}/grade.pdf', 'application/pdf')})
    for i, pt in enumerate(full.parts):
        meta = partes[i] if i < len(partes) else {}
        name = meta.get('name') or pt.partName or f'Parte {i + 1}'
        key = meta.get('key') or slug(name)
        if so and key not in so:  # only the instruments asked for (a part added to a score that has its own PDFs)
            continue
        one = m21.stream.Score(); one.metadata = m21.metadata.Metadata(title=f'{title} · {name}')
        one.insert(0, copy.deepcopy(pt))
        one.metadata.composer = ''
        px = os.path.join(tmp, f'parte-app-{i}.musicxml'); one.write('musicxml', fp=px); multi_rests(px)
        out.append({'key': key, 'name': name, 'src': upload(eng(px, os.path.join(tmp, f'{slug(key)}.pdf'), True), f'{dest}/{slug(key)}.pdf', 'application/pdf')})
    return out


def run(job):
    band = job.ref.parent.parent.id
    song_id = job.data['song']
    bpm = job.data.get('bpm')
    song_ref = db.document(f'bands/{band}/songs/{song_id}')
    song = song_ref.get().to_dict()
    if not song:
        raise RuntimeError('A música não existe mais.')
    parts = [p for p in song.get('parts', []) if p.get('src')]
    with tempfile.TemporaryDirectory() as tmp:
        # --- source: original file first, else the PDFs ---
        src_files, how = [], ''
        prev = song.get('player') or {}
        reuse = job.data.get('fonte') == 'lido' and prev.get('lido')
        if reuse:
            job.step('Abrindo a partitura já lida', 5)
            path = download(prev['lido'], os.path.join(tmp, 'anterior.musicxml'))
            src_files, how = [path], 'partitura lida'
        master = (song.get('partitura') or {}).get('xml')
        if not reuse and master and job.data.get('fonte') == 'partitura':  # the band's edited score is the source
            job.step('Abrindo a partitura editada', 5)
            src_files, how = [download(master, os.path.join(tmp, 'partitura.musicxml'))], 'partitura editada'
            pmeta = song.get('partitura') or {}
            if pmeta.get('origem') == 'criada no app':  # its PDFs are drawn from it, every version
                job.step('Desenhando a grade e as partes em PDF', 8)
                dest = f'bands/{band}/partituras/{song_id}/pdf-v{pmeta.get("versao", 1)}'
                parts = engrave_parts(src_files[0], song.get('title') or song_id, pmeta.get('partes') or [], tmp, dest)
                song_ref.update({'parts': parts})
            else:
                # an instrument Caio added to a score read from PDFs: draw its part, and redraw the grade so it shows it.
                # Also heals songs whose new part got a PDF before the grade was redrawn: the grade is still the
                # arranger's PDF while some part was drawn by the app (its file lives under /partituras/).
                novas = set(pmeta.get('partesSemPdf') or [])
                atuais = song.get('parts', [])
                do_app = lambda p: '%2Fpartituras%2F' in (p.get('src') or '')
                e_grade = lambda p: bool(re.search(r'grade|score|partitura|full', (p.get('name') or '') + (p.get('key') or ''), re.I))
                grade = next((p for p in atuais if e_grade(p)), None)
                grade_velha = grade is not None and not do_app(grade) and any(do_app(p) for p in atuais if not e_grade(p))
                # the band asked (through Caio) to redraw every PDF from the edited score, replacing the arranger's
                redesenhar = bool(pmeta.get('redesenhar'))
                if novas or grade_velha or redesenhar:
                    so = None if redesenhar else novas | ({'grade'} if grade is not None else set())
                    job.step('Desenhando de novo todos os PDFs' if redesenhar else 'Desenhando o PDF da parte nova e a grade', 8)
                    dest = f'bands/{band}/partituras/{song_id}/pdf-v{pmeta.get("versao", 1)}'
                    feitas = engrave_parts(src_files[0], song.get('title') or song_id, pmeta.get('partes') or [], tmp, dest, so=so)
                    for p in feitas:  # the new grade keeps the old one's key and name (the reader and the notes use them)
                        if p['key'] == 'grade' and grade is not None:
                            p['key'], p['name'] = grade.get('key') or 'grade', grade.get('name') or 'Grade'
                    novas_keys = {p['key'] for p in feitas}
                    antigas = [p for p in atuais if p.get('key') not in novas_keys and not (grade is not None and p is grade)]
                    # the grade first, as the arranger's PDFs had it
                    todas = sorted(antigas + feitas, key=lambda p: not e_grade(p))
                    upd_pdf = {'parts': todas}
                    if novas:
                        upd_pdf['partitura.partesSemPdf'] = firestore.DELETE_FIELD
                    if redesenhar:
                        upd_pdf['partitura.redesenhar'] = firestore.DELETE_FIELD
                    song_ref.update(upd_pdf)
                    parts = [p for p in todas if p.get('src')]
        fontes = [] if (reuse or src_files) else [f for f in song.get('fontes', []) if re.search(r'\.(musicxml|mxl|xml|mscz|mscx)$', f.get('name', ''), re.I)]
        if fontes:
            f = fontes[-1]
            job.step('Lendo o arquivo original ' + f['name'], 5)
            path = download(f['src'], os.path.join(tmp, slug(f['name']) + os.path.splitext(f['name'])[1].lower()))
            if path.endswith(('.mscz', '.mscx')):
                out = path + '.musicxml'
                subprocess.run(['mscore3', '-o', out, path], check=True, capture_output=True, timeout=600, env=dict(os.environ, QT_QPA_PLATFORM='offscreen'))
                path = out
            src_files, how = [path], 'arquivo original'
        if not src_files:
            grade = next((p for p in parts if re.search(r'grade|score|partitura|full', p.get('name', '') + p.get('key', ''), re.I)), None)
            pdfs = [grade] if grade else parts
            if not pdfs:
                raise RuntimeError('Esta música não tem PDF nem arquivo original.')
            for i, p in enumerate(pdfs):
                job.step(f'Lendo as notas do PDF {p["name"]} ({i + 1}/{len(pdfs)})', 5 + int(40 * i / len(pdfs)))
                pdf = download(p['src'], os.path.join(tmp, f'{slug(p["key"])}.pdf'))
                base_pct, span = 5 + int(40 * i / len(pdfs)), max(1, int(40 / len(pdfs)))
                prog = lambda k, n, p=p, b=base_pct, sp=span: job.step(f'Lendo as notas de {p["name"]}: página {k} de {n}', b + int(sp * k / n))
                src_files.append((p, omr(pdf, os.path.join(tmp, 'omr', slug(p['key'])), prog), pdf_text(pdf), pdf))
            how = 'leitura do PDF da grade' if grade else 'leitura dos PDFs das partes'

        # --- one score with every instrument ---
        job.step('Juntando as partes', 48)
        if how == 'partitura lida':
            score = load_score(src_files)
            olds = [x.get('name') for x in prev.get('instrumentos', [])]
            names = [(olds[i] if i < len(olds) and olds[i] else (pt.partName or f'Parte {i + 1}')) for i, pt in enumerate(score.parts)]
            # a base made from chord symbols, saved under a horn's name by an older run: it plays as the base again
            names = [chart_name(nm) if is_comping(pt) else nm for pt, nm in zip(score.parts, names)]
            if prev.get('bpm') and not bpm:
                bpm_text = prev['bpm']
            how = prev.get('source', 'partitura lida')
            if 'com correções' not in how:
                how += ', com correções'
        elif how in ('arquivo original', 'partitura editada'):
            score = load_score(src_files)
            names = [(pt.partName or f'Parte {i + 1}') for i, pt in enumerate(score.parts)]
            if how == 'partitura editada':  # chart parts (chord symbols over slashes) play as piano + bass
                for i, pt in enumerate(list(score.parts)):
                    ns = [n for n in pt.recurse().notes if not isinstance(n, m21.harmony.ChordSymbol)]
                    if ns and all(getattr(n, 'notehead', '') == 'slash' for n in ns):
                        bars = chords_from_part(pt)
                        if bars:
                            names[i] = chart_name(names[i])
                            score.replace(pt, comping_part(score, bars, names[i]))
                            print('base tocada das cifras da partitura:', names[i], len(bars), 'compassos com cifra', flush=True)
        else:
            score, names = m21.stream.Score(), []
            for p, files, tinfo, _pdf in src_files:
                try:  # the PDF bar map: fills bars the reader skipped, so repeats and chords land on the right bar
                    tinfo['boxes'], _w = layout2.layout(_pdf, None)
                except Exception as e:
                    tinfo['boxes'] = None; print('mapa de compassos do PDF:', e)
                sc = load_score(files, tinfo['boxes'], _pdf)
                # names from the top staff down; a staff with no name on the first system (often the base, at the
                # bottom) keeps the reader's name and is told apart later (chords -> Base)
                if len(sc.parts) > 1 and tinfo['names']:
                    for pt, nm in zip(sc.parts, tinfo['names'][:len(sc.parts)]):
                        pt.partName = nm
                if tinfo['bpm'] and not bpm:
                    bpm_text = tinfo['bpm']
                for i, pt in enumerate(sc.parts):
                    score.insert(0, pt)
                    nm = (pt.partName or '').strip()
                    generic = not nm or re.fullmatch(r'(voice|voz|staff|part|p\d+|instrument)\s*\d*', nm, re.I)
                    names.append(p['name'] if len(sc.parts) == 1 else (f'Pauta {i + 1}' if generic else nm))
        if not len(score.parts):
            raise RuntimeError('Não encontrei nenhuma pauta na partitura.')
        # chord-chart parts (slashes + chord symbols) come out of the reader as rests: in the study audio they become a
        # metronome (a computer-made band sounded worse than none); the chords stay in the score
        click_names = set()
        chart_parts = {}  # part index -> the chart as written (chord symbols over slashes), for the editable score
        if how not in ('arquivo original', 'partitura editada') and not reuse:
            for p, files, tinfo, pdf in src_files:
                if not tinfo['chords']:
                    continue
                boxes = tinfo.get('boxes')
                if not boxes:
                    continue
                bars = chords_to_bars(tinfo['chords'], boxes)
                if len(bars) < 2:
                    continue
                for i, pt in enumerate(list(score.parts)):
                    notes = len(list(pt.recurse().notes))
                    if notes <= len(pt.getElementsByClass('Measure')) * 0.3:  # nearly empty: the chart part
                        names[i] = chart_name(names[i])
                        newp = comping_part(score, bars, names[i])
                        chart_parts[i] = chart_part(score, bars, names[i])
                        score.replace(pt, newp); click_names.add(names[i])
                        print('base gerada das cifras:', names[i], len(bars), 'compassos com cifra', flush=True)
        # PDFs are read at written pitch: trumpet in Bb, saxes, horn... need their transposition to sound in tune
        if not how.startswith('arquivo original') and how != 'partitura editada':
            for i, (pt, nm) in enumerate(zip(score.parts, names)):
                if i in chart_parts:
                    continue  # the base is made from the chord symbols, already at concert pitch
                iv = set_transposition(pt, nm)
                if iv:
                    print('transposição', nm, iv, flush=True)
        # corrections asked for (bar by bar), then keep the score as read (before repeats are written out)
        keys_all = part_keys(names)
        corr = [] if how == 'partitura editada' else (song.get('correcoes') or [])  # the edited score already has them
        applied, problems = apply_corrections(score, keys_all, corr) if corr else ([], [])
        if corr:
            print('correções aplicadas:', len(applied), 'problemas:', problems, flush=True)
        xml_lido = os.path.join(tmp, 'lido.musicxml')
        try:
            for pt, nm in zip(score.parts, names):
                pt.partName = nm
            score.write('musicxml', fp=xml_lido)
        except Exception as e:
            print('não guardei o MusicXML lido:', e); xml_lido = None
        xml_master = None
        if not (song.get('partitura') or {}).get('xml') and not reuse:  # the editable score, made once
            try:
                xml_master = os.path.join(tmp, 'partitura.musicxml')
                partitura_master(score, names, chart_parts, song.get('title') or song_id, (bpm or locals().get('bpm_text'))).write('musicxml', fp=xml_master)
            except Exception as e:
                print('não montei a partitura editável:', e); traceback.print_exc(); xml_master = None
        score = unfold(score, LAST_PLAN)
        for nm, moved in align_bars(score).items():  # a bar read short no longer shifts the rest of that part
            print('compassos com duração errada (alinhados):', nm, moved, flush=True)

        tmap, had_tempo = tempo_map(score, bpm or (locals().get('bpm_text')))
        if not bpm and locals().get('bpm_text'):
            had_tempo = True
        measures, beats, duration = measures_of(score, tmap)

        # --- audio per instrument ---
        keys, wavs, labels = [], [], []
        for i, (pt, name) in enumerate(zip(score.parts, names)):
            job.step(f'Gerando o som de {name}', 50 + int(30 * i / len(score.parts)))
            k = keys_all[i] if i < len(keys_all) else slug(name)
            prog, drums = program_for(pt, name)
            w = os.path.join(tmp, f'{k}.wav')
            try:
                horn = SAMPLED.get(prog) if not drums else None
                evs = horn_events(pt, tmap, np.random.default_rng(i + 7)) if horn else []
                if horn and evs:  # real recorded horns, like the tour audio
                    end_ms = int(seconds_at(float(pt.highestTime), tmap) * 1000) + 500
                    b = H.render_part(horn, evs, [], end_ms)
                    b = H.room(H.pan(b, {'trumpet': 36, 'tenor-sax': 92, 'trombone': 62}[horn]), 0.30)
                    sf.write(w, b, H.SR)
                else:
                    sb = bool(re.search(r'base|cifra|chord|harmonia|teclado|piano|guitarra|viol', name, re.I))
                    render_part(pt, tmap, prog, drums, w, tmp, split_bass=sb)
                    a, sr0 = sf.read(w, always_2d=True)
                    if a.shape[1] == 1:
                        a = np.repeat(a, 2, 1)
                    a = H.room(a.astype(np.float32) * (2.8 if sb else 1.5), 0.18)  # same level as the tour base
                    sf.write(w, a, sr0)
            except Exception as e:
                print('parte sem som:', name, e)
                traceback.print_exc()
                continue
            keys.append(k); wavs.append(w); labels.append(name)
        if not wavs:
            raise RuntimeError('Não consegui gerar o som de nenhum instrumento.')
        n = max(sf.info(w).frames for w in wavs)
        tracks = {k: load_wav(w, n) for k, w in zip(keys, wavs)}
        total = sum(tracks.values())

        job.step('Preparando as mixagens do player', 82)
        ver = time.strftime('%Y%m%d%H%M%S')
        base = f'bands/{band}/audio/{song_id}/{ver}'
        lido = None
        if xml_lido:  # the score as read: lets the band (and Caio) check and fix notes later
            lido = upload(xml_lido, f'{base}/lido.musicxml', 'application/vnd.recordare.musicxml+xml')
        partitura = None
        if xml_master:  # the editable score the app draws and edits (version 1)
            pv = time.strftime('%Y%m%d%H%M%S')
            partitura = {'xml': upload(xml_master, f'bands/{band}/partituras/{song_id}/{pv}.musicxml', 'application/vnd.recordare.musicxml+xml'),
                         'versao': 1, 'criadaEm': int(time.time() * 1000), 'origem': how, 'editadaPor': 'Malak'}
        mixes = {}
        todo = [('tudo', total)] + [('so-' + k, a) for k, a in tracks.items()]
        if len(tracks) > 2:
            todo += [('sem-' + k, total - a) for k, a in tracks.items()]
        for name, a in todo:
            p = os.path.join(tmp, name + '.m4a')
            write_m4a(a, p, tmp)
            mixes[name] = upload(p, f'{base}/{name}.m4a', 'audio/mp4')
        names_by_key = dict(zip(keys, labels))

        # --- bar boxes on each PDF page ---
        job.step('Marcando os compassos nas páginas', 92)
        lay_ref = db.document(f'bands/{band}/layout/{song_id}')
        lay = (lay_ref.get().to_dict() or {}).get('parts', {})
        warns = []
        last_bar = measures[-1][0] if measures else None
        for p in parts:
            try:
                pdf = os.path.join(tmp, f'{slug(p["key"])}.pdf')
                if not os.path.exists(pdf):
                    download(p['src'], pdf)
                boxes, w = layout2.layout(pdf, last_bar)
                lay[p['key']] = {'boxes': boxes, 'src': p['src']}
                warns += [f'{p["name"]}: {x}' for x in (w or [])][:5]
            except Exception as e:
                warns.append(f'{p["name"]}: não achei os compassos ({e})')
        lay_ref.set(enc({'parts': lay, 'made': time.strftime('%Y-%m-%d'), 'how': 'Malak: barras de compasso dos PDFs'}), merge=True)

        player = {
            'mixes': mixes, 'measures': measures, 'beats': beats, 'duration': round(duration, 3),
            'instrumentos': [{'key': k, 'name': names_by_key.get(k, k)} for k in keys],
            'made': time.strftime('%Y-%m-%d'), 'robo': True, 'conferido': False,
            'source': how, 'bpm': tmap[0][1], 'lido': lido, 'tempoLido': had_tempo and not bpm,
            'sound': 'Som gerado pelo Malak (FluidR3 GM). Confira as notas e o andamento.',
        }
        upd = {'player': player, 'status': 'aguardando conferência'}
        if partitura:
            upd['partitura'] = partitura
        if corr:  # corrections now live in the read score: keep a history, clear the queue
            hist = (song.get('historicoCorrecoes') or []) + [{**c, 'aplicadaEm': int(time.time() * 1000)} for c in applied]
            upd.update({'correcoes': [], 'historicoCorrecoes': hist[-200:], 'correcoesRecusadas': problems[:20]})
        elif song.get('correcoesRecusadas'):
            upd['correcoesRecusadas'] = []
        song_ref.update(enc(upd))
        warns = problems + warns if corr else warns
        if corr and problems and not applied:
            msg = f'Nenhuma das {len(corr)} correções entrou: {problems[0]}. Peça ao Caio de novo.'
        elif corr and problems:
            msg = f'Pronto: {len(applied)} correções aplicadas e {len(problems)} recusadas (ex.: {problems[0]}). Ouça e confira.'
        elif corr:
            msg = f'Pronto: {len(applied)} correções aplicadas, ouça e confira.'
        else:
            msg = 'Pronto: ouça e confira.'
        job.ref.update({'status': 'pronto', 'msg': msg, 'progresso': 100, 'avisos': warns[:20],
                        'atualizado': int(time.time() * 1000), 'compassos': len(measures), 'instrumentos': keys})


if __name__ == '__main__':
    job = Job(os.environ['JOB'])
    try:
        run(job)
    except Exception as e:
        traceback.print_exc()
        job.ref.update({'status': 'erro', 'msg': str(e)[:500], 'atualizado': int(time.time() * 1000)})
        sys.exit(1)
