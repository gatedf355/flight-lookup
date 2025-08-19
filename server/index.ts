// ============================================================================
// IMPORTS & ENVIRONMENT SETUP
// ============================================================================

import * as dotenv from 'dotenv';
import { join } from "path";
import { existsSync } from "fs";
import express from "express";
import { requestId } from "./middleware/requestId";
import { log } from "./logger";
import axios from "axios";
import cors from "cors";
import { withInflight } from './utils/cache';
import progressRouter from './routes/progress';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

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
  dotenv.config();
}

// Validate required environment variables
if (!process.env.FR24_API_KEY) {
  console.error('ERROR: FR24_API_KEY environment variable is not set!');
  console.error('Please create a .env file in the project root with: FR24_API_KEY=your_api_key_here');
  process.exit(1);
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

const LIVE_TTL = Number(process.env.FR24_LIVE_TTL_MS ?? 30000);   // 30s
const NEG_TTL  = Number(process.env.FR24_NEG_TTL_MS ?? 60000);   // 60s
const MAX_PER_IDENT_WINDOW_MS = 20000; // don't call upstream more than once / 20s per ident
const keyForThrottle = 'fr24:throttle';
const lastCall = new Map<string, number>();

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
app.use(cors());
app.use(requestId);

// Add response timeout middleware
app.use((req, res, next) => {
  res.setTimeout(8000, () => {
    console.warn('Response timeout:', req.method, req.originalUrl);
    if (!res.headersSent) res.status(504).json({ error: 'upstream_timeout' });
  });
  next();
});

// Register progress route
app.use("/api", progressRouter);

// ============================================================================
// FLIGHTRADAR24 API CLIENT
// ============================================================================

const fr24 = axios.create({
  baseURL: 'https://fr24api.flightradar24.com/api',
  timeout: 7000, // 7 second timeout
  headers: {
    Authorization: `Bearer ${process.env.FR24_API_KEY}`,
    'Accept-Version': 'v1',
    Accept: 'application/json',
    'User-Agent': 'flightlookup/1.0'
  },
});

// Debug: Log API key (first 20 chars for security)
log("api.setup", { 
  baseUrl: 'https://fr24api.flightradar24.com/api',
  apiKeyPrefix: process.env.FR24_API_KEY?.substring(0, 20) + '...',
  apiKeyLength: process.env.FR24_API_KEY?.length || 0,
  envKeys: Object.keys(process.env).filter(key => key.includes('FR24')),
  envLoaded: envLoaded
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normIdent(raw: string) {
  return (raw || '').trim().toUpperCase();
}

// ============================================================================
// HELPER FUNCTIONS FOR FLIGHT DATA ENRICHMENT
// ============================================================================

function getAirlineName(airlineCode: string | null): string | null {
  if (!airlineCode) return null;
  
  const airlines: Record<string, string> = {
    'DAL': 'Delta Air Lines',
    'UAL': 'United Airlines',
    'AAL': 'American Airlines',
    'SWA': 'Southwest Airlines',
    'ASA': 'Alaska Airlines',
    'JBU': 'JetBlue Airways',
    'FFT': 'Frontier Airlines',
    'SKW': 'SkyWest Airlines',
    'EDV': 'Endeavor Air',
    'RPA': 'Republic Airways',
    'JIA': 'PSA Airlines',
    'ENY': 'Envoy Air',
    'QXE': 'Horizon Air',
    'PDT': 'Piedmont Airlines',
    'CPZ': 'Compass Airlines',
    'GJS': 'GoJet Airlines',
    'MES': 'Mesa Airlines',
    'CHQ': 'Chautauqua Airlines',
    'COM': 'Comair',
    'XJT': 'ExpressJet Airlines'
  };
  
  return airlines[airlineCode.toUpperCase()] || `${airlineCode} Airlines`;
}

function getRouteFromPosition(lat: number, lon: number, track: number): string {
  // Basic route estimation based on position and heading
  if (lat > 45 && lon < -50 && track > 200 && track < 250) {
    return 'Europe → United States';
  } else if (lat > 40 && lat < 50 && lon > -80 && lon < -60) {
    return 'United States Domestic';
  } else if (lat > 30 && lat < 40 && lon > -120 && lon < -80) {
    return 'United States Domestic';
  } else if (lat > 50 && lon > 0 && lon < 20) {
    return 'Europe Domestic';
  } else if (lat > 20 && lat < 30 && lon > 100 && lon < 140) {
    return 'Asia Domestic';
  } else if (lat > -40 && lat < -20 && lon > 110 && lon < 155) {
    return 'Australia Domestic';
  }
  
  return 'International Flight';
}

// ============================================================================
// FLIGHTRADAR24 API FUNCTIONS
// ============================================================================

async function fr24LiveLookup({ ident, flightId, full = false }: { ident?: string; flightId?: string; full?: boolean }) {
  const params: any = {};
  if (flightId) params.flight = flightId;
  else if (ident) params.callsigns = ident; // FR24 requires 'callsigns' (plural)
  params.limit = 50;

  // Always use full API for complete data
  const endpoint = '/live/flight-positions/full';
  
  // Add debugging for the API call
  console.log('=== FR24 API CALL DEBUG ===');
  console.log('Endpoint:', endpoint);
  console.log('Params:', params);
  console.log('Full URL:', `${fr24.defaults.baseURL}${endpoint}`);
  
  try {
    const res = await fr24.get(endpoint, { params, validateStatus: () => true });
    console.log('FR24 API Response Status:', res.status);
    console.log('FR24 API Response Headers:', res.headers);
    console.log('FR24 API Response Data:', JSON.stringify(res.data, null, 2));
    
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
  } catch (error: any) {
    console.error('FR24 API call failed:', error);
    return {
      error: error.message,
      code: error.code,
      response: error.response?.data
    };
  }
}

async function fr24FlightSummary({ ident }: { ident: string }) {
  try {
    // Get flight summary from FR24 using the correct endpoint
    const res = await fr24.get('/flights', { 
      params: { query: ident, limit: 1 },
      validateStatus: () => true 
    });
    
    console.log('=== FR24 FLIGHT SUMMARY DEBUG ===');
    console.log('Flight Summary Response Status:', res.status);
    console.log('Flight Summary Response Data:', JSON.stringify(res.data, null, 2));
    
    if (res.status === 200 && res.data?.result?.response?.data?.length > 0) {
      return res.data.result.response.data[0];
    }
    
    return null;
  } catch (error: any) {
    console.error('FR24 Flight Summary API call failed:', error);
    return null;
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sanitizeQueryParam(param: string): string {
  if (!param) return "";
  return param.replace(/\s+/g, "%20");
}

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

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  const id = (req as any).id;
  log("health.check", { id });
  res.json({ ok: true, ts: Date.now() });
});

// Canonical flight lookup endpoint with caching and rate limiting
app.get('/api/flight', async (req, res) => {
  try {
    const identRaw = (req.query.number as string) || (req.query.callsign as string) || (req.query.ident as string) || '';
    const ident = identRaw.trim().toUpperCase();
    const full = req.query.full === 'true';
    
    console.log('=== FLIGHT SEARCH DEBUG ===');
    console.log('Search query:', ident);
    console.log('Full data requested:', full);
    
    if (!ident) {
      return res.status(400).json({ error: 'Provide ?number=, ?callsign=, or ?ident=' });
    }

    const cacheKey = `flight:${ident}:${full}`;
    
    // single inflight per key
    const result = await withInflight(cacheKey, async () => {
      lastCall.set(keyForThrottle, Date.now());
      
      // Direct FlightRadar24 API call - no filtering, no complex logic
      const liveData = await fr24LiveLookup({ ident, full });
      
      console.log('=== FR24 RESPONSE DEBUG ===');
      console.log('FR24 returned data:', liveData);
      
      // If FR24 returns any data, return it directly
      if (liveData && liveData.data && liveData.data.length > 0) {
        console.log('✅ Flight found, returning raw FR24 data');
        const rawData = liveData.data[0];
        
        // Enhanced response with full API data
        return {
          success: true,
          callsign: rawData.callsign,
          fr24_id: rawData.fr24_id,
          flight: rawData.flight,
          
          // Aircraft information from full API
          aircraft: rawData.type || 'Aircraft Type Unknown',
          registration: rawData.reg || null,
          hex: rawData.hex || null,
          
          // Airline information
          airline: rawData.painted_as || rawData.callsign?.substring(0, 3) || null,
          airlineName: getAirlineName(rawData.painted_as || rawData.callsign?.substring(0, 3)),
          operatingAs: rawData.operating_as || null,
          
          // Route information from full API
          origin: {
            iata: rawData.orig_iata || null,
            icao: rawData.orig_icao || null
          },
          destination: {
            iata: rawData.dest_iata || null,
            icao: rawData.dest_icao || null
          },
          eta: rawData.eta || null,
          
          // Position data
          lastPosition: {
            lat: rawData.lat,
            lon: rawData.lon,
            alt: rawData.alt,
            altitude: rawData.alt,
            speed: rawData.gspeed,
            groundSpeed: rawData.gspeed,
            track: rawData.track,
            squawk: rawData.squawk,
            timestamp: rawData.timestamp,
            time: rawData.timestamp,
            verticalSpeed: rawData.vspeed,
            vspeed: rawData.vspeed
          },
          
          // Additional data from full API
          source: rawData.source || null,
          
          // Backward compatibility fields
          lat: rawData.lat,
          lon: rawData.lon,
          alt: rawData.alt,
          altitude: rawData.alt,
          speed: rawData.gspeed,
          groundSpeed: rawData.gspeed,
          track: rawData.track,
          squawk: rawData.squawk,
          timestamp: rawData.timestamp,
          time: rawData.timestamp,
          
          // Include all raw data for debugging
          ...rawData
        };
      } else {
        console.log('❌ No flight data returned from FR24');
        return null;
      }
    });

    if (result) {
      console.log('✅ Sending flight data to client');
      res.json(result);
    } else {
      console.log('❌ No flight data to send, returning 404');
      res.status(404).json({ error: 'Flight not found' });
    }
  } catch (err: any) {
    console.error('Flight search error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Test flight endpoint for debugging route progress
app.get('/api/test-flight', (req, res) => {
  res.json({
    summary: {
      callsign: "TEST123",
      fr24_id: "test123",
      status: "ENROUTE",
      orig_icao: "LTFM",
      dest_icao: "KJFK"
    },
    lastPosition: {
      lat: 65.577,
      lon: -12.428,
      altitude: "FL369",
      groundSpeed: "454 kt",
      verticalSpeed: "+320 ft/min",
      track: "298°",
      squawk: "2731",
      type: "Boeing 777-300ER",
      timestamp: Date.now() - 120000
    },
    fr24: { data: [] },
    success: true
  });
});

// Basic airports endpoint for route progress calculation
app.get('/api/airports', (req, res) => {
  try {
    const icaos = (req.query.icaos as string)?.split(',').filter(Boolean) || [];
    
    if (!icaos.length) {
      return res.status(400).json({ error: 'Provide ?icaos=KJFK,KLAX' });
    }

    // Import flight utilities from JSON file
    const flightUtils = require('./flight-utils.json');
    const airportsDatabase = flightUtils.airports;

    // Debug logging
    console.log('=== AIRPORTS DEBUG ===');
    console.log('Requested ICAOs:', icaos);
    console.log('Database has YSSY?', !!airportsDatabase['YSSY']);
    console.log('Database has YBBN?', !!airportsDatabase['YBBN']);
    console.log('YSSY coords:', airportsDatabase['YSSY']);
    console.log('YBBN coords:', airportsDatabase['YBBN']);
    console.log('Total airports in database:', Object.keys(airportsDatabase).length);

    // Look up requested airports
    const result: Record<string, { lat: number; lon: number } | undefined> = {};
    
    for (const icao of icaos) {
      result[icao] = airportsDatabase[icao] || undefined;
    }

    res.json(result);
  } catch (err: any) {
    console.error('Airports error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Final error guard
app.use((err: any, req: any, res: any, _next: any) => {
  const id = req?.id;
  // eslint-disable-next-line no-console
  console.error("fatal.unhandled", id, err);
  res.status(500).json({ requestId: id, error: "UNHANDLED" });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  log("server.start", { port: PORT, env: process.env.NODE_ENV || "development" });
});
