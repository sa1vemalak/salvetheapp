/* salvetheapp · Partitura: the editable score (MusicXML) as the song's source of truth.
   Every edit — a finger on a note or Caio's proposal — becomes "rewrite this bar of this part" in one token language,
   the same one Caio reads and writes:  "D5:1 E5:0.5. R:0.5 F#5+A5:2>~"   (written pitch, durations in quarter notes)
     suffixes: > accent  . staccato  - tenuto  ^ marcato  ~ tied to the next note
   Works in the browser (DOMParser) and in Node tests (pass a DOMParser / XMLSerializer pair). */
(function (root) {
  const STEPS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const DIV = 24;  // every duration in the score is rewritten to 24 per quarter, so bars can be swapped freely
  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const TYPES = [[4, 'whole'], [2, 'half'], [1, 'quarter'], [0.5, 'eighth'], [0.25, '16th'], [0.125, '32nd']];
  const ARTS = { '>': 'accent', '.': 'staccato', '-': 'tenuto', '^': 'strong-accent' };

  const kids = (el, tag) => el ? [...el.children].filter(c => c.tagName === tag) : [];
  const kid = (el, tag) => kids(el, tag)[0] || null;
  const txt = (el, tag, d = '') => { const k = kid(el, tag); return k ? k.textContent.trim() : d; };

  function Partitura(xmlText, env) {
    env = env || {};
    const Parser = env.DOMParser || root.DOMParser, Ser = env.XMLSerializer || root.XMLSerializer;
    this._ser = new Ser();
    this.doc = new Parser().parseFromString(xmlText, 'application/xml');
    if (this.doc.getElementsByTagName('parsererror').length) throw new Error('MusicXML inválido');
    this.normalize();
  }
  const P = Partitura.prototype;

  P.parts = function () {
    const list = [...this.doc.getElementsByTagName('score-part')];
    return [...this.doc.getElementsByTagName('part')].map((p, i) => {
      const sp = list.find(x => x.getAttribute('id') === p.getAttribute('id')) || list[i];
      return { i, id: p.getAttribute('id'), name: sp ? txt(sp, 'part-name', `Parte ${i + 1}`) : `Parte ${i + 1}`, el: p };
    });
  };
  P.measures = function (pi) { return kids(this.parts()[pi].el, 'measure'); };
  P.measure = function (pi, num) { return this.measures(pi).find(m => m.getAttribute('number') === String(num)) || null; };

  // one unit for all durations (24 per quarter)
  P.normalize = function () {
    for (const part of this.doc.getElementsByTagName('part')) {
      let div = 1, fifths = null;
      for (const m of kids(part, 'measure')) {
        // a key signature that repeats the one in force (left over from reading a PDF) is noise on the page
        for (const at of kids(m, 'attributes')) for (const k of kids(at, 'key')) {
          const f = parseInt(txt(k, 'fifths', '0')) || 0;
          if (fifths !== null && f === fifths) k.remove(); else fifths = f;
        }
        for (const el of m.getElementsByTagName('*')) {
          if (el.tagName === 'divisions') { div = Math.max(1, parseFloat(el.textContent) || 1); el.textContent = String(DIV); }
          else if (el.tagName === 'duration') el.textContent = String(Math.round(parseFloat(el.textContent || '0') * DIV / div));
        }
      }
    }
  };

  // bar length (quarters) and key (fifths) in force at a bar of a part
  P.context = function (pi, num) {
    let beats = 4, type = 4, fifths = 0;
    for (const m of this.measures(pi)) {
      for (const at of kids(m, 'attributes')) {
        const t = kid(at, 'time'); if (t && txt(t, 'beats')) { beats = parseInt(txt(t, 'beats')) || beats; type = parseInt(txt(t, 'beat-type')) || type; }
        const k = kid(at, 'key'); if (k && txt(k, 'fifths') !== '') fifths = parseInt(txt(k, 'fifths')) || 0;
      }
      if (m.getAttribute('number') === String(num)) break;
    }
    return { len: beats * 4 / type, beats, type, fifths };
  };

  // dynamics a bar can carry (written as a word before the note: "mf D5:1"); hairpins: cresc / dim start one, fim ends it
  const DYNS = ['pppp', 'ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff', 'ffff', 'sf', 'sfz', 'sffz', 'sfp', 'fp', 'fz', 'rf', 'rfz'];
  const WEDGE = { crescendo: 'cresc', diminuendo: 'dim', stop: 'fim' };
  // a direction that is only a dynamic and/or a hairpin (these are what the token language rewrites)
  const dynDir = d => {
    const types = kids(d, 'direction-type'); if (!types.length) return null;
    const out = [];
    for (const t of types) for (const c of t.children) {
      if (c.tagName === 'dynamics') { const k = c.children[0]; if (k && DYNS.includes(k.tagName)) out.push(k.tagName); else return null; }
      else if (c.tagName === 'wedge' && WEDGE[c.getAttribute('type')]) out.push(WEDGE[c.getAttribute('type')]);
      else return null;
    }
    return out;
  };

  // bar -> events (voice 1): [{pitches: ['D5','F#5'], dur, rest, arts: '>', tie, pre: ['mf', 'cresc'], slur: ')(', fermata}]
  // the list also carries .tail: marks after the last note (ex.: a hairpin that ends at the barline)
  P.events = function (pi, num) {
    const m = this.measure(pi, num); if (!m) return null;
    const out = []; let pre = [];
    for (const n of m.children) {
      if (n.tagName === 'direction') {
        const v = txt(n, 'voice', '1'); const ds = v === '1' ? dynDir(n) : null;
        if (ds) pre.push(...ds);
        continue;
      }
      if (n.tagName !== 'note') continue;
      if (txt(n, 'voice', '1') !== '1' || kid(n, 'grace')) continue;
      const dur = (parseInt(txt(n, 'duration', '0')) || 0) / DIV;
      const pitch = kid(n, 'pitch');
      const name = pitch ? txt(pitch, 'step') + ({ '-2': 'bb', '-1': 'b', '1': '#', '2': '##' }[String(Math.round(parseFloat(txt(pitch, 'alter', '0'))))] || '') + txt(pitch, 'octave') : null;
      const tie = kids(n, 'tie').some(t => t.getAttribute('type') === 'start');
      let arts = '', slur = '', fermata = false;
      for (const not of kids(n, 'notations')) {
        const ar = kid(not, 'articulations');
        if (ar) for (const [sym, tag] of Object.entries(ARTS)) if (kid(ar, tag) && !arts.includes(sym)) arts += sym;
        const sl = kids(not, 'slur');
        if (sl.some(s => s.getAttribute('type') === 'stop')) slur += ')';
        if (sl.some(s => s.getAttribute('type') === 'start')) slur += '(';
        if (kid(not, 'fermata')) fermata = true;
      }
      if (kid(n, 'chord') && out.length) { const last = out[out.length - 1]; if (name) last.pitches.push(name); continue; }
      const ev = { pitches: name ? [name] : [], dur, rest: !pitch, arts, tie, pre, slur, fermata };
      out.push(ev); pre = [];
    }
    out.tail = pre;
    return out;
  };
  P.voices = function (pi, num) { const m = this.measure(pi, num); return m ? new Set(kids(m, 'note').map(n => txt(n, 'voice', '1'))).size : 0; };

  // durations: quarters, as a decimal (0.5, 1.5) or, inside triplets/sextuplets, as a fraction (1/3, 2/3, 1/6)
  const fmt = x => {
    const u = Math.round(x * DIV);
    if (Math.abs(u - x * DIV) < 1e-6 && u % 3 !== 0) { const g = (a, b) => b ? g(b, a % b) : a, k = g(u, DIV); return (u / k) + '/' + (DIV / k); }
    return String(Math.round(x * 1000) / 1000);
  };
  Partitura.fmtDur = fmt;
  // one event -> its token ("mf cresc D5:1>(")
  const tokenOf = e => [...(e.pre || []), (e.rest ? 'R' : e.pitches.join('+')) + ':' + fmt(e.dur) + (e.arts || '') + (e.fermata ? '@' : '') + (e.slur || '') + (e.tie ? '~' : '')].join(' ');
  const joinTokens = list => list.map(tokenOf).concat(list.tail || []).join(' ');
  Partitura.tokenOf = tokenOf; Partitura.joinTokens = joinTokens;
  P.tokens = function (pi, num) {
    const ev = this.events(pi, num); if (!ev) return null;
    return joinTokens(ev);
  };

  function parseTokens(s) {
    const out = []; let pre = [];
    for (const t0 of String(s || '').trim().split(/\s+/).filter(Boolean)) {
      const t = t0.replace(/:(\d+)\/(\d+)/, ':$1/$2');
      const w = t.toLowerCase();
      if (DYNS.includes(w) || ['cresc', 'dim', 'fim'].includes(w)) { pre.push(w); continue; }
      const m = /^(R|[A-G](?:##|bb|#|b)?-?\d(?:\+[A-G](?:##|bb|#|b)?-?\d)*):(\d+(?:\.\d+)?(?:\/\d+)?)([>.\-^~()@]*)$/.exec(t);
      if (!m) throw new Error(`não entendi "${t0}"`);
      const [a, b] = m[2].split('/'); let dur = parseFloat(a) / (b ? parseFloat(b) : 1);
      // 0.333 / 0.667 (a triplet written as a decimal) snap to the score's grid
      const u = Math.round(dur * DIV); if (Math.abs(u - dur * DIV) < 0.05) dur = u / DIV;
      if (!(dur > 0)) throw new Error(`duração inválida em "${t0}"`);
      const mk = m[3];
      out.push({ rest: m[1] === 'R', pitches: m[1] === 'R' ? [] : m[1].split('+'), dur, arts: mk.replace(/[~()@]/g, ''), tie: mk.includes('~'),
        pre, slur: (mk.includes(')') ? ')' : '') + (mk.includes('(') ? '(' : ''), fermata: mk.includes('@') });
      pre = [];
    }
    out.tail = pre;
    return out;
  }
  Partitura.parseTokens = parseTokens;

  // a duration -> pieces that have a note type (2.5 -> 2 + 0.5 tied)
  function pieces(d) {
    const out = []; let left = d;
    while (left > 1e-6) {
      let found = null;
      for (const [q, t] of TYPES) { for (const dots of [2, 1, 0]) { const v = q * (dots === 2 ? 1.75 : dots === 1 ? 1.5 : 1); if (v <= left + 1e-6) { found = { q: v, type: t, dots }; break; } } if (found) break; }
      if (!found) found = { q: left, type: '32nd', dots: 0 };
      out.push(found); left -= found.q;
    }
    return out;
  }
  // a triplet value (1/3, 2/3, 1/6...) is written as the binary value 3/2 longer, with 3:2 time-modification
  const isTriplet = d => Math.round(d * DIV) % 3 !== 0;

  // rewrite voice 1 of one bar; everything else in the bar (attributes, text, rehearsal marks, barlines, harmony) stays.
  // The bar's dynamics and hairpins are part of the tokens, so they are rewritten too.
  P.setTokens = function (pi, num, tokenStr) {
    const m = this.measure(pi, num); if (!m) throw new Error(`não achei o compasso ${num}`);
    if (this.voices(pi, num) > 1) throw new Error(`o compasso ${num} tem mais de uma voz; edite pelo MuseScore`);
    const ev = parseTokens(tokenStr), { len } = this.context(pi, num);
    const units = ev.reduce((t, e) => t + Math.round(e.dur * DIV), 0);
    if (units !== Math.round(len * DIV)) throw new Error(`o compasso ${num} tem ${fmt(len)} tempos e a correção soma ${fmt(units / DIV)}`);
    const d = this.doc, mk = (tag, text, attrs) => { const e = d.createElement(tag); if (text != null) e.textContent = text; for (const k in (attrs || {})) e.setAttribute(k, attrs[k]); return e; };
    const dirOf = w => {
      const dir = mk('direction', null, { placement: 'below' }), dt = mk('direction-type');
      if (DYNS.includes(w)) { const dy = mk('dynamics'); dy.append(mk(w)); dt.append(dy); }
      else dt.append(mk('wedge', null, { type: { cresc: 'crescendo', dim: 'diminuendo', fim: 'stop' }[w] }));
      dir.append(dt);
      if (DYNS.includes(w)) { const snd = mk('sound', null, { dynamics: String({ pppp: 10, ppp: 20, pp: 35, p: 50, mp: 65, mf: 80, f: 95, ff: 110, fff: 125, ffff: 140 }[w] || 100) }); dir.append(snd); }
      return dir;
    };
    const old = kids(m, 'note').concat(kids(m, 'backup'), kids(m, 'forward'), kids(m, 'direction').filter(x => dynDir(x)));
    const anchor = kids(m, 'note')[0] || null;
    // tie into this bar from the previous one
    let tiedIn = new Set();
    const prev = this.measures(pi)[this.measures(pi).indexOf(m) - 1];
    if (prev) { const pe = this.events(pi, prev.getAttribute('number')); const last = pe && pe[pe.length - 1]; if (last && last.tie) tiedIn = new Set(last.pitches); }
    const notes = [];
    let tup = null;   // open triplet bracket: {units, heads}
    // close the bracket on its last note; a group of eighths or shorter (no rests) is beamed together
    const closeTup = () => {
      const hs = tup.heads, last = hs[hs.length - 1].h;
      last.getElementsByTagName('notations')[0].append(mk('tuplet', null, { type: 'stop' }));
      if (hs.length > 1 && hs.every(x => !x.rest && ['eighth', '16th', '32nd'].includes(txt(x.h, 'type')))) {
        hs.forEach((x, k) => x.h.insertBefore(mk('beam', k === 0 ? 'begin' : k === hs.length - 1 ? 'end' : 'continue', { number: '1' }), kid(x.h, 'notations')));
      }
      tup = null;
    };
    ev.forEach((e, ei) => {
      for (const w of e.pre || []) notes.push(dirOf(w));
      const trip = isTriplet(e.dur);
      const ps = trip ? pieces(e.dur * 3 / 2).map(p => ({ ...p, real: p.q * 2 / 3 })) : pieces(e.dur).map(p => ({ ...p, real: p.q }));
      const heads = [];   // first note element (not chord) of each piece
      ps.forEach((pc, k) => {
        const lastPiece = k === ps.length - 1;
        (e.rest ? [null] : e.pitches).forEach((name, j) => {
          const n = mk('note');
          if (j > 0) n.append(mk('chord'));
          if (!name) n.append(mk('rest'));
          else {
            const pm = /^([A-G])(##|bb|#|b)?(-?\d)$/.exec(name);
            const p = mk('pitch'); p.append(mk('step', pm[1]));
            const alt = { '#': 1, '##': 2, b: -1, bb: -2 }[pm[2] || ''] || 0; if (alt) p.append(mk('alter', String(alt)));
            p.append(mk('octave', pm[3])); n.append(p);
          }
          n.append(mk('duration', String(Math.round(pc.real * DIV))));
          const stop = name && ((k > 0) || (ei === 0 && k === 0 && tiedIn.has(name)) || (k === 0 && ei > 0 && ev[ei - 1].tie && ev[ei - 1].pitches.includes(name)));
          const start = name && (!lastPiece || e.tie);
          if (stop) n.append(mk('tie', null, { type: 'stop' }));
          if (start) n.append(mk('tie', null, { type: 'start' }));
          n.append(mk('voice', '1'));
          n.append(mk('type', pc.type)); for (let x = 0; x < pc.dots; x++) n.append(mk('dot'));
          if (trip) { const tm = mk('time-modification'); tm.append(mk('actual-notes', '3'), mk('normal-notes', '2')); n.append(tm); }
          const nots = [];
          if (stop) nots.push(mk('tied', null, { type: 'stop' }));
          if (start) nots.push(mk('tied', null, { type: 'start' }));
          if (j === 0) {
            if (k === 0 && e.slur.includes(')')) nots.push(mk('slur', null, { type: 'stop', number: '1' }));
            if (k === 0 && e.slur.includes('(')) nots.push(mk('slur', null, { type: 'start', number: '1', placement: 'above' }));
            if (lastPiece && e.fermata) nots.push(mk('fermata', null, { type: 'upright' }));
          }
          if (name && k === 0 && j === 0 && e.arts) {
            const ar = mk('articulations'); for (const ch of e.arts) if (ARTS[ch]) ar.append(mk(ARTS[ch])); nots.push(ar);
          }
          if (nots.length || (trip && j === 0)) { const no = mk('notations'); nots.forEach(x => no.append(x)); n.append(no); }
          if (j === 0) heads.push(n);
          notes.push(n);
        });
      });
      // triplet brackets: open on the first triplet note, close when the group adds up to a plain value (1/3+1/3+1/3 = 1)
      if (trip) {
        if (!tup) { tup = { units: 0, heads: [] }; heads[0].getElementsByTagName('notations')[0].append(mk('tuplet', null, { type: 'start', bracket: 'yes' })); }
        tup.units += Math.round(e.dur * DIV); tup.heads.push(...heads.map(h => ({ h, rest: e.rest })));
        if (tup.units % 3 === 0) closeTup();
      } else if (tup) closeTup();
    });
    if (tup) closeTup();
    for (const w of ev.tail || []) notes.push(dirOf(w));
    // the new notes go where the old ones were (after the bar's attributes, before its closing barline)
    const before = anchor || kids(m, 'barline').find(b => b.getAttribute('location') === 'right') || null;
    notes.forEach(n => before ? m.insertBefore(n, before) : m.append(n));
    old.forEach(o => o.remove());
    return this;
  };

  // what else a bar shows besides the notes (read-only for now): text, rehearsal mark, tempo, repeats and endings
  P.barInfo = function (pi, num) {
    const m = this.measure(pi, num); if (!m) return null;
    const out = {};
    const words = [], marks = [];
    for (const d of kids(m, 'direction')) {
      for (const w of d.getElementsByTagName('words')) if (w.textContent.trim()) words.push(w.textContent.trim());
      for (const r of d.getElementsByTagName('rehearsal')) if (r.textContent.trim()) marks.push(r.textContent.trim());
      const mt = d.getElementsByTagName('metronome')[0], snd = kid(d, 'sound');
      if (mt && txt(mt, 'per-minute')) out.andamento = txt(mt, 'beat-unit') + ' = ' + txt(mt, 'per-minute');
      else if (snd && snd.getAttribute('tempo')) out.andamento = 'semínima = ' + Math.round(parseFloat(snd.getAttribute('tempo')));
    }
    if (words.length) out.textos = words;
    if (marks.length) out.ensaio = marks.join(' ');
    for (const b of kids(m, 'barline')) {
      const r = kid(b, 'repeat'); if (r) out[r.getAttribute('direction') === 'forward' ? 'repete_daqui' : 'volta_ao_inicio'] = true;
      const e = kid(b, 'ending'); if (e && e.getAttribute('type') === 'start') out.casa = e.getAttribute('number');
      const st = txt(b, 'bar-style'); if (st === 'light-light') out.barra_dupla = true; if (st === 'light-heavy') out.barra_final = true;
    }
    return out;
  };
  // bars whose notes don't fill the time signature (voice 1), for every part. A bar that is short in every part
  // (a pickup) is fine. Returns [{pi, num, tem, deveria}] in quarters, plus the bars with more than one voice.
  P.checkBars = function () {
    const parts = this.parts(), byNum = {}, voices = [];
    for (const p of parts) for (const m of this.measures(p.i)) {
      const num = m.getAttribute('number');
      const u = kids(m, 'note').filter(n => txt(n, 'voice', '1') === '1' && !kid(n, 'chord') && !kid(n, 'grace')).reduce((t, n) => t + (parseInt(txt(n, 'duration', '0')) || 0), 0);
      const len = Math.round(this.context(p.i, num).len * DIV);
      (byNum[num] = byNum[num] || []).push({ pi: p.i, num, u, len, chart: false });
      if (this.voices(p.i, num) > 1) voices.push({ pi: p.i, num });
    }
    const out = [];
    for (const list of Object.values(byNum)) {
      const off = list.filter(x => x.u !== x.len && x.u > 0);
      const allShortSame = list.every(x => x.u === list[0].u) && list[0].u < list[0].len;  // a pickup bar
      if (allShortSame) continue;
      for (const x of off) out.push({ pi: x.pi, num: x.num, tem: fmt(x.u / DIV), deveria: fmt(x.len / DIV) });
    }
    return { compassos: out, duasVozes: voices };
  };

  // pitch helpers (written pitch); spelling follows the key: flats in flat keys, sharps otherwise
  const midiOf = name => { const m = /^([A-G])(##|bb|#|b)?(-?\d)$/.exec(name); return PC[m[1]] + ({ '#': 1, '##': 2, b: -1, bb: -2 }[m[2] || ''] || 0) + 12 * (parseInt(m[3]) + 1); };
  const nameOf = (midi, fifths) => { const nm = (fifths < 0 ? FLAT_NAMES : SHARP_NAMES)[((midi % 12) + 12) % 12]; return nm + (Math.floor(midi / 12) - 1); };
  Partitura.midiOf = midiOf; Partitura.nameOf = nameOf;

  // transpose a stretch (bars a..b, one part or all) by semitones, re-spelled in the key
  P.transpose = function (semis, a, b, pi) {
    const parts = (pi == null ? this.parts().map(p => p.i) : [pi]).filter(p => !this.isChart(p));   // the Base's slashes don't move
    for (const p of parts) for (const m of this.measures(p)) {
      const num = parseInt(m.getAttribute('number')); if (num < a || num > b || this.voices(p, num) > 1) continue;
      const { fifths } = this.context(p, num);
      const ev = this.events(p, num); if (!ev || ev.every(e => e.rest)) continue;
      const moved = ev.map(e => ({ ...e, pitches: e.pitches.map(x => nameOf(midiOf(x) + semis, fifths)) })); moved.tail = ev.tail;
      this.setTokens(p, num, joinTokens(moved));
    }
    return this;
  };

  // a dynamic mark (p, mf, f, ff, sfz...) before the event at index idx of a bar
  P.setDynamic = function (pi, num, idx, mark) {
    const m = this.measure(pi, num); if (!m) return this;
    const notes = kids(m, 'note').filter(n => txt(n, 'voice', '1') === '1' && !kid(n, 'chord'));
    const target = notes[idx] || notes[0];
    for (const d of kids(m, 'direction')) if (d.getElementsByTagName('dynamics').length && d.nextElementSibling === target) d.remove();
    if (!mark) return this;
    const d = this.doc.createElement('direction'); d.setAttribute('placement', 'below');
    const dt = this.doc.createElement('direction-type'), dy = this.doc.createElement('dynamics'); dy.append(this.doc.createElement(mark));
    dt.append(dy); d.append(dt);
    target ? m.insertBefore(d, target) : m.append(d);
    return this;
  };

  // bars where a part plays nothing, grouped: [{from, to, bars}] (for counting rests while following the DAW)
  P.restSpans = function (pi, minBars = 4) {
    const out = []; let cur = null;
    for (const m of this.measures(pi)) {
      const num = parseInt(m.getAttribute('number'));
      const silent = kids(m, 'note').every(n => !kid(n, 'pitch'));
      if (silent) { if (cur && cur.to === num - 1) cur.to = num; else { cur = { from: num, to: num }; out.push(cur); } }
      else cur = null;
    }
    return out.map(s => ({ ...s, bars: s.to - s.from + 1 })).filter(s => s.bars >= minBars);
  };

  // just one part (to draw a musician's part), long rests drawn as one bar with the count on top; MusicXML text
  P.onlyPart = function (pi, opts = {}) {
    const clone = this.doc.cloneNode(true);
    const parts = [...clone.getElementsByTagName('part')], sps = [...clone.getElementsByTagName('score-part')];
    parts.forEach((p, i) => { if (i !== pi) p.remove(); });
    sps.forEach((sp, i) => { if (i !== pi) sp.remove(); });
    for (const g of [...clone.getElementsByTagName('part-group')]) g.remove();
    if (opts.multirest !== false) multiRests(clone, clone.getElementsByTagName('part')[0]);
    return this._ser.serializeToString(clone);
  };
  // consecutive silent bars -> <multiple-rest>N, broken where the reader needs to see something
  // (a new time or key signature, a rehearsal mark or text, a repeat or double bar)
  function multiRests(doc, part) {
    const ms = kids(part, 'measure');
    const silent = m => kids(m, 'note').every(n => !kid(n, 'pitch'));
    const breaksBefore = m => kids(m, 'attributes').some(a => kid(a, 'time') || kid(a, 'key') || kid(a, 'clef')) ||
      kids(m, 'direction').some(d => d.getElementsByTagName('rehearsal').length || d.getElementsByTagName('words').length) ||
      kids(m, 'barline').some(b => kid(b, 'repeat') && kid(b, 'repeat').getAttribute('direction') === 'forward' || kid(b, 'ending'));
    const breaksAfter = m => kids(m, 'barline').some(b => kid(b, 'repeat') || ['light-light', 'light-heavy'].includes(txt(b, 'bar-style')) || kid(b, 'ending'));
    let i = 0;
    while (i < ms.length) {
      if (!silent(ms[i])) { i++; continue; }
      let j = i;
      while (j + 1 < ms.length && silent(ms[j + 1]) && !breaksAfter(ms[j]) && !breaksBefore(ms[j + 1])) j++;
      const n = j - i + 1;
      if (n >= 2) {
        let at = kid(ms[i], 'attributes');
        if (!at) { at = doc.createElement('attributes'); ms[i].insertBefore(at, ms[i].firstElementChild); }
        const st = doc.createElement('measure-style'), mr = doc.createElement('multiple-rest'); mr.textContent = String(n);
        st.append(mr); at.append(st);
      }
      i = j + 1;
    }
  }
  P.toString = function () { return this._ser.serializeToString(this.doc); };

  /* ---------- chord symbols (the band's chart part, or over any part) ---------- */
  // "Bbm7", "F#7(#9)", "Am7/G", "Cº" -> MusicXML <harmony>; the text is kept exactly as written
  const KINDS = [[/^(maj7|7M|Δ7?)$/, 'major-seventh'], [/^(m7b5|ø7?)$/, 'half-diminished'], [/^(dim7|º7|°7)$/, 'diminished-seventh'],
    [/^(dim|º|°)$/, 'diminished'], [/^(m|min|-)$/, 'minor'], [/^(m7|min7|-7)$/, 'minor-seventh'], [/^(m6)$/, 'minor-sixth'],
    [/^(m9)$/, 'minor-ninth'], [/^(m11)$/, 'minor-11th'], [/^(maj9)$/, 'major-ninth'], [/^6$/, 'major-sixth'], [/^7$/, 'dominant'],
    [/^9$/, 'dominant-ninth'], [/^11$/, 'dominant-11th'], [/^13$/, 'dominant-13th'], [/^(\+|aug)$/, 'augmented'],
    [/^sus4?$/, 'suspended-fourth'], [/^sus2$/, 'suspended-second'], [/^$/, 'major']];
  function chordParts(sym) {
    const m = /^([A-G])([b#]?)(.*?)(?:\/([A-G])([b#]?))?$/.exec(String(sym || '').trim());
    if (!m) throw new Error(`não entendi a cifra "${sym}"`);
    const suffix = m[3], core = suffix.replace(/\(.*\)$/, '').replace(/^(.*?)(7?)(b5|#5|b9|#9|#11|b13|add9)+$/, '$1$2');
    const bare = suffix.replace(/[()]/g, '');
    const kind = (KINDS.find(([rx]) => rx.test(bare)) || KINDS.find(([rx]) => rx.test(core)) || KINDS.find(([rx]) => rx.test(core.replace(/\D+$/, ''))) || [0, core.startsWith('m') ? 'minor-seventh' : 'dominant'])[1];
    return { step: m[1], alter: m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0, suffix, kind, bass: m[4] ? { step: m[4], alter: m[5] === 'b' ? -1 : m[5] === '#' ? 1 : 0 } : null };
  }
  Partitura.chordParts = chordParts;
  const KIND_SUFFIX = { major: '', minor: 'm', augmented: '+', diminished: 'dim', dominant: '7', 'major-seventh': 'maj7', 'minor-seventh': 'm7', 'diminished-seventh': 'dim7', 'augmented-seventh': '+7', 'half-diminished': 'm7b5', 'major-minor': 'm(maj7)', 'major-sixth': '6', 'minor-sixth': 'm6', 'dominant-ninth': '9', 'major-ninth': 'maj9', 'minor-ninth': 'm9', 'dominant-11th': '11', 'major-11th': 'maj11', 'minor-11th': 'm11', 'dominant-13th': '13', 'major-13th': 'maj13', 'minor-13th': 'm13', 'suspended-second': 'sus2', 'suspended-fourth': 'sus4', power: '5' };
  // chord symbols written in a bar: [{beat (quarters from the start), text}]
  P.chords = function (pi, num) {
    const m = this.measure(pi, num); if (!m) return [];
    const out = []; let pos = 0;
    for (const c of [...m.children]) {
      if (c.tagName === 'harmony') {
        const r = kid(c, 'root'), b = kid(c, 'bass'), k = kid(c, 'kind');
        const nm = (st, al) => st + (al === '-1' ? 'b' : al === '1' ? '#' : '');
        const off = parseInt(txt(c, 'offset', '0')) || 0;
        out.push({ beat: (pos + off) / DIV, text: nm(txt(r, 'root-step'), txt(r, 'root-alter')) + (k ? (k.getAttribute('text') ?? KIND_SUFFIX[k.textContent.trim()] ?? '') : '') + (b ? '/' + nm(txt(b, 'bass-step'), txt(b, 'bass-alter')) : '') });
      } else if (c.tagName === 'note' && !kid(c, 'chord')) pos += parseInt(txt(c, 'duration', '0')) || 0;
      else if (c.tagName === 'backup') pos -= parseInt(txt(c, 'duration', '0')) || 0;
      else if (c.tagName === 'forward') pos += parseInt(txt(c, 'duration', '0')) || 0;
    }
    return out;
  };
  // replace the chord symbols of a bar: "Am7" (whole bar) or "Am7 D7" (spread evenly) or "Am7:3 D7:1" (beats each)
  P.setChords = function (pi, num, text) {
    const m = this.measure(pi, num); if (!m) throw new Error(`o compasso ${num} não existe`);
    const { len } = this.context(pi, num);
    const items = String(text || '').trim().split(/\s+/).filter(Boolean).map(t => { const [c, d] = t.split(':'); return { c, d: d ? parseFloat(d) : null }; });
    const given = items.filter(x => x.d).reduce((a, x) => a + x.d, 0), free = items.filter(x => !x.d).length;
    let at = 0; const placed = items.map(x => { const r = { c: x.c, beat: at }; at += x.d || (len - given) / Math.max(1, free); return r; });
    if (at > len + 1e-6) throw new Error(`as cifras somam ${at} tempos e o compasso tem ${len}`);
    const parsed = placed.map(x => ({ ...x, p: chordParts(x.c) }));  // all or nothing
    for (const h of kids(m, 'harmony')) h.remove();
    const doc = this.doc, mk = (tag, t) => { const e = doc.createElement(tag); if (t != null) e.textContent = String(t); return e; };
    // put each <harmony> right before the note that starts at (or covers) its beat, with an offset for the rest
    const notes = kids(m, 'note'); let pos = 0; const starts = [];
    for (const n of notes) { if (kid(n, 'chord')) continue; if (txt(n, 'voice', '1') !== '1') continue; starts.push([pos, n]); pos += parseInt(txt(n, 'duration', '0')) || 0; }
    for (const { beat, p } of parsed) {
      const h = doc.createElement('harmony'), r = mk('root');
      r.append(mk('root-step', p.step)); if (p.alter) r.append(mk('root-alter', p.alter)); h.append(r);
      const k = mk('kind', p.kind); k.setAttribute('text', p.suffix); h.append(k);
      if (p.bass) { const b = mk('bass'); b.append(mk('bass-step', p.bass.step)); if (p.bass.alter) b.append(mk('bass-alter', p.bass.alter)); h.append(b); }
      const t = Math.round(beat * DIV); let host = null, hostAt = 0;
      for (const [s, n] of starts) if (s <= t) { host = n; hostAt = s; }
      if (t - hostAt) h.append(mk('offset', t - hostAt));
      if (host) m.insertBefore(h, host); else m.append(h);
    }
  };

  /* ---------- a new score from nothing ---------- */
  // instruments the app knows how to write for (written pitch; transpose = what sounds)
  Partitura.INSTRUMENTOS = [
    { key: 'trompete', nome: 'Trompete em B♭', abrev: 'Tpt.', clef: 'G', tr: [-1, -2] },
    { key: 'sax-alto', nome: 'Sax Alto', abrev: 'A. Sax', clef: 'G', tr: [-5, -9] },
    { key: 'sax-tenor', nome: 'Sax Tenor', abrev: 'T. Sax', clef: 'G', tr: [-8, -14] },
    { key: 'trombone', nome: 'Trombone', abrev: 'Tbn.', clef: 'F' },
    { key: 'flauta', nome: 'Flauta', abrev: 'Fl.', clef: 'G' },
    { key: 'violino', nome: 'Violino', abrev: 'Vln.', clef: 'G' },
    { key: 'acordeon', nome: 'Acordeon', abrev: 'Acd.', clef: 'G' },
    { key: 'voz', nome: 'Voz', abrev: 'Vz.', clef: 'G' },
    { key: 'guitarra', nome: 'Guitarra', abrev: 'Gt.', clef: 'G', tr: [-7, -12] },
    { key: 'baixo', nome: 'Baixo', abrev: 'Bx.', clef: 'F', tr: [-7, -12] },
    { key: 'base', nome: 'Base', abrev: 'Base', clef: 'G', cifra: true },
  ];
  // opts: {titulo, instrumentos: [keys], formula: '4/4', fifths, compassos, bpm}
  Partitura.blank = function (opts) {
    const [beats, type] = String(opts.formula || '4/4').split('/').map(Number);
    const len = beats * 4 / type, bars = Math.max(1, Math.min(400, opts.compassos | 0 || 32)), fifths = opts.fifths | 0;
    const list = (opts.instrumentos || []).map(k => Partitura.INSTRUMENTOS.find(x => x.key === k)).filter(Boolean);
    if (!list.length) throw new Error('escolha pelo menos um instrumento');
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const rest = `<note><rest measure="yes"/><duration>${len * DIV}</duration><voice>1</voice></note>`;
    // slashes sit on the middle line (B4), spelled as the key spells B so no accidental is drawn
    const slashes = f => Array.from({ length: beats }, () => `<note><pitch><step>B</step>${f <= -1 ? '<alter>-1</alter>' : f >= 7 ? '<alter>1</alter>' : ''}<octave>4</octave></pitch><duration>${len * DIV / beats}</duration><voice>1</voice><type>${type === 8 ? 'eighth' : type === 2 ? 'half' : 'quarter'}</type><stem>none</stem><notehead>slash</notehead></note>`).join('');
    const parts = list.map((ins, i) => {
      // a transposing instrument shows its own key signature
      const f = ins.tr ? ((fifths - ins.tr[1] * 7) % 12 + 12 + 6) % 12 - 6 : fifths;
      const clef = ins.clef === 'F' ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
      const tr = ins.tr ? `<transpose><diatonic>${ins.tr[0]}</diatonic><chromatic>${ins.tr[1]}</chromatic></transpose>` : '';
      let ms = '';
      for (let n = 1; n <= bars; n++) {
        const attrs = n === 1 ? `<attributes><divisions>${DIV}</divisions><key><fifths>${f}</fifths></key><time><beats>${beats}</beats><beat-type>${type}</beat-type></time>${clef}${tr}</attributes>` : '';
        const tempo = n === 1 && i === 0 && opts.bpm ? `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${opts.bpm | 0}</per-minute></metronome></direction-type><sound tempo="${opts.bpm | 0}"/></direction>` : '';
        ms += `<measure number="${n}">${attrs}${tempo}${ins.cifra ? slashes(f) : rest}</measure>`;
      }
      return { head: `<score-part id="P${i + 1}"><part-name>${esc(ins.nome)}</part-name><part-abbreviation>${esc(ins.abrev)}</part-abbreviation></score-part>`, body: `<part id="P${i + 1}">${ms}</part>` };
    });
    return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${esc(opts.titulo || 'Sem título')}</work-title></work>` +
      `<part-list>${parts.map(p => p.head).join('')}</part-list>${parts.map(p => p.body).join('')}</score-partwise>`;
  };

  /* ---------- a new instrument in an existing score ---------- */
  const normKey = f => ((f % 12) + 12 + 6) % 12 - 6;   // fifths in -6..5
  // the transposition in force at each bar of a part (chromatic semitones, written -> sounding)
  P.transposeOf = function (pi) {
    for (const m of this.measures(pi)) for (const at of kids(m, 'attributes')) { const t = kid(at, 'transpose'); if (t) return parseInt(txt(t, 'chromatic', '0')) || 0; }
    return 0;
  };
  // a part that is only chord symbols over slashes (the band's Base)
  P.isChart = function (pi) {
    const heads = this.measures(pi).flatMap(m => kids(m, 'note')).map(n => kid(n, 'notehead')).filter(Boolean);
    return heads.length > 0 && heads.every(h => h.textContent.trim() === 'slash');
  };
  /* add one of Partitura.INSTRUMENTOS as a new part, with the same bars, time and key changes (in its own written key),
     rehearsal marks and barlines as the score. opts: {copiarDe: index of a part whose notes it doubles at the same sound
     (transposed for the new instrument), oitava: -1|0|1, antes: index to insert before (default: end)}.
     Returns {pi, copiados, pulados}. */
  P.addPart = function (insKey, opts = {}) {
    const ins = Partitura.INSTRUMENTOS.find(x => x.key === insKey);
    if (!ins) throw new Error(`não conheço o instrumento "${insKey}"`);
    const parts = this.parts(); if (!parts.length) throw new Error('a partitura não tem nenhuma parte');
    const ref = parts.findIndex(p => !this.isChart(p.i)) >= 0 ? parts.findIndex(p => !this.isChart(p.i)) : 0;
    const refC = this.transposeOf(ref), newC = ins.tr ? ins.tr[1] : 0;
    const d = this.doc, mk = (tag, text) => { const e = d.createElement(tag); if (text != null) e.textContent = String(text); return e; };
    const used = new Set(parts.map(p => p.id)); let n = parts.length + 1; while (used.has('P' + n)) n++;
    const id = 'P' + n;
    const sp = d.createElement('score-part'); sp.setAttribute('id', id); sp.append(mk('part-name', ins.nome), mk('part-abbreviation', ins.abrev));
    const part = d.createElement('part'); part.setAttribute('id', id);
    let first = true, beats = 4, type = 4;
    for (const rm of this.measures(ref)) {
      const m = d.createElement('measure'); m.setAttribute('number', rm.getAttribute('number'));
      if (rm.getAttribute('implicit')) m.setAttribute('implicit', rm.getAttribute('implicit'));
      let key = null, time = null;
      for (const at of kids(rm, 'attributes')) {
        const k = kid(at, 'key'); if (k && txt(k, 'fifths') !== '') key = normKey((parseInt(txt(k, 'fifths')) || 0) + 7 * refC - 7 * newC);
        const t = kid(at, 'time'); if (t && txt(t, 'beats')) { beats = parseInt(txt(t, 'beats')) || beats; type = parseInt(txt(t, 'beat-type')) || type; time = t; }
      }
      if (first && key == null) key = normKey(7 * refC - 7 * newC);
      if (first || key != null || time) {
        const at = mk('attributes');
        if (first) at.append(mk('divisions', DIV));
        if (key != null) { const k = mk('key'); k.append(mk('fifths', key)); at.append(k); }
        if (time || first) { const t = mk('time'); t.append(mk('beats', beats), mk('beat-type', type)); at.append(t); }
        if (first) {
          const c = mk('clef'); c.append(mk('sign', ins.clef === 'F' ? 'F' : 'G'), mk('line', ins.clef === 'F' ? 4 : 2)); at.append(c);
          if (ins.tr) { const tr = mk('transpose'); tr.append(mk('diatonic', ins.tr[0]), mk('chromatic', ins.tr[1])); at.append(tr); }
        }
        m.append(at);
      }
      for (const dir of kids(rm, 'direction')) if (dir.getElementsByTagName('rehearsal').length) m.append(dir.cloneNode(true));
      // the bar's real length (a pickup bar is shorter than its time signature)
      const real = kids(rm, 'note').filter(x => txt(x, 'voice', '1') === '1' && !kid(x, 'chord') && !kid(x, 'grace')).reduce((s, x) => s + (parseInt(txt(x, 'duration', '0')) || 0), 0);
      const r = mk('note'), rest = mk('rest'); rest.setAttribute('measure', 'yes'); r.append(rest, mk('duration', real || Math.round(beats * 4 / type * DIV)), mk('voice', 1)); m.append(r);
      for (const bl of kids(rm, 'barline')) m.append(bl.cloneNode(true));
      part.append(m); first = false;
    }
    const at = opts.antes != null && parts[opts.antes] ? parts[opts.antes] : null;
    const sps = [...d.getElementsByTagName('score-part')], atSp = at && sps.find(x => x.getAttribute('id') === at.id);
    if (atSp) atSp.parentNode.insertBefore(sp, atSp); else d.getElementsByTagName('part-list')[0].append(sp);
    if (at) at.el.parentNode.insertBefore(part, at.el); else d.documentElement.append(part);
    const pi = this.parts().findIndex(p => p.id === id);
    let copiados = 0; const pulados = [];
    if (opts.copiarDe != null) {
      const src = opts.copiarDe >= pi ? opts.copiarDe + 1 : opts.copiarDe;   // the source moved down if we went in before it
      if (!this.parts()[src]) throw new Error('não achei a parte para copiar');
      if (this.isChart(src)) throw new Error('a parte de origem só tem cifras; escolha um instrumento com notas');
      const semis = this.transposeOf(src) - newC + 12 * (opts.oitava | 0);
      for (const sm of this.measures(src)) {
        const num = sm.getAttribute('number'), ev = this.events(src, num);
        if (!ev || ev.every(e => e.rest)) continue;
        const { fifths } = this.context(pi, num);
        const moved = ev.map(e => ({ ...e, pitches: e.pitches.map(x => nameOf(midiOf(x) + semis, fifths)) })); moved.tail = ev.tail;
        try { this.setTokens(pi, num, joinTokens(moved)); copiados++; }
        catch { if (this.copyBar(src, pi, num, semis)) copiados++; else pulados.push(num); }
      }
    }
    return { pi, id, copiados, pulados };
  };

  /* ---------- the song's structure (every part at once, so the score stays aligned) ---------- */
  const ATTR_ORDER = ['footnote', 'level', 'divisions', 'key', 'time', 'staves', 'part-symbol', 'instruments', 'clef', 'staff-details', 'transpose', 'directive', 'measure-style'];
  P._mk = function (tag, text, attrs) { const e = this.doc.createElement(tag); if (text != null) e.textContent = String(text); for (const k in (attrs || {})) e.setAttribute(k, attrs[k]); return e; };
  // put one child in a bar's <attributes> (created if needed), replacing the old one, in MusicXML order
  P._setAttr = function (m, el) {
    let at = kids(m, 'attributes')[0];
    if (!at) { at = this._mk('attributes'); const first = [...m.children].find(c => c.tagName !== 'print'); m.insertBefore(at, first || null); }
    for (const old of kids(at, el.tagName)) old.remove();
    const rank = ATTR_ORDER.indexOf(el.tagName);
    const after = [...at.children].find(c => ATTR_ORDER.indexOf(c.tagName) > rank);
    at.insertBefore(el, after || null);
  };
  P._firstNonAttr = function (m) { return [...m.children].find(c => !['attributes', 'print'].includes(c.tagName) && !(c.tagName === 'barline' && c.getAttribute('location') === 'left')) || null; };
  P._needBar = function (num) { if (!this.measure(0, num)) throw new Error(`não achei o compasso ${num}`); };

  // time signature from bar num on ("3/4", "6/8")
  P.setTime = function (num, formula) {
    const m = /^(\d+)\/(1|2|4|8|16|32)$/.exec(String(formula).trim()); if (!m) throw new Error(`fórmula "${formula}" não existe (ex.: 3/4, 6/8)`);
    this._needBar(num);
    for (const p of this.parts()) {
      const t = this._mk('time'); t.append(this._mk('beats', m[1]), this._mk('beat-type', m[2])); this._setAttr(this.measure(p.i, num), t);
      // bars with nothing written (rests, or the Base's slashes) take the new size by themselves, up to the next time change
      for (const mm of this.measures(p.i).filter(x => +x.getAttribute('number') >= +num)) {
        if (mm !== this.measure(p.i, num) && kids(mm, 'attributes').some(at => kid(at, 'time'))) break;
        this._refit(p.i, mm);
      }
    }
    return this;
  };
  // an empty bar (only rests, or only the Base's slashes) rebuilt to the length of its time signature
  P._refit = function (pi, m) {
    const num = m.getAttribute('number'), { len } = this.context(pi, num), full = Math.round(len * DIV);
    const notes = kids(m, 'note'); if (!notes.length || this.voices(pi, num) > 1) return;
    const chart = this.isChart(pi), rests = notes.every(n => kid(n, 'rest'));
    if (!rests && !chart) return;
    const have = notes.filter(n => !kid(n, 'chord')).reduce((t, n) => t + (parseInt(txt(n, 'duration', '0')) || 0), 0);
    if (have === full) return;
    const anchor = notes[0], out = [];
    if (rests) { const r = this._mk('note'); r.append(this._mk('rest', null, { measure: 'yes' }), this._mk('duration', full), this._mk('voice', '1')); out.push(r); }
    else {
      const model = notes.find(n => !kid(n, 'rest')) || notes[0];
      for (let left = full; left > 0; left -= DIV) {
        const c = model.cloneNode(true), d = Math.min(DIV, left);
        kid(c, 'duration').textContent = String(d);
        for (const t of ['tie', 'dot', 'time-modification', 'notations', 'lyric']) for (const y of kids(c, t)) y.remove();
        const ty = kid(c, 'type'); if (ty) ty.textContent = d === DIV ? 'quarter' : d === DIV / 2 ? 'eighth' : '16th';
        out.push(c);
      }
    }
    out.forEach(n => m.insertBefore(n, anchor));
    notes.forEach(n => n.remove());
  };
  // key from bar num on, given as the concert key ("Bb", "F#m", "Eb"); each part gets its written key
  const KEYS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 };
  Partitura.fifthsOf = name => {
    const m = /^([A-G](?:#|b)?)(m)?$/.exec(String(name).trim().replace('♭', 'b').replace('♯', '#')); if (!m) return null;
    const minorRel = { A: 'C', E: 'G', B: 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B', 'D#': 'F#', 'A#': 'C#', D: 'F', G: 'Bb', C: 'Eb', F: 'Ab', Bb: 'Db', Eb: 'Gb', Ab: 'Cb' };
    const maj = m[2] ? minorRel[m[1]] : m[1]; return maj in KEYS ? KEYS[maj] : null;
  };
  P.setKey = function (num, name) {
    const f = Partitura.fifthsOf(name); if (f == null) throw new Error(`tom "${name}" não existe (ex.: C, Bb, F#m)`);
    this._needBar(num);
    for (const p of this.parts()) {
      const k = this._mk('key'); k.append(this._mk('fifths', normKey(f - 7 * this.transposeOf(p.i))));
      if (/m$/.test(String(name).trim())) k.append(this._mk('mode', 'minor'));
      this._setAttr(this.measure(p.i, num), k);
    }
    return this;
  };
  // tempo mark (quarter = bpm) at the start of bar num, on the top part (the one the audio reads); 0 removes it
  P.setTempo = function (num, bpm, texto) {
    this._needBar(num); const m = this.measure(0, num);
    for (const d of kids(m, 'direction')) if (d.getElementsByTagName('metronome').length || (kid(d, 'sound') && kid(d, 'sound').getAttribute('tempo'))) d.remove();
    bpm = Math.round(+bpm); if (!bpm) return this;
    if (!(bpm >= 20 && bpm <= 400)) throw new Error('andamento fora do normal (20 a 400)');
    const d = this._mk('direction', null, { placement: 'above' });
    if (texto) { const dt = this._mk('direction-type'); dt.append(this._mk('words', texto, { 'font-weight': 'bold' })); d.append(dt); }
    const dt = this._mk('direction-type'), mt = this._mk('metronome'); mt.append(this._mk('beat-unit', 'quarter'), this._mk('per-minute', bpm)); dt.append(mt); d.append(dt);
    d.append(this._mk('sound', null, { tempo: String(bpm) }));
    m.insertBefore(d, this._firstNonAttr(m));
    return this;
  };
  // rehearsal letter ("A", "Refrão") at bar num in every part; empty removes it
  P.setRehearsal = function (num, texto) {
    this._needBar(num);
    for (const p of this.parts()) {
      const m = this.measure(p.i, num);
      for (const d of kids(m, 'direction')) if (d.getElementsByTagName('rehearsal').length) d.remove();
      if (!texto) continue;
      const d = this._mk('direction', null, { placement: 'above' }), dt = this._mk('direction-type');
      dt.append(this._mk('rehearsal', texto, { enclosure: 'square' })); d.append(dt);
      m.insertBefore(d, this._firstNonAttr(m));
    }
    return this;
  };
  // text over the staff ("solo", "só na 2ª vez") at bar num, in one part (pi) or all (pi null); empty removes the bar's texts
  P.setText = function (pi, num, texto) {
    this._needBar(num);
    for (const p of pi == null ? this.parts() : [this.parts()[pi]]) {
      const m = this.measure(p.i, num);
      for (const d of kids(m, 'direction')) {
        const types = kids(d, 'direction-type');
        if (types.length && types.every(t => [...t.children].every(c => c.tagName === 'words')) && !d.getElementsByTagName('metronome').length && !(kid(d, 'sound') && kid(d, 'sound').getAttribute('tempo'))) d.remove();
      }
      if (!texto) continue;
      const d = this._mk('direction', null, { placement: 'above' }), dt = this._mk('direction-type');
      dt.append(this._mk('words', texto)); d.append(dt);
      m.insertBefore(d, this._firstNonAttr(m));
    }
    return this;
  };
  // barlines in every part. tipo: inicio (start of a repeat), fim (go back to the start of the repeat), dupla, final,
  // casa1 / casa2 (1st / 2nd ending over bars num..ate), nada (plain barlines, removes repeats and endings there)
  P.setBarline = function (num, tipo, ate) {
    this._needBar(num); ate = ate || num; this._needBar(ate);
    const TIPOS = ['inicio', 'fim', 'dupla', 'final', 'casa1', 'casa2', 'nada'];
    if (!TIPOS.includes(tipo)) throw new Error(`barra "${tipo}" não existe (${TIPOS.join(', ')})`);
    const barOf = (m, loc) => {
      let b = kids(m, 'barline').find(x => (x.getAttribute('location') || 'right') === loc);
      if (!b) { b = this._mk('barline', null, { location: loc }); if (loc === 'left') m.insertBefore(b, [...m.children].find(c => !['attributes', 'print'].includes(c.tagName)) || null); else m.append(b); }
      return b;
    };
    const style = (b, s) => { for (const x of kids(b, 'bar-style')) x.remove(); if (s) b.insertBefore(this._mk('bar-style', s), b.firstElementChild); };
    const clean = b => { if (!b.children.length) b.remove(); };
    for (const p of this.parts()) {
      const m = this.measure(p.i, num), last = this.measure(p.i, ate);
      if (tipo === 'nada') { for (const mm of this.measures(p.i).filter(x => +x.getAttribute('number') >= +num && +x.getAttribute('number') <= +ate)) for (const b of kids(mm, 'barline')) b.remove(); continue; }
      if (tipo === 'inicio') { const b = barOf(m, 'left'); for (const x of kids(b, 'repeat')) x.remove(); style(b, 'heavy-light'); b.append(this._mk('repeat', null, { direction: 'forward' })); }
      if (tipo === 'fim') { const b = barOf(last, 'right'); for (const x of kids(b, 'repeat')) x.remove(); style(b, 'light-heavy'); b.append(this._mk('repeat', null, { direction: 'backward' })); }
      if (tipo === 'dupla' || tipo === 'final') { const b = barOf(last, 'right'); for (const x of kids(b, 'repeat')) x.remove(); style(b, tipo === 'dupla' ? 'light-light' : 'light-heavy'); }
      if (tipo === 'casa1' || tipo === 'casa2') {
        const n = tipo === 'casa1' ? '1' : '2';
        const bl = barOf(m, 'left'); for (const x of kids(bl, 'ending')) x.remove(); bl.append(this._mk('ending', n + '.', { number: n, type: 'start' }));
        const br = barOf(last, 'right'); for (const x of kids(br, 'ending')) x.remove();
        const e = this._mk('ending', null, { number: n, type: n === '1' ? 'stop' : 'discontinue' });
        const rep = kid(br, 'repeat'); rep ? br.insertBefore(e, rep) : br.append(e);
        if (n === '1' && !rep) { style(br, 'light-heavy'); br.append(this._mk('repeat', null, { direction: 'backward' })); }
      }
      for (const b of kids(m, 'barline').concat(kids(last, 'barline'))) clean(b);
    }
    return this;
  };
  // insert n empty bars after bar num, in every part (the Base keeps its slashes); later bars are renumbered
  P.insertBars = function (num, n) {
    n = n | 0; if (!(n >= 1 && n <= 64)) throw new Error('dá para pôr de 1 a 64 compassos por vez');
    this._needBar(num);
    for (const p of this.parts()) {
      const ref = this.measure(p.i, num), { len } = this.context(p.i, num), chart = this.isChart(p.i);
      const later = this.measures(p.i).filter(m => +m.getAttribute('number') > +num);
      for (const m of later) if (/^\d+$/.test(m.getAttribute('number'))) m.setAttribute('number', String(+m.getAttribute('number') + n));
      let at = ref.nextElementSibling;
      for (let k = 1; k <= n; k++) {
        const m = this._mk('measure', null, { number: String(+num + k) });
        if (chart) for (const x of kids(ref, 'note')) { const c = x.cloneNode(true); for (const t of ['lyric', 'tie']) for (const y of kids(c, t)) y.remove(); const no = kid(c, 'notations'); if (no) no.remove(); m.append(c); }
        else { const r = this._mk('note'); r.append(this._mk('rest', null, { measure: 'yes' }), this._mk('duration', Math.round(len * DIV)), this._mk('voice', '1')); m.append(r); }
        p.el.insertBefore(m, at);
      }
    }
    return this;
  };
  // remove bars a..b in every part; what was in force (time, key, clef) carries to the next bar; later bars renumbered
  P.deleteBars = function (a, b) {
    b = b || a; this._needBar(a); this._needBar(b);
    if (+b < +a) throw new Error('o primeiro compasso vem antes do último');
    const total = this.measures(0).length, n = +b - +a + 1;
    if (n >= total) throw new Error('não dá para apagar todos os compassos');
    for (const p of this.parts()) {
      const gone = this.measures(p.i).filter(m => +m.getAttribute('number') >= +a && +m.getAttribute('number') <= +b);
      const next = gone[gone.length - 1].nextElementSibling;
      if (next && next.tagName === 'measure') {   // carry the attributes that the next bar would lose
        const carry = {};
        for (const m of gone) for (const at of kids(m, 'attributes')) for (const c of at.children) carry[c.tagName] = c;
        const has = new Set(kids(next, 'attributes').flatMap(at => [...at.children].map(c => c.tagName)));
        for (const [tag, el] of Object.entries(carry)) if (!has.has(tag) && tag !== 'measure-style') this._setAttr(next, el.cloneNode(true));
      }
      gone.forEach(m => m.remove());
      for (const m of this.measures(p.i)) if (+m.getAttribute('number') > +b && /^\d+$/.test(m.getAttribute('number'))) m.setAttribute('number', String(+m.getAttribute('number') - n));
    }
    return this;
  };

  // one structure change as Caio proposes it: {acao, compasso, ate, quantos, valor, parte (index or null)}
  P.applyStructure = function (c, pi) {
    const v = String(c.valor == null ? '' : c.valor).trim();
    switch (c.acao) {
      case 'formula': return this.setTime(c.compasso, v);
      case 'tom': return this.setKey(c.compasso, v);
      case 'andamento': { const m = /^(\d+)\s*(.*)$/.exec(v); return this.setTempo(c.compasso, m ? +m[1] : 0, m ? m[2] : ''); }
      case 'ensaio': return this.setRehearsal(c.compasso, v);
      case 'texto': return this.setText(pi, c.compasso, v);
      case 'barra': return this.setBarline(c.compasso, v, c.ate || c.compasso);
      case 'por_compassos': return this.insertBars(c.compasso, c.quantos);
      case 'tirar_compassos': return this.deleteBars(c.compasso, c.ate || c.compasso);
      case 'transpor': {
        const semis = parseInt(v); if (!semis || Math.abs(semis) > 24) throw new Error('diga quantos semitons (ex.: 2, -3)');
        return this.transpose(semis, +c.compasso, +(c.ate || c.compasso), pi == null ? null : pi);
      }
      default: throw new Error(`ação "${c.acao}" desconhecida`);
    }
  };

  /* copy voice 1 of a bar note by note (keeps triplets, sextuplets, beams), transposed by semis and spelled in the
     target's key; a bar shorter than its time signature gets a rest at the end. A bar longer than its time signature
     is not copied (returns false). */
  P.copyBar = function (src, pi, num, semis) {
    const from = this.measure(src, num), to = this.measure(pi, num); if (!from || !to) return false;
    const { len, fifths } = this.context(pi, num), full = Math.round(len * DIV);
    const notes = kids(from, 'note').filter(n => txt(n, 'voice', '1') === '1');
    const total = notes.filter(n => !kid(n, 'chord') && !kid(n, 'grace')).reduce((t, n) => t + (parseInt(txt(n, 'duration', '0')) || 0), 0);
    if (!total || total > full) return false;
    const d = this.doc, mk = (tag, text) => { const e = d.createElement(tag); if (text != null) e.textContent = String(text); return e; };
    const out = notes.map(n => {
      const c = n.cloneNode(true);
      for (const tag of ['lyric', 'accidental', 'staff']) for (const x of kids(c, tag)) x.remove();
      const pt = kid(c, 'pitch');
      if (pt) {
        const nm = nameOf(midiOf(txt(pt, 'step') + ({ '-2': 'bb', '-1': 'b', '1': '#', '2': '##' }[String(Math.round(parseFloat(txt(pt, 'alter', '0'))))] || '') + txt(pt, 'octave')) + semis, fifths);
        const m = /^([A-G])(#|b)?(-?\d)$/.exec(nm);
        while (pt.firstChild) pt.firstChild.remove();
        pt.append(mk('step', m[1])); if (m[2]) pt.append(mk('alter', m[2] === '#' ? 1 : -1)); pt.append(mk('octave', m[3]));
      }
      return c;
    });
    if (total < full) {  // the source bar is short: finish it with rests so the new part is whole
      for (const pc of pieces((full - total) / DIV)) { const r = mk('note'); r.append(mk('rest'), mk('duration', Math.round(pc.q * DIV)), mk('voice', 1), mk('type', pc.type)); for (let x = 0; x < pc.dots; x++) r.append(mk('dot')); out.push(r); }
    }
    const old = kids(to, 'note').concat(kids(to, 'backup'), kids(to, 'forward'));
    const anchor = old[0] || null;
    out.forEach(n => anchor ? to.insertBefore(n, anchor) : to.append(n));
    old.forEach(o => o.remove());
    return true;
  };

  root.Partitura = Partitura;
  if (typeof module !== 'undefined') module.exports = Partitura;
})(typeof window !== 'undefined' ? window : globalThis);
