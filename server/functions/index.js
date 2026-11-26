/* salvetheapp server. agente: the "Caio" assistant inside the app.
   It reads the band's show (songs, parts, bar maps, notes on the scores, DAW markers) and answers questions or
   proposes changes. It never writes: the app shows the proposal, a dono/editor approves, and the app applies it with
   that person's own permissions (the database rules still decide), after saving a version of each song touched. */
'use strict';
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const bus = require('./llm/bus');

admin.initializeApp();
const db = admin.firestore();
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const ORIGINS = ['https://salvetheapp.web.app', 'https://salvetheapp.firebaseapp.com', 'https://salvetheapp-3cceb.web.app',
  'https://salvetheapp-3cceb.firebaseapp.com', 'https://pnpl10y.web.app', 'http://localhost:8795'];
const MAX_STEPS = 10;           // model turns per question
const DAILY_LIMIT = 300;        // questions per band per day

// the app stores arrays inside arrays as { __a: [...] }
const dec = v => Array.isArray(v) ? v.map(dec) : v && typeof v === 'object'
  ? (Object.keys(v).length === 1 && Array.isArray(v.__a) ? dec(v.__a) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;
const data = async ref => { const s = await ref.get(); return s.exists ? dec(s.data()) : null; };

/* ---------------- tools ---------------- */
const str = d => ({ type: 'string', description: d });
const int = d => ({ type: 'integer', description: d });
const obj = (props, req = Object.keys(props)) => ({ type: 'object', properties: props, required: req, additionalProperties: false });

const TOOLS = [
  { name: 'ver_show', description: 'O show aberto: nome, músicas na ordem (id, título, rótulo, partes) e marcadores da DAW (compasso da DAW onde cada música começa e onde a partitura troca).', input_schema: obj({}), strict: true },
  { name: 'ver_musica', description: 'Detalhes de uma música: partes, quantos compassos cada parte tem e em quantas páginas, letras de ensaio se houver, andamentos e as notas de texto da música.', input_schema: obj({ musica: str('id da música, como aparece em ver_show') }), strict: true },
  { name: 'ver_anotacoes', description: 'Anotações escritas em comum nas partituras de uma música (a camada "Em comum", que todos da banda veem), com o compasso aproximado de cada uma.', input_schema: obj({ musica: str('id da música'), parte: str('chave da parte (ex.: grade, base, trumpet, tenor-sax, trombone) ou "todas"') }), strict: true },
  {
    name: 'propor_mudancas',
    description: 'Entrega ao usuário uma lista de mudanças para ele aprovar. Use uma vez, no fim, quando o pedido for para mudar algo. Nada é aplicado sem aprovação.',
    strict: true,
    input_schema: obj({
      resumo: str('uma frase dizendo o que muda'),
      mudancas: {
        type: 'array',
        items: {
          anyOf: [
            obj({ tipo: { type: 'string', enum: ['anotar'] }, musica: str('id'), parte: str('chave da parte'), compasso: int('número do compasso'), texto: str('texto curto escrito na partitura, ex.: "respira", "mf", "só na 2ª vez"'), descricao: str('o que é, para o usuário ler') }),
            obj({ tipo: { type: 'string', enum: ['remover_anotacao'] }, musica: str('id'), parte: str('chave da parte'), pagina: int('página'), id: str('id da anotação, de ver_anotacoes'), descricao: str('o que é') }),
            obj({ tipo: { type: 'string', enum: ['ordem_show'] }, ordem: { type: 'array', items: { type: 'string' }, description: 'ids de TODAS as músicas do show, na nova ordem' }, descricao: str('o que é') }),
            obj({ tipo: { type: 'string', enum: ['marcador_daw'] }, musica: str('id'), compasso_daw: int('compasso da DAW onde a partitura desta música deve aparecer'), descricao: str('o que é') }),
            obj({ tipo: { type: 'string', enum: ['nota_musica'] }, musica: str('id'), texto: str('texto completo que fica nas notas da música (substitui o atual)'), descricao: str('o que é') }),
            obj({ tipo: { type: 'string', enum: ['renomear_musica'] }, musica: str('id'), titulo: str('novo título'), rotulo: str('novo rótulo curto, ou vazio'), descricao: str('o que é') }),
          ],
        },
      },
    }),
  },
];

const SYSTEM = `Você é o Caio, assistente de partituras dentro do salvetheapp, um app onde bandas leem partituras no ensaio e no show, ouvem o player e seguem a DAW.
Fale em português do Brasil, simples e curto, como um músico experiente falando com a banda.

O que você consegue fazer:
- responder sobre o show aberto: ordem das músicas, partes de cada uma, quantos compassos, anotações, onde cada música começa na DAW;
- propor mudanças que o app sabe aplicar: escrever ou apagar anotações nas partituras (camada "Em comum"), mudar a ordem do show, ajustar em que compasso da DAW a partitura troca de música, editar as notas de texto de uma música, renomear uma música.

O que você ainda não consegue: mudar as notas musicais, a diagramação ou o áudio de uma partitura. Isso vai chegar com o robô de diagramação. Se pedirem, diga isso com clareza e, se ajudar, proponha uma anotação no lugar (ex.: escrever "tocar 8ª abaixo" no compasso).

Como trabalhar:
- Sempre consulte as ferramentas antes de afirmar algo sobre o show; nunca invente compasso, parte ou música.
- Para qualquer mudança, chame propor_mudancas uma única vez no fim, com todas as mudanças do pedido. Depois explique em uma ou duas frases o que propôs; o usuário aprova no app.
- Se o pedido for ambíguo (qual parte? qual compasso?), pergunte antes de propor.
- Anotações devem ser curtas, como se escreve a lápis na partitura.
- Ids de música e chaves de parte são os que as ferramentas devolvem.`;

async function runTool(name, input, ctx) {
  const band = db.collection('bands').doc(ctx.band);
  const songsInShow = async () => {
    const show = await data(band.collection('shows').doc(ctx.show));
    const order = show?.order || [];
    const docs = await Promise.all(order.map(id => data(band.collection('songs').doc(id))));
    return { show, songs: order.map((id, i) => docs[i] && { id, ...docs[i] }).filter(Boolean) };
  };
  const inShow = async id => (await data(band.collection('shows').doc(ctx.show)))?.order?.includes(id);

  if (name === 'ver_show') {
    const { show, songs } = await songsInShow();
    const cfg = await data(band.collection('shows').doc(ctx.show).collection('logic').doc('config'));
    return {
      show: show?.name, papel_de_quem_pergunta: ctx.role,
      musicas: songs.map(s => ({ id: s.id, titulo: s.title, rotulo: s.tag || '', partes: (s.parts || []).map(p => ({ chave: p.key, nome: p.name })) })),
      daw: cfg ? { compassos_por_barra: cfg.beatsPerBar, troca_de_partitura: cfg.switchBars || {}, inicio_das_musicas: (cfg.markers || []).map(m => ({ compasso_daw: m[0], musica: m[1] || null, rotulo: m[2] || '' })) } : null,
    };
  }
  if (name === 'ver_musica') {
    if (!(await inShow(input.musica))) return { erro: 'Essa música não está no show aberto.' };
    const s = await data(band.collection('songs').doc(input.musica));
    const lay = await data(band.collection('layout').doc(input.musica));
    const partes = (s?.parts || []).map(p => {
      const boxes = lay?.parts?.[p.key]?.boxes || [];
      return { chave: p.key, nome: p.name, compassos: boxes.length ? Math.max(...boxes.map(b => b[0])) : null, paginas: boxes.length ? Math.max(...boxes.map(b => b[2])) : null };
    });
    const pl = s?.player || {};
    return { id: input.musica, titulo: s?.title, rotulo: s?.tag || '', notas: s?.notes || '', partes, andamentos: pl.tempos || pl.tempo || null, ensaio: pl.marks || pl.rehearsal || null };
  }
  if (name === 'ver_anotacoes') {
    if (!(await inShow(input.musica))) return { erro: 'Essa música não está no show aberto.' };
    const snap = await band.collection('ann').where('song', '==', input.musica).get();
    const lay = await data(band.collection('layout').doc(input.musica));
    const out = [];
    snap.docs.map(d => dec(d.data())).filter(a => input.parte === 'todas' || a.part === input.parte).forEach(a => {
      const boxes = (lay?.parts?.[a.part]?.boxes || []).filter(b => b[2] === a.page);
      (a.notes || []).forEach(n => {
        const near = boxes.filter(b => n.y <= b[6] + 0.02).sort((x, y) => (x[4] - y[4]) || (x[3] - y[3]));
        const hit = near.find(b => n.x >= b[3] - 0.01 && n.x <= b[5] + 0.01 && n.y >= b[4] - 0.06) || near[0];
        out.push({ parte: a.part, pagina: a.page, id: n.id, texto: n.t, compasso_aprox: hit ? hit[0] : null });
      });
      if ((a.strokes || []).length) out.push({ parte: a.part, pagina: a.page, desenhos_a_mao: a.strokes.length });
    });
    return { musica: input.musica, anotacoes: out };
  }
  if (name === 'propor_mudancas') {
    ctx.proposta = { resumo: input.resumo, mudancas: input.mudancas };
    return { ok: true, aviso: 'Proposta entregue ao usuário. Ela só é aplicada se um dono ou editor aprovar no app.' };
  }
  return { erro: 'ferramenta desconhecida' };
}

/* ---------------- endpoint ---------------- */
async function handle(req, res) {
  const fail = (code, msg) => res.status(code).json({ erro: msg });
  if (req.method !== 'POST') return fail(405, 'use POST');
  let user;
  try { user = await admin.auth().verifyIdToken(String(req.headers.authorization || '').replace(/^Bearer /, '')); }
  catch { return fail(401, 'Entre no app de novo.'); }
  const { band, show, conversa } = req.body || {};
  if (typeof band !== 'string' || typeof show !== 'string' || !Array.isArray(conversa) || !conversa.length) return fail(400, 'pedido incompleto');
  const member = await data(db.collection('bands').doc(band).collection('members').doc(user.uid));
  if (!member) return fail(403, 'Você não é desta banda.');

  // a simple daily cap per band, so a loop or abuse can't run up the bill
  const day = new Date().toISOString().slice(0, 10);
  const usage = db.collection('sistema').doc('uso').collection(day).doc(band);
  const used = await db.runTransaction(async t => { const s = await t.get(usage); const n = (s.exists ? s.data().n : 0) + 1; t.set(usage, { n }, { merge: true }); return n; });
  if (used > DAILY_LIMIT) return fail(429, 'A banda chegou ao limite de perguntas de hoje.');

  // the conversation so far, as plain text turns (the app keeps it; tool calls stay on the server)
  const messages = conversa.slice(-20).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.texto || '').slice(0, 8000) })).filter(m => m.content);
  if (!messages.length || messages[0].role !== 'user') return fail(400, 'a conversa precisa começar com uma pergunta');
  const ctx = { band, show, role: member.role, proposta: null };
  const quem = { band, uid: user.uid };

  try {
    let texto = '';
    for (let step = 0; step < MAX_STEPS; step++) {
      const out = await bus.turn(db, { modulo: 'agente', system: SYSTEM, messages, tools: TOOLS, maxTokens: 16000, quem });
      if (out.stop_reason === 'refusal') { texto = 'Não posso ajudar com esse pedido.'; break; }
      messages.push({ role: 'assistant', content: out.content });
      texto = out.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || texto;
      if (out.stop_reason === 'pause_turn') continue;
      const calls = out.content.filter(b => b.type === 'tool_use');
      if (out.stop_reason !== 'tool_use' || !calls.length) break;
      const results = await Promise.all(calls.map(async c => {
        try { return { type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(await runTool(c.name, c.input || {}, ctx)) }; }
        catch (e) { return { type: 'tool_result', tool_use_id: c.id, content: 'Erro ao ler: ' + (e.message || e), is_error: true }; }
      }));
      messages.push({ role: 'user', content: results });
      if (step === MAX_STEPS - 1) texto = texto || 'Esse pedido ficou grande demais. Tente dividir em partes menores.';
    }
    res.json({ texto: texto || (ctx.proposta ? 'Preparei as mudanças abaixo.' : 'Pronto.'), proposta: ctx.proposta, podeAplicar: ['dono', 'editor'].includes(member.role) });
  } catch (e) {
    console.error(e);
    fail(e.status || 500, String(e.message || e));
  }
}


exports.agente = onRequest({ region: 'southamerica-east1', secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 300, memory: '512MiB', cors: ORIGINS, maxInstances: 10 }, handle);
Object.defineProperty(exports, '__handle', { value: handle, enumerable: false });  // for local tests only
