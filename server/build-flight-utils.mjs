import fs from "fs";
import { parse } from "csv-parse/sync";

const SRC = process.env.AIRPORTS_CSV_URL || "airports.csv"; // local default
const IN  = process.argv[2] || "flight-utils.json";
const OUT = process.argv[3] || "flight-utils.full.json";

function validIcao(code) {
  return /^[A-Z]{4}$/.test(code);
}
function validLatLon(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) &&
         lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

let text;
if (/^https?:\/\//.test(SRC)) {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  text = await res.text();
} else {
  text = fs.readFileSync(SRC, "utf8");
}

const rows = parse(text, { columns: true, skip_empty_lines: true });

const wantedTypes = new Set(["large_airport","medium_airport","small_airport"]);

const base = fs.existsSync(IN) ? JSON.parse(fs.readFileSync(IN, "utf8")) : { airports: {} };
const outMap = { ...base.airports };

for (const r of rows) {
  const icao = (r.ident || "").trim().toUpperCase();
  const iata = (r.iata_code || "").trim().toUpperCase();
  const lat = Number(r.latitude_deg);
  const lon = Number(r.longitude_deg);

  if (!wantedTypes.has(r.type)) continue;           // skip heliport, seaplane_base, closed_airport
  if (!validIcao(icao)) continue;                   // ensure true ICAO
  if (!iata || iata === "\\N" || iata === "NULL") continue; // require IATA
  if (!validLatLon(lat, lon)) continue;

  outMap[icao] = { lat, lon, iata };
}

fs.writeFileSync(OUT, JSON.stringify({ airports: outMap }, null, 2));
console.log(`Wrote ${Object.keys(outMap).length} airports to ${OUT}`);
