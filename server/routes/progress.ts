// server/routes/progress.ts
// Registers GET /api/flight-progress?origin=KJFK&dest=KLAX&lat=40.6&lon=-73.8

import { Router, Request, Response } from "express";
import fs from 'fs';
import path from 'path';

const router = Router();

/* ------------ helpers ------------- */
type Pt = { lat: number; lon: number };

const byIcao = new Map<string, Pt & { icao?: string; iata?: string }>();
const byIata = new Map<string, Pt & { icao?: string; iata?: string }>();

// Load airport data from flight-utils.json
try {
  const airportsPath = path.join(__dirname, '..', '..', 'flight-utils.json');
  console.log('Loading airports from:', airportsPath);
  console.log('Current directory:', __dirname);
  
  const airportsData = JSON.parse(fs.readFileSync(airportsPath, 'utf8'));
  console.log('Airports data loaded successfully');
  console.log('Number of airports:', Object.keys(airportsData.airports || {}).length);
  
  for (const [code, airport] of Object.entries(airportsData.airports as any)) {
    const icao = String(code).toUpperCase();
    const iata = String((airport as any).iata || "").toUpperCase();
    const lat = Number((airport as any).lat);
    const lon = Number((airport as any).lon);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      if (icao) byIcao.set(icao, { icao, iata, lat, lon });
      if (iata) byIata.set(iata, { icao, iata, lat, lon });
    }
  }
  
  console.log('Airports loaded into maps:');
  console.log('  ICAO map size:', byIcao.size);
  console.log('  IATA map size:', byIata.size);
  console.log('  Sample ICAO keys:', Array.from(byIcao.keys()).slice(0, 5));
  console.log('  Sample IATA keys:', Array.from(byIata.keys()).slice(0, 5));
  
} catch (err) {
  console.error('Failed to load airport data:', err);
}

function findAirport(code?: string) {
  if (!code) return null;
  const u = code.trim().toUpperCase();
  return byIcao.get(u) ?? byIata.get(u) ?? null;
}

function pickNum(q: any, keys: string[]) {
  for (const k of keys) {
    const v = q[k];
    const n = typeof v === "string" ? Number(v) : v;
    if (Number.isFinite(n)) return Number(n);
  }
  return NaN;
}

function toRad(d: number) { return (d * Math.PI) / 180; }
function haversineKm(a: Pt, b: Pt) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ------------ route ------------- */
/**
 * GET /api/flight-progress
 * Accepts any of:
 *   origin|from|o = ICAO or IATA
 *   dest|to|d     = ICAO or IATA
 *   lat|latitude|latDeg
 *   lon|lng|longitude|lonDeg
 */
router.get("/flight-progress", (req: Request, res: Response) => {
  try {
    const originCode = (req.query.origin || req.query.from || req.query.o) as string;
    const destCode   = (req.query.dest   || req.query.to   || req.query.d) as string;

    const lat = pickNum(req.query, ["lat", "latitude", "latDeg"]);
    const lon = pickNum(req.query, ["lon", "lng", "longitude", "lonDeg"]);

    if (!originCode || !destCode || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        error: "Missing origin/dest/lat/lon",
        hint: "Example: /api/flight-progress?origin=KTPA&dest=EHAM&lat=28.3&lon=-82.5",
        got: { originCode, destCode, lat, lon }
      });
    }

    const origin = findAirport(originCode);
    const dest = findAirport(destCode);
    if (!origin || !dest) {
      return res.status(404).json({
        error: "Airport not found",
        originCode, destCode,
        foundOrigin: Boolean(origin),
        foundDest: Boolean(dest)
      });
    }

    const pos: Pt = { lat, lon };

    const totalKm = Math.max(1, haversineKm(origin, dest));
    const coveredKm = haversineKm(origin, pos);
    const pct = clamp(Math.round((coveredKm / totalKm) * 100), 0, 100);

    return res.json({
      origin: { code: originCode, lat: origin.lat, lon: origin.lon, icao: origin.icao, iata: origin.iata },
      destination: { code: destCode, lat: dest.lat, lon: dest.lon, icao: dest.icao, iata: dest.iata },
      currentPosition: pos,
      progress: { pct, totalKm, coveredKm, remainingKm: Math.max(0, totalKm - coveredKm) }
    });
  } catch (err: any) {
    console.error("flight-progress error:", err);
    res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

export default router;
