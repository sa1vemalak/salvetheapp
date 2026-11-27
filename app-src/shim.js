/* salvetheapp on Firebase.
   Every band has its own private space: bands/{band}/(songs, layout, ann, versions, shows/{show}/logic).
   The app keeps talking to the same small window.claude API (db / user); this file maps its collections onto the
   band and show that are open, and shows the entry screens (login, create a band, accept an invite, pick a show). */
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch, increment } from 'firebase/firestore';
import { getStorage, ref as sref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, updateProfile } from 'firebase/auth';

const app = initializeApp({
  apiKey: 'AIzaSyDItCDsH2QN_DCVHfnK27qkQTVu0WJcf90',
  authDomain: 'salvetheapp-3cceb.firebaseapp.com',
  projectId: 'salvetheapp-3cceb',
  storageBucket: 'salvetheapp-3cceb.firebasestorage.app',
  messagingSenderId: '560061082405',
  appId: '1:560061082405:web:09f6f362ac4ff97fdc48cc',
});
let fs;
try { fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch { fs = getFirestore(app); }
const auth = getAuth(app);
const storage = getStorage(app);

// Firestore can't hold an array directly inside an array, so inner arrays are stored as { __a: [...] }.
const enc = v => Array.isArray(v) ? v.map(x => Array.isArray(x) ? { __a: enc(x) } : enc(x))
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) : v;
const dec = v => Array.isArray(v) ? v.map(dec)
  : v && typeof v === 'object' ? (Object.keys(v).length === 1 && Array.isArray(v.__a) ? dec(v.__a) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;

/* ---------------- where the open band and show live ---------------- */
const CTX = { user: null, band: null, bandName: '', show: null, showName: '', role: null, order: [] };
const LS = 'salve:last';
const remember = () => { try { localStorage.setItem(LS, JSON.stringify({ band: CTX.band, show: CTX.show })); } catch {} };
const recall = () => { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch { return null; } };

function mapPath(p) {
  const b = `bands/${CTX.band}`;
  if (p === 'songs' || p === 'layout' || p === 'ann' || p === 'versions') return `${b}/${p}`;
  if (p === 'logic') return `${b}/shows/${CTX.show}/logic`;
  const m = /^data\/users\/([^/]+)$/.exec(p);
  if (m) return `users/${m[1]}/ann-${CTX.band}`;   // each person's private notes, per band
  return `${b}/${p}`;
}
const wrapDoc = (s, extra) => ({ id: s.id, exists: s.exists(), data: () => s.exists() ? { ...dec(s.data()), ...(extra ? extra(s.id) : {}) } : undefined });
function coll(appPath, filters = []) {
  const path = mapPath(appPath);
  const ref = () => filters.length ? query(collection(fs, path), ...filters.map(([f, v]) => where(f, '==', v))) : collection(fs, path);
  // the song list is the open show's songs, in the show's order
  const isSongs = appPath === 'songs';
  const extra = isSongs ? id => ({ order: CTX.order.indexOf(id) + 1 }) : null;
  const keep = isSongs ? d => CTX.order.includes(d.id) : () => true;
  return {
    doc: id => {
      const d = doc(fs, path, id);
      return {
        get: () => getDoc(d).then(s => wrapDoc(s, extra)),
        set: v => setDoc(d, enc(isSongs ? stripOrder(v) : v)),
        update: v => updateDoc(d, enc(isSongs ? stripOrder(v) : v)),
        delete: () => deleteDoc(d),
      };
    },
    where: (f, op, v) => coll(appPath, [...filters, [f, v]]),
    onSnapshot: (cb, err) => {
      let last = null;
      const fire = snap => { if (!snap) return; last = snap; const docs = snap.docs.filter(keep).map(s => wrapDoc(s, extra));
        cb({ docs, metadata: { fromCache: snap.metadata.fromCache }, docChanges: () => snap.docChanges().filter(c => keep(c.doc)).map(c => ({ type: c.type, doc: wrapDoc(c.doc, extra) })) }); };
      const un = onSnapshot(ref(), { includeMetadataChanges: false }, fire, err);
      if (isSongs) showListeners.add(() => fire(last));
      return un;
    },
  };
}
const stripOrder = v => { const { order, ...rest } = v || {}; return rest; };
const showListeners = new Set();

/* ---------------- bands, shows, invites ---------------- */
const slug = t => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');

async function myBands() {
  const u = await getDoc(doc(fs, 'users', CTX.user.uid));
  const bands = (u.exists() && u.data().bands) || {};
  return Object.entries(bands).map(([id, v]) => ({ id, name: v.name || id, role: v.role }));
}
async function noteBand(id, name, role) {
  await setDoc(doc(fs, 'users', CTX.user.uid), { bands: { [id]: { name, role } }, email: CTX.user.email || '', name: CTX.user.displayName || '' }, { merge: true });
}
// signup is invite-only for now: a new band needs an access code, unless signup is open or the person is an app admin
async function signupState() {
  const [cfg, adm] = await Promise.all([getDoc(doc(fs, 'config', 'app')).catch(() => null), getDoc(doc(fs, 'admins', CTX.user.uid)).catch(() => null)]);
  return { open: !!(cfg && cfg.exists() && cfg.data().cadastroAberto), admin: !!(adm && adm.exists()) };
}
async function createBand(name, codigo) {
  const id = slug(name) + '-' + code().slice(0, 5);  // other bands can't be read, so never reuse a name as is
  const band = { name, owner: CTX.user.uid, createdAt: Date.now() };
  const st = await signupState();
  const b = writeBatch(fs);
  if (!st.open && !st.admin) {
    const c = String(codigo || '').trim().toUpperCase();
    if (!c) throw new Error('Digite o código de acesso.');
    const cd = await getDoc(doc(fs, 'codigos', c)).catch(() => null);
    if (!cd || !cd.exists()) throw new Error('Código de acesso não encontrado. Confira as letras.');
    const d = cd.data();
    if (!d.ativo) throw new Error('Este código de acesso foi desativado.');
    if (d.usados >= d.limite) throw new Error('Este código de acesso já foi usado o número máximo de vezes.');
    band.codigo = c;
    b.update(doc(fs, 'codigos', c), { usados: increment(1), ultimaBanda: id });
  }
  b.set(doc(fs, 'bands', id), band);
  await b.commit();
  await setDoc(doc(fs, 'bands', id, 'members', CTX.user.uid), { role: 'dono', name: CTX.user.displayName || '', email: CTX.user.email || '', joinedAt: Date.now() });
  await noteBand(id, name, 'dono');
  const show = await createShow(id, 'Meu primeiro show');
  return { id, show };
}
// app admin: access codes and the signup switch
async function listCodes() { const s = await getDocs(collection(fs, 'codigos')); return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0)); }
async function newCode(limite, nota) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = '';
  crypto.getRandomValues(new Uint8Array(8)).forEach(x => { c += abc[x % abc.length]; });
  await setDoc(doc(fs, 'codigos', c), { ativo: true, limite: Math.max(1, Math.min(10000, limite | 0 || 1)), usados: 0, nota: String(nota || '').slice(0, 200), criadoEm: Date.now() });
  return c;
}
const setCodeActive = (c, ativo) => updateDoc(doc(fs, 'codigos', c), { ativo });
const setSignupOpen = open => setDoc(doc(fs, 'config', 'app'), { cadastroAberto: !!open });
// the app team (admins + partners such as the band's arranger): suggestions, the AI arranger's rules and lessons
async function teamState() {
  const [adm, eq] = await Promise.all([getDoc(doc(fs, 'admins', CTX.user.uid)).catch(() => null), getDoc(doc(fs, 'equipe', CTX.user.uid)).catch(() => null)]);
  const admin = !!(adm && adm.exists()), partner = !!(eq && eq.exists());
  return { team: admin || partner, admin, papel: partner ? (eq.data().papel || '') : (admin ? 'admin' : '') };
}
const me = () => ({ uid: CTX.user.uid, nome: (CTX.user.displayName || CTX.user.email || '').slice(0, 80) });
const byNewest = k => (a, b) => (b[k] || 0) - (a[k] || 0);
const team = {
  watchSugestoes: cb => onSnapshot(collection(fs, 'sugestoes'), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest('criadoEm'))), () => cb(null)),
  addSugestao: texto => setDoc(doc(collection(fs, 'sugestoes')), { texto: String(texto).slice(0, 2000), ...me(), criadoEm: Date.now(), status: 'nova' }),
  setSugestao: (id, status, resposta) => updateDoc(doc(fs, 'sugestoes', id), { status, ...(resposta != null ? { resposta: String(resposta).slice(0, 2000) } : {}), atualizadoEm: Date.now() }),
  delSugestao: id => deleteDoc(doc(fs, 'sugestoes', id)),
  regras: () => getDoc(doc(fs, 'treino', 'regras')).then(d => d.exists() ? d.data() : null),
  async salvarRegras(texto) {  // keeps the text it replaces, so any edit can be undone
    const now = Date.now(), m = me();
    await setDoc(doc(fs, 'treino', 'regras', 'versoes', String(now)), { texto, uid: m.uid, nome: m.nome, em: now });
    await setDoc(doc(fs, 'treino', 'regras'), { texto, uid: m.uid, nome: m.nome, atualizadoEm: now });
  },
  versoes: () => getDocs(collection(fs, 'treino', 'regras', 'versoes')).then(s => s.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest('em'))),
  watchLicoes: cb => onSnapshot(collection(fs, 'treino', 'regras', 'licoes'), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest('criadoEm'))), () => cb(null)),
  addLicao: (texto, musica) => setDoc(doc(collection(fs, 'treino', 'regras', 'licoes')), { texto: String(texto).slice(0, 1500), ...(musica ? { musica: String(musica).slice(0, 120) } : {}), ...me(), criadoEm: Date.now(), ativa: true }),
  setLicao: (id, ativa, texto) => updateDoc(doc(fs, 'treino', 'regras', 'licoes', id), { ativa: !!ativa, texto: String(texto).slice(0, 1500) }),
  delLicao: id => deleteDoc(doc(fs, 'treino', 'regras', 'licoes', id)),
};
// files (scores and sources) go to the band's folder in Cloud Storage; only band members can open the links' folder by rules
function uploadFile(file, opts = {}) {
  if (!CTX.band) return Promise.reject(new Error('sem banda'));
  if (file.size > 200 * 1024 * 1024) return Promise.reject(Object.assign(new Error('grande demais'), { code: 'too_large' }));
  const safe = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.\-]+/g, '_').slice(-80);
  const path = `bands/${CTX.band}/arquivos/${Date.now()}-${code().slice(0, 6)}-${safe}`;
  return new Promise((ok, bad) => {
    const task = uploadBytesResumable(sref(storage, path), file, { contentType: opts.type || file.type || 'application/octet-stream' });
    task.on('state_changed', snap => opts.onProgress && opts.onProgress(snap.bytesTransferred / Math.max(1, snap.totalBytes)), bad,
      async () => { try { ok({ url: await getDownloadURL(task.snapshot.ref), id: path }); } catch (e) { bad(e); } });
  });
}
async function createShow(band, name) {
  const id = slug(name) + '-' + code().slice(0, 4);
  await setDoc(doc(fs, 'bands', band, 'shows', id), { name, order: [], createdAt: Date.now() });
  await setDoc(doc(fs, 'bands', band, 'shows', id, 'logic', 'config'), enc({ markers: [[1, null, 'Intro']], beatsPerBar: 4, switchBars: {}, daw: 'logic' }));
  return id;
}
async function listShows(band) {
  const s = await getDocs(collection(fs, 'bands', band || CTX.band, 'shows'));
  return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
async function saveShow(id, data) { await updateDoc(doc(fs, 'bands', CTX.band, 'shows', id), data); }
async function deleteShow(id) { await deleteDoc(doc(fs, 'bands', CTX.band, 'shows', id)); }
async function library() {
  const s = await getDocs(collection(fs, 'bands', CTX.band, 'songs'));
  return s.docs.map(d => ({ id: d.id, title: d.data().title, tag: d.data().tag || '' })).sort((a, b) => a.title.localeCompare(b.title));
}
async function makeInvite(role) {
  const c = code();
  await setDoc(doc(fs, 'bands', CTX.band, 'invites', c), { role, bandName: CTX.bandName, createdAt: Date.now(), by: CTX.user.uid });
  return `${location.origin}/?convite=${CTX.band}.${c}`;
}
async function members() {
  const s = await getDocs(collection(fs, 'bands', CTX.band, 'members'));
  return s.docs.map(d => ({ uid: d.id, ...d.data() }));
}
async function setRole(uid, role) { await updateDoc(doc(fs, 'bands', CTX.band, 'members', uid), { role }); }
async function removeMember(uid) { await deleteDoc(doc(fs, 'bands', CTX.band, 'members', uid)); }
async function acceptInvite(band, c) {
  const inv = await getDoc(doc(fs, 'bands', band, 'invites', c));
  if (!inv.exists()) throw new Error('Convite inválido ou já apagado.');
  const { role, bandName } = inv.data();
  const me = doc(fs, 'bands', band, 'members', CTX.user.uid);
  const already = await getDoc(me).catch(() => null);
  if (!already || !already.exists()) await setDoc(me, { role, invite: c, name: CTX.user.displayName || '', email: CTX.user.email || '', joinedAt: Date.now() });
  const r = already && already.exists() ? already.data().role : role;
  await noteBand(band, bandName || band, r);
  return band;
}
async function open(band, show) {
  const b = await getDoc(doc(fs, 'bands', band));
  const m = await getDoc(doc(fs, 'bands', band, 'members', CTX.user.uid));
  if (!b.exists() || !m.exists()) throw new Error('Você não faz parte desta banda.');
  CTX.band = band; CTX.bandName = b.data().name; CTX.role = m.data().role;
  const shows = await listShows(band);
  const sh = shows.find(s => s.id === show) || shows[0];
  CTX.show = sh ? sh.id : null; CTX.showName = sh ? sh.name : ''; CTX.order = sh ? (sh.order || []) : [];
  remember();
  // keep the song list in step with the show (songs added, removed or reordered)
  if (CTX.show) onSnapshot(doc(fs, 'bands', band, 'shows', CTX.show), s => {
    if (!s.exists()) return;
    const d = s.data(); CTX.order = d.order || []; CTX.showName = d.name || '';
    showListeners.forEach(f => f()); window.dispatchEvent(new CustomEvent('salve:show', { detail: { ...CTX } }));
  });
}

/* ---------------- entry screens ---------------- */
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => k === 'class' ? e.className = v : k.startsWith('on') ? e[k] = v : e.setAttribute(k, v)); kids.flat().forEach(k => e.append(k?.nodeType ? k : document.createTextNode(k ?? ''))); return e; };
let gateEl = null;
const svg = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
// five staff lines with a few notes, the app's mark
const STAFF = '<svg class="gate-staff" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.4" opacity=".55"><path d="M0 20H600M0 40H600M0 60H600M0 80H600M0 100H600"/></g><g fill="currentColor"><ellipse cx="120" cy="70" rx="9" ry="6.5" transform="rotate(-20 120 70)"/><ellipse cx="190" cy="50" rx="9" ry="6.5" transform="rotate(-20 190 50)"/><ellipse cx="260" cy="30" rx="9" ry="6.5" transform="rotate(-20 260 30)"/><ellipse cx="400" cy="60" rx="9" ry="6.5" transform="rotate(-20 400 60)"/><ellipse cx="470" cy="40" rx="9" ry="6.5" transform="rotate(-20 470 40)"/></g><g stroke="currentColor" stroke-width="2.2"><path d="M128 67V12M198 47V-8M268 27V-28M408 57V2M478 37V-18"/></g></svg>';
function gate(...content) {
  if (!gateEl) { gateEl = h('div', { class: 'gate' }); document.body.append(gateEl); }
  const hero = h('section', { class: 'gate-hero' },
    h('div', { class: 'gate-logo' }, h('span', { class: 'gate-s' }, 'S'), h('span', {}, 'salvetheapp')),
    h('div', { class: 'gate-copy' },
      h('p', { class: 'gate-kicker' }, 'Para bandas e músicos'),
      h('h2', {}, 'A banda inteira ', h('em', {}, 'na mesma página.')),
      h('ul', { class: 'gate-feats' },
        h('li', {}, h('b', {}, 'Partituras'), ' de cada músico, sempre na versão certa'),
        h('li', {}, h('b', {}, 'Player'), ' com contagem antes de cada entrada'),
        h('li', {}, h('b', {}, 'Sincroniza'), ' com a sua DAW, no Mac ou no Windows'))),
    svg(STAFF));
  gateEl.replaceChildren(h('div', { class: 'gate-in' }, hero, h('section', { class: 'gate-card' }, ...content)));
}
const closeGate = () => { gateEl?.remove(); gateEl = null; };
const msg = t => h('p', { class: 'gate-msg', role: 'status' }, t);

