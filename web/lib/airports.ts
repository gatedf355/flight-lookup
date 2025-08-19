// lib/airports.ts
import type { LatLon } from "./geo";

type ApiAirports = Record<string, { lat: number; lon: number } | undefined>;

export async function resolveAirports(icaos: string[]): Promise<ApiAirports> {
  if (!icaos.length) return {};
  try {
    // For local development, use the correct port
    const baseUrl = typeof window === "undefined" ? "http://localhost:4000" : "http://localhost:4000";
    const url = new URL("/api/airports", baseUrl);
    url.searchParams.set("icaos", icaos.join(","));
    
    console.log("Fetching airports from:", url.toString());
    const res = await fetch(url.toString(), { cache: "force-cache" });
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
