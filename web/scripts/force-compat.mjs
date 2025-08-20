import fs from 'fs';


const candidates = [
  '.vercel/output/static/_worker.js/index.js',
  '.vercel/output/static/_worker.js',
];

const file = candidates.find(p => fs.existsSync(p));
if (!file) { console.error('Worker bundle not found. Build first.'); process.exit(1); }

let code = fs.readFileSync(file, 'utf8');

// already has the flag?
if (/\bcompatibility_flags\b/.test(code) && /nodejs_compat/.test(code)) {
  console.log('nodejs_compat already present in', file);
  process.exit(0);
}

// if there's an existing export config, merge; else prepend a new one
if (/export\s+const\s+config\s*=/.test(code)) {
  code = code.replace(/export\s+const\s+config\s*=\s*\{/, m => m + 'compatibility_flags:["nodejs_compat"],');
} else {
  code = 'export const config={compatibility_flags:["nodejs_compat"]};\n' + code;
}

fs.writeFileSync(file, code);
console.log('Injected nodejs_compat into', file);
