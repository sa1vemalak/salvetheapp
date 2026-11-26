#!/usr/bin/env node
/* salvetheapp, modo local (Mac Intel/Apple e Windows).
   node servidor.js            -> serves the app on this computer's network (no internet needed) and passes Logic's position to the iPads
   node servidor.js atualizar  -> downloads the latest app, scores, audio and Logic alignment from the internet (run with internet)
   Needs only Node.js, no other installs. */
'use strict';
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');

const HERE = __dirname;
const SITE = path.join(HERE, 'site');
const DATA = path.join(HERE, 'dados.json');
const PORT = +(process.env.PORT || 8080);
const ORIGIN = process.env.ORIGIN || 'https://salvetheapp.web.app';
const FS_API = 'https://firestore.googleapis.com/v1/projects/salvetheapp-3cceb/databases/(default)/documents';
const API_KEY = 'AIzaSyDItCDsH2QN_DCVHfnK27qkQTVu0WJcf90';  // public web key of the app (read-only by the database rules)
const COLLECTIONS = ['songs', 'layout', 'logic', 'ann'];

/* ---------------- atualizar (needs internet) ---------------- */
function get(url, asBuffer) {
  return new Promise((ok, bad) => {
    (url.startsWith('http:') ? http : https).get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); return get(new URL(res.headers.location, url).href, asBuffer).then(ok, bad); }
      if (res.statusCode !== 200) { res.resume(); return bad(new Error(url + ' -> ' + res.statusCode)); }
      const parts = []; res.on('data', c => parts.push(c)); res.on('end', () => { const b = Buffer.concat(parts); ok(asBuffer ? b : b.toString('utf8')); });
    }).on('error', bad);
  });
}
function unv(v) {
  const [k, x] = Object.entries(v)[0];
  if (k === 'mapValue') return Object.fromEntries(Object.entries(x.fields || {}).map(([a, b]) => [a, unv(b)]));
  if (k === 'arrayValue') return (x.values || []).map(unv);
  if (k === 'integerValue') return Number(x);
  if (k === 'nullValue') return null;
  return x;
}
// the online database keeps arrays-inside-arrays as { __a: [...] }
const dec = v => Array.isArray(v) ? v.map(dec) : v && typeof v === 'object' ? (Object.keys(v).length === 1 && Array.isArray(v.__a) ? dec(v.__a) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;

async function atualizar() {
  console.log('Baixando os dados (músicas, alinhamento com a DAW)…');
  // the band's data is private now: it comes from the app (Banda › Modo local › Baixar dados deste show)
  if (fs.existsSync(DATA) && JSON.parse(fs.readFileSync(DATA, 'utf8')).show) {
    console.log('  usando o dados.json baixado do app (' + JSON.parse(fs.readFileSync(DATA, 'utf8')).show.name + ').');
    return baixarArquivos();
  }
  const all = {};
  for (const col of COLLECTIONS) {
    all[col] = {};
    let token = '';
    do {
      const j = JSON.parse(await get(`${FS_API}/${col}?pageSize=300&key=${API_KEY}${token ? '&pageToken=' + encodeURIComponent(token) : ''}`));
      for (const d of j.documents || []) all[col][d.name.split('/').pop()] = dec(Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, unv(v)])));
      token = j.nextPageToken || '';
    } while (token);
  }
  delete (all.logic || {}).live; delete (all.logic || {}).debug;
  fs.writeFileSync(DATA, JSON.stringify(all));
  console.log('  ok:', Object.entries(all).map(([k, v]) => `${Object.keys(v).length} ${k}`).join(', '));
  return baixarArquivos();
}
async function baixarArquivos() {
  console.log('Baixando o app, partituras e áudios (a primeira vez demora: ~700 MB)…');
  const man = JSON.parse(await get(`${ORIGIN}/local/manifest.json?${Date.now()}`));
  let n = 0, got = 0, bytes = 0;
  for (const f of man.files) {
    const dest = path.join(SITE, f.to || f.path);
    n++;
    const have = fs.existsSync(dest) && fs.statSync(dest).size === f.size &&
      (!f.md5 || crypto.createHash('md5').update(fs.readFileSync(dest)).digest('hex') === f.md5);
    if (have) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const b = await get(`${ORIGIN}/${f.path.split('/').map(encodeURIComponent).join('/')}`, true);
    fs.writeFileSync(dest, b); got++; bytes += b.length;
    process.stdout.write(`\r  ${n}/${man.files.length} arquivos · baixados ${got} (${Math.round(bytes / 1e6)} MB)   `);
  }
  // remove files that are no longer part of the app
  const keep = new Set(man.files.map(f => path.join(SITE, f.to || f.path)));
  const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  walk(SITE).filter(f => !keep.has(f)).forEach(f => fs.unlinkSync(f));
  console.log(`\nPronto. Versão ${man.version}. Agora pode usar sem internet.`);
}

