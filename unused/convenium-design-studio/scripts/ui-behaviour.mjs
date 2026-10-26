#!/usr/bin/env node
// Convenium.Design Studio behaviour instrument - B1-B8, measured rather than asserted.
//
//   node scripts/ui-behaviour.mjs            human table + JSON to metrics/behaviour-latest.json
//   node scripts/ui-behaviour.mjs --json     machine output on stdout
//   node scripts/ui-behaviour.mjs --check    non-zero exit if any threshold regressed
//   node scripts/ui-behaviour.mjs --baseline also overwrite metrics/behaviour-baseline.json
//
// Why this exists: ui-metrics.mjs measures what the interface LOOKS like and all eleven of its
// thresholds passed while the Design DNA panel rendered an avoid-list headed "Never, in any
// run" that no run enforced, while "Do it for me" prefilled a textarea, and while "Keep this
// setup" kept nothing. An interface can be perfectly legible and still be lying. T1-T11 could
// never have caught that, which is why the loop was able to terminate with it open.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { launch, findChrome } from './lib/cdp.mjs';
import {
  ROOT, VIEWS, startServer, evaluate, settle, navigate, showView, diff, captureConsole, withTimeout,
} from './lib/harness.mjs';
import { LISTENER_SHIM, CONTROL_CENSUS, SNAPSHOT, SKIP, changed } from './lib/interact.mjs';

const METRICS_DIR = join(ROOT, 'metrics');
const LATEST = join(METRICS_DIR, 'behaviour-latest.json');
const BASELINE = join(METRICS_DIR, 'behaviour-baseline.json');
const HISTORY = join(METRICS_DIR, 'behaviour-history.jsonl');
const LABELS = join(ROOT, 'scripts', 'labels.json');

// A command's identity: its id when it has one, else its view plus its class signature with
// per-instance markers stripped. This is what collapses the Library's 84 skill buttons to the
// one component they actually are, so B3 measures coverage rather than repetition.
const identityOf = c => c.selector.startsWith('#')
  ? c.selector
  : c.view + '|' + (c.selector.split('>').pop() || '').trim()
      .replace(/:nth-of-type\(\d+\)/g, '')
      .replace(/\.is-[a-z-]+/g, '');

const argv = new Set(process.argv.slice(2));
const wantJson = argv.has('--json');
const wantCheck = argv.has('--check');
const writeBaseline = argv.has('--baseline');
const log = (...a) => { if (!wantJson) console.log(...a); };

// --------------------------------------------------------------- B4 / B7: server-side

/**
 * B4 - does each loadout decision actually change the request?
 *
 * The point of the whole loadout model is that swapping a slot produces a different run. This
 * builds one baseline plan and then one plan per varied field, and asserts the composed
 * instruction text differs. A field that cannot move the instructions is a control the product
 * renders and nothing executes.
 */
