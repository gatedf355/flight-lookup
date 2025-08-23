type Entry<T> = { value: T; ts: number; ttl: number };
const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<any>>();

export function get<T>(key: string): { value: T; ageMs: number } | null {
  const e = store.get(key) as Entry<T> | undefined;
  if (!e) return null;
  if (Date.now() - e.ts > e.ttl) { store.delete(key); return null; }
  return { value: e.value, ageMs: Date.now() - e.ts };
}

export function set<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, ts: Date.now(), ttl: ttlMs });
}

export function setNegative(key: string, ttlMs: number) {
  store.set(key, { value: null, ts: Date.now(), ttl: ttlMs });
}

export function isNegative(key: string): { ageMs: number } | null {
  const e = store.get(key); if (!e) return null;
  if (e.value !== null) return null;
  if (Date.now() - e.ts > e.ttl) { store.delete(key); return null; }
  return { ageMs: Date.now() - (e as any).ts };
}

export function withInflight<T>(key: string, fn: () => Promise<T>) {
  if (inflight.has(key)) return inflight.get(key)! as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
