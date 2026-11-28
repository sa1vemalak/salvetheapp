// Teste do painel de admin no servidor (rápido, sem internet; precisa de `cd server/functions && npm ci`):
// só quem está em admins/{uid} recebe o relatório (sem login 401, outra conta 403); o relatório junta cadastros novos
// (os que chegaram depois do "visto"), frequência de uso, custo do mês por banda e sugestões; as ações mexem só no
// "visto" do admin e em sistema/gasto.
//   node testes/painel.js
const path = require('path');
const FN = path.join(__dirname, '..', 'server', 'functions');
const admin = require(require.resolve('firebase-admin', { paths: [FN] }));
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };

const DIA = 864e5, agora = Date.now();
const diaBR = t => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);
const mes = diaBR(agora).slice(0, 7);
// a tiny fake of the Firestore admin API: docs by path, collection gets and collection groups
function fakeDb(dados) {
  const snap = p => ({ id: p.split('/').pop(), exists: p in dados, data: () => dados[p], ref: refDe(p) });
  const refDe = p => { const partes = p.split('/'); const r = { id: partes[partes.length - 1], path: p };
    r.parent = { id: partes[partes.length - 2], parent: partes.length > 2 ? refDe(partes.slice(0, -2).join('/')) : null }; return r; };
  const filhos = (p, fundo) => Object.keys(dados).filter(k => k.startsWith(p + '/') && k.slice(p.length + 1).split('/').length === 1).map(snap);
  const docRef = p => ({ get: async () => snap(p), set: async (v, o) => { dados[p] = { ...(o && o.merge ? dados[p] || {} : {}), ...v }; }, delete: async () => { delete dados[p]; }, collection: c => colRef(p + '/' + c) });
  const colRef = p => ({ doc: id => docRef(p + '/' + id), get: async () => ({ docs: filhos(p) }) });
  return { collection: c => colRef(c), collectionGroup: c => ({ get: async () => ({ docs: Object.keys(dados).filter(k => { const s = k.split('/'); return s.length >= 2 && s[s.length - 2] === c; }).map(snap) }) }) };
}
const contas = [
  { uid: 'dono', displayName: 'Malak', email: 'dono@x.com', metadata: { creationTime: new Date(agora - 300 * DIA).toUTCString() }, providerData: [{ providerId: 'google.com' }] },
  { uid: 'ana', displayName: 'Ana', email: 'ana@x.com', metadata: { creationTime: new Date(agora - 2 * DIA).toUTCString() }, providerData: [{ providerId: 'password' }] },
  { uid: 'beto', displayName: 'Beto', email: 'beto@x.com', metadata: { creationTime: new Date(agora - 40 * DIA).toUTCString(), lastSignInTime: new Date(agora - 20 * DIA).toUTCString() }, providerData: [{ providerId: 'google.com' }] },
];
const tokens = { 'tk-dono': 'dono', 'tk-ana': 'ana' };
Object.defineProperty(admin, 'auth', { configurable: true, value: () => ({
  verifyIdToken: async t => { if (!tokens[t]) throw new Error('token'); return { uid: tokens[t] }; },
  listUsers: async () => ({ users: contas }),
  getUser: async uid => { const c = contas.find(x => x.uid === uid); if (!c) throw new Error('user-not-found'); return c; },
}) });
Object.defineProperty(admin, 'firestore', { configurable: true, value: Object.assign(() => null, { FieldValue: { arrayUnion: (...v) => ({ uniao: v }), arrayRemove: (...v) => ({ tira: v }) } }) });
const painel = require(path.join(FN, 'painel.js'));

