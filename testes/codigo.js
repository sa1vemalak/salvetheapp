const { chromium } = require('playwright');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const step = async (n, f) => { try { await f(); console.log('ok  ', n); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]); await p.screenshot({ path: out + 'fail.png' }); console.log('erros', errs); await b.close(); process.exit(1); } };
  const mail = 'zz-test-cod-' + Date.now() + '@example.com';
  await step('conta nova vê o campo de código', async () => {
    await p.goto('http://localhost:8795/'); await p.waitForSelector('.gate-tabs'); await p.click('text=Criar conta');
    await p.fill('input[autocomplete=name]', 'Teste Codigo'); await p.fill('input[type=email]', mail); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
    await p.waitForSelector('input[aria-label="Código de acesso"]', { timeout: 20000 }); await p.screenshot({ path: out + 'codigo-tela.png' }); });
  await step('sem código não cria', async () => {
    await p.fill('input[aria-label="Nome da banda"]', 'ZZ Cod'); await p.click('text=Criar banda');
    await p.waitForFunction(() => /Digite o código/.test(document.querySelector('.gate-err')?.textContent || '')); });
  await step('código errado não cria', async () => {
    await p.fill('input[aria-label="Código de acesso"]', 'XXXXXX'); await p.click('text=Criar banda');
    await p.waitForFunction(() => /não encontrado/.test(document.querySelector('.gate-err')?.textContent || ''), null, { timeout: 15000 }); });
  await step('código certo cria a banda', async () => {
    await p.fill('input[aria-label="Código de acesso"]', 'zzteste1'); await p.click('text=Criar banda');
    await p.waitForSelector('.gate', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(2500); await p.screenshot({ path: out + 'inicio-vazio.png' }); });
  await step('tela inicial tem Adicionar música', async () => { await p.waitForSelector('#homeAdd:not([hidden])'); await p.waitForSelector('.setfirst .btn'); });
  await step('enviar uma música com PDF', async () => {
    await p.click('.setfirst .btn'); await p.waitForSelector('#newFiles');
    await p.setInputFiles('#newFiles', __dirname + '/parte-teste.pdf'); await p.fill('#newTitle', 'Música Teste');
    await p.fill('#fileList input', 'Trompete'); await p.click('#doAdd');
    await p.waitForSelector('#doAdd', { state: 'detached', timeout: 60000 });
    await p.waitForSelector('.songrow:has-text("Música Teste")', { timeout: 15000 }); await p.screenshot({ path: out + 'inicio-com-musica.png' }); });
  await step('abrir a música mostra o PDF', async () => {
    await p.click('.songrow:has-text("Música Teste")');
    await p.waitForSelector('canvas', { timeout: 30000 }); await p.waitForTimeout(1500); await p.screenshot({ path: out + 'musica-aberta.png' }); });
  await step('o código já usado não cria segunda banda', async () => {
    const r = await p.evaluate(async () => { try { await SALVE.ctx(); const x = await (async () => { const m = await import('data:text/javascript,export default 1').catch(() => null); return m; })(); return 'skip'; } catch (e) { return e.message; } });
    await p.evaluate(() => SALVE.switchBand()); await p.waitForSelector('input[aria-label="Código de acesso"]', { timeout: 20000 });
    await p.fill('input[aria-label="Nome da banda"]', 'ZZ Cod 2'); await p.fill('input[aria-label="Código de acesso"]', 'ZZTESTE1'); await p.click('text=Criar banda');
    await p.waitForFunction(() => /máximo/.test(document.querySelector('.gate-err')?.textContent || ''), null, { timeout: 15000 });
    console.log('      ->', await p.textContent('.gate-err')); });
  console.log('uid', await p.evaluate(() => SALVE.ctx().user?.uid), 'erros', errs);
  await b.close();
})();
