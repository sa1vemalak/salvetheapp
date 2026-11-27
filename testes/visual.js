const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost' } });
  for (const [tag, opt] of [['celular', { ...devices['iPhone 13'] }], ['ipad', { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 }]]) {
    const ctx = await b.newContext({ ...opt, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    await p.goto('http://localhost:8765/');
    await p.waitForSelector('input[type=email]', { timeout: 30000 });
    await p.screenshot({ path: `ltest/visual/${tag}-0-login.png` });
    await p.fill('input[type=email]', process.argv[2]); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
    await p.waitForTimeout(9000);
    await p.screenshot({ path: `ltest/visual/${tag}-1-entrada.png` });
    const t = await p.$('.gate-item'); if (t) { await t.click(); await p.waitForTimeout(9000); }
    await p.screenshot({ path: `ltest/visual/${tag}-2-home.png` });
    const items = await p.$$eval('button, a', els => els.filter(e => e.offsetParent).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean));
    console.log(tag, 'botões visíveis na tela inicial:', items.length, JSON.stringify(items.slice(0, 60)));
    // open a song
    const s = p.locator('text=Capricorniana (só áudio)').locator('visible=true').first(); if (await s.count()) { await s.click(); await p.waitForTimeout(8000); }
    await p.screenshot({ path: `ltest/visual/${tag}-3-musica.png` });
    const items2 = await p.$$eval('button, a', els => els.filter(e => e.offsetParent).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean));
    console.log(tag, 'botões visíveis na música:', items2.length, JSON.stringify(items2.slice(0, 70)));
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
