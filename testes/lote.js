// Teste do "Enviar várias partituras de uma vez" (rápido, sem Firebase): escolhe 13 arquivos de 7 músicas (PDFs com texto,
// grade, PDF escaneado, MusicXML, MuseScore, .zip com pasta, gravação), confere o que o app descobriu sozinho (música,
// instrumento, versão), corrige pelo resumo e salva; confere o que foi gravado no banco e os pedidos ao Malak.
//   node testes/lote.js            (precisa do reportlab no Python; FOTOS=pasta para salvar os prints)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json', '.wasm': 'application/wasm' };
const srv = http.createServer((req, res) => {
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { Band, S, Lote2 };\nboot();\n})();');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + JSON.stringify(extra) : '')); } };

const PASTA = fs.mkdtempSync(path.join(os.tmpdir(), 'lote-'));
execFileSync('python3', [path.join(__dirname, 'lote_arquivos.py'), PASTA]);
// os nomes vão como no aparelho (com acento); o Playwright recebe o conteúdo direto
const MIME = { pdf: 'application/pdf', zip: 'application/zip', mp3: 'audio/mpeg' };
const ARQS = fs.readdirSync(PASTA).map(n => ({ name: n.normalize('NFC'), mimeType: MIME[n.split('.').pop()] || '', buffer: fs.readFileSync(path.join(PASTA, n)) }));

/* a estante da banda antes do envio: Teu Popô já tem a base e o trompete, Céu Azul só tem a grade, Sobre Nós só o trompete */
const ESTANTE = [
  { id: 'teu-popo', title: 'Teu Popô', order: 1, parts: [{ key: 'base', name: 'Base', src: 'x' }, { key: 'trumpet', name: 'Trompete (B♭)', src: 'x' }], fontes: [] },
  { id: 'ceu-azul', title: 'Céu Azul', order: 2, parts: [{ key: 'grade', name: 'Grade', src: 'x' }], fontes: [] },
  { id: 'sobre-nos', title: 'Sobre Nós', order: 3, parts: [{ key: 'trumpet', name: 'Trompete (B♭)', src: 'x' }], fontes: [] },
];

/* músicas da banda que estão em outro show (não aparecem na estante aberta): Melhor Forma é a mesma música;
   o id "capricorniana" já é de outra música (renomeada), então a nova não pode cair por cima dela */
const BIBLIOTECA = {
  'melhor-forma': { title: 'Melhor Forma', parts: [{ key: 'base', name: 'Base', src: 'x' }], fontes: [] },
  capricorniana: { title: 'Capricorniana (versão antiga, show de 2023)', parts: [{ key: 'grade', name: 'Grade', src: 'x' }], fontes: [] },
};
async function prepara(p) {
  await p.evaluate(([ESTANTE, BIBLIOTECA]) => {
    document.querySelectorAll('.modal,.scrim,.gate').forEach(x => x.remove());
    const w = window.__w = { docs: [], jobs: [], uploads: [], show: null };
    window.SALVE = Object.assign(window.SALVE || {}, {
      ctx: () => ({ band: 'b', show: 's', role: 'dono', bandName: 'Banda Teste', user: { uid: 'u' }, order: ESTANTE.map(s => s.id) }),
      saveShow: async (show, d) => { w.show = d; },
    });
    const S = window.__t.S;
    S.songs = JSON.parse(JSON.stringify(ESTANTE)); S.canWrite = true;
    S.assets = { upload: async (f, o) => { o && o.onProgress && o.onProgress(1); w.uploads.push({ name: f.name, type: (o && o.type) || f.type, size: f.size }); return { url: 'https://x/' + f.name, id: 'bands/b/arquivos/' + f.name }; } };
    const col = name => ({
      doc: id => ({ set: async d => { (name === 'jobs' ? w.jobs : w.docs).push({ name, id, d: JSON.parse(JSON.stringify(d)) }); },
        get: async () => { const d = name === 'songs' && BIBLIOTECA[id]; return { exists: !!d, data: () => d || {} }; }, update: async () => {} }),
      onSnapshot: () => () => {}, get: async () => ({ docs: [] }), add: async () => {}, where() { return this; }, orderBy() { return this; }, limit() { return this; },
    });
    S.db = { collection: col };
  }, [ESTANTE, BIBLIOTECA]);
}
const grupos = p => p.$$eval('.lote-g', gs => gs.map(g => ({
  titulo: g.querySelector('.lote-tit').value, chip: g.querySelector('.lote-chip').textContent,
  itens: [...g.querySelectorAll('.lote-i')].map(li => ({ nome: li.querySelector('.lote-arq b').textContent, parte: (li.querySelector('.lote-parte') || {}).value, ph: (li.querySelector('.lote-parte') || {}).placeholder,
    marcado: li.querySelector('.lote-ok input').checked, sit: li.querySelector('.lote-arq small').textContent, conf: !!li.querySelector('.lote-conf'), orig: (li.querySelector('.lote-orig') || {}).textContent })),
})));

