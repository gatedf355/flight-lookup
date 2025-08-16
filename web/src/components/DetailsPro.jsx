import { useState } from "react";
import { Card } from "./Atoms.jsx";
import { fmtBoth } from "../lib/time.js";
import { alt, speed } from "../lib/format.js";

export default function DetailsPro({ f, units, timeMode, raw }){
  const [open,setOpen]=useState(true);
  const showUTC = timeMode==="both"||timeMode==="utc";
  const showLocal = timeMode==="both"||timeMode==="local";
  const T = (label, iso) => {
    const b = fmtBoth(iso);
    return (
      <div className="grid grid-cols-3 gap-2 py-1">
        <div className="text-sm text-[var(--muted)]">{label}</div>
        <div className="text-sm">{showUTC?b.utc:"—"}</div>
        <div className="text-sm">{showLocal?b.local:"—"}</div>
      </div>
    );
  };
  return (
    <Card className="p-5">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between">
        <div className="text-sm text-[var(--muted)]">Details</div>
        <div className="text-sm">{open?"Hide":"Show"}</div>
      </button>
      {open && (
        <div className="mt-3">
          {T("Sched dep", f?.times_utc?.sched_dep)}
          {T("Actual dep", f?.times_utc?.actual_dep)}
          {T("Sched arr", f?.times_utc?.sched_arr)}
          {T("Actual arr", f?.times_utc?.actual_arr)}
          {T("First seen", f?.times_utc?.first_seen)}
          {T("Last seen", f?.times_utc?.last_seen)}
          <div className="grid grid-cols-3 gap-2 py-1"><div className="text-sm text-[var(--muted)]">Callsign</div><div className="col-span-2 text-sm">{f?.callsign || "—"}</div></div>
          <div className="grid grid-cols-3 gap-2 py-1"><div className="text-sm text-[var(--muted)]">Operated / Painted</div><div className="col-span-2 text-sm">{[f?.airline_icao_operating, f?.airline_icao_marketing].filter(Boolean).join(" / ") || "—"}</div></div>
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="text-sm text-[var(--muted)]">Airframe</div>
            <div className="col-span-2 text-sm">{[f?.aircraft?.type_icao, f?.aircraft?.registration].filter(Boolean).join(" • ") || "—"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="text-sm text-[var(--muted)]">Transponder hex</div>
            <div className="col-span-2 text-sm">{f?.aircraft?.hex || "—"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="text-sm text-[var(--muted)]">Origin / Dest</div>
            <div className="col-span-2 text-sm">
              {(f?.origin?.iata || f?.origin?.icao || "—")} → {(f?.destination?.iata || f?.destination?.icao || "—")}
              {f?.destination?.icao_actual ? ` (actual ${f.destination.icao_actual})` : ""}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="text-sm text-[var(--muted)]">Position</div>
            <div className="col-span-2 text-sm">
              {f?.position
                ? `${f.position.lat ?? "—"}, ${f.position.lon ?? "—"} • ${alt(f.position.altitude_ft, units)} • ${speed(f.position.speed_kts, units)}`
                : "—"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="text-sm text-[var(--muted)]">FR24 id / Ended</div>
            <div className="col-span-2 text-sm">{[f?.fr24_id || "—", f?.flight_ended ? "yes" : "no"].join(" • ")}</div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm">Raw JSON</summary>
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-black/70 p-3 text-xs">{JSON.stringify(raw ?? f, null, 2)}</pre>
          </details>
        </div>
      )}
    </Card>
  );
}
