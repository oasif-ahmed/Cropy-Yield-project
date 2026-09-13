const store = new Map();
const inFlight = new Map();
const DEFAULT_TTL_MS = 30 * 60 * 1000;

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheWrap(key, ttlMs, fn) {
  if (typeof ttlMs === 'function') {
    fn = ttlMs;
    ttlMs = DEFAULT_TTL_MS;
  }
  const cached = cacheGet(key);
  if (cached !== undefined) return Promise.resolve(cached);
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = Promise.resolve(fn())
    .then((value) => {
      cacheSet(key, value, ttlMs);
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function cacheDelete(key) {
  store.delete(key);
}

export function cacheClear() {
  store.clear();
}

export function cacheStats() {
  return { size: store.size };
}