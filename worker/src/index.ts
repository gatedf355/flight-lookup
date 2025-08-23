import { Hono } from 'hono'
const app = new Hono()

// simple echo endpoint to prove wiring works
app.get('/api/flight', c => {
  const url = new URL(c.req.url)
  return c.json({
    ok: true,
    env: 'workers',
    callsign: url.searchParams.get('callsign') ?? null
  })
})

export default app
