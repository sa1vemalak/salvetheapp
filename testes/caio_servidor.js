// Teste RÁPIDO do servidor do Caio (sem internet nem Firebase): as ferramentas leem a partitura com o mesmo código
// do app (app/partitura.js) e a proposta é testada na partitura antes de chegar ao usuário.
//   (cd server/functions && npm ci) ; node testes/caio_servidor.js
const path = require('path'), fs = require('fs');
const FN = path.join(__dirname, '..', 'server', 'functions');
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };

confere('server/functions/partitura.js é cópia de app/partitura.js',
  fs.readFileSync(path.join(FN, 'partitura.js'), 'utf8') === fs.readFileSync(path.join(__dirname, '..', 'app', 'partitura.js'), 'utf8'));

// banco de mentira: uma banda, um show, uma música com partitura editável
const Partitura = require(path.join(FN, 'partitura.js'));
const { DOMParser } = require(path.join(FN, 'node_modules', 'linkedom'));
const env = { DOMParser, XMLSerializer: class { serializeToString(d) { return d.toString(); } } };
const P = new Partitura(Partitura.blank({ instrumentos: ['trompete', 'sax-tenor', 'base'], compassos: 6 }), env);
P.setTokens(0, 1, 'mf C5:1/3( D5:1/3 E5:1/3) F5:1 G5:2');
P.setTokens(1, 1, 'E4:4');
// compasso 3 do sax com tempo a mais (como Era uma Vez): 5 tempos num 4/4
const m3 = P.measure(1, 3); m3.getElementsByTagName('duration')[0].textContent = String(24 * 5);
const XML = P.toString();
const docs = {
  'bands/b/shows/s': { order: ['m1'] },
  'bands/b/songs/m1': { title: 'Música 1', partitura: { xml: 'mem://m1', versao: 3, partesSemPdf: [], partes: [{ key: 'trompete', name: 'Trompete' }, { key: 'sax-tenor', name: 'Sax Tenor' }, { key: 'base', name: 'Base' }] }, player: { made: '2026-11-27' } },
};
const jobs = [{ id: 'm1__1', tipo: 'audio', fonte: 'partitura', status: 'pronto', msg: 'Pronto: ouça e confira.', avisos: ['Sax Tenor: compasso 3 com tempo a mais'], criadoEm: 1764270000000, atualizado: 1764270100000 }];
const gravados = [];   // what the server wrote with set() (the monthly robot spend)
const ref = p => ({
  collection: c => col(p + '/' + c),
  get: async () => ({ exists: p in docs, data: () => docs[p] }),
  set: async v => { gravados.push([p, v]); },
});
const col = p => {
  const q = { orderBy: () => q, startAt: () => q, endAt: () => q, limitToLast: () => q, where: () => q,
    get: async () => ({ docs: p.endsWith('/jobs') ? jobs.map(j => ({ id: j.id, data: () => j }))
      : /\/ann(-[^/]+)?$/.test(p) ? Object.keys(docs).filter(k => k.startsWith(p + '/')).map(k => ({ id: k.split('/').pop(), data: () => docs[k] })) : [] }), doc: id => ref(p + '/' + id) };
  return q;
};
docs['bands/b/members/u1'] = { role: 'dono' };
const fakeAdmin = { initializeApp() {}, firestore: Object.assign(() => ({ collection: c => col(c), runTransaction: async f => f({ get: async () => ({ exists: false }), set() {} }) }), { FieldPath: { documentId: () => '__id' }, FieldValue: { increment: n => ({ inc: n }) } }),
  auth: () => ({ verifyIdToken: async t => { if (t !== 'ok') throw new Error('token'); return { uid: 'u1' }; } }) };
// the AI: answers with plain text and keeps what it was sent, so the test sees the pictures arrive
const vistos = [];
const busPath = require.resolve(path.join(FN, 'llm', 'bus.js'));
require.cache[busPath] = { id: busPath, filename: busPath, loaded: true, exports: { turn: async (db, o) => { vistos.push(JSON.parse(JSON.stringify(o.messages))); return { content: [{ type: 'text', text: 'Li.' }], stop_reason: 'end_turn', modelo: 'claude-opus-5-5', usage: { input_tokens: 1000, output_tokens: 500 } }; } } };
const adminPath = require.resolve(path.join(FN, 'node_modules', 'firebase-admin'));
require.cache[adminPath] = { id: adminPath, filename: adminPath, loaded: true, exports: fakeAdmin };
global.fetch = async () => ({ text: async () => XML });
const srv = require(path.join(FN, 'index.js'));