async function measureDecisions(base) {
  const api = async (path, init) => {
    const response = await fetch(base + path, init);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || (path + ' failed'));
    return body;
  };
  const post = (path, data) => api(path, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });

  const { slots, loadouts } = await api('/api/loadouts');
  const source = loadouts[0];
  const results = [];

  // Fingerprint = everything the server would send a model for the ACTIVE loadout.
  //
  // /api/oracle/plan takes no loadoutId - buildPlan() resolves the active loadout itself - so
  // the probe activates the scratch loadout and varies it in place. Passing loadoutId and
  // hoping would have measured nothing and reported 12/12 green.
  const fingerprint = async loadout => {
    // The prompt must wake all five agents or the probe measures nothing.
    // buildPlan() only includes agents whose triggers match, so "Redesign the pricing page
    // and verify the build" left Athena dormant - and her two slots (Evidence, Structure)
    // then reported INERT because no plan step existed to change. That is a harness artifact,
    // not a product defect, and reporting it would have been a false accusation. This wording
    // hits every agent's trigger list: audit/existing/evidence (Athena), design/plan (Convenium.Design),
    // redesign/concept/interface (Calliope), build/frontend/component (Hephaestus),
    // media/verify/accessibility/ship (Hermes).
    const plan = await post('/api/oracle/plan', {
      prompt: 'Audit the existing evidence, plan a redesign concept for the interface, '
        + 'build the frontend components, and verify media and accessibility before we ship.',
      budget: loadout.budget?.totalTokens || 30000,
    });
    return JSON.stringify({
      steps: (plan.plan?.steps || []).map(s => ({ id: s.id, skills: s.skills, budget: s.budget, approval: s.approval })),
      // The two fields the whole B4 threshold exists to catch. Until a loadout's brief and
      // taste profile reach the composed instructions, these are null on every variation and
      // the threshold reports them inert - which is the true finding, not a harness bug.
      context: plan.plan?.context ?? null,
      instructions: plan.plan?.instructions ?? null,
      // plan.loadout is deliberately EXCLUDED. It echoes the loadout's own id, slots and
      // designDna back into the response, so including it made changing the taste profile
      // "change the request" when nothing about the request had changed - the harness would
      // have scored designDna green for echoing its own input. B4 asks what reaches a model,
      // not what the plan object repeats.
    });
  };

  const scratch = await post('/api/loadouts', { sourceLoadoutId: source.id });
  const id = scratch.loadout.id;
  const previouslyActive = (await api('/api/loadouts')).activeLoadoutId;
  await api('/api/loadouts/active', {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }),
  });
  const patch = data => api('/api/loadouts/' + id, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const current = async () => (await api('/api/loadouts')).loadouts.find(l => l.id === id);

  try {
    const baseline = await fingerprint(await current());

    for (const slot of slots) {
      const now = (await current()).slots[slot.id];
      const other = slot.candidates.map(c => c.skill).find(s => s !== now);
      if (!other) { results.push({ field: slot.id, kind: 'slot', differs: null, note: 'only one candidate' }); continue; }
      await patch({ slots: { ...(await current()).slots, [slot.id]: other } });
      const after = await fingerprint(await current());
      results.push({ field: slot.id, kind: 'slot', from: now, to: other, differs: after !== baseline });
      await patch({ slots: { ...(await current()).slots, [slot.id]: now } });
    }

    const nonSlot = [
      { field: 'brief', apply: () => patch({ brief: 'Ship an audit only. Never propose a redesign in this run.' }), reset: () => patch({ brief: '' }) },
      { field: 'designDna', apply: async () => {
          const dna = await api('/api/design-dna');
          const doctrine = dna.doctrines?.[0];
          if (!doctrine) return null;
          const profile = await post('/api/design-dna', { doctrine: doctrine.id, displayName: 'B4 probe' });
          await patch({ designDna: profile.profileId });
          return profile.profileId;
        }, reset: () => patch({ designDna: '' }) },
      { field: 'budget',
        apply: async () => patch({ budget: { ...(await current()).budget, totalTokens: 8000 } }),
        reset: async () => patch({ budget: { ...(await current()).budget, totalTokens: 30000 } }) },
      { field: 'approvals', apply: async () => {
          const c = await current();
          const flipped = Object.fromEntries(Object.entries(c.budget.approvals).map(([k, v]) => [k, !v]));
          return patch({ budget: { ...c.budget, approvals: flipped } });
        }, reset: async () => {
          const c = await current();
          const flipped = Object.fromEntries(Object.entries(c.budget.approvals).map(([k, v]) => [k, !v]));
          return patch({ budget: { ...c.budget, approvals: flipped } });
        } },
    ];

    for (const probe of nonSlot) {
      try {
        await probe.apply();
        const after = await fingerprint(await current());
        results.push({ field: probe.field, kind: 'field', differs: after !== baseline });
        await probe.reset();
      } catch (error) {
        results.push({ field: probe.field, kind: 'field', differs: false, error: error.message });
      }
    }
  } finally {
    try {
      await api('/api/loadouts/active', {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: previouslyActive }),
      });
    } catch {}
    try { await fetch(base + '/api/loadouts/' + id, { method: 'DELETE' }); } catch {}
  }
  return results;
}


/**
 * B6 - the interface may not claim a capability the runtime has not verified.
 *
 * "Live API ready" was rendered whenever an OPENAI_API_KEY existed, with nothing checking
 * that the key worked or that the configured model ids resolve. The server now reports
 * demo / live-unverified / live, and this asserts the visible text agrees with it.
 */