/* nomes de arquivo e de instrumento (sem navegador): o que o app descobre sozinho */
function nomes() {
  console.log('nomes de arquivo');
  require(path.join(APP, 'lote.js')); const L = globalThis.Lote;
  const casos = [
    ['Paris - Trumpet in Bb.pdf', 'Paris', 'trumpet'], ['Paris - GRADE.pdf', 'Paris', 'grade'], ['06 Céu Azul - Trompete.pdf', 'Céu Azul', 'trumpet'],
    ['Teu Popô - Partitura inteira.pdf', 'Teu Popô', 'grade'], ['10 Anos de Estrada - Base.pdf', '10 Anos de Estrada', 'base'],
    ['Capricorniana - Part 1.pdf', 'Capricorniana', null], ['Bossa Nova - Sax Alto.pdf', 'Bossa Nova', 'alto-sax'],
    ['As Rosas Não Falam - Trompete.pdf', 'As Rosas Não Falam', 'trumpet'], ['Alto Astral - Trombone.pdf', 'Alto Astral', 'trombone'],
    ['Canto de Ossanha.pdf', 'Canto de Ossanha', null], ['CEU AZUL TPT.pdf', 'CEU AZUL', 'trumpet'], ['ceu_azul_trompete_v3.pdf', 'ceu azul', 'trumpet'],
    ['Céu Azul (Trompete).pdf', 'Céu Azul', 'trumpet'], ['Céu Azul - Trompete em Sib - final.pdf', 'Céu Azul', 'trumpet'],
    ['Paris - Trompete (1).pdf', 'Paris', 'trumpet'], ['Paris-Tenor Trombone.pdf', 'Paris', 'trombone'], ['Teu Popô_Pno.pdf', 'Teu Popô', 'base'],
    ['Teu Popô - Horn Section.pdf', 'Teu Popô', 'grade'], ['Melhor Forma - Electric Bass.pdf', 'Melhor Forma', 'baixo'], ['Melhor Forma - Drumset.pdf', 'Melhor Forma', 'bateria'],
    ['Metais - Teu Popô - Saxofone tenor - 2024-03-15 0930.sib', 'Teu Popô', 'tenor-sax'], ['Paris - 2º Trompete.pdf', 'Paris', 'trumpet-2'],
    ['documento.pdf', '', null], ['IMG_2034.pdf', '', null], ['#3 Céu Azul - Trombone.pdf', 'Céu Azul', 'trombone'],
  ];
  for (const [f, t, k] of casos) { const r = L.doNome(f); confere(`${f} -> ${t || '(sem nome)'} / ${k || '(sem instrumento)'}`, r.titulo === t && (r.parte ? r.parte.key : null) === k, [r.titulo, r.parte && r.parte.key]); }
  const inst = { 'Tenor Trombone': 'trombone', 'Bass Trombone': 'trombone', 'Baritone Sax': 'bari-sax', 'T. Sx.': 'tenor-sax', 'Sax Ten.': 'tenor-sax', 'A. Sax': 'alto-sax',
    'Pno.': 'base', 'E.Pno': 'base', 'Chord Chart': 'base', 'El. Bass': 'baixo', 'Drum Set': 'bateria', 'Bass Drum': 'bateria', 'Horns in F': 'trompa',
    'Horn Section': 'metais', 'Flgh.': 'trumpet', '2nd Trumpet in Bb': 'trumpet-2', 'Canto de Ossanha': null, 'Alto Astral': null, 'As Rosas': null };
  for (const [t, k] of Object.entries(inst)) { const r = L.instrumento(t); confere(`instrumento "${t}" -> ${k}`, (r ? r.key : null) === k, r); }
  const pg = a => L.doTexto(a.map(([t, size, x, y, w]) => ({ t, size, x, y, w: w || 0.2 })));
  let r = pg([['Harmonia', 0.035, 0.4, 0.06], ['Trumpet in Bb', 0.015, 0.05, 0.04], ['Cm7', 0.013, 0.2, 0.3], ['mf', 0.013, 0.2, 0.5]]);
  confere('título "Harmonia" (palavra de instrumento) continua título; a parte é o trompete', r.titulo === 'Harmonia' && r.parte.key === 'trumpet', r);
  r = pg([['Paris', 0.035, 0.4, 0.06], ['Tenor Saxophone', 0.015, 0.05, 0.04], ['Tpt.', 0.009, 0.02, 0.3, 0.03], ['Tbn.', 0.009, 0.02, 0.5, 0.03], ['C7', 0.013, 0.2, 0.5]]);
  confere('parte de sax com deixas do trompete e do trombone não vira grade', r.parte.key === 'tenor-sax', r);
  r = pg([['Paris', 0.035, 0.4, 0.06], ['Base', 0.015, 0.05, 0.04], ['Voz', 0.012, 0.02, 0.3, 0.1], ['Piano', 0.012, 0.02, 0.4, 0.1], ['C7', 0.013, 0.2, 0.5]]);
  confere('base com a voz de guia não vira grade', r.parte.key === 'base', r);
  r = pg([['Paris', 0.035, 0.4, 0.06], ['Trumpet 1', 0.012, 0.02, 0.3, 0.1], ['Trumpet 2', 0.012, 0.02, 0.4, 0.1], ['C7', 0.013, 0.2, 0.5]]);
  confere('dois trompetes na página não viram grade', r.parte.base === 'trumpet', r);
  r = pg([['Paris', 0.035, 0.4, 0.06], ['Trumpet in Bb', 0.012, 0.02, 0.2, 0.1], ['Tenor Sax', 0.012, 0.02, 0.3, 0.1], ['Trombone', 0.012, 0.02, 0.4, 0.1]]);
  confere('três instrumentos na margem: grade', r.parte.key === 'grade', r);
  // nome escrito pela pessoa: não volta para a música parecida da estante
  const est = [{ id: 'paris', title: 'Paris', parts: [{ key: 'trumpet', name: 'Trompete (B♭)' }] }];
  const pal = L.palpite({ nome: 'Paris 2 - Trompete.pdf', tipo: 'pdf', pdf: { semTexto: true } }, est);
  const it = { id: 0, nome: 'Paris 2 - Trompete.pdf', tipo: 'pdf', palpite: pal, titulo: 'Paris 2' };
  const gs = L.organiza([it], est);
  confere('renomear para "Paris 2" não troca o trompete de "Paris"', gs[0].titulo === 'Paris 2' && !gs[0].existente, gs.map(g => [g.titulo, !!g.existente]));
}

