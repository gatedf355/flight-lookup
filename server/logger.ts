// lightweight JSON logger
export const ts = () => new Date().toISOString();
export function log(event: string, data: Record<string, unknown>) {
  // one-line JSON for easy grep
  // eslint-disable-next-line no-console
  const logData = Object.assign({ t: ts(), event }, data);
  console.log(JSON.stringify(logData));
}
