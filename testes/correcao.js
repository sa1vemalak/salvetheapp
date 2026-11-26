const { chromium } = require('playwright');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const step = async (n, f) => { const t0 = Date.now(); try { await f(); console.log('ok  ', n, Math.round((Date.now() - t0) / 1000) + 's'); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]); await p.screenshot({ path: out + 'fail.png' }); console.log('erros', errs); await b.close(); process.exit(1); } };
  await p.route('**/agente', async r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
    texto: 'Li o compasso 9 do trompete: A4 D5 G4 B4. Proponho trocar a última nota por Dó.', podeAplicar: true,
    proposta: { resumo: 'Corrigir o compasso 9 do trompete', mudancas: [{ tipo: 'corrigir_notas', musica: 'teste-do-robo', parte: 'trompete-em-b', compasso: 9, notas: 'A4:1 D5:1 G4:1 C5:1', descricao: 'a última nota é Dó, não Si' }] } }) }));
  await step('conta, banda e envio do PDF', async () => {
    await p.goto('http://localhost:8795/'); await p.waitForSelector('.gate-tabs'); await p.click('text=Criar conta');
    await p.fill('input[autocomplete=name]', 'Teste Correcao'); await p.fill('input[type=email]', 'zz-test-corr-' + Date.now() + '@example.com'); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
    await p.waitForSelector('input[aria-label="Código de acesso"]', { timeout: 20000 });
    await p.fill('input[aria-label="Nome da banda"]', 'ZZ Correcao'); await p.fill('input[aria-label="Código de acesso"]', 'ZZCORR01'); await p.click('text=Criar banda');
    await p.waitForSelector('.gate', { state: 'detached', timeout: 20000 });
    await p.click('.setfirst .btn'); await p.setInputFiles('#newFiles', __dirname + '/../rtest/grade-teste.pdf');
    await p.fill('#newTitle', 'Teste do Robô'); await p.fill('#fileList input', 'Grade'); await p.click('#doAdd');
    await p.waitForSelector('#doAdd', { state: 'detached', timeout: 60000 }); });
  await step('robô gera o áudio', async () => {
    await p.click('.songrow'); await p.waitForTimeout(1000);
    if ((await p.getAttribute('#playerBtn', 'aria-pressed')) !== 'true') await p.click('#playerBtn');
    await p.waitForFunction(() => !document.querySelector('#pControls').hidden, null, { timeout: 15 * 60e3 }); });
  const song = () => p.evaluate(async () => (await (await window.claude.use('db')).collection('songs').doc('teste-do-robo').get()).data());
  const lidoAntes = (await song()).player.lido;
  await step('Caio propõe a correção e eu aprovo', async () => {
    await p.click('#caioBtn'); await p.fill('#caioTxt', 'no compasso 9 do trompete a última nota é dó'); await p.click('#caioGo');
    await p.waitForSelector('.caio-prop'); console.log('      ->', (await p.textContent('.caio-prop label')).trim());
    await p.screenshot({ path: out + 'correcao-proposta.png' });
    await p.click('.caio-prop .btn.primary'); await p.waitForFunction(() => /Aplicado|Apliquei/.test(document.querySelector('.caio-prop')?.textContent || ''), null, { timeout: 20000 });
    console.log('      ->', (await p.textContent('.caio-prop .hint')).trim()); await p.click('#caioX'); });
  await step('robô refaz o áudio com a correção', async () => {
    let s2 = null; const t0 = Date.now();
    while (Date.now() - t0 < 15 * 60e3) { s2 = await song(); if (s2?.player?.lido && s2.player.lido !== lidoAntes) break; await p.waitForTimeout(5000); }
    if (!s2 || s2.player.lido === lidoAntes) throw new Error('o áudio não foi refeito');
    const xml = await p.evaluate(async u => (await fetch(u)).text(), s2.player.lido);
    const r = { fila: (s2.correcoes || []).length, hist: (s2.historicoCorrecoes || []).length, fonte: s2.player.source, xml };
    console.log('      -> fila de correções:', r.fila, '| histórico:', r.hist, '| fonte:', r.fonte);
    require('fs').writeFileSync(__dirname + '/../rtest/lido-corrigido.musicxml', r.xml); await p.screenshot({ path: out + 'correcao-pronta.png' }); });
  console.log('uid', await p.evaluate(() => SALVE.ctx().user.uid), 'erros', errs);
  await b.close();
})();