const AUTH_ERR = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.', 'auth/user-not-found': 'Não existe conta com esse e-mail. Toque em "Criar conta".',
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Toque em "Entrar" (ou "Esqueci a senha").', 'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'Confira o e-mail.', 'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.', 'auth/network-request-failed': 'Sem internet. Confira a conexão.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar.', 'auth/missing-password': 'Digite a senha.',
};
const authMsg = e => AUTH_ERR[e?.code] || ('Não deu certo: ' + (e?.code || e?.message || e));
function loginScreen(note, startMode) {
  return new Promise(() => {
    let mode = startMode || 'entrar';
    const draw = () => {
      const out = msg(note || ''); note = '';
      const name = h('input', { type: 'text', placeholder: 'Seu nome', autocomplete: 'name', 'aria-label': 'Seu nome' });
      const email = h('input', { type: 'email', placeholder: 'seu@email.com', autocomplete: 'email', 'aria-label': 'E-mail' });
      const pass = h('input', { type: 'password', placeholder: mode === 'criar' ? 'Crie uma senha (mín. 6)' : 'Senha', autocomplete: mode === 'criar' ? 'new-password' : 'current-password', 'aria-label': 'Senha' });
      try { email.value = localStorage.getItem('salve:email') || ''; } catch {}
      const busy = (btn, on) => { btn.disabled = on; btn.style.opacity = on ? .6 : 1; };
      const go = async () => {
        const e = email.value.trim(), pw = pass.value;
        if (!/.+@.+\..+/.test(e)) { out.textContent = 'Confira o e-mail.'; email.focus(); return; }
        try { localStorage.setItem('salve:email', e); } catch {}
        busy(main, true);
        try {
          if (mode === 'esqueci') { await sendPasswordResetEmail(auth, e); out.textContent = 'Pronto: mandamos um link para criar uma nova senha. Confira o e-mail (e a caixa de spam).'; }
          else if (mode === 'criar') {
            if (!name.value.trim()) { out.textContent = 'Digite seu nome (é o que a banda vai ver).'; name.focus(); return; }
            const c = await createUserWithEmailAndPassword(auth, e, pw);
            await updateProfile(c.user, { displayName: name.value.trim() });
            sendEmailVerification(c.user).catch(() => {});
            location.reload();
          } else { await signInWithEmailAndPassword(auth, e, pw); location.reload(); }
        } catch (x) { out.textContent = authMsg(x); }
        finally { busy(main, false); }
      };
      [name, email, pass].forEach(i => i.onkeydown = ev => { if (ev.key === 'Enter') go(); });
      const main = h('button', { class: 'gate-btn primary gate-full', type: 'button', onclick: go }, mode === 'criar' ? 'Criar conta' : mode === 'esqueci' ? 'Mandar link de nova senha' : 'Entrar');
      const tab = (m, t) => h('button', { class: 'gate-tab' + (mode === m ? ' on' : ''), type: 'button', 'aria-pressed': String(mode === m), onclick: () => { mode = m; draw(); } }, t);
      const google = h('button', { class: 'gate-google', type: 'button', onclick: () => fbAuth.signIn().catch(e => { out.textContent = authMsg(e); }) }, svg(G_LOGO), 'Continuar com Google');
      gate(h('h1', {}, mode === 'criar' ? 'Criar conta' : mode === 'esqueci' ? 'Nova senha' : 'Entrar'),
        mode === 'esqueci' ? h('p', { class: 'gate-sub' }, 'Digite o e-mail da sua conta e mandamos um link para criar uma nova senha.')
          : h('div', { class: 'gate-tabs', role: 'group' }, tab('entrar', 'Entrar'), tab('criar', 'Criar conta')),
        mode !== 'esqueci' ? google : '',
        mode !== 'esqueci' ? h('div', { class: 'gate-or' }, h('span', {}, 'ou com e-mail')) : '',
        mode === 'criar' ? h('label', { class: 'gate-label' }, 'Nome') : '', mode === 'criar' ? name : '',
        h('label', { class: 'gate-label' }, 'E-mail'), email,
        mode !== 'esqueci' ? h('label', { class: 'gate-label' }, 'Senha') : '', mode !== 'esqueci' ? pass : '',
        main, out,
        mode === 'entrar' ? h('button', { class: 'gate-link', type: 'button', onclick: () => { mode = 'esqueci'; draw(); } }, 'Esqueci a senha') : '',
        mode === 'esqueci' ? h('button', { class: 'gate-link', type: 'button', onclick: () => { mode = 'entrar'; draw(); } }, '← Voltar para entrar') : '',
        h('p', { class: 'gate-fine' }, 'Recebeu um convite de banda? Entre ou crie sua conta com qualquer e-mail: o convite é aceito logo em seguida.'));
      (mode === 'criar' ? name : email.value ? (mode === 'esqueci' ? email : pass) : email).focus?.();
    };
    draw();
  });
}
function pickScreen(bands, inviteError, st) {
  return new Promise(resolve => {
    const name = h('input', { type: 'text', placeholder: 'Nome da banda', 'aria-label': 'Nome da banda' });
    const needCode = !st.open && !st.admin;
    const codeIn = h('input', { type: 'text', placeholder: 'Código de acesso', 'aria-label': 'Código de acesso', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false' });
    const err = h('p', { class: 'gate-msg gate-err', role: 'status' });
    const create = async () => {
      const n = name.value.trim(); if (!n) { name.focus(); return; }
      err.textContent = '';
      try { const r = await createBand(n, codeIn.value); resolve({ band: r.id, show: r.show }); }
      catch (e) { err.textContent = e.code === 'permission-denied' ? 'O código de acesso não foi aceito. Confira e tente de novo.' : (e.message || e.code); }
    };
    codeIn.onkeydown = ev => { if (ev.key === 'Enter') create(); };
    name.onkeydown = ev => { if (ev.key === 'Enter') create(); };
    const role = r => r === 'dono' ? 'dono' : r === 'editor' ? 'editor' : 'músico';
    const list = bands.map(b => h('button', { class: 'gate-item', type: 'button', onclick: () => resolve({ band: b.id }) },
      h('span', { class: 'gate-av', 'aria-hidden': 'true' }, (b.name || '?').trim().charAt(0).toUpperCase()),
      h('span', { class: 'gate-item-t' }, h('b', {}, b.name), h('small', {}, role(b.role))),
      h('span', { class: 'gate-go', 'aria-hidden': 'true' }, '→')));
    const who = CTX.user.displayName ? CTX.user.displayName.split(' ')[0] : '';
    gate(h('h1', {}, bands.length ? 'Suas bandas' : 'Bem-vindo' + (who ? ', ' + who : '')),
      h('p', { class: 'gate-sub' }, bands.length ? 'Escolha a banda para abrir.' : needCode ? 'Para criar uma banda você precisa de um código de acesso (o salvetheapp está em fase de convites). Para entrar numa banda que já existe, abra o link de convite que ela te mandou.' : 'Crie a sua banda para começar. Para entrar numa banda que já existe, abra o link de convite que ela te mandou.'),
      inviteError ? h('p', { class: 'gate-msg gate-err' }, inviteError) : '',
      bands.length ? h('div', { class: 'gate-list' }, ...list) : '',
      h('label', { class: 'gate-label' }, bands.length ? 'Ou crie outra banda' : 'Nome da banda'),
      needCode ? h('div', { class: 'gate-row' }, name) : h('div', { class: 'gate-row' }, name, h('button', { class: 'gate-btn primary', type: 'button', onclick: create }, 'Criar banda')),
      needCode ? h('div', { class: 'gate-row' }, codeIn, h('button', { class: 'gate-btn primary', type: 'button', onclick: create }, 'Criar banda')) : '',
      err,
      st.team ? h('p', { class: 'gate-sub' }, h('a', { href: 'equipe.html', class: 'gate-link' }, 'Equipe do app: sugestões, regras e lições do Mestrinho →')) : '',
      h('div', { class: 'gate-foot' }, h('span', {}, CTX.user.email || CTX.user.displayName || 'conta'), h('button', { class: 'gate-link', type: 'button', onclick: () => fbAuth.signOut() }, 'Sair')));
  });
}

let ready;
async function start() {
  // e-mail link coming back
  if (isSignInWithEmailLink(auth, location.href)) {
    let e = localStorage.getItem('salve:email') || prompt('Confirme seu e-mail para entrar:');
    if (e) { try { await signInWithEmailLink(auth, e, location.href); } catch {} }
    const u = new URL(location.href); ['apiKey', 'oobCode', 'mode', 'lang'].forEach(k => u.searchParams.delete(k)); history.replaceState(null, '', u);
  }
  if (window.__testToken) { try { await signInWithCustomToken(auth, window.__testToken); } catch (e) { console.error(e); } }
  const user = await new Promise(r => { const un = onAuthStateChanged(auth, x => { un(); r(x); }); });
  const inv = new URL(location.href).searchParams.get('convite');
  if (inv) try { sessionStorage.setItem('salve:convite', inv); } catch {}
  if (!user) { await loginScreen(inv ? 'Você recebeu um convite! Crie sua conta ou entre para aceitar.' : '', inv ? 'criar' : 'entrar'); return; }
  CTX.user = user;
  let invErr = '';
  const pending = inv || (() => { try { return sessionStorage.getItem('salve:convite'); } catch { return null; } })();
  let target = null;
  if (pending) {
    const [band, c] = pending.split('.');
    try { target = { band: await acceptInvite(band, c) }; } catch (e) { invErr = e.message || 'Convite inválido.'; }
    try { sessionStorage.removeItem('salve:convite'); } catch {}
    const u = new URL(location.href); u.searchParams.delete('convite'); history.replaceState(null, '', u);
  }
  const bands = await myBands();
  let forcePick = false; try { forcePick = !!sessionStorage.getItem('salve:pick'); sessionStorage.removeItem('salve:pick'); } catch {}
  if (!target && !forcePick) {
    const last = recall();
    if (last && bands.some(b => b.id === last.band)) target = last;
    else if (bands.length === 1 && !invErr) target = { band: bands[0].id };
  }
  while (true) {
    if (!target) {
      const st = await signupState().catch(() => ({ open: false, admin: false }));
      st.team = st.admin || (await teamState().catch(() => ({ team: false }))).team;
      target = await pickScreen(bands, invErr, st);
    }
    try { await open(target.band, target.show); break; }
    catch (e) { invErr = e.message; target = null; }
  }
  closeGate();
}

window.claude = {
  use: async name => {
    if (!ready) ready = start();
    await ready;
    if (name === 'db') return { collection: p => coll(p) };
    if (name === 'user') return { canEdit: async () => CTX.role === 'dono' || CTX.role === 'editor', id: async () => CTX.user?.uid || null };
    if (name === 'assets') return { upload: uploadFile };
    return null;
  },
};
window.fbAuth = {
  user: () => auth.currentUser,
  async signIn() {
    const p = new GoogleAuthProvider();
    try { await signInWithPopup(auth, p); location.reload(); }
    catch (e) { if (e && /popup/.test(e.code || '')) return signInWithRedirect(auth, p); throw e; }
  },
  async signOut() { try { localStorage.removeItem(LS); } catch {} await signOut(auth); location.href = location.pathname; },
};
window.SALVE = {
  ctx: () => ({ ...CTX }),
  token: () => auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null),
  listShows, createShow: name => createShow(CTX.band, name), saveShow, deleteShow, library,
  makeInvite, members, setRole, removeMember, myBands,
  signupState, listCodes, newCode, setCodeActive, setSignupOpen, upload: uploadFile, teamState, team,
  switchTo: (band, show) => { CTX.band = band; CTX.show = show; remember(); location.reload(); },
  switchBand: () => { try { localStorage.removeItem(LS); sessionStorage.setItem('salve:pick', '1'); } catch {} location.reload(); },
};
