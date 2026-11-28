/* Painel de admin (admin.html): everything the app owner follows in one place. Only an app admin (admins/{uid},
   written only from the console) gets an answer: the check is here, on the server, with the Admin SDK; the page
   only shows what comes back. Nothing here is readable by bands, musicians or the app team.

   GET               -> the report: resumo, cadastros, pessoas, bandas (with the robots' cost), caio, sugestoes, config
   POST { acao }     -> 'visto'                       marks the new signups as seen (admins/{uid}.painelVistoEm)
                        'limite', reais               the monthly robot budget per band (sistema/gasto.limiteReais)
                        'semLimite', banda, valor     a band with no budget limit (sistema/gasto.semLimite)
                        'equipe', uid, valor          who opens the "Equipe do Salve" page (equipe/{uid}: created or
                                                      deleted only here; the Firestore and Storage rules read it)

   Sources: Firebase Auth (who signed up, last sign-in), cadastros/{uid} (written by the functions in cadastros.js:
   how they entered and which bands they joined), users/{uid} (bands + acessos: { 'AAAA-MM-DD': n } written by the
   app on each open), bands/{b} (+ members, uso/{AAAA-MM}), sistema/uso/{dia} (Caio questions), sugestoes/*. */
'use strict';
const admin = require('firebase-admin');
const gasto = require('./gasto');

const DIA = 864e5;
// a day in Brazil time, e.g. "2026-11-28"
const diaBR = (t = Date.now()) => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);
const ultimosDias = n => Array.from({ length: n }, (_, i) => diaBR(Date.now() - i * DIA));
const ultimosMeses = n => { const d = new Date(Date.now() - 3 * 3600e3); return Array.from({ length: n }, (_, i) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); return x.toISOString().slice(0, 7); }); };
const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

async function eAdmin(db, req) {
  let user;
  try { user = await admin.auth().verifyIdToken(String(req.headers.authorization || '').replace(/^Bearer /, '')); }
  catch { return { code: 401, erro: 'Entre no app de novo.' }; }
  const a = await db.collection('admins').doc(user.uid).get();
  if (!a.exists) return { code: 403, erro: 'Este painel é só do dono do salvetheapp.' };
  return { user, adm: a.data() || {} };
}

async function contasDoAuth() {
  const out = []; let token;
  do {
    const r = await admin.auth().listUsers(1000, token);
    out.push(...r.users); token = r.pageToken;
  } while (token && out.length < 20000);
  return out;
}

const ENTRADA = { 'google.com': 'Google', password: 'e-mail e senha', emailLink: 'link no e-mail' };

/* the sugestões groups, the same as equipe.html */
function grupo(s) {
  const j = s.juri || {};
  if (s.status === 'feita' || s.status === 'descartada') return 'fim';
  if (s.status === 'aprovada' || s.status === 'em andamento') return 'andamento';
  if (j.estado !== 'pronto') return 'juri';
  if (j.bug) return 'bug';
  return j.vale ? 'aprovar' : 'recusada';
}

