"use client";
import { useEffect, useState } from "react";
import { fetchProgressForFlight } from "@/lib/progress";

export default function RouteProgress({ flight }: { flight: any }) {
  const [state, setState] = useState<{loading:boolean; err?:string; pct?:number; from?:string; to?:string}>({ loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetchProgressForFlight(flight);
      if (!alive) return;

      if (!res.ok) {
        setState({ loading: false, err: `Progress error: ${res.error}${res.details ? ` – ${res.details}` : ""}` });
        console.warn("Progress fetch failed:", res);
        return;
      }

      const { origin, destination, progress } = res.data || {};
      setState({
        loading: false,
        pct: progress?.pct ?? 0,
        from: origin?.icao || origin?.iata || origin?.code,
        to: destination?.icao || destination?.iata || destination?.code,
      });
    })();
    return () => { alive = false; };
  }, [flight]);

  if (state.loading) return <div className="text-sm opacity-70">Loading progress…</div>;
  if (state.err)      return <div className="text-sm text-red-400">{state.err}</div>;

  return (
    <div>
      <div className="flex justify-between text-xs mb-2 opacity-70">
        <span>{state.from ?? "—"}</span>
        <span>Current Position</span>
        <span>{state.to ?? "—"}</span>
      </div>
      <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-3 bg-amber-500 transition-all" style={{ width: `${state.pct ?? 0}%` }} />
      </div>
      <div className="mt-1 text-xs opacity-70">{state.pct}%</div>
    </div>
  );
}
