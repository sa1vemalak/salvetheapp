/* Enviar várias partituras de uma vez: o app descobre sozinho de que música é cada arquivo, qual é a parte
   (trompete, sax, trombone, base, grade…) e se é uma versão nova; mostra um resumo para conferir e só então salva.
   Tudo é lido aqui no aparelho (texto do PDF, MusicXML, MuseScore e o nome do arquivo): não gasta nada dos robôs.
   As regras de identificação são puras (sem tela) para os testes rodarem igual no Node e no navegador. */
(function (root) {
  'use strict';

  /* ---------- texto ---------- */
  const semAcento = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const norm = s => semAcento(s).toLowerCase().replace(/♭/g, 'b').replace(/♯/g, '#').replace(/[^a-z0-9#]+/g, ' ').trim();
  const slug = s => semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'parte';

  /* ---------- instrumentos ---------- (a ordem importa: "Tenor Trombone" é trombone, "Bass Clarinet" é clarinete) */
  const INST = [
    { k: 'grade', n: 'Grade', re: /\b(grade|full score|score|partitura (inteira|completa|geral|toda)|partitura geral|conductor)\b/ },
    { k: 'metais', n: 'Metais', re: /\b(metais|naipe de metais|horn section|horns(?! in)|brass( section)?|sopros|winds)\b/ },
    { k: 'trombone', n: 'Trombone', re: /\b(trombones?|tbns?|trb|tromb)\b/ },
    { k: 'trumpet', n: 'Trompete (B♭)', re: /\b(trompetes?|trumpets?|tpts?|trp|flugelhorn\w*|flugel\w*|flgh|flug|fliscorne|cornet\w*)\b/ },
    { k: 'trompa', n: 'Trompa', re: /\b(trompas?|french horns?|horns? in f|horn|hn|hns)\b(?! section)/ },
    { k: 'clarinete', n: 'Clarinete', re: /\b(clarinet\w*|clarone|requinta|cl)\b/ },
    { k: 'tenor-sax', n: 'Tenor Sax', re: /\b(sax\w* tenor|tenor sax\w*|ten sax|sax ten|t sx|t sax|sax t|ts)\b|\btenor\b(?! (trombone|voice|voz|horn|drum))/ },
    { k: 'alto-sax', n: 'Alto Sax', re: /\b(sax\w* alto|alto sax\w*|a sax|a sx|alto sx|sax a|as)\b|\balto\b(?! (voice|voz|flute|flauta|horn))/ },
    { k: 'bari-sax', n: 'Sax Barítono', re: /\b(sax\w* bar\w*|bar\w* sax\w*|bari sax|bari|b sx|bs)\b/ },
    { k: 'soprano-sax', n: 'Sax Soprano', re: /\b(sax\w* soprano|soprano sax\w*|s sx)\b/ },
    { k: 'sax', n: 'Sax', re: /\b(saxofones?|saxophones?|saxes|sax)\b/ },
    { k: 'tuba', n: 'Tuba', re: /\b(tuba|bombardino|euphonium|sousafone|sousaphone)\b/ },
    { k: 'flauta', n: 'Flauta', re: /\b(flautas?|flutes?|flautim|piccolo|pifano|fl)\b/ },
    { k: 'base', n: 'Base', re: /\b(base|cifras?|harmonia|rhythm section|rhythm|chord chart|chords?|lead sheet)\b/ },
    { k: 'base', n: 'Base', re: /\b(electric piano|e ?pno|el pno|piano|pno|teclados?|keys|keyboards?|rhodes|wurli\w*|orgao|organ|synthesizer|synth\w*|sintetizador)\b/ },
    { k: 'bateria', n: 'Bateria', re: /\b(bateria|drum ?set|drumset|drum kit|drums?|bat|percuss\w*|perc)\b/ },
    { k: 'baixo', n: 'Baixo', re: /\b(baixo eletrico|baixo acustico|contrabaixo|electric bass|el bass|e bass|acoustic bass|double bass|contrabass|bass guitar|baixo|bass|bx)\b(?! (drum|voice|voz|clarinet|trombone))/ },
    { k: 'guitarra', n: 'Guitarra', re: /\b(acoustic guitar|electric guitar|guitarras?|guitars?|violao|gtr|cavaquinho|cavaco)\b/ },
    { k: 'violino', n: 'Violino', re: /\b(violinos?|violins?|vln|vl)\b/ },
    { k: 'cordas', n: 'Cordas', re: /\b(cordas|strings|viola|violoncelo|cello|vc)\b/ },
    { k: 'voz', n: 'Voz', re: /\b(voz|vozes|vocal|vocals|voice|canto|melodia|coro|choir)\b/ },
  ];
  const ROMANO = { i: 1, ii: 2, iii: 3, iv: 4 };
  /* "Trompete 2", "2º Trompete", "Trumpet II in B♭": o número da parte (um naipe com dois trompetes tem duas partes) */
  function numeroDa(t, m) {
    const depois = t.slice(m.index + m[0].length).match(/^\s*(\d|i{1,3}|iv)\b(?!\s*(de|of)\b)/);
    const antes = t.slice(0, m.index).match(/\b(\d)\s*(o|a|º|ª|st|nd|rd|th)?\s*$/);
    const v = depois ? depois[1] : antes ? antes[1] : null;
    if (!v) return null;
    const n = ROMANO[v] || +v;
    return n >= 1 && n <= 4 ? n : null;
  }
  /* o instrumento de um texto curto ("Trumpet in B♭", "Sax Tenor 2", "GRADE"), ou null */
  const RECHEIO = /\b(in|em|en|de|do|da|di|the|and|e|com|with|b|bb|sib|si|eb|mib|mi|f|fa|c|g|sol|a|la|d|re|part|parte|solo|soli|i|ii|iii|iv|\d+|\d+(st|nd|rd|th|o|a)|sounding|concert|pitch|som real|transposed|transposto|transposta|surdina|mute|opcional|optional|opt|sec|section|naipe|e|y|ossia|div|unis|tutti)\b|[#()\[\].,:;\/+&-]/g;
  function instrumento(txt) {
    const t = norm(txt);
    if (!t || t.length > 48) return null;
    // só vale se o texto for o nome do instrumento: "Canto de Ossanha" e "As Rosas" são músicas, não canto nem sax alto
    let sobra = t;
    for (const I of INST) sobra = sobra.replace(new RegExp(I.re.source, 'g'), ' ');
    if (sobra.replace(RECHEIO, ' ').trim()) return null;
    for (const I of INST) {
      const m = t.match(I.re);
      if (!m) continue;
      const num = I.k === 'grade' || I.k === 'base' ? null : numeroDa(t, m);
      return { key: num ? I.k + '-' + num : I.k, name: num ? I.n.replace(/ \(B♭\)$/, '') + ' ' + num + (I.k === 'trumpet' ? ' (B♭)' : '') : I.n, base: I.k };
    }
    return null;
  }
  /* nomes que o celular, o scanner ou o WhatsApp dão: não dizem a música */
  const NOME_GENERICO = /^(documento|document|doc|scan|scanned|digitaliza\w*|img|image|imagem|foto|photo|arquivo|file|untitled|sem titulo|novo documento|partitura|partituras|score|parte|part|download|whatsapp|cam ?scanner|adobe scan|pdf|print|captura|screenshot)( .*)?$|^\d[\d ]*$/;
  const PASTA_GENERICA = /^(pdf|pdfs|partituras?|scores?|parts|partes|downloads?|arquivos?|files?|musicas|músicas|nova pasta|new folder|exports?|desktop|mesa|documentos|documents|untitled folder|sem titulo)$/;
  const PARTE_GENERICA = /^(part|parte|staff|pauta|instrument|instrumento)\s*\d*$/;

  /* ---------- versão ---------- */
  /* "v3", "versão 2", "rev 4", "final", "2024-03-15 0930": quanto maior, mais nova */
  function versaoDoNome(nome) {
    const t = semAcento(nome).toLowerCase();
    let n = 0, rotulo = '';
    const v = t.match(/(?:^|[^a-z])(?:v|rev)\.?\s?(\d{1,3})(?![\d-])|(?:versao|version|revisao|revision)\s*(\d{1,3})(?!\d)/);
    if (v) { n = +(v[1] || v[2]); rotulo = 'versão ' + n; }
    if (/(?:^|[^a-z])(final|definitiva|ok)(?:[^a-z]|$)/.test(t)) { n = Math.max(n, 500); rotulo = rotulo || 'final'; }
    const d = t.match(/(20\d\d)[-_.](\d\d)[-_.](\d\d)(?:[ _-]?(\d{4}))?/);
    const data = d ? +(d[1] + d[2] + d[3] + (d[4] || '0000')) : 0;
    if (d && !rotulo) rotulo = `de ${d[3]}/${d[2]}/${d[1]}`;
    return { n, data, rotulo };
  }
  const comparaVersao = (a, b) => (a.versao.n - b.versao.n) || (a.versao.data - b.versao.data) || ((a.modificado || 0) - (b.modificado || 0));

  /* ---------- nome do arquivo ---------- */
  const RUIDO = /(?:^|[\s_.-])(v|rev)\.?\s?\d{1,3}(?=$|[\s_.-])|(?:^|[\s_.-])(versao|versão|version|revisao|revisão)\s*\d{1,3}(?=$|[\s_.-])|(?:^|[\s_.-])(final|definitiva|ok|copia|copy|editado|corrigido|corrigida)(?=$|[\s_.-])|20\d\d[-_.]\d\d[-_.]\d\d(?:[ _-]?\d{4})?|\(\d+\)/gi;
  function limpaTitulo(s) {
    return String(s || '')
      .replace(RUIDO, ' ')
      .replace(/^\s*(?:#\d{1,3}\s*[-._)]?\s*|\d{1,3}\s*[-._)]\s*|\d{1,3}\s+(?!(anos|dias|horas|vezes|minutos|segundos|graus|mil|reais|years|days|hours|times|de|of)\b)(?=\D))/i, '')   // número da faixa: "06 Céu Azul", "#3 - Paris" (mas "10 Anos de Estrada" fica)
      .replace(/[_]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, '').trim();
  }
  /* "06 Céu Azul - Trompete.pdf" -> música "Céu Azul", parte trompete; "Paris - Fulano.pdf" -> música
     "Paris" (o resto pode ser o artista); "Metais - Teu Popô - Trompete em Sib - 2024-03-15 0930.sib" -> trompete */
  function doNome(nomeArquivo) {
    const base = String(nomeArquivo || '').split(/[\\/]/).pop().replace(/\.[a-z0-9]{2,8}$/i, '');
    const versao = versaoDoNome(base);
    let pedacos = base.split(/\s+[-–—]\s+|\s*_-_\s*|\s*\|\s*/).map(x => x.trim()).filter(Boolean);
    if (pedacos.length === 1) {  // "Paris_Trompete", "Paris-Trumpet", "Paris Trompete"
      const limpo = limpaTitulo(base.replace(/[_]+/g, ' ')).replace(/\s*[-–]\s*/g, ' ');
      const ps = limpo.split(/\s+/);
      for (let n = Math.min(4, ps.length - 1); n >= 1; n--) {  // as últimas 1 a 4 palavras são o instrumento? ("Paris Tenor Trombone")
        if (instrumento(ps.slice(-n).join(' '))) { pedacos = [ps.slice(0, -n).join(' '), ps.slice(-n).join(' ')]; break; }
      }
    }
    let parte = null, generica = false;
    const resto = [];
    for (let i = pedacos.length - 1; i >= 0; i--) {
      const p = pedacos[i], semRuido = limpaTitulo(p);
      const inst = instrumento(semRuido) || instrumento(p);  // "(1)" de arquivo baixado duas vezes não é a parte 1
      if (inst && inst.base !== 'metais') { if (!parte) parte = inst; continue; }
      if (/^[^#]{0,24}#\s*\d+$/.test(semRuido) && pedacos.length > 1) continue;  // "Poesia #3": número no show, não é o nome
      if (PARTE_GENERICA.test(norm(semRuido))) { generica = true; continue; }
      if (!semRuido || /^\d+$/.test(semRuido)) continue;
      resto.unshift({ txt: semRuido, inst });
    }
    if (!parte && resto.some(r => r.inst && r.inst.base === 'metais') && resto.length > 1) parte = { key: 'grade', name: 'Grade', base: 'grade' };
    const nomes = resto.filter(r => !(r.inst && r.inst.base === 'metais' && resto.length > 1)).map(r => r.txt);
    const titulo = nomes[0] && !NOME_GENERICO.test(norm(nomes[0])) ? nomes[0] : '';
    return { titulo, outros: nomes.slice(1), parte, generica, versao, comMetais: nomes.length < resto.length };
  }

  /* ---------- texto do PDF ---------- */
  /* linhas = [{ t, size, x, y, w }] da 1ª página, com x/y/w de 0 a 1 (y = 0 no alto da página) */
  const MUSICAL = /[-]|[𝄀-𝇿]/u;
  const CREDITO = /^\s*(arr|arranjo|arranjador|arranged|arrangement|music|m[uú]sica|letra|lyrics|words|comp|composer|compositor|composi[cç][aã]o|autor|autoria|transcri\w*|orquestra\w*|edi[cç][aã]o|editor|by|de:|feat|ft)\b|\b(arr\.|arranjo:|arranged by|music by|words by|lyrics by|composed by|transcri[cç][aã]o|copyright|todos os direitos|all rights|p[aá]gina \d|page \d)|©|\(c\)|www\.|https?:|\d+\s*\/\s*\d+\s*$/i;
  const ANDAMENTO = /^(\s*[♩♪𝅘𝅥]|q\s*=|\d{2,3}\s*bpm|tempo|swing|samba|bossa|funk|ballad|balada|rock|pop|groove|moderato|allegro|andante|adagio|presto|largo|lento|rubato|medium|med\.|fast|slow|ijexa|baiao|xote|frevo|maracatu|reggae|latin|shuffle|straight|afro|d\.?\s?s\.?|d\.?\s?c\.?|to coda|coda|fine|rit\.?|rall\.?|a tempo|cresc\.?|dim\.?|solo|tutti|(p{1,3}|f{1,3}|mp|mf|sfz|fp)\s*$)/i;
  const NAO_TITULO = t => {
    const n = norm(t);
    return !n || n.length < 2 || /^\d+$/.test(n) || MUSICAL.test(t) || CREDITO.test(t) || ANDAMENTO.test(t)
      || /^[a-g][#b]?(m|maj|min|dim|aug|sus|add|\d|\/|\(|$)/i.test(t.trim()) && t.trim().length <= 8  // cifra: "Cm7", "F/A"
      || /^[a-z]$/i.test(t.trim());  // letra de ensaio
  };
  function juntaLinhas(itens) {
    const ls = [];
    for (const it of itens.filter(i => i.t && i.t.trim()).sort((a, b) => a.y - b.y || a.x - b.x)) {
      const l = ls.find(l => Math.abs(l.y - it.y) < Math.max(0.006, it.size * 0.35) && Math.abs(l.size - it.size) < it.size * 0.25 && it.x >= l.x + l.w - 0.03 && it.x - (l.x + l.w) < 0.06);
      if (l) { l.t += (it.x - (l.x + l.w) > 0.004 ? ' ' : '') + it.t; l.w = Math.max(l.w, it.x + it.w - l.x); }
      else ls.push({ ...it });
    }
    return ls.map(l => ({ ...l, t: l.t.replace(/\s{2,}/g, ' ').trim() }));
  }
  function doTexto(itens) {
    if (!itens || !itens.length) return { semTexto: true };
    const linhas = juntaLinhas(itens).filter(l => !MUSICAL.test(l.t) || l.t.replace(/[-\s]/g, '').length > 3);
    if (!linhas.length) return { semTexto: true };
    const tams = linhas.map(l => l.size).sort((a, b) => a - b), mediana = tams[tams.length >> 1];
    const topo = linhas.filter(l => l.y < 0.3);
    // título: o maior texto no alto da página que não é crédito, andamento, cifra nem nome de instrumento
    // o maior texto do alto é o título mesmo que seja palavra de instrumento ("Harmonia", "Canto"); só "Grade/Score" grande não
    const maior = Math.max(...topo.map(l => l.size), 0);
    const ehTitulo = l => l.size >= maior * 0.97 && l.size >= mediana * 1.6 && !(instrumento(l.t) && instrumento(l.t).base === 'grade');
    const comoInst = l => !ehTitulo(l) && instrumento(l.t);
    const cands = topo.filter(l => !NAO_TITULO(l.t) && !comoInst(l) && l.size >= mediana * 1.25).sort((a, b) => b.size - a.size || a.y - b.y);
    let titulo = cands[0] ? cands[0].t : '';
    if (cands[1] && Math.abs(cands[1].size - cands[0].size) < 0.001 && Math.abs(cands[1].y - cands[0].y) < cands[0].size * 1.6) titulo += ' ' + cands[1].t;  // título em duas linhas
    const subtitulo = topo.find(l => l !== cands[0] && !NAO_TITULO(l.t) && !comoInst(l) && l.y > (cands[0] ? cands[0].y : 0) && l.size < (cands[0] ? cands[0].size : 1) && l.size >= mediana);
    // a parte: o nome do instrumento escrito no alto (cabeçalho das partes do MuseScore, Finale, Sibelius)
    const noTopo = topo.filter(l => !ehTitulo(l) || instrumento(l.t)?.base === 'grade').map(l => ({ l, inst: instrumento(l.t) })).filter(x => x.inst);
    const grade = noTopo.find(x => x.inst.base === 'grade');
    const cabecalho = noTopo.filter(x => x.l.y < 0.12 && !['metais', 'grade'].includes(x.inst.base)).sort((a, b) => a.l.y - b.l.y || a.l.x - b.l.x)[0];
    // na grade, cada pauta tem o nome à esquerda do 1º sistema; as deixas ("Tpt.") são bem menores que os nomes das pautas
    const daMargem = linhas.filter(l => l.x < 0.2 && l.y >= 0.12 && l.w < 0.3).map(l => ({ l, i: instrumento(l.t) })).filter(x => x.i && x.i.base !== 'grade');
    const tamPauta = Math.max(0, ...daMargem.map(x => x.l.size));
    const margem = daMargem.filter(x => x.l.size >= tamPauta * 0.8).map(x => x.i);
    const naMargem = [...new Map(margem.map(i => [i.base, i])).values()];  // "Trumpet 1" e "Trumpet 2" são o mesmo instrumento
    let parte = null, porque = '';
    if (grade) { parte = grade.inst; porque = 'escrito no alto da página'; }
    else if (naMargem.length >= 3 || (naMargem.length >= 2 && !cabecalho)) { parte = { key: 'grade', name: 'Grade', base: 'grade' }; porque = 'vários instrumentos na página, então é a grade'; }
    else if (cabecalho) { parte = cabecalho.inst; porque = `escrito no alto (“${cabecalho.l.t}”)`; }
    else if (noTopo.length) {
      const doCanto = noTopo.filter(x => x.inst.base !== 'metais').sort((a, b) => a.l.y - b.l.y || a.l.x - b.l.x)[0];
      if (doCanto) { parte = doCanto.inst; porque = `escrito no alto (“${doCanto.l.t}”)`; }
    }
    if (!parte && naMargem.length === 1) {
      const doMesmo = new Set(margem.map(i => i.key));
      const I = INST.find(x => x.k === naMargem[0].base);
      parte = doMesmo.size > 1 && I ? { key: I.k, name: I.n, base: I.k } : margem[0];  // "Trumpet 1" + "Trumpet 2" na mesma página: a parte dos trompetes
      porque = 'nome da pauta';
    }
    const versaoTxt = linhas.map(l => l.t).find(t => /\b(vers[aã]o|version|rev\.?)\s*\d/i.test(t));
    return { titulo: titulo.trim(), subtitulo: subtitulo ? subtitulo.t : '', parte, porque, versao: versaoTxt ? versaoDoNome(versaoTxt) : null, linhas: linhas.length };
  }

  /* ---------- MusicXML / MuseScore ---------- */
  function texto(no) { return no ? (no.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function doXml(xml, Parser) {
    const doc = new Parser().parseFromString(xml, 'application/xml');
    const tag = (n, r = doc) => r.getElementsByTagName(n);
    if (tag('museScore').length) {  // .mscx (dentro do .mscz)
      let titulo = '';
      for (const m of tag('metaTag')) if (m.getAttribute('name') === 'workTitle' && texto(m)) titulo = texto(m);
      if (!titulo) for (const t of tag('Text')) { const st = tag('style', t)[0]; if (st && /title/i.test(texto(st))) { titulo = texto(tag('text', t)[0] || t).replace(/^title\s*/i, ''); break; } }
      const partes = [...tag('Part')].map(p => texto(tag('trackName', p)[0]) || texto(tag('longName', p)[0])).filter(Boolean);
      return { titulo, partes };
    }
    let titulo = texto(tag('work-title')[0]) || texto(tag('movement-title')[0]);
    if (!titulo) {  // o título fica num "credit" com a maior fonte
      let maior = 0;
      for (const c of tag('credit-words')) { const s = parseFloat(c.getAttribute('font-size') || '0'); if (s > maior && !CREDITO.test(texto(c))) { maior = s; titulo = texto(c); } }
    }
    const partes = [...tag('score-part')].map(p => texto(tag('part-name', p)[0])).filter(Boolean);
    return { titulo, partes };
  }
  function deXml(info) {
    const insts = info.partes.map(instrumento).filter(Boolean);
    const unicos = [...new Map(insts.map(i => [i.key, i])).values()];
    let parte = null;
    if (info.partes.length > 1 && unicos.length !== 1) parte = { key: 'grade', name: 'Grade', base: 'grade' };
    else if (unicos.length === 1) parte = unicos[0];
    return { titulo: limpaTitulo(info.titulo), parte, partes: info.partes };
  }

  /* ---------- .zip, .mxl e .mscz (zip simples, lido aqui mesmo) ---------- */
  async function inflar(u8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('sem DecompressionStream');
    const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  /* lê o zip direto do arquivo, pedaço por pedaço (um .zip de 300 MB não cabe inteiro na memória do iPhone) */
  const MAX_ENTRADAS = 500, MAX_ARQ = 200 * 1024 * 1024;
  async function abreZip(fonte) {
    const blob = fonte instanceof Blob ? fonte : new Blob([fonte]);
    const pedaco = async (ini, fim) => new Uint8Array(await blob.slice(ini, fim).arrayBuffer());
    const cauda = await pedaco(Math.max(0, blob.size - 66000), blob.size), dc = new DataView(cauda.buffer);
    let fim = -1;
    for (let i = cauda.length - 22; i >= 0; i--) if (dc.getUint32(i, true) === 0x06054b50) { fim = i; break; }
    if (fim < 0) throw new Error('zip sem diretório');
    const qtd = Math.min(dc.getUint16(fim + 10, true), MAX_ENTRADAS), tamDir = dc.getUint32(fim + 12, true), iniDir = dc.getUint32(fim + 16, true);
    if (iniDir + tamDir > blob.size || tamDir > 8e6) throw new Error('zip estranho');
    const dir = await pedaco(iniDir, iniDir + tamDir), dv = new DataView(dir.buffer);
    const td = new TextDecoder('utf-8'), saida = [], usados = new Set();
    let p = 0;
    for (let k = 0; k < qtd && p + 46 <= dir.length && dv.getUint32(p, true) === 0x02014b50; k++) {
      const metodo = dv.getUint16(p + 10, true), comp = dv.getUint32(p + 20, true), tam = dv.getUint32(p + 24, true);
      const ln = dv.getUint16(p + 28, true), le = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true), local = dv.getUint32(p + 42, true);
      const nome = td.decode(dir.subarray(p + 46, p + 46 + ln));
      p += 46 + ln + le + lc;
      if (nome.endsWith('/') || usados.has(local) || tam > MAX_ARQ || comp > MAX_ARQ || local + 30 > blob.size) continue;  // pastas, entradas repetidas e gigantes ficam de fora
      usados.add(local);
      const conteudo = async () => {
        const cab = new DataView((await pedaco(local, local + 30)).buffer);
        const ini = local + 30 + cab.getUint16(26, true) + cab.getUint16(28, true), dados = blob.slice(ini, ini + comp);
        if (metodo === 0) return dados;
        if (metodo !== 8) throw new Error('zip com compressão ' + metodo);
        if (typeof DecompressionStream === 'undefined') throw new Error('sem DecompressionStream');
        let total = 0;
        const limite = new TransformStream({ transform(ch, c) { total += ch.length; if (total > MAX_ARQ) c.error(new Error('grande demais')); else c.enqueue(ch); } });
        return new Response(dados.stream().pipeThrough(new DecompressionStream('deflate-raw')).pipeThrough(limite)).blob();
      };
      saida.push({ nome, tam, blob: conteudo, ler: async () => new Uint8Array(await (await conteudo()).arrayBuffer()) });
    }
    return saida;
  }

  /* ---------- tipos de arquivo ---------- */
  const EXT = f => ((f.name || '').match(/\.([a-z0-9]{2,8})$/i) || [, ''])[1].toLowerCase();
  const ORIGINAL = { musicxml: 'MusicXML', xml: 'MusicXML', mxl: 'MusicXML', mscz: 'MuseScore', mscx: 'MuseScore', musx: 'Finale', mus: 'Finale', sib: 'Sibelius', dorico: 'Dorico', mid: 'MIDI', midi: 'MIDI', gp: 'Guitar Pro', gpx: 'Guitar Pro', gp5: 'Guitar Pro', gp4: 'Guitar Pro' };
  function tipoDe(f) {
    const e = EXT(f);
    if (e === 'pdf' || f.type === 'application/pdf') return 'pdf';
    if (e === 'zip' || f.type === 'application/zip' || f.type === 'application/x-zip-compressed') return 'zip';
    if (ORIGINAL[e]) return 'original';
    if (/^image\//.test(f.type) || /^(jpe?g|png|heic|heif|webp|gif|tiff?)$/.test(e)) return 'foto';
    if (/^audio\//.test(f.type) || /^(mp3|wav|m4a|aac|flac|ogg|aif|aiff)$/.test(e)) return 'audio';
    return 'outro';
  }
  const ESCONDIDO = n => /(^|\/)(__MACOSX|\.)/.test(n) || /(^|\/)(thumbs\.db|desktop\.ini)$/i.test(n);
  /* abre os .zip: cada arquivo de dentro vira um File (o nome da pasta ajuda a achar a música) */
  async function desembrulha(files, aviso) {
    const out = [];
    for (const f of files) {
      if (tipoDe(f) !== 'zip') { out.push(f); continue; }
      try {
        const ents = (await abreZip(f)).filter(e => !ESCONDIDO(e.nome));
        for (const e of ents) {
          const nome = e.nome.split('/').pop(), pasta = e.nome.split('/').slice(-2, -1)[0] || '';
          const probe = { name: nome, type: '' }, tipo = tipoDe(probe);
          if (['zip', 'outro'].includes(tipo)) continue;
          // gravação e foto só aparecem na lista do que fica de fora: não precisa abrir
          const corpo = ['audio', 'foto'].includes(tipo) ? new Blob([]) : await e.blob();
          const novo = new File([corpo], nome, { type: tipo === 'pdf' ? 'application/pdf' : '', lastModified: f.lastModified });
          Object.defineProperty(novo, 'pasta', { value: pasta }); Object.defineProperty(novo, 'doZip', { value: f.name });
          out.push(novo);
        }
      } catch (err) { if (aviso) aviso(f, err); out.push(f); }
    }
    return out;
  }

  /* ---------- estante: achar a música que já existe ---------- */
  const SO_TITULO = s => norm(limpaTitulo(String(s || '').replace(/#\s*\d+/g, ' '))).replace(/\b(poesia acustica|arr|arranjo|metais|naipe|grade|score|partitura|parte|part)\b/g, ' ').replace(/\s+/g, ' ').trim();
  function pares(s) { const r = new Map(); const t = s.replace(/\s/g, ''); for (let i = 0; i < t.length - 1; i++) { const p = t.slice(i, i + 2); r.set(p, (r.get(p) || 0) + 1); } return r; }
  function parecido(a, b) {
    a = SO_TITULO(a); b = SO_TITULO(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const pa = pares(a), pb = pares(b); let comum = 0, na = 0, nb = 0;
    pa.forEach(v => na += v); pb.forEach(v => nb += v);
    pa.forEach((v, k) => { comum += Math.min(v, pb.get(k) || 0); });
    let d = na + nb ? 2 * comum / (na + nb) : 0;
    const [curto, longo] = a.length <= b.length ? [a, b] : [b, a];
    if (curto.length >= 4 && (' ' + longo + ' ').includes(' ' + curto + ' ')) d = Math.max(d, 0.86);  // "Céu Azul" dentro de "Poesia #3 Céu Azul ao vivo"
    return d;
  }
  function achaMusica(titulos, musicas) {
    let melhor = null;
    for (const t of titulos.filter(Boolean)) for (const s of musicas) {
      const d = parecido(t, s.title);
      if (d >= 0.8 && (!melhor || d > melhor.d)) melhor = { s, d, t };
    }
    return melhor;
  }

  /* ---------- juntando tudo: um arquivo ---------- */
  /* lido = { nome, tipo, pasta?, modificado, pdf?: doTexto(), xml?: deXml() } -> palpite com o de onde veio cada coisa */
  function palpite(lido, musicas) {
    const pn = doNome(lido.nome), pasta = PASTA_GENERICA.test(norm(lido.pasta || '')) ? '' : lido.pasta || '', pp = doNome(pasta);
    const conteudo = lido.pdf || lido.xml || {};
    const tituloConteudo = limpaTitulo(conteudo.titulo || '');
    const tituloNome = pn.titulo, tituloPasta = pp.parte ? '' : pp.titulo;
    const naEstante = achaMusica([tituloConteudo, tituloNome, tituloPasta, conteudo.subtitulo, ...pn.outros], musicas);
    let titulo, deOnde, certo;
    if (naEstante) { titulo = naEstante.s.title; deOnde = 'já está na estante'; certo = true; }
    else if (tituloConteudo && tituloNome && parecido(tituloConteudo, tituloNome) >= 0.7) { titulo = tituloConteudo; deOnde = 'título da partitura e nome do arquivo'; certo = true; }
    else if (tituloConteudo) { titulo = tituloConteudo; deOnde = (lido.xml ? 'título do arquivo original' : 'título escrito na partitura') + (tituloNome ? ` (o nome do arquivo diz “${tituloNome}”)` : ''); certo = !tituloNome; }
    else if (tituloNome) { titulo = tituloNome; deOnde = 'nome do arquivo'; certo = !!pn.parte && !pn.outros.length && !pn.comMetais; }
    else if (tituloPasta) { titulo = tituloPasta; deOnde = 'nome da pasta'; certo = false; }
    else { titulo = ''; deOnde = ''; certo = false; }
    let parte = null, partePorque = '', parteCerta = false;
    const pc = conteudo.parte, pnm = pn.parte;
    const mesma = (a, b) => a.base === b.base || (b.base === 'sax' && /-sax$/.test(a.base)) || (a.base === 'sax' && /-sax$/.test(b.base));
    if (pc && pnm && mesma(pc, pnm)) { parte = pc.base === 'sax' ? pnm : pnm.base === 'sax' ? pc : pc.key.length >= pnm.key.length ? pc : pnm; partePorque = 'na partitura e no nome do arquivo'; parteCerta = true; }
    else if (pc) { parte = pc; partePorque = lido.pdf ? conteudo.porque || 'escrito na partitura' : 'instrumentos do arquivo original'; parteCerta = !pnm; }
    else if (pnm) { parte = pnm; partePorque = 'nome do arquivo'; parteCerta = true; }
    if (pc && pnm && !mesma(pc, pnm)) partePorque += ` (o nome do arquivo diz ${pnm.name})`;
    const v = [pn.versao, conteudo.versao].filter(Boolean).sort((a, b) => b.n - a.n || b.data - a.data)[0] || { n: 0, data: 0, rotulo: '' };
    const avisos = [];
    if (lido.pdf && lido.pdf.semTexto) avisos.push(lido.pdf.erro ? 'não deu para ler este PDF: usei só o nome do arquivo' : 'PDF sem texto (talvez escaneado): usei só o nome do arquivo');
    if (!titulo) avisos.push('não achei o nome da música');
    else if (!certo) avisos.push('o nome da música');
    if (lido.tipo === 'pdf' && !parte) avisos.push('não achei o instrumento');
    else if (lido.tipo === 'pdf' && !parteCerta) avisos.push('o instrumento');
    return { titulo, deOnde, parte, partePorque, versao: v, confira: avisos, musicaExistente: naEstante ? naEstante.s.id : null };
  }

  /* ---------- juntando tudo: o lote ---------- */
  /* itens: [{ id, nome, tipo, palpite, modificado }] -> grupos por música, cada parte com a situação
     (nova, versão nova de uma que já existe, repetida no lote) */
  function organiza(itens, musicas) {
    const grupos = new Map();
    for (const it of itens) {
      if (!['pdf', 'original'].includes(it.tipo)) continue;
      const titulo = (it.titulo != null ? it.titulo : it.palpite.titulo) || '';
      const g = slug(titulo || 'sem nome');
      if (!grupos.has(g)) grupos.set(g, { chave: g, titulo, itens: [] });
      grupos.get(g).itens.push(it);
    }
    for (const g of grupos.values()) {
      const s = musicas.find(m => slug(m.title) === g.chave) || musicas.find(m => g.itens.some(i => i.titulo == null && i.palpite.musicaExistente === m.id) && parecido(m.title, g.titulo) >= 0.8);  // nome escrito pela pessoa: só o igual
      g.existente = s || null;
      if (s) g.titulo = s.title;
      // partes sem instrumento ganham "Parte 1", "Parte 2"… para não se sobreporem
      let semNome = 0;
      for (const it of g.itens) {
        if (it.tipo !== 'pdf') continue;
        if (!it.parte) it.parte = it.palpite.parte ? { ...it.palpite.parte } : null;
        if (!it.parte) { semNome++; it.parte = { key: 'parte-' + semNome, name: 'Parte ' + semNome, base: 'parte', inventada: true }; }
        const atual = s && (s.parts || []).find(p => p.key === it.parte.key || slug(p.name) === slug(it.parte.name) || slug(p.name) === it.parte.key);
        if (atual) { it.parte = { ...it.parte, key: atual.key, name: atual.name }; }
        it.atual = atual || null;
      }
      // a mesma parte duas vezes no lote: fica a versão mais nova, a outra só entra se a pessoa marcar
      const porParte = new Map();
      for (const it of g.itens.filter(i => i.tipo === 'pdf')) { const k = it.parte.key; if (!porParte.has(k)) porParte.set(k, []); porParte.get(k).push(it); }
      for (const lista of porParte.values()) {
        lista.sort((a, b) => comparaVersao(b.palpite, a.palpite) || ((b.modificado || 0) - (a.modificado || 0)));
        const jaEscolhida = lista.some(o => o.marcado === true);
        lista.forEach((it, i) => { if (it.marcado == null) it.marcado = i === 0 && !jaEscolhida; });
        const fica = lista.find(o => o.marcado);
        lista.forEach(o => { if (o !== fica) o.marcado = false; o.repetida = lista.length > 1 && o !== (fica || lista[0]); });
      }
      for (const it of g.itens) {
        if (it.marcado == null) it.marcado = true;
        if (it.tipo === 'original') it.situacao = 'Arquivo original: fica guardado para o Malak e o Caio';
        else if (it.repetida) it.situacao = 'Outra versão da mesma parte: fica só a marcada (a mais nova vem marcada)';
        else if (it.atual) it.situacao = 'Versão nova: a que já está no app fica guardada no histórico';
        else it.situacao = s ? 'Parte nova nesta música' : 'Parte nova';
      }
      g.itens.sort((a, b) => (a.tipo === 'original') - (b.tipo === 'original') || ORDEM(a) - ORDEM(b) || a.nome.localeCompare(b.nome));
    }
    return [...grupos.values()].sort((a, b) => (!a.titulo) - (!b.titulo) || (!!a.existente) - (!!b.existente) || a.titulo.localeCompare(b.titulo));
  }
  const ORDEM_P = ['grade', 'trumpet', 'alto-sax', 'tenor-sax', 'bari-sax', 'trombone', 'base', 'baixo', 'guitarra', 'bateria', 'voz'];
  const ORDEM = it => { const b = it.parte ? it.parte.base || it.parte.key : 'z'; const i = ORDEM_P.indexOf(b); return i < 0 ? 99 : i; };

  const motor = { norm, slug, instrumento, doNome, doTexto, doXml, deXml, abreZip, desembrulha, tipoDe, ORIGINAL, versaoDoNome, parecido, achaMusica, palpite, organiza, limpaTitulo, INST };

  /* ---------- leitura de verdade (navegador) ---------- */
  async function lerPdf(f) {
    const pdfjs = root.pdfjsLib;
    if (!pdfjs) return { semTexto: true };
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise;
    try {
      const pg = await doc.getPage(1), vp = pg.getViewport({ scale: 1 });
      const tc = await pg.getTextContent();
      const itens = tc.items.filter(i => i.str && i.str.trim()).map(i => {
        const [a, b, , , e, f2] = i.transform, size = Math.hypot(a, b) || i.height || 10;
        const [x, y] = vp.convertToViewportPoint(e, f2);
        return { t: i.str, size: size / vp.height, x: x / vp.width, y: (y - size * 0.8) / vp.height, w: (i.width || 0) / vp.width };
      });
      const r = doTexto(itens); r.paginas = doc.numPages; return r;
    } finally { try { doc.destroy(); } catch {} }
  }
  async function lerOriginal(f) {
    const e = EXT(f);
    try {
      if (e === 'musicxml' || e === 'xml' || e === 'mscx') return deXml(doXml(await f.text(), root.DOMParser));
      if (e === 'mxl' || e === 'mscz') {
        const ents = await abreZip(f);
        let alvo = null;
        const cont = ents.find(x => /META-INF\/container\.xml$/i.test(x.nome));
        if (cont) { const m = new TextDecoder().decode(await cont.ler()).match(/full-path="([^"]+)"/); if (m) alvo = ents.find(x => x.nome === m[1]); }
        alvo = alvo || ents.find(x => /\.(mscx|musicxml|xml)$/i.test(x.nome) && !/META-INF/i.test(x.nome));
        if (alvo) return deXml(doXml(new TextDecoder().decode(await alvo.ler()), root.DOMParser));
      }
    } catch (err) { /* arquivo diferente do esperado: fica com o nome do arquivo */ }
    return null;
  }
  async function ler(f, musicas) {
    const tipo = tipoDe(f), lido = { nome: f.name, tipo, pasta: f.pasta || '', modificado: f.lastModified };
    if (tipo === 'pdf') { try { lido.pdf = await lerPdf(f); } catch { lido.pdf = { semTexto: true, erro: true }; } }
    if (tipo === 'original') lido.xml = await lerOriginal(f);
    return { tipo, palpite: palpite(lido, musicas), lido };
  }

  root.Lote = Object.assign(root.Lote || {}, motor, { ler, lerPdf, lerOriginal });
})(typeof window !== 'undefined' ? window : globalThis);
