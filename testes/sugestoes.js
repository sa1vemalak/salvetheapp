// Teste do "Sugerir melhoria" (rápido, sem Firebase): qualquer pessoa manda uma ideia ou um problema pelo menu ou pela
// tela inicial, com print opcional, e vai junto a tela e o aparelho; na página da equipe o dono vê as sugestões em
// grupos com o parecer do júri (aprovar, problemas confirmados com a correção, esperando, recusadas).
//   node testes/sugestoes.js            (FOTOS=pasta para salvar os prints)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
const srv = http.createServer((req, res) => {
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { S, Sugerir };\nboot();\n})();');
  if (f.endsWith('equipe.html')) b = String(b).replace('<script src="equipe.js">', '<script>window.__testEquipe = 1;</script><script src="equipe.js">');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };
const FOTOS = process.env.FOTOS; if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });
// a small PNG as the "print"
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(), erros = [];
  async function abre(nome, ctxOpts) {
    const ctx = await b.newContext(ctxOpts);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(nome + ': ' + e.stack));
    await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 });
    await p.evaluate(() => {
      document.querySelectorAll('.modal,.scrim,.gate').forEach(x => x.remove()); document.body.classList.add('at-home'); document.getElementById('home').hidden = false;
      window.__enviadas = [];   // no Firebase here: keep what would be sent
      window.SALVE.sugerir = async d => { window.__enviadas.push({ ...d, foto: d.foto ? { tipo: d.foto.type, tam: d.foto.size } : null }); return 'x'; };
    });
    await p.waitForTimeout(200);
    return { p, ctx };
  }
  const visivel = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).catch(() => false);

  console.log('Computador: pelo menu');
  let { p, ctx } = await abre('pc', { viewport: { width: 1280, height: 800 } });
  confere('a tela inicial tem "Sugerir melhoria"', await visivel(p, '#homeSugerir'));
  await p.click('#homeSugerir'); await p.waitForSelector('.modal.sug');
  confere('abre já em "Ideia de melhoria"', await p.$eval('#sgTipo [data-k="melhoria"]', e => e.getAttribute('aria-pressed') === 'true'));
  confere('a dica de problema fica escondida na ideia', !(await visivel(p, '#sgPassos')));
  confere('mostra o que vai junto (tela e aparelho)', /Tela inicial/.test(await p.textContent('.sug .vai')) && /tela 1280×800/.test(await p.textContent('.sug .vai')), await p.textContent('.sug .vai'));
  await p.fill('#sgTexto', 'oi'); await p.click('#sgEnvia');
  confere('texto curto demais não envia', (await p.evaluate(() => window.__enviadas.length)) === 0 && /Escreva um pouco mais/.test(await p.textContent('.toast')));
  await p.click('#sgTipo [data-k="problema"]');
  confere('"Algo deu errado" pede o que fez, o que esperava e o que aconteceu', await visivel(p, '#sgPassos') && /o que esperava/.test(await p.textContent('#sgPassos')));
  await p.setInputFiles('#sgFoto', { name: 'print.png', mimeType: 'image/png', buffer: PNG });
  await p.waitForSelector('#sgFotoV img');
  confere('o print anexado aparece', await visivel(p, '#sgFotoV img'));
  await p.fill('#sgTexto', 'Toquei em Ouvir na música e o som não saiu.');
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'ipad-1-sugerir-problema.png') });
  await p.click('#sgEnvia'); await p.waitForFunction(() => window.__enviadas.length === 1);
  const e1 = (await p.evaluate(() => window.__enviadas))[0];
  confere('enviou como problema, com o texto', e1.tipo === 'problema' && /som não saiu/.test(e1.texto));
  confere('foi junto a tela e o aparelho', e1.tela === 'Tela inicial' && /tela 1280×800/.test(e1.aparelho), JSON.stringify(e1));
  confere('o print foi junto, em JPEG', e1.foto && e1.foto.tipo === 'image/jpeg', JSON.stringify(e1.foto));
  confere('a janela fecha e agradece', !(await p.$('.modal.sug')) && /Obrigado/.test(await p.textContent('.toast')));
  // fora da tela inicial (na partitura), pelo menu da esquerda
  await p.evaluate(() => { document.body.classList.remove('at-home'); document.getElementById('home').hidden = true; });
  confere('o menu tem "Sugerir melhoria"', await visivel(p, '#sugerirSide'));
  await p.click('#sugerirSide'); await p.waitForSelector('.modal.sug');
  confere('na partitura, "vai junto" diz Partitura', /Partitura/.test(await p.textContent('.sug .vai')), await p.textContent('.sug .vai'));
  confere('abre de novo limpo (sem o print de antes)', !(await p.$('#sgFotoV img')) && (await p.inputValue('#sgTexto')) === '');
  await p.keyboard.press('Escape');
  confere('Esc fecha', !(await p.$('.modal.sug')));
  // a JavaScript error on the page goes with the next report
  await p.evaluate(() => setTimeout(() => { throw new Error('quebrou de propósito'); }));
  await p.waitForTimeout(100);
  await p.click('#sugerirSide'); await p.fill('#sgTexto', 'Ideia: mostrar as letras de ensaio maiores'); await p.click('#sgEnvia');
  await p.waitForFunction(() => window.__enviadas.length === 2);
  const e2 = (await p.evaluate(() => window.__enviadas))[1];
  confere('ideia vai como melhoria, sem print', e2.tipo === 'melhoria' && !e2.foto);
  confere('o último erro da página vai junto', /quebrou de propósito/.test(e2.erros || ''), e2.erros);
  await ctx.close();

  console.log('iPhone');
  ({ p, ctx } = await abre('iphone', { ...devices['iPhone 13'] }));
  await p.evaluate(() => window.__t.Sugerir.show('problema')); await p.waitForSelector('.modal.sug');
  confere('a janela cabe na tela do iPhone', await p.$eval('.modal.sug', e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && e.scrollWidth <= e.clientWidth + 1; }));
  confere('os dois botões de tipo são grandes (44 px ou mais)', await p.$$eval('#sgTipo button', l => l.every(e => e.getBoundingClientRect().height >= 44)));
  confere('aparelho: iPhone · Safari', /iPhone · Safari/.test(await p.textContent('.sug .vai')), await p.textContent('.sug .vai'));
  await p.fill('#sgTexto', 'A partitura não acompanhou a DAW no compasso 32 da segunda música.');
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'celular-1-sugerir.png') });
  await ctx.close();

  console.log('Página da equipe: o dono vê o parecer do júri');
  const agora = Date.now();
  const votos = (vale, tipo) => ['Músico da banda', 'Produto', 'Técnico'].map((nome, i) => ({ nome, papel: ['musico', 'produto', 'tecnico'][i], tipo, nota: vale ? 4 : 2, vale,
    motivo: vale ? 'Ajuda no ensaio e é simples de fazer.' : 'Pouca gente precisa disso e complica a tela.' }));
  const itens = [
    { id: 'a', tipo: 'melhoria', texto: 'Queria ver as letras de ensaio maiores na parte do trompete.', nome: 'Ana', bandaNome: 'Banda X', papel: 'musico', tela: 'Partitura · Céu Azul · Trompete', aparelho: 'iPad · Safari', criadoEm: agora - 3e5, status: 'nova',
      juri: { estado: 'pronto', vale: true, bug: false, tipo: 'melhoria', nota: 4, sim: 3, de: 3, resumo: 'Letras de ensaio maiores', votos: votos(true, 'melhoria') } },
    { id: 'b', tipo: 'problema', texto: 'Toquei em Ouvir e o som não saiu.', nome: 'Beto', bandaNome: 'Poesia Acústica', papel: 'editor', tela: 'Partitura · Teu Popô · Sax', aparelho: 'iPhone · Safari', criadoEm: agora - 6e5, status: 'nova',
      juri: { estado: 'pronto', vale: true, bug: true, tipo: 'bug', nota: 4.3, sim: 3, de: 3, resumo: 'Áudio não toca no iPhone', votos: votos(true, 'bug') },
      correcao: { estado: 'pr', pr: 'https://github.com/sa1vemalak/salvetheapp/pull/99', nota: 'Reproduzi no Safari do iPhone: o áudio só começa depois de um toque. Teste novo em testes/.' } },
    { id: 'c', tipo: 'melhoria', texto: 'Pôr um jogo da cobrinha no intervalo.', nome: 'Caio', criadoEm: agora - 9e5, status: 'nova',
      juri: { estado: 'pronto', vale: false, bug: false, tipo: 'outro', nota: 1.7, sim: 0, de: 3, resumo: 'Jogo no intervalo', votos: votos(false, 'outro') } },
    { id: 'd', tipo: 'problema', texto: 'O PDF da grade ficou cortado.', nome: 'Dani', criadoEm: agora - 6e4, status: 'nova' },
  ];
  ctx = await b.newContext({ viewport: { width: 1180, height: 820 } }); p = await ctx.newPage(); p.on('pageerror', e => erros.push('equipe: ' + e.stack));
  await p.goto(url + 'equipe.html'); await p.waitForFunction(() => window.__equipe);
  await p.waitForTimeout(300);
  await p.evaluate(i => window.__equipe.desenha(i, true), itens);
  const grupos = await p.$$eval('.grupo > h3, .grupo > summary', l => l.map(e => e.textContent));
  confere('grupos: aprovar, problemas confirmados, esperando, recusadas', grupos.join('|') === 'Para você aprovar (1)|Problemas confirmados pelo júri (1)|Esperando o júri (1)|Recusadas pelo júri (1)', grupos.join('|'));
  confere('o cartão mostra o parecer do júri e os três votos', /Júri: vale \(3 de 3\)/.test(await p.textContent('.g-aprovar')) && (await p.$$('.g-aprovar .votos li')).length === 3);
  confere('o problema mostra a correção com o link do pedido', /falta você dar o ok/.test(await p.textContent('.g-bug .corr')) && (await p.$eval('.g-bug .corr a', a => a.href)).endsWith('/pull/99'));
  confere('o dono tem Aprovar e Descartar', !!(await p.$('.g-aprovar button.primary')) && /Descartar/.test(await p.textContent('.g-aprovar')));
  confere('recusadas ficam fechadas', await p.$eval('.g-recusada', e => e.tagName === 'DETAILS' && !e.open));
  if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'ipad-2-equipe-sugestoes.png'), fullPage: true });
  await p.evaluate(i => window.__equipe.desenha(i, false), itens);
  confere('quem não é o dono não vê os botões de decidir', !(await p.$('.g-aprovar button')));
  await ctx.close();

  await b.close(); srv.close();
  confere('nenhum erro de JavaScript (fora o de propósito)', erros.filter(e => !/quebrou de propósito/.test(e)).length === 0, erros.join('\n'));
  console.log(`\n${ok} ok, ${falhas.length} falharam`);
  process.exit(falhas.length ? 1 : 0);
})();
