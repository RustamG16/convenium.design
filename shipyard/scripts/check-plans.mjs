#!/usr/bin/env node
/**
 * npm run test:plans
 *
 * Builds every library ship from the generated knowledge base through its conversion table, runs
 * pre-flight, exports it and runs the REAL `python library/tools/verify.py --plan <file>` on the
 * exported 00-run-plan.md. Every ship must pass pre-flight clean and verify.py must print CLEAN.
 * Also checks that every exported skill_path exists on disk, that ship.json round-trips through
 * the schema, and (as a control) that verify.py rejects a tampered plan, so a pass means something.
 *
 * The TypeScript domain is loaded through Vite's SSR loader (no tsx, no build step).
 * Exit 0 only if everything above holds.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(root, '..');
const verifyPy = join(repoRoot, 'library', 'tools', 'verify.py');
const NOW = '2026-10-30T12:00:00.000Z';

function findPython() {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : ['python', 'python3', 'py'];
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  return null;
}

function runVerifyPlan(python, file) {
  const r = spawnSync(python, ['-I', verifyPy, '--plan', file], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

const python = findPython();
if (!python) {
  console.error('FAIL no python on PATH (set PYTHON to the interpreter); verify.py cannot run');
  process.exit(1);
}

const server = await createServer({
  root,
  configFile: false,
  logLevel: 'silent',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true },
});

const failures = [];
const tmp = mkdtempSync(join(tmpdir(), 'shipyard-plans-'));
try {
  const kbRaw = JSON.parse(readFileSync(join(root, 'public', 'data', 'knowledge-base.json'), 'utf8'));
  const { parseKb } = await server.ssrLoadModule('/src/kb/load.ts');
  const { indexKb } = await server.ssrLoadModule('/src/kb/artifacts.ts');
  const { libraryShips } = await server.ssrLoadModule('/src/domain/ship.ts');
  const { exportShip } = await server.ssrLoadModule('/src/domain/export.ts');
  const { shipSchema } = await server.ssrLoadModule('/src/domain/schema.ts');

  const idx = indexKb(parseKb(kbRaw));
  const { ships, unconverted } = libraryShips(idx, NOW);
  for (const u of unconverted) failures.push(`${u.workflow}: cannot be converted: ${u.problems.join('; ')}`);
  const expected = idx.kb.workflows.ships.length;
  if (ships.length !== expected) failures.push(`expected ${expected} library ships, converted ${ships.length}`);

  console.log(`library ${idx.kb.sourceHash.slice(0, 8)} · ${idx.kb.skills.length} skills · ${ships.length}/${expected} ships converted\n`);

  let controlDone = false;
  for (const ship of ships) {
    const label = ship.id.padEnd(20);
    let bundle;
    try {
      bundle = exportShip(idx, ship, repoRoot, NOW);
    } catch (e) {
      failures.push(`${ship.id}: export failed: ${e.message}`);
      console.log(`FAIL ${label} export: ${e.message}`);
      continue;
    }
    const { report } = bundle;
    if (!report.clean) {
      const bad = report.checks.filter((c) => c.status === 'block' || c.status === 'warn');
      for (const c of bad) failures.push(`${ship.id}: pre-flight ${c.id} ${c.status}: ${c.reason}`);
    }

    const dir = join(tmp, ship.id);
    mkdirSync(dir, { recursive: true });
    const planFile = join(dir, '00-run-plan.md');
    writeFileSync(planFile, bundle.runPlan, 'utf8');

    const roundTrip = shipSchema.safeParse(JSON.parse(bundle.shipJson));
    if (!roundTrip.success) failures.push(`${ship.id}: ship.json does not round-trip: ${roundTrip.error.issues[0]?.message}`);

    const block = bundle.runPlan.match(/```json\s*\n([\s\S]*?)\n```/);
    const plan = block ? JSON.parse(block[1]) : null;
    if (!plan) failures.push(`${ship.id}: no json block in the exported plan`);
    else {
      for (const ph of plan.phases) {
        if (ph.skill_path && !existsSync(ph.skill_path)) failures.push(`${ship.id}: skill_path missing on disk: ${ph.skill_path}`);
        if (ph.skill_path && ph.skill_path.includes('\\')) failures.push(`${ship.id}: skill_path has a backslash: ${ph.skill_path}`);
        if (ph.agent === 'design-director') failures.push(`${ship.id}: phase ${ph.id} exports agent design-director, expected director`);
      }
    }

    const v = runVerifyPlan(python, planFile);
    const clean = v.code === 0 && /CLEAN/.test(v.out);
    if (!clean) failures.push(`${ship.id}: verify.py --plan did not report CLEAN (exit ${v.code}): ${v.out}`);
    const last = v.out.split(/\r?\n/).filter(Boolean).pop() ?? '';
    console.log(`${clean && report.clean ? 'ok  ' : 'FAIL'} ${label} ${String(plan?.phases.length ?? '?').padStart(2)} phases · hull ${String(report.integrity).padStart(3)}% (${report.passed}/${report.applicable}) · verify.py: ${last}`);

    if (!controlDone && plan) {
      controlDone = true;
      const bad = JSON.parse(JSON.stringify(plan));
      bad.phases[0].skill = 'no-such-skill';
      bad.phases[0].agent = 'rogue-agent';
      const badFile = join(dir, 'tampered-run-plan.md');
      writeFileSync(badFile, `\`\`\`json\n${JSON.stringify(bad, null, 2)}\n\`\`\`\n`, 'utf8');
      const control = runVerifyPlan(python, badFile);
      if (control.code === 0) failures.push('control: verify.py accepted a plan with an unknown skill and an unsanctioned agent');
      else console.log(`ok   control: verify.py rejects a tampered plan (exit ${control.code})`);
    }
  }
} catch (e) {
  failures.push(`unexpected error: ${e instanceof Error ? e.stack : e}`);
} finally {
  await server.close();
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\nAll library ships pass pre-flight clean and verify.py --plan reports CLEAN on each export.');
