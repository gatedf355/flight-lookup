// web/lib/api.ts
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/+$/, ''); // no trailing slash

function join(base: string, path: string) {
  return `${base}/${path.replace(/^\/+/, '')}`; // ensure single slash
}

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

export async function fetchFlight(ident: string, opts?: { signal?: AbortSignal }) {
  const url = join(API_BASE, 'flight') + `?ident=${encodeURIComponent(ident.trim())}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: opts?.signal,
    // never cache live lookups
    cache: 'no-store',
  });
  return jsonOrThrow(res);
}

export async function fetchHealth() {
  const res = await fetch(join(API_BASE, 'health'), { cache: 'no-store' });
  return jsonOrThrow(res);
}
