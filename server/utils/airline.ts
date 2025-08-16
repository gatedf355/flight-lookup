import { ICAO_FROM_IATA, IATA_FROM_ICAO } from "../data/airlinesCodes";

export type Parsed = { iata?: string; icao?: string; num: string };

export function parseFlightIdent(input: string): Parsed {
  const raw = (input || "").replace(/\s+/g, "").toUpperCase();
  const m2 = raw.match(/^([A-Z]{2})(\d{1,4}[A-Z]?)$/);
  if (m2) return { iata: m2[1], num: m2[2] };
  const m3 = raw.match(/^([A-Z]{3})(\d{1,4}[A-Z]?)$/);
  if (m3) return { icao: m3[1], num: m3[2] };
  throw new Error("INVALID_FORMAT");
}

export function candidates(p: Parsed): string[] {
  const out = new Set<string>();
  if (p.iata) {
    out.add(`${p.iata}${p.num}`);
    const toIcao = ICAO_FROM_IATA.get(p.iata);
    if (toIcao) out.add(`${toIcao}${p.num}`);
  }
  if (p.icao) {
    out.add(`${p.icao}${p.num}`);
    const toIata = IATA_FROM_ICAO.get(p.icao);
    if (toIata) out.add(`${toIata}${p.num}`);
  }
  return [...out];
}
