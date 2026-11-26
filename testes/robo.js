const { chromium } = require('playwright');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const step = async (n, f) => { const t0 = Date.now(); try { await f(); console.log('ok  ', n, Math.round((Date.now() - t0) / 1000) + 's'); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]); await p.screenshot({ path: out + 'fail.png' }); console.log('erros', errs); await b.close(); process.exit(1); } };
  await step('conta + banda com código', async () => {
    await p.goto('http://localhost:8795/'); await p.waitForSelector('.gate-tabs'); await p.click('text=Criar conta');
    await p.fill('input[autocomplete=name]', 'Teste Robo'); await p.fill('input[type=email]', 'zz-test-robo-' + Date.now() + '@example.com'); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
    await p.waitForSelector('input[aria-label="Código de acesso"]', { timeout: 20000 });
    await p.fill('input[aria-label="Nome da banda"]', 'ZZ Robo UI'); await p.fill('input[aria-label="Código de acesso"]', 'ZZROBO01'); await p.click('text=Criar banda');
    await p.waitForSelector('.gate', { state: 'detached', timeout: 20000 }); });
  await step('enviar o PDF da grade', async () => {
    await p.click('.setfirst .btn'); await p.setInputFiles('#newFiles', __dirname + '/../rtest/grade-teste.pdf');
    await p.fill('#newTitle', 'Teste do Robô'); await p.fill('#fileList input', 'Grade'); await p.click('#doAdd');
    await p.waitForSelector('#doAdd', { state: 'detached', timeout: 60000 }); });
  await step('setlist mostra o robô trabalhando', async () => { await p.waitForSelector('.songrow:has-text("robô")', { timeout: 60000 }); console.log('      ->', (await p.textContent('.songrow')).replace(/\s+/g, ' ')); await p.screenshot({ path: out + 'robo-setlist.png' }); });
  await step('abrir a música e o player mostra o progresso', async () => {
    await p.click('.songrow'); await p.waitForTimeout(1500);
    if ((await p.getAttribute('#playerBtn', 'aria-pressed')) !== 'true') await p.click('#playerBtn');
    await p.waitForSelector('.robo-bar', { timeout: 20000 }); await p.screenshot({ path: out + 'robo-progresso.png' }); });
  await step('robô termina e o player aparece com os instrumentos', async () => {
    await p.waitForSelector('#pMix .mixch', { timeout: 15 * 60e3 }); await p.waitForFunction(() => !document.querySelector('#pControls').hidden, null, { timeout: 60000 });
    console.log('      -> mixer:', (await p.$$eval('#pMix .mixch', x => x.map(b => b.textContent.trim()))).join(' | '));
    console.log('      -> aviso:', (await p.textContent('#pMsg')).replace(/\s+/g, ' ').slice(0, 200));
    await p.screenshot({ path: out + 'robo-pronto.png' }); });
  await step('tocar alguns segundos', async () => {
    await p.click('#pPlay'); await p.waitForTimeout(4000);
    const t = await p.evaluate(() => document.querySelector('#pCur').textContent); console.log('      -> tempo no player:', t);
    await p.click('#pMix .mixch'); await p.waitForTimeout(1500); await p.screenshot({ path: out + 'robo-tocando.png' }); });
  console.log('uid', await p.evaluate(() => SALVE.ctx().user.uid), 'erros', errs);
  await b.close();
})();
