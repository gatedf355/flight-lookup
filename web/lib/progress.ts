// web/lib/progress.ts
export type FlightLike = any;

const RAW = (process.env.NEXT_PUBLIC_API_BASE || "").trim();
// If set, it must include protocol; if not, assume https.
const API = RAW ? (RAW.startsWith("http") ? RAW : `https://${RAW}`) : "";

function u(s?: string) { return (s ?? "").trim().toUpperCase(); }
function num(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? Number(n) : undefined;
}

function extractCodesAndPos(f: FlightLike) {
  // Extract origin - try multiple field patterns
  const origin = u(
    f?.orig_iata ?? f?.orig_icao ??  // Direct FR24 fields
    f?.origin?.iata ?? f?.origin?.icao ??  // Nested origin object
    f?.summary?.orig_icao ?? f?.summary?.origin ??
    f?.origin ?? f?.route?.origin ?? f?.route?.from ??
    f?.originIcao ?? f?.originICAO ?? f?.origin_iata ?? f?.originIATA
  );
  
  // Extract destination - try multiple field patterns
  const dest = u(
    f?.dest_iata ?? f?.dest_icao ??  // Direct FR24 fields
    f?.destination?.iata ?? f?.destination?.icao ??  // Nested destination object
    f?.summary?.dest_icao ?? f?.summary?.destination ??
    f?.destination ?? f?.route?.destination ?? f?.route?.to ??
    f?.destIcao ?? f?.destICAO ?? f?.dest_iata ?? f?.destIATA
  );

  // Extract position - try multiple field patterns
  const lat = num(
    f?.lat ??  // Direct FR24 fields
    f?.lastPosition?.lat ?? f?.position?.lat ??  // Nested position objects
    f?.lastPosition?.latitude ?? f?.position?.latitude ??
    f?.latDeg
  );
  const lon = num(
    f?.lon ??  // Direct FR24 fields
    f?.lastPosition?.lon ?? f?.position?.lon ??  // Nested position objects
    f?.lastPosition?.lng ?? f?.position?.lng ??
    f?.lastPosition?.longitude ?? f?.position?.longitude ??
    f?.lonDeg
  );



  return { origin, dest, lat, lon };
}

export async function fetchProgressForFlight(flight: FlightLike) {
  const { origin, dest, lat, lon } = extractCodesAndPos(flight);
  if (!origin || !dest || lat === undefined || lon === undefined) {
    return { ok: false as const, error: "missing_fields", origin, dest, lat, lon };
  }

  const qs = new URLSearchParams({ origin, dest, lat: String(lat), lon: String(lon) });
  // Use relative path to hit Next's /api rewrite (same as working fetchProgress function)
  const url = `/api/flight-progress?${qs.toString()}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort("timeout"), 8000);

  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { accept: "application/json" },
      // credentials: "include", // only if you later need cookies
    });
    clearTimeout(timer);

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { ok: false as const, error: `http_${r.status}`, details: body };
    }
    const json = await r.json();
    return { ok: true as const, data: json };
  } catch (e: any) {
    clearTimeout(timer);
    const err = e?.name === "AbortError" ? "timeout" : "network_error";
    return { ok: false as const, error: err, details: e?.message };
  }
}

// Add a direct progress fetch function with timeout
export async function fetchProgress(origin: string, dest: string, lat: number, lon: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  const qs = new URLSearchParams({ origin, dest, lat: String(lat), lon: String(lon) });
  
  try {
    const r = await fetch(`/api/flight-progress?${qs}`, { 
      signal: ac.signal, 
      headers: { accept: 'application/json' } 
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e: any) {
    clearTimeout(t);
    return { error: e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network_error') };
  }
}
