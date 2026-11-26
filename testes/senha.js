const { chromium } = require('playwright');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
  const step = async (n, f) => { try { await f(); console.log('ok  ', n); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]); await p.screenshot({ path: out + 'fail.png' }); throw e; } };
  const mail = 'zz-test-senha-' + Date.now() + '@example.com';
  await step('tela de login', async () => { await p.goto('http://localhost:8795/'); await p.waitForSelector('.gate-tabs'); });
  await step('senha errada mostra mensagem', async () => {
    await p.fill('input[type=email]', 'ninguem-zz@example.com'); await p.fill('input[type=password]', 'errada123'); await p.click('.gate-btn.primary');
    await p.waitForFunction(() => /incorretos|Não existe/.test(document.querySelector('.gate-msg')?.textContent || ''), null, { timeout: 15000 });
    console.log('      ->', await p.textContent('.gate-msg')); });
  await step('criar conta', async () => {
    await p.click('text=Criar conta'); await p.screenshot({ path: out + 'criar-conta.png' });
    await p.fill('input[autocomplete=name]', 'Teste Senha'); await p.fill('input[type=email]', mail); await p.fill('input[type=password]', 'teste12345');
    await p.click('.gate-btn.primary'); await p.waitForSelector('text=Bem-vindo', { timeout: 20000 }); });
  await step('criar primeira banda', async () => {
    await p.fill('input[aria-label="Nome da banda"]', 'ZZ Banda Um'); await p.click('text=Criar banda');
    await p.waitForSelector('.gate', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(1500); });
  await step('Banda › Criar outra banda abre a escolha', async () => {
    await p.click('#homeBand'); await p.click('#bNewBand');
    await p.waitForSelector('text=Suas bandas', { timeout: 20000 }); await p.screenshot({ path: out + 'outra-banda.png' }); });
  await step('criar segunda banda', async () => {
    await p.fill('input[aria-label="Nome da banda"]', 'ZZ Banda Dois'); await p.click('text=Criar banda');
    await p.waitForSelector('.gate', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(1000);
    console.log('      -> aberta:', await p.evaluate(() => SALVE.ctx().bandName || SALVE.ctx().band)); });
  await step('trocar de banda lista as duas', async () => {
    await p.click('#homeBand'); await p.click('#bOther'); await p.waitForSelector('text=Suas bandas');
    console.log('      ->', (await p.$$eval('.gate-item b', e => e.map(x => x.textContent))).join(' | ')); });
  await step('sair e entrar de novo com a senha', async () => {
    await p.click('.gate-foot .gate-link'); await p.waitForSelector('.gate-tabs', { timeout: 15000 });
    await p.fill('input[type=email]', mail); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
    await p.waitForSelector('text=Suas bandas', { timeout: 20000 }); });
  console.log('uid', await p.evaluate(() => SALVE.ctx().user?.uid || window.fbAuth?.user?.uid || ''), 'erros:', errs);
  await b.close();
})().catch(() => process.exit(1));
