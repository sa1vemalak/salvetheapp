/* Monthly robot budget per band: what the Caio, the Malak and the Mestrinho cost the app, in reais.
   Each band may spend up to LIMITE_REAIS a month; then the robots stop for that band until the 1st of next month.
   Bands owned by an app admin (admins/{uid}) have no limit (the app owner's own band), but are still counted.

   The count lives in bands/{b}/uso/{AAAA-MM} = { reais, caio, malak, mestrinho, semLimite, atualizado }:
   the band's members read it (the band screen shows it), only the server writes it (the database rules close it).
   Optional overrides in sistema/gasto (server only): { limiteReais, dolar, semLimite: [bandId, ...] }. */
'use strict';

const LIMITE_REAIS = 20;
const DOLAR = 6;   // reais per US dollar, a little above the market so the count errs on the safe side

// US$ per million tokens (Anthropic list prices); unknown models use the most expensive row
const PRECOS = {
  'claude-opus-5-5': { entrada: 4, saida: 20, cacheLido: 0.2, cacheEscrito: 5 },
  'claude-opus-5': { entrada: 5, saida: 25, cacheLido: 0.5, cacheEscrito: 6.25 },
  'claude-opus-4-8': { entrada: 5, saida: 25, cacheLido: 0.5, cacheEscrito: 6.25 },
  'claude-sonnet-5-5': { entrada: 2, saida: 10, cacheLido: 0.1, cacheEscrito: 2.5 },
  'claude-sonnet-5': { entrada: 2, saida: 10, cacheLido: 0.2, cacheEscrito: 2.5 },
};
const PRECO_PADRAO = PRECOS['claude-opus-5'];

// the Cloud Run jobs, a fixed estimate per run (machine time; the Mestrinho also includes its AI call)
const POR_TRABALHO = { malak: 0.3, mestrinho: 5 };

/* reais for one model turn, from the API's usage block */
function reaisDoUso(modelo, usage, dolar = DOLAR) {
  if (!usage) return 0;
  const p = PRECOS[String(modelo || '').replace(/-\d{8}$/, '')] || PRECO_PADRAO;
  const usd = ((usage.input_tokens || 0) * p.entrada + (usage.output_tokens || 0) * p.saida +
    (usage.cache_read_input_tokens || 0) * p.cacheLido + (usage.cache_creation_input_tokens || 0) * p.cacheEscrito) / 1e6;
  return usd * dolar;
}

// the month in Brazil time, e.g. "2026-11"
const mes = (agora = new Date()) => new Date(agora.getTime() - 3 * 3600e3).toISOString().slice(0, 7);

let cfgCache = { at: 0, cfg: {} };
async function config(db) {
  if (Date.now() - cfgCache.at > 60_000) {
    const s = await db.collection('sistema').doc('gasto').get().catch(() => null);
    cfgCache = { at: Date.now(), cfg: s && s.exists ? s.data() || {} : {} };
  }
  const c = cfgCache.cfg;
  return { limite: Number(c.limiteReais) > 0 ? Number(c.limiteReais) : LIMITE_REAIS, dolar: Number(c.dolar) > 0 ? Number(c.dolar) : DOLAR,
    semLimite: Array.isArray(c.semLimite) ? c.semLimite : [] };
}

async function semLimite(db, band, cfg) {
  if (cfg.semLimite.includes(band)) return true;
  const b = await db.collection('bands').doc(band).get().catch(() => null);
  const owner = b && b.exists ? (b.data() || {}).owner : null;
  if (!owner) return false;
  const a = await db.collection('admins').doc(owner).get().catch(() => null);
  return !!(a && a.exists);
}

const refMes = (db, band) => db.collection('bands').doc(band).collection('uso').doc(mes());

/* may this band use a robot now? { ok, reais, limite, semLimite, msg } */
async function livre(db, band) {
  const cfg = await config(db);
  const [livreDeLimite, s] = await Promise.all([semLimite(db, band, cfg), refMes(db, band).get().catch(() => null)]);
  const reais = s && s.exists ? Number((s.data() || {}).reais) || 0 : 0;
  const ok = livreDeLimite || reais < cfg.limite;
  const real = v => v.toFixed(2).replace('.', ',');
  return { ok, reais, limite: cfg.limite, semLimite: livreDeLimite, dolar: cfg.dolar,
    msg: ok ? '' : `A banda já usou os R$ ${real(cfg.limite)} de robôs deste mês (Caio, Malak e Mestrinho). Libera de novo no dia 1º do mês que vem.` };
}

/* add what one use cost: robo = 'caio' | 'malak' | 'mestrinho' */
async function somar(db, band, robo, reais, semLimiteBanda) {
  if (!(reais > 0)) return;
  try {
    const inc = require('firebase-admin').firestore.FieldValue.increment;
    await refMes(db, band).set({ reais: inc(reais), [robo]: inc(reais), atualizado: Date.now(),
      ...(semLimiteBanda != null ? { semLimite: !!semLimiteBanda } : {}) }, { merge: true });
  } catch (e) { console.error('gasto:', e); }
}

module.exports = { livre, somar, reaisDoUso, mes, POR_TRABALHO, LIMITE_REAIS, DOLAR, PRECOS };
