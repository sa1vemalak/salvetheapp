/* salvetheapp · Painel de admin (admin.html): só o dono do app. Tudo o que ele acompanha num lugar só: novos
   cadastros, quem usa e com que frequência, bandas e o custo dos robôs (limite por banda), sugestões e problemas
   com o parecer do júri e a correção automática, quem entra na Equipe do Salve, códigos de acesso e cadastro aberto, e relatórios em planilha.
   O relatório vem da função `painel` (server/functions/painel.js), que confere no servidor se a conta está em
   admins/{uid}; os códigos, o cadastro aberto e o andamento das sugestões usam as regras do Firestore (só admin).
   Build: npx esbuild admin.js --bundle --minify --format=iife --target=es2019 --outfile=../app/admin.js */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

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
const URL_PAINEL = 'https://southamerica-east1-salvetheapp-3cceb.cloudfunctions.net/painel';
const TESTE = window.__testAdmin;   // end-to-end tests: made-up data, no Firebase

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const data = t => t ? new Date(+t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–';
const quando = t => t ? new Date(+t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–';
const real = v => 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ',');
function ha(t) {
  if (!t) return 'nunca';
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 2) return 'agora'; if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24); return d === 1 ? 'ontem' : `há ${d} dias`;
}
const nomeMes = k => { const [a, m] = String(k).split('-'); return ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][+m - 1] + '/' + String(a).slice(2); };
let toastT = null;
const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); };
let R = null, ME = null;

function screen(title, text, link) {
  const main = $('#main'); main.replaceChildren(); $('#tabs').hidden = true;
  const box = el('section', 'card'); box.append(el('h2', '', title), el('p', 'muted', text));
  if (link) { const a = el('a', 'btn primary', link[0]); a.href = link[1]; box.append(a); }
  main.append(box);
}