async function relatorio(db, adm) {
  const meses = ultimosMeses(6), dias30 = ultimosDias(30), dias14 = ultimosDias(14);
  const hoje = dias30[0], d7 = new Set(dias30.slice(0, 7)), d30 = new Set(dias30);
  const [contas, cad, users, bands, membros, usos, sug, cfgApp, cfgGasto, caioDias] = await Promise.all([
    contasDoAuth().catch(e => { console.error('painel auth:', e); return []; }),
    db.collection('cadastros').get().catch(() => ({ docs: [] })),
    db.collection('users').get(),
    db.collection('bands').get(),
    db.collectionGroup('members').get(),
    db.collectionGroup('uso').get(),
    db.collection('sugestoes').get(),
    db.collection('config').doc('app').get(),
    db.collection('sistema').doc('gasto').get(),
    Promise.all(dias14.map(d => db.collection('sistema').doc('uso').collection(d).get().then(s => [d, s.docs], () => [d, []]))),
  ]);
  const visto = Number(adm.painelVistoEm) || 0;
  const cadastros = new Map(cad.docs.map(d => [d.id, d.data() || {}]));
  const usersMap = new Map(users.docs.map(d => [d.id, d.data() || {}]));
  const g = cfgGasto.exists ? cfgGasto.data() || {} : {};
  const limite = Number(g.limiteReais) > 0 ? Number(g.limiteReais) : gasto.LIMITE_REAIS;
  const semLimiteCfg = Array.isArray(g.semLimite) ? g.semLimite : [];
  const admins = new Set((await db.collection('admins').get()).docs.map(d => d.id));
  const equipe = new Set((await db.collection('equipe').get().catch(() => ({ docs: [] }))).docs.map(d => d.id));

  // people: one row per account (Auth), with what the app knows about them
  const pessoas = contas.map(u => {
    const c = cadastros.get(u.uid) || {}, us = usersMap.get(u.uid) || {};
    const acessos = us.acessos && typeof us.acessos === 'object' ? us.acessos : {};
    const diasAtivos = Object.keys(acessos).filter(d => d30.has(d));
    const aberturas30 = diasAtivos.reduce((t, d) => t + (Number(acessos[d]) || 0), 0);
    const criadoEm = Number(c.em) || Date.parse(u.metadata.creationTime) || 0;
    const ultimoLogin = Date.parse(u.metadata.lastRefreshTime || u.metadata.lastSignInTime || '') || 0;
    const ultimo = Math.max(Number(us.ultimoAcesso) || 0, ultimoLogin);
    const bandasU = Object.entries(us.bands || {}).map(([id, v]) => ({ id, nome: (v && v.name) || id, papel: (v && v.role) || '' }));
    return {
      uid: u.uid, nome: c.nome || u.displayName || us.name || '', email: c.email || u.email || us.email || '',
      entrada: c.entrada || ENTRADA[(u.providerData[0] || {}).providerId] || (u.providerData[0] || {}).providerId || '',
      criadoEm, ultimo, hoje: !!acessos[hoje], dias7: diasAtivos.filter(d => d7.has(d)).length, dias30: diasAtivos.length, aberturas30,
      bandas: bandasU, entrouEm: Array.isArray(c.bandas) ? c.bandas.slice(0, 20) : [], admin: admins.has(u.uid), equipe: admins.has(u.uid) || equipe.has(u.uid), desativada: !!u.disabled,
      novo: criadoEm > visto && !admins.has(u.uid),
    };
  }).sort((a, b) => b.criadoEm - a.criadoEm);

  // bands: members, who owns it and what the robots cost this month and the 5 before
  const porBanda = new Map();
  membros.docs.forEach(d => { const b = d.ref.parent.parent; if (!b || b.parent.id !== 'bands') return;
    const l = porBanda.get(b.id) || []; l.push({ uid: d.id, papel: (d.data() || {}).role || '' }); porBanda.set(b.id, l); });
  const custo = new Map();
  usos.docs.forEach(d => { const b = d.ref.parent.parent; if (!b || b.parent.id !== 'bands' || !meses.includes(d.id)) return;
    const m = custo.get(b.id) || {}; const x = d.data() || {};
    m[d.id] = { reais: r2(x.reais), caio: r2(x.caio), malak: r2(x.malak), mestrinho: r2(x.mestrinho), juri: r2(x.juri) }; custo.set(b.id, m); });
  const nomeDe = uid => { const p = pessoas.find(x => x.uid === uid); return p ? (p.nome || p.email) : ''; };
  const bandas = bands.docs.map(d => {
    const b = d.data() || {}, m = custo.get(d.id) || {}, mem = porBanda.get(d.id) || [];
    const semLimite = semLimiteCfg.includes(d.id) || admins.has(b.owner);
    return { id: d.id, nome: b.name || d.id, dono: b.owner || '', donoNome: nomeDe(b.owner), criadaEm: Number(b.createdAt) || 0, codigo: b.codigo || '',
      membros: mem.length, musicos: mem.filter(x => x.papel === 'musico').length, editores: mem.filter(x => x.papel === 'editor').length,
      mes: m[meses[0]] || { reais: 0, caio: 0, malak: 0, mestrinho: 0, juri: 0 }, meses: meses.map(k => ({ mes: k, reais: (m[k] || {}).reais || 0 })),
      semLimite, semLimitePorAdmin: admins.has(b.owner), semLimiteManual: semLimiteCfg.includes(d.id),
      ativos7: mem.filter(x => { const p = pessoas.find(y => y.uid === x.uid); return p && p.dias7 > 0; }).length };
  }).sort((a, b) => b.mes.reais - a.mes.reais || b.criadaEm - a.criadaEm);

  // Caio questions per day (sistema/uso/{dia}/{banda} = { n }; the 'pessoa-' docs count the same questions per person)
  const caio = caioDias.map(([dia, docs]) => ({ dia, perguntas: docs.filter(d => !d.id.startsWith('pessoa-')).reduce((t, d) => t + (Number((d.data() || {}).n) || 0), 0) })).reverse();
  // app opens per day, everyone together
  const aberturas = dias30.slice(0, 14).map(dia => ({ dia,
    pessoas: pessoas.filter(p => { const a = (usersMap.get(p.uid) || {}).acessos; return a && a[dia]; }).length })).reverse();

  const sugs = sug.docs.map(d => ({ id: d.id, ...(d.data() || {}) })).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  const grupos = {}; sugs.forEach(s => { const k = grupo(s); grupos[k] = (grupos[k] || 0) + 1; });
  const sugestoes = sugs.slice(0, 60).map(s => ({ id: s.id, tipo: s.tipo || 'melhoria', texto: String(s.texto || '').slice(0, 600), nome: s.nome || '', bandaNome: s.bandaNome || '',
    criadoEm: s.criadoEm || 0, status: s.status || 'nova', grupo: grupo(s),
    juri: s.juri ? { estado: s.juri.estado, vale: !!s.juri.vale, bug: !!s.juri.bug, nota: s.juri.nota, resumo: s.juri.resumo || '', sim: s.juri.sim, de: s.juri.de } : null,
    correcao: s.correcao ? { estado: s.correcao.estado, pr: s.correcao.pr || '' } : null }));

  const mesTotal = bandas.reduce((t, b) => t + b.mes.reais, 0);
  const resumo = {
    pessoas: pessoas.length, novas7: pessoas.filter(p => p.criadoEm > Date.now() - 7 * DIA).length, novasNaoVistas: pessoas.filter(p => p.novo).length,
    ativosHoje: pessoas.filter(p => p.hoje).length, ativos7: pessoas.filter(p => p.dias7 > 0).length, ativos30: pessoas.filter(p => p.dias30 > 0).length,
    bandas: bandas.length, bandasNoLimite: bandas.filter(b => !b.semLimite && b.mes.reais >= limite).length,
    gastoMes: r2(mesTotal), mes: meses[0], caio14: caio.reduce((t, d) => t + d.perguntas, 0),
    sugestoesAbertas: (grupos.aprovar || 0) + (grupos.juri || 0) + (grupos.andamento || 0), bugsNaFila: sugs.filter(s => s.correcao && s.correcao.estado === 'na fila').length,
    prsParaJuntar: sugs.filter(s => s.correcao && s.correcao.estado === 'pr' && !['feita', 'descartada'].includes(s.status)).length,
  };
  return { geradoEm: Date.now(), vistoEm: visto, resumo, pessoas, bandas, caio, aberturas, sugestoes, grupos,
    config: { cadastroAberto: !!(cfgApp.exists && (cfgApp.data() || {}).cadastroAberto), limiteReais: limite, dolar: Number(g.dolar) > 0 ? Number(g.dolar) : gasto.DOLAR } };
}

