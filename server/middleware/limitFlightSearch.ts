// server/middleware/limitFlightSearch.ts
import type { Request, Response, NextFunction } from 'express';

/**
 * Dual-layer rate limiter:
 * 1. Per IP + flight: specific flight can only be searched once every 30s by same IP
 * 2. Per IP general: prevents rapid searches across all flights (10s interval)
 */
export function limitFlightSearch(perFlightMs = 30_000, generalMs = 10_000) {
  const lastFlightHit = new Map<string, number>(); // IP:FLIGHT specific
  const lastGeneralHit = new Map<string, number>(); // IP general

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['cf-connecting-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      'unknown';

    const flight = String(req.query.callsign ?? req.query.registration ?? '')
      .trim()
      .toUpperCase();

    const now = Date.now();

    // Check 1: General rate limit (prevents rapid searching across all flights)
    const generalKey = ip;
    const prevGeneral = lastGeneralHit.get(generalKey) ?? 0;
    const generalDiff = now - prevGeneral;

    if (generalDiff < generalMs) {
      const retryMs = generalMs - generalDiff;
      const retrySec = Math.max(1, Math.ceil(retryMs / 1000));
      res.setHeader('Retry-After', String(retrySec));
      res.setHeader('X-RateLimit-Rule', 'general-rate-limit');
      return res.status(429).json({
        error: 'You are searching too quickly. Please wait before trying again.',
        retryAfterSeconds: retrySec,
      });
    }

    // Check 2: Per-flight rate limit (specific flight can only be searched every 30s)
    if (flight) {
      const flightKey = `${ip}:${flight}`;
      const prevFlight = lastFlightHit.get(flightKey) ?? 0;
      const flightDiff = now - prevFlight;

      if (flightDiff < perFlightMs) {
        const retryMs = perFlightMs - flightDiff;
        const retrySec = Math.max(1, Math.ceil(retryMs / 1000));
        res.setHeader('Retry-After', String(retrySec));
        res.setHeader('X-RateLimit-Rule', 'per-flight-rate-limit');
        return res.status(429).json({
          error: `You already searched for "${flight}" recently. Please wait before searching for this flight again.`,
          retryAfterSeconds: retrySec,
          flight: flight,
        });
      }

      // Update per-flight timestamp
      lastFlightHit.set(flightKey, now);
    }

    // Update general timestamp
    lastGeneralHit.set(generalKey, now);
    next();
  };
}
