/* salvetheapp · Equipe do app: the page where the app's team (the owner and partners such as the band's arranger)
   improves the app together, outside any band: suggestions, the writing rules the AI arranger follows, and lessons
   from corrected arrangements. Data lives in sugestoes/*, treino/regras (+ /versoes, /licoes); see firestore.rules. */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref as sref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const app = initializeApp({
  apiKey: 'AIzaSyDItCDsH2QN_DCVHfnK27qkQTVu0WJcf90',
  authDomain: 'salvetheapp-3cceb.firebaseapp.com',
  projectId: 'salvetheapp-3cceb',
  storageBucket: 'salvetheapp-3cceb.firebasestorage.app',
  messagingSenderId: '560061082405',
  appId: '1:560061082405:web:09f6f362ac4ff97fdc48cc',
});
const fs = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const when = t => t ? new Date(+t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
let toastT = null;
const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); };
let ME = null, ADMIN = false;
const me = () => ({ uid: ME.uid, nome: (ME.displayName || ME.email || '').slice(0, 80) });
const byNewest = k => (a, b) => (b[k] || 0) - (a[k] || 0);

function screen(title, text, link) {
  const main = $('#main'); main.replaceChildren();
  const box = el('section', 'card'); box.append(el('h2', '', title), el('p', 'muted', text));
  if (link) { const a = el('a', 'btn primary', link[0]); a.href = link[1]; box.append(a); }
  main.append(box);
}

/* ---------- Sugestões ----------
   Chegam do botão "Sugerir melhoria" do app (qualquer pessoa, de qualquer banda) e daqui. Antes de aparecer para o
   dono decidir, cada uma passa pelo júri (3 avaliadores, função juri): o que o júri aprova fica em "Para você
   aprovar"; um problema que o júri confirma vai para a correção automática, que reproduz, corrige e abre o PR. */
const STATUS = ['nova', 'aprovada', 'em andamento', 'feita', 'descartada'];
const CORR = { 'na fila': 'Na fila da correção automática (a rotina roda uma vez por dia).', reproduzindo: 'A correção automática está tentando reproduzir.',
  pr: 'Corrigido num pedido no GitHub: falta você dar o ok para juntar e publicar.', nao_reproduzi: 'A correção automática não conseguiu reproduzir o problema.', erro: 'A correção automática deu erro; tenta de novo na próxima rodada.' };
