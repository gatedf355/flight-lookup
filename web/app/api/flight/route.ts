export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callsign = url.searchParams.get('callsign');
  const full = url.searchParams.get('full');
  const searchType = url.searchParams.get('searchType');
  
  if (!callsign) return new Response('Missing callsign', { status: 400 });

  // Convert IATA code to ICAO callsign if needed
  let searchCallsign = callsign;
  let originalQuery = callsign;
  
  // Check if input starts with a 2-3 character IATA airline code
  const airlineCodeMatch = callsign.match(/^([A-Z]{2,3})/);
  if (airlineCodeMatch) {
    const airlineCode = airlineCodeMatch[1];
    // Try to find the airline by IATA code
    const { getAirlineByCode } = await import('@/lib/airlineDatabase');
    
    const airline = getAirlineByCode(airlineCode);
    if (airline && airline.icao) {
      // Extract the flight number part (everything after the airline code)
      const flightNumber = callsign.substring(airlineCode.length);
      // Convert to ICAO callsign format (e.g., "BA178" -> "BAW178")
      searchCallsign = `${airline.icao}${flightNumber}`;
      console.log(`Converting IATA code "${airlineCode}" to ICAO callsign "${searchCallsign}" (original: "${callsign}")`);
    }
  }

  // Call the Cloudflare Worker backend directly
  const backendUrl = 'https://skynerd-api.gatedf355.workers.dev';
  const upstream = `${backendUrl}/api/flight?callsign=${encodeURIComponent(searchCallsign)}&full=${full || 'false'}&searchType=${searchType || 'callsign'}`;
  
  try {
    console.log('Calling backend:', upstream);
    const res = await fetch(upstream, { 
      headers: { accept: 'application/json' }
    });
    console.log('Backend response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      
      // Transform the FR24 response to match frontend expectations
      const flightData = data.result?.response?.flight?.data?.[0];
      
      const transformedData = {
        success: true,
        callsign: flightData?.identification?.callsign || 'N/A',
        status: 'ACTIVE', // Default to ACTIVE
        active: true, // Default to true
        summary: {
          callsign: flightData?.identification?.callsign || 'N/A',
          status: 'ACTIVE',
          orig_icao: flightData?.airport?.origin?.code?.icao || 'N/A',
          dest_icao: flightData?.airport?.destination?.code?.icao || 'N/A',
          origin: flightData?.airport?.origin?.code?.iata || 'N/A',
          destination: flightData?.airport?.destination?.code?.iata || 'N/A'
        },
        // Extract key flight information
        airline: flightData?.airline?.name || 'N/A',
        airlineCode: flightData?.airline?.code?.iata || 'N/A',
        origin: {
          name: flightData?.airport?.origin?.name || 'N/A',
          iata: flightData?.airport?.origin?.code?.iata || 'N/A',
          icao: flightData?.airport?.origin?.code?.icao || 'N/A'
        },
        destination: {
          name: flightData?.airport?.destination?.name || 'N/A',
          iata: flightData?.airport?.destination?.code?.iata || 'N/A',
          icao: flightData?.airport?.destination?.code?.icao || 'N/A'
        },
        // Keep all the original fields
        ...data
      };
      
      return new Response(JSON.stringify(transformedData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    } else {
      // Pass through the error response with conversion info if applicable
      let errorResponse = await res.text();
      
      if (searchCallsign !== originalQuery) {
        try {
          const errorData = JSON.parse(errorResponse);
          errorData.conversionInfo = {
            original: originalQuery,
            converted: searchCallsign,
            message: `Converted IATA code "${originalQuery}" to ICAO callsign "${searchCallsign}"`
          };
          errorResponse = JSON.stringify(errorData);
        } catch {
          // If error response isn't JSON, create a new error response
          const errorData = {
            error: 'Flight not found',
            conversionInfo: {
              original: originalQuery,
              converted: searchCallsign,
              message: `Converted IATA code "${originalQuery}" to ICAO callsign "${searchCallsign}"`
            }
          };
          errorResponse = JSON.stringify(errorData);
        }
      }
      
      return new Response(errorResponse, {
        status: res.status,
        headers: { 'content-type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error calling backend:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Backend service unavailable: ${errorMessage}`, { status: 503 });
  }
}
