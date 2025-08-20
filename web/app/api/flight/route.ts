export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callsign = url.searchParams.get('callsign');
  if (!callsign) return new Response('Missing callsign', { status: 400 });

  // Use environment variable for backend URL
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) return new Response('BACKEND_URL not set', { status: 503 });

  const upstream = `${backendUrl}/api/flight?callsign=${encodeURIComponent(callsign)}`;
  
  const res = await fetch(upstream, { headers: { accept: 'application/json' } });
  
  if (res.ok) {
    const data = await res.json();
    
    // The Express server already returns the correct format, just pass it through
    return new Response(JSON.stringify(data), {
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
}
