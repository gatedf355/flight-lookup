export const runtime = 'edge';
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
    const res = await fetch(upstream, { 
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // Transform the FR24 response to match frontend expectations
      const transformedData = {
        success: true,
        callsign: data.callsign || data.flight,
        status: data.status || 'ACTIVE', // Default to ACTIVE if no status
        active: data.active !== false, // Default to true unless explicitly false
        summary: {
          callsign: data.callsign || data.flight,
          status: data.status || 'ACTIVE',
          orig_icao: data.orig_icao || data.origin?.icao,
          dest_icao: data.orig_icao || data.destination?.icao,
          origin: data.origin?.iata || data.orig_iata,
          destination: data.destination?.iata || data.dest_iata
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
    return new Response('Backend service unavailable', { status: 503 });
  }
}
