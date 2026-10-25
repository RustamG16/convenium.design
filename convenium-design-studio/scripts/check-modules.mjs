// Syntax-checks every browser module of the journey-v2 UI.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const roots = ['public/js', 'public/js/views', 'public/js/fixtures'];
let bad = 0;
for (const dir of roots) for (const f of readdirSync(dir)) if (f.endsWith('.js')) {
  const r = spawnSync(process.execPath, ['--check', join(dir, f)], { stdio: 'inherit' });
  if (r.status !== 0) bad += 1;
}
for (const f of ['scripts/router-v2.test.mjs', 'scripts/ui-v2-shell.mjs', 'scripts/ui-v2-journey.mjs', 'scripts/ui-v2-fidelity.mjs', 'scripts/record-tutorials.mjs', 'scripts/check-legacy.mjs']) {
  if (spawnSync(process.execPath, ['--check', f], { stdio: 'inherit' }).status !== 0) bad += 1;
}
if (bad) { console.error(`${bad} module(s) failed the syntax check`); process.exit(1); }
console.log('All UI modules parse.');
