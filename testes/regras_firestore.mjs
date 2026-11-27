// Testes das regras do Firestore (convites e membros) no emulador, sem tocar no projeto de verdade.
// Rodar a partir desta pasta (precisa de Java e Node):
//   npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
//   npx firebase-tools emulators:exec --only firestore --project demo-salve "node regras_firestore.mjs"
// O testes/firebase.json só serve ao emulador (porta 8089); o deploy continua sendo feito de server/.
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-salve', firestore: { rules: fs.readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8089 } });
await env.withSecurityRulesDisabled(async c => { const d = c.firestore();
  await setDoc(doc(d, 'bands/B'), { name: 'Banda', owner: 'dono1', createdAt: 1 });
  await setDoc(doc(d, 'bands/B/members/dono1'), { role: 'dono' });
  await setDoc(doc(d, 'bands/B/members/ed'), { role: 'editor' });
  await setDoc(doc(d, 'bands/B/invites/BAD'), { role: 'dono', createdAt: Date.now(), by: 'ed' });
  await setDoc(doc(d, 'bands/B/invites/VELHO'), { role: 'musico', createdAt: Date.now() - 8 * 864e5, by: 'ed' });
  await setDoc(doc(d, 'bands/B/invites/QUASE'), { role: 'musico', createdAt: Date.now() - 6 * 864e5, by: 'ed' }); });
const db = u => env.authenticatedContext(u).firestore();
let ok = 0, fail = 0; const t = async (n, p) => { try { await p; ok++; console.log('ok  ', n); } catch (e) { fail++; console.log('FAIL', n, e.message.split('\n')[0]); } };
const now = Date.now();
await t('editor cria link de músico', assertSucceeds(setDoc(doc(db('ed'), 'bands/B/invites/M1'), { role: 'musico', bandName: 'Banda', createdAt: now, by: 'ed' })));
await t('editor cria link de editor', assertSucceeds(setDoc(doc(db('ed'), 'bands/B/invites/E1'), { role: 'editor', bandName: 'Banda', createdAt: now, by: 'ed' })));
await t('editor NÃO cria link de dono', assertFails(setDoc(doc(db('ed'), 'bands/B/invites/X'), { role: 'dono', createdAt: now, by: 'ed' })));
await t('músico NÃO cria link', assertFails(setDoc(doc(db('zz'), 'bands/B/invites/Y'), { role: 'musico', createdAt: now, by: 'zz' })));
await t('pessoa nova entra com link de músico', assertSucceeds(setDoc(doc(db('novo'), 'bands/B/members/novo'), { role: 'musico', invite: 'M1', name: 'Novo', email: 'n@x.com', joinedAt: now })));
await t('NÃO entra como dono por link antigo de dono', assertFails(setDoc(doc(db('ed2'), 'bands/B/members/ed2'), { role: 'dono', invite: 'BAD', joinedAt: now })));
await t('NÃO entra com papel diferente do link', assertFails(setDoc(doc(db('ed3'), 'bands/B/members/ed3'), { role: 'editor', invite: 'M1', joinedAt: now })));
await t('NÃO entra com campo extra', assertFails(setDoc(doc(db('ed4'), 'bands/B/members/ed4'), { role: 'musico', invite: 'M1', lixo: 'x' })));
await t('NÃO entra com link de 8 dias', assertFails(setDoc(doc(db('v1'), 'bands/B/members/v1'), { role: 'musico', invite: 'VELHO', joinedAt: now })));
await t('entra com link de 6 dias', assertSucceeds(setDoc(doc(db('v2'), 'bands/B/members/v2'), { role: 'musico', invite: 'QUASE', joinedAt: now })));
await t('editor NÃO cria link com data no futuro (que nunca venceria)', assertFails(setDoc(doc(db('ed'), 'bands/B/invites/F1'), { role: 'musico', createdAt: now + 365 * 864e5, by: 'ed' })));
await t('editor NÃO cria link com data antiga', assertFails(setDoc(doc(db('ed'), 'bands/B/invites/F2'), { role: 'musico', createdAt: now - 864e5, by: 'ed' })));
await t('editor NÃO cria link em nome de outro', assertFails(setDoc(doc(db('ed'), 'bands/B/invites/F3'), { role: 'musico', createdAt: now, by: 'dono1' })));
await t('dono troca papel', assertSucceeds(updateDoc(doc(db('dono1'), 'bands/B/members/novo'), { role: 'editor' })));
await t('dono NÃO muda o nome de outro', assertFails(updateDoc(doc(db('dono1'), 'bands/B/members/novo'), { role: 'musico', name: 'Outro' })));
await t('editor sai da banda', assertSucceeds(deleteDoc(doc(db('ed'), 'bands/B/members/ed'))));
await t('criador da banda entra como dono', assertSucceeds((async () => { const d = db('c1');
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'config/app'), { cadastroAberto: true }));
  await setDoc(doc(d, 'bands/B2'), { name: 'Nova', owner: 'c1', createdAt: now });
  await setDoc(doc(d, 'bands/B2/members/c1'), { role: 'dono', name: 'C', email: 'c@x.com', joinedAt: now }); })()));
await t('membro lê convite', assertSucceeds(getDoc(doc(db('novo'), 'bands/B/invites/M1'))));
console.log(`\n${ok} passaram, ${fail} falharam`); await env.cleanup(); process.exit(fail ? 1 : 0);
