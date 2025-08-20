export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  const backend = process.env.BACKEND_URL;
  
  if (!backend) return new Response('BACKEND_URL not set', { status: 503 });
  
  const upstream = `${backend}/api/flight-progress?${qs}`;
  const r = await fetch(upstream, { headers: { accept: 'application/json' } });
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }
  });
}