const dados = {
  'admins/dono': { painelVistoEm: agora - 5 * DIA },
  'cadastros/ana': { nome: 'Ana Souza', email: 'ana@x.com', entrada: 'e-mail e senha', em: agora - 2 * DIA, bandas: [{ banda: 'Banda da Ana', bandaId: 'ana-1', papel: 'dono', como: 'criou a banda com o código ABC', em: agora - 2 * DIA }] },
  'users/dono': { bands: { 'poesia-1': { name: 'Poesia Acústica', role: 'dono' } }, acessos: { [diaBR(agora)]: 3, [diaBR(agora - DIA)]: 2, [diaBR(agora - 40 * DIA)]: 1 } },
  'users/ana': { bands: { 'ana-1': { name: 'Banda da Ana', role: 'dono' } }, acessos: { [diaBR(agora - DIA)]: 1 } },
  'bands/poesia-1': { name: 'Poesia Acústica', owner: 'dono', createdAt: agora - 300 * DIA },
  'bands/ana-1': { name: 'Banda da Ana', owner: 'ana', createdAt: agora - 2 * DIA, codigo: 'ABC' },
  'bands/poesia-1/members/dono': { role: 'dono' }, 'bands/poesia-1/members/beto': { role: 'musico' },
  'bands/ana-1/members/ana': { role: 'dono' },
  [`bands/poesia-1/uso/${mes}`]: { reais: 12.5, caio: 10, malak: 2.5 },
  [`bands/ana-1/uso/${mes}`]: { reais: 19.4, caio: 19.4 },
  'bands/ana-1/uso/2020-01': { reais: 99 },
  [`sistema/uso/${new Date().toISOString().slice(0, 10)}/poesia-1`]: { n: 7 }, [`sistema/uso/${new Date().toISOString().slice(0, 10)}/pessoa-dono`]: { n: 7 },
  'sugestoes/s1': { texto: 'O som não saiu', tipo: 'problema', status: 'nova', criadoEm: agora - DIA, juri: { estado: 'pronto', vale: true, bug: true, nota: 4 }, correcao: { estado: 'pr', pr: 'https://github.com/sa1vemalak/salvetheapp/pull/99' } },
  'sugestoes/s2': { texto: 'Modo escuro maior', status: 'nova', criadoEm: agora - 2 * DIA, juri: { estado: 'pronto', vale: true, nota: 4 } },
  'sugestoes/s3': { texto: 'oi', status: 'descartada', criadoEm: agora - 3 * DIA },
  'config/app': { cadastroAberto: false },
};
const db = fakeDb(dados);
const chama = async (metodo, token, body) => { let st = 200, js = null;
  const res = { status(c) { st = c; return this; }, json(j) { js = j; return this; }, end() { return this; } };
  await painel.handler(db)({ method: metodo, headers: token ? { authorization: 'Bearer ' + token } : {}, body }, res); return { st, js }; };

