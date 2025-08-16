export function devlog(event: string, info: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.log(`[DEV] ${new Date().toLocaleTimeString()} ${event}`, info);
}
