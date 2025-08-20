export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const DEFAULT_PROD_BACKEND = 'https://skynerd-api.gatedf355.workers.dev';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callsign = url.searchParams.get('callsign');
  if (!callsign) return new Response('Missing callsign', { status: 400 });

  // CHANGE THIS: fall back to the Worker URL in production
  const backendUrl =
    process.env.BACKEND_URL ??
    (process.env.NODE_ENV === 'production' ? DEFAULT_PROD_BACKEND : undefined);

  if (!backendUrl) return new Response('BACKEND_URL not set', { status: 503 });

  const upstream = `${backendUrl}/api/flight?callsign=${encodeURIComponent(callsign)}`;
  const res = await fetch(upstream, { headers: { accept: 'application/json' } });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
