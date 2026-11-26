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
import urllib.request, urllib.parse

import numpy as np
import soundfile as sf
from google.cloud import firestore, storage
import music21 as m21

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout2  # bar boxes from the PDF pages (same tool used for the tour scores)

PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT', 'salvetheapp-3cceb')
BUCKET = os.environ.get('BUCKET', 'salvetheapp-3cceb.firebasestorage.app')
# the fullest General MIDI bank available: 128 instruments + drum kits (MuseScore General, else FluidR3)
SF2 = os.environ.get('SF2') or next((p for p in ('/usr/share/sounds/sf2/MuseScore_General_Full.sf2', '/usr/share/sounds/sf2/MuseScore_General.sf2',
      '/usr/share/sounds/sf3/MuseScore_General.sf3', '/usr/share/sounds/sf3/MuseScore_General_Full.sf3', '/usr/share/sounds/sf2/FluidR3_GM.sf2') if os.path.exists(p)), '/usr/share/sounds/sf2/FluidR3_GM.sf2')
AUDIVERIS = os.environ.get('AUDIVERIS', 'audiveris')
RATE = 44100

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


def download(url, dest):
    with urllib.request.urlopen(url, timeout=120) as r, open(dest, 'wb') as f:
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
    ('trompete|trumpet|flugel|cornet', 56), ('trombone', 57), ('tuba|bombardino|euphonium', 58), ('surdina|mute', 59),
    ('trompa|french horn|horn in f|horn', 60), ('metais|brass', 61), ('sax soprano|soprano sax', 64), ('sax alto|alto sax|alto', 65),
    ('sax tenor|tenor sax|tenor', 66), ('sax baritono|baritone sax|bari', 67), ('sax', 65), ('oboe|oboé', 68),
    ('corne ingles|english horn', 69), ('fagote|bassoon', 70), ('clarone|bass clarinet|clarinete|clarinet|requinta', 71),
    ('flautim|piccolo', 72), ('flauta doce|recorder', 74), ('pifano|pife|fife', 72), ('flauta|flute', 73), ('pan flute|flauta pan', 75),
    ('ocarina', 79), ('sintetizador|synth lead|lead', 80), ('pad', 88), ('sitar', 104), ('kalimba', 108), ('steel drum|steel pan', 114),
    ('teclado|keyboard|keys|piano|base', 0),
]
DRUMS = 'bateria|drum|percuss|pandeiro|caixa|surdo|tamborim|agogo|agogô|cuica|cuíca|conga|bongo|cajon|cajón|ganza|ganzá|shaker|triangulo|triângulo|chocalho|timbal|repique|zabumba|kit'


def program_for(part, name):
    """(GM program, is drums): the instrument written in the file first, then the part name"""
    n = (name or '').lower()
    if re.search(DRUMS, n):
        return 0, True
    try:
        inst = part.getInstrument(returnDefault=False)
        if inst is not None:
            if isinstance(inst, m21.instrument.UnpitchedPercussion) or getattr(inst, 'inGMPercMap', False):
                return 0, True
            if inst.midiProgram is not None and not (inst.midiProgram == 0 and not re.search('piano|teclado|keys', n)):
                return int(inst.midiProgram), False
    except Exception:
        pass
    plain = n.encode('ascii', 'ignore').decode() if n.isascii() else __import__('unicodedata').normalize('NFD', n).encode('ascii', 'ignore').decode()
    for pat, prog in GM:
        if re.search(pat, plain) or re.search(pat, n):
            return prog, False
    try:  # music21 knows many more instrument names
        inst = m21.instrument.fromString(name)
        if inst.midiProgram is not None:
            return int(inst.midiProgram), isinstance(inst, m21.instrument.UnpitchedPercussion)
    except Exception:
        pass
    return 0, False


def omr(pdf, out_dir):
    """PDF -> MusicXML with Audiveris (headless)"""
    os.makedirs(out_dir, exist_ok=True)
    # text reading (part names, tempo marks, lyrics): Portuguese, English, Italian (tempo words) and German
    tess = next((d for d in glob.glob('/usr/share/tesseract-ocr/*/tessdata') if os.path.isdir(d)), None)
    env = dict(os.environ, TESSDATA_PREFIX=tess) if tess else os.environ
    cmd = [AUDIVERIS, '-batch', '-option', 'org.audiveris.omr.text.Language.defaultSpecification=por+eng+ita+deu', '-export', '-output', out_dir, '--', pdf]
    if shutil.which('xvfb-run'):
        cmd = ['xvfb-run', '-a'] + cmd  # some of its libraries want a display even in batch mode
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=2400, env=env)
    print('audiveris saída:', r.returncode, r.stdout[-4000:], r.stderr[-4000:], flush=True)
    found = sorted(glob.glob(os.path.join(out_dir, '**', '*.mxl'), recursive=True)) + sorted(glob.glob(os.path.join(out_dir, '**', '*.musicxml'), recursive=True))
    if not found:
        raise RuntimeError('Não consegui ler as notas deste PDF. Ele é exportado de um programa de partitura (não foto/scan)?')
    return found  # one file per "movement"; usually one


