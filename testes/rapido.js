// Teste RÁPIDO do app (uns 10-20 s): abre o app daqui do repositório num navegador, sem internet do Firebase nem
// conta de teste, e confere o essencial. É o teste de todo dia; o teste completo (FULL) usa os outros arquivos desta
// pasta, com conta de teste e os robôs de verdade.
//   node testes/rapido.js
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json', '.wasm': 'application/wasm' };
// tons de teste (1 s, estéreo): cada "instrumento" é uma senoide de frequência diferente
const tom = hz => { const sr = 44100, n = sr, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { const v = Math.round(Math.sin(2 * Math.PI * hz * i / sr) * 0.2 * 32767); b.writeInt16LE(v, 44 + i * 4); b.writeInt16LE(v, 46 + i * 4); }
  return b; };
const TONS = { a: tom(220), b: tom(330), c: tom(440), d: tom(550) };
const srv = http.createServer((req, res) => {
  const t = req.url.match(/^\/tom-(\w)\.wav/); if (t) { res.writeHead(200, { 'Content-Type': 'audio/wav' }); return res.end(TONS[t[1]]); }
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  // só no teste: deixa o teste ver o estado do app, que fica guardado dentro de uma função fechada
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { S, Robo, Caio };\nboot();\n})();')
    .replace('  function applyMix(keep = true) {', '  window.__mix = () => ({ P, applyMix, mixKey, feito, audio });\n  function applyMix(keep = true) {');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});

