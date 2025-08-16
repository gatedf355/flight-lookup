import express from "express";
import { requestId } from "./middleware/requestId";
import { log } from "./logger";
import dotenv from "dotenv";
import axios from "axios";
import { readFileSync } from "fs";
import { join } from "path";
import cors from "cors";

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

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

// Debug: Log API key (first 20 chars for security)
log("api.setup", { 
  baseUrl: 'https://fr24api.flightradar24.com/api',
  apiKeyPrefix: process.env.FR24_API_KEY?.substring(0, 20) + '...',
  apiKeyLength: process.env.FR24_API_KEY?.length || 0,
  envKeys: Object.keys(process.env).filter(key => key.includes('FR24'))
});

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

// Fetch flight track data
async function fetchFlightTrack(fr24Id: string): Promise<Position[]> {
  try {
    const { data } = await fr24.get('/flight-tracks', { 
      params: { flight_id: fr24Id } 
    });
    
    const trackArray = data?.data?.[0]?.track;
    if (Array.isArray(trackArray)) {
      return trackArray.map((point: any) => ({
        lat: point.lat,
        lon: point.lon,
        altitude: point.alt || point.altitude,
        time: point.time || point.timestamp
      }));
    }
  } catch (error: any) {
    log("track.fetch.error", { fr24Id, error: error.message });
  }
  return [];
}

// Enrich flight info with names
async function enrichFlightInfoNames(flightInfo: FlightInfo): Promise<void> {
  const summary = flightInfo.summary;
  if (!summary) return;

  try {
    // Get airline name
    if (summary.callsign) {
      const airlineIcao = summary.callsign.substring(0, Math.min(3, summary.callsign.length));
      const { data: airlineData } = await fr24.get(`/static/airlines/${airlineIcao}/light`);
      if (airlineData?.name) {
        flightInfo.airlineName = airlineData.name;
      }
    }

    // Get origin airport name
    if (summary.orig_icao) {
      const { data: airportData } = await fr24.get(`/static/airports/${summary.orig_icao}/light`);
      if (airportData?.name) {
        flightInfo.originName = airportData.name;
      } else if (airportData?.data?.name) {
        flightInfo.originName = airportData.data.name;
      }
    }

    // Get destination airport name
    if (summary.dest_icao) {
      const { data: airportData } = await fr24.get(`/static/airports/${summary.dest_icao}/light`);
      if (airportData?.name) {
        flightInfo.destinationName = airportData.data.name;
      } else if (airportData?.data?.name) {
        flightInfo.destinationName = airportData.data.name;
      }
    }
  } catch (error: any) {
    log("enrich.names.error", { error: error.message });
  }
}

// Find live flight by callsign
async function findLiveFlightByCallsign(callsign: string): Promise<FlightInfo | null> {
  try {
    const { data } = await fr24.get('/live/flight-positions/light', {
      params: { callsign: sanitizeQueryParam(callsign) }
    });

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    const flightNode = Array.isArray(data) ? data[0] : data;
    
    // Build summary from live data
    const summary: FlightSummaryEntry = {
      callsign: flightNode.callsign,
      flight: undefined, // Will derive from callsign
      orig_icao: undefined,
      dest_icao: undefined,
      datetime_takeoff: undefined,
      datetime_landed: undefined,
      flight_ended: false,
      reg: flightNode.reg || flightNode.registration,
      type: flightNode.type
    };

    // Derive flight number from callsign if possible
    if (summary.callsign) {
      const match = summary.callsign.match(/^([A-Za-z]+)(\d+)/);
      if (match) {
        const csPrefix = match[1];
        const csDigits = match[2];
        // Find IATA code from ICAO
        const iataCode = Object.keys(airlinesMap).find(key => airlinesMap[key] === csPrefix);
        summary.flight = (iataCode || csPrefix) + csDigits;
      }
    }

    const flightInfo: FlightInfo = { summary };
    
    // Build position from live data
    const position: Position = {
      lat: flightNode.lat,
      lon: flightNode.lon,
      altitude: flightNode.alt,
      time: flightNode.updated
    };
    
    flightInfo.lastPosition = position;
    flightInfo.track = [position];
    
    return flightInfo;
  } catch (error: any) {
    log("live.flight.error", { callsign, error: error.message });
    return null;
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  const id = (req as any).id;
  log("health.check", { id });
  res.json({ ok: true, ts: Date.now() });
});

