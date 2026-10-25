// Journey-v2 fidelity sheet: screenshot every canonical route at the mockup size (1672×941)
// and write metrics/fidelity/index.html with mockup | build side by side.
//   node scripts/ui-v2-fidelity.mjs          capture + sheet
//   node scripts/ui-v2-fidelity.mjs --check  also fail on console errors or horizontal overflow
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { launch } from './lib/cdp.mjs';
import { ROOT, startServer, evaluate, withTimeout } from './lib/harness.mjs';

const MOCK = join(ROOT, '..', 'New_upgradePlan', 'media', 'apollo-continuous-journey-v2');
const check = process.argv.includes('--check');
const W = Number(process.env.FIDELITY_W || 1672), H = Number(process.env.FIDELITY_H || 941);
const OUT = join(ROOT, 'metrics', W === 1672 ? 'fidelity' : `fidelity-${W}`);

const answers = n => Object.fromEntries(['building', 'goal', 'audience', 'success', 'constraints', 'timeline', 'resources', 'anything'].slice(0, n)
  .map(id => [id, { option: 'x', title: id, summary: { building: 'A brand and website for Northstar.', goal: 'Increase customer adoption and market awareness.', audience: 'End customers.' }[id] || 'Answered.' }]));
const session = patch => ({ projectId: 'northstar', goal: 'brand', intake: { answers: {}, notes: {} }, briefApproved: false, planApproved: false, configApplied: false, configDraft: null, run: { status: 'idle', task: 0 }, resultApproved: false, tours: { _dismissed: true }, ...patch });

export const SHOTS = [
  ['00-journey', '#/journey', '00-user-journey-map.png', session({})],
  ['01-home', '#/home', '01-home-oracle.png', session({ goal: null })],
  ['02-intake', '#/projects/northstar/intake', '02-oracle-intake.png', session({ intake: { answers: answers(2), notes: {} } })],
  ['03-brief', '#/projects/northstar/brief', '03-design-dna-brief.png', session({ intake: { answers: answers(8), notes: {} } })],
  ['04-plan', '#/plan', '04-master-plan.png', session({ intake: { answers: answers(8), notes: {} }, briefApproved: true })],
  ['05-configure', '#/plan/configure', '05-configure-workflow.png', session({ intake: { answers: answers(8), notes: {} }, briefApproved: true, planApproved: true })],
  ['06-playground', '#/playground', '06-playground-compare.png', session({ briefApproved: true, planApproved: true })],
  ['07-work', '#/work/0248', '07-execution-work.png', session({ briefApproved: true, planApproved: true, configApplied: true })],
  ['08-results', '#/results/0248', '08-results-review.png', session({ briefApproved: true, planApproved: true, configApplied: true, run: { status: 'complete', task: 6 } })],
  ['09-knowledge', '#/knowledge', '09-knowledge-connections.png', session({})],
  ['10-system', '#/system/0248', '10-system-node-control.png', session({})],
  ['11-architecture', '#/system/0248?tab=architecture', null, session({})],
  ['12-agents', '#/agents', null, session({})],
  ['13-agents-neural', '#/agents/design-engineer', null, session({})],
  ['14-settings', '#/settings', null, session({})],
  ['15-tutorials', '#/tutorials', null, session({})],
  ['16-projects', '#/projects', null, session({})],
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { proc, base } = await startServer({ scratchData: true });
  const browser = await launch();
  const problems = [];
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('Runtime.exceptionThrown', e => errors.push(e.exceptionDetails?.exception?.description || e.exceptionDetails?.text));
    page.on('Log.entryAdded', e => { if (e.entry.level === 'error' && !/favicon/.test(e.entry.url || '')) errors.push(e.entry.text + ' ' + (e.entry.url || '')); });
    await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 820 });
    for (const [name, hash, , state] of SHOTS) {
      errors.length = 0;
      await page.send('Page.navigate', { url: `${base}/?notour#/home` });
      await new Promise(r => setTimeout(r, 500));
      await evaluate(page, `localStorage.setItem('apollo.v2.session', ${JSON.stringify(JSON.stringify(state))}); sessionStorage.clear(); true`);
      await page.send('Page.navigate', { url: `${base}/?notour&shot=${name}${hash}` });
      await new Promise(r => setTimeout(r, 1800));
      const info = await evaluate(page, `({ title: document.getElementById('page-title')?.textContent, overflow: document.documentElement.scrollWidth > innerWidth + 1 })`);
      const { data } = await withTimeout(page.send('Page.captureScreenshot', { format: 'png' }), 20000, 'screenshot ' + name);
      writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
      if (!info.title) problems.push(`${name}: no page title rendered`);
      if (info.overflow) problems.push(`${name}: horizontal overflow at ${W}px`);
      for (const e of errors) problems.push(`${name}: ${e}`);
      console.log(`${name.padEnd(18)} ${info.title || '(none)'}`);
    }
  } finally { await browser.close(); proc.kill(); }

  const rel = p => relative(OUT, p).replace(/\\/g, '/');
  const rows = SHOTS.map(([name, hash, mock]) => `<section><h2>${name} <small>${hash}</small></h2><div class="pair">${mock ? `<figure><img src="${rel(join(MOCK, mock))}"><figcaption>Mockup</figcaption></figure>` : '<figure class="none"><figcaption>No mockup — built in the same grammar</figcaption></figure>'}<figure><img src="${name}.png"><figcaption>Build</figcaption></figure></div></section>`).join('\n');
  writeFileSync(join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Convenium.Design fidelity sheet</title><style>body{font:14px/1.4 system-ui;margin:24px;background:#eee}section{margin-bottom:32px}h2{font-size:16px}h2 small{color:#666;font-weight:400}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;background:#fff;padding:6px}figure img{width:100%;display:block}figcaption{font-size:12px;color:#555;padding-top:4px}.none{display:grid;place-items:center;min-height:200px}</style><h1>Convenium.Design — journey-v2 fidelity (${W}×${H}) · ${new Date().toISOString().slice(0, 16)}</h1>${rows}`);
  console.log(`\nSheet: ${join(OUT, 'index.html')}`);
  if (problems.length) { console.log('\nProblems:\n' + problems.map(p => ' - ' + p).join('\n')); if (check) process.exit(1); }
  else console.log('No console errors, no overflow.');
}

main().catch(error => { console.error(error); process.exit(1); });
