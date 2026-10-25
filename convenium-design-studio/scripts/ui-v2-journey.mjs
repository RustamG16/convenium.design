// End-to-end walk of the primary trip, clicking like a user, against a scratch data copy:
// Home → goal → 8 intake answers → brief approval → plan approval → swap a slot skill in
// Configure → Test in Playground (real deterministic compare) → Apply → run approvals →
// Results → Gate C. Verifies the server state that changed (active loadout, slot skill).
import { launch } from './lib/cdp.mjs';
import { startServer, evaluate } from './lib/harness.mjs';

const steps = [];
const log = (ok, msg) => { steps.push([ok, msg]); console.log(`  ${ok ? '✓' : '✗'} ${msg}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { proc, base } = await startServer({ scratchData: true });
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('Runtime.exceptionThrown', e => errors.push(e.exceptionDetails?.exception?.description || e.exceptionDetails?.text));
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    const js = expr => evaluate(page, expr);
    const click = async (sel, wait = 500) => { const ok = await js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el || el.disabled) return false; el.click(); return true; })()`); await sleep(wait); return ok; };
    const confirm = async () => click('.modal .actions .btn:last-child', 900);
    const hash = () => js('location.hash');

    await page.send('Page.navigate', { url: `${base}/?notour#/home` });
    await sleep(1200);
    await js(`localStorage.setItem('apollo.v2.session', JSON.stringify({ tours: { _dismissed: true } })); true`);
    await page.send('Page.navigate', { url: `${base}/?notour#/home` });
    await sleep(1500);
    const before = await js(`fetch('/api/loadouts').then(r => r.json()).then(j => ({ active: j.activeLoadoutId, craft: j.loadouts.find(l => l.id === j.activeLoadoutId).slots.craft }))`);

    log(await click('[data-goal="website"]', 1200) && (await hash()).includes('intake'), 'Choosing a goal opens the intake');
    for (let i = 0; i < 8; i += 1) {
      await click('[data-option]', 300);
      await click('[data-tour="intake-confirm"]', 700);
    }
    const answered = await js(`Object.keys(window.apollo.store.session.intake.answers).length`);
    log(answered === 8, `All eight intake questions answered (${answered})`);
    log(await click('[data-tour="intake-review"]', 1200) && (await hash()).includes('brief'), 'Intake hands over to the brief');
    await click('[data-tour="brief-approve"]', 600);
    await confirm(); await sleep(800);
    log((await js('window.apollo.store.session.briefApproved')) && (await hash()) === '#/plan', 'Approving the brief opens the master plan');
    await click('[data-tour="plan-review"]', 600); await confirm();
    log(await js('window.apollo.store.session.planApproved'), 'Plan approved; Configure unlocked');

    await page.send('Page.navigate', { url: `${base}/?notour#/plan/configure` });
    await sleep(1500);
    await click('[data-agent="design-engineer"]', 900);
    const swapped = await js(`(() => { const s = document.querySelector('select[data-slot="craft"]'); if (!s) return null; const next = [...s.options].map(o => o.value).find(v => v !== s.value); s.value = next; s.dispatchEvent(new Event('change', { bubbles: true })); return next; })()`);
    await sleep(900);
    const draftCraft = await js('window.apollo.store.session.configDraft?.slots?.craft');
    log(Boolean(swapped) && draftCraft === swapped, `Craft slot swapped in the draft (${draftCraft})`);
    const stillActive = await js(`fetch('/api/loadouts').then(r => r.json()).then(j => j.loadouts.find(l => l.id === j.activeLoadoutId).slots.craft)`);
    log(stillActive === before.craft, 'Production loadout unchanged while drafting');

    await click('[data-tour="cfg-test"]', 2200);
    log((await hash()) === '#/playground', 'Test in Playground opens the comparison');
    await click('[data-tour="pg-run"]', 2500);
    const cmp = await js('window.apollo.store.session.comparison');
    log(Boolean(cmp && cmp.checks?.length === 4), `Deterministic compare ran (${cmp ? cmp.checks.filter(c => c.pass).length : 0}/4 checks)`);
    const diffShown = await js(`document.querySelector('[data-tour="what-changed"]').textContent.includes('Adds') || document.querySelector('[data-tour="what-changed"]').textContent.includes('route every phase identically')`);
    log(diffShown, 'What changed and why lists the real skill difference');
    await click('[data-tour="pg-apply"]', 600); await confirm(); await sleep(1500);
    const after = await js(`fetch('/api/loadouts').then(r => r.json()).then(j => ({ active: j.activeLoadoutId, craft: j.loadouts.find(l => l.id === j.activeLoadoutId).slots.craft }))`);
    log(after.craft === swapped && after.active !== before.active, `Apply made the draft the active loadout (${after.active}, craft ${after.craft})`);
    log(await js('window.apollo.store.session.configApplied'), 'Configure stage recorded as applied');

    await page.send('Page.navigate', { url: `${base}/?notour#/work/0248` });
    await sleep(1500);
    for (let i = 0; i < 3; i += 1) {
      await click('[data-tour="run-approve"]', 700);
      if (await js(`Boolean(document.querySelector('.modal'))`)) await confirm();
      await sleep(600);
    }
    log((await js('window.apollo.store.session.run.status')) === 'complete' && (await hash()).startsWith('#/results'), 'Approvals carry the run to Results');
    await click('[data-tour="result-approve"]', 600); await confirm();
    log(await js('window.apollo.store.session.resultApproved'), 'Gate C accepted');
    await page.send('Page.navigate', { url: `${base}/?notour#/home` });
    await sleep(1300);
    const stage = await js(`document.querySelector('.as-count')?.textContent`);
    log(Boolean(stage), `Home reflects progress (${stage})`);
    log(errors.length === 0, errors.length ? `page errors: ${errors.join(' | ')}` : 'No page errors during the trip');
  } finally { await browser.close(); proc.kill(); }
  const failed = steps.filter(s => !s[0]).length;
  console.log(failed ? `\n${failed} step(s) failed` : '\nPrimary trip completes end to end.');
  if (failed) process.exit(1);
}

main().catch(error => { console.error(error); process.exit(1); });