const TIPO_J = { bug: 'problema no app', melhoria: 'melhoria', duvida: 'dúvida de uso', outro: 'fora do assunto' };
function grupo(s) {
  const j = s.juri || {};
  if (s.status === 'feita' || s.status === 'descartada') return 'fim';
  if (s.status === 'aprovada' || s.status === 'em andamento') return 'andamento';
  if (j.estado !== 'pronto') return 'juri';
  if (j.bug) return 'bug';
  return j.vale ? 'aprovar' : 'recusada';
}
const GRUPOS = [
  ['aprovar', 'Para você aprovar', 'O júri achou que vale. Você decide se entra no app.'],
  ['bug', 'Problemas confirmados pelo júri', 'Vão sozinhos para a correção automática, que abre o pedido no GitHub. Você dá o ok para juntar e publicar.'],
  ['juri', 'Esperando o júri', 'Acabaram de chegar, ou a banda já usou a verba do mês (a rotina diária avalia).'],
  ['andamento', 'Aprovadas e em andamento', ''],
  ['recusada', 'Recusadas pelo júri', 'Ficam guardadas: se discordar, aprove mesmo assim.', true],
  ['fim', 'Feitas e descartadas', '', true],
];
function cartao(s) {
  const j = s.juri || {}, c = el('article', 'card item sug ' + String(s.status || 'nova').replace(' ', '-'));
  const head = el('div', 'row between');
  const tit = el('div', 'tit');
  tit.append(el('span', 'chip ' + (s.tipo === 'problema' ? 'prob' : ''), s.tipo === 'problema' ? 'Algo deu errado' : 'Ideia'), el('b', '', j.resumo || String(s.texto).slice(0, 70)));
  head.append(tit, el('span', 'muted small', when(s.criadoEm)));
  const quem = [s.nome || 'Alguém', s.bandaNome, s.papel].filter(Boolean).join(' · ');
  c.append(head, el('p', 'muted small', quem), el('p', 'texto', s.texto));
  if (s.tela || s.aparelho) c.append(el('p', 'muted small', [s.tela, s.aparelho].filter(Boolean).join(' · ')));
  if (s.erros) c.append(el('p', 'muted small mono', 'Erros na tela: ' + s.erros));
  if (s.foto && ADMIN) {
    const a = el('a', 'foto'); a.target = '_blank'; a.rel = 'noopener'; const img = el('img'); img.alt = 'print anexado'; a.append(img); c.append(a);
    getDownloadURL(sref(storage, s.foto)).then(u => { img.src = u; a.href = u; }, () => a.remove());
  }
  if (j.estado === 'pronto') {
    const box = el('div', 'juri ' + (j.vale ? 'sim' : 'nao'));
    box.append(el('b', '', `Júri: ${j.vale ? 'vale' : 'não vale'} (${j.sim} de ${j.de}) · nota ${String(j.nota).replace('.', ',')} · ${TIPO_J[j.tipo] || j.tipo}`));
    const ul = el('ul', 'votos');
    (j.votos || []).forEach(v => { const li = el('li'); li.append(el('b', '', `${v.nome} ${v.vale ? '✓' : '✗'} ${v.nota}/5`), document.createTextNode(' ' + v.motivo)); ul.append(li); });
    box.append(ul); c.append(box);
  } else if (j.estado) c.append(el('p', 'muted small', 'Júri: ' + (j.motivo || 'avaliando…')));
  else c.append(el('p', 'muted small', 'Júri: avaliando…'));
  if (s.correcao) {
    const k = el('div', 'corr'); k.append(el('b', '', 'Correção: '), document.createTextNode(CORR[s.correcao.estado] || s.correcao.estado));
    if (s.correcao.pr) { const a = el('a', '', ' Abrir o pedido'); a.href = s.correcao.pr; a.target = '_blank'; a.rel = 'noopener'; k.append(a); }
    if (s.correcao.nota) k.append(el('p', 'muted small', s.correcao.nota));
    c.append(k);
  }
  if (!ADMIN) { if (s.resposta) c.append(el('p', '', 'Resposta: ' + s.resposta)); return c; }
  const set = (status, extra = {}) => updateDoc(doc(fs, 'sugestoes', s.id), { status, ...extra, atualizadoEm: Date.now() }).catch(() => toast('Não consegui mudar.'));
  const rapido = el('div', 'row end');
  if (!['aprovada', 'em andamento', 'feita'].includes(s.status)) { const b = el('button', 'btn primary', 'Aprovar'); b.type = 'button'; b.onclick = () => set('aprovada').then(() => toast('Aprovada. Fica em "Aprovadas e em andamento".')); rapido.append(b); }
  if (s.status !== 'descartada') { const b = el('button', 'btn', 'Descartar'); b.type = 'button'; b.onclick = () => set('descartada'); rapido.append(b); }
  const sel = el('select'); sel.setAttribute('aria-label', 'Situação');
  STATUS.forEach(x => { const o = el('option', '', x); o.value = x; o.selected = x === (s.status || 'nova'); sel.append(o); });
  sel.onchange = () => set(sel.value);
  rapido.prepend(sel);
  const resp = el('textarea'); resp.rows = 2; resp.maxLength = 2000; resp.placeholder = 'Resposta (o que foi feito, ou por que não)'; resp.value = s.resposta || '';
  resp.setAttribute('aria-label', 'Resposta');
  const save = el('button', 'btn', 'Salvar resposta'); save.type = 'button';
  save.onclick = () => set(sel.value, { resposta: resp.value.trim() }).then(() => toast('Resposta salva.'));
  const del = el('button', 'btn ghost', 'Apagar'); del.type = 'button';
  del.onclick = () => confirm('Apagar esta sugestão?') && deleteDoc(doc(fs, 'sugestoes', s.id)).catch(() => toast('Não consegui apagar.'));
  const row = el('div', 'row end'); row.append(del, save);
  c.append(rapido, resp, row);
  return c;
}
function sugestoes(root) {
  const form = el('form', 'card');
  form.innerHTML = `<h2>Sugerir uma melhoria</h2><p class="muted">Qualquer ideia para o app: uma tela, um jeito de escrever, um erro que você viu. No app, o botão <b>Sugerir melhoria</b> do menu faz o mesmo e manda junto a tela e o aparelho.</p>
    <label class="sr" for="sgTxt">Sua sugestão</label><textarea id="sgTxt" rows="4" maxlength="2000" placeholder="Ex.: na parte de trompete, mostrar as letras de ensaio maiores"></textarea>
    <div class="row end"><button class="btn primary" type="submit">Enviar sugestão</button></div>`;
  form.onsubmit = async e => {
    e.preventDefault(); const t = $('#sgTxt', form).value.trim(); if (!t) return;
    try { await setDoc(doc(collection(fs, 'sugestoes')), { texto: t, ...me(), criadoEm: Date.now(), status: 'nova', tipo: 'melhoria', tela: 'Página da equipe' }); $('#sgTxt', form).value = ''; toast('Sugestão enviada.'); }
    catch { toast('Não consegui enviar.'); }
  };
  const list = el('section', 'list'); list.append(el('p', 'muted', 'carregando…'));
  root.append(form, list);
  if (ADMIN) root.append(chaveRotinaCard());
  const q = ADMIN ? collection(fs, 'sugestoes') : query(collection(fs, 'sugestoes'), where('uid', '==', ME.uid));
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest('criadoEm'));
    list.replaceChildren(el('h2', '', ADMIN ? `Sugestões (${items.length})` : `As suas sugestões (${items.length})`));
    if (!items.length) { list.append(el('p', 'muted', 'Nenhuma sugestão ainda.')); return; }
    for (const [k, titulo, sub, fechado] of GRUPOS) {
      const g = items.filter(s => grupo(s) === k);
      if (!g.length) continue;
      const sec = el(fechado ? 'details' : 'section', 'grupo g-' + k);
      const h = el(fechado ? 'summary' : 'h3', '', `${titulo} (${g.length})`); sec.append(h);
      if (sub) sec.append(el('p', 'muted small', sub));
      g.forEach(s => sec.append(cartao(s)));
      list.append(sec);
    }
  }, () => list.replaceChildren(el('p', 'muted', 'Não consegui ler as sugestões.')));
}
// the key the daily fixing routine uses to read the confirmed problems (only the app owner sees it)
function chaveRotinaCard() {
  const box = el('details', 'card chave');
  box.append(el('summary', '', 'Chave da correção automática'), el('p', 'muted small', 'A rotina diária do Claude usa esta chave para ler os problemas que o júri confirmou. Não mande para ninguém além do Claude.'));
  const row = el('div', 'row'); box.append(row);
  box.addEventListener('toggle', async () => {
    if (!box.open || row.childElementCount) return;
    const d = await getDoc(doc(fs, 'sistema', 'rotina')).catch(() => null);
    const k = d && d.exists() ? d.data().chave : '';
    if (!k) { row.append(el('p', 'muted small', 'Ainda não existe: ela aparece depois da primeira sugestão que chegar com o app publicado.')); return; }
    const code = el('code', 'mono', k); const b = el('button', 'btn', 'Copiar'); b.type = 'button';
    b.onclick = async () => { try { await navigator.clipboard.writeText(k); toast('Chave copiada.'); } catch { prompt('Copie a chave:', k); } };
    row.append(code, b);
  });
  return box;
}

