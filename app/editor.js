/* salvetheapp · Editor: the song's editable score (song.partitura.xml), drawn by Verovio, edited by touch.
   Tap a note -> change pitch, length, articulation, dynamic; or type the whole bar. Every change is undoable;
   "Salvar versão" stores a new MusicXML and keeps the old one in the song's history.
   Uses the app's globals: S, el, toast, SALVE, Versions, currentSong (index.html) and Partitura (partitura.js). */
const Editor = (() => {
  let vrvReady = null, tk = null;
  const BASE = (document.currentScript && document.currentScript.src) ? new URL('.', document.currentScript.src).href : '';
  const st = { song: null, P: null, view: -1, zoom: 1, sel: null, undo: [], redo: [], dirty: 0, map: new Map(), changed: new Set(), wrap: null };
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function loadVerovio() {
    if (vrvReady) return vrvReady;
    vrvReady = new Promise((ok, bad) => {
      const s = document.createElement('script'); s.src = BASE + 'lib/verovio-toolkit-wasm.js';
      s.onload = () => { verovio.module.onRuntimeInitialized = () => { tk = new verovio.toolkit(); ok(); }; if (verovio.module.calledRun) { tk = new verovio.toolkit(); ok(); } };
      s.onerror = () => { vrvReady = null; bad(new Error('não carregou o desenhista de partitura')); };
      document.head.append(s);
    });
    return vrvReady;
  }

  /* ---------- drawing ---------- */
  function xmlForView() { return st.view < 0 ? st.P.toString() : st.P.onlyPart(st.view); }
  function render(keepScroll) {
    const body = st.wrap.querySelector('.ed-pages'); const y = keepScroll ? body.scrollTop : 0;
    // keep the selected note where the eye is: its distance from the top of the window stays the same
    const selTop = () => { const g = body.querySelector('.ed-sel'); return g ? g.getBoundingClientRect().top - body.getBoundingClientRect().top : null; };
    const before = keepScroll ? selTop() : null; const x = keepScroll ? body.scrollLeft : 0;
    const w = Math.max(320, Math.min(1400, body.clientWidth - 24)), scale = Math.round(40 * st.zoom);
    tk.setOptions({ pageWidth: Math.round(w * 100 / scale), pageHeight: 60000, scale, adjustPageHeight: true,
      pageMarginLeft: 30, pageMarginRight: 30, pageMarginTop: 40, footer: 'none', header: 'auto', breaks: 'auto', svgViewBox: false });
    if (!tk.loadData(xmlForView())) { body.textContent = 'Não consegui desenhar esta partitura.'; return; }
    buildMap();
    const n = tk.getPageCount(); const frag = document.createDocumentFragment();
    for (let i = 1; i <= n; i++) { const pg = el('div', 'ed-page'); pg.innerHTML = tk.renderToSVG(i); frag.append(pg); }
    const h = body.scrollHeight; body.style.minHeight = keepScroll ? h + 'px' : '';  // no collapse while swapping pages
    body.replaceChildren(frag); body.style.minHeight = ''; body.scrollTop = y; body.scrollLeft = x;
    paintMarks();
    if (before != null) { const now = selTop(); if (now != null) body.scrollTop += now - before; }
  }
  // Verovio ids -> (part, bar, event index in voice 1), from the MEI it made
  function buildMap() {
    st.map.clear();
    const mei = new DOMParser().parseFromString(tk.getMEI({}), 'application/xml');
    const idOf = e => e.getAttribute('xml:id');
    for (const m of mei.getElementsByTagName('measure')) {
      const num = m.getAttribute('n');
      for (const staff of [...m.children].filter(c => c.tagName === 'staff')) {
        const pi = st.view < 0 ? parseInt(staff.getAttribute('n')) - 1 : st.view;
        const layer = [...staff.children].find(c => c.tagName === 'layer' && (c.getAttribute('n') || '1') === '1'); if (!layer) continue;
        let idx = 0;
        const walk = node => {
          for (const c of node.children) {
            const t = c.tagName;
            if (t === 'note' || t === 'rest' || t === 'chord' || t === 'mRest' || t === 'space') {
              const a = { pi, num, idx: t === 'mRest' ? 0 : idx };
              st.map.set(idOf(c), a); for (const k of c.getElementsByTagName('note')) st.map.set(idOf(k), a);
              if (t !== 'mRest') idx++;
            } else if (t === 'beam' || t === 'tuplet' || t === 'ftrem' || t === 'btrem') walk(c);
          }
        };
        walk(layer);
      }
    }
  }
  function paintMarks() {
    st.wrap.querySelectorAll('.ed-sel').forEach(x => x.classList.remove('ed-sel'));
    if (!st.sel) return;
    for (const [id, a] of st.map) if (a.pi === st.sel.pi && a.num === st.sel.num && a.idx === st.sel.idx) {
      const g = st.wrap.querySelector(`[id="${CSS.escape(id)}"]`); if (g) g.classList.add('ed-sel');
    }
  }

  /* ---------- editing ---------- */
  function snapshot() { st.undo.push(st.P.toString()); if (st.undo.length > 60) st.undo.shift(); st.redo.length = 0; }
  function restore(xml) { st.P = new Partitura(xml); }
  function changed() { st.dirty++; paintBar(); render(true); }
  function ev() { return st.sel ? st.P.events(st.sel.pi, st.sel.num) : null; }
  function tok(e) { return (e.rest ? 'R' : e.pitches.join('+')) + ':' + (Math.round(e.dur * 1000) / 1000) + e.arts + (e.tie ? '~' : ''); }
  function write(list) {
    const { pi, num } = st.sel;
    try { snapshot(); st.P.setTokens(pi, num, list.map(tok).join(' ')); st.changed.add(`${pi}:${num}`); changed(); }
    catch (e) { st.undo.pop(); toast(e.message); }
  }
  // change the selected event's length; the bar keeps its size (rests fill, following notes give way)
  function setDur(d) {
    const list = ev(); const i = st.sel.idx; if (!list || !list[i]) return;
    const { len } = st.P.context(st.sel.pi, st.sel.num);
    const before = list.slice(0, i).reduce((t, e) => t + e.dur, 0);
    if (before + d > len + 1e-6) { toast('Não cabe no compasso.'); return; }
    let delta = d - list[i].dur; list[i] = { ...list[i], dur: d, tie: delta < 0 ? false : list[i].tie };  // a shortened note no longer ties over
    if (delta < 0) list.splice(i + 1, 0, { rest: true, pitches: [], dur: -delta, arts: '', tie: false });
    else {
      let k = i + 1;
      while (delta > 1e-6 && k < list.length) {
        const take = Math.min(delta, list[k].dur); list[k] = { ...list[k], dur: list[k].dur - take }; delta -= take;
        if (list[k].dur < 1e-6) list.splice(k, 1); else k++;
      }
    }
    write(list);
  }
  function shiftPitch(semis) {
    const list = ev(); const e = list && list[st.sel.idx]; if (!e || e.rest) return;
    const { fifths } = st.P.context(st.sel.pi, st.sel.num);
    list[st.sel.idx] = { ...e, pitches: e.pitches.map(p => Partitura.nameOf(Partitura.midiOf(p) + semis, semis < 0 && fifths <= 0 ? -1 : fifths)) };
    write(list);
  }
  function toggleArt(ch) {
    const list = ev(); const e = list && list[st.sel.idx]; if (!e || e.rest) return;
    list[st.sel.idx] = { ...e, arts: e.arts.includes(ch) ? e.arts.replace(ch, '') : e.arts + ch }; write(list);
  }
  function toggleTie() { const list = ev(); const e = list && list[st.sel.idx]; if (!e || e.rest) return; list[st.sel.idx] = { ...e, tie: !e.tie }; write(list); }
  function toRest() { const list = ev(); const e = list && list[st.sel.idx]; if (!e) return; list[st.sel.idx] = { ...e, rest: true, pitches: [], arts: '', tie: false }; write(list); }
  function toNote() {
    const list = ev(); const e = list && list[st.sel.idx]; if (!e || !e.rest) return;
    const near = list.find(x => !x.rest) || (st.P.events(st.sel.pi, st.sel.num - 1) || []).reverse().find(x => !x.rest);
    list[st.sel.idx] = { ...e, rest: false, pitches: [near ? near.pitches[0] : 'B4'] }; write(list);
  }
  function dynamic(mark) { snapshot(); st.P.setDynamic(st.sel.pi, st.sel.num, st.sel.idx, mark); st.changed.add(`${st.sel.pi}:${st.sel.num}`); changed(); }
  function typeBar() {
    const { pi, num } = st.sel, cur = st.P.tokens(pi, num), { len } = st.P.context(pi, num);
    const v = prompt(`Compasso ${num} (${len} tempos), som escrito. Ex.: D5:1 E5:0.5. R:0.5 F#5:2>\n> acento  . staccato  - tenuto  ^ marcato  ~ liga na próxima`, cur);
    if (v == null || v.trim() === cur) return;
    try { snapshot(); st.P.setTokens(pi, num, v.trim()); st.changed.add(`${pi}:${num}`); changed(); } catch (e) { st.undo.pop(); toast(e.message); }
  }
  function undo() { if (!st.undo.length) return; st.redo.push(st.P.toString()); restore(st.undo.pop()); st.dirty = Math.max(0, st.dirty - 1); paintBar(); render(true); }
  function redo() { if (!st.redo.length) return; st.undo.push(st.P.toString()); restore(st.redo.pop()); st.dirty++; paintBar(); render(true); }

  /* ---------- the bottom bar for the selected note ---------- */
  const DURS = [[4, '𝅝', 'Semibreve'], [2, '𝅗𝅥', 'Mínima'], [1, '♩', 'Semínima'], [0.5, '♪', 'Colcheia'], [0.25, '𝅘𝅥𝅯', 'Semicolcheia']];
  function paintBar() {
    const bar = st.wrap.querySelector('.ed-tools'), info = st.wrap.querySelector('.ed-info');
    const save = st.wrap.querySelector('.ed-save'); save.disabled = !st.dirty; save.textContent = st.dirty ? `Salvar versão (${st.dirty})` : 'Salvo';
    st.wrap.querySelector('.ed-undo').disabled = !st.undo.length; st.wrap.querySelector('.ed-redo').disabled = !st.redo.length;
    if (!st.sel) { bar.hidden = true; info.textContent = 'Toque numa nota ou pausa para editar.'; return; }
    const list = ev() || [], e = list[st.sel.idx]; const part = st.P.parts()[st.sel.pi];
    if (!e) { bar.hidden = true; return; }
    info.textContent = `${part ? part.name : ''} · c.${st.sel.num} · ${e.rest ? 'pausa' : e.pitches.join(' + ')} · ${Math.round(e.dur * 100) / 100} tempo${e.dur === 1 ? '' : 's'}`;
    bar.hidden = false;
    bar.querySelectorAll('[data-dur]').forEach(b => { const d = parseFloat(b.dataset.dur); b.setAttribute('aria-pressed', String(Math.abs(d - e.dur) < 1e-6 || Math.abs(d * 1.5 - e.dur) < 1e-6)); });
    bar.querySelectorAll('[data-art]').forEach(b => b.setAttribute('aria-pressed', String(!e.rest && e.arts.includes(b.dataset.art))));
    bar.querySelector('[data-k=tie]').setAttribute('aria-pressed', String(!!e.tie));
    bar.querySelectorAll('.ed-note-only').forEach(b => b.disabled = e.rest);
    bar.querySelector('[data-k=rest]').textContent = e.rest ? 'Virar nota' : 'Virar pausa';
  }

  /* ---------- saving ---------- */
  // store a new version of a song's score (the old file stays, the song's history keeps a snapshot) and redo its audio
  async function salvarPartitura(song, xmlText, nota, opts = {}) {
    const v = ((song.partitura || {}).versao || 1) + 1;
    try { await Versions.snapshot(song.id, nota || 'Antes da edição da partitura'); } catch {}
    const blob = new Blob([xmlText], { type: 'application/vnd.recordare.musicxml+xml' });
    const file = new File([blob], `${song.id}-partitura-v${v}.musicxml`, { type: blob.type });
    const res = await SALVE.upload(file, { type: blob.type });
    const me = SALVE.ctx().user;
    const partitura = { ...(song.partitura || {}), xml: res.url, versao: v, editadaEm: Date.now(), editadaPor: (me.displayName || me.email || '').slice(0, 80) };
    if (opts.partes) { partitura.partes = opts.partes; partitura.criadaEm = Date.now(); partitura.origem = 'criada no app'; }
    await S.db.collection('songs').doc(song.id).update({ partitura });
    song.partitura = partitura;
    if (!opts.semAudio && typeof Robo !== 'undefined') Robo.start(song.id, null, 'partitura', true);  // the study audio follows the score
    return partitura;
  }
  async function save() {
    if (!st.dirty) return;
    const btn = st.wrap.querySelector('.ed-save'); btn.disabled = true; btn.textContent = 'Salvando…';
    try {
      const pv = await salvarPartitura(st.song, st.P.toString());
      st.dirty = 0; st.changed.clear(); st.undo.length = 0; st.redo.length = 0;
      toast(`Versão ${pv.versao} salva. O áudio de estudo vai ser refeito em alguns minutos.`);
    } catch (e) { console.error(e); toast('Não consegui salvar. Confira a internet.'); }
    paintBar();
  }

  function chordsBar() {
    const { pi, num } = st.sel; const cur = st.P.chords(pi, num).map(c => c.text).join(' ');
    const v = prompt(`Cifras do compasso ${num} (ex.: Am7, ou "Am7 D7" para dividir ao meio, ou "Am7:3 D7:1"; vazio apaga):`, cur);
    if (v == null || v.trim() === cur) return;
    snapshot();
    try { st.P.setChords(pi, num, v); st.changed.add(`${pi}:${num}`); changed(); }
    catch (e) { st.undo.pop(); toast(e.message); }
  }

  /* ---------- a new score ---------- */
  const TONS = [['Dó maior / Lá menor', 0], ['Sol maior / Mi menor', 1], ['Ré maior / Si menor', 2], ['Lá maior / Fá# menor', 3], ['Mi maior / Dó# menor', 4],
    ['Si maior / Sol# menor', 5], ['Fá# maior / Ré# menor', 6], ['Fá maior / Ré menor', -1], ['Si♭ maior / Sol menor', -2], ['Mi♭ maior / Dó menor', -3],
    ['Lá♭ maior / Fá menor', -4], ['Ré♭ maior / Si♭ menor', -5], ['Sol♭ maior / Mi♭ menor', -6]];
  function criar(song) {
    const scrim = el('div', 'scrim'), f = document.createElement('form'); f.className = 'modal ed-new';
    f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Criar partitura');
    const ins = Partitura.INSTRUMENTOS, padrao = ['trompete', 'sax-tenor', 'trombone', 'base'];
    f.innerHTML = `
      <h3>Criar partitura</h3>
      <p class="hint">“${esc(song.title)}” ainda não tem partitura editável. Crie uma em branco aqui; depois escreva tocando nas notas ou peça ao Caio para escrever cifras e linhas.</p>
      <fieldset><legend>Instrumentos</legend><div class="ed-ins">${ins.map(x => `<label><input type="checkbox" name="i" value="${x.key}"${padrao.includes(x.key) ? ' checked' : ''}> ${esc(x.nome)}</label>`).join('')}</div></fieldset>
      <div class="ed-row">
        <label>Fórmula <select name="f">${['4/4', '3/4', '2/4', '6/8', '2/2', '12/8'].map(f => `<option>${f}</option>`).join('')}</select></label>
        <label>Tom <select name="k">${TONS.map(([n, f]) => `<option value="${f}">${n}</option>`).join('')}</select></label>
        <label>Compassos <input name="n" type="number" min="1" max="400" value="32" inputmode="numeric"></label>
        <label>Andamento <input name="b" type="number" min="20" max="320" value="${Math.round(song.player?.bpm || song.bpm || 100)}" inputmode="numeric"></label>
      </div>
      <div class="row"><button class="btn" type="button" data-x>Cancelar</button><button class="btn primary" type="submit">Criar e editar</button></div>`;
    const close = () => { scrim.remove(); f.remove(); };
    document.body.append(scrim, f);
    f.querySelector('[data-x]').onclick = close; scrim.onclick = close;
    f.onsubmit = async e => {
      e.preventDefault();
      const keys = [...f.querySelectorAll('input[name=i]:checked')].map(x => x.value);
      if (!keys.length) { toast('Escolha pelo menos um instrumento.'); return; }
      const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Criando…';
      try {
        const xml = Partitura.blank({ titulo: song.title, instrumentos: keys, formula: f.f.value, fifths: +f.k.value, compassos: +f.n.value || 32, bpm: +f.b.value || 100 });
        const partes = keys.map(k => { const x = ins.find(y => y.key === k); return { key: k, name: x.nome }; });
        await salvarPartitura(song, xml, 'Partitura criada no app', { partes, semAudio: true });
        close(); open(song);
      } catch (err) { console.error(err); toast('Não consegui criar: ' + err.message); btn.disabled = false; btn.textContent = 'Criar e editar'; }
    };
  }

  /* ---------- the screen ---------- */
  async function open(song) {
    song = song || currentSong();
    if (!song) return;
    if (!(song.partitura || {}).xml) {
      if (S.canWrite) criar(song);
      else toast('Esta música ainda não tem partitura editável. Peça para o dono ou um editor criar.');
      return;
    }
    const scrim = el('div', 'ed-screen'); scrim.setAttribute('role', 'dialog'); scrim.setAttribute('aria-label', 'Editar partitura');
    scrim.innerHTML = `<header class="ed-top">
        <button class="iconbtn ed-close" type="button" aria-label="Fechar">✕<span class="lbl">Fechar</span></button>
        <b class="ed-title">${esc(song.title)}</b>
        <div class="chips ed-parts" role="group" aria-label="Ver"></div>
        <div class="ed-acts"><button class="iconbtn ed-undo" type="button" title="Desfazer">↶</button><button class="iconbtn ed-redo" type="button" title="Refazer">↷</button>
          <button class="iconbtn ed-zm" type="button" aria-label="Diminuir">−</button><button class="iconbtn ed-zp" type="button" aria-label="Aumentar">+</button>
          <button class="btn primary ed-save" type="button" disabled>Salvo</button></div>
      </header>
      <div class="ed-pages" tabindex="0"><p class="loading">carregando a partitura…</p></div>
      <footer class="ed-foot"><p class="ed-info" role="status">Toque numa nota ou pausa para editar.</p>
        <div class="ed-tools" hidden>
          <div class="ed-grp"><button class="btn ed-note-only" data-k="up" title="Meio tom acima">▲</button><button class="btn ed-note-only" data-k="down" title="Meio tom abaixo">▼</button>
            <button class="btn ed-note-only" data-k="o8up" title="Oitava acima">8▲</button><button class="btn ed-note-only" data-k="o8dn" title="Oitava abaixo">8▼</button></div>
          <div class="ed-grp">${DURS.map(([d, s, t]) => `<button class="btn ed-dur" data-dur="${d}" title="${t}" aria-label="${t}">${s}</button>`).join('')}<button class="btn" data-k="dot" title="Ponto de aumento">•</button></div>
          <div class="ed-grp"><button class="btn ed-note-only" data-art=">" title="Acento">&gt;</button><button class="btn ed-note-only" data-art="." title="Staccato">·</button>
            <button class="btn ed-note-only" data-art="-" title="Tenuto">–</button><button class="btn ed-note-only" data-art="^" title="Marcato">^</button><button class="btn ed-note-only" data-k="tie" title="Ligar na próxima">⌒</button></div>
          <div class="ed-grp"><select class="ed-dyn" aria-label="Dinâmica"><option value="">dinâmica…</option>${['pp', 'p', 'mp', 'mf', 'f', 'ff', 'sfz', 'fp'].map(d => `<option>${d}</option>`).join('')}<option value="-">tirar</option></select>
            <button class="btn" data-k="rest">Virar pausa</button><button class="btn" data-k="type" title="Escrever o compasso inteiro">Compasso…</button><button class="btn" data-k="chords" title="Cifras deste compasso">Cifras…</button></div>
        </div></footer>`;
    document.body.append(scrim); document.body.classList.add('editing-score');
    st.wrap = scrim; st.song = song; st.sel = null; st.undo = []; st.redo = []; st.dirty = 0; st.changed.clear(); st.view = -1;
    const shut = () => { if (st.dirty && !confirm('Sair sem salvar as mudanças?')) return; scrim.remove(); document.body.classList.remove('editing-score'); st.wrap = null; };
    scrim.querySelector('.ed-close').onclick = shut;
    scrim.querySelector('.ed-save').onclick = save;
    scrim.querySelector('.ed-undo').onclick = undo; scrim.querySelector('.ed-redo').onclick = redo;
    scrim.querySelector('.ed-zm').onclick = () => { st.zoom = Math.max(0.6, st.zoom - 0.15); render(true); };
    scrim.querySelector('.ed-zp').onclick = () => { st.zoom = Math.min(2, st.zoom + 0.15); render(true); };
    const tools = scrim.querySelector('.ed-tools');
    tools.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !st.sel) return;
      if (b.dataset.dur) { const cur = (ev() || [])[st.sel.idx]; const dotted = cur && Math.abs(cur.dur / parseFloat(b.dataset.dur) - 1.5) < 1e-6; setDur(parseFloat(b.dataset.dur) * (dotted ? 1.5 : 1)); }
      else if (b.dataset.art) toggleArt(b.dataset.art);
      else ({ up: () => shiftPitch(1), down: () => shiftPitch(-1), o8up: () => shiftPitch(12), o8dn: () => shiftPitch(-12), tie: toggleTie, type: typeBar, chords: chordsBar,
        rest: () => ((ev() || [])[st.sel.idx] || {}).rest ? toNote() : toRest(),
        dot: () => { const cur = (ev() || [])[st.sel.idx]; if (cur) setDur(Math.abs(cur.dur % 0.75) < 1e-6 && [0.375, 0.75, 1.5, 3, 6].includes(cur.dur) ? cur.dur / 1.5 : cur.dur * 1.5); } }[b.dataset.k] || (() => {}))();
    });
    tools.querySelector('.ed-dyn').onchange = e => { const v = e.target.value; e.target.value = ''; if (v) dynamic(v === '-' ? null : v); };
    scrim.querySelector('.ed-pages').addEventListener('click', e => {
      let g = e.target.closest('g.note, g.rest, g.chord, g.mRest');
      if (!g) { st.sel = null; paintMarks(); paintBar(); return; }
      const outer = g.closest('g.chord') || g;
      const a = st.map.get(outer.id) || st.map.get(g.id);
      if (!a) return;
      st.sel = { ...a, num: parseInt(a.num) }; paintMarks(); paintBar();
    });
    scrim.addEventListener('keydown', e => {
      if (e.target.closest('input, select, textarea')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (st.sel && e.key === 'ArrowUp') { e.preventDefault(); shiftPitch(e.shiftKey ? 12 : 1); }
      else if (st.sel && e.key === 'ArrowDown') { e.preventDefault(); shiftPitch(e.shiftKey ? -12 : -1); }
      else if (e.key === 'Escape') shut();
    });
    try {
      await loadVerovio();
      const xml = await (await fetch(song.partitura.xml)).text();
      st.P = new Partitura(xml);
      const chips = scrim.querySelector('.ed-parts');
      const mk = (label, view) => { const c = el('button', 'chip', label); c.type = 'button'; c.setAttribute('aria-pressed', String(view === st.view)); c.onclick = () => { st.view = view; st.sel = null; chips.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); paintBar(); render(false); }; return c; };
      chips.replaceChildren(mk('Grade', -1), ...st.P.parts().map(p => mk(p.name, p.i)));
      render(false); paintBar(); scrim.querySelector('.ed-pages').focus();
    } catch (e) { console.error(e); scrim.querySelector('.ed-pages').textContent = 'Não consegui abrir a partitura: ' + e.message; }
  }
  // Caio's approved bar rewrites, applied to the score: {parte (instrument key), compasso, notas}
  async function aplicarCorrecoes(song, lista) {
    const P = new Partitura(await (await fetch(song.partitura.xml)).text());
    const keys = ((song.partitura || {}).partes || (song.player || {}).instrumentos || []).map(x => x.key);
    const slugify = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const feitas = [], erros = [];
    for (const c of lista) {
      let pi = keys.indexOf(c.parte);
      if (pi < 0) pi = P.parts().findIndex(p => slugify(p.name) === c.parte || slugify(p.name).startsWith(c.parte));
      try {
        if (pi < 0) throw new Error('instrumento não encontrado');
        if (c.tipo === 'cifras') P.setChords(pi, c.compasso, c.cifras); else P.setTokens(pi, c.compasso, c.notas);
        feitas.push(c);
      }
      catch (e) { erros.push(`${c.parte} c.${c.compasso}: ${e.message}`); }
    }
    if (feitas.length) await salvarPartitura(song, P.toString(), 'Antes das mudanças do Caio');
    return { feitas: feitas.length, erros };
  }
  return { open, criar, partitura: () => st.P, aplicarCorrecoes, salvarPartitura };
})();
document.getElementById('editScoreBtn')?.addEventListener('click', () => Editor.open());
