/* TOUR 10 ANOS, modo local: the same small window.claude API the app uses (db / user),
   backed by the program running on the Logic Mac (servidor.js) instead of the internet. */
(() => {
  const store = {};        // collection path -> { id: data }
  const subs = [];         // { col, filters, cb, prev }
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  let ready = null;

  function fire(col) {
    subs.filter(s => s.col === col).forEach(s => {
      const docs = Object.entries(store[col] || {})
        .filter(([, d]) => s.filters.every(([f, v]) => d && d[f] === v))
        .map(([id, d]) => ({ id, exists: true, data: () => clone(d) }));
      const ch = docs.map(d => ({ type: s.prev.has(d.id) ? 'modified' : 'added', doc: d }));
      s.prev.forEach(id => { if (!docs.some(d => d.id === id)) ch.push({ type: 'removed', doc: { id, exists: false, data: () => undefined } }); });
      s.prev = new Set(docs.map(d => d.id));
      try { s.cb({ docs, metadata: { fromCache: false }, docChanges: () => ch }); } catch (e) { console.error(e); }
    });
  }
  function put(col, id, data) {
    store[col] = store[col] || {};
    if (data === null) delete store[col][id]; else store[col][id] = data;
    fire(col);
  }
  function load() {
    return fetch('api/data', { cache: 'no-store' }).then(r => r.json()).then(all => {
      Object.keys(store).forEach(k => delete store[k]);
      Object.assign(store, all);
      Object.keys(store).forEach(fire);
    });
  }
  function connect() {
    const es = new EventSource('api/events');
    es.onmessage = e => { try { const m = JSON.parse(e.data); put(m.col, m.id, m.data); } catch {} };
    es.onopen = () => { if (ready) load().catch(() => {}); };  // came back after a drop: catch up
  }
  function send(col, id, data) {
    put(col, id, data);
    return fetch('api/doc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ col, id, data }) })
      .then(r => { if (!r.ok) throw new Error('http ' + r.status); });
  }
  function coll(col, filters = []) {
    return {
      doc: id => ({
        get: async () => { await ready; const d = store[col]?.[id]; return { id, exists: d !== undefined, data: () => clone(d) }; },
        set: v => send(col, id, clone(v)),
        update: v => send(col, id, { ...(store[col]?.[id] || {}), ...clone(v) }),
        delete: () => send(col, id, null),
      }),
      where: (f, op, v) => coll(col, [...filters, [f, v]]),
      onSnapshot: cb => {
        const s = { col, filters, cb, prev: new Set() };
        subs.push(s);
        ready.then(() => fire(col));
        return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); };
      },
    };
  }
  // only the Mac running the program (opened as localhost) is the administrator here
  const isMac = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  window.LOCAL_MODE = true;
  window.claude = {
    use: async name => {
      if (name === 'db') { if (!ready) { ready = load(); connect(); } await ready; return { collection: p => coll(p) }; }
      if (name === 'user') return { canEdit: async () => isMac, id: async () => isMac ? 'mac-local' : null };
      return null;
    },
  };
})();
