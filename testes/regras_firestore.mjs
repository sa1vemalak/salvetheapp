// Testes das regras do Firestore (convites e membros) no emulador, sem tocar no projeto de verdade.
// Rodar a partir desta pasta (precisa de Java e Node):
//   npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
//   npx firebase-tools emulators:exec --only firestore --project demo-salve "node regras_firestore.mjs"
// O testes/firebase.json só serve ao emulador (porta 8089); o deploy continua sendo feito de server/.
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection } from 'firebase/firestore';
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
// propostas: o músico manda a versão dele; só o dono aprova ou recusa
await env.withSecurityRulesDisabled(async c => { const d = c.firestore();
  await setDoc(doc(d, 'bands/B/members/mu1'), { role: 'musico' }); await setDoc(doc(d, 'bands/B/members/mu2'), { role: 'musico' });
  await setDoc(doc(d, 'bands/B/members/ed9'), { role: 'editor' }); });
const prop = (autor, extra = {}) => ({ autor, nome: 'Mu', musica: 'm1', parte: 'trompete', mudancas: [{ tipo: 'corrigir_notas', compasso: 1, notas: 'G5:4' }], resumo: '1 mudança', status: 'aberta', criadoEm: now, ...extra });
await t('músico envia a versão dele para a banda', assertSucceeds(setDoc(doc(db('mu1'), 'bands/B/propostas/P1'), prop('mu1'))));
await t('músico NÃO envia em nome de outro', assertFails(setDoc(doc(db('mu1'), 'bands/B/propostas/P2'), prop('mu2'))));
await t('músico NÃO envia já aprovada', assertFails(setDoc(doc(db('mu1'), 'bands/B/propostas/P3'), prop('mu1', { status: 'aprovada' }))));
await t('músico NÃO envia com campo extra', assertFails(setDoc(doc(db('mu1'), 'bands/B/propostas/P4'), prop('mu1', { lixo: 1 }))));
await t('quem não é da banda NÃO envia', assertFails(setDoc(doc(db('fora'), 'bands/B/propostas/P5'), prop('fora'))));
await t('músico NÃO aprova a própria', assertFails(updateDoc(doc(db('mu1'), 'bands/B/propostas/P1'), { status: 'aprovada', decididoEm: now, decididoPor: 'mu1' })));
await t('editor NÃO aprova (só o dono)', assertFails(updateDoc(doc(db('ed9'), 'bands/B/propostas/P1'), { status: 'aprovada', decididoEm: now, decididoPor: 'ed9' })));
await t('editor NÃO reescreve a proposta', assertFails(setDoc(doc(db('ed9'), 'bands/B/propostas/P1'), prop('mu1', { status: 'aprovada' }))));
await t('dono NÃO muda as notas da proposta ao aprovar', assertFails(updateDoc(doc(db('dono1'), 'bands/B/propostas/P1'), { status: 'aprovada', decididoEm: now, decididoPor: 'dono1', mudancas: [] })));
await t('outro músico lê a proposta', assertSucceeds(getDoc(doc(db('mu2'), 'bands/B/propostas/P1'))));
await t('outro músico NÃO apaga a proposta', assertFails(deleteDoc(doc(db('mu2'), 'bands/B/propostas/P1'))));
await t('dono aprova', assertSucceeds(updateDoc(doc(db('dono1'), 'bands/B/propostas/P1'), { status: 'aprovada', decididoEm: now, decididoPor: 'dono1' })));
await t('decidida NÃO muda de novo', assertFails(updateDoc(doc(db('dono1'), 'bands/B/propostas/P1'), { status: 'recusada', decididoEm: now, decididoPor: 'dono1' })));
await t('autor apaga a dele', assertSucceeds(deleteDoc(doc(db('mu1'), 'bands/B/propostas/P1'))));
await t('músico continua sem escrever nas músicas da banda', assertFails(setDoc(doc(db('mu1'), 'bands/B/songs/m1'), { title: 'x' })));
await t('versão pessoal na área particular do músico', assertSucceeds(setDoc(doc(db('mu1'), 'users/mu1/ann-B/pessoal__m1__trompete'), { tipo: 'versao_pessoal', musica: 'm1', parte: 'trompete', mudancas: [] })));
await t('ninguém lê a versão pessoal de outro', assertFails(getDoc(doc(db('mu2'), 'users/mu1/ann-B/pessoal__m1__trompete'))));
// the robots' monthly spend: the band reads it, only the server writes it (so nobody resets the R$ 20 limit)
await t('dono NÃO zera o gasto do mês', assertFails(setDoc(doc(db('dono1'), 'bands/B/uso/2026-11'), { reais: 0 })));
await t('editor NÃO mexe no gasto do mês', assertFails(setDoc(doc(db('ed9'), 'bands/B/uso/2026-11'), { reais: 0 })));
await t('quem é da banda lê o gasto do mês', assertSucceeds(getDoc(doc(db('mu1'), 'bands/B/uso/2026-11'))));
await t('quem não é da banda NÃO lê o gasto', assertFails(getDoc(doc(db('estranho'), 'bands/B/uso/2026-11'))));
// suggestions from the app: anyone signed in sends; only the app owner reads them all; the jury is the server's
await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'admins/chefe'), { ok: true }));
const sug = (uid, extra = {}) => ({ texto: 'O som não saiu', uid, nome: 'X', criadoEm: now, status: 'nova', tipo: 'problema', banda: 'B', bandaNome: 'Banda', papel: 'musico', tela: 'Partitura', aparelho: 'iPhone · Safari', ...extra });
await t('qualquer pessoa manda uma sugestão', assertSucceeds(setDoc(doc(db('mu1'), 'sugestoes/S1'), sug('mu1', { foto: 'sugestoes/mu1/S1.jpg' }))));
await t('NÃO manda em nome de outro', assertFails(setDoc(doc(db('mu1'), 'sugestoes/S2'), sug('mu2'))));
await t('NÃO manda já com o parecer do júri', assertFails(setDoc(doc(db('mu1'), 'sugestoes/S3'), sug('mu1', { juri: { estado: 'pronto', vale: true, bug: true } }))));
await t('NÃO manda já aprovada', assertFails(setDoc(doc(db('mu1'), 'sugestoes/S4'), sug('mu1', { status: 'aprovada' }))));
await t('NÃO aponta o print para a pasta de outro', assertFails(setDoc(doc(db('mu1'), 'sugestoes/S5'), sug('mu1', { foto: 'sugestoes/mu2/x.jpg' }))));
await t('quem mandou lê a sua', assertSucceeds(getDoc(doc(db('mu1'), 'sugestoes/S1'))));
await t('outra pessoa NÃO lê', assertFails(getDoc(doc(db('mu2'), 'sugestoes/S1'))));
await t('o dono do app lê', assertSucceeds(getDoc(doc(db('chefe'), 'sugestoes/S1'))));
await t('quem mandou NÃO se aprova', assertFails(updateDoc(doc(db('mu1'), 'sugestoes/S1'), { status: 'aprovada', atualizadoEm: now })));
await t('o dono do app aprova', assertSucceeds(updateDoc(doc(db('chefe'), 'sugestoes/S1'), { status: 'aprovada', atualizadoEm: now })));
await t('o dono do app NÃO muda o parecer do júri', assertFails(updateDoc(doc(db('chefe'), 'sugestoes/S1'), { juri: { vale: false } })));
await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'sistema/rotina'), { chave: 'segredo' }));
await t('o dono do app vê a chave da correção automática', assertSucceeds(getDoc(doc(db('chefe'), 'sistema/rotina'))));
await t('mais ninguém vê a chave', assertFails(getDoc(doc(db('mu1'), 'sistema/rotina'))));
// who signed up: only the app owner reads it; band owners, musicians, team partners and the person themselves do not
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), 'cadastros/mu1'), { nome: 'Mu', email: 'mu@x.com', em: now });
  await setDoc(doc(c.firestore(), 'equipe/parceiro'), { nome: 'Arranjador' }); });