async function measureRuntimeClaims(page, base) {
  const config = await (await fetch(base + '/api/config')).json();
  const mode = config.mode;
  await navigate(page, base + '/?b=runtime#/playground');
  await settle(page, 700);
  const shown = await evaluate(page, `(() => ({
    badge: (document.querySelector('#runtime-label')?.textContent || '').trim(),
    playground: (document.querySelector('#playground-mode')?.textContent || '').trim(),
    oracle: (document.querySelector('#oracle-mode')?.textContent || '').trim(),
  }))()`);

  const unbacked = [];
  const claimsVerifiedLive = text => /live api verified/i.test(text)
    || (/live/i.test(text) && !/unverified|demo|may fail/i.test(text));

  if (mode !== 'live') {
    for (const [where, text] of Object.entries(shown)) {
      if (claimsVerifiedLive(text)) unbacked.push(where + ' claims live while the server reports ' + mode + ': "' + text + '"');
    }
  }
  // The inverse is also a lie: a verified runtime that presents itself as demo would send
  // real requests while telling the user nothing leaves the machine.
  if (mode === 'live' && /demo/i.test(shown.badge)) {
    unbacked.push('badge claims demo while the server reports live: "' + shown.badge + '"');
  }
  if (!config.models?.length) unbacked.push('no models are configured, so the model picker offers nothing runnable');

  return { checked: true, mode, modeDetail: config.modeDetail || null, models: config.models || [], shown, unbacked };
}

/** B7 - a comparison run must survive a reload as a server-side record. */
async function measureRunPersistence(base) {
  const post = async (path, data) => {
    const response = await fetch(base + path, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
    });
    return { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) };
  };
  const { loadouts } = await (await fetch(base + '/api/loadouts')).json();
  const run = await post('/api/compare', {
    prompt: 'B7 persistence probe: state the route this loadout would take.',
    mode: 'demo',
    maxOutputTokens: 300,
    variants: [
      { name: 'A', loadoutId: loadouts[0]?.id, skills: [], tools: [] },
      { name: 'B', loadoutId: loadouts[1]?.id || loadouts[0]?.id, skills: [], tools: [] },
    ],
  });
  if (!run.ok) return { ran: false, persisted: false, note: run.body.error || ('compare returned ' + run.status) };
  const listing = await fetch(base + '/api/runs?limit=20');
  if (!listing.ok) return { ran: true, persisted: false, note: 'no GET /api/runs endpoint (' + listing.status + ')' };
  const body = await listing.json().catch(() => ({}));
  const runs = body.runs || [];
  return { ran: true, persisted: runs.some(r => r.runId === run.body.runId), count: runs.length };
}

// --------------------------------------------------------------- B5: orphan stores

