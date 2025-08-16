import { Card, Badge } from "./Atoms.jsx";
import { fmtBoth } from "../lib/time.js";
import { computeProgress } from "../lib/progress.js";
import { minutesSince, minutesUntil, fmtHM } from "../lib/time.js";

export default function SummaryPro({ f }){
  const depISO = f?.times_utc?.actual_dep || f?.times_utc?.sched_dep;
  const arrISO = f?.eta_utc || f?.times_utc?.sched_arr || f?.times_utc?.actual_arr || null;

  const dep = fmtBoth(depISO);
  const arr = fmtBoth(arrISO);
  const prog = computeProgress(f);
  const elapsedMin = minutesSince(depISO);
  const remainingMin = minutesUntil(arrISO);

  const tone = f?.status?.toLowerCase().startsWith("land")
    ? "ok"
    : f?.status?.toLowerCase().includes("act")
      ? "info"
      : "warn";

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="text-2xl font-semibold">{f?.number || "—"}</div>
          {(f?.airline_icao_operating || f?.airline_icao_marketing) && (
            <div className="text-sm text-[var(--muted)]">
              {[f?.airline_icao_operating, f?.airline_icao_marketing].filter(Boolean).join(" / ")}
            </div>
          )}
          <div className="text-5xl font-semibold tracking-wide">
            {(f?.origin?.iata || f?.origin?.icao || "—")} <span className="opacity-60">→</span> {(f?.destination?.iata || f?.destination?.icao || "—")}
          </div>
          <div className="text-sm text-[var(--muted)]">Dep: {dep.utc} • {dep.local}</div>
          {arrISO && <div className="text-sm text-[var(--muted)]">Arr: {arr.utc} • {arr.local}</div>}
        </div>
        <div className="text-right space-y-2">
          <Badge tone={tone}>{f?.status ? f.status[0].toUpperCase()+f.status.slice(1) : "Scheduled"}</Badge>
          <div className="text-sm text-sky-400/90">
            {[f?.aircraft?.type_icao, f?.aircraft?.registration].filter(Boolean).join(" • ") || "—"}
          </div>
        </div>
      </div>

      {prog.pct!=null && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-white/10 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-[var(--primary)]" style={{width:`${prog.pct}%`}} />
            <div className="absolute -top-1.5 h-5 w-5 rounded-full bg-[var(--primary)]/90 border border-black/20 shadow"
                 style={{ left: `calc(${prog.pct}% - 10px)` }} />
          </div>
          <div className="text-xs text-[var(--muted)]">
            {prog.pct}% • {prog.mode === "distance" ? "by distance" : "by time"}
          </div>
        </div>
      )}

      <div className="text-sm text-[var(--muted)]">
        Elapsed: {fmtHM(elapsedMin)}{arrISO ? ` • Remaining (est): ${fmtHM(remainingMin)}` : ""}
      </div>
    </Card>
  );
}