(async () => {
  nomes();
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(), erros = [];
  for (const [aparelho, opts] of [['iPad', { viewport: { width: 1180, height: 820 } }], ['celular', devices['iPhone 13']]]) {
    console.log(`\n${aparelho}`);
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.stack)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|firebase|googleapis/i.test(m.text())) erros.push(m.text()); });
    await p.goto(url); await p.waitForFunction(() => window.__t && window.Lote, null, { timeout: 15000 });
    await prepara(p);

    // a entrada: dentro de "Adicionar música"
    await p.evaluate(() => document.querySelector('#addBtn').click());
    await p.waitForSelector('#addLote');
    confere('Adicionar música mostra "Enviar várias partituras de uma vez"', /Enviar várias partituras/.test(await p.textContent('#addLote')));
    await p.click('#addLote');
    await p.waitForSelector('.lote-drop'); await p.waitForTimeout(500);
    if (process.env.FOTOS && aparelho === 'iPad') { fs.mkdirSync(process.env.FOTOS, { recursive: true }); await p.screenshot({ path: path.join(process.env.FOTOS, `${aparelho}-1-escolher.png`) }); }
    await p.setInputFiles('#loteArq', ARQS);
    await p.waitForSelector('.lote-g', { timeout: 30000 });
    let g = await grupos(p);
    const G = t => g.find(x => x.titulo === t) || { itens: [] };
    const I = (t, n) => G(t).itens.find(i => i.nome === n) || {};

    confere('Céu Azul: achou na estante (nome do arquivo minúsculo e sem acento)', G('Céu Azul').chip === 'Já está na estante' && G('Céu Azul').itens.length === 2, G('Céu Azul'));
    confere('Céu Azul: trompete pelo texto do PDF', I('Céu Azul', 'Céu Azul - Trumpet in Bb.pdf').parte === 'Trompete (B♭)');
    confere('Céu Azul: o sax é o tenor (escrito na partitura, o arquivo só diz "sax")', I('Céu Azul', 'ceu azul sax.pdf').parte === 'Tenor Sax', I('Céu Azul', 'ceu azul sax.pdf'));
    confere('Paris: a grade "Score.pdf" foi achada pelo título da página e pelos 4 instrumentos', I('Paris', 'Score.pdf').parte === 'Grade', G('Paris'));
    confere('Paris: o MusicXML entrou como arquivo original da mesma música', /MusicXML · Grade/.test(I('Paris', 'paris.musicxml').orig || ''), I('Paris', 'paris.musicxml'));
    confere('Nova Canção: "Part 3.pdf" virou trombone de uma música nova', G('Nova Canção').chip === 'Música nova' && I('Nova Canção', 'Part 3.pdf').parte === 'Trombone', G('Nova Canção'));
    const v1 = I('Teu Popô', 'Teu Popô - Base.pdf'), v2 = I('Teu Popô', 'Teu Popô - Base v2.pdf');
    confere('Teu Popô: a base v2 fica marcada como versão nova, a antiga fica de fora', v2.marcado && !v1.marcado && /Versão nova/.test(v2.sit) && /versão 2/.test(v2.sit) && /Outra versão/.test(v1.sit), [v1, v2]);
    confere('Canto de Ossanha: é o nome da música (não "voz") e a parte é o Trompete 2', I('Canto de Ossanha', '06 Canto de Ossanha - Trompete 2.pdf').parte === 'Trompete 2 (B♭)', G('Canto de Ossanha'));
    confere('Sobre Nós (escaneado): pelo nome do arquivo, parte nova trombone, com "Confira"', I('Sobre Nós', 'Sobre Nós - Trombone.pdf').parte === 'Trombone' && I('Sobre Nós', 'Sobre Nós - Trombone.pdf').conf && /Parte nova/.test(I('Sobre Nós', 'Sobre Nós - Trombone.pdf').sit), G('Sobre Nós'));
    confere('Melhor Forma: o .mscz deu o nome da música e o trompete', /MuseScore · Trompete/.test(I('Melhor Forma', 'Melhor Forma.mscz').orig || ''), G('Melhor Forma'));
    confere('Capricorniana: o .zip foi aberto, a pasta deu a música (sem o lixo do Mac)', G('Capricorniana').itens.length === 2 && I('Capricorniana', 'Trompete.pdf').parte === 'Trompete (B♭)' && I('Capricorniana', 'Trombone.pdf').parte === 'Trombone', G('Capricorniana'));
    const sem = g.find(x => !x.titulo);
    confere('documento.pdf (escaneado, sem nome) fica num grupo "Sem nome" e o Salvar espera', sem && sem.itens[0].nome === 'documento.pdf' && await p.$eval('#loteSalva', e => e.disabled), sem);
    confere('a gravação fica de fora, com o motivo', /1 arquivo fica de fora/.test(await p.textContent('.lote-fora summary')) && /Só tenho a gravação/.test(await p.textContent('.lote-fora')));
    if (process.env.FOTOS) {
      await p.screenshot({ path: path.join(process.env.FOTOS, `${aparelho}-2-resumo.png`), fullPage: false });
      await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(process.env.FOTOS, `${aparelho}-2-resumo-tema-claro.png`) });
      await p.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    }

    // correções pelo resumo: dar o nome ao escaneado e dizer que é o Sax Tenor de Paris; trocar o Trompete 2 para Trompete
    let semG = (await p.$$('.lote-g.sem'))[0];
    await (await semG.$('.lote-mover')).selectOption('Paris');
    await p.waitForTimeout(100);
    g = await grupos(p);
    confere('mover o escaneado para Paris', I('Paris', 'documento.pdf').nome === 'documento.pdf' && !g.find(x => !x.titulo), G('Paris'));
    const liDoc = await p.$('.lote-i:has(b:text-is("documento.pdf"))');
    await (await liDoc.$('.lote-parte')).fill('Sax Tenor');
    await (await liDoc.$('.lote-parte')).dispatchEvent('change');
    await p.waitForTimeout(100);
    g = await grupos(p);
    confere('escrever "Sax Tenor" na parte', I('Paris', 'documento.pdf').parte === 'Sax Tenor' && I('Paris', 'documento.pdf').marcado && !I('Paris', 'documento.pdf').conf, I('Paris', 'documento.pdf'));
    // escolher a versão antiga da base desmarca a nova (fica só uma)
    const liV1 = await p.$('.lote-i:has(b:text-is("Teu Popô - Base.pdf")) .lote-ok input');
    await liV1.click(); await p.waitForTimeout(100); g = await grupos(p);
    confere('marcar a base antiga desmarca a v2', I('Teu Popô', 'Teu Popô - Base.pdf').marcado && !I('Teu Popô', 'Teu Popô - Base v2.pdf').marcado);
    await (await p.$('.lote-i:has(b:text-is("Teu Popô - Base v2.pdf")) .lote-ok input')).click(); await p.waitForTimeout(100);
    // renomear a música inteira
    const tit = await p.$('.lote-g:has(.lote-tit[value="Nova Canção"]) .lote-tit');
    await tit.fill('Nova Canção (inédita)'); await tit.dispatchEvent('change'); await p.waitForTimeout(100);
    g = await grupos(p);
    confere('renomear a música pelo cabeçalho', G('Nova Canção (inédita)').itens.length === 1);
    const n = await p.$eval('#loteSalva', e => e.textContent);
    confere('o botão diz quantos arquivos vão', n === 'Salvar 12 arquivos' && !(await p.$eval('#loteSalva', e => e.disabled)), n);
    if (process.env.FOTOS) {
      await p.screenshot({ path: path.join(process.env.FOTOS, `${aparelho}-3-corrigido.png`) });
      await p.$eval('.lote-g:has(.lote-tit[value="Paris"])', e => e.scrollIntoView({ block: 'start' }));
      await p.screenshot({ path: path.join(process.env.FOTOS, `${aparelho}-4-paris.png`) });
    }
    await p.click('#loteSalva');
    await p.waitForFunction(() => !document.querySelector('.modal.lote'), null, { timeout: 15000 });
    const w = await p.evaluate(() => window.__w);
    const doc = id => (w.docs.filter(d => d.name === 'songs' && d.id === id).pop() || {}).d || {};
    const partes = id => (doc(id).parts || []).map(x => x.key + ':' + x.name).sort();
    confere('Teu Popô: a base trocada pela v2, o trompete continua', JSON.stringify(partes('teu-popo')) === JSON.stringify(['base:Base', 'trumpet:Trompete (B♭)']) && doc('teu-popo').parts.find(x => x.key === 'base').src.endsWith('Base v2.pdf'), doc('teu-popo'));
    confere('Céu Azul: grade + trompete + sax tenor', JSON.stringify(partes('ceu-azul')) === JSON.stringify(['grade:Grade', 'tenor-sax:Tenor Sax', 'trumpet:Trompete (B♭)']), partes('ceu-azul'));
    confere('Paris: grade + sax tenor, MusicXML nos originais', JSON.stringify(partes('paris')) === JSON.stringify(['grade:Grade', 'tenor-sax:Sax Tenor']) && (doc('paris').fontes || []).some(f => f.name === 'paris.musicxml'), doc('paris'));
    confere('Sobre Nós: trombone entra junto do trompete', JSON.stringify(partes('sobre-nos')) === JSON.stringify(['trombone:Trombone', 'trumpet:Trompete (B♭)']), partes('sobre-nos'));
    confere('música nova com o nome corrigido', doc('nova-cancao-inedita').title === 'Nova Canção (inédita)' && partes('nova-cancao-inedita')[0] === 'trombone:Trombone', w.docs.map(d => d.id));
    confere('a base antiga não foi enviada, a gravação também não', !w.uploads.some(u => u.name === 'Teu Popô - Base.pdf' || u.name === 'ensaio.mp3') && w.uploads.length === 12, w.uploads.map(u => u.name));
    confere('PDFs enviados como PDF (também os de dentro do .zip)', w.uploads.filter(u => /\.pdf$/.test(u.name)).every(u => u.type === 'application/pdf'));
    const ids = [...new Set(w.jobs.map(j => j.d.song))].sort();
    confere('um pedido ao Malak por música (8)', ids.length === 8 && w.jobs.length === 8 && w.jobs.every(j => j.d.tipo === 'audio' && j.d.status === 'pendente'), ids);
    confere('as músicas novas entram no fim do setlist, de uma vez', w.show && JSON.stringify(w.show.order.slice(3).sort()) === JSON.stringify(['canto-de-ossanha', 'capricorniana-2', 'melhor-forma', 'nova-cancao-inedita', 'paris']), w.show);
    confere('música de outro show (Melhor Forma): o original entra nela, a base dela continua', JSON.stringify(partes('melhor-forma')) === JSON.stringify(['base:Base']) && (doc('melhor-forma').fontes || []).length === 1, doc('melhor-forma'));
    confere('id já usado por outra música: a nova vai para "capricorniana-2" e a antiga fica intacta', !w.docs.some(d => d.id === 'capricorniana') && partes('capricorniana-2').length === 2, w.docs.map(d => d.id));
    confere('sem erros de JavaScript', !erros.length, erros.join(' | ').slice(0, 800));
    erros.length = 0;

    // sem o Malak: desmarcar não cria pedidos
    await prepara(p);
    await p.evaluate(() => window.__t.Lote2.abrir());
    await p.setInputFiles('#loteArq', [ARQS.find(a => a.name === 'Part 3.pdf')]);
    await p.waitForSelector('#loteMalak');
    await p.uncheck('#loteMalak'); await p.click('#loteSalva');
    await p.waitForFunction(() => !document.querySelector('.modal.lote'));
    confere('sem marcar o Malak, nenhum pedido', (await p.evaluate(() => window.__w.jobs.length)) === 0 && (await p.evaluate(() => window.__w.docs.length)) === 1);
    await p.evaluate(() => localStorage.clear());
    // o "Adicionar música" de uma música só continua igual (usa a mesma gravação)
    await prepara(p);
    await p.evaluate(() => document.querySelector('#addBtn').click());
    await p.waitForSelector('#newFiles');
    await p.fill('#newTitle', 'Teu Popô');
    await p.setInputFiles('#newFiles', [ARQS.find(a => a.name === 'Part 3.pdf')]);
    await p.fill('#fileList input', 'Trombone');
    await p.click('#doAdd');
    await p.waitForFunction(() => !document.querySelector('#doAdd'));
    const w1 = await p.evaluate(() => window.__w);
    const d1 = (w1.docs.find(d => d.id === 'teu-popo') || {}).d || {};
    confere('Adicionar música (uma só): parte entra na música que já existe, com pedido ao Malak', (d1.parts || []).map(x => x.key).sort().join() === 'base,trombone,trumpet' && w1.jobs.length === 1 && w1.jobs[0].d.song === 'teu-popo', d1);
    // quem não é editor não abre
    await prepara(p);
    await p.evaluate(() => { window.__t.S.canWrite = false; window.__t.Lote2.abrir(); });
    confere('músico (sem ser editor) não abre o envio', !(await p.$('.modal.lote')));
    await ctx.close();
  }
  await b.close(); srv.close(); fs.rmSync(PASTA, { recursive: true, force: true });
  console.log(`\n${ok} ok, ${falhas.length} falharam`); process.exit(falhas.length ? 1 : 0);
})();
