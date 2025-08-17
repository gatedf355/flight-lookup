// Load environment variables from .env file
import * as dotenv from 'dotenv';
import { join } from "path";
import { existsSync } from "fs";

// Try multiple paths for .env file
const envPaths = [
  join(__dirname, '..', '.env'),           // Project root
  join(__dirname, '.env'),                // Server directory
  '.env'                                  // Current working directory
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Environment variables loaded from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('No .env file found. Using system environment variables.');
  dotenv.config(); // Load from system environment
}

import express from "express";
import { requestId } from "./middleware/requestId";
import { log } from "./logger";
import axios from "axios";
import { readFileSync } from "fs";
import cors from "cors";
import { IATA_FROM_ICAO, ICAO_FROM_IATA } from './data/airlinesCodes';
import { get as cacheGet, set as cacheSet, setNegative, isNegative, withInflight } from './utils/cache';

const app = express();
app.use(cors());
app.use(requestId);

// Load airline code mapping
let airlinesMap: Record<string, string> = {};
try {
      const airlinesPath = join(__dirname, '..', 'data', 'airlinesMap.json');
  const airlinesData = readFileSync(airlinesPath, 'utf8');
  airlinesMap = JSON.parse(airlinesData);
  log("airlines.loaded", { count: Object.keys(airlinesMap).length });
} catch (error) {
  log("airlines.load.error", { error: (error as Error).message });
}

// FlightRadar24 API client
const fr24 = axios.create({
  baseURL: 'https://fr24api.flightradar24.com/api',
  headers: {
    Authorization: `Bearer ${process.env.FR24_API_KEY}`,
    'Accept-Version': 'v1',
    Accept: 'application/json',
    'User-Agent': 'flightlookup/1.0'
  },
});

// Validate environment variables
if (!process.env.FR24_API_KEY) {
  console.error('ERROR: FR24_API_KEY environment variable is not set!');
  console.error('Please create a .env file in the project root with: FR24_API_KEY=your_api_key_here');
  process.exit(1);
}

// Debug: Log API key (first 20 chars for security)
log("api.setup", { 
  baseUrl: 'https://fr24api.flightradar24.com/api',
  apiKeyPrefix: process.env.FR24_API_KEY?.substring(0, 20) + '...',
  apiKeyLength: process.env.FR24_API_KEY?.length || 0,
  envKeys: Object.keys(process.env).filter(key => key.includes('FR24')),
  envLoaded: envLoaded
});

// Cache and rate limiting configuration
const LIVE_TTL = Number(process.env.FR24_LIVE_TTL_MS ?? 30000);   // 30s
const NEG_TTL  = Number(process.env.FR24_NEG_TTL_MS ?? 60000);   // 60s
const MAX_PER_IDENT_WINDOW_MS = 20000; // don't call upstream more than once / 20s per ident
const lastCall = new Map<string, number>();

function normIdent(raw: string) {
  return (raw || '').trim().toUpperCase();
}

async function fr24LiveLookup({ ident, flightId, full = false }: { ident?: string; flightId?: string; full?: boolean }) {
  const params: any = {};
  if (flightId) params.flight = flightId;
  else if (ident) params.callsigns = ident; // FR24 requires 'callsigns' (plural)
  params.limit = 50;

  const endpoint = full ? '/live/flight-positions/full' : '/live/flight-positions/light';
  const res = await fr24.get(endpoint, { params, validateStatus: () => true });
  const retryAfter = Number(res.headers['retry-after']);
  if (res.status === 429) {
    const detail = retryAfter ? `Retry after ${retryAfter}s` : 'Rate limited';
    const err: any = new Error('Rate limited');
    err.code = 429; err.detail = detail; err.retryAfter = retryAfter;
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    const err: any = new Error('Auth failed');
    err.code = 502; err.detail = `HTTP ${res.status}`;
    throw err;
  }
  if (res.status >= 500) {
    const err: any = new Error('Upstream error');
    err.code = 502; err.detail = `HTTP ${res.status}`;
    throw err;
  }
  if (res.status === 404) return { data: [] };

  return res.data; // expected shape: { data: [...] }
}

// Types for Flightradar24 API responses
interface FlightSummaryEntry {
  fr24_id?: string;
  flight?: string;
  callsign?: string;
  orig_icao?: string;
  dest_icao?: string;
  datetime_takeoff?: string;
  datetime_landed?: string;
  reg?: string;
  type?: string;
  flight_ended?: boolean;
}

interface Position {
  lat?: number;
  lon?: number;
  alt?: number;
  altitude?: number;
  time?: string;
  timestamp?: string;
}

interface FlightInfo {
  summary?: FlightSummaryEntry;
  track?: Position[];
  lastPosition?: Position;
  airlineName?: string;
  originName?: string;
  destinationName?: string;
}

