import fs from "fs";
import { parse } from "csv-parse/sync";

const SRC = "airports.csv";                       // local file only
const IN  = process.argv[2] || "flight-utils.json";
const OUT = process.argv[3] || "flight-utils.full.json";

function validIcao(c){ return /^[A-Z]{4}$/.test(c); }
function validLatLon(lat,lon){
  return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
}

// read CSV locally (no fetch, no TLS)
const text = fs.readFileSync(SRC, "utf8");
const rows = parse(text, { columns: true, skip_empty_lines: true });

const keep = new Set(["large_airport","medium_airport","small_airport"]);
const base = fs.existsSync(IN) ? JSON.parse(fs.readFileSync(IN,"utf8")) : { airports:{} };
const out  = { ...base.airports };

for (const r of rows){
  const icao = (r.ident||"").trim().toUpperCase();
  const iata = (r.iata_code||"").trim().toUpperCase();
  const lat = Number(r.latitude_deg);
  const lon = Number(r.longitude_deg);

  if (!keep.has(r.type)) continue;
  if (!validIcao(icao)) continue;
  if (!iata || iata==="\\N" || iata==="NULL") continue;
  if (!validLatLon(lat,lon)) continue;

  out[icao] = { lat, lon, iata };
}

fs.writeFileSync(OUT, JSON.stringify({ airports: out }, null, 2));
console.log(`Wrote ${Object.keys(out).length} airports to ${OUT}`);
