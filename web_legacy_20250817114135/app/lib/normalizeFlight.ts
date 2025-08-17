export type NormalizedFlight = {
  callsign: string | null;
  status: string | null;
  fr24Id: string | null;
  lat: number | null;
  lon: number | null;
  altFt: number | null;
  gndKt: number | null;
  vsFpm: number | null;
  trackDeg: number | null;
  source: string | null;
  updatedIso: string | null;
  progressPercent: number | null;
};

export function normalizeFlight(raw: any): NormalizedFlight {
  const s = raw?.summary ?? {};
  const p = raw?.lastPosition ?? raw?.fr24?.data?.[0] ?? {};
  return {
    callsign: s.callsign ?? null,
    status: s.status ?? null,
    fr24Id: s.fr24_id ?? null,
    lat: p.lat ?? null,
    lon: p.lon ?? null,
    altFt: p.alt ?? null,
    gndKt: p.gspeed ?? null,
    vsFpm: typeof p.vspeed === 'number' ? p.vspeed : null,
    trackDeg: p.track ?? null,
    source: p.source ?? null,
    updatedIso: p.timestamp ?? null,
    progressPercent: raw?.progressPercent ?? null,
  };
}

export const asFlightLevel = (altFt: number | null) =>
  typeof altFt === 'number' ? `FL${Math.round(altFt / 100)}` : 'N/A';

export const fmt = {
  coord: (n: number | null) => (typeof n === 'number' ? n.toFixed(5) : 'N/A'),
  kt: (n: number | null) => (typeof n === 'number' ? `${n} kt` : 'N/A'),
  fpm: (n: number | null) =>
    typeof n === 'number' ? `${n >= 0 ? '+' : ''}${n} ft/min` : 'N/A',
  deg: (n: number | null) => (typeof n === 'number' ? `${n}°` : 'N/A'),
  isoAgo: (iso: string | null) => {
    if (!iso) return 'N/A';
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return iso;
    const m = Math.max(0, Math.round((Date.now() - d) / 60000));
    return m === 0 ? 'just now' : `${m} min ago`;
  },
};
