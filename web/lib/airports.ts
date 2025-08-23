// lib/airports.ts
import type { LatLon } from "./geo";

type ApiAirports = Record<string, { lat: number; lon: number } | undefined>;

export async function resolveAirports(icaos: string[]): Promise<ApiAirports> {
  if (!icaos.length) return {};
  try {
    // Use relative path to hit Next.js API route
    const url = "/api/airports";
    const fullUrl = `${url}?icaos=${icaos.join(",")}`;
    
    console.log("Fetching airports from:", fullUrl);
    const res = await fetch(fullUrl, { cache: "force-cache" });
    if (!res.ok) {
      console.warn("Airports API response not ok:", res.status);
      return {};
    }
    const data = await res.json();
    console.log("Airports API response:", data);
    return data as ApiAirports;
  } catch (error) {
    console.warn("Failed to fetch airports:", error);
    return {};
  }
}
