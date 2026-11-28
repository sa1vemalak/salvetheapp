// Teste do convite (rápido, sem Firebase): o botão "Link para músico"/"Link para editor" copia uma mensagem pronta
// com o nome da banda, quem convidou e o link; o "Copiar" do código de acesso copia o convite para testar o app.
//   node testes/convite.js            (FOTOS=pasta para salvar um print)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json', '.wasm': 'application/wasm' };
const srv = http.createServer((req, res) => {
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { Band, S };\nboot();\n})();');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(), erros = [];
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.stack));
  await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 });
  const abre = async user => { erros.length = 0;
    await p.evaluate(user => {
      document.querySelectorAll('.modal,.scrim,.gate').forEach(x => x.remove());
      const v = async x => x;
      window.SALVE = Object.assign(window.SALVE || {}, {
        ctx: () => ({ band: 'b', show: 's', role: 'dono', bandName: 'Poesia Acústica', user, order: [] }),
        listShows: () => v([]), myBands: () => v([]), members: () => v([]), teamState: () => v({}),
        makeInvite: tipo => v(`https://salvetheapp.web.app/?convite=${tipo}123`),
        signupState: () => v({ admin: true, open: false }), listCodes: () => v([{ id: 'ABCD1234', nota: 'teste', usados: 0, limite: 1, ativo: true }]),
      });
      window.__t.S.db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) };
      window.__t.Band.open();
    }, user);
    await p.waitForSelector('[data-inv="musico"]'); await p.waitForTimeout(300);
  };
  const copia = async sel => { await p.evaluate(() => navigator.clipboard.writeText('')); await p.click(sel); await p.waitForTimeout(300); return p.evaluate(() => navigator.clipboard.readText()); };

  await abre({ uid: 'u', displayName: 'Lucas Malak', email: 'x@y.com' });
  let t = await copia('[data-inv="musico"]');
  confere('músico: mensagem com banda, quem convidou e o link', t.startsWith('Olá! Você foi convidado para a banda Poesia Acústica por Lucas Malak.') && t.includes('https://salvetheapp.web.app/?convite=musico123') && !t.includes('editor'), t);
  confere('o link continua na caixinha', await p.$eval('#bInvLink', e => e.value) === 'https://salvetheapp.web.app/?convite=musico123');
  t = await copia('[data-inv="editor"]');
  confere('editor: diz que é como editor', t.includes('por Lucas Malak, como editor.') && t.includes('convite=editor123'), t);
  await p.waitForSelector('[data-copy="ABCD1234"]');
  t = await copia('[data-copy="ABCD1234"]');
  confere('código: convite para testar o app que salva músicos', /^Olá! Você foi convidado por Lucas Malak para testar o salvetheapp, o app que salva músicos\./.test(t) && t.includes('código de acesso: ABCD1234') && t.includes(url.replace(/\/$/, '')), t);
  if (process.env.FOTOS) { fs.mkdirSync(process.env.FOTOS, { recursive: true }); await p.screenshot({ path: path.join(process.env.FOTOS, 'convite.png') }); }

  await abre({ uid: 'u', email: 'malak@exemplo.com' });
  t = await copia('[data-inv="musico"]');
  confere('sem nome na conta usa o começo do e-mail', t.includes('por malak.'), t);
  confere('sem erros de JavaScript', !erros.length, erros.join(' | '));
  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falharam`); process.exit(falhas.length ? 1 : 0);
})();
