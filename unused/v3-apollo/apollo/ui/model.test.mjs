#!/usr/bin/env node
/**
 * model.test.mjs — test the pipeline composer's logic without a browser.
 *
 * The composer is a single self-contained HTML file so it can be published and
 * opened offline. That would normally make its logic untestable, so the pure
 * part (model + evalStage, no DOM) is fenced between `--8<-- pure:start` and
 * `--8<-- pure:end` markers. This slices that block out and runs it in node.
 *
 * If the composer's picture of the pipeline drifts from the skills in skills/,
 * these cases are where it shows up.
 *
 *   node ui/model.test.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'architecture.html'), 'utf8');

const start = html.indexOf('--8<-- pure:start');
const end = html.indexOf('--8<-- pure:end');
if (start === -1 || end === -1) {
  console.error('FAIL: pure markers not found in architecture.html');
  process.exit(1);
}
// Start just past the opening marker comment; stop at the `/*` that opens the closing one.
const source = html.slice(html.indexOf('*/', start) + 2, html.lastIndexOf('/*', end));

/** Build a fresh sandbox exposing the pure API. */
function load() {
  // eslint-disable-next-line no-new-func
  return new Function(`
    ${source}
    return { SKILLS, CAPS, JOBS, STAGES, PRESETS, state, applyPreset, activeSkills, job, evalStage };
  `)();
}

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok    ${name}`);
  } else {
    console.log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`);
    failures++;
  }
}

/** Configure a sandbox: preset id, job type, capability overrides. */
function setup(presetId, jobType, capOverrides = {}) {
  const m = load();
  const p = m.PRESETS.find((x) => x.id === presetId);
  m.applyPreset(p);
  m.state.job = jobType;
  for (const [k, v] of Object.entries(capOverrides)) m.state.caps[k] = v;
  return m;
}

function statuses(m) {
  const out = {};
  for (const st of m.STAGES) out[st.n] = m.evalStage(st).status;
  return out;
}

console.log('\nApollo pipeline composer — model tests\n');

/* --- V3, everything available: the happy path ---------------------------- */
{
  const m = setup('V3', 'AUDIT');
  const s = statuses(m);
  check('V3/AUDIT runs every stage',
    Object.values(s).every((v) => v === 'on'),
    JSON.stringify(s));
  check('V3 loads all 7 skills', m.activeSkills().length === 7);
}

/* --- job types gate stages 4 and 5 --------------------------------------- */
{
  const sys = statuses(setup('V3', 'SYSTEM'));
  check('SYSTEM skips Comp (4)', sys[4] === 'skipped', sys[4]);
  check('SYSTEM skips Self-check (5)', sys[5] === 'skipped', sys[5]);
  check('SYSTEM still reaches Handoff (6)', sys[6] === 'on', sys[6]);

  const nw = statuses(setup('V3', 'NEW'));
  check('NEW runs Comp (4)', nw[4] === 'on', nw[4]);
}

/* --- V1 control: no skills means uncovered stages ------------------------ */
{
  const m = setup('V1', 'AUDIT');
  const s = statuses(m);
  check('V1 loads no skills', m.activeSkills().length === 0);
  check('V1 blocks Evidence (2)', s[2] === 'blocked', s[2]);
  check('V1 blocks Direction (3)', s[3] === 'blocked', s[3]);
  check('V1 blocks Handoff (6)', s[6] === 'blocked', s[6]);
  check('V1 still runs Probe (0)', s[0] === 'on', s[0]);
}

/* --- capability loss --------------------------------------------------- */
{
  const noNode = statuses(setup('V3', 'AUDIT', { node: false }));
  check('no node blocks Self-check (5)', noNode[5] === 'blocked', noNode[5]);
  check('no node leaves Comp (4) alone', noNode[4] === 'on', noNode[4]);

  const noPrev = statuses(setup('V3', 'AUDIT', { preview: false }));
  check('no preview degrades Evidence (2)', noPrev[2] === 'degraded', noPrev[2]);
  check('no preview blocks Comp (4)', noPrev[4] === 'blocked', noPrev[4]);

  const noWeb = statuses(setup('V3', 'AUDIT', { web: false }));
  check('no web degrades Evidence (2) on AUDIT', noWeb[2] === 'degraded', noWeb[2]);

  const noWebNew = statuses(setup('V3', 'NEW', { web: false }));
  check('no web does NOT degrade Evidence on NEW', noWebNew[2] === 'on', noWebNew[2]);
}

/* --- V6: external capture substitutes for the built-in browser ----------- */
{
  const s = statuses(setup('V6', 'AUDIT', { preview: false }));
  check('heavy capture substitutes for preview at Comp (4)', s[4] === 'on', s[4]);
  check('heavy capture substitutes for preview at Evidence (2)', s[2] === 'on', s[2]);
}

/* --- dropping a required skill ------------------------------------------ */
{
  const m = setup('V3', 'NEW');
  m.state.on['apollo-handoff'] = false;
  const s = statuses(m);
  check('handoff off blocks stage 6', s[6] === 'blocked', s[6]);

  const m2 = setup('V3', 'AUDIT');
  m2.state.on['apollo-audit'] = false;
  const s2 = statuses(m2);
  check('audit off blocks stages 2 and 3 on AUDIT', s2[2] === 'blocked' && s2[3] === 'blocked',
    `${s2[2]}/${s2[3]}`);
  check('audit off leaves NEW-only skills irrelevant here', s2[6] === 'on', s2[6]);
}

/* --- every job type's declared requirements are satisfiable by V3 -------- */
{
  const m = load();
  m.applyPreset(m.PRESETS.find((p) => p.id === 'V3'));
  for (const j of m.JOBS) {
    m.state.job = j.id;
    const unmet = j.need.filter((id) => !m.state.on[id]);
    check(`V3 satisfies ${j.id} requirements`, unmet.length === 0, unmet.join(','));
  }
}

/* --- model integrity ----------------------------------------------------- */
{
  const m = load();
  const ids = m.SKILLS.map((s) => s.id);
  const referenced = new Set();
  for (const st of m.STAGES) {
    for (const list of Object.values(st.skills || {})) list.forEach((x) => referenced.add(x));
    (st.cond || []).forEach((x) => referenced.add(x));
  }
  const ghosts = [...referenced].filter((r) => !ids.includes(r));
  check('no stage references a skill that is not in SKILLS', ghosts.length === 0, ghosts.join(','));

  const presetGhosts = m.PRESETS.flatMap((p) => p.skills).filter((s) => !ids.includes(s));
  check('no preset references an unknown skill', presetGhosts.length === 0, presetGhosts.join(','));

  const capIds = m.CAPS.map((c) => c.id);
  const capGhosts = m.PRESETS.flatMap((p) => p.caps).filter((c) => !capIds.includes(c));
  check('no preset references an unknown capability', capGhosts.length === 0, capGhosts.join(','));

  const jobNeedGhosts = m.JOBS.flatMap((j) => j.need).filter((n) => !ids.includes(n));
  check('no job requires a skill that is not in SKILLS', jobNeedGhosts.length === 0, jobNeedGhosts.join(','));
}

console.log('');
if (failures) {
  console.log(`${failures} failure(s)\n`);
  process.exit(1);
}
console.log('all passing\n');
