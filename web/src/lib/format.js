export const toInt = (x) => (x == null ? null : Math.round(Number(x)));
export function alt(value, units) {
  const v = Number(value);
  if (!isFinite(v)) return "—";
  return units === "metric" ? `${Math.round(v * 0.3048)} m` : `${Math.round(v)} ft`;
}
export function speed(value, units) {
  const v = Number(value);
  if (!isFinite(v)) return "—";
  return units === "metric" ? `${Math.round(v * 1.852)} km/h` : `${Math.round(v)} kts`;
}
