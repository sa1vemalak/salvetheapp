// Teste RÁPIDO do app (uns 10-20 s): abre o app daqui do repositório num navegador, sem internet do Firebase nem
// conta de teste, e confere o essencial. É o teste de todo dia; o teste completo (FULL) usa os outros arquivos desta
// pasta, com conta de teste e os robôs de verdade.
//   node testes/rapido.js
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json', '.wasm': 'application/wasm' };
const srv = http.createServer((req, res) => {
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  // só no teste: deixa o teste ver o estado do app, que fica guardado dentro de uma função fechada
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { S, Robo, Caio };\nboot();\n})();');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});

const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1180, height: 820 } })).newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
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
    window.fetch = async (u, o) => { pedido = JSON.parse(o.body); return new Response(JSON.stringify({ texto: 'O trompete fica mais suave no começo.', podeAplicar: true,
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
  console.log('Página');
  confere('nenhum erro de JavaScript', !erros.length, erros.join(' | '));

  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falharam${falhas.length ? ': ' + falhas.join('; ') : ''}`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error('FALHOU', e.message); srv.close(); process.exit(1); });
