// src/lib/normalize.js
function first(obj, keys) {
  for (const k of keys) {
    const v = obj && obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

const KTS_PER_MPS = 1/0.514444;
const KTS_PER_KMH = 1/1.852;
function toKts(v, unit){
  if (v==null) return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  if (unit==="mps") return Math.round(n*KTS_PER_MPS);
  if (unit==="kmh") return Math.round(n*KTS_PER_KMH);
  return Math.round(n);
}
function toFt(v, unit){
  if (v==null) return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  if (unit==="m") return Math.round(n*3.28084);
  return Math.round(n);
}

function toISO(v) {
  if (v == null) return null;
  if (typeof v === "number") return new Date((v < 1e12 ? v * 1000 : v)).toISOString();
  if (typeof v === "string" && /^\d{10,13}$/.test(v)) {
    const n = Number(v); return new Date((v.toString().length === 10 ? n * 1000 : n)).toISOString();
  }
  if (typeof v === "object") return toISO(v.utc ?? v.iso ?? v.time ?? v.date ?? null);
  return String(v);
}
function timeFrom(obj, keys) { return toISO(first(obj, keys)); }

export function normalize(payload) {
  if (payload?.number && payload?.times_utc) return payload;

  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : null;
  if (!rows || rows.length === 0) return null;

  const pick = pickBest(rows);

  const t   = pick.times || pick.time || pick.timestamps || pick;
  const dep = pick.departure || pick.origin || {};
  const arr = pick.arrival || pick.destination || {};

  const number   = first(pick, ["flight","number","display_name","flight_number","ident","callsign"]);
  const callsign = first(pick, ["callsign","cs"]);

  const airline_icao_operating = first(pick, ["operating_as","operated_as","airline_operating_icao","airline_icao_operating","op_icao"]);
  const airline_icao_marketing = first(pick, ["painted_as","airline_marketing_icao","airline_icao_marketing","mk_icao"]);

  const origin = {
    icao: first(pick, ["origin_icao","orig_icao","departure_icao"]) ?? first(dep, ["icao"]) ?? null,
    iata: first(pick, ["origin_iata","orig_iata","departure_iata"]) ?? first(dep, ["iata"]) ?? null,
  };
  const destination = {
    icao: first(pick, ["destination_icao","dest_icao","arrival_icao"]) ?? first(arr, ["icao"]) ?? null,
    icao_actual: first(pick, ["destination_icao_actual","dest_icao_actual"]) ?? null,
    iata: first(pick, ["destination_iata","dest_iata","arrival_iata","dest_iata_actual"]) ?? first(arr, ["iata"]) ?? null,
  };

  const aircraft = {
    type_icao: first(pick, ["aircraft_icao","type","aircraft_type_icao","model_icao"]),
    registration: first(pick, ["registration","reg","tail"]),
    hex: first(pick, ["hex","icao_hex"]) ?? null,
  };

  const times_utc = {
    sched_dep: timeFrom(t, ["datetime_scheduled_departure","scheduled_departure_utc","scheduled_departure_time_utc","departure_scheduled_time_utc","sched_off","std_utc","dep_scheduled_utc","scheduled_departure","scheduled_departure_time","std"]) ?? timeFrom(dep, ["scheduled_utc","scheduled","std_utc","std"]),
    actual_dep: timeFrom(t, ["datetime_takeoff","actual_departure_utc","actual_departure_time_utc","off","actual_off","atd_utc","dep_actual_utc","actual_departure"]) ?? timeFrom(dep, ["actual_utc","actual","atd_utc","atd"]),
    sched_arr: timeFrom(t, ["datetime_scheduled_arrival","scheduled_arrival_utc","scheduled_arrival_time_utc","arrival_scheduled_time_utc","sched_on","sta_utc","arr_scheduled_utc","scheduled_arrival","scheduled_arrival_time","sta"]) ?? timeFrom(arr, ["scheduled_utc","scheduled","sta_utc","sta"]),
    actual_arr: timeFrom(t, ["datetime_landed","actual_arrival_utc","actual_arrival_time_utc","on","actual_on","ata_utc","arr_actual_utc","actual_arrival"]) ?? timeFrom(arr, ["actual_utc","actual","ata_utc","ata"]),
    first_seen: timeFrom(pick, ["first_seen","firsttime","first_time"]),
    last_seen:  timeFrom(pick, ["last_seen","lasttime","last_time"]),
  };

  let position = null;

  // direct simple fields
  const lat = first(pick, ["lat","latitude"]);
  const lon = first(pick, ["lon","lng","longitude"]);
  const alt_ft = toFt(first(pick, ["altitude_ft","alt_ft","altitude"]), "ft"); // treat as feet if unknown
  const spd_kts = toKts(first(pick, ["speed_kts","gs_kts","ground_speed_kts","speed"]), "kts");
  if (lat!=null || lon!=null) {
    position = { lat:Number(lat), lon:Number(lon), altitude_ft:alt_ft??null, speed_kts:spd_kts??null };
  }

  // nested objects
  const lastPos = pick.last_position || pick.last_known_position || pick.position || pick.geo;
  if (!position && lastPos) {
    position = {
      lat: Number(first(lastPos, ["lat","latitude"])),
      lon: Number(first(lastPos, ["lon","lng","longitude"])),
      altitude_ft: toFt(first(lastPos, ["alt_ft","altitude_ft","altitude","alt"]), first(lastPos, ["alt_unit"]) || "ft"),
      speed_kts: toKts(first(lastPos, ["speed_kts","gs","speed","spd"]), first(lastPos, ["speed_unit"]) || "kts"),
    };
  }

  // trail array: take latest point
  if (!position && Array.isArray(pick.trail) && pick.trail.length) {
    const p = pick.trail[pick.trail.length-1];
    position = {
      lat: Number(first(p, ["lat","latitude"])),
      lon: Number(first(p, ["lon","lng","longitude"])),
      altitude_ft: toFt(first(p, ["alt_ft","alt","altitude"]), "ft"),
      speed_kts: toKts(first(p, ["spd","speed","speed_kmh","speed_mps"]), first(p, ["speed_mps"])!=null?"mps":(first(p,["speed_kmh"])!=null?"kmh":"kts")),
    };
  }

  // server hint merge (see server patch)
  if (!position && payload?._pos_hint) {
    position = {
      lat: Number(payload._pos_hint.lat),
      lon: Number(payload._pos_hint.lon),
      altitude_ft: toFt(payload._pos_hint.altitude_ft ?? payload._pos_hint.altitude_m, payload._pos_hint.altitude_m!=null?"m":"ft"),
      speed_kts: toKts(payload._pos_hint.speed_kts ?? payload._pos_hint.speed_mps ?? payload._pos_hint.speed_kmh,
                       payload._pos_hint.speed_mps!=null?"mps":(payload._pos_hint.speed_kmh!=null?"kmh":"kts")),
    };
  }

  const delay_min = first(pick, ["delay_min","departure_delay_min","dep_delay_min","departure_delay","delay"]);

  let status = first(pick, ["status"]) || "scheduled";
  if (times_utc.actual_arr) status = "landed";
  else if (times_utc.actual_dep) status = "active";

  return {
    number, callsign,
    airline_icao_operating, airline_icao_marketing,
    origin, destination, aircraft, times_utc, position,
    status, delay_min,
    fr24_id: first(pick, ["fr24_id","id"]) ?? null,
    flight_ended: !!first(pick, ["flight_ended","ended"]),
    eta_utc: timeFrom(pick, ["eta_utc","estimated_arrival_utc","est_arrival_utc"]),
    remaining_minutes: null
  };
}

function pickBest(items) {
  const hasDep = x => first(x, ["datetime_takeoff","actual_departure_utc","actual_departure_time_utc","off","actual_off"]) != null;
  const hasArr = x => first(x, ["datetime_landed","actual_arrival_utc","actual_arrival_time_utc","on","actual_on"]) != null;
  const active = items.find(x => hasDep(x) && !hasArr(x));
  if (active) return active;
  return items.slice().sort((a,b) => {
    const at = new Date(first(a, ["datetime_takeoff","last_seen","actual_departure_utc","off"]) || 0).getTime();
    const bt = new Date(first(b, ["datetime_takeoff","last_seen","actual_departure_utc","off"]) || 0).getTime();
    return bt - at;
  })[0];
}
