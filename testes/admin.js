// Teste do painel de admin na tela (rápido, sem Firebase): o ícone pequeno no canto da tela inicial só aparece para o
// dono do app (com o número de cadastros novos); a página admin.html mostra resumo, cadastros novos (marcar como visto),
// pessoas e frequência, bandas e custo, sugestões, códigos de acesso e relatórios em planilha, no iPad e no celular.
//   node testes/admin.js            (FOTOS=pasta para salvar os prints)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '..', 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
const DIA = 864e5, agora = Date.now();
const dia = t => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);
const mes = dia(agora).slice(0, 7);
const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); });
const pessoa = (uid, nome, email, criado, ultimo, d7, d30, bandas, extra = {}) => ({ uid, nome, email, entrada: 'Google', criadoEm: agora - criado * DIA, ultimo: agora - ultimo, hoje: ultimo < 12 * 3600e3,
  dias7: d7, dias30: d30, aberturas30: d30 * 2, bandas, entrouEm: [], admin: false, desativada: false, novo: false, ...extra });
const REL = {
  geradoEm: agora, vistoEm: agora - 3 * DIA,
  resumo: { pessoas: 6, novas7: 3, novasNaoVistas: 2, ativosHoje: 3, ativos7: 5, ativos30: 6, bandas: 3, bandasNoLimite: 1, gastoMes: 46.8, mes, caio14: 212, sugestoesAbertas: 4, bugsNaFila: 1, prsParaJuntar: 1 },
  pessoas: [
    pessoa('u1', 'Rafa Lima', 'rafa@gmail.com', 0.1, 3600e3, 1, 1, [{ id: 'b3', nome: 'Banda do Zé', papel: 'musico' }], { novo: true, entrada: 'e-mail e senha', entrouEm: [{ banda: 'Banda do Zé', papel: 'musico', como: 'link de convite de Zé' }] }),
    pessoa('u2', 'Zé Carlos', 'ze@gmail.com', 1, 2 * 3600e3, 2, 2, [{ id: 'b3', nome: 'Banda do Zé', papel: 'dono' }], { novo: true, entrouEm: [{ banda: 'Banda do Zé', papel: 'dono', como: 'criou a banda com o código K7QX2M9P (Banda do Zé)' }] }),
    pessoa('u0', 'Malak', 'dono@salvetheapp', 300, 600e3, 6, 22, [{ id: 'b1', nome: 'Poesia Acústica', papel: 'dono' }], { admin: true }),
    pessoa('u3', 'Bia Trompete', 'bia@gmail.com', 40, 26 * 3600e3, 4, 14, [{ id: 'b1', nome: 'Poesia Acústica', papel: 'musico' }]),
    pessoa('u4', 'Duda Sax', 'duda@gmail.com', 38, 5 * DIA, 1, 6, [{ id: 'b1', nome: 'Poesia Acústica', papel: 'musico' }]),
    pessoa('u5', 'Teo Trombone', 'teo@gmail.com', 60, 19 * DIA, 0, 1, [{ id: 'b2', nome: 'Metais do Sul', papel: 'dono' }]),
  ],
  bandas: [
    { id: 'b2', nome: 'Metais do Sul', dono: 'u5', donoNome: 'Teo Trombone', criadaEm: agora - 60 * DIA, codigo: 'AB12CD34', membros: 4, musicos: 3, editores: 0, ativos7: 2,
      mes: { reais: 20, caio: 14.2, malak: 0.9, mestrinho: 5, juri: 0 }, meses: meses.map((m, i) => ({ mes: m, reais: [20, 17.3, 8.1, 0, 0, 0][i] })), semLimite: false, semLimitePorAdmin: false, semLimiteManual: false },
    { id: 'b1', nome: 'Poesia Acústica', dono: 'u0', donoNome: 'Malak', criadaEm: agora - 300 * DIA, codigo: '', membros: 9, musicos: 7, editores: 1, ativos7: 6,
      mes: { reais: 23.6, caio: 18.1, malak: 3.3, mestrinho: 0, juri: 2.2 }, meses: meses.map((m, i) => ({ mes: m, reais: [23.6, 31, 12, 9, 4, 0][i] })), semLimite: true, semLimitePorAdmin: true, semLimiteManual: false },
    { id: 'b3', nome: 'Banda do Zé', dono: 'u2', donoNome: 'Zé Carlos', criadaEm: agora - DIA, codigo: 'K7QX2M9P', membros: 2, musicos: 1, editores: 0, ativos7: 2,
      mes: { reais: 3.2, caio: 3.2, malak: 0, mestrinho: 0, juri: 0 }, meses: meses.map((m, i) => ({ mes: m, reais: i ? 0 : 3.2 })), semLimite: false, semLimitePorAdmin: false, semLimiteManual: false },
  ],
  aberturas: Array.from({ length: 14 }, (_, i) => ({ dia: dia(agora - (13 - i) * DIA), pessoas: [2, 3, 1, 4, 3, 5, 2, 3, 4, 4, 5, 3, 4, 3][i] })),
  caio: Array.from({ length: 14 }, (_, i) => ({ dia: dia(agora - (13 - i) * DIA), perguntas: [8, 14, 3, 22, 19, 30, 6, 11, 17, 15, 24, 9, 21, 13][i] })),
  sugestoes: [
    { id: 's1', tipo: 'problema', texto: 'Toquei em Ouvir na música e o som não saiu no iPhone.', nome: 'Bia Trompete', bandaNome: 'Poesia Acústica', criadoEm: agora - 5 * 3600e3, status: 'nova', grupo: 'bug',
      juri: { estado: 'pronto', vale: true, bug: true, nota: 4.3, resumo: 'Som não sai no iPhone', sim: 3, de: 3 }, correcao: { estado: 'pr', pr: 'https://github.com/sa1vemalak/salvetheapp/pull/99' } },
    { id: 's2', tipo: 'melhoria', texto: 'Seria bom ter um metrônomo na tela da música.', nome: 'Duda Sax', bandaNome: 'Poesia Acústica', criadoEm: agora - DIA, status: 'nova', grupo: 'aprovar',
      juri: { estado: 'pronto', vale: true, bug: false, nota: 3.7, resumo: 'Metrônomo na tela da música', sim: 2, de: 3 }, correcao: null },
    { id: 's3', tipo: 'melhoria', texto: 'Trocar a cor do app para azul.', nome: 'Teo Trombone', bandaNome: 'Metais do Sul', criadoEm: agora - 2 * DIA, status: 'nova', grupo: 'recusada',
      juri: { estado: 'pronto', vale: false, bug: false, nota: 1.7, resumo: 'App azul', sim: 0, de: 3 }, correcao: null },
  ],
  grupos: { bug: 1, aprovar: 1, recusada: 1 },
  config: { cadastroAberto: false, limiteReais: 20, dolar: 6 },
};
const srv = http.createServer((req, res) => {
  const f = path.join(APP, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let b = fs.readFileSync(f);
  if (f.endsWith('admin.html')) b = String(b).replace('<script src="admin.js">', `<script>window.__testAdmin = { relatorio: ${JSON.stringify(REL)}, codigos: [{ id: 'K7QX2M9P', ativo: true, limite: 1, usados: 1, nota: 'Banda do Zé', criadoEm: ${agora - 2 * DIA} }, { id: 'AB12CD34', ativo: false, limite: 3, usados: 1, nota: 'Metais do Sul', criadoEm: ${agora - 61 * DIA} }], chamadas: [], chamar(m, c) { this.chamadas.push([m, c]); return { ok: true }; } };</script><script src="admin.js">`);
  if (f.endsWith('index.html')) b = String(b).replace('boot();\n})();', 'window.__t = { S, AdminIcone };\nboot();\n})();');
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
});
const falhas = []; let ok = 0;
const confere = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (extra ? ' -> ' + extra : '')); } };
const FOTOS = process.env.FOTOS; if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });
const foto = (p, n, full) => FOTOS ? p.screenshot({ path: path.join(FOTOS, n), fullPage: !!full }) : null;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const url = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(), erros = [];
  const visivel = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).catch(() => false);

  console.log('Tela inicial: o ícone do painel');
  for (const [nome, resp] of [['não admin', null], ['dono', { admin: true, novos: 2 }]]) {
    const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); p.on('pageerror', e => erros.push('home: ' + e.stack));
    await p.goto(url); await p.waitForFunction(() => window.__t, null, { timeout: 15000 });
    await p.evaluate(async r => { document.querySelectorAll('.modal,.scrim,.gate').forEach(x => x.remove()); document.body.classList.add('at-home'); document.getElementById('home').hidden = false;
      window.SALVE = window.SALVE || {}; window.SALVE.novosCadastros = async () => r; await window.__t.AdminIcone.ver(); }, resp);
    await p.waitForTimeout(150);
    if (!resp) confere('quem não é admin não vê o ícone', !(await visivel(p, '#adminBtn')));
    else {
      confere('o dono vê o ícone pequeno no canto de baixo', await visivel(p, '#adminBtn') && await p.$eval('#adminBtn', e => { const r = e.getBoundingClientRect(); return r.width <= 40 && r.bottom > innerHeight - 30 && r.right > innerWidth - 30; }));
      confere('com o número de cadastros novos', (await p.textContent('#adminPonto')) === '2' && await visivel(p, '#adminPonto'));
      confere('leva para admin.html', (await p.getAttribute('#adminBtn', 'href')) === 'admin.html');
      await foto(p, 'ipad-0-icone-tela-inicial.png');
      const clip = await p.$eval('#adminBtn', e => { const r = e.getBoundingClientRect(); return { x: r.x - 140, y: r.y - 80, width: 200, height: 120 }; });
      if (FOTOS) await p.screenshot({ path: path.join(FOTOS, 'icone-zoom.png'), clip });
    }
    await ctx.close();
  }

  console.log('Painel no iPad');
  let ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, acceptDownloads: true }); let p = await ctx.newPage(); p.on('pageerror', e => erros.push('admin: ' + e.stack));
  await p.goto(url + 'admin.html'); await p.waitForSelector('.nums');
  const abas = await p.$$eval('[role=tab]', l => l.map(x => x.textContent));
  confere('sete abas', abas.length === 7 && abas[0] === 'Resumo' && /Relatórios/.test(abas[6]), abas.join(' | '));
  confere('a aba Cadastros mostra o número de novos', /Cadastros\s*2/.test(abas[1]), abas[1]);
  confere('resumo: cadastros novos, uso, custo, sugestões', /2\s*cadastros novos/.test(await p.textContent('.nums')) && /R\$ 46,80/.test(await p.textContent('.nums')));
  confere('gráficos de uso e do Caio', (await p.$$('.barras')).length === 2);
  await foto(p, 'ipad-1-resumo.png', true);
  await p.click('[data-k="cadastros"]');
  confere('cadastros novos com como entrou', /2 cadastros novos/.test(await p.textContent('main')) && /link de convite de Zé/.test(await p.textContent('main')) && /código K7QX2M9P/.test(await p.textContent('main')));
  await foto(p, 'ipad-2-cadastros.png', true);
  await p.click('text=Marcar como visto'); await p.waitForTimeout(100);
  confere('marcar como visto chama o servidor e tira o número', (await p.evaluate(() => window.__testAdmin.chamadas.some(c => c[1] && c[1].acao === 'visto'))) && !/\d/.test(await p.textContent('[data-k="cadastros"]')));
  await p.click('[data-k="pessoas"]');
  confere('pessoas com frequência', /toda semana, quase todo dia/.test(await p.textContent('main')) && /parado|de vez em quando/.test(await p.textContent('main')));
  await p.fill('input[type=search]', 'metais'); await p.waitForTimeout(50);
  confere('procurar por banda', (await p.$$('tbody tr')).length === 1);
  await p.fill('input[type=search]', ''); await p.waitForTimeout(50);
  await foto(p, 'ipad-3-pessoas.png', true);
  await p.click('[data-k="bandas"]');
  confere('banda no limite com a barra cheia', (await p.$$('.barra.cheia')).length === 1 && /R\$ 20,00 de R\$ 20,00/.test(await p.textContent('main')));
  confere('banda do dono sem limite', /Sem limite: é uma banda sua/.test(await p.textContent('main')));
  await p.check('.banda input[type=checkbox]'); await p.waitForTimeout(100);
  confere('liberar banda chama o servidor', await p.evaluate(() => window.__testAdmin.chamadas.some(c => c[1] && c[1].acao === 'semLimite' && c[1].banda === 'b2' && c[1].valor === true)));
  await foto(p, 'ipad-4-bandas-custo.png', true);
  await p.click('[data-k="sugestoes"]');
  confere('sugestões em grupos com o PR da correção', /Problemas confirmados pelo júri/.test(await p.textContent('main')) && !!(await p.$('a[href*="/pull/99"]')));
  await foto(p, 'ipad-5-sugestoes.png', true);
  await p.click('.sug button:has-text("Aprovar")'); await p.waitForTimeout(80);
  confere('aprovar move a sugestão para "em andamento"', /Aprovadas e em andamento/.test(await p.textContent('main')));
  await p.click('[data-k="acesso"]'); await p.waitForSelector('text=K7QX2M9P');
  confere('códigos de acesso e cadastro aberto', /Cadastro aberto para todos/.test(await p.textContent('main')) && (await p.$$('tbody tr')).length === 2);
  await p.fill('input[placeholder^="Para quem"]', 'Banda da Lu'); await p.click('text=Criar código'); await p.waitForTimeout(100);
  confere('criar código', (await p.$$('tbody tr')).length === 3 && /Banda da Lu/.test(await p.textContent('main')));
  await foto(p, 'ipad-6-acesso.png', true);
  await p.click('[data-k="relatorios"]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-rel="pessoas"]')]);
  const txt = fs.readFileSync(await dl.path(), 'utf8');
  confere('relatório de pessoas em planilha', /^﻿Nome;E-mail;Cadastro/.test(txt) && /Bia Trompete/.test(txt) && txt.trim().split('\n').length === 7, txt.slice(0, 120));
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('[data-rel="bandas"]')]);
  confere('relatório de bandas com os meses', /Metais do Sul/.test(fs.readFileSync(await dl2.path(), 'utf8')));
  await foto(p, 'ipad-7-relatorios.png', true);
  await ctx.close();

  console.log('Painel no celular');
  ctx = await b.newContext({ ...devices['iPhone 13'] }); p = await ctx.newPage(); p.on('pageerror', e => erros.push('celular: ' + e.stack));
  await p.goto(url + 'admin.html'); await p.waitForSelector('.nums');
  const larg = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  confere('celular: a página não rola para o lado', larg);
  await foto(p, 'celular-1-resumo.png', true);
  await p.click('[data-k="bandas"]'); await foto(p, 'celular-2-bandas.png', true);
  confere('celular: sem rolagem para o lado em Bandas', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await ctx.close();

  confere('sem erros de JavaScript', !erros.length, erros.join('\n'));
  await b.close(); srv.close();
  console.log(falhas.length ? `\n${falhas.length} falharam, ${ok} ok` : `\nTudo certo (${ok})`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
