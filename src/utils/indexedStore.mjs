import { openDB } from 'idb';

// UI code reads a hydrated cache. IndexedDB is the sole persistent data store.
export function createStorageRepository({ name = 'healthcare', sessionId, legacyLocal, legacySession, notify = () => {} } = {}) {
  const sessionScope = `session:${sessionId}`;
  const caches = new Map([['local', new Map()], [sessionScope, new Map()]]);
  const pending = [];
  let db;
  let initialization;
  let processing;
  let error = null;
  let channel;

  const state = () => ({ pending: pending.length, error });
  const signal = () => notify(state());
  const cacheFor = scope => caches.get(scope);

  async function initialize() {
    if (initialization) return initialization;
    initialization = (async () => {
      db = await openDB(name, 1, {
        upgrade(database) {
          database.createObjectStore('entries', { keyPath: ['scope', 'key'] });
          database.createObjectStore('meta');
        },
        blocking() { db?.close(); },
      });
      // The marker and imported entries commit together, so interrupted imports
      // can retry and removed records never reappear from old Web Storage.
      const tx = db.transaction(['entries', 'meta'], 'readwrite');
      const metadata = tx.objectStore('meta');
      for (const [scope, source] of [['local', legacyLocal], [sessionScope, legacySession]]) {
        const marker = `web-storage-imported:${scope}`;
        if (!await metadata.get(marker)) {
          if (source) {
            for (let index = 0; index < source.length; index++) {
              const key = source.key(index);
              if (key?.startsWith('__healthcare_')) continue;
              const value = source.getItem(key);
              if (value !== null && !await tx.objectStore('entries').get([scope, key])) {
                await tx.objectStore('entries').put({ scope, key, value });
              }
            }
          }
          await metadata.put(true, marker);
        }
      }
      await tx.done;
      for (const entry of await db.getAll('entries')) {
        cacheFor(entry.scope)?.set(entry.key, entry.value);
      }
      if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(`${name}:updates`);
        channel.onmessage = ({ data }) => {
          const cache = cacheFor(data.scope);
          if (!cache) return;
          // A pending local change takes precedence until its own transaction commits.
          if (pending.some(item => item.scope === data.scope && item.key === data.key)) return;
          if (data.value === null) cache.delete(data.key);
          else cache.set(data.key, data.value);
          window.dispatchEvent(new StorageEvent('storage', { key: data.key, newValue: data.value }));
        };
      }
      error = null;
      signal();
    })().catch(e => { initialization = null; error = e; signal(); throw e; });
    return initialization;
  }

  async function drain() {
    if (processing) return processing;
    processing = (async () => {
      await initialize();
      while (pending.length) {
        const item = pending[0];
        const tx = db.transaction('entries', 'readwrite');
        if (item.value === null) await tx.store.delete([item.scope, item.key]);
        else await tx.store.put(item);
        await tx.done;
        pending.shift();
        channel?.postMessage(item);
        error = null;
        signal();
      }
    })().catch(e => { error = e; signal(); throw e; })
      .finally(() => { processing = null; });
    return processing;
  }

  function enqueue(scope, key, value) {
    if (!db) throw new Error('Storage has not been initialized');
    const cache = cacheFor(scope);
    if (value === null) cache.delete(key);
    else cache.set(key, value);
    pending.push({ scope, key, value });
    signal();
    if (!error) void drain().catch(() => {}); // The UI exposes failures and offers retry.
  }

  function facade(scope) {
    return {
      getItem: key => cacheFor(scope).get(String(key)) ?? null,
      setItem: (key, value) => enqueue(scope, String(key), String(value)),
      removeItem: key => enqueue(scope, String(key), null),
      keys: () => [...cacheFor(scope).keys()],
      key: index => [...cacheFor(scope).keys()][index] ?? null,
      get length() { return cacheFor(scope).size; },
      clear() { for (const key of cacheFor(scope).keys()) enqueue(scope, key, null); },
    };
  }

  return {
    local: facade('local'), session: facade(sessionScope), initialize,
    flush: drain, retry: () => { error = null; return drain(); }, state,
    async close() { await drain(); channel?.close(); db?.close(); },
  };
}

// Next.js Fast Refresh replaces modules while keeping component state alive.
// The hydrated repository belongs to this browser document, including hot updates.
const repositoryKey = Symbol.for('healthcare.storage.repository');
function getRepository() {
  let repository = window[repositoryKey];
  if (!repository) {
    // This identifier is the only new Web Storage value: no health or account data.
    let sessionId = window.sessionStorage.getItem('__healthcare_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.sessionStorage.setItem('__healthcare_session_id', sessionId);
    }
    repository = createStorageRepository({
      sessionId,
      legacyLocal: window.localStorage, legacySession: window.sessionStorage,
      notify: () => queueMicrotask(() => window.dispatchEvent(new Event('healthcare-storage-status'))),
    });
    window[repositoryKey] = repository;
  }
  return repository;
}

function proxy(scope) {
  return new Proxy({}, { get: (_, property) => getRepository()[scope][property] });
}

export const localData = proxy('local');
export const sessionData = proxy('session');
export const initializeStorage = async () => getRepository().initialize();
export const flushStorage = () => getRepository().flush();
export const retryStorage = () => getRepository().retry();
export const storageStatus = () => getRepository().state();
