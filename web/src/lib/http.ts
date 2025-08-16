import { devlog } from "./devlog";

export async function fetchFlight(number: string) {
  const url = `/api/flight?number=${encodeURIComponent(number)}`;
  const t0 = performance.now();
  devlog("flight.request", { number, url });

  const res = await fetch(url);
  const ms = Math.round(performance.now() - t0);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    devlog("flight.response.error", { number, status: res.status, ms, text });
    throw new Error(`flight ${number} http ${res.status} ${text}`);
  }

  const json = await res.json();
  devlog("flight.response.ok", {
    number,
    ms,
    requestId: json.requestId,
    identTried: json.identTried,
    size: JSON.stringify(json.data)?.length || 0,
  });
  return json;
}