/* ---------- Regras do Mestrinho ---------- */
async function regras(root) {
  const card = el('section', 'card');
  card.innerHTML = `<h2>Regras que a IA arranjadora segue</h2>
    <p class="muted">É o texto que o Mestrinho lê antes de escrever os metais de uma música. Escreva como você explicaria para um arranjador novo da banda: textura, regiões, articulações, o que nunca fazer. Vale para os próximos arranjos. Cada vez que alguém salva, a versão anterior fica guardada embaixo.</p>
    <label class="sr" for="rgTxt">Regras</label><textarea id="rgTxt" rows="22" maxlength="20000" spellcheck="true"></textarea>
    <div class="row between"><span class="muted" id="rgInfo"></span><button class="btn primary" id="rgSave" type="button">Salvar regras</button></div>`;
  const vers = el('section', 'list');
  root.append(card, vers);
  const load = async () => {
    const d = await getDoc(doc(fs, 'treino', 'regras'));
    const r = d.exists() ? d.data() : null;
    $('#rgTxt', card).value = r ? r.texto : '';
    $('#rgInfo', card).textContent = r ? `Última mudança: ${r.nome || ''} · ${when(r.atualizadoEm)}` : '';
    const vs = (await getDocs(collection(fs, 'treino', 'regras', 'versoes'))).docs.map(x => ({ id: x.id, ...x.data() })).sort(byNewest('em'));
    vers.replaceChildren(el('h2', '', 'Versões anteriores'));
    vs.slice(0, 30).forEach((v, i) => {
      const c = el('details', 'card item');
      const sum = el('summary', '', `${when(v.em)} · ${v.nome || ''}${i === 0 ? ' (atual)' : ''}`);
      const pre = el('pre', 'texto', v.texto);
      const back = el('button', 'btn', 'Voltar para esta versão'); back.type = 'button';
      back.onclick = async () => { if (!confirm('Voltar as regras para esta versão? A atual fica guardada.')) return; await salvar(v.texto); };
      c.append(sum, pre); if (i > 0) c.append(back);
      vers.append(c);
    });
  };
  const salvar = async texto => {
    const now = Date.now(), m = me();
    try {
      await setDoc(doc(fs, 'treino', 'regras', 'versoes', String(now)), { texto, uid: m.uid, nome: m.nome, em: now });
      await setDoc(doc(fs, 'treino', 'regras'), { texto, uid: m.uid, nome: m.nome, atualizadoEm: now });
      toast('Regras salvas. Valem para o próximo arranjo.'); await load();
    } catch { toast('Não consegui salvar.'); }
  };
  $('#rgSave', card).onclick = () => { const t = $('#rgTxt', card).value.trim(); if (t) salvar(t); };
  load().catch(() => toast('Não consegui ler as regras.'));
}

