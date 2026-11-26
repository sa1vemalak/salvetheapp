const { chromium } = require('playwright');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const step = async (n, f) => { try { await f(); console.log('ok  ', n); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]); await p.screenshot({ path: out + 'fail.png' }); console.log('erros', errs); await b.close(); process.exit(1); } };
  let sent = null;
  await p.route('**/agente', async r => {
    sent = JSON.parse(r.request().postData()); const auth = r.request().headers()['authorization'] || '';
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
      texto: 'Preparei 5 mudanças para você aprovar.' + (auth.length > 100 ? '' : ' [SEM TOKEN]'), podeAplicar: true,
      proposta: { resumo: 'Ajustes de teste', mudancas: [
        { tipo: 'anotar', musica: 'musica-a', parte: 'trumpet', compasso: 3, texto: 'respira', descricao: 'x' },
        { tipo: 'ordem_show', ordem: ['musica-b', 'musica-a'], descricao: 'x' },
        { tipo: 'marcador_daw', musica: 'musica-b', compasso_daw: 77, descricao: 'x' },
        { tipo: 'nota_musica', musica: 'musica-a', texto: 'Cuidado com a entrada do B', descricao: 'x' },
        { tipo: 'renomear_musica', musica: 'musica-b', titulo: 'Música B (nova)', rotulo: 'Bis', descricao: 'x' } ] } }) });
  });
  const mail = 'zz-test-caio-' + Date.now() + '@example.com';
  await step('criar conta e banda de teste', async () => {
    await p.goto('http://localhost:8795/'); await p.waitForSelector('.gate-tabs'); await p.click('text=Criar conta');
    await p.fill('input[autocomplete=name]', 'Teste Caio'); await p.fill('input[type=email]', mail); await p.fill('input[type=password]', 'teste12345'); await p.click('.gate-btn.primary');
    await p.waitForSelector('text=Bem-vindo', { timeout: 20000 }); await p.fill('input[aria-label="Nome da banda"]', 'ZZ Caio'); await p.click('text=Criar banda');
    await p.waitForSelector('.gate', { state: 'detached', timeout: 20000 }); });
  await step('colocar 2 músicas de teste no show', async () => {
    await p.evaluate(async () => {
      const { band, show } = SALVE.ctx(); const db = await window.claude.use('db');
      for (const [id, t] of [['musica-a', 'Música A'], ['musica-b', 'Música B']]) {
        await db.collection('songs').doc(id).set({ title: t, tag: '', notes: '', parts: [{ key: 'trumpet', name: 'Trompete', src: 'x.pdf' }] });
        await db.collection('layout').doc(id).set({ parts: { trumpet: { boxes: [[1, 1, 1, .1, .2, .3, .25], [2, 1, 1, .3, .2, .5, .25], [3, 1, 1, .5, .2, .7, .25]] } } });
      }
      await SALVE.saveShow(show, { order: ['musica-a', 'musica-b'] });
    });
    await p.reload(); await p.waitForTimeout(3000); });
  await step('abrir o Caio e perguntar', async () => {
    await p.click('.home button:has-text("Música A")'); await p.waitForTimeout(800);
    await p.click('#caioBtn'); await p.waitForSelector('.caio-hints'); await p.screenshot({ path: out + 'caio-vazio.png' });
    await p.fill('#caioTxt', 'faz uns ajustes de teste'); await p.click('#caioGo');
    await p.waitForSelector('.caio-prop', { timeout: 15000 });
    console.log('      -> enviado:', JSON.stringify(sent).slice(0, 160)); await p.screenshot({ path: out + 'caio-proposta.png' }); });
  await step('aplicar e conferir no banco', async () => {
    await p.click('.caio-prop .btn.primary'); await p.waitForFunction(() => /Aplicado|Apliquei/.test(document.querySelector('.caio-prop')?.textContent || ''), null, { timeout: 20000 });
    console.log('      ->', await p.textContent('.caio-prop .hint'));
    const r = await p.evaluate(async () => {
      const db = await window.claude.use('db'); const g = async (c, id) => (await db.collection(c).doc(id).get()).data();
      const vs = await new Promise(res => { const un = db.collection('versions').where('song', '==', 'musica-a').onSnapshot(s => { un(); res(s.docs.length); }); });
      return { ann: (await g('ann', 'musica-a__trumpet__1'))?.notes, ordem: SALVE.ctx().order, cfg: (await g('logic', 'config'))?.switchBars, a: (await g('songs', 'musica-a'))?.notes, b: (await g('songs', 'musica-b'))?.title, versoesA: vs };
    });
    console.log('      ->', JSON.stringify(r)); await p.screenshot({ path: out + 'caio-aplicado.png' }); });
  console.log('uid', await p.evaluate(() => SALVE.ctx().user?.uid), 'erros', errs);
  await b.close();
})();
