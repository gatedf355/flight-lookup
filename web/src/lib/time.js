import { DateTime, Duration } from "luxon";

export const nowUTC = () => DateTime.utc();
export function parseISO(iso) { try { return iso ? DateTime.fromISO(iso, { zone: "utc" }) : null; } catch { return null; } }
export function fmtBoth(iso) {
  const dt = parseISO(iso); if (!dt) return { utc: "—", local: "—" };
  const local = dt.setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  return { utc: dt.toFormat("HH:mm 'UTC' • LLL dd"), local: local.toFormat("HH:mm 'local' • LLL dd") };
}
export function progressPercent(depIso, arrIso) {
  const dep = parseISO(depIso); const arr = parseISO(arrIso);
  if (!dep || !arr) return null;
  const total = arr.toMillis() - dep.toMillis(); if (total <= 0) return null;
  const done = Math.min(Math.max(Date.now() - dep.toMillis(), 0), total);
  return Math.round((done / total) * 100);
}

export function minutesSince(iso){
  const dt = parseISO(iso); if (!dt) return null;
  return Math.max(0, Math.round(DateTime.utc().diff(dt, "minutes").minutes));
}
export function minutesUntil(iso){
  const dt = parseISO(iso); if (!dt) return null;
  return Math.max(0, Math.round(dt.diff(DateTime.utc(), "minutes").minutes));
}
export function fmtHM(mins){
  if (mins == null) return "—";
  const d = Duration.fromObject({ minutes: mins }).shiftTo("hours","minutes");
  const h = Math.trunc(d.hours || 0);
  const m = Math.trunc(Math.abs(d.minutes || 0));
  return `${h}h ${m}m`;
}