/* ---------------- servidor local (no internet needed) ---------------- */
function ips() {
  return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

function serve() {
  if (!fs.existsSync(path.join(SITE, 'index.html')) || !fs.existsSync(DATA)) {
    console.log('\nAinda não há uma cópia do app neste computador. Com internet, abra primeiro "Atualizar salvetheapp".\n');
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const clients = new Set();
  let saveT = null;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => {
    const keep = JSON.parse(JSON.stringify(db)); if (keep.logic) { delete keep.logic.live; delete keep.logic.debug; }
    fs.writeFile(DATA, JSON.stringify(keep), () => {});
  }, 2000); };
  const broadcast = m => { const line = `data: ${JSON.stringify(m)}\n\n`; clients.forEach(res => res.write(line)); };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);
    if (p === '/api/data') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(db)); }
    if (p === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('retry: 1000\n\n'); clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (p === '/api/doc' && req.method === 'POST') {
      // only the Mac itself may change things
      const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      if (!local) { res.writeHead(403); return res.end(); }
      let body = ''; req.on('data', c => { body += c; if (body.length > 5e6) req.destroy(); });
      req.on('end', () => {
        try {
          const { col, id, data } = JSON.parse(body);
          if (typeof col !== 'string' || typeof id !== 'string') throw new Error('bad');
          db[col] = db[col] || {};
          if (data === null) delete db[col][id]; else db[col][id] = data;
          broadcast({ col, id, data });
          if (!(col === 'logic' && (id === 'live' || id === 'debug'))) save();
          res.writeHead(200); res.end('{}');
        } catch { res.writeHead(400); res.end(); }
      });
      return;
    }
    // files
    let f = path.normalize(path.join(SITE, p === '/' ? 'index.html' : p));
    if (!f.startsWith(SITE)) { res.writeHead(403); return res.end(); }
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); return res.end('não encontrado'); }
      const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      const head = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': /\.(mp4|pdf|wav)$/.test(f) ? 'max-age=3600' : 'no-cache' };
      if (range) {
        const s = range[1] ? +range[1] : Math.max(0, st.size - +range[2]);
        const e = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
        res.writeHead(206, { ...head, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Content-Length': e - s + 1 });
        return fs.createReadStream(f, { start: s, end: e }).pipe(res);
      }
      res.writeHead(200, { ...head, 'Content-Length': st.size });
      fs.createReadStream(f).pipe(res);
    });
  });
  setInterval(() => clients.forEach(res => res.write(': ok\n\n')), 15000);
  server.listen(PORT, '0.0.0.0', () => {
    const list = ips();
    console.log('\n  salvetheapp · modo local ligado\n');
    console.log(`  Neste computador (Chrome ou Edge):  http://localhost:${PORT}`);
    list.forEach(ip => console.log(`  Nos iPads e celulares:             http://${ip}:${PORT}`));
    if (!list.length) console.log('  (este computador ainda não está em nenhuma rede Wi-Fi)');
    console.log('\n  Deixe esta janela aberta durante o ensaio. Para desligar, feche a janela.\n');
    if (!process.env.NO_OPEN) {
      const url = `http://localhost:${PORT}`, cp = require('child_process');
      if (process.platform === 'darwin') cp.exec(`open -a "Google Chrome" ${url} || open ${url}`);
      else if (process.platform === 'win32') cp.exec(`start "" chrome ${url} || start "" msedge ${url} || start "" ${url}`);
      else cp.exec(`xdg-open ${url}`);
    }
  });
}

if (process.argv[2] === 'atualizar') atualizar().catch(e => { console.error('\nNão consegui atualizar:', e.message, /403/.test(e.message) ? '\nOs dados da banda agora são privados. No app, toque em Banda › Modo local › "Baixar dados deste show", coloque o dados.json nesta pasta e rode o Atualizar de novo.' : '\nConfira a internet e tente de novo.'); process.exit(1); });
else serve();