/* ---------- Lições ---------- */
function licoes(root) {
  const form = el('form', 'card');
  form.innerHTML = `<h2>Ensinar uma lição ao Mestrinho</h2>
    <p class="muted">Quando a IA errar num arranjo, diga em palavras o que você faria diferente. As lições ativas entram no próximo arranjo junto com as regras.</p>
    <label for="lcMus">Música <span class="muted">(opcional)</span></label><input id="lcMus" type="text" maxlength="120" placeholder="Ex.: Capricorniana">
    <label for="lcTxt">Lição</label><textarea id="lcTxt" rows="4" maxlength="1500" placeholder="Ex.: no refrão os metais seguram a nota do acorde por um compasso e meio; não picote em colcheias o que a guia mostra repetido"></textarea>
    <div class="row end"><button class="btn primary" type="submit">Guardar lição</button></div>`;
  form.onsubmit = async e => {
    e.preventDefault(); const t = $('#lcTxt', form).value.trim(); if (!t) return; const mu = $('#lcMus', form).value.trim();
    try { await setDoc(doc(collection(fs, 'treino', 'regras', 'licoes')), { texto: t, ...(mu ? { musica: mu } : {}), ...me(), criadoEm: Date.now(), ativa: true }); $('#lcTxt', form).value = ''; toast('Lição guardada.'); }
    catch { toast('Não consegui guardar.'); }
  };
  const list = el('section', 'list');
  root.append(form, list);
  return onSnapshot(collection(fs, 'treino', 'regras', 'licoes'), snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest('criadoEm'));
    list.replaceChildren(el('h2', '', `Lições (${items.filter(x => x.ativa).length} ativas de ${items.length})`));
    for (const l of items) {
      const c = el('article', 'card item' + (l.ativa ? '' : ' off'));
      const head = el('div', 'row between');
      head.append(el('b', '', `${l.musica ? l.musica + ' · ' : ''}${l.nome || ''} · ${when(l.criadoEm)}`));
      const lab = el('label', 'switch'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!l.ativa; lab.append(cb, ' ativa');
      cb.onchange = () => updateDoc(doc(fs, 'treino', 'regras', 'licoes', l.id), { ativa: cb.checked, texto: l.texto }).catch(() => toast('Não consegui mudar.'));
      head.append(lab);
      const ta = el('textarea'); ta.rows = 3; ta.maxLength = 1500; ta.value = l.texto; ta.setAttribute('aria-label', 'Texto da lição');
      const row = el('div', 'row end');
      const del = el('button', 'btn ghost', 'Apagar'); del.type = 'button';
      del.onclick = () => confirm('Apagar esta lição?') && deleteDoc(doc(fs, 'treino', 'regras', 'licoes', l.id)).catch(() => toast('Não consegui apagar.'));
      const save = el('button', 'btn', 'Salvar texto'); save.type = 'button';
      save.onclick = () => updateDoc(doc(fs, 'treino', 'regras', 'licoes', l.id), { ativa: cb.checked, texto: ta.value.trim() || l.texto }).then(() => toast('Lição salva.'), () => toast('Não consegui salvar.'));
      row.append(del, save); c.append(head, ta, row); list.append(c);
    }
  }, () => list.replaceChildren(el('p', 'muted', 'Não consegui ler as lições.')));
}

