export const isValidFlightNumber = (n) => {
  if (!n) return false;
  const v = n.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{2,4}\d{1,5}[A-Z]?$/.test(v);
};
export const cls = (...xs) => xs.filter(Boolean).join(" ");
export const statusLabel = (s) => {
  const v = String(s||"").toLowerCase();
  if (v.startsWith("land")) return "Landed";
  if (v.startsWith("act") || v.includes("flight")) return "In-flight";
  return "Scheduled";
};
export const chipColor = (s) => {
  const v = statusLabel(s);
  if (v === "In-flight") return "bg-[var(--primary)] text-black";
  if (v === "Landed") return "bg-[var(--success)] text-black";
  return "bg-[var(--warning)] text-black";
};
