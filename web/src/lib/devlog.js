const enabled = localStorage.getItem("debug") === "1" || import.meta.env.DEV;

function time() { return new Date().toISOString().slice(11,23); }
function group(title, fn) {
  if (!enabled) return;
  console.groupCollapsed(`%c${time()} ${title}`, "color:#38bdf8");
  try { fn(); } finally { console.groupEnd(); }
}

export const devlog = {
  enabled,
  group,
  info: (...a) => enabled && console.log("%cINFO", "color:#22c55e", ...a),
  warn: (...a) => enabled && console.warn("%cWARN", "color:#f59e0b", ...a),
  error: (...a) => enabled && console.error("%cERROR", "color:#ef4444", ...a),
};