await t('o dono do app vê os cadastros', assertSucceeds(getDoc(doc(db('chefe'), 'cadastros/mu1'))));
await t('o dono do app lista os cadastros', assertSucceeds(getDocs(collection(db('chefe'), 'cadastros'))));
await t('dono de banda NÃO vê os cadastros', assertFails(getDocs(collection(db('dono1'), 'cadastros'))));
await t('parceiro da equipe NÃO vê os cadastros', assertFails(getDoc(doc(db('parceiro'), 'cadastros/mu1'))));
await t('a própria pessoa NÃO vê o seu cadastro', assertFails(getDoc(doc(db('mu1'), 'cadastros/mu1'))));
await t('ninguém escreve cadastro pelo app (nem o dono do app)', assertFails(setDoc(doc(db('chefe'), 'cadastros/x'), { nome: 'x' })));
await t('ninguém se cadastra sozinho', assertFails(setDoc(doc(db('mu2'), 'cadastros/mu2'), { nome: 'x' })));
// Equipe do Salve: only the server (painel, by the app owner) puts someone in or takes them out
await t('ninguém se põe na Equipe do Salve sozinho', assertFails(setDoc(doc(db('mu2'), 'equipe/mu2'), { nome: 'x' })));
await t('nem o dono do app escreve equipe/ pelo app (só o servidor)', assertFails(setDoc(doc(db('chefe'), 'equipe/mu2'), { nome: 'x' })));
await t('o parceiro não se tira nem muda a própria marca', assertFails(updateDoc(doc(db('parceiro'), 'equipe/parceiro'), { papel: 'admin' })));
await t('quem está na equipe lê as lições', assertSucceeds(getDocs(collection(db('parceiro'), 'treino/regras/licoes'))));
await t('quem saiu da equipe NÃO lê as lições', assertFails(getDocs(collection(db('mu2'), 'treino/regras/licoes'))));
console.log(`\n${ok} passaram, ${fail} falharam`); await env.cleanup(); process.exit(fail ? 1 : 0);
