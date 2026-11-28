// Teste dos guias da DAW e da rede local (rápido, sem Firebase): Ferramentas › Seguir a DAW › passo a passo.
// Confere os passos de cada DAW no Mac e no Windows, o .txt que baixa, e o .zip do modo local (programa + atalhos + dados).
//   node testes/daw.js            (FOTOS=pasta para salvar prints)
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
  if (req.url.startsWith('/local/servidor.js')) { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end(fs.readFileSync(path.join(__dirname, '..', 'modo-local', 'servidor.js'))); }
  if (req.url.startsWith('/pagina.pdf')) { res.writeHead(200, { 'Content-Type': 'application/pdf' }); return res.end(PDF); }
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { S, setSongs, Avisos, Laterais, panes, Guia };\nboot();\n})();');
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
const baixa = async (p, sel) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); const f = await d.path(); return { nome: d.suggestedFilename(), b: fs.readFileSync(f) }; };
const abreDaw = p => p.evaluate(() => document.querySelector('#logicBtn').click());
const passos = p => p.$$eval('.guia .gsteps li h5', xs => xs.map(x => x.textContent));

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const erros = [];

  for (const [nome, vp] of [['ipad', { viewport: { width: 1180, height: 820 } }], ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    console.log(nome === 'ipad' ? 'Tela larga (iPad deitado)' : 'Tela estreita (celular)');
    const ctx = await b.newContext({ ...vp, colorScheme: 'dark', acceptDownloads: true });
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.message));
    await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 }); await banda(p);
    await abreDaw(p); await p.waitForTimeout(500);
    confere('Seguir a DAW mostra os dois guias', await p.$$eval('.gcard', x => x.length) === 2);
    await foto(p, nome + '-1-seguir-a-daw');
    await p.click('#lgGuiaDaw'); await p.waitForTimeout(500);
    let ps = await passos(p);
    confere('guia do Logic no Mac: cabo virtual, Logic, Chrome, iPads, teste', ps[0].includes('Driver IAC') && ps.some(t => /Logic/.test(t)) && ps.some(t => /Chrome/.test(t)) && ps.some(t => /iPads/.test(t)) && ps.some(t => /Teste/.test(t)), JSON.stringify(ps));
    await foto(p, nome + '-2-guia-logic');
    if (nome === 'ipad') {
      let t = await baixa(p, '#gTxt');
      const txt = t.b.toString('utf8');
      confere('o .txt do Logic tem nome e passos certos', t.nome === 'salvetheapp-logic-pro-mac.txt' && /1\. Ligue o cabo MIDI virtual/.test(txt) && /Onde: Arquivo > Ajustes do Projeto/.test(txt) && /Pronto quando:/.test(txt) && !/<b>/.test(txt), t.nome);
      if (FOTOS) fs.writeFileSync(path.join(FOTOS, t.nome), t.b);
      await p.click('#gDaw .chip[data-k=ableton]'); await p.waitForTimeout(200);
      await p.click('#gSys button[data-m="0"]'); await p.waitForTimeout(200);
      ps = await passos(p);
      confere('Ableton no Windows: loopMIDI e Sync na saída', /loopMIDI/.test(ps[0]) && await p.$eval('.guia', e => /Out: loopMIDI Port/.test(e.textContent) && /Options/.test(e.textContent)), JSON.stringify(ps));
      t = await baixa(p, '#gTxt');
      confere('o .txt muda com a DAW e o sistema', t.nome === 'salvetheapp-ableton-live-windows.txt' && /Out: loopMIDI Port/.test(t.b.toString()));
      if (FOTOS) fs.writeFileSync(path.join(FOTOS, t.nome), t.b);
      await p.click('#gDaw .chip[data-k=logic]'); await p.waitForTimeout(200);
      confere('Logic no Windows avisa que só existe no Mac', await p.$eval('.guia', e => /só existe no Mac/.test(e.textContent)));
      for (const k of ['protools', 'cubase', 'studioone', 'reaper', 'bitwig', 'fl', 'outra']) {
        await p.click(`#gDaw .chip[data-k=${k}]`); await p.waitForTimeout(80);
        const n = (await passos(p)).length;
        confere(`guia de ${k} tem os passos`, n >= 6, String(n));
      }
      await p.click('#gSys button[data-m="1"]');
    }
    await p.click('#gBack'); await p.waitForTimeout(500);
    confere('Voltar reabre Seguir a DAW', await p.$$eval('.gcard', x => x.length) === 2 && !(await p.$('.guia')));
    await p.click('#lgGuiaRede'); await p.waitForTimeout(500);
    ps = await passos(p);
    confere('guia da rede local: em casa e no show', ps.length >= 9 && ps.some(t => /Node\.js/.test(t)) && ps.some(t => /roteador/.test(t)) && ps.some(t => /endereço/.test(t)), JSON.stringify(ps));
    await foto(p, nome + '-3-guia-rede');
    await p.evaluate(() => document.querySelector('.guia').scrollTop = 99999); await p.waitForTimeout(200);
    await foto(p, nome + '-4-guia-rede-fim');
    if (nome === 'ipad') {
      const t = await baixa(p, '#gKit');
      const z = path.join(require('os').tmpdir(), 'kit-' + Date.now() + '.zip'); fs.writeFileSync(z, t.b);
      const lista = require('child_process').execFileSync('python3', ['-c', `import zipfile,sys,json;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(json.dumps({i.filename:oct(i.external_attr>>16) for i in z.infolist()}))`, z]).toString();
      const L = JSON.parse(lista);
      confere('o .zip tem programa, atalhos de Mac e Windows, dados e leia-me', t.nome === 'salvetheapp-modo-local.zip' && ['servidor.js', 'Abrir salvetheapp.command', 'Atualizar salvetheapp.command', 'Abrir salvetheapp.bat', 'Atualizar salvetheapp.bat', 'dados.json', 'LEIA-ME.txt'].every(f => L['salvetheapp-modo-local/' + f]), lista);
      confere('os atalhos do Mac abrem com dois cliques (permissão de executar)', L['salvetheapp-modo-local/Abrir salvetheapp.command'] === '0o100755', lista);
      require('child_process').execFileSync('python3', ['-c', 'import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', z, z + '.d']);
      const dir = z + '.d/salvetheapp-modo-local/';
      confere('o servidor.js do .zip é o do repositório', fs.readFileSync(dir + 'servidor.js', 'utf8') === fs.readFileSync(path.join(__dirname, '..', 'modo-local', 'servidor.js'), 'utf8'));
      const sh = require('child_process').spawnSync('bash', ['-n', dir + 'Atualizar salvetheapp.command']);
      confere('o atalho do Mac é um script válido', sh.status === 0, String(sh.stderr));
      if (FOTOS) fs.writeFileSync(path.join(FOTOS, 'LEIA-ME-rede-local.txt'), fs.readFileSync(dir + 'LEIA-ME.txt'));
    }
    await ctx.close();
  }

  console.log('Página');
  confere('nenhum erro de JavaScript', !erros.length, erros.join(' | '));
  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falharam`); process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
