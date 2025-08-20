export interface Env { FR24_KEY: string }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') return new Response('ok', { status: 200 });

    if (url.pathname === '/api/flight') {
      const callsign = url.searchParams.get('callsign') ?? '';
      if (!callsign) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Missing callsign',
          status: {
            active: false,
            text: 'BAD_REQUEST'
          }
        }), {
          status: 400, headers: { 'content-type': 'application/json' }
        });
      }

      try {
        // Use the exact same endpoints as the working Express server
        // First try live flight data
        const liveEndpoint = `https://fr24api.flightradar24.com/api/live/flight-positions/full?callsigns=${encodeURIComponent(callsign)}&limit=1`;
        const liveRes = await fetch(liveEndpoint, { 
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'flightlookup/1.0',
            'Authorization': `Bearer ${env.FR24_KEY}`,
            'Accept-Version': 'v1'
          }
        });

        if (liveRes.ok) {
          const liveData: any = await liveRes.json();
          
          // Use the exact same logic as the working local server
          if (liveData && liveData.data && liveData.data.length > 0) {
            // We have live flight data
            const flightData = liveData.data[0];
            const normalized = {
              success: true,
              status: { active: true, text: 'ACTIVE' },
              flight: flightData,
              result: { active: true },
              raw: liveData,
              // Match the exact structure from the working local server
              callsign: flightData.callsign,
              fr24_id: flightData.fr24_id,
              aircraft: flightData.type,
              registration: flightData.reg,
              hex: flightData.hex,
              airline: flightData.painted_as,
              airlineName: flightData.painted_as ? `${flightData.painted_as} Airlines` : null,
              operatingAs: flightData.operating_as,
              origin: {
                iata: flightData.orig_iata,
                icao: flightData.orig_icao
              },
              destination: {
                iata: flightData.dest_iata,
                icao: flightData.dest_icao
              },
              eta: flightData.eta,
              lastPosition: {
                lat: flightData.lat,
                lon: flightData.lon,
                alt: flightData.alt,
                altitude: flightData.alt,
                speed: flightData.gspeed,
                groundSpeed: flightData.gspeed,
                track: flightData.track,
                squawk: flightData.squawk,
                timestamp: flightData.timestamp,
                time: flightData.timestamp,
                verticalSpeed: flightData.vspeed,
                vspeed: flightData.vspeed
              },
              source: flightData.source,
              lat: flightData.lat,
              lon: flightData.lon,
              alt: flightData.alt,
              gspeed: flightData.gspeed,
              vspeed: flightData.vspeed,
              type: flightData.type,
              reg: flightData.reg,
              painted_as: flightData.painted_as,
              operating_as: flightData.operating_as,
              orig_iata: flightData.orig_iata,
              orig_icao: flightData.orig_icao,
              dest_iata: flightData.dest_iata,
              dest_icao: flightData.dest_icao
            };

            return new Response(JSON.stringify(normalized), {
              status: 200,
              headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
            });
          }
        }

        // Fallback to flight summary if no live data
        const summaryEndpoint = `https://fr24api.flightradar24.com/api/flights?query=${encodeURIComponent(callsign)}&limit=1`;
        const summaryRes = await fetch(summaryEndpoint, { 
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'flightlookup/1.0',
            'Authorization': `Bearer ${env.FR24_KEY}`,
            'Accept-Version': 'v1'
          }
        });

        if (summaryRes.ok) {
          const summaryData: any = await summaryRes.json();
          const flightData = summaryData?.result?.response?.data?.[0];
          
          if (flightData) {
            const normalized = {
              success: true,
              status: { active: false, text: 'SCHEDULED' },
              flight: flightData,
              result: { active: false },
              raw: summaryData,
              // Extract key fields for UI compatibility
              callsign: flightData.identification?.callsign,
              airline: flightData.airline?.code?.iata,
              airlineName: flightData.airline?.name,
              origin: {
                iata: flightData.airport?.origin?.code?.iata,
                icao: flightData.airport?.origin?.code?.icao,
                name: flightData.airport?.origin?.name
              },
              destination: {
                iata: flightData.airport?.destination?.code?.iata,
                icao: flightData.airport?.destination?.code?.icao,
                name: flightData.airport?.destination?.name
              }
            };

            return new Response(JSON.stringify(normalized), {
              status: 200,
              headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
            });
          }
        }

        // No flight data found
        return new Response(JSON.stringify({
          success: false,
          error: 'Flight not found',
          status: { active: false, text: 'NOT_FOUND' }
        }), {
          status: 404,
          headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Internal server error',
          status: { active: false, text: 'ERROR' }
        }), {
          status: 500,
          headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
      }
    }

    // Progress endpoint - ported from working local Express server
    if (url.pathname === '/api/flight-progress') {
      const originCode = url.searchParams.get('origin') || url.searchParams.get('from') || url.searchParams.get('o');
      const destCode = url.searchParams.get('dest') || url.searchParams.get('to') || url.searchParams.get('d');
      const lat = Number(url.searchParams.get('lat') || url.searchParams.get('latitude') || url.searchParams.get('latDeg'));
      const lon = Number(url.searchParams.get('lon') || url.searchParams.get('lng') || url.searchParams.get('longitude') || url.searchParams.get('lonDeg'));

      if (!originCode || !destCode || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return new Response(JSON.stringify({
          success: false,
          error: "Missing origin/dest/lat/lon",
          hint: "Example: /api/flight-progress?origin=KTPA&dest=EHAM&lat=28.3&lon=-82.5",
          status: {
            active: false,
            text: 'BAD_REQUEST'
          }
        }), {
          status: 400,
          headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
      }

      // Simple airport data for common airports (ported from your working local server)
      const airports: { [key: string]: { lat: number, lon: number, icao: string, iata: string } } = {
        'KJFK': { lat: 40.6413, lon: -73.7781, icao: 'KJFK', iata: 'JFK' },
        'KLAX': { lat: 33.9416, lon: -118.4085, icao: 'KLAX', iata: 'LAX' },
        'CYYZ': { lat: 43.6777, lon: -79.6248, icao: 'CYYZ', iata: 'YYZ' },
        'KORD': { lat: 41.9786, lon: -87.9048, icao: 'KORD', iata: 'ORD' },
        'KBOS': { lat: 42.3656, lon: -71.0096, icao: 'KBOS', iata: 'BOS' },
        'KTPA': { lat: 27.9756, lon: -82.5333, icao: 'KTPA', iata: 'TPA' },
        'EHAM': { lat: 52.3105, lon: 4.7683, icao: 'EHAM', iata: 'AMS' }
      };

      const origin = airports[originCode.toUpperCase()];
      const dest = airports[destCode.toUpperCase()];

      if (!origin || !dest) {
        return new Response(JSON.stringify({
          success: false,
          error: "Airport not found",
          originCode, destCode,
          foundOrigin: Boolean(origin),
          foundDest: Boolean(dest),
          status: {
            active: false,
            text: 'NOT_FOUND'
          }
        }), {
          status: 404,
          headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
      }

      // Haversine calculation (ported from your working local server)
      const toRad = (d: number) => (d * Math.PI) / 180;
      const haversineKm = (a: { lat: number, lon: number }, b: { lat: number, lon: number }) => {
        const R = 6371;
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lon - a.lon);
        const la1 = toRad(a.lat);
        const la2 = toRad(b.lat);
        const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
        return 2 * R * Math.asin(Math.sqrt(h));
      };
      const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

      const pos = { lat, lon };
      const totalKm = Math.max(1, haversineKm(origin, dest));
      const coveredKm = haversineKm(origin, pos);
      const pct = clamp(Math.round((coveredKm / totalKm) * 100), 0, 100);

      return new Response(JSON.stringify({
        origin: { code: originCode, lat: origin.lat, lon: origin.lon, icao: origin.icao, iata: origin.iata },
        destination: { code: destCode, lat: dest.lat, lon: dest.lon, icao: dest.icao, iata: dest.iata },
        currentPosition: pos,
        progress: { pct, totalKm, coveredKm, remainingKm: Math.max(0, totalKm - coveredKm) }
      }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
      });
    }

    return new Response('not found', { status: 404 });
  }
}