// Helper function to derive callsign from flight number
function deriveCallsignFromFlightNumber(flightNumber: string): string | null {
  const match = flightNumber.match(/^([A-Za-z]+)(\d+)/);
  if (!match) return null;
  
  const iata = match[1].toUpperCase();
  const digits = match[2];
  const icaoPrefix = airlinesMap[iata] || iata;
  return icaoPrefix + digits;
}

// Helper function to sanitize query parameters
function sanitizeQueryParam(param: string): string {
  if (!param) return "";
  return param.replace(/\s+/g, "%20");
}

// Helper function to format time window for search
function getTimeWindow(hours: number = 36): { from: string; to: string } {
  const now = new Date();
  // Look back 10 days and forward 4 days to stay within 14-day API limit
  const from = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  
  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  const id = (req as any).id;
  log("health.check", { id });
  res.json({ ok: true, ts: Date.now() });
});

// Canonical flight lookup endpoint with caching and rate limiting
app.get('/api/flight', async (req, res) => {
  try {
    const identRaw = (req.query.number as string) || (req.query.callsign as string) || (req.query.ident as string);
    const flightId = (req.query.flight as string) || undefined;
    const full = req.query.full === 'true'; // New parameter for full vs light
    const ident = normIdent(identRaw || '');

    if (!ident && !flightId) return res.status(400).json({ error: 'Provide ?ident= (or number/callsign) or ?flight=' });

    const cacheKey = flightId ? `live:flight:${flightId}:${full ? 'full' : 'light'}` : `live:ident:${ident}:${full ? 'full' : 'light'}`;
    
    // negative cache?
    const neg = isNegative(cacheKey);
    if (neg) {
      res.setHeader('X-Cache', 'NEGATIVE');
      return res.status(404).json({ error: 'Flight not found (cached)', meta: { cache: 'NEGATIVE', ageMs: neg.ageMs, full } });
    }
    
    // positive cache?
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json({ ...cached.value, meta: { cache: 'HIT', ageMs: cached.ageMs, full } });
    }

    // per-ident throttle (local, not FR24's)
    const keyForThrottle = flightId ?? ident;
    const last = lastCall.get(keyForThrottle) || 0;
    const now = Date.now();
    if (now - last < MAX_PER_IDENT_WINDOW_MS) {
      // serve 429 but friendly
      const retry = Math.ceil((MAX_PER_IDENT_WINDOW_MS - (now - last)) / 1000);
      return res.status(429).json({ error: 'Please wait before refreshing', retryAfter: retry, meta: { cache: 'MISS', full } });
    }

    // single inflight per key
    const result = await withInflight(cacheKey, async () => {
      lastCall.set(keyForThrottle, Date.now());
      const data = await fr24LiveLookup({ ident, flightId, full }); // Pass full parameter
      const rows = data?.data || [];
      // If ident was used, keep only exact matches (credit saver)
      const filtered = flightId ? rows : rows.filter((r: any) => r?.callsign?.toUpperCase() === ident);
      if (!filtered.length) {
        setNegative(cacheKey, NEG_TTL);
        const ret = { summary: { callsign: ident || null, fr24_id: null, status: null }, fr24: { data: null }, success: false };
        return { payload: ret, cacheTtl: NEG_TTL, isNegative: true };
      }
      const best = filtered[0];
      const progressPercent = null; // can be augmented later without extra calls
      const payload = {
        summary: { callsign: best.callsign ?? ident, fr24_id: best.fr24_id ?? null, status: 'ENROUTE' },
        lastPosition: best,
        fr24: { data: filtered },
        progressPercent,
        success: true,
        full, // Include full flag in response
      };
      return { payload, cacheTtl: LIVE_TTL, isNegative: false };
    });

    if (result.isNegative) {
      res.setHeader('X-Cache', 'NEGATIVE');
      return res.status(404).json({ ...result.payload, meta: { cache: 'NEGATIVE', ageMs: 0, full } });
    }
    cacheSet(cacheKey, result.payload, result.cacheTtl);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', `private, max-age=${Math.floor(LIVE_TTL / 1000)}`);
    return res.json({ ...result.payload, meta: { cache: 'MISS', ageMs: 0, full } });
  } catch (err: any) {
    if (err?.code === 429) return res.status(429).json({ error: 'Rate limited by FR24', detail: err.detail, retryAfter: err.retryAfter ?? 15 });
    if (err?.code === 502) return res.status(502).json({ error: 'Flight data service error', detail: err.detail });
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// final error guard
app.use((err: any, req: any, res: any, _next: any) => {
  const id = req?.id;
  // eslint-disable-next-line no-console
  console.error("fatal.unhandled", id, err);
  res.status(500).json({ requestId: id, error: "UNHANDLED" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  log("server.start", { port: PORT, env: process.env.NODE_ENV || "development" });
});
