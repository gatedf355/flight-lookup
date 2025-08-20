export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callsign = url.searchParams.get('callsign');
  const full = url.searchParams.get('full');
  const searchType = url.searchParams.get('searchType');
  
  if (!callsign) return new Response('Missing callsign', { status: 400 });

  // Call the Cloudflare Worker backend directly
  const backendUrl = 'https://skynerd-api.gatedf355.workers.dev';
  const upstream = `${backendUrl}/api/flight?callsign=${encodeURIComponent(callsign)}&full=${full || 'false'}&searchType=${searchType || 'callsign'}`;
  
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
      // Pass through the error response
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error calling backend:', error);
    console.error('Error details:', error.message, error.stack);
    return new Response(`Backend service unavailable: ${error.message}`, { status: 503 });
  }
}