// Flight lookup endpoint with comprehensive Flightradar24 integration
app.get('/api/flight', async (req, res) => {
  const id = (req as any).id;
  const flightNumber = (req.query.number as string || '').trim();
  const callsign = (req.query.callsign as string || '').trim();
  
  if (!flightNumber && !callsign) {
    return res.status(400).json({ 
      error: "Missing 'number' or 'callsign' query parameter." 
    });
  }

  try {
    log("flight.lookup", { id, flightNumber, callsign });
    
    let searchFlight: string;
    let targetCallsign: string | undefined;
    
    if (flightNumber) {
      searchFlight = flightNumber;
      targetCallsign = deriveCallsignFromFlightNumber(flightNumber) || undefined;
    } else {
      searchFlight = callsign;
      targetCallsign = callsign;
    }

    // Prepare time window for search - use 14 days (10 back + 4 forward) to increase chances of finding flights
    const timeWindow = getTimeWindow(); // 14 days total (within API limit)
    
    // Build Flight Summary API URL
    const summaryUrl = `/flight-summary/light?flights=${sanitizeQueryParam(searchFlight)}&flight_datetime_from=${timeWindow.from}&flight_datetime_to=${timeWindow.to}`;
    log("flight.summary.url", { summaryUrl, searchFlight, timeWindow });
    
    let flightInfo: FlightInfo | null = null;
    let summaries: FlightSummaryEntry[] = [];

    try {
      const { data } = await fr24.get(summaryUrl);
      const summaryData = data?.data;
      
      if (Array.isArray(summaryData)) {
        summaries = summaryData;
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        log("flight.summary.forbidden", { id, searchFlight });
        return res.status(403).json({ 
          error: "Not permitted to access flight summary endpoint (API plan limit)." 
        });
      }
      log("flight.summary.error", { id, searchFlight, error: error.message });
    }

    if (summaries.length > 0) {
      log("flight.summary.results", { id, count: summaries.length });
      
      // Sort by takeoff time and pick the latest
      summaries.sort((a, b) => {
        const aTime = a.datetime_takeoff ? new Date(a.datetime_takeoff).getTime() : 0;
        const bTime = b.datetime_takeoff ? new Date(b.datetime_takeoff).getTime() : 0;
        return aTime - bTime;
      });
      
      const best = summaries[summaries.length - 1];
      log("flight.summary.found", { 
        id, 
        flight: best.flight, 
        origin: best.orig_icao, 
        destination: best.dest_icao,
        takeoff: best.datetime_takeoff
      });
      
      flightInfo = { summary: best };
      
      // Enrich with names
      await enrichFlightInfoNames(flightInfo);
      
      // Get track data if available
      if (best.fr24_id) {
        const track = await fetchFlightTrack(best.fr24_id);
        flightInfo.track = track;
        if (track.length > 0) {
          flightInfo.lastPosition = track[track.length - 1];
        }
      }
    } else {
      log("flight.summary.no.results", { id, searchFlight, timeWindow });
    }

    // Fallback to live data if no summary found
    if (!flightInfo && targetCallsign) {
      log("flight.live.fallback", { id, callsign: targetCallsign });
      flightInfo = await findLiveFlightByCallsign(targetCallsign);
      
      if (flightInfo) {
        log("flight.live.found", { 
          id, 
          callsign: targetCallsign,
          lat: flightInfo.lastPosition?.lat,
          lon: flightInfo.lastPosition?.lon
        });
      }
    }

    if (!flightInfo) {
      return res.status(404).json({ 
        error: `Flight ${searchFlight} not found.` 
      });
    }

    res.json(flightInfo);
    
  } catch (error: any) {
    log("flight.lookup.error", { id, error: error.message });
    res.status(502).json({ 
      error: "Flight data lookup failed. Please try again later.",
      detail: error.message 
    });
  }
});

// Live flight positions endpoint (working example from requirements)
app.get("/api/live/positions", async (req, res) => {
  const id = (req as any).id;
  const { bounds, limit = 10 } = req.query;
  if (!bounds) return res.status(400).json({ error: "bounds parameter required (N,S,E,W)" });
  
  try {
    log("live.positions", { id, bounds, limit });
    const { data } = await fr24.get('/live/flight-positions/light', { 
      params: { bounds, limit } 
    });
    res.json(data);
  } catch (e: any) {
    log("live.positions.error", { id, message: e?.message });
    res.status(502).json({ error: "upstream error", detail: e?.message });
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
