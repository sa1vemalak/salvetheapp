/* salvetheapp · who signed up: only for the app owner (admins/{uid}).
   Each new account (and each time someone joins a band) is saved in Firestore cadastros/{uid}, which the owner's admin
   panel shows. firestore.rules: read only if isAdmin, nobody writes from the app; only these functions write it.
   Nobody else (band owners, musicians, partners of the team, the person themselves) sees these records.
   cadastros/{uid} = { nome, email, entrada ('Google' | 'e-mail e senha' | ...), em (ms), bandas: [{ banda, bandaId, papel, como, em }] } */
'use strict';

const corta = (v, n = 200) => String(v == null ? '' : v).slice(0, n);
const ENTRADA = { 'google.com': 'Google', password: 'e-mail e senha', emailLink: 'link no e-mail' };

// the row of a new account, from the Auth user record
function conta(u) {
  const p = (u.providerData || [])[0] || {};
  const t = Date.parse(u.metadata && u.metadata.creationTime) || Date.now();
  return { tipo: 'conta', uid: corta(u.uid, 128), nome: corta(u.displayName || p.displayName, 120), email: corta(u.email || p.email, 254),
    entrada: ENTRADA[p.providerId] || corta(p.providerId || 'e-mail', 40), banda: '', bandaId: '', papel: '', como: '', em: t };
}

// how someone got into a band: the band, the role and the way in (invite link + who made it, or the access code)
async function entrada(db, bandaId, uid, m) {
  const b = await db.collection('bands').doc(bandaId).get().catch(() => null);
  const band = b && b.exists ? b.data() : {};
  let como = '';
  if (m.invite) {
    const inv = await db.collection('bands').doc(bandaId).collection('invites').doc(String(m.invite)).get().catch(() => null);
    const by = inv && inv.exists ? inv.data().by : '';
    const quem = by ? await db.collection('bands').doc(bandaId).collection('members').doc(by).get().catch(() => null) : null;
    como = 'link de convite' + (quem && quem.exists && quem.data().name ? ` de ${quem.data().name}` : '');
  } else if (m.role === 'dono') {
    if (band.codigo) {
      const c = await db.collection('codigos').doc(String(band.codigo)).get().catch(() => null);
      const nota = c && c.exists && c.data().nota ? ` (${c.data().nota})` : '';
      como = `criou a banda com o código ${band.codigo}${nota}`;
    } else como = 'criou a banda';
  }
  return { tipo: 'banda', uid: corta(uid, 128), nome: corta(m.name, 120), email: corta(m.email, 254), entrada: '',
    banda: corta(band.name || bandaId, 80), bandaId: corta(bandaId, 120), papel: corta(m.role, 20), como: corta(como, 300), em: m.joinedAt || Date.now() };
}

// saves the row: the doc keeps the account and the list of bands
async function guarda(db, admin, linha) {
  const ref = db.collection('cadastros').doc(linha.uid);
  if (linha.tipo === 'conta') {
    await ref.set({ nome: linha.nome, email: linha.email, entrada: linha.entrada, em: linha.em }, { merge: true });
  } else {
    await ref.set({ ...(linha.nome ? { nome: linha.nome } : {}), ...(linha.email ? { email: linha.email } : {}),
      bandas: admin.firestore.FieldValue.arrayUnion({ banda: linha.banda, bandaId: linha.bandaId, papel: linha.papel, como: linha.como, em: linha.em }) }, { merge: true });
  }
}

module.exports = { conta, entrada, guarda };