def load_score(files):
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
                        if nm in names:
                            break  # the names start repeating (abbreviated systems): first system done
                        names.append(nm)
                    info['names'] = names
                for w in words:
                    t = w['text'].replace('♭', 'b').replace('♯', '#')
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
        b = min(cand, key=lambda b: abs(c['y'] - b[4]))
        if b[0] != b[1]:
            continue  # a multi-bar rest has no chords
        frac = min(0.99, max(0.0, (c['x'] - b[3]) / max(1e-6, b[5] - b[3])))
        if frac > 0.93:
            continue  # at the very end of a bar it is a mark for the next one, not a chord
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


def comping_part(score, bar_chords, name='Base'):
    """a keyboard + bass part from chord symbols: chord held until the next one, root in the bass on each change and beat 3"""
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
        for i, (off, sym) in enumerate(changes):
            end = changes[i + 1][0] if i + 1 < len(changes) else bar_len
            dur = max(0.5, end - off)
            try:
                cs = m21.harmony.ChordSymbol(sym.replace('maj', 'maj').replace('Δ', 'maj7'))
                ps = [p for p in cs.pitches]
            except Exception:
                continue
            root = cs.root() if cs.root() else ps[0]
            voicing = sorted({(p.pitchClass - 0) % 12 for p in ps})
            notes = [m21.pitch.Pitch(midi=60 + ((pc - 0) % 12) - (12 if pc > 7 else 0)) for pc in voicing][:4]
            ch = m21.chord.Chord(notes, quarterLength=dur); ch.volume.velocity = 60
            nm.insert(off, ch)
            bass = m21.note.Note(m21.pitch.Pitch(midi=36 + root.pitchClass + (0 if root.pitchClass < 5 else -12) + 12), quarterLength=min(dur, 2.0)); bass.volume.velocity = 80
            nm.insert(off, bass)
            if dur >= 4 and bar_len >= 4:
                b2 = m21.note.Note(bass.pitch, quarterLength=2.0); b2.volume.velocity = 70; nm.insert(off + 2, b2)
            last = sym
        part.append(nm)
    return part


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
def render_part(part, tmap, prog, drums, path_wav, tmp):
    s = m21.stream.Score()
    try:  # transposing instruments (trumpet in Bb, sax, horn in F...): play the real, sounding notes
        part = part.toSoundingPitch(inPlace=False)
    except Exception:
        pass
    p = part.flatten().notesAndRests.stream()
    p.insert(0, m21.instrument.Instrument())
    s.insert(0, p)
    # fixed tempo map on the copy, so every part renders on the same clock
    for e in list(p.recurse().getElementsByClass('MetronomeMark')):
        p.remove(e, recurse=True)
    for off, bpm in tmap:
        p.insert(off, m21.tempo.MetronomeMark(number=bpm))
    mf = m21.midi.translate.music21ObjectToMidiFile(s)
    for tr in mf.tracks:
        for ev in tr.events:
            if drums and getattr(ev, 'channel', None) is not None:
                ev.channel = 10
        if not drums:
            pc = m21.midi.MidiEvent(tr, type=m21.midi.ChannelVoiceMessages.PROGRAM_CHANGE, channel=1)
            pc.data = prog
            dt = m21.midi.DeltaTime(tr, time=0)
            tr.events[0:0] = [dt, pc]
    mid = os.path.join(tmp, os.path.basename(path_wav) + '.mid')
    mf.open(mid, 'wb'); mf.write(); mf.close()
    subprocess.run(['fluidsynth', '-ni', '-g', '0.7', '-r', str(RATE), '-F', path_wav, SF2, mid], check=True, capture_output=True, timeout=900)


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
TOKEN = re.compile(r'^(R|[A-G](?:#|b|##|bb)?-?\d(?:\+[A-G](?:#|b|##|bb)?-?\d)*):(\d+(?:\.\d+)?|\d+/\d+)$')


def part_keys(names):
    keys = []
    for n in names:
        k = slug(n)
        while k in keys:
            k += '-2'
        keys.append(k)
    return keys