/* ---------- Treinar ---------- */
const NOMES = { tpt: 'Trompete', sax: 'Sax tenor', tbn: 'Trombone' };
const pct = x => Math.round((x || 0) * 100) + '%';
function upload(file, path, onp) {
  return new Promise((res, rej) => {
    const t = uploadBytesResumable(sref(storage, path), file, { contentType: file.type || undefined });
    t.on('state_changed', s => onp && onp(s.bytesTransferred / Math.max(1, s.totalBytes)), rej, async () => res(await getDownloadURL(t.snapshot.ref)));
  });
}
function treinar(root) {
  const form = el('form', 'card');
  form.innerHTML = `<h2>Treinar a IA com uma música</h2>
    <p class="muted">Mande a gravação e a partitura que você escreveu para ela. O Mestrinho escreve o arranjo <b>sem ver a sua partitura</b>, compara as duas, dá a nota e sugere lições — você aceita as que fizerem sentido. Leva uns 15 minutos.</p>
    <label for="trTit">Música</label><input id="trTit" type="text" maxlength="120" placeholder="Ex.: Capricorniana">
    <label for="trGuia">Gravação</label><input id="trGuia" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg">
    <label for="trOf">Sua partitura (MusicXML)</label><input id="trOf" type="file" accept=".musicxml,.mxl,.xml,.mscz">
    <p class="muted">No MuseScore, Sibelius ou Finale: Exportar → MusicXML. As partes precisam ter trompete, sax e trombone no nome.</p>
    <div class="row end"><button class="btn primary" type="submit" id="trGo">Começar o treino</button></div>`;
  form.onsubmit = async e => {
    e.preventDefault();
    const tit = $('#trTit', form).value.trim(), g = $('#trGuia', form).files[0], o = $('#trOf', form).files[0];
    if (!tit || !g || !o) { toast('Preencha a música, a gravação e a partitura.'); return; }
    const btn = $('#trGo', form); btn.disabled = true;
    try {
      const id = String(Date.now()), base = `treino/${ME.uid}/${id}`;
      const gUrl = await upload(g, `${base}/guia-${g.name}`, x => { btn.textContent = `Enviando a gravação · ${Math.round(x * 100)}%`; });
      const oUrl = await upload(o, `${base}/oficial-${o.name}`, x => { btn.textContent = `Enviando a partitura · ${Math.round(x * 100)}%`; });
      await setDoc(doc(fs, 'treino', 'regras', 'rodadas', id), { titulo: tit, guia: { name: g.name, src: gUrl }, oficial: { name: o.name, src: oUrl }, ...me(), criadoEm: Date.now(), status: 'pendente' });
      form.reset(); toast('Treino começou. Pode fechar a página; o resultado fica aqui.');
    } catch (err) { console.error(err); toast('Não consegui enviar. Confira a internet e tente de novo.'); }
    btn.disabled = false; btn.textContent = 'Começar o treino';
  };
  const list = el('section', 'list');
  root.append(form, list);
  return onSnapshot(collection(fs, 'treino', 'regras', 'rodadas'), snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest('criadoEm'));
    list.replaceChildren(el('h2', '', `Rodadas de treino (${items.length})`));
    if (!items.length) list.append(el('p', 'muted', 'Nenhuma rodada ainda.'));
    for (const r of items) {
      const c = el('article', 'card item');
      c.append(el('b', '', `${r.titulo} · ${r.nome || ''} · ${when(r.criadoEm)}`));
      if (r.status !== 'pronto') {
        c.append(el('p', r.status === 'erro' ? 'texto erro' : 'muted', r.msg || (r.status === 'pendente' ? 'Na fila…' : r.status)));
        if (r.progresso && r.status !== 'erro') { const b = el('div', 'barra'); b.style.setProperty('--p', r.progresso + '%'); c.append(b); }
      } else {
        const res = r.resultado || {};
        c.append(el('p', 'nota', `Nota: ${pct(res.media_f1)} das notas iguais às suas`));
        const tb = el('table'); tb.innerHTML = '<thead><tr><th>Parte</th><th>Nota</th><th>Achou das suas</th><th>Do que escreveu, certo</th><th>Teto*</th></tr></thead>';
        const tbody = el('tbody');
        for (const [k, v] of Object.entries(res.instrumentos || {})) {
          const tr = el('tr'); [NOMES[k] || k, pct(v.f1), pct(v.achou), pct(v.certas), pct(v.teto)].forEach(x => tr.append(el('td', '', x))); tbody.append(tr);
        }
        tb.append(tbody); c.append(tb);
        c.append(el('p', 'muted', '*Teto: quanto das suas notas dá para ouvir na gravação. A IA só consegue acertar dentro disso.'));
        (res.avisos || []).forEach(a => c.append(el('p', 'texto erro', a)));
        if (r.resumoIA) c.append(el('p', 'texto', 'O que a IA fez: ' + r.resumoIA));
        if (r.iaGrade) { const a = el('a', 'btn', 'Ver a grade da IA (PDF)'); a.href = r.iaGrade; a.target = '_blank'; a.rel = 'noopener'; c.append(a); }
        const ls = res.licoes_sugeridas || [];
        if (ls.length) {
          c.append(el('h3', '', 'Lições sugeridas'));
          ls.forEach(l => {
            const row = el('div', 'licao-sug');
            row.append(el('p', 'texto', l.texto + (l.compassos ? ` (compassos ${l.compassos})` : '')));
            const ok = el('button', 'btn primary', 'Aceitar como lição'); ok.type = 'button';
            ok.onclick = async () => { try { await setDoc(doc(collection(fs, 'treino', 'regras', 'licoes')), { texto: l.texto.slice(0, 1500), musica: r.titulo.slice(0, 120), ...me(), criadoEm: Date.now(), ativa: true }); ok.disabled = true; ok.textContent = 'Aceita'; toast('Lição guardada: vale para os próximos arranjos.'); } catch { toast('Não consegui guardar.'); } };
            row.append(ok); c.append(row);
          });
        }
      }
      if (r.uid === ME.uid) { const del = el('button', 'btn ghost', 'Apagar rodada'); del.type = 'button'; del.onclick = () => confirm('Apagar esta rodada de treino?') && deleteDoc(doc(fs, 'treino', 'regras', 'rodadas', r.id)).catch(() => toast('Não consegui apagar.')); c.append(del); }
      list.append(c);
    }
  }, () => list.replaceChildren(el('p', 'muted', 'Não consegui ler as rodadas.')));
}