async function chamar(metodo, corpo) {
  if (TESTE) return TESTE.chamar ? TESTE.chamar(metodo, corpo) : { ok: true };
  const tk = await auth.currentUser.getIdToken();
  const r = await fetch(URL_PAINEL, { method: metodo, headers: { Authorization: 'Bearer ' + tk, ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.erro || 'erro ' + r.status); e.status = r.status; throw e; }
  return j;
}

/* ---------- pieces ---------- */
function numero(v, rotulo, extra, alvo) {
  const c = el(alvo ? 'button' : 'div', 'num' + (alvo ? ' link' : ''));
  if (alvo) { c.type = 'button'; c.onclick = () => abrir(alvo); }
  c.append(el('b', '', String(v)), el('span', '', rotulo)); if (extra) c.append(el('small', '', extra));
  return c;
}
function barras(lista, campo, rot) {   // a small bar chart, one bar per day/month
  const max = Math.max(1, ...lista.map(x => x[campo]));
  const w = el('div', 'barras'); w.setAttribute('role', 'img');
  w.setAttribute('aria-label', lista.map(x => `${rot(x)}: ${x[campo]}`).join(', '));
  lista.forEach(x => { const c = el('div', 'col'); const b = el('i'); b.style.height = Math.max(2, Math.round(x[campo] / max * 100)) + '%';
    b.title = `${rot(x)}: ${x[campo]}`; c.append(el('em', '', x[campo] ? String(x[campo]) : ''), b, el('span', '', rot(x))); w.append(c); });
  return w;
}
function tabela(cols, linhas, vazio) {
  if (!linhas.length) return el('p', 'muted', vazio || 'Nada ainda.');
  const wrap = el('div', 'tabwrap'), t = el('table'), th = el('tr');
  cols.forEach(c => th.append(el('th', c.num ? 'n' : '', c.t))); const thead = el('thead'); thead.append(th); t.append(thead);
  const tb = el('tbody');
  linhas.forEach(l => { const tr = el('tr', l.__cls || ''); cols.forEach(c => { const td = el('td', c.num ? 'n' : ''); const v = c.v(l); v && v.nodeType ? td.append(v) : (td.textContent = v == null ? '' : String(v)); tr.append(td); }); tb.append(tr); });
  t.append(tb); wrap.append(t); return wrap;
}
const card = (titulo, sub) => { const c = el('section', 'card'); if (titulo) c.append(el('h2', '', titulo)); if (sub) c.append(el('p', 'muted small', sub)); return c; };
const pessoaTxt = p => { const d = el('div', 'quem'); d.append(el('b', '', p.nome || p.email || 'Sem nome')); if (p.nome && p.email) d.append(el('small', '', p.email)); return d; };
function freq(p) {
  if (p.dias30 >= 12) return ['toda semana, quase todo dia', 'alta'];
  if (p.dias30 >= 4) return ['toda semana', 'media'];
  if (p.dias30 >= 1) return ['de vez em quando', 'baixa'];
  return ['parado', 'zero'];
}

/* ---------- Resumo ---------- */
function resumo(main) {
  const r = R.resumo;
  const nums = el('div', 'nums');
  nums.append(
    numero(r.novasNaoVistas, r.novasNaoVistas === 1 ? 'cadastro novo' : 'cadastros novos', `${r.novas7} nos últimos 7 dias`, 'cadastros'),
    numero(r.ativosHoje, 'usaram hoje', `${r.ativos7} na semana · ${r.ativos30} no mês`, 'pessoas'),
    numero(real(r.gastoMes), 'robôs em ' + nomeMes(r.mes), r.bandasNoLimite ? `${r.bandasNoLimite} banda${r.bandasNoLimite > 1 ? 's' : ''} no limite` : `limite ${real(R.config.limiteReais)} por banda`, 'bandas'),
    numero(r.sugestoesAbertas, 'sugestões abertas', r.bugsNaFila || r.prsParaJuntar ? `${r.bugsNaFila} na fila da correção · ${r.prsParaJuntar} PR para juntar` : 'nada na fila da correção', 'sugestoes'),
    numero(r.pessoas, 'pessoas com conta', `${r.bandas} bandas`, 'pessoas'),
    numero(r.caio14, 'perguntas ao Caio', 'nos últimos 14 dias'));
  main.append(nums);
  const c1 = card('Quantas pessoas abriram o app', 'Por dia, nos últimos 14 dias. Conta a partir desta versão do app.');
  c1.append(barras(R.aberturas, 'pessoas', x => x.dia.slice(8)));
  const c2 = card('Perguntas ao Caio', 'Por dia, nos últimos 14 dias, todas as bandas juntas.');
  c2.append(barras(R.caio, 'perguntas', x => x.dia.slice(8)));
  const lado = el('div', 'duas'); lado.append(c1, c2); main.append(lado);
  const novos = R.pessoas.filter(p => p.novo).slice(0, 5);
  if (novos.length) {
    const c = card('Chegaram agora'); novos.forEach(p => c.append(linhaCadastro(p))); main.append(c);
    const b = el('button', 'btn', 'Ver todos os cadastros'); b.type = 'button'; b.onclick = () => abrir('cadastros'); c.append(b);
  }
  const caras = R.bandas.filter(b => b.mes.reais > 0).slice(0, 5);
  if (caras.length) {
    const c = card('Bandas que mais gastaram neste mês');
    caras.forEach(b => c.append(linhaGasto(b))); main.append(c);
  }
}
function linhaGasto(b) {
  const lim = R.config.limiteReais, p = b.semLimite ? 0 : Math.min(100, b.mes.reais / lim * 100);
  const row = el('div', 'gasto'); const t = el('div', 'row between');
  t.append(el('b', '', b.nome), el('span', 'mono', b.semLimite ? real(b.mes.reais) + ' · sem limite' : `${real(b.mes.reais)} de ${real(lim)}`));
  const bar = el('div', 'barra' + (p >= 100 ? ' cheia' : p >= 75 ? ' quase' : '')); bar.style.setProperty('--p', (b.semLimite ? 0 : p) + '%');
  row.append(t, bar); return row;
}

/* ---------- Cadastros ---------- */
function linhaCadastro(p) {
  const row = el('div', 'cad' + (p.novo ? ' novo' : ''));
  const a = el('div', 'row between'); a.append(pessoaTxt(p), el('span', 'muted small', quando(p.criadoEm)));
  row.append(a);
  const info = [p.entrada && 'entrou com ' + p.entrada];
  const bs = (p.entrouEm && p.entrouEm.length ? p.entrouEm.map(x => `${x.banda || x.bandaId} (${x.papel || ''}${x.como ? ', ' + x.como : ''})`) : p.bandas.map(x => `${x.nome} (${x.papel})`));
  info.push(bs.length ? 'banda: ' + bs.join(', ') : 'ainda sem banda');
  row.append(el('p', 'muted small', info.filter(Boolean).join(' · ')));
  if (p.novo) row.prepend(el('span', 'chip novo', 'novo'));
  return row;
}
function cadastros(main) {
  const novos = R.pessoas.filter(p => p.novo);
  const c = card(novos.length ? `${novos.length} cadastro${novos.length > 1 ? 's' : ''} novo${novos.length > 1 ? 's' : ''}` : 'Nenhum cadastro novo',
    novos.length ? 'Desde a última vez que você marcou como visto.' : (R.vistoEm ? 'Você já viu todos até ' + quando(R.vistoEm) + '.' : ''));
  novos.forEach(p => c.append(linhaCadastro(p)));
  if (novos.length) {
    const b = el('button', 'btn primary', 'Marcar como visto'); b.type = 'button';
    b.onclick = async () => { b.disabled = true; try { await chamar('POST', { acao: 'visto' }); R.vistoEm = Date.now(); R.pessoas.forEach(p => { p.novo = false; }); R.resumo.novasNaoVistas = 0; marcaAba(); abrir('cadastros'); toast('Pronto, marcados como vistos.'); } catch { b.disabled = false; toast('Não consegui marcar agora.'); } };
    c.append(b);
  }
  main.append(c);
  const todos = card('Todos os cadastros', 'Do mais novo para o mais antigo.');
  todos.append(tabela([
    { t: 'Pessoa', v: p => pessoaTxt(p) }, { t: 'Quando', v: p => data(p.criadoEm) }, { t: 'Entrou com', v: p => p.entrada },
    { t: 'Bandas', v: p => p.bandas.map(b => b.nome).join(', ') || '–' }],
    R.pessoas.map(p => ({ ...p, __cls: p.novo ? 'novo' : '' }))));
  main.append(todos);
}

/* ---------- Pessoas (frequência) ---------- */
function pessoas(main) {
  const c = card('Quem usa e com que frequência', 'Dias em que a pessoa abriu o app nos últimos 30 dias. A contagem começa nesta versão; antes dela só aparece o último login.');
  const busca = el('input'); busca.type = 'search'; busca.placeholder = 'Procurar por nome, e-mail ou banda'; busca.setAttribute('aria-label', 'Procurar pessoa');
  const ord = el('select'); ord.setAttribute('aria-label', 'Ordem');
  [['ultimo', 'Último uso'], ['dias30', 'Mais frequentes'], ['criadoEm', 'Mais novos']].forEach(([v, t]) => { const o = el('option', '', t); o.value = v; ord.append(o); });
  const linha = el('div', 'row'); linha.append(busca, ord); c.append(linha);
  const caixa = el('div'); c.append(caixa); main.append(c);
  const desenha = () => {
    const q = busca.value.trim().toLowerCase(), k = ord.value;
    const l = R.pessoas.filter(p => !q || [p.nome, p.email, ...p.bandas.map(b => b.nome)].join(' ').toLowerCase().includes(q)).sort((a, b) => (b[k] || 0) - (a[k] || 0));
    caixa.replaceChildren(tabela([
      { t: 'Pessoa', v: p => pessoaTxt(p) },
      { t: 'Último uso', v: p => ha(p.ultimo) },
      { t: 'Dias (7)', num: 1, v: p => p.dias7 }, { t: 'Dias (30)', num: 1, v: p => p.dias30 },
      { t: 'Frequência', v: p => { const [t, k] = freq(p); return el('span', 'freq ' + k, t); } },
      { t: 'Bandas', v: p => p.bandas.map(b => `${b.nome} (${b.papel})`).join(', ') || '–' },
      { t: 'Equipe', v: p => p.equipe ? el('span', 'chip eq', p.admin ? 'dono' : 'equipe') : '' }], l, 'Ninguém com esse nome.'));
  };
  busca.oninput = desenha; ord.onchange = desenha; desenha();
}

/* ---------- Bandas e custo ---------- */
function bandas(main) {
  const lim = R.config.limiteReais;
  const c = card('Custo dos robôs por banda', `Caio, Malak, Mestrinho e o júri das sugestões, em ${nomeMes(R.resumo.mes)}. Cada banda pode gastar até ${real(lim)} por mês; depois os robôs param até o dia 1º.`);
  R.bandas.forEach(b => {
    const box = el('div', 'banda');
    box.append(linhaGasto(b));
    const partes = [['Caio', b.mes.caio], ['Malak', b.mes.malak], ['Mestrinho', b.mes.mestrinho], ['Júri', b.mes.juri]].filter(x => x[1] > 0).map(x => `${x[0]} ${real(x[1])}`);
    box.append(el('p', 'muted small', [`dono: ${b.donoNome || '–'}`, `${b.membros} pessoa${b.membros === 1 ? '' : 's'} (${b.ativos7} usaram na semana)`, b.codigo && 'código ' + b.codigo, 'criada ' + data(b.criadaEm), partes.join(' · ')].filter(Boolean).join(' · ')));
    const hist = el('div', 'hist'); b.meses.slice().reverse().forEach(m => hist.append(el('span', '', `${nomeMes(m.mes)} ${real(m.reais)}`))); box.append(hist);
    if (b.semLimitePorAdmin) box.append(el('p', 'muted small', 'Sem limite: é uma banda sua.'));
    else {
      const sw = el('label', 'switch'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = b.semLimiteManual;
      cb.onchange = async () => { cb.disabled = true; try { await chamar('POST', { acao: 'semLimite', banda: b.id, valor: cb.checked }); b.semLimiteManual = b.semLimite = cb.checked; toast(cb.checked ? 'Banda sem limite.' : 'A banda volta a ter o limite do mês.'); abrir('bandas'); } catch { cb.checked = !cb.checked; toast('Não consegui mudar.'); } cb.disabled = false; };
      sw.append(cb, document.createTextNode(' Liberar esta banda do limite')); box.append(sw);
    }
    c.append(box);
  });
  if (!R.bandas.length) c.append(el('p', 'muted', 'Nenhuma banda ainda.'));
  main.append(c);
  const cf = card('Limite por banda', 'Vale para todas as bandas que não estão liberadas.');
  const row = el('div', 'row'); const inp = el('input'); inp.type = 'number'; inp.min = '1'; inp.max = '1000'; inp.step = '1'; inp.value = String(lim); inp.style.width = '110px'; inp.setAttribute('aria-label', 'Limite em reais por mês');
  const sv = el('button', 'btn', 'Salvar limite'); sv.type = 'button';
  sv.onclick = async () => { const v = Number(inp.value); if (!(v >= 1 && v <= 1000)) return toast('Use um valor de R$ 1 a R$ 1.000.'); sv.disabled = true; try { await chamar('POST', { acao: 'limite', reais: v }); R.config.limiteReais = v; toast('Limite salvo: ' + real(v) + ' por mês.'); abrir('bandas'); } catch { toast('Não consegui salvar.'); } sv.disabled = false; };
  row.append(el('span', '', 'R$'), inp, el('span', 'muted', 'por mês'), sv); cf.append(row); main.append(cf);
}

/* ---------- Sugestões e correções ---------- */
const GRUPOS = [['aprovar', 'Para você aprovar'], ['bug', 'Problemas confirmados pelo júri'], ['juri', 'Esperando o júri'], ['andamento', 'Aprovadas e em andamento'], ['recusada', 'Recusadas pelo júri'], ['fim', 'Feitas e descartadas']];
const CORR = { 'na fila': 'na fila da correção automática', reproduzindo: 'a correção está tentando reproduzir', pr: 'corrigido num PR: falta você juntar e publicar', nao_reproduzi: 'a correção não conseguiu reproduzir', erro: 'a correção deu erro; tenta de novo amanhã' };
function sugestoes(main) {
  const nums = el('div', 'nums small');
  GRUPOS.forEach(([k, t]) => nums.append(numero(R.grupos[k] || 0, t)));
  main.append(nums);
  GRUPOS.forEach(([k, t]) => {
    const l = R.sugestoes.filter(s => s.grupo === k); if (!l.length) return;
    const fechado = k === 'recusada' || k === 'fim';
    const sec = el(fechado ? 'details' : 'section', 'card grupo');
    sec.append(el(fechado ? 'summary' : 'h2', '', `${t} (${l.length})`));
    l.forEach(s => {
      const it = el('article', 'sug'); const h = el('div', 'row between');
      const tit = el('div', 'tit'); tit.append(el('span', 'chip' + (s.tipo === 'problema' ? ' prob' : ''), s.tipo === 'problema' ? 'Algo deu errado' : 'Ideia'), el('b', '', (s.juri && s.juri.resumo) || s.texto.slice(0, 70)));
      h.append(tit, el('span', 'muted small', quando(s.criadoEm))); it.append(h);
      it.append(el('p', 'muted small', [s.nome || 'Alguém', s.bandaNome].filter(Boolean).join(' · ')), el('p', 'texto', s.texto));
      if (s.juri && s.juri.estado === 'pronto') it.append(el('p', 'small', `Júri: ${s.juri.vale ? 'vale' : 'não vale'} (${s.juri.sim} de ${s.juri.de}) · nota ${String(s.juri.nota).replace('.', ',')}`));
      if (s.correcao) { const p = el('p', 'small corr', 'Correção: ' + (CORR[s.correcao.estado] || s.correcao.estado)); if (s.correcao.pr) { const a = el('a', '', ' abrir o PR'); a.href = s.correcao.pr; a.target = '_blank'; a.rel = 'noopener'; p.append(a); } it.append(p); }
      const acoes = el('div', 'row end');
      const passo = (rot, st, cls) => { const b = el('button', 'btn ' + (cls || ''), rot); b.type = 'button';
        b.onclick = async () => { b.disabled = true; try { if (!TESTE) await updateDoc(doc(fs, 'sugestoes', s.id), { status: st, atualizadoEm: Date.now() }); s.status = st; s.grupo = st === 'feita' || st === 'descartada' ? 'fim' : 'andamento'; recontar(); abrir('sugestoes'); toast('Sugestão: ' + st + '.'); } catch { b.disabled = false; toast('Não consegui mudar.'); } };
        return b; };
      if (k === 'aprovar' || k === 'recusada' || k === 'juri' || k === 'bug') acoes.append(passo('Descartar', 'descartada', 'ghost'), passo('Aprovar', 'aprovada', 'primary'));
      if (k === 'andamento') acoes.append(passo('Feita', 'feita', 'primary'));
      if (acoes.children.length) it.append(acoes);
      sec.append(it);
    });
    main.append(sec);
  });
  if (!R.sugestoes.length) main.append(card('Nenhuma sugestão ainda', 'Quando alguém tocar em "Sugerir melhoria" no app, aparece aqui depois do júri.'));
  const eq = card('', 'Para ver o print anexado, responder a pessoa e copiar a chave da rotina diária, use a página da equipe.');
  const a = el('a', 'btn', 'Abrir a página da equipe'); a.href = 'equipe.html'; eq.append(a); main.append(eq);
}
function recontar() { R.grupos = {}; R.sugestoes.forEach(s => { R.grupos[s.grupo] = (R.grupos[s.grupo] || 0) + 1; }); }

/* ---------- Acesso (códigos e cadastro aberto) ---------- */
/* who opens the "Equipe do Salve" page: the server creates/deletes equipe/{uid} (the rules read it) */
function equipeCard(main) {
  const c = card('Equipe do Salve', 'Quem você marcar aqui ganha o ícone "Equipe do Salve" na tela inicial e entra na página da equipe (treinar a IA, lições, regras do Mestrinho e as próprias sugestões). Desmarcou, o ícone some e a página fecha para a pessoa. Cadastros, uso e custo continuam só no seu painel.');
  const busca = el('input'); busca.type = 'search'; busca.placeholder = 'Procurar por nome ou e-mail'; busca.setAttribute('aria-label', 'Procurar pessoa para a equipe');
  const linha = el('div', 'row'); linha.append(busca); c.append(linha);
  const caixa = el('div', 'list equipe'); c.append(caixa); main.append(c);
  const desenha = () => {
    const q = busca.value.trim().toLowerCase();
    const l = R.pessoas.filter(p => !q || [p.nome, p.email].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (b.admin - a.admin) || (b.equipe - a.equipe) || String(a.nome || a.email).localeCompare(String(b.nome || b.email), 'pt-BR'));
    caixa.replaceChildren(...l.slice(0, q ? 60 : 30).map(p => {
      const row = el('label', 'eqrow' + (p.equipe ? ' on' : '')); row.append(pessoaTxt(p));
      if (p.admin) { row.append(el('span', 'muted small', 'sempre (dono do app)')); return row; }
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!p.equipe; cb.dataset.uid = p.uid;
      cb.setAttribute('aria-label', `${p.nome || p.email} acessa a Equipe do Salve`);
      cb.onchange = async () => { cb.disabled = true;
        try { await chamar('POST', { acao: 'equipe', uid: p.uid, valor: cb.checked }); p.equipe = cb.checked; row.classList.toggle('on', cb.checked);
          toast(cb.checked ? `${p.nome || p.email} agora vê a Equipe do Salve.` : `${p.nome || p.email} não vê mais a Equipe do Salve.`); }
        catch (e) { cb.checked = !cb.checked; toast(e.message || 'Não consegui mudar.'); }
        cb.disabled = false; };
      const sw = el('span', 'switch'); sw.append(cb, document.createTextNode(' acessa')); row.append(sw); return row;
    }));
    if (!l.length) caixa.append(el('p', 'muted', 'Ninguém com esse nome.'));
    else if (!q && l.length > 30) caixa.append(el('p', 'muted small', `Mostrando 30 de ${l.length}. Procure pelo nome para achar os outros.`));
  };
  busca.oninput = desenha; desenha();
}
async function acesso(main) {
  const c = card('Cadastro', 'Enquanto o cadastro estiver fechado, criar banda nova exige um código de acesso. Entrar numa banda por convite continua livre.');
  const sw = el('label', 'switch'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = R.config.cadastroAberto;
  cb.onchange = async () => { cb.disabled = true; try { if (!TESTE) await setDoc(doc(fs, 'config', 'app'), { cadastroAberto: cb.checked }); R.config.cadastroAberto = cb.checked; toast(cb.checked ? 'Cadastro aberto para todos.' : 'Cadastro fechado: só com código.'); } catch { cb.checked = !cb.checked; toast('Não consegui mudar.'); } cb.disabled = false; };
  sw.append(cb, document.createTextNode(' Cadastro aberto para todos (qualquer pessoa cria banda, sem código)')); c.append(sw); main.append(c);

  const k = card('Códigos de acesso', 'Para alguém testar o app com a própria banda. "Copiar convite" copia a mensagem pronta com o código.');
  const row = el('div', 'row'); const lim = el('input'); lim.type = 'number'; lim.min = '1'; lim.max = '10000'; lim.value = '1'; lim.style.width = '90px'; lim.setAttribute('aria-label', 'Quantas bandas o código pode criar');
  const nota = el('input'); nota.type = 'text'; nota.placeholder = 'Para quem é (ex.: Banda do Zé)'; nota.style.flex = '1'; nota.style.minWidth = '160px';
  const novo = el('button', 'btn primary', 'Criar código'); novo.type = 'button';
  row.append(lim, nota, novo); k.append(row);
  const lista = el('div', 'list'); k.append(lista); main.append(k);
  const convite = c2 => `Você foi convidado para testar o salvetheapp, o app que salva músicos.\nAbra https://salvetheapp.web.app, entre com a sua conta, toque em "Criar banda" e use o código ${c2}.`;
  const desenha = async () => {
    let cods = [];
    try { cods = TESTE ? (TESTE.codigos || []) : (await getDocs(collection(fs, 'codigos'))).docs.map(d => ({ id: d.id, ...d.data() })); } catch { lista.replaceChildren(el('p', 'muted', 'Não consegui ler os códigos.')); return; }
    cods.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    lista.replaceChildren(tabela([
      { t: 'Código', v: x => el('span', 'mono', x.id) }, { t: 'Para quem', v: x => x.nota || '–' },
      { t: 'Usado', num: 1, v: x => `${x.usados || 0} de ${x.limite}` }, { t: 'Criado', v: x => data(x.criadoEm) },
      { t: '', v: x => { const d = el('div', 'row end');
        const cp = el('button', 'btn', 'Copiar convite'); cp.type = 'button';
        cp.onclick = async () => { try { await navigator.clipboard.writeText(convite(x.id)); toast('Convite copiado.'); } catch { prompt('Copie e mande:', convite(x.id)); } };
        const at = el('button', 'btn ghost', x.ativo ? 'Desativar' : 'Ativar'); at.type = 'button';
        at.onclick = async () => { try { if (!TESTE) await updateDoc(doc(fs, 'codigos', x.id), { ativo: !x.ativo }); x.ativo = !x.ativo; desenha(); } catch { toast('Não consegui mudar.'); } };
        d.append(cp, at); return d; } }],
      cods.map(x => ({ ...x, __cls: x.ativo ? '' : 'off' })), 'Nenhum código ainda.'));
  };
  novo.onclick = async () => {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c2 = '';
    crypto.getRandomValues(new Uint8Array(8)).forEach(x => { c2 += abc[x % abc.length]; });
    const d = { ativo: true, limite: Math.max(1, Math.min(10000, lim.value | 0 || 1)), usados: 0, nota: nota.value.slice(0, 200), criadoEm: Date.now() };
    novo.disabled = true;
    try { if (TESTE) (TESTE.codigos = TESTE.codigos || []).push({ id: c2, ...d }); else await setDoc(doc(fs, 'codigos', c2), d); nota.value = ''; await desenha(); toast('Código ' + c2 + ' criado.'); }
    catch { toast('Não consegui criar o código.'); }
    novo.disabled = false;
  };
  desenha();
}

/* ---------- Relatórios (planilhas) ---------- */
function csv(nome, cols, linhas) {
  const q = v => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const txt = '﻿' + [cols.map(c => q(c[0])).join(';'), ...linhas.map(l => cols.map(c => q(c[1](l))).join(';'))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
  a.download = `salvetheapp-${nome}-${new Date().toISOString().slice(0, 10)}.csv`; document.body.append(a); a.click(); a.remove();
  toast('Planilha baixada.');
}
const num = v => (Number(v) || 0).toFixed(2).replace('.', ',');
const RELATORIOS = [
  ['pessoas', 'Pessoas e frequência', 'Cada conta: e-mail, quando entrou, como entrou, último uso, dias de uso na semana e no mês, bandas.', () => csv('pessoas', [
    ['Nome', p => p.nome], ['E-mail', p => p.email], ['Cadastro', p => data(p.criadoEm)], ['Entrou com', p => p.entrada], ['Último uso', p => quando(p.ultimo)],
    ['Dias de uso (7)', p => p.dias7], ['Dias de uso (30)', p => p.dias30], ['Aberturas (30)', p => p.aberturas30], ['Bandas', p => p.bandas.map(b => `${b.nome} (${b.papel})`).join(', ')]], R.pessoas)],
  ['bandas', 'Bandas e custo do mês', 'Cada banda: dono, pessoas, código usado, gasto do mês por robô e o total dos últimos 6 meses.', () => csv('bandas', [
    ['Banda', b => b.nome], ['Dono', b => b.donoNome], ['Pessoas', b => b.membros], ['Usaram na semana', b => b.ativos7], ['Código', b => b.codigo], ['Criada', b => data(b.criadaEm)],
    ['Mês (R$)', b => num(b.mes.reais)], ['Caio', b => num(b.mes.caio)], ['Malak', b => num(b.mes.malak)], ['Mestrinho', b => num(b.mes.mestrinho)], ['Júri', b => num(b.mes.juri)],
    ['Sem limite', b => b.semLimite ? 'sim' : 'não'], ...R.bandas[0] ? R.bandas[0].meses.map((m, i) => [nomeMes(m.mes) + ' (R$)', b => num(b.meses[i].reais)]) : []], R.bandas)],
  ['sugestoes', 'Sugestões e correções', 'As últimas 60 sugestões: tipo, texto, quem mandou, parecer do júri, andamento e PR da correção.', () => csv('sugestoes', [
    ['Data', s => quando(s.criadoEm)], ['Tipo', s => s.tipo], ['Texto', s => s.texto], ['Quem', s => s.nome], ['Banda', s => s.bandaNome], ['Situação', s => s.status],
    ['Júri', s => s.juri && s.juri.estado === 'pronto' ? (s.juri.vale ? 'vale' : 'não vale') + (s.juri.bug ? ' (problema)' : '') : (s.juri ? s.juri.estado : '')], ['Correção', s => s.correcao ? s.correcao.estado : ''], ['PR', s => s.correcao ? s.correcao.pr : '']], R.sugestoes)],
  ['uso', 'Uso por dia', 'Nos últimos 14 dias: quantas pessoas abriram o app e quantas perguntas o Caio respondeu.', () => csv('uso-por-dia', [
    ['Dia', x => x.dia], ['Pessoas que abriram', x => x.pessoas], ['Perguntas ao Caio', x => (R.caio.find(c => c.dia === x.dia) || {}).perguntas || 0]], R.aberturas)],
];
function relatorios(main) {
  const c = card('Relatórios', 'Baixam como planilha (abre no Excel, Numbers ou Google Planilhas).');
  RELATORIOS.forEach(([k, t, d, f]) => { const row = el('div', 'rel'); const tx = el('div'); tx.append(el('b', '', t), el('p', 'muted small', d));
    const b = el('button', 'btn', 'Baixar'); b.type = 'button'; b.dataset.rel = k; b.onclick = f; row.append(tx, b); c.append(row); });
  main.append(c);
  main.append(el('p', 'muted small center', `Atualizado ${quando(R.geradoEm)}.`));
}

/* ---------- page ---------- */
const TABS = [['resumo', 'Resumo', resumo], ['cadastros', 'Cadastros', cadastros], ['pessoas', 'Pessoas', pessoas], ['equipe', 'Equipe do Salve', equipeCard], ['bandas', 'Bandas e custo', bandas],
  ['sugestoes', 'Sugestões', sugestoes], ['acesso', 'Acesso', acesso], ['relatorios', 'Relatórios', relatorios]];
function marcaAba() {
  const b = document.querySelector('[data-k="cadastros"]'); if (!b) return;
  const n = R.resumo.novasNaoVistas; b.replaceChildren(document.createTextNode('Cadastros'));
  if (n) b.append(el('span', 'ponto', n > 9 ? '9+' : String(n)));
}
function abrir(key) {
  const t = TABS.find(x => x[0] === key) || TABS[0];
  document.querySelectorAll('[role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === t[0])));
  const main = $('#main'); main.replaceChildren(); t[2](main);
  try { history.replaceState(null, '', '#' + t[0]); } catch {}
}
function montar(rel) {
  R = rel;
  const nav = $('#tabs'); nav.hidden = false; nav.replaceChildren();
  TABS.forEach(([k, label]) => { const b = el('button', 'tab', label); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.k = k; b.onclick = () => abrir(k); nav.append(b); });
  marcaAba();
  abrir((location.hash || '').slice(1) || 'resumo');
}
async function carregar() {
  $('#main').replaceChildren(el('p', 'muted', 'montando o painel…'));
  try { montar(await chamar('GET')); }
  catch (e) {
    if (e.status === 403) return screen('Painel de admin', 'Este painel é só do dono do salvetheapp.', ['Voltar para o app', './']);
    if (e.status === 401) return screen('Entre de novo', 'Sua entrada no app expirou. Abra o app, entre e volte aqui.', ['Abrir o app', './']);
    screen('Não consegui montar o painel', 'Confira a internet e tente de novo. Se continuar, a função do painel pode ainda não estar publicada.', ['Tentar de novo', 'admin.html']);
  }
}
$('#atualizar').onclick = () => TESTE ? montar(TESTE.relatorio) : carregar();

if (TESTE) { window.__admin = { montar, abrir }; if (TESTE.relatorio) montar(TESTE.relatorio); }
else {
  if (window.__testToken) signInWithCustomToken(auth, window.__testToken).catch(e => console.error(e));
  onAuthStateChanged(auth, async u => {
    ME = u;
    if (!u) return screen('Entre no app primeiro', 'Este painel é do dono do salvetheapp. Entre com a sua conta no app e volte aqui.', ['Abrir o app', './']);
    $('#who').textContent = u.displayName || u.email || '';
    // a first look on the page (the server checks again and decides)
    const adm = await getDoc(doc(fs, 'admins', u.uid)).catch(() => null);
    if (!adm || !adm.exists()) return screen('Painel de admin', 'Este painel é só do dono do salvetheapp.', ['Voltar para o app', './']);
    carregar();
  });
}
