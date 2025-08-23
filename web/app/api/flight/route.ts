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
  
  // Check if input is a 2-3 character IATA airline code
  if (callsign.length >= 2 && callsign.length <= 3 && /^[A-Z]{2,3}$/.test(callsign)) {
    // Import the airline database functions
    const { getAirlineByCode } = await import('@/lib/airlineDatabase');
    
    // Try to find the airline by IATA code
    const airline = getAirlineByCode(callsign);
    if (airline && airline.icao) {
      // Convert to ICAO callsign format (e.g., "BA" -> "BAW178")
      // For now, we'll try a common flight number pattern
      searchCallsign = `${airline.icao}178`;
      console.log(`Converting IATA code "${callsign}" to ICAO callsign "${searchCallsign}"`);
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