const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1180, height: 820 } })).newPage();
  const erros = []; p.on('pageerror', e => { erros.push(e.message); if (process.env.PILHA) console.log(e.stack); });
  await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 });

  console.log('Tela e botões');
  confere('botão Editar existe', await p.$('#editScoreBtn'));
  confere('botão Editar com o Caio existe', await p.$('#editCaioBtn'));
  confere('item Refazer o áudio de estudo existe', await p.$('#regenBtn'));

  // finge uma banda: editor, uma música aberta, e o servidor do Caio respondendo uma proposta
  const r = await p.evaluate(async () => {
    const { S, Robo } = window.__t, out = {};
    S.canWrite = true; S.db = { collection: () => ({ onSnapshot: () => () => {} }) };
    S.songs = [{ id: 'teste', title: 'Música Teste', parts: [] }]; S.songId = 'teste';
    window.SALVE.ctx = () => ({ band: 'b', show: 's', user: { uid: 'u' }, order: ['teste'] }); window.SALVE.token = async () => 'x';
    let pedido = null;
    const fetch0 = window.fetch; window.fetch = async (u, o) => { if (!String(u).includes('agente')) return fetch0(u, o); pedido = JSON.parse(o.body); return new Response(JSON.stringify({ texto: 'O trompete fica mais suave no começo.', podeAplicar: true,
      proposta: { resumo: 'Trompete mais suave', mudancas: [{ tipo: 'corrigir_notas', musica: 'teste', parte: 'trumpet', compasso: 1, notas: 'D5:4', descricao: 'trompete mais suave do compasso 1 ao 8' }] } }), { status: 200 }); };
    document.querySelector('#editCaioBtn').click();
    const d = document.querySelector('.drawer.caio');
    out.titulo = d?.querySelector('h3')?.textContent;
    out.dicas = d?.querySelectorAll('.caio-hints button').length;
    d.querySelector('#caioTxt').value = 'deixa o trompete mais baixinho no começo';
    d.querySelector('#caioGo').click();
    for (let i = 0; i < 50 && !d.querySelector('.caio-prop'); i++) await new Promise(r => setTimeout(r, 50));
    out.pedido = pedido;
    out.proposta = d.querySelector('.caio-prop label')?.innerText || '';
    out.botaoAplicar = !!d.querySelector('.caio-prop .btn.primary');
    d.querySelector('#caioX').click();
    // refazer áudio de música já conferida
    const box = document.querySelector('#pMsg'), song = S.songs[0], data = { conferido: true, bpm: 100, mixes: {} };
    Robo.paint(song, box, data); document.querySelector('#regenBtn').click();
    out.refazer = [...box.querySelectorAll('button')].map(x => x.innerText);
    // músico (sem permissão) não edita com o Caio
    S.canWrite = false; document.querySelector('#editCaioBtn').click();
    out.musicoAbriu = !!document.querySelector('.drawer.caio');
    return out;
  });

  console.log('Editar com o Caio');
  confere('abre com o título "Editar com o Caio"', r.titulo === 'Editar com o Caio', r.titulo);
  confere('mostra exemplos em linguagem simples', r.dicas >= 3, r.dicas);
  confere('manda para o servidor modo editar e a música aberta', r.pedido?.modo === 'editar' && r.pedido?.musica === 'teste', JSON.stringify(r.pedido));
  confere('mostra a proposta em palavras simples, sem código de notas', /mais suave/.test(r.proposta) && !/D5:4/.test(r.proposta), r.proposta);
  confere('tem botão Aplicar (nada vale sem aprovar)', r.botaoAplicar);
  confere('músico sem permissão não abre', !r.musicoAbriu);
  console.log('Refazer o áudio');
  confere('mostra Gerar de novo e Cancelar', r.refazer.includes('Gerar de novo') && r.refazer.includes('Cancelar'), JSON.stringify(r.refazer));
  // Caio acrescenta um instrumento numa música que já tem partitura (ex.: sax alto), sem recriar a partitura
  const np = await p.evaluate(() => {
    const P0 = Partitura.blank({ titulo: 't', instrumentos: ['trompete', 'sax-tenor', 'trombone', 'base'], formula: '4/4', fifths: -1, compassos: 8, bpm: 90 });
    const P = new Partitura(P0);
    P.setTokens(1, 1, 'G4:1 A4:1 B4:2'); P.setTokens(1, 3, 'D5:4~'); P.setTokens(1, 4, 'D5:2 R:2');
    const r = P.addPart('sax-alto', { copiarDe: 1, antes: 1 });
    const Q = new Partitura(P.toString());
    return { nomes: Q.parts().map(x => x.name), pi: r.pi, copiados: r.copiados, compassos: Q.measures(r.pi).length,
      tom: Q.context(r.pi, 1).fifths, c1: Q.tokens(r.pi, 1), c3: Q.tokens(r.pi, 3), c2: Q.tokens(r.pi, 2), tenor: Q.tokens(2, 1),
      escreve: (() => { Q.setTokens(r.pi, 5, 'A4:4'); return Q.tokens(r.pi, 5); })() };
  });
  console.log('Caio cria parte nova');
  confere('sax alto entra antes do sax tenor', JSON.stringify(np.nomes) === JSON.stringify(['Trompete em B♭', 'Sax Alto', 'Sax Tenor', 'Trombone', 'Base']), JSON.stringify(np.nomes));
  confere('mesmos compassos da música', np.compassos === 8, np.compassos);
  confere('tom escrito do sax alto (música em Fá -> Ré)', np.tom === 2, np.tom);
  confere('dobra o tenor no mesmo som (4ª abaixo no escrito)', np.c1 === 'D4:1 E4:1 F#4:2' && np.c3 === 'A4:4~', np.c1 + ' | ' + np.c3);
  confere('compasso vazio continua pausa', np.c2 === 'R:4', np.c2);
  confere('o tenor não mudou', np.tenor === 'G4:1 A4:1 B4:2', np.tenor);
  confere('dá para escrever notas na parte nova', np.escreve === 'A4:4', np.escreve);
  // compassos difíceis da parte de origem: tercina, compasso curto (ganha pausa no fim) e compasso longo (fica de fora)
  const dif = await p.evaluate(() => {
    const P = new Partitura(Partitura.blank({ instrumentos: ['trompete', 'sax-tenor'], compassos: 3 }));
    const put = (num, xs) => { const m = P.measure(1, num); for (const n of [...m.getElementsByTagName('note')]) n.remove();
      for (const x of xs) m.append(P.doc.importNode(new DOMParser().parseFromString(x, 'application/xml').documentElement, true)); };
    const nt = (st, d, extra = '') => `<note><pitch><step>${st}</step><octave>5</octave></pitch><duration>${d}</duration><voice>1</voice><type>quarter</type>${extra}</note>`;
    const tri = '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>';
    put(1, [nt('C', 8, tri), nt('D', 8, tri), nt('E', 8, tri), nt('F', 72)]);
    put(2, [nt('G', 24), nt('A', 24), nt('B', 24)]);
    put(3, [nt('C', 72), nt('D', 30)]);
    const r = P.addPart('sax-alto', { copiarDe: 1 });
    return { pulados: r.pulados, c1: P.tokens(r.pi, 1), c2: P.tokens(r.pi, 2), c3: P.tokens(r.pi, 3) };
  });
  confere('copia compasso com tercina', dif.c1 === 'G4:0.333 A4:0.333 B4:0.333 C5:3', dif.c1);
  confere('compasso curto na origem ganha pausa no fim', dif.c2 === 'D5:1 E5:1 F#5:1 R:1', dif.c2);
  confere('compasso longo demais na origem fica de fora e é avisado', JSON.stringify(dif.pulados) === '["3"]' && dif.c3 === 'R:4', JSON.stringify(dif));
  // o botão Aplicar com uma proposta "nova_parte" + notas para ela: salva uma versão nova com a parte e a lista de instrumentos
  const ap = await p.evaluate(async () => {
    const xml = Partitura.blank({ titulo: 't', instrumentos: ['trompete', 'sax-tenor', 'trombone', 'base'], formula: '4/4', fifths: 0, compassos: 4 });
    const song = { title: 'Teste', partitura: { xml: 'mem://v1', versao: 1, partes: [{ key: 'trumpet', name: 'Trompete' }, { key: 'tenor-sax', name: 'Sax Tenor' }, { key: 'trombone', name: 'Trombone' }, { key: 'base', name: 'Base' }] } };
    let salvo = null, xmlSalvo = null;
    window.salveApp.S.db = { collection: () => ({ doc: () => ({ get: async () => ({ data: () => song }), update: async u => { salvo = u; } }), onSnapshot: () => () => {} }) };
    window.salveApp.Versions.snapshot = async () => {}; window.salveApp.Robo.start = () => {};
    window.SALVE.upload = async f => { xmlSalvo = await f.text(); return { url: 'mem://v2' }; };
    const f0 = window.fetch; window.fetch = async u => u === 'mem://v1' ? new Response(xml) : f0(u);
    const r = await Editor.aplicarCorrecoes({ ...song, id: 'teste' }, [
      { tipo: 'nova_parte', musica: 'teste', instrumento: 'sax-alto', copiar_de: '', oitava: 0, descricao: 'sax alto novo' },
      { tipo: 'corrigir_notas', musica: 'teste', parte: 'sax-alto', compasso: 2, notas: 'E5:2 D5:2', descricao: 'entrada do sax alto' },
      { tipo: 'corrigir_notas', musica: 'teste', parte: 'tenor-sax', compasso: 2, notas: 'B4:4', descricao: 'tenor' }]);
    window.fetch = f0;
    const Q = new Partitura(xmlSalvo);
    return { r, partes: salvo?.partitura?.partes?.map(x => x.key), versao: salvo?.partitura?.versao, origem: salvo?.partitura?.origem || '', semPdf: (salvo?.partitura?.partesSemPdf || []).join(),
      alto: Q.tokens(1, 2), tenor: Q.tokens(2, 2) };
  });
  confere('Aplicar: cria a parte e escreve as notas dela', ap.r.feitas === 3 && !ap.r.erros.length && ap.alto === 'E5:2 D5:2', JSON.stringify(ap));
  confere('Aplicar: as outras partes seguem com a chave certa', ap.tenor === 'B4:4', ap.tenor);
  confere('Aplicar: nova versão com a lista de instrumentos atualizada', ap.versao === 2 && JSON.stringify(ap.partes) === JSON.stringify(['trumpet', 'sax-alto', 'tenor-sax', 'trombone', 'base']) && !ap.origem && ap.semPdf === 'sax-alto', JSON.stringify(ap));
  console.log('Player: combinação de instrumentos');
  const mx = await p.evaluate(async () => {
    const { P, applyMix, mixKey, feito, audio } = window.__mix(), out = {};
    P.songId = 'teste';
    P.data = { instrumentos: ['a', 'b', 'c', 'd'].map(k => ({ key: k, name: k })), measures: [[1, 0]], beats: [0, 0.5], duration: 1,
      mixes: { tudo: '/tom-a.wav?tudo', 'so-a': '/tom-a.wav', 'so-b': '/tom-b.wav', 'so-c': '/tom-c.wav', 'so-d': '/tom-d.wav' } };
    P.off = ['c', 'd'];  // só "a" e "b": não existe versão pronta
    out.chave = mixKey();
    applyMix();
    for (let i = 0; i < 100 && !feito.url; i++) await new Promise(r => setTimeout(r, 50));
    out.pronto = !!feito.url;
    for (let i = 0; i < 40 && P.src !== feito.url; i++) await new Promise(r => setTimeout(r, 50));
    out.tocandoAMistura = P.src === feito.url;
    // a mistura tem que ser a soma exata de "a" + "b"
    const ac = new AudioContext({ sampleRate: 32000 }), dec = async u => ac.decodeAudioData(await (await fetch(u)).arrayBuffer());
    const [m, a, b] = await Promise.all([dec(feito.url), dec('/tom-a.wav'), dec('/tom-b.wav')]);
    let erro = 0; const M = m.getChannelData(0), A = a.getChannelData(0), B = b.getChannelData(0);
    for (let i = 0; i < m.length; i += 97) erro = Math.max(erro, Math.abs(M[i] - A[i] - B[i]));
    out.erroMaximo = erro; out.duracao = m.duration;
    return out;
  });
  confere('combinação sem versão pronta é detectada', mx.chave === 'missing', mx.chave);
  confere('o app junta os instrumentos', mx.pronto);
  confere('passa a tocar a mistura', mx.tocandoAMistura);
  confere('a mistura é a soma dos instrumentos escolhidos', mx.erroMaximo < 0.001 && Math.abs(mx.duracao - 1) < 0.01, JSON.stringify(mx));
  console.log('Página');
  confere('nenhum erro de JavaScript', !erros.length, erros.join(' | '));

  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falharam${falhas.length ? ': ' + falhas.join('; ') : ''}`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('FALHOU', e.message); srv.close(); process.exit(1); });
