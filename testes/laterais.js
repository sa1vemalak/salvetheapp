// Teste das laterais (rápido, sem Firebase): menu à esquerda, ferramentas à direita, partitura no centro.
// Confere na tela larga (iPad deitado) e na estreita (celular): abrir e fechar as laterais, escolher música e parte,
// o player no lugar certo, os avisos do Malak/Mestrinho/Caio com "Ok" e o botão Ensaio que guarda os avisos.
//   node testes/laterais.js            (FOTOS=pasta para salvar prints, VIDEO=pasta para gravar)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json', '.wasm': 'application/wasm' };
const PDF = (() => {  // uma página A4 com pautas desenhadas, só para a partitura não ficar em branco
  let c = '0.1 w\n';
  for (let s = 0; s < 10; s++) for (let l = 0; l < 5; l++) { const y = 760 - s * 72 - l * 6; c += `50 ${y} m 545 ${y} l S\n`; }
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>', `<< /Length ${c.length} >>\nstream\n${c}endstream`];
  let t = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(t.length); t += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = t.length; t += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  return Buffer.from(t + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`);
})();
const srv = http.createServer((req, res) => {
  if (req.url.startsWith('/pagina.pdf')) { res.writeHead(200, { 'Content-Type': 'application/pdf' }); return res.end(PDF); }
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { S, setSongs, Avisos, Laterais, panes };\nboot();\n})();');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});

const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };
const FOTOS = process.env.FOTOS, VIDEO = process.env.VIDEO;
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });

// finge uma banda com 6 músicas, um robô que terminou, outro trabalhando e uma proposta esperando o dono
async function banda(p) {
  await p.evaluate(() => {
    const { S, setSongs } = window.__t, agora = Date.now();
    localStorage.clear();
    const partes = [['trumpet', 'Trompete'], ['tenor-sax', 'Sax Tenor'], ['trombone', 'Trombone'], ['base', 'Base']].map(([key, name]) => ({ key, name, src: '/pagina.pdf' }));
    const jobs = [{ id: 'j1', song: 'era', tipo: 'audio', status: 'pronto', criadoEm: agora - 6e5, atualizado: agora - 6e4 },
      { id: 'j2', song: 'paris', tipo: 'arranjo', status: 'rodando', progresso: 40, criadoEm: agora - 3e5, atualizado: agora - 1e4 }];
    const props = [{ id: 'p1', status: 'aberta', autor: 'lu', nome: 'Lu', musica: 'ceu', parte: 'trumpet', criadoEm: agora - 1e5 }];
    const col = nome => ({ onSnapshot: cb => { setTimeout(() => cb({ docs: (nome === 'jobs' ? jobs : nome === 'propostas' ? props : []).map(d => ({ id: d.id, data: () => d })), docChanges: () => [], metadata: {} }), 0); return () => {}; },
      where() { return this; }, doc: () => ({ get: async () => ({ data: () => null, exists: false }), set: async () => {}, update: async () => {} }) });
    window.SALVE = Object.assign(window.SALVE || {}, { ctx: () => ({ band: 'b', show: 's', role: 'dono', user: { uid: 'u' }, order: [] }) });
    S.canWrite = true; S.uid = 'u'; S.db = { collection: col };
    setSongs(['Céu Azul', 'Teu Popô', 'Era uma Vez', 'Paris', 'Sobre Nós', 'Capricorniana'].map((title, i) =>
      ({ id: ['ceu', 'popo', 'era', 'paris', 'sobre', 'capri'][i], title, order: i + 1, parts: partes })));
    document.querySelectorAll('.gate').forEach(g => g.remove());  // a tela de entrar (sem Firebase aqui)
    document.querySelector('#home').hidden = true; document.body.classList.remove('at-home');
    const sel = document.querySelector('#song'); sel.value = 'ceu'; sel.dispatchEvent(new Event('change'));
  });
  await p.waitForTimeout(900);
}
const foto = async (p, nome) => { if (FOTOS) await p.screenshot({ path: path.join(FOTOS, nome + '.png') }); };
const caixa = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), vis: getComputedStyle(e).visibility }; });

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const erros = [];

  console.log('Tela larga (iPad deitado)');
  let ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, colorScheme: 'dark', ...(VIDEO ? { recordVideo: { dir: path.join(VIDEO, 'ipad'), size: { width: 1180, height: 820 } } } : {}) });
  let p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.message));
  await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 }); await banda(p);
  let L = await caixa(p, '#sideL'), R = await caixa(p, '#sideR'), C = await caixa(p, '#stage');
  confere('menu à esquerda, ferramentas à direita e a partitura no meio', L.x === 0 && L.w > 200 && R.x > C.x && C.x >= L.w - 1, JSON.stringify({ L, C, R }));
  confere('a setlist aparece no menu, com a música aberta marcada', await p.$eval('#sideSongs', e => e.children.length === 6 && e.querySelector('[aria-current=true]')?.textContent.includes('Céu Azul')));
  confere('"Minha parte" fica no menu (e não em cima da partitura)', await p.$$eval('#sideParts .chip', x => x.length) >= 4 && await p.$eval('.pane .panehead .chips', e => getComputedStyle(e).display === 'none'));
  confere('player fica nas ferramentas', await p.$eval('#player', e => !!e.closest('#sideR')));
  const avisos = await p.$$eval('#avisosList .aviso', xs => xs.map(x => x.innerText.replace(/\s+/g, ' ')));
  confere('avisos do Malak, do Mestrinho e da proposta', avisos.length === 3 && avisos.some(t => /Malak.*Era uma Vez.*pronto/.test(t)) && avisos.some(t => /Mestrinho.*Paris.*40%/.test(t)) && avisos.some(t => /proposta/.test(t)), JSON.stringify(avisos));
  await foto(p, 'ipad-1-laterais');
  await p.click('#sideSongs .side-song:nth-child(3)'); await p.waitForTimeout(500);
  confere('tocar numa música do menu abre a música', await p.$eval('#song', e => e.value) === 'era');
  await p.click('#sideParts .chip:nth-child(3)'); await p.waitForTimeout(500);
  confere('tocar numa parte do menu abre a parte', await p.evaluate(() => window.__t.panes[0].part) === 'trombone');
  await p.click('#playerBtn'); await p.waitForTimeout(400); await foto(p, 'ipad-2-ouvir');
  await p.click('#avisosList .aviso:first-child .ok'); await p.waitForTimeout(600);
  confere('"Ok" tira o aviso', await p.$$eval('#avisosList .aviso', x => x.length) === 2);
  await p.click('#ensaioBtn'); await p.waitForTimeout(1100);
  confere('Ensaio guarda os avisos e mostra só o número', await p.$$eval('#avisosList .aviso', x => x.length) === 0 && await p.$eval('#ensaioBadge', e => !e.hidden && e.textContent === '2'));
  await foto(p, 'ipad-3-ensaio');
  await p.click('#ensaioBtn'); await p.waitForTimeout(1100);
  confere('desligar o Ensaio traz os avisos de volta', await p.$$eval('#avisosList .aviso', x => x.length) === 2);
  await p.click('#sideLClose'); await p.click('#sideRClose'); await p.waitForTimeout(900);
  L = await caixa(p, '#sideL'); R = await caixa(p, '#sideR'); C = await caixa(p, '#stage');
  confere('fechando as duas, a partitura fica com a tela toda', L.w === 0 && R.w === 0 && C.w === 1180, JSON.stringify({ L, C, R }));
  await foto(p, 'ipad-4-centro-livre');
  await p.reload(); await p.waitForFunction(() => window.__t, null, { timeout: 15000 }); await p.waitForTimeout(700);
  await p.evaluate(() => { document.querySelectorAll('.gate').forEach(g => g.remove()); document.querySelector('#home').hidden = true; document.body.classList.remove('at-home'); });
  confere('o app lembra as laterais fechadas', (await caixa(p, '#sideL')).w === 0 && (await caixa(p, '#sideR')).w === 0);
  await p.click('#sideLBtn'); await p.click('#sideRBtn'); await p.waitForTimeout(700);
  confere('os botões do topo abrem as laterais de novo', (await caixa(p, '#sideL')).w > 200 && (await caixa(p, '#sideR')).w > 200);
  await p.click('#readBtn'); await p.waitForTimeout(500);
  confere('tela cheia esconde as laterais', await p.$eval('#sideL', e => getComputedStyle(e).display === 'none'));
  await ctx.close();

  console.log('Tela estreita (celular)');
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', ...(VIDEO ? { recordVideo: { dir: path.join(VIDEO, 'celular'), size: { width: 390, height: 844 } } } : {}) });
  p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.message));
  await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 }); await banda(p);
  C = await caixa(p, '#stage');
  confere('no celular a partitura usa a largura toda e as gavetas ficam fechadas', C.w === 390 && (await caixa(p, '#sideL')).vis === 'hidden' && (await caixa(p, '#sideR')).vis === 'hidden', JSON.stringify(C));
  confere('no celular o player fica em cima da partitura', await p.$eval('#player', e => e.parentElement.classList.contains('center')));
  await foto(p, 'celular-1-partitura');
  await p.click('#sideLBtn'); await p.waitForTimeout(600);
  confere('o botão do menu abre a gaveta da esquerda', (await caixa(p, '#sideL')).x === 0 && (await caixa(p, '#sideL')).vis === 'visible');
  await foto(p, 'celular-2-menu');
  await p.click('#sideSongs .side-song:nth-child(4)'); await p.waitForTimeout(600);
  confere('escolher a música fecha a gaveta', await p.$eval('#song', e => e.value) === 'paris' && !(await p.evaluate(() => document.body.classList.contains('abreL'))));
  await p.click('#sideRBtn'); await p.waitForTimeout(600); await foto(p, 'celular-3-ferramentas');
  confere('o botão das ferramentas abre a gaveta da direita', (await caixa(p, '#sideR')).vis === 'visible');
  await p.click('#sideScrim', { position: { x: 20, y: 400 } }); await p.waitForTimeout(500);
  confere('tocar fora fecha a gaveta', !(await p.evaluate(() => document.body.classList.contains('abreR'))));
  await p.click('#sideRBtn'); await p.waitForTimeout(500); await p.click('#playerBtn'); await p.waitForTimeout(600);
  confere('Ouvir fecha a gaveta e mostra o player em cima da partitura', !(await p.evaluate(() => document.body.classList.contains('abreR'))) && await p.$eval('#player', e => !e.hidden));
  await foto(p, 'celular-4-ouvir');
  await ctx.close();

  console.log('Página');
  confere('nenhum erro de JavaScript', !erros.length, erros.join(' | '));
  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falharam`); process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
