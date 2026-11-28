const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost' } });
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForSelector('input[type=email]', { timeout: 30000 });
  await p.fill('input[type=email]', process.argv[2]); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
  await p.waitForTimeout(9000); const t = await p.$('.gate-item'); if (t) { await t.click(); await p.waitForTimeout(8000); }
  await p.screenshot({ path: 'ltest/visual/celular-2-home.png' });
  await p.locator('text=Capricorniana (só áudio)').locator('visible=true').first().click(); await p.waitForTimeout(5000);
  await p.click('#sideRBtn'); await p.waitForTimeout(500); await p.screenshot({ path: 'ltest/visual/celular-4-ferramentas.png' });
  await p.click('#notesBtn'); await p.waitForTimeout(800); console.log('gaveta fechou depois de escolher:', !(await p.evaluate(() => document.body.classList.contains('abreR'))));
  await p.screenshot({ path: 'ltest/visual/celular-4b-notas.png' });
  await p.evaluate(() => { document.querySelectorAll('.drawer, .scrim').forEach(x => x.remove()); });
  await p.click('#annotBtn'); await p.waitForTimeout(400); await p.screenshot({ path: 'ltest/visual/celular-5-anotar.png' });
  console.log('ferramenta ao abrir:', await p.$eval('.tool[data-tool=pen]', x => x.getAttribute('aria-pressed')));
  await p.click('#annotBtn'); console.log('ao fechar volta a ler:', await p.$eval('.tool[data-tool=read]', x => x.getAttribute('aria-pressed')));
  console.log('erros:', errs.length ? errs : 'nenhum'); await b.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
