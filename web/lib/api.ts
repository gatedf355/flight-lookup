const BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''
function buildUrl(path: string, params: Record<string, string>) {
  const origin =
    typeof window === 'undefined' ? BASE : (BASE || window.location.origin)
  const url = new URL(path, origin)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

// Fix: Point to the correct backend port
const API_BASE_URL = 'http://localhost:4000'; // Change from 3000 to 4000

export async function fetchFlight(query: string, full: boolean = false, searchType: 'callsign' | 'registration' = 'callsign'): Promise<any> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);

  try {
    const response = await fetch(`/api/flight?callsign=${encodeURIComponent(query)}&full=${full}&searchType=${searchType}`, {
      signal: ac.signal,
      headers: { accept: 'application/json' }
    });
    clearTimeout(t);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Flight not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    clearTimeout(t);
    if (error?.name === 'AbortError') {
      throw new Error('timeout');
    }
    console.error('Error fetching flight:', error);
    throw error;
  }
}
