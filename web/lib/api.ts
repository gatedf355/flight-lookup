const BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''
function buildUrl(path: string, params: Record<string, string>) {
  const origin =
    typeof window === 'undefined' ? BASE : (BASE || window.location.origin)
  const url = new URL(path, origin)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

export async function fetchFlight(query: string) {
  const q = query.trim().toUpperCase()
  const key = /^[A-Z]{2}\s?\d+$/.test(q) ? 'number' : 'callsign'
  const res = await fetch(buildUrl('/api/flight', { [key]: q }), {
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const code = res.status
    throw new Error(detail || `HTTP ${code}`)
  }
  return res.json()
}
