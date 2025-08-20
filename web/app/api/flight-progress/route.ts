export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  
  // Call the Cloudflare Worker backend directly
  const backend = 'https://skynerd-api.gatedf355.workers.dev';
  const upstream = `${backend}/api/flight-progress?${qs}`;
  
  try {
    const r = await fetch(upstream, { 
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }
    });
  } catch (error) {
    console.error('Error calling flight-progress backend:', error);
    return new Response('Backend service unavailable', { status: 503 });
  }
}
