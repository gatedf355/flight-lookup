import fs from 'node:fs';

const p = '.vercel/output/static/_worker.js/index.js';
const cfg = 'export const config = { compatibility_date: "2025-08-20", compatibility_flags: ["nodejs_compat"] };\n';

if (!fs.existsSync(p)) {
  console.error('Worker not found at', p);
  process.exit(1);
}
const src = fs.readFileSync(p, 'utf8');
if (!/compatibility_flags/.test(src)) {
  fs.writeFileSync(p, cfg + src);
  console.log('Injected nodejs_compat into', p);
} else {
  console.log('Config already present in', p);
}
