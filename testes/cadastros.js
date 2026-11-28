// Teste do aviso de cadastro (rápido, sem internet): conta nova e entrada em banda viram uma linha com nome, e-mail,
// banda, papel e como entrou (link de convite de quem, ou código de acesso); vai para cadastros/{uid}, que só o dono do
// app (admins) pode ler nas regras (o painel de admin mostra).
//   node testes/cadastros.js
const fs = require('fs');
const path = require('path');
const cad = require('../server/functions/cadastros');
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };

// a tiny fake of the Firestore admin API: docs by path
function fakeDb(dados) {
  const escritos = {};
  const docRef = p => ({
    get: async () => ({ exists: p in dados, data: () => dados[p] }),
    set: async (v, o) => { escritos[p] = { ...(o && o.merge ? escritos[p] || {} : {}), ...v }; },
    collection: c => colRef(p + '/' + c),
  });
  const colRef = p => ({ doc: id => docRef(p + '/' + id) });
  return { db: { collection: c => colRef(c) }, escritos };
}
const admin = { firestore: { FieldValue: { arrayUnion: (...v) => ({ uniao: v }) } } };
(async () => {
  // a new account with e-mail
  const linha = cad.conta({ uid: 'u1', displayName: 'Ana Souza', email: 'ana@x.com', metadata: { creationTime: 'Sat, 28 Nov 2026 15:00:00 GMT' },
    providerData: [{ providerId: 'password', email: 'ana@x.com' }] });
  confere('conta nova: nome, e-mail, como entrou e quando', linha.tipo === 'conta' && linha.nome === 'Ana Souza' && linha.email === 'ana@x.com' &&
    linha.entrada === 'e-mail e senha' && linha.em === Date.parse('2026-11-28T15:00:00Z'), JSON.stringify(linha));
  confere('conta pelo Google', cad.conta({ uid: 'u2', providerData: [{ providerId: 'google.com', displayName: 'Beto', email: 'b@gmail.com' }], metadata: {} }).entrada === 'Google');
  confere('conta pelo Google sem nome no registro usa o do Google', cad.conta({ uid: 'u2', providerData: [{ providerId: 'google.com', displayName: 'Beto', email: 'b@gmail.com' }], metadata: {} }).nome === 'Beto');

  // joining a band by invite link: who made the link
  const { db } = fakeDb({ 'bands/B': { name: 'Os Metais', owner: 'd1' }, 'bands/B/invites/K1': { role: 'musico', by: 'd1' }, 'bands/B/members/d1': { role: 'dono', name: 'Malak' },
    'bands/C': { name: 'Banda Nova', owner: 'u3', codigo: 'TESTE1' }, 'codigos/TESTE1': { nota: 'para o Zé testar' } });
  let b = await cad.entrada(db, 'B', 'u1', { role: 'musico', invite: 'K1', name: 'Ana Souza', email: 'ana@x.com', joinedAt: 5 });
  confere('entrou com link: banda, papel e de quem era o link', b.banda === 'Os Metais' && b.papel === 'musico' && b.como === 'link de convite de Malak', JSON.stringify(b));
  b = await cad.entrada(db, 'C', 'u3', { role: 'dono', name: 'Zé', email: 'ze@x.com', joinedAt: 6 });
  confere('criou banda com código: mostra o código e a nota dele', b.como === 'criou a banda com o código TESTE1 (para o Zé testar)', b.como);

  // saving: the account, then the band
  const f = fakeDb({});
  await cad.guarda(f.db, admin, linha);
  confere('guarda em cadastros/u1', f.escritos['cadastros/u1'] && f.escritos['cadastros/u1'].email === 'ana@x.com' && f.escritos['cadastros/u1'].em === linha.em);
  await cad.guarda(f.db, admin, b);
  confere('entrada na banda soma na lista de bandas da pessoa', f.escritos['cadastros/u3'] && f.escritos['cadastros/u3'].bandas.uniao[0].banda === 'Banda Nova');

  // the rules: only admins read, nobody writes from the app
  const regras = fs.readFileSync(path.join(__dirname, '../firebase/firestore.rules'), 'utf8');
  confere('regras: só o dono do app (admins) lê cadastros e ninguém escreve', /match \/cadastros\/\{uid\} \{ allow read: if isAdmin\(\); allow write: if false; \}/.test(regras));
  const idx = fs.readFileSync(path.join(__dirname, '../server/functions/index.js'), 'utf8');
  confere('funções cadastro e entrouNaBanda existem', /exports\.cadastro = /.test(idx) && /exports\.entrouNaBanda = /.test(idx));

  console.log(`\n${ok} ok, ${falhas.length} falharam`);
  process.exit(falhas.length ? 1 : 0);
})();
