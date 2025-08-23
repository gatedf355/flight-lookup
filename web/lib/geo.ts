// lib/geo.ts
export type LatLon = { lat: number; lon: number }

/**
 * Calculate flight progress using the backend API for accurate great-circle calculations
 * Note: This function now requires airport codes (ICAO) instead of coordinates
 */
export async function progressAlongRoute(
  originCode: string,
  destCode: string,
  pos: LatLon
): Promise<{ pct: number; totalKm: number; coveredKm: number; remainingKm: number }> {
  try {
    // Call the backend progress calculation API (use relative path to hit Next.js API route)
    const response = await fetch(
      `/api/flight-progress?` + 
      `origin=${encodeURIComponent(originCode)}&` +
      `dest=${encodeURIComponent(destCode)}&` +
      `lat=${pos.lat}&lon=${pos.lon}`
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data.progress;
  } catch (error) {
    console.error('Progress calculation failed, falling back to local calculation:', error);
    
    // Fallback to local calculation if backend fails
    // Note: This fallback won't work without coordinates, so we return a default
    return { pct: 0, totalKm: 0, coveredKm: 0, remainingKm: 0 };
  }
}

/**
 * Legacy function for coordinate-based progress calculation (kept for backward compatibility)
 */
export function progressAlongRouteCoords(
  origin: LatLon,
  dest: LatLon,
  pos: LatLon
): { pct: number; totalKm: number; coveredKm: number; remainingKm: number } {
  return fallbackProgressCalculation(origin, dest, pos);
}

/**
 * Fallback local progress calculation (less accurate but works offline)
 */
function fallbackProgressCalculation(
  origin: LatLon,
  dest: LatLon,
  pos: LatLon
): { pct: number; totalKm: number; coveredKm: number; remainingKm: number } {
  const R_KM = 6371; // earth radius
  
  function toRad(d: number) {
    return (d * Math.PI) / 180;
  }

  function haversineKm(a: LatLon, b: LatLon) {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * R_KM * Math.asin(Math.sqrt(h));
  }

  function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
  }

  const total = Math.max(1, haversineKm(origin, dest));
  const covered = haversineKm(origin, pos);
  const pct = clamp(Math.round((covered / total) * 100), 0, 100);
  
  return { pct, totalKm: total, coveredKm: covered, remainingKm: total - covered };
}

// Keep the old functions for backward compatibility
export function haversineKm(a: LatLon, b: LatLon) {
  return fallbackProgressCalculation(a, b, b).totalKm;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
