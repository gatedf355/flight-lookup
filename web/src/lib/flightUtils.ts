import { fetchFlight } from "./http";
import { devlog } from "./devlog";

export async function onSearch(input: string) {
  try {
    devlog("ui.search.submit", { input });
    const { data, requestId, identTried } = await fetchFlight(input);
    devlog("ui.search.success", { input, requestId, identTried, summary: summarize(data) });
    return { success: true, data, requestId, identTried };
  } catch (e: any) {
    devlog("ui.search.fail", { input, err: e.message });
    return { success: false, error: e.message };
  }
}

export function summarize(d: any) {
  try {
    const f = d?.flight || d?.result || d;
    return {
      airline: f?.airline?.code || f?.airline,
      number: f?.number || f?.ident,
      from: f?.origin?.code || f?.dep,
      to: f?.destination?.code || f?.arr,
      status: f?.status,
    };
  } catch { 
    return "unknown"; 
  }
}