def parse_tokens(text):
    """'D5:1 E5:0.5 F#5:0.5 R:2 C4+E4+G4:1' -> music21 notes (written pitch, durations in quarter notes)"""
    out = []
    for tok in str(text).replace(',', ' ').split():
        m = TOKEN.match(tok.strip())
        if not m:
            raise ValueError(f'não entendi "{tok}"')
        what, dur = m.group(1), m.group(2)
        ql = float(eval(dur)) if '/' in dur else float(dur)
        if what == 'R':
            out.append(m21.note.Rest(quarterLength=ql))
        else:
            ps = [x.replace('b', '-') if len(x) > 1 and x[1] == 'b' else x for x in what.split('+')]
            ps = [p[0] + p[1:].replace('b', '-') for p in ps]
            out.append(m21.chord.Chord(ps, quarterLength=ql) if len(ps) > 1 else m21.note.Note(ps[0], quarterLength=ql))
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
            total = sum(float(n.quarterLength) for n in notes)
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
        fontes = [] if reuse else [f for f in song.get('fontes', []) if re.search(r'\.(musicxml|mxl|xml|mscz|mscx)$', f.get('name', ''), re.I)]
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
                src_files.append((p, omr(pdf, os.path.join(tmp, 'omr', slug(p['key']))), pdf_text(pdf), pdf))
            how = 'leitura do PDF da grade' if grade else 'leitura dos PDFs das partes'

        # --- one score with every instrument ---
        job.step('Juntando as partes', 48)
        if how == 'partitura lida':
            score = load_score(src_files)
            olds = [x.get('name') for x in prev.get('instrumentos', [])]
            names = [(olds[i] if i < len(olds) and olds[i] else (pt.partName or f'Parte {i + 1}')) for i, pt in enumerate(score.parts)]
            if prev.get('bpm') and not bpm:
                bpm_text = prev['bpm']
            how = prev.get('source', 'partitura lida')
            if 'com correções' not in how:
                how += ', com correções'
        elif how == 'arquivo original':
            score = load_score(src_files)
            names = [(pt.partName or f'Parte {i + 1}') for i, pt in enumerate(score.parts)]
        else:
            score, names = m21.stream.Score(), []
            for p, files, tinfo, _pdf in src_files:
                sc = load_score(files)
                if len(sc.parts) > 1 and len(tinfo['names']) >= len(sc.parts):
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
        # chord-chart parts (slashes + chord symbols) come out of the reader as rests: play their chords instead
        if how not in ('arquivo original',) and not reuse:
            for p, files, tinfo, pdf in src_files:
                if not tinfo['chords']:
                    continue
                try:
                    boxes, _w = layout2.layout(pdf, None)
                except Exception:
                    continue
                bars = chords_to_bars(tinfo['chords'], boxes)
                if len(bars) < 2:
                    continue
                for i, pt in enumerate(list(score.parts)):
                    notes = len(list(pt.recurse().notes))
                    if notes <= len(pt.getElementsByClass('Measure')) * 0.3:  # nearly empty: the chart part
                        newp = comping_part(score, bars, names[i])
                        score.replace(pt, newp)
                        print('base gerada das cifras:', names[i], len(bars), 'compassos com cifra', flush=True)
        # corrections asked for (bar by bar), then keep the score as read (before repeats are written out)
        keys_all = part_keys(names)
        corr = song.get('correcoes') or []
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
        try:
            score = score.expandRepeats()
        except Exception:
            pass  # repeats the reader couldn't make sense of: play straight through

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
                render_part(pt, tmap, prog, drums, w, tmp)
            except Exception as e:
                print('parte sem som:', name, e)
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
        if corr:  # corrections now live in the read score: keep a history, clear the queue
            hist = (song.get('historicoCorrecoes') or []) + [{**c, 'aplicadaEm': int(time.time() * 1000)} for c in applied]
            upd.update({'correcoes': [], 'historicoCorrecoes': hist[-200:]})
        song_ref.update(enc(upd))
        warns = problems + warns if corr else warns
        job.ref.update({'status': 'pronto', 'msg': ('Pronto: correções aplicadas, ouça e confira.' if corr else 'Pronto: ouça e confira.'), 'progresso': 100, 'avisos': warns[:20],
                        'atualizado': int(time.time() * 1000), 'compassos': len(measures), 'instrumentos': keys})


if __name__ == '__main__':
    job = Job(os.environ['JOB'])
    try:
        run(job)
    except Exception as e:
        traceback.print_exc()
        job.ref.update({'status': 'erro', 'msg': str(e)[:500], 'atualizado': int(time.time() * 1000)})
        sys.exit(1)