async function acao(db, uid, b) {
  const a = String(b.acao || '');
  if (a === 'visto') { await db.collection('admins').doc(uid).set({ painelVistoEm: Date.now() }, { merge: true }); return { ok: true }; }
  const ref = db.collection('sistema').doc('gasto');
  if (a === 'limite') {
    const reais = Number(b.reais);
    if (!(reais >= 1 && reais <= 1000)) return { code: 400, erro: 'O limite vai de R$ 1 a R$ 1.000.' };
    await ref.set({ limiteReais: Math.round(reais * 100) / 100 }, { merge: true }); return { ok: true };
  }
  if (a === 'semLimite') {
    const banda = String(b.banda || '');
    if (!/^[\w.-]{1,120}$/.test(banda) || !(await db.collection('bands').doc(banda).get()).exists) return { code: 400, erro: 'banda não encontrada' };
    const F = admin.firestore.FieldValue;
    await ref.set({ semLimite: b.valor ? F.arrayUnion(banda) : F.arrayRemove(banda) }, { merge: true }); return { ok: true };
  }
  if (a === 'equipe') {
    const alvo = String(b.uid || '');
    if (!/^[\w-]{1,128}$/.test(alvo)) return { code: 400, erro: 'pessoa não encontrada' };
    if ((await db.collection('admins').doc(alvo).get()).exists) return { code: 400, erro: 'O dono do app sempre entra na Equipe do Salve.' };
    const ref2 = db.collection('equipe').doc(alvo);
    if (!b.valor) { await ref2.delete(); return { ok: true, equipe: false }; }
    let u;
    try { u = await admin.auth().getUser(alvo); } catch { return { code: 400, erro: 'pessoa não encontrada' }; }
    const antes = await ref2.get();
    await ref2.set({ nome: String(u.displayName || u.email || '').slice(0, 80), email: String(u.email || '').slice(0, 200), papel: (antes.exists && (antes.data() || {}).papel) || 'parceiro',
      desde: (antes.exists && (antes.data() || {}).desde) || Date.now(), por: uid }, { merge: true });
    return { ok: true, equipe: true };
  }
  return { code: 400, erro: 'ação desconhecida' };
}

function handler(db) {
  return async (req, res) => {
    const quem = await eAdmin(db, req);
    if (quem.erro) return res.status(quem.code).json({ erro: quem.erro });
    try {
      if (req.method === 'GET') return res.json(await relatorio(db, quem.adm));
      if (req.method === 'POST') { const r = await acao(db, quem.user.uid, req.body || {}); return res.status(r.code || 200).json(r); }
      return res.status(405).end();
    } catch (e) { console.error('painel:', e); return res.status(500).json({ erro: 'Não consegui montar o painel agora.' }); }
  };
}

module.exports = { handler, relatorio, acao, grupo, diaBR };