(async () => {
  console.log('Quem pode ver');
  confere('sem login: 401', (await chama('GET')).st === 401);
  const outra = await chama('GET', 'tk-ana');
  confere('outra conta (não admin): 403 e nada dos dados', outra.st === 403 && !outra.js.pessoas && !outra.js.resumo, JSON.stringify(outra.js));
  confere('outra conta não consegue mexer no limite', (await chama('POST', 'tk-ana', { acao: 'limite', reais: 999 })).st === 403 && !dados['sistema/gasto']);

  console.log('O relatório do dono');
  const { st, js: r } = await chama('GET', 'tk-dono');
  confere('dono: 200', st === 200, JSON.stringify(r));
  const ana = r.pessoas.find(p => p.uid === 'ana'), beto = r.pessoas.find(p => p.uid === 'beto'), dono = r.pessoas.find(p => p.uid === 'dono');
  confere('cadastro novo: Ana (depois do visto), com a banda e como entrou', ana.novo && ana.nome === 'Ana Souza' && ana.entrada === 'e-mail e senha' && /código ABC/.test(ana.entrouEm[0].como));
  confere('contas antigas (sem cadastros/) aparecem pelo Firebase Auth e não contam como novas', beto && !beto.novo && beto.entrada === 'Google' && beto.criadoEm > 0);
  confere('o próprio dono não aparece como novo', !dono.novo);
  confere('resumo: 1 cadastro novo não visto', r.resumo.novasNaoVistas === 1, JSON.stringify(r.resumo));
  confere('frequência: dono usou hoje, 2 dias na semana e 2 no mês (o de 40 dias não conta)', dono.hoje && dono.dias7 === 2 && dono.dias30 === 2 && dono.aberturas30 === 5, JSON.stringify(dono));
  confere('usaram na semana: dono e Ana', r.resumo.ativos7 === 2 && r.resumo.ativosHoje === 1);
  const bp = r.bandas.find(b => b.id === 'poesia-1'), ba = r.bandas.find(b => b.id === 'ana-1');
  confere('custo do mês por banda, com Caio e Malak separados', bp.mes.reais === 12.5 && bp.mes.caio === 10 && bp.mes.malak === 2.5 && ba.mes.reais === 19.4);
  confere('mês antigo (fora dos 6) não entra', !ba.meses.some(m => m.mes === '2020-01') && ba.meses.length === 6);
  confere('banda do dono sem limite; a da Ana com limite', bp.semLimite && bp.semLimitePorAdmin && !ba.semLimite);
  confere('membros da banda e o dono pelo nome', bp.membros === 2 && bp.musicos === 1 && ba.donoNome === 'Ana Souza');
  confere('gasto total do mês', Math.abs(r.resumo.gastoMes - 31.9) < 0.01, r.resumo.gastoMes);
  confere('perguntas ao Caio: conta a banda, não repete a da pessoa', r.resumo.caio14 === 7, r.resumo.caio14);
  confere('sugestões em grupos (problema confirmado, para aprovar, feitas/descartadas)', r.grupos.bug === 1 && r.grupos.aprovar === 1 && r.grupos.fim === 1, JSON.stringify(r.grupos));
  confere('PR da correção esperando o dono', r.resumo.prsParaJuntar === 1);
  confere('limite e cadastro fechado vêm junto', r.config.limiteReais === 20 && r.config.cadastroAberto === false);

  console.log('Ações');
  confere('marcar cadastros como vistos grava no admin', (await chama('POST', 'tk-dono', { acao: 'visto' })).st === 200 && dados['admins/dono'].painelVistoEm > agora - 1000);
  confere('depois do visto, nenhum cadastro novo', (await chama('GET', 'tk-dono')).js.resumo.novasNaoVistas === 0);
  confere('limite fora do intervalo é recusado', (await chama('POST', 'tk-dono', { acao: 'limite', reais: 0 })).st === 400);
  confere('mudar o limite', (await chama('POST', 'tk-dono', { acao: 'limite', reais: 30 })).st === 200 && dados['sistema/gasto'].limiteReais === 30);
  confere('liberar uma banda do limite', (await chama('POST', 'tk-dono', { acao: 'semLimite', banda: 'ana-1', valor: true })).st === 200 && dados['sistema/gasto'].semLimite.uniao[0] === 'ana-1');
  confere('banda que não existe é recusada', (await chama('POST', 'tk-dono', { acao: 'semLimite', banda: 'nao-existe', valor: true })).st === 400);

  console.log('Equipe do Salve (quem abre a página da equipe)');
  confere('outra conta não consegue se pôr na equipe', (await chama('POST', 'tk-ana', { acao: 'equipe', uid: 'ana', valor: true })).st === 403 && !dados['equipe/ana']);
  confere('ninguém começa na equipe, só o dono', (await chama('GET', 'tk-dono')).js.pessoas.filter(p => p.equipe).map(p => p.uid).join() === 'dono');
  confere('o dono marca o Beto: equipe/beto criado com nome e e-mail', (await chama('POST', 'tk-dono', { acao: 'equipe', uid: 'beto', valor: true })).st === 200 &&
    dados['equipe/beto'] && dados['equipe/beto'].nome === 'Beto' && dados['equipe/beto'].email === 'beto@x.com' && dados['equipe/beto'].por === 'dono', JSON.stringify(dados['equipe/beto']));
  confere('o relatório mostra o Beto na equipe', (await chama('GET', 'tk-dono')).js.pessoas.find(p => p.uid === 'beto').equipe);
  const desde = dados['equipe/beto'].desde;
  await chama('POST', 'tk-dono', { acao: 'equipe', uid: 'beto', valor: true });
  confere('marcar de novo não muda a data de entrada', dados['equipe/beto'].desde === desde);
  confere('o dono desmarca o Beto: equipe/beto apagado', (await chama('POST', 'tk-dono', { acao: 'equipe', uid: 'beto', valor: false })).st === 200 && !('equipe/beto' in dados));
  confere('conta que não existe é recusada', (await chama('POST', 'tk-dono', { acao: 'equipe', uid: 'ninguem', valor: true })).st === 400 && !dados['equipe/ninguem']);
  confere('caminho estranho é recusado', (await chama('POST', 'tk-dono', { acao: 'equipe', uid: '../admins/x', valor: true })).st === 400);
  confere('o dono não se tira da equipe', (await chama('POST', 'tk-dono', { acao: 'equipe', uid: 'dono', valor: false })).st === 400);
  confere('ação desconhecida é recusada', (await chama('POST', 'tk-dono', { acao: 'apagarTudo' })).st === 400);

  console.log(falhas.length ? `\n${falhas.length} falharam, ${ok} ok` : `\nTudo certo (${ok})`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