// end-to-end tests only: draw the list from made-up suggestions, without Firebase
if (window.__testEquipe) window.__equipe = { desenha(items, admin) { ADMIN = admin; ME = { uid: 'eu' }; const main = $('#main'); main.replaceChildren();
  const list = el('section', 'list'); main.append(list);
  for (const [k, titulo, sub, fechado] of GRUPOS) { const g = items.filter(s => grupo(s) === k); if (!g.length) continue;
    const sec = el(fechado ? 'details' : 'section', 'grupo g-' + k); sec.append(el(fechado ? 'summary' : 'h3', '', `${titulo} (${g.length})`)); if (sub) sec.append(el('p', 'muted small', sub));
    g.forEach(s => sec.append(cartao(s))); list.append(sec); } }, grupo };

/* ---------- page ---------- */
const TABS = [['sugestoes', 'Sugestões', sugestoes], ['treinar', 'Treinar a IA', treinar], ['licoes', 'Lições', licoes], ['regras', 'Regras do Mestrinho', regras]];
let unsub = null;
function open(key) {
  if (unsub) { try { unsub(); } catch {} unsub = null; }
  document.querySelectorAll('[role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === key)));
  const main = $('#main'); main.replaceChildren();
  const t = TABS.find(x => x[0] === key) || TABS[0];
  const r = t[2](main); if (typeof r === 'function') unsub = r;
  try { history.replaceState(null, '', '#' + t[0]); } catch {}
}

if (window.__testToken) signInWithCustomToken(auth, window.__testToken).catch(e => console.error(e));  // end-to-end tests only
onAuthStateChanged(auth, async u => {
  ME = u;
  if (!u) return screen('Entre no app primeiro', 'Esta página é da Equipe do Salve. Entre com a sua conta no app e volte aqui.', ['Abrir o app', './']);
  $('#who').textContent = u.displayName || u.email || '';
  const [adm, eq] = await Promise.all([getDoc(doc(fs, 'admins', u.uid)).catch(() => null), getDoc(doc(fs, 'equipe', u.uid)).catch(() => null)]);
  ADMIN = !!(adm && adm.exists());
  if (!((adm && adm.exists()) || (eq && eq.exists()))) return screen('Equipe do Salve', 'Sua conta não faz parte da Equipe do Salve. Se deveria, peça para o dono do app marcar você no painel de admin.', ['Voltar para o app', './']);
  const nav = $('#tabs'); nav.hidden = false; nav.replaceChildren();
  TABS.forEach(([k, label]) => { const b = el('button', 'tab', label); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.k = k; b.onclick = () => open(k); nav.append(b); });
  open((location.hash || '').slice(1) || 'sugestoes');
});
