import StatusChip from "../StatusChip.jsx";
import { fmtBoth } from "../../lib/time.js";
function Airports({ o, d }) { return <div className="text-3xl font-semibold tracking-wide">{o} <span className="opacity-60">→</span> {d}</div>; }
function Times({ f }) { const dep = fmtBoth(f?.times_utc?.actual_dep || f?.times_utc?.sched_dep); const arr = fmtBoth(f?.times_utc?.actual_arr || f?.times_utc?.sched_arr);
  return <div className="text-sm"><div>Dep: {dep.utc} • {dep.local}</div><div>Arr: {arr.utc} • {arr.local}</div></div>; }
function Aircraft({ f }) { return <div className="text-sm text-[var(--sub)]">{[f?.aircraft?.type_icao, f?.aircraft?.registration].filter(Boolean).join(" • ") || "—"}</div>; }
function Delay({ f }) { const d = f?.delay_min; if (d==null) return null; const late = Number(d)>0; const bg = late ? "bg-[var(--danger)]" : "bg-[var(--success)]"; return <span className={`rounded-md ${bg} text-black px-2 py-0.5 text-xs`}>{late?`+${d} min`:`${d} min`}</span>; }
const O = (f)=> (f?.origin?.iata || f?.origin?.icao || "—");
const D = (f)=> (f?.destination?.iata || f?.destination?.icao || "—");

export function CardA({ f }) {
  return (<div className="rounded-2xl bg-[var(--card)] border border-white/10 p-5 grid grid-cols-3 gap-4">
    <div className="col-span-2 space-y-2"><div className="flex items-center gap-2"><StatusChip status={f?.status}/><Delay f={f}/></div>
      <div className="text-2xl font-semibold">{f?.number || "—"}</div><Airports o={O(f)} d={D(f)}/><Aircraft f={f}/></div>
    <div className="col-span-1 flex items-center justify-end"><Times f={f}/></div></div>);
}
export function CardB({ f }) {
  return (<div className="rounded-2xl bg-[var(--card)] border border-white/10 p-5">
    <div className="flex items-start justify-between"><div><div className="text-xl font-semibold">{f?.number}</div><Airports o={O(f)} d={D(f)}/><Aircraft f={f}/></div>
      <div className="flex flex-col items-end gap-2"><StatusChip status={f?.status}/><Delay f={f}/><Times f={f}/></div></div></div>);
}
export function CardC({ f }) {
  return (<div className="rounded-2xl bg-[var(--card)] border border-white/10 p-8 text-center space-y-2"><StatusChip status={f?.status}/><div className="text-3xl font-semibold">{f?.number}</div><Airports o={O(f)} d={D(f)}/><Aircraft f={f}/><Times f={f}/></div>);
}
export function CardD({ f }) {
  const dep = fmtBoth(f?.times_utc?.actual_dep || f?.times_utc?.sched_dep); const arr = fmtBoth(f?.times_utc?.actual_arr || f?.times_utc?.sched_arr);
  return (<div className="rounded-2xl bg-[var(--card)] border border-white/10 p-6">
    <div className="flex items-center justify-between"><div className="text-xl font-semibold">{f?.number}</div><StatusChip status={f?.status}/></div>
    <div className="mt-4 grid grid-cols-2 gap-6"><div><div className="text-sm text-[var(--sub)]">Departure</div><div className="text-lg">{O(f)}</div><div className="text-sm">{dep.utc}</div><div className="text-sm">{dep.local}</div></div>
      <div><div className="text-sm text-[var(--sub)]">Arrival</div><div className="text-lg">{D(f)}</div><div className="text-sm">{arr.utc}</div><div className="text-sm">{arr.local}</div></div></div>
    <div className="mt-4 flex items-center justify-between"><Aircraft f={f}/><Delay f={f}/></div></div>);
}
export function CardE({ f }) {
  return (<div className="rounded-2xl bg-[var(--card)] border border-white/10 p-5 space-y-2">
    <div className="flex items-center justify-between"><div className="text-xl font-semibold">{f?.number}</div><div className="flex items-center gap-2"><StatusChip status={f?.status}/><Delay f={f}/></div></div>
    <div className="flex items-end justify-between"><div className="text-3xl font-semibold tracking-wide">{O(f)} <span className="opacity-60">→</span> {D(f)}</div><Aircraft f={f}/></div>
    <Times f={f}/></div>);
}