/** A key written to localStorage that no code path reads back is a store nothing consumes. */
function measureOrphanStores() {
  const source = readFileSync(join(ROOT, 'public', 'app.js'), 'utf8');
  const written = new Set([...source.matchAll(/storage\.write\(\s*'([^']+)'/g)].map(m => m[1]));
  const read = new Set([...source.matchAll(/storage\.read\(\s*'([^']+)'/g)].map(m => m[1]));
  const orphans = [...written].filter(key => !read.has(key));
  return { written: [...written].sort(), read: [...read].sort(), orphans };
}

// --------------------------------------------------------------- main

async function main() {
  const started = Date.now();
  if (!findChrome()) {
    console.error('ui-behaviour: no Chrome binary found. Set CONVENIUM_DESIGN_CHROME to a chrome.exe path.');
    process.exit(2);
  }
  mkdirSync(METRICS_DIR, { recursive: true });

  const labels = existsSync(LABELS) ? JSON.parse(readFileSync(LABELS, 'utf8')) : { rows: [] };
  // Destructive controls ARE clicked; they are clicked against a throwaway store.
  const { proc: server, base, dataDir } = await startServer({ scratchData: true });
  const browser = await launch();
  const consoleEvents = [];
  const networkFailures = [];
  const census = [];
  const sweep = [];
  let decisions = [], persistence = { ran: false, persisted: false, note: 'not run' };
  let runtimeClaims = { checked: false, unbacked: [] };

  try {
    const page = await browser.newPage();
    captureConsole(page, consoleEvents);
    await page.send('Network.enable').catch(() => {});
    page.on('Network.responseReceived', event => {
      const status = event.response?.status || 0;
      if (status >= 400) networkFailures.push({ status, url: (event.response.url || '').replace(base, '') });
    });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: LISTENER_SHIM });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    // ---- B1: the listener census, per view
    await navigate(page, base + '/?b=census#/work');
    await settle(page, 1200);
    for (const view of VIEWS) {
      await showView(page, view);
      census.push(await evaluate(page, CONTROL_CENSUS + '(' + JSON.stringify(view) + ')'));
    }
    census.push(await evaluate(page, CONTROL_CENSUS + '(null)'));

    // ---- B2/B3: click every safe control on a freshly loaded page
    const clickable = census.flatMap(entry => (entry.controls || [])
      .filter(c => c.visible && !c.disabled && (c.tag === 'button' || c.role === 'button'))
      .map(c => ({ ...c, viewId: entry.view })));

    const labelRows = new Map((labels.rows || []).map(row => [row.selector, row]));

    for (const control of clickable) {
      const skipReason = [...SKIP.entries()].find(([sel]) => control.selector === sel
        || (sel.startsWith('.') && control.selector.includes(sel.slice(1))))?.[1];
      if (skipReason) { sweep.push({ ...control, skipped: skipReason }); continue; }

      // fresh page per control: no ordering effects, no state carried between clicks
      await navigate(page, base + '/?b=' + encodeURIComponent(control.selector) + '#/' + (control.viewId === 'chrome' ? 'work' : control.viewId));
      await settle(page, 520);
      if (control.viewId !== 'chrome') await showView(page, control.viewId, 320);
      // The census inspects disclosed controls. Reach that same real UI state before
      // clicking; a hidden control cannot focus its field on a freshly loaded page.
      await evaluate(page, `(() => { let parent=document.querySelector(${JSON.stringify(control.selector)})?.parentElement; while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;} })()`);

      // Some controls only exist behind a disclosure. Opening it is part of reaching them, not
      // part of what they do, so it happens before the snapshot.
      if (['#oracle-show-how', '#oracle-do-it', '#close-oracle', '#oracle-text-mode', '#oracle-voice-mode'].includes(control.selector)) {
        await evaluate(page, "document.querySelector('#toggle-oracle').click(); true");
        await settle(page, 260);
      }
      const before = await evaluate(page, SNAPSHOT);
      // alreadyActive is read HERE, immediately before the click, not from the census. The
      // census for the chrome ran while the last view of the sweep was showing; by the time
      // a chrome control is clicked the page has been reloaded at a different view, so a
      // census-time reading described a state that no longer existed.
      const clicked = await evaluate(page, `(() => {
        const el = document.querySelector(${JSON.stringify(control.selector)});
        if (!el) return { found: false };
        const active = el.matches('.is-active, [aria-current], [aria-pressed="true"], [aria-selected="true"]');
        // Disabled at CLICK time, which is not the same as disabled at census time: a control
        // inside a disclosure is evaluated when the disclosure opens. A disabled control makes
        // no promise and cannot break one, so it is excluded rather than counted as silent.
        if (el.disabled) return { found: true, wasDisabled: true, reason: el.title || '' };
        el.click();
        return { found: true, alreadyActive: active };
      })()`);
      if (!clicked.found) { sweep.push({ ...control, notFound: true }); continue; }
      if (clicked.wasDisabled) { sweep.push({ ...control, skipped: 'disabled at click time: ' + (clicked.reason || 'no reason given') }); continue; }
      await settle(page, 460);
      const after = await evaluate(page, SNAPSHOT);

      const row = labelRows.get(control.selector) || labelRows.get(identityOf(control));
      let labelTruth = null;
      if (row?.postcondition) {
        try {
          labelTruth = { expected: row.postcondition, pass: Boolean(await evaluate(page, '(() => { ' + row.assert + ' })()')) };
        } catch (error) { labelTruth = { expected: row.postcondition, pass: false, error: error.message }; }
      }
      sweep.push({ ...control, alreadyActive: clicked.alreadyActive, effect: changed(before, after), before, after, labelTruth });
    }

    // ---- B6: does the interface claim more than the runtime can back?
    runtimeClaims = await measureRuntimeClaims(page, base);

    // ---- B4 / B7: server-side, no browser needed
    decisions = await measureDecisions(base);
    persistence = await measureRunPersistence(base);
  } finally {
    await browser.close();
    server.kill();
    if (dataDir) { try { rmSync(dataDir, { recursive: true, force: true }); } catch {} }
  }

  const allControls = census.flatMap(entry => entry.controls || []);
  const unwired = allControls.filter(c => c.visible && !c.wired && !c.isNativeField);
  const clicked = sweep.filter(c => !c.skipped && !c.notFound);
  // Split the raw no-ops. A control that was already in its target state is not a defect;
  // one that was not is a control whose label promises something it does not deliver.
  const inertNoEffect = clicked.filter(c => !c.effect && c.alreadyActive);
  const noEffect = clicked.filter(c => !c.effect && !c.alreadyActive);
  // A row still has to EXIST for every command - coverage is unchanged - but a control that
  // was disabled when reached is not asserted against.
  const labelChecked = clicked.filter(c => c.labelTruth);
  const labelFailed = labelChecked.filter(c => !c.labelTruth.pass);
  const stores = measureOrphanStores();
  // B3 covers distinct COMMANDS, not control instances. The Library renders 84 buttons from
  // one component; requiring 84 label rows for it would measure repetition, not coverage.
  // A command's identity is its id when it has one, else its view plus its class signature.
  const identity = identityOf;
  const commandGroups = new Map();
  for (const c of allControls) {
    if (!c.visible || c.tag !== 'button' || c.viewTarget) continue;
    const key = identity(c);
    if (!commandGroups.has(key)) commandGroups.set(key, { key, ...c });
  }
  const commandControls = [...commandGroups.values()];
  const covered = new Set((labels.rows || []).map(row => row.selector));
  const labelCoverage = commandControls.filter(c => covered.has(c.selector) || covered.has(c.key)).length;

  const thresholds = {
    B1: {
      name: 'Controls with no listener and no form owner',
      value: unwired.length, target: 0, pass: unwired.length === 0,
      unit: 'visible controls',
      detail: unwired.slice(0, 12).map(c => c.view + ' ' + c.selector + ' "' + c.label + '"'),
    },
    B2: {
      name: 'Clicks that change nothing observable',
      value: noEffect.length, target: 0, pass: noEffect.length === 0,
      unit: 'of ' + clicked.length + ' clicked (' + inertNoEffect.length + ' already in their target state, excluded)',
      detail: noEffect.slice(0, 14).map(c => c.view + ' ' + c.selector + ' "' + c.label + '"'),
    },
    B3: {
      name: 'Label-truth rows failing their postcondition',
      value: labelFailed.length, target: 0,
      pass: labelFailed.length === 0 && labelCoverage === commandControls.length,
      unit: labelCoverage + ' of ' + commandControls.length + ' command controls covered',
      detail: {
        failed: labelFailed.map(c => c.selector + ': ' + c.labelTruth.expected),
        uncovered: commandControls.filter(c => !covered.has(c.selector) && !covered.has(c.key))
          .map(c => c.key + ' :: ' + c.label),
      },
    },
    B4: (() => {
      const testable = decisions.filter(d => d.differs !== null);
      const inert = testable.filter(d => !d.differs);
      return {
        name: 'Loadout decisions that do not change the request',
        value: inert.length, target: 0, pass: inert.length === 0,
        unit: 'of ' + testable.length + ' decisions',
        detail: inert.map(d => d.field + (d.error ? ' (' + d.error + ')' : '')),
      };
    })(),
    B5: {
      name: 'Client stores written and read by nothing',
      value: stores.orphans.length, target: 0, pass: stores.orphans.length === 0,
      unit: 'localStorage keys', detail: stores.orphans,
    },
    B6: {
      name: 'Runtime claims not backed by a verified capability',
      value: runtimeClaims.unbacked.length, target: 0,
      pass: runtimeClaims.checked && runtimeClaims.unbacked.length === 0,
      unit: 'claims (mode ' + (runtimeClaims.mode || '?') + ')',
      detail: runtimeClaims,
    },
    B7: {
      name: 'Comparison runs that do not survive a reload',
      value: persistence.persisted ? 0 : 1, target: 0, pass: Boolean(persistence.persisted),
      unit: 'runs', detail: persistence,
    },
    B8: {
      name: 'Console errors and 4xx/5xx during the sweep',
      value: consoleEvents.length + networkFailures.length, target: 0,
      pass: consoleEvents.length === 0 && networkFailures.length === 0,
      unit: 'events',
      detail: { console: consoleEvents.slice(0, 8), network: networkFailures.slice(0, 8) },
    },
  };

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    thresholds,
    controls: { total: allControls.length, visible: allControls.filter(c => c.visible).length, clicked: clicked.length, skipped: sweep.filter(c => c.skipped).length },
    unwired,
    noEffect: noEffect.map(c => ({ view: c.view, selector: c.selector, label: c.label, boundOn: c.boundOn })),
    alreadyActiveNoEffect: inertNoEffect.map(c => ({ view: c.view, selector: c.selector, label: c.label })),
    decisions,
    stores,
    persistence,
    consoleEvents,
    networkFailures,
  };

  const previous = existsSync(LATEST) ? JSON.parse(readFileSync(LATEST, 'utf8')) : null;
  report.diff = diff(previous?.thresholds, thresholds);
  writeFileSync(LATEST, JSON.stringify(report, null, 2));
  appendFileSync(HISTORY, JSON.stringify({
    at: report.generatedAt,
    values: Object.fromEntries(Object.entries(thresholds).map(([k, v]) => [k, v.value])),
  }) + '\n');
  if (writeBaseline || !existsSync(BASELINE)) writeFileSync(BASELINE, JSON.stringify(report, null, 2));

  if (wantJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const pad = (s, n) => String(s).padEnd(n);
    const padS = (s, n) => String(s).padStart(n);
    log('');
    log('Convenium.Design Studio behaviour metrics - ' + report.generatedAt + '  (' + (report.durationMs / 1000).toFixed(1) + 's)');
    log('');
    log('  ' + pad('#', 5) + pad('Threshold', 52) + padS('now', 6) + padS('target', 8) + '  result');
    log('  ' + '-'.repeat(78));
    for (const [id, t] of Object.entries(thresholds)) {
      const state = t.pass === null ? 'PENDING' : t.pass ? 'PASS' : 'FAIL';
      log('  ' + pad(id, 5) + pad(t.name, 52) + padS(t.value ?? '-', 6) + padS(t.target, 8) + '  ' + state);
      if (t.unit) log('  ' + ' '.repeat(5) + '  ' + t.unit);
    }
    log('');
    log('  controls: ' + report.controls.visible + ' visible, ' + report.controls.clicked + ' clicked, ' + report.controls.skipped + ' skipped by policy');
    for (const [id, t] of Object.entries(thresholds)) {
      if (t.pass !== false) continue;
      const lines = Array.isArray(t.detail) ? t.detail : Array.isArray(t.detail?.failed) ? t.detail.failed : [];
      if (!lines.length) continue;
      log('');
      log('  ' + id + ' - ' + t.name);
      for (const line of lines.slice(0, 12)) log('    ' + line);
    }
    log('');
    if (report.diff.firstRun) log('  diff: first recorded run');
    else {
      for (const r of report.diff.improvements) log('  improved  ' + r.id + ' ' + r.before + ' -> ' + r.after);
      for (const r of report.diff.regressions) log('  REGRESSED ' + r.id + ' ' + r.before + ' -> ' + r.after);
      if (!report.diff.improvements.length && !report.diff.regressions.length) log('  diff: no threshold moved');
    }
    log('');
    log('  written: metrics/behaviour-latest.json');
    log('');
  }

  if (wantCheck && report.diff.regressions.length) {
    console.error('ui-behaviour: ' + report.diff.regressions.length + ' threshold(s) regressed.');
    process.exit(1);
  }
}

main().catch(error => { console.error('ui-behaviour failed:', error); process.exit(2); });
