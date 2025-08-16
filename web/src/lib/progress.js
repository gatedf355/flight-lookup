import { parseISO } from "./time.js";
import APTS from "../data/airports.sample.json"; // replace with a bigger file later

const index = Object.fromEntries(APTS.map(a => [a.icao.toUpperCase(), a]));
const R = 6371e3; // meters
function toRad(x){ return (x*Math.PI)/180; }
function haversine(a,b){
  if(!a||!b) return null;
  const φ1=toRad(a.lat), φ2=toRad(b.lat);
  const dφ=toRad(b.lat-a.lat), dλ=toRad(b.lon-a.lon);
  const s= Math.sin(dφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  return 2*R*Math.asin(Math.sqrt(s)); // meters
}
function getCoord(icao){ return index[icao?.toUpperCase()] || null; }

export function progressDistance(f){
  const o = getCoord(f?.origin?.icao);
  const d = getCoord(f?.destination?.icao || f?.destination?.icao_actual);
  const p = f?.position?.lat!=null && f?.position?.lon!=null ? { lat: Number(f.position.lat), lon: Number(f.position.lon) } : null;
  if(!o||!d||!p) return null;
  const total = haversine(o,d); if(!total || total<=0) return null;
  const done  = Math.min(haversine(o,p), total);
  return Math.max(0, Math.min(1, done/total));
}

export function progressTime(f){
  const dep = parseISO(f?.times_utc?.actual_dep || f?.times_utc?.sched_dep);
  const eta = parseISO(f?.eta_utc || f?.times_utc?.actual_arr || f?.times_utc?.sched_arr);
  if(!dep || !eta) return null;
  const total = eta.toMillis()-dep.toMillis(); if(total<=0) return null;
  const done = Math.min(Math.max(Date.now()-dep.toMillis(),0), total);
  return Math.max(0, Math.min(1, done/total));
}

export function computeProgress(f){
  const dist = progressDistance(f);
  if(dist!=null) return { pct: Math.round(dist*100), mode: "distance" };
  const time = progressTime(f);
  if(time!=null) return { pct: Math.round(time*100), mode: "time" };
  return { pct: null, mode: null };
}
