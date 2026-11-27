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
  confere('copia compasso com tercina', dif.c1 === 'G4:1/3 A4:1/3 B4:1/3 C5:3', dif.c1);
  confere('compasso curto na origem ganha pausa no fim', dif.c2 === 'D5:1 E5:1 F#5:1 R:1', dif.c2);
  confere('compasso longo demais na origem fica de fora e é avisado', JSON.stringify(dif.pulados) === '["3"]' && dif.c3 === 'R:4', JSON.stringify(dif));
  // a partitura inteira na língua de notas: tercinas, dinâmicas, crescendo/diminuendo, ligadura de frase e fermata
  const ln = await p.evaluate(() => {
    const P = new Partitura(Partitura.blank({ instrumentos: ['trompete', 'sax-tenor'], compassos: 4 }));
    const out = {};
    P.setTokens(0, 1, 'mf C5:1/3( D5:1/3 E5:1/3) cresc F5:1 G5:2 fim');
    P.setTokens(0, 2, 'p A5:2/3 B5:1/3 dim C6:1/6 B5:1/6 A5:1/6 G5:1/2 F5:2@');
    P.setTokens(0, 3, 'R:0.333 D5:0.333 E5:0.333 F5:3');   // tercina escrita em decimal também vale
    let erro = ''; try { P.setTokens(0, 4, 'C5:1/3 D5:1/3 E5:3'); } catch (e) { erro = e.message; }
    const Q = new Partitura(P.toString());
    out.c1 = Q.tokens(0, 1); out.c2 = Q.tokens(0, 2); out.c3 = Q.tokens(0, 3); out.erro = erro;
    const m1 = Q.measure(0, 1), m2 = Q.measure(0, 2);
    out.tm = m1.getElementsByTagName('time-modification').length; out.tup1 = [...m1.getElementsByTagName('tuplet')].map(t => t.getAttribute('type')).join();
    out.tup2 = [...m2.getElementsByTagName('tuplet')].map(t => t.getAttribute('type')).join();
    out.tipos = [...m1.getElementsByTagName('type')].map(t => t.textContent).join();
    // reescrever de novo não duplica dinâmica nem crescendo
    Q.setTokens(0, 1, Q.tokens(0, 1)); out.dyn = Q.measure(0, 1).getElementsByTagName('dynamics').length; out.wedge = Q.measure(0, 1).getElementsByTagName('wedge').length;
    // transpor mantém as marcas
    Q.transpose(2, 1, 1, 0); out.tr = Q.tokens(0, 1);
    // o editor à mão (mudar a altura de uma nota) não apaga as marcas do compasso
    const ev = Q.events(0, 2); ev[0] = { ...ev[0], pitches: ['G5'] }; Q.setTokens(0, 2, Partitura.joinTokens(ev)); out.mao = Q.tokens(0, 2);
    return out;
  });
  console.log('Língua de notas completa');
  confere('tercina, dinâmica, ligadura e crescendo voltam iguais', ln.c1 === 'mf C5:1/3( D5:1/3 E5:1/3) cresc F5:1 G5:2 fim', ln.c1);
  confere('tercinas misturadas, sextina, diminuendo e fermata', ln.c2 === 'p A5:2/3 B5:1/3 dim C6:1/6 B5:1/6 A5:1/6 G5:0.5 F5:2@', ln.c2);
  confere('tercina escrita em decimal vale', ln.c3 === 'R:1/3 D5:1/3 E5:1/3 F5:3', ln.c3);
  confere('soma errada com tercina é recusada', /soma/.test(ln.erro), ln.erro);
  confere('tercina vira 3 colcheias com o 3 em cima', ln.tm === 3 && ln.tup1 === 'start,stop' && ln.tipos.startsWith('eighth,eighth,eighth'), JSON.stringify(ln));
  confere('dois grupos de tercina no compasso 2', ln.tup2 === 'start,stop,start,stop', ln.tup2);
  confere('reescrever não duplica dinâmica', ln.dyn === 1 && ln.wedge === 2, ln.dyn + ' ' + ln.wedge);
  confere('transpor mantém as marcas', ln.tr === 'mf D5:1/3( E5:1/3 F#5:1/3) cresc G5:1 A5:2 fim', ln.tr);
  confere('editar à mão mantém as marcas', ln.mao === 'p G5:2/3 B5:1/3 dim C6:1/6 B5:1/6 A5:1/6 G5:0.5 F5:2@', ln.mao);
  // a estrutura da música, em todas as partes de uma vez
  const es = await p.evaluate(() => {
    const P = new Partitura(Partitura.blank({ instrumentos: ['trompete', 'sax-alto', 'base'], compassos: 8, fifths: 0 }));
    for (let n = 1; n <= 8; n++) P.setTokens(0, n, `C5:${4}`);
    P.setTime(5, '3/4'); P.setKey(3, 'Bb'); P.setTempo(1, 96, 'Balada'); P.setRehearsal(3, 'A'); P.setText(0, 2, 'solo');
    P.setBarline(3, 'inicio'); P.setBarline(6, 'casa1'); P.setBarline(7, 'casa2'); P.setBarline(8, 'final');
    const out = {};
    let erro = ''; try { P.setTokens(0, 5, 'C5:4'); } catch (e) { erro = e.message; } out.erro34 = /3 tempos/.test(erro);
    P.setTokens(0, 5, 'D5:3'); P.setTokens(0, 6, 'E5:3'); P.setTokens(0, 7, 'F5:3'); P.setTokens(0, 8, 'G5:3');
    P.insertBars(2, 2);
    out.n = P.measures(0).length; out.nb = P.measures(2).length; out.novo = P.tokens(0, 3); out.depois = P.tokens(0, 7);
    out.base = P.tokens(2, 3);
    P.deleteBars(3, 4);
    const Q = new Partitura(P.toString());
    out.n2 = Q.measures(0).length; out.c5 = Q.tokens(0, 5);
    out.tom = [Q.context(0, 3).fifths, Q.context(1, 3).fifths, Q.context(2, 3).fifths].join();
    out.formula = Q.context(0, 5).len;
    out.info3 = JSON.stringify(Q.barInfo(0, 3)); out.info1 = JSON.stringify(Q.barInfo(0, 1)); out.info2 = JSON.stringify(Q.barInfo(0, 2)); out.info6 = JSON.stringify(Q.barInfo(1, 6)); out.info7 = JSON.stringify(Q.barInfo(2, 7));
    // pôr e tirar letra/texto
    Q.setRehearsal(3, ''); Q.setText(0, 2, ''); out.limpo = JSON.stringify(Q.barInfo(0, 3)) + JSON.stringify(Q.barInfo(0, 2));
    out.check = Q.checkBars().compassos.length;
    return out;
  });
  console.log('Estrutura da música');
  confere('fórmula nova vale para os compassos seguintes', es.erro34 && es.formula === 3, JSON.stringify(es));
  confere('pôr 2 compassos em todas as partes', es.n === 10 && es.nb === 10 && es.novo === 'R:4' && es.depois === 'D5:3', JSON.stringify(es));
  confere('a Base ganha compasso com a levada', /só|B4/.test(es.base), es.base);
  confere('tirar 2 compassos volta ao tamanho e a numeração segue', es.n2 === 8 && es.c5 === 'D5:3', JSON.stringify(es));
  confere('tom de Si bemol escrito certo em cada instrumento', es.tom === '0,1,-2', es.tom);
  confere('letra de ensaio e repetição no compasso 3', es.info3 === '{"ensaio":"A","repete_daqui":true}', es.info3);
  confere('andamento e texto', es.info1.includes('"andamento":"quarter = 96"') && es.info1.includes('Balada') && es.info2 === '{"textos":["solo"]}', es.info1 + es.info2);
  confere('casa 1 e casa 2', es.info6.includes('"casa":"1"') && es.info6.includes('volta_ao_inicio') && es.info7.includes('"casa":"2"'), es.info6 + es.info7);
  confere('apagar letra de ensaio e texto', es.limpo === '{"repete_daqui":true}{}', es.limpo);
  confere('nenhum compasso com tempo errado depois de tudo', es.check === 0, es.check);
  // segunda voz e letra
  const vl = await p.evaluate(() => {
    const P = new Partitura(Partitura.blank({ instrumentos: ['voz', 'trombone'], compassos: 4 }));
    const out = {};
    P.setTokens(1, 1, 'E4:4 || C4:2 B3:2');
    out.duas = P.tokens(1, 1);
    P.setTokens(1, 1, 'F4:2 G4:2'); out.mantem = P.tokens(1, 1);          // sem "||": a segunda voz fica
    let e = ''; try { P.setTokens(1, 1, 'F4:4 || C4:3'); } catch (x) { e = x.message; } out.erro2 = /segunda voz/.test(e);
    P.transpose(2, 1, 1, 1); out.transp = P.tokens(1, 1);
    P.setTokens(1, 2, 'A4:4 ||'); out.tira = P.tokens(1, 2);
    P.setTokens(0, 1, 'C5:1 D5:1 E5:2~'); P.setTokens(0, 2, 'E5:1 F5:1 G5:2');
    P.setLyrics(0, 1, 'Can- ta- va'); P.setLyrics(0, 2, 'mos nós');
    const Q = new Partitura(P.toString());
    out.l1 = Q.lyrics(0, 1); out.l2 = Q.lyrics(0, 2);
    out.sil = [...Q.measure(0, 1).getElementsByTagName('syllabic')].map(x => x.textContent).join() + '|' + [...Q.measure(0, 2).getElementsByTagName('syllabic')].map(x => x.textContent).join();
    let e2 = ''; try { Q.setLyrics(0, 2, 'a b c'); } catch (x) { e2 = x.message; } out.erroL = /sílabas/.test(e2);
    Q.setTokens(0, 1, 'C5:2 D5:1 E5:1~'); out.letraFica = Q.lyrics(0, 1);   // reescrever as notas mantém a letra
    out.v2xml = Q.measure(1, 1).getElementsByTagName('backup').length === 1 && [...Q.measure(1, 1).getElementsByTagName('stem')].map(x => x.textContent).join();
    return out;
  });
  console.log('Segunda voz e letra');
  confere('lê e escreve duas vozes', vl.duas === 'E4:4 || C4:2 B3:2', vl.duas);
  confere('mexer na voz 1 mantém a segunda voz', vl.mantem === 'F4:2 G4:2 || C4:2 B3:2', vl.mantem);
  confere('segunda voz com soma errada é recusada', vl.erro2, JSON.stringify(vl));
  confere('transpor leva as duas vozes', vl.transp === 'G4:2 A4:2 || D4:2 C#4:2', vl.transp);
  confere('"||" vazio tira a segunda voz', vl.tira === 'A4:4', vl.tira);
  confere('desenha com hastes para cima e para baixo', vl.v2xml === 'up,up,down,down', String(vl.v2xml));
  confere('letra com hífen entre compassos', vl.l1 === 'Can- ta- va' && vl.l2 === 'mos nós' && vl.sil === 'begin,middle,end|single,single', JSON.stringify(vl));
  confere('mais sílabas que notas é recusado', vl.erroL, JSON.stringify(vl));
  confere('reescrever as notas mantém a letra', vl.letraFica === 'Can- ta- va', vl.letraFica);
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
      { tipo: 'corrigir_notas', musica: 'teste', parte: 'tenor-sax', compasso: 2, notas: 'B4:4', descricao: 'tenor' },
      { tipo: 'estrutura', musica: 'teste', acao: 'por_compassos', compasso: 4, ate: 4, quantos: 1, valor: '', parte: 'todas', descricao: 'um compasso a mais no fim' },
      { tipo: 'estrutura', musica: 'teste', acao: 'ensaio', compasso: 2, ate: 2, quantos: 0, valor: 'A', parte: 'todas', descricao: 'letra A' },
      { tipo: 'corrigir_notas', musica: 'teste', parte: 'trumpet', compasso: 5, notas: 'mf C5:4@', descricao: 'final' }]);
    window.fetch = f0;
    const Q = new Partitura(xmlSalvo);
    return { r, partes: salvo?.partitura?.partes?.map(x => x.key), versao: salvo?.partitura?.versao, origem: salvo?.partitura?.origem || '', semPdf: (salvo?.partitura?.partesSemPdf || []).join(),
      alto: Q.tokens(1, 2), tenor: Q.tokens(2, 2), c5: Q.tokens(0, 5), ens: (Q.barInfo(3, 2) || {}).ensaio, n: Q.measures(4).length };
  });
  confere('Aplicar: cria a parte e escreve as notas dela', ap.r.feitas === 6 && !ap.r.erros.length && ap.alto === 'E5:2 D5:2', JSON.stringify(ap));
  confere('Aplicar: as outras partes seguem com a chave certa', ap.tenor === 'B4:4', ap.tenor);
  confere('Aplicar: estrutura antes das notas (compasso novo já recebe notas)', ap.c5 === 'mf C5:4@' && ap.ens === 'A' && ap.n === 5, JSON.stringify(ap));
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
