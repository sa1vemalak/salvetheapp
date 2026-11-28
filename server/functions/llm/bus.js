/* LLM bus: each app module (agente, mestrinho, ...) asks the bus for a turn; the bus picks the provider and
   model from a routing table, falls back to the next route if one fails, and logs every call.

   Routing table: Firestore doc sistema/llm (only the server reads it; the database rules close it to the app):
     { modulos: { agente: { rota: [ { provedor: 'anthropic', modelo: 'claude-opus-5-5', effort: 'medium' }, ... ] } } }
   Messages and tools use one shared shape (the Anthropic Messages format). An adapter for another provider
   translates to and from it; add one to ADAPTERS and a route to the table, and the modules don't change. */
'use strict';
const anthropic = require('./anthropic');

const ADAPTERS = { anthropic };

const DEFAULT_ROUTES = {
  agente: [{ provedor: 'anthropic', modelo: 'claude-opus-5-5', effort: 'medium' }],
  // the jury of the suggestions: three short votes, so the cheaper model with little thinking
  juri: [{ provedor: 'anthropic', modelo: 'claude-sonnet-5-5', effort: 'low' }],
};

let cache = { at: 0, table: null };
async function routes(db, modulo) {
  if (Date.now() - cache.at > 60_000) {
    const snap = await db.doc('sistema/llm').get().catch(() => null);
    cache = { at: Date.now(), table: snap && snap.exists ? snap.data() : null };
  }
  const r = cache.table?.modulos?.[modulo]?.rota;
  return Array.isArray(r) && r.length ? r : DEFAULT_ROUTES[modulo] || DEFAULT_ROUTES.agente;
}

/* one model turn: { system, messages, tools } -> { content, stop_reason, usage, provedor, modelo } */
async function turn(db, { modulo, system, messages, tools, maxTokens, quem }) {
  const errors = [];
  for (const route of await routes(db, modulo)) {
    const adapter = ADAPTERS[route.provedor];
    if (!adapter) { errors.push(`${route.provedor}: sem adaptador`); continue; }
    const t0 = Date.now();
    try {
      const out = await adapter.turn({ route, system, messages, tools, maxTokens });
      log(db, { modulo, ...route, ok: true, ms: Date.now() - t0, usage: out.usage, stop: out.stop_reason, ...quem });
      return { ...out, provedor: route.provedor, modelo: out.modelo || route.modelo };
    } catch (e) {
      const msg = adapter.describeError ? adapter.describeError(e) : String(e?.message || e);
      log(db, { modulo, ...route, ok: false, ms: Date.now() - t0, erro: msg, ...quem });
      errors.push(`${route.provedor}/${route.modelo}: ${msg}`);
      if (adapter.isFatal && adapter.isFatal(e)) break;  // a bad request fails the same way on every route
    }
  }
  const err = new Error('Nenhuma IA respondeu: ' + errors.join(' | '));
  err.status = 503;
  throw err;
}

function log(db, entry) {
  db.collection('sistema').doc('llm').collection('log').add({ ...entry, at: Date.now() }).catch(() => {});
}

module.exports = { turn };
