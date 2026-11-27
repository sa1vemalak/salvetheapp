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
const ref = p => ({
  collection: c => col(p + '/' + c),
  get: async () => ({ exists: p in docs, data: () => docs[p] }),
});
const col = p => {
  const q = { orderBy: () => q, startAt: () => q, endAt: () => q, limitToLast: () => q, where: () => q,
    get: async () => ({ docs: p.endsWith('/jobs') ? jobs.map(j => ({ id: j.id, data: () => j })) : [] }), doc: id => ref(p + '/' + id) };
  return q;
};
const fakeAdmin = { initializeApp() {}, firestore: Object.assign(() => ({ collection: c => col(c) }), { FieldPath: { documentId: () => '__id' } }), auth: () => ({}) };
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
  console.log(`\n${ok} ok, ${falhas.length} falharam`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
