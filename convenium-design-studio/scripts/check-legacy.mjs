// Runs the retained legacy-UI browser suites against /legacy/ (the previous interface).
// They are kept for reference while journey-v2 replaces that UI; they are not part of `npm run check`.
import { spawnSync } from 'node:child_process';
const suites = ['ui-shell.mjs', 'ui-shell-repairs.mjs', 'ui-oracle.mjs', 'ui-workspace.mjs', 'ui-savra-system.mjs', 'ui-savra-oracle.mjs', 'ui-recovery-states.mjs', 'ui-journey-keyboard.mjs', 'ui-async-ownership.mjs', 'ui-comparison-ownership.mjs', 'ui-context-parity.mjs', 'ui-role-draft.mjs', 'ui-project-evidence.mjs', 'ui-reconnect.mjs', 'ui-surface-layout.mjs'];
let failed = 0;
{ const r = spawnSync(process.execPath, ['--test', 'scripts/ui-control-contract.test.mjs'], { stdio: 'inherit', env: { ...process.env, APOLLO_LEGACY_UI: '1' } }); if (r.status !== 0) { failed += 1; console.log('legacy suite failed: ui-control-contract'); } }
for (const suite of suites) {
  const r = spawnSync(process.execPath, [`scripts/${suite}`], { stdio: 'inherit', env: { ...process.env, APOLLO_LEGACY_UI: '1' } });
  if (r.status !== 0) { failed += 1; console.log(`legacy suite failed: ${suite}`); }
}
console.log(failed ? `${failed} legacy suite(s) failed (legacy UI is being replaced).` : 'All legacy suites passed.');
process.exit(failed ? 1 : 0);
