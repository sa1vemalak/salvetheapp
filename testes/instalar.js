// Teste do "Instalar o app" (rápido, sem Firebase): no celular e no tablet aparece o botão com o passo a passo para pôr o
// app na tela de início (iPhone, iPad, Android); no computador e quando já abriu pelo ícone, não aparece nada.
//   node testes/instalar.js            (FOTOS=pasta para salvar os prints)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
const srv = http.createServer((req, res) => {
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { Band, S, Home, Instalar };\nboot();\n})();');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };
const FOTOS = process.env.FOTOS; if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });
const IPAD_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(), erros = [];
  async function abre(nome, ctxOpts, init) {
    const ctx = await b.newContext(ctxOpts);
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(nome + ': ' + e.stack));
    await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 });
    // tela inicial sem login (sem Firebase aqui)
    await p.evaluate(() => { document.querySelectorAll('.modal,.scrim,.gate').forEach(x => x.remove()); document.body.classList.add('at-home'); document.getElementById('home').hidden = false; });
    await p.waitForTimeout(200);
    return { p, ctx };
  }
  const visivel = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0);
  const titulo = p => p.$eval('.modal.inst h3', e => e.textContent);
  const passos = p => p.$$eval('.modal.inst .gsteps h5', l => l.map(e => e.textContent.trim()));

  console.log('Computador');
  let { p, ctx } = await abre('pc', { viewport: { width: 1280, height: 800 } });
  confere('no computador o botão não aparece', !(await visivel(p, '#instalarBtn')));
  confere('no computador o item do menu não aparece', !(await visivel(p, '#instalarSide')));
  confere('o manifest tem nome, ícones e tela cheia', await p.evaluate(async () => { const m = await (await fetch('manifest.webmanifest')).json();
    return m.display === 'standalone' && m.name && m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable'); }));
  for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'])
    confere('ícone existe: ' + f, await p.evaluate(async f => (await fetch(f)).ok, f));
  await ctx.close();

  console.log('iPhone (Safari)');
  ({ p, ctx } = await abre('iphone', { ...devices['iPhone 13'] }));
  confere('no iPhone o botão aparece', await visivel(p, '#instalarBtn'));
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'iphone-1-botao.png') });
  await p.click('#instalarBtn'); await p.waitForSelector('.modal.inst');
  confere('título fala do iPhone', /iPhone/.test(await titulo(p)), await titulo(p));
  let ps = await passos(p);
  confere('passos: Compartilhar, Adicionar à Tela de Início, Adicionar, abrir pelo ícone', /Compartilhar/.test(ps[0]) && /Adicionar à Tela de Início/.test(ps[1]) && /Adicionar/.test(ps[2]) && /ícone/.test(ps[3]), ps.join(' | '));
  confere('avisa que entra de novo com e-mail e senha', (await p.textContent('.modal.inst')).includes('e-mail e senha'));
  confere('Compartilhar fica na barra de baixo', (await p.textContent('.modal.inst')).includes('na barra de baixo'));
  confere('a janela cabe na tela', await p.$eval('.modal.inst', e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && e.scrollWidth <= e.clientWidth + 1; }));
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'iphone-2-passos.png') });
  await p.click('#iSis [data-k="android"]');
  confere('trocar para Android mostra os três pontinhos', /três pontinhos/.test((await passos(p))[0]));
  await p.click('#iDepois');
  confere('"Agora não" esconde o botão flutuante', !(await visivel(p, '#instalarBtn')));
  confere('o item do menu continua lá', await p.evaluate(() => document.body.classList.contains('pode-instalar')));
  await p.reload(); await p.waitForFunction(() => window.__t);
  await p.evaluate(() => { document.querySelectorAll('.gate').forEach(x => x.remove()); document.body.classList.add('at-home'); });
  confere('"Agora não" vale depois de abrir de novo', !(await visivel(p, '#instalarBtn')));
  await ctx.close();

  console.log('iPhone já instalado (aberto pelo ícone)');
  ({ p, ctx } = await abre('iphone-inst', { ...devices['iPhone 13'] }, () => Object.defineProperty(navigator, 'standalone', { get: () => true })));
  confere('aberto pelo ícone não mostra nada', !(await visivel(p, '#instalarBtn')) && !(await p.evaluate(() => document.body.classList.contains('pode-instalar'))));
  await ctx.close();

  console.log('iPad (Safari se passa por Mac)');
  ({ p, ctx } = await abre('ipad', { viewport: { width: 1180, height: 820 }, userAgent: IPAD_UA, hasTouch: true, isMobile: false },
    () => { Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' }); Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 }); }));
  confere('no iPad o botão aparece', await visivel(p, '#instalarBtn'));
  await p.click('#instalarBtn'); await p.waitForSelector('.modal.inst');
  confere('título fala do iPad', /iPad/.test(await titulo(p)), await titulo(p));
  confere('Compartilhar fica no alto, à direita', (await p.textContent('.modal.inst')).includes('no alto, à direita'));
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'ipad-passos.png') });
  await ctx.close();
  console.log('Mac de verdade (sem toque)');
  ({ p, ctx } = await abre('mac', { viewport: { width: 1440, height: 900 }, userAgent: IPAD_UA }, () => Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' })));
  confere('no Mac não aparece', !(await visivel(p, '#instalarBtn')));
  await ctx.close();

  console.log('Android (Chrome)');
  ({ p, ctx } = await abre('android', { ...devices['Pixel 7'] }));
  confere('no Android o botão aparece', await visivel(p, '#instalarBtn'));
  await p.click('#instalarBtn'); await p.waitForSelector('.modal.inst');
  ps = await passos(p);
  confere('passos: três pontinhos, Instalar app, Instalar, ícone', /três pontinhos/.test(ps[0]) && /Instalar app/.test(ps[1]) && /Instalar/.test(ps[2]) && /ícone/.test(ps[3]), ps.join(' | '));
  confere('no Android não pede login de novo', !(await p.textContent('.modal.inst')).includes('e-mail e senha'));
  // o Chrome oferece instalar: aparece "Instalar agora" e ele abre o pedido do Chrome
  await p.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => { window.__pediu = true; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(e); });
  await p.waitForSelector('#iAgora');
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'android-instalar-agora.png') });
  await p.click('#iAgora'); await p.waitForTimeout(200);
  confere('"Instalar agora" chama o Chrome e fecha a janela', await p.evaluate(() => window.__pediu === true && !document.querySelector('.modal.inst')));
  await ctx.close();

  console.log('Android, dentro do Instagram');
  ({ p, ctx } = await abre('insta', { ...devices['Pixel 7'], userAgent: devices['Pixel 7'].userAgent.replace(')', '; wv)') + ' Instagram 300.0' }));
  await p.click('#instalarBtn'); await p.waitForSelector('.modal.inst');
  confere('pede para abrir no navegador primeiro', /navegador/.test(await titulo(p)) && !!(await p.$('#iCopia')));
  await ctx.close();

  confere('nenhum erro de JavaScript', !erros.length, erros.join(' | '));
  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falharam`); process.exit(falhas.length ? 1 : 0);
})();
