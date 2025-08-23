export interface Env { FR24_KEY: string }

const CODE_ALIASES: Record<string,string> = {
  YYZ:"CYYZ", CYYZ:"CYYZ",
  LHR:"EGLL", EGLL:"EGLL"
};
const norm = (c: string | null) => (c ? (CODE_ALIASES[c.toUpperCase()] || c.toUpperCase()) : "");

const FALLBACK_AIRPORTS: Record<string,{lat:number;lon:number;iata:string;icao:string}> = {
  CYYZ:{lat:43.6777, lon:-79.6248, iata:"YYZ",  icao:"CYYZ"},
  YYZ: {lat:43.6777, lon:-79.6248, iata:"YYZ",  icao:"CYYZ"},
  EGLL:{lat:51.4706, lon:-0.4619, iata:"LHR",  icao:"EGLL"},
  LHR: {lat:51.4706, lon:-0.4619, iata:"LHR", icao:"EGLL"},
};

function haversineKm(a:{lat:number;lon:number}, b:{lat:number;lon:number}) {
  const R=6371;
  const dLat=(b.lat-a.lat)*Math.PI/180, dLon=(b.lon-a.lon)*Math.PI/180;
  const s1=Math.sin(dLat/2), s2=Math.sin(dLon/2);
  const la1=a.lat*Math.PI/180, la2=b.lat*Math.PI/180;
  const h=s1*s1 + Math.cos(la1)*Math.cos(la2)*s2*s2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') return new Response('ok', { status: 200 });

    // --- Progress endpoint with robust YYZ/LHR fallback ---
    if (url.pathname === '/api/flight-progress') {
      const originCode = norm(url.searchParams.get('origin'));
      const destCode   = norm(url.searchParams.get('dest'));
      const lat = Number(url.searchParams.get('lat'));
      const lon = Number(url.searchParams.get('lon'));

      const origin = FALLBACK_AIRPORTS[originCode];
      const dest   = FALLBACK_AIRPORTS[destCode];

      if (!origin || !dest) {
        return Response.json({
          success:false,
          error:"Airport not found",
          originCode, destCode,
          foundOrigin: !!origin,
          foundDest: !!dest,
          status:{ active:false, text:"NOT_FOUND" }
        }, { status: 200 });
      }

      const current = { lat, lon };
      const totalKm   = haversineKm(origin, dest);
      const coveredKm = haversineKm(origin, current);
      const pct = Math.max(0, Math.min(1, totalKm ? coveredKm/totalKm : 0));

      return Response.json({
        success:true,
        origin:{ code:originCode, lat:origin.lat, lon:origin.lat, iata:origin.iata, icao:origin.icao },
        dest:{   code:destCode,   lat:dest.lat,   lon:dest.lon,   iata:dest.iata,   icao:dest.icao },
        current:{ lat, lon },
        distance:{ totalKm, coveredKm, remainingKm: Math.max(0,totalKm-coveredKm), percent:pct },
        status:{ active:true, text:"OK" }
      });
    }

    // --- Flight proxy (unchanged behavior, just uses FR24 key) ---
    if (url.pathname.startsWith('/api/flight')) {
      const callsign   = url.searchParams.get('callsign') ?? '';
      const full       = url.searchParams.get('full') ?? 'false';
      const searchType = url.searchParams.get('searchType') ?? 'callsign';
      if (!callsign) {
        return Response.json({ error:'Missing callsign' }, { status: 400 });
      }

      const upstream = `https://api.flightradar24.com/common/v1/search.json?token=${encodeURIComponent(env.FR24_KEY)}&query=${encodeURIComponent(callsign)}&limit=1`;
      const res = await fetch(upstream, { headers: { 'accept':'application/json' }});
      const body = await res.text();

      return new Response(body, { 
        status: res.status,
        headers: {
          'content-type': res.headers.get('content-type') ?? 'application/json',
          'access-control-allow-origin': '*'
        }
      });
    }

    return new Response('not found', { status: 404 });
  }
}