(async () => {
  const ctx = { band: 'b', show: 's', role: 'dono', proposta: null, cache: {} };
  const run = (n, i) => srv.__runTool(n, i, ctx);
  console.log('Caio lê a partitura inteira');
  const vn = await run('ver_notas', { musica: 'm1', parte: 'trompete', de: 1, ate: 2 });
  confere('ver_notas mostra tercina, dinâmica e ligadura', vn.compassos[0].notas === 'mf C5:1/3( D5:1/3 E5:1/3) F5:1 G5:2', JSON.stringify(vn.compassos[0]));
  const base = await run('ver_notas', { musica: 'm1', parte: 'base', de: 1, ate: 1 });
  confere('Base aparece como só cifra', /só cifra/.test(base.compassos[0].notas), JSON.stringify(base));
  console.log('Caio e o Malak');
  const cp = await run('conferir_partitura', { musica: 'm1' });
  confere('conferir_partitura acha o compasso com tempo a mais', cp.compassos_com_tempo_errado.some(x => x.parte === 'sax-tenor' && x.compasso === 3 && x.soma === '5'), JSON.stringify(cp));
  const vm = await run('ver_malak', { musica: 'm1' });
  confere('ver_malak traz o trabalho e os avisos do Malak', vm.trabalhos[0]?.status === 'pronto' && vm.trabalhos[0].avisos.length === 1 && vm.partitura_versao === 3, JSON.stringify(vm));
  console.log('Proposta testada antes de chegar ao usuário');
  const boa = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'sax-tenor', compasso: 3, notas: 'p D4:1 E4:1 cresc F4:2 fim', descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 2, notas: 'C5:2/3 D5:1/3 E5:1( F5:2)@', descricao: 'x' }] });
  confere('proposta certa passa', boa.ok === true, JSON.stringify(boa));
  ctx.proposta = null;
  const ruim = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 2, notas: 'C5:1/3 D5:1/3 E5:3', descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 4, notas: 'C5:4 forte', descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'tuba', compasso: 1, notas: 'C3:4', descricao: 'x' }] });
  confere('soma errada, palavra desconhecida e parte que não existe voltam para o Caio', ruim.erro && /c\.2/.test(ruim.erro) && /forte/.test(ruim.erro) && /tuba/.test(ruim.erro) && !ctx.proposta, JSON.stringify(ruim));
  const nova = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'nova_parte', musica: 'm1', instrumento: 'sax-alto', copiar_de: 'sax-tenor', oitava: 0, descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'sax-alto', compasso: 2, notas: 'mf A4:4', descricao: 'x' }] });
  confere('parte nova e as notas dela na mesma proposta', nova.ok === true, JSON.stringify(nova));
  console.log('Estrutura');
  const est = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'estrutura', musica: 'm1', acao: 'por_compassos', compasso: 2, ate: 2, quantos: 2, valor: '', parte: 'todas', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'formula', compasso: 3, ate: 3, quantos: 0, valor: '3/4', parte: 'todas', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'ensaio', compasso: 3, ate: 3, quantos: 0, valor: 'B', parte: 'todas', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'barra', compasso: 3, ate: 4, quantos: 0, valor: 'casa1', parte: 'todas', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'transpor', compasso: 1, ate: 1, quantos: 0, valor: '2', parte: 'trompete', descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 3, notas: 'f G5:3', descricao: 'x' }] });
  confere('pôr compassos, fórmula, ensaio, casa 1, transpor e notas no compasso novo', est.ok === true, JSON.stringify(est));
  ctx.proposta = null;
  const est2 = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'estrutura', musica: 'm1', acao: 'formula', compasso: 2, ate: 2, quantos: 0, valor: '7/5', parte: 'todas', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'tom', compasso: 1, ate: 1, quantos: 0, valor: 'H', parte: 'todas', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'tirar_compassos', compasso: 1, ate: 6, quantos: 0, valor: '', parte: 'todas', descricao: 'x' }] });
  confere('fórmula, tom e apagar tudo inválidos voltam para o Caio', est2.erro && /7\/5/.test(est2.erro) && /"H"/.test(est2.erro) && /todos os compassos/.test(est2.erro), JSON.stringify(est2));
  console.log('Segunda voz, letra e PDF');
  ctx.proposta = null;
  const vl = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'letra', musica: 'm1', parte: 'trompete', compasso: 2, silabas: 'La- iá', descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 2, notas: 'C5:2 D5:2 || A4:4', descricao: 'x' }] });
  confere('letra depois das notas novas e segunda voz', vl.ok === true, JSON.stringify(vl));
  ctx.proposta = null;
  const vl2 = await run('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'letra', musica: 'm1', parte: 'trompete', compasso: 1, silabas: 'a b c d e f', descricao: 'x' },
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 4, notas: 'C5:4 || A4:3', descricao: 'x' },
    { tipo: 'redesenhar_pdf', musica: 'm1', descricao: 'x' }] });
  confere('sílabas demais e segunda voz curta voltam; PDF de música sem PDF de arranjador também', vl2.erro && /sílabas/.test(vl2.erro) && /segunda voz/.test(vl2.erro) && !/redesenhar/.test(vl2.erro), JSON.stringify(vl2));
  const vn2 = await run('ver_notas', { musica: 'm1', parte: 'trompete', de: 1, ate: 1 });
  confere('ver_notas segue sem letra quando não há', !('letra' in vn2.compassos[0]), JSON.stringify(vn2.compassos[0]));
  console.log('Anotações à mão (imagens)');
  const pedir = body => new Promise(done => {
    const res = { code: 200, status(c) { this.code = c; return this; }, json(j) { done({ code: this.code, j }); } };
    srv.__handle({ method: 'POST', headers: { authorization: 'Bearer ok' }, body }, res);
  });
  const JPG = Buffer.from('fake-jpeg').toString('base64');
  const pedido = { band: 'b', show: 's', modo: 'editar', musica: 'm1', conversa: [{ role: 'user', texto: 'Leia o que está escrito à mão.' }] };
  const r1 = await pedir({ ...pedido, imagens: [{ tipo: 'image/jpeg', dados: JPG, legenda: 'anotações do app · Trompete, página 1 de 2' }] });
  const ult = vistos.at(-1)?.at(-1);
  confere('as imagens chegam ao Caio junto com a pergunta', r1.code === 200 && Array.isArray(ult?.content) && ult.content.some(b => b.type === 'image' && b.source.data === JPG)
    && ult.content.some(b => b.type === 'text' && /Trompete, página 1/.test(b.text)) && ult.content.at(-1).text === 'Leia o que está escrito à mão.', JSON.stringify(r1));
  const r2 = await pedir({ ...pedido, imagens: Array(7).fill({ tipo: 'image/jpeg', dados: JPG }) });
  const r3 = await pedir({ ...pedido, imagens: [{ tipo: 'image/gif', dados: JPG }] });
  const r4 = await pedir({ ...pedido, imagens: [{ tipo: 'image/jpeg', dados: 'A'.repeat(2_000_001) }] });
  confere('imagens demais, de tipo estranho ou grandes demais são recusadas', r2.code === 400 && r3.code === 400 && r4.code === 400 && /grande/.test(r4.j.erro), JSON.stringify([r2, r3, r4]));
  const r5 = await pedir(pedido);
  confere('sem imagens a conversa segue só com texto', r5.code === 200 && typeof vistos.at(-1)[0].content === 'string');
  docs['bands/b/ann/m1__trompete__1'] = { song: 'm1', part: 'trompete', page: 1, H: 1294, strokes: [{ p: [1, 2, 3, 4], c: '#000', w: 3 }], notes: [{ id: 'n1', x: 520, y: 260, t: 'respira' }, { id: 'n2', x: 0.12, y: 0.1, t: 'antigo' }] };
  docs['bands/b/layout/m1'] = { parts: { trompete: { boxes: [[1, 1, 1, 0.05, 0.08, 0.5, 0.18], [2, 2, 1, 0.5, 0.08, 0.95, 0.18], [3, 3, 1, 0.05, 0.2, 0.5, 0.3]] } } };
  const anot = await srv.__runTool('ver_anotacoes', { musica: 'm1', parte: 'todas' }, { band: 'b', show: 's', cache: {} });
  confere('ver_anotacoes acha o compasso de cada texto e manda pedir a imagem dos desenhos',
    anot.anotacoes?.find(a => a.id === 'n1')?.compasso_aprox === 3 && anot.anotacoes?.find(a => a.id === 'n2')?.compasso_aprox === 1 && /Ler anotações à mão/.test(anot.anotacoes?.find(a => a.desenhos_a_mao)?.para_ler || ''), JSON.stringify(anot));
  console.log('Minha versão (pessoal)');
  docs['users/u1/ann-b/pessoal__m1__trompete'] = { tipo: 'versao_pessoal', musica: 'm1', parte: 'trompete', mudancas: [{ tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 2, notas: 'G5:4' }] };
  const cpes = { band: 'b', show: 's', role: 'musico', proposta: null, cache: {}, pessoal: { uid: 'u1' } };
  const vp = await srv.__runTool('ver_notas', { musica: 'm1', parte: 'trompete', de: 1, ate: 2 }, cpes);
  const vo = await run('ver_notas', { musica: 'm1', parte: 'trompete', de: 2, ate: 2 });
  confere('na versão pessoal o Caio lê as mudanças da pessoa; a da banda continua igual', vp.compassos[1].notas === 'G5:4' && vo.compassos[0].notas !== 'G5:4', JSON.stringify([vp.compassos[1], vo.compassos[0]]));
  const pp = await srv.__runTool('propor_mudancas', { resumo: 'x', mudancas: [
    { tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 3, notas: 'A5:4', descricao: 'x' },
    { tipo: 'estrutura', musica: 'm1', acao: 'andamento', compasso: 1, ate: 1, quantos: 0, valor: '90', parte: 'todas', descricao: 'x' },
    { tipo: 'ordem_show', ordem: ['m1'], descricao: 'x' }] }, cpes);
  confere('na versão pessoal estrutura e ordem do show são recusadas', /estrutura" não entra/.test(pp.erro || '') && /ordem_show" não entra/.test(pp.erro || '') && !/trompete c.3/.test(pp.erro || ''), JSON.stringify(pp));
  cpes.proposta = null;
  const pp2 = await srv.__runTool('propor_mudancas', { resumo: 'x', mudancas: [{ tipo: 'corrigir_notas', musica: 'm1', parte: 'trompete', compasso: 3, notas: 'A5:4', descricao: 'x' }] }, cpes);
  confere('nota na versão pessoal passa e avisa que vale só para a pessoa', pp2.ok && /só na versão pessoal/.test(pp2.aviso), JSON.stringify(pp2));
  const rp = await pedir({ ...pedido, destino: 'pessoal' });
  confere('pedido pessoal: pode aplicar e volta marcado como pessoal; o Caio recebe o modo Minha versão', rp.code === 200 && rp.j.podeAplicar && rp.j.destino === 'pessoal', JSON.stringify(rp));
  console.log('Limite de R$ 20 por mês por banda');
  const gasto = require(path.join(FN, 'gasto.js'));
  confere('conta do custo: 1 milhão de tokens de entrada e de saída no Opus 5.5 = US$ 24', Math.abs(gasto.reaisDoUso('claude-opus-5-5', { input_tokens: 1e6, output_tokens: 1e6 }, 1) - 24) < 1e-9);
  const mes = gasto.mes();
  confere('cada pergunta ao Caio soma o custo no mês da banda', gravados.some(([p, v]) => p === `bands/b/uso/${mes}` && v.caio?.inc > 0 && v.reais?.inc === v.caio.inc), JSON.stringify(gravados.slice(-2)));
  docs['bands/b3'] = { name: 'Outra banda', owner: 'u9' };
  docs['bands/b3/members/u1'] = { role: 'dono' };
  docs[`bands/b3/uso/${mes}`] = { reais: 20.4 };
  const lim = await pedir({ ...pedido, band: 'b3' });
  confere('banda que passou de R$ 20 no mês: o Caio não responde e explica', lim.code === 429 && /R\$ 20,00/.test(lim.j.erro) && /dia 1º/.test(lim.j.erro), JSON.stringify(lim));
  docs[`bands/b3/uso/${mes}`] = { reais: 19.9 };
  const abaixo = await pedir({ ...pedido, band: 'b3' });
  confere('abaixo de R$ 20 o Caio responde', abaixo.code === 200, JSON.stringify(abaixo));
  docs[`bands/b3/uso/${mes}`] = { reais: 80 };
  docs['admins/u9'] = { em: 1 };
  const dono = await pedir({ ...pedido, band: 'b3' });
  confere('banda do dono do app (administrador) não tem limite', dono.code === 200 && gravados.some(([p, v]) => p === `bands/b3/uso/${mes}` && v.semLimite === true), JSON.stringify(dono));
  confere('o mês é contado no horário de Brasília', gasto.mes(new Date('2026-12-01T02:00:00Z')) === '2026-11' && gasto.mes(new Date('2026-12-01T03:30:00Z')) === '2026-12');
  console.log(`\n${ok} ok, ${falhas.length} falharam`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
