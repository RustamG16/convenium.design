#!/usr/bin/env node
// Convenium.Design Studio UI instrument - the T1-T11 thresholds, measured rather than asserted.
//
//   node scripts/ui-metrics.mjs            human table + JSON written to metrics/latest.json
//   node scripts/ui-metrics.mjs --json     machine output on stdout
//   node scripts/ui-metrics.mjs --check    non-zero exit if any threshold regressed
//   node scripts/ui-metrics.mjs --baseline also overwrite metrics/baseline.json
//
// Why this exists: detect.mjs reads markup patterns and reports clean while 165 text nodes
// fail contrast. Every real defect in this app lives in computed values, so the loop has to
// read computed values.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, findChrome } from './lib/cdp.mjs';
import { PROBE_SOURCE } from './lib/probe.mjs';
import { auditCss, auditScriptMotion } from './lib/css-audit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const METRICS_DIR = join(ROOT, 'metrics');
const LATEST = join(METRICS_DIR, 'latest.json');
const BASELINE = join(METRICS_DIR, 'baseline.json');
const HISTORY = join(METRICS_DIR, 'history.jsonl');

const VIEWS = ['work', 'architecture', 'systems', 'playground', 'agents', 'knowledge', 'oracle', 'runs'];
const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844, narrow: true },
  { name: '820x1180', width: 820, height: 1180, narrow: true },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];
const PRIMARY_VIEWPORT = '1440x900';

const argv = new Set(process.argv.slice(2));
const wantJson = argv.has('--json');
const wantCheck = argv.has('--check');
const writeBaseline = argv.has('--baseline');
const wantTrace = argv.has('--trace') || process.env.CONVENIUM_DESIGN_METRICS_TRACE === '1';
const log = (...a) => { if (!wantJson) console.log(...a); };
const trace = (...a) => { if (wantTrace) console.error('  ..', ...a); };

// Nothing in this script may hang the build. Every await that talks to Chrome is fenced.
function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out after ' + ms + 'ms: ' + label)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

// ---------------------------------------------------------------- server

async function startServer() {
  const port = 4100 + Math.floor(Math.random() * 700);
  const proc = spawn(process.execPath, [join(ROOT, 'server.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), CONVENIUM_DESIGN_METRICS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', c => { stderr += c.toString(); });
  const base = 'http://127.0.0.1:' + port;
  const deadline = Date.now() + 20000;
  for (;;) {
    if (Date.now() > deadline) { proc.kill(); throw new Error('Server did not start on ' + port + '. ' + stderr); }
    try {
      const res = await fetch(base + '/', { signal: AbortSignal.timeout(1500) });
      if (res.ok) break;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  return { proc, base };
}

// ---------------------------------------------------------------- page driving

async function evaluate(page, expression, opts = {}) {
  const { result, exceptionDetails } = await withTimeout(page.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, ...opts,
  }), 30000, 'Runtime.evaluate ' + expression.slice(0, 40));
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}

async function settle(page, ms = 420) {
  await new Promise(r => setTimeout(r, ms));
  await evaluate(page, 'document.readyState');
}

// ---------------------------------------------------------------- aggregation

function summarise(runs) {
  const perViewport = {};
  for (const vp of VIEWPORTS) {
    const rows = runs.filter(r => r.viewport === vp.name);
    const text = rows.flatMap(r => r.probe.text.map(t => ({ ...t, view: r.view })));
    const controls = rows.flatMap(r => r.probe.controls.map(c => ({ ...c, view: r.view })));
    const boundaries = rows.flatMap(r => (r.probe.boundaries || []).map(b => ({ ...b, view: r.view })));
    const targetFloor = vp.width < 900 ? 44 : 36;
    perViewport[vp.name] = {
      textNodes: text.length,
      belowThirteen: text.filter(t => t.size < 13).length,
      contrastFails: text.filter(t => !t.pass).length,
      contrastFailsUnverifiable: text.filter(t => t.rendered && t.imageBacked).length,
      boundaryFails: boundaries.filter(b => !b.pass).length,
      boundaryWorst: boundaries.filter(b => !b.pass).sort((a, b) => a.ratio - b.ratio).slice(0, 6),
      targetsBelowFloor: controls.filter(c => c.min < targetFloor).length,
      targetsBelow32: controls.filter(c => c.min < 32).length,
      unmeasuredControls: rows.reduce((n, r) => n + r.probe.unmeasured.length, 0),
      controls: controls.length,
      targetFloor,
      overflow: rows.filter(r => r.probe.overflow.horizontal > 0)
        .map(r => ({ view: r.view, px: r.probe.overflow.horizontal })),
      clipped: rows.filter(r => r.probe.overflow.clippedCount > 0)
        .map(r => ({ view: r.view, count: r.probe.overflow.clippedCount, worst: r.probe.overflow.clipped[0] })),
      families: [...new Set(rows.flatMap(r => r.probe.families))].sort(),
      perView: Object.fromEntries(rows.map(r => [r.view, {
        textNodes: r.probe.text.length,
        belowThirteen: r.probe.text.filter(t => t.size < 13).length,
        contrastFails: r.probe.text.filter(t => !t.pass).length,
        targetsBelowFloor: r.probe.controls.filter(c => c.min < targetFloor).length,
        targetsBelow32: r.probe.controls.filter(c => c.min < 32).length,
        unmeasuredControls: r.probe.unmeasured.length,
        dominantSize: Object.entries(r.probe.sizeTally).sort((a, b) => b[1] - a[1])[0] || null,
      }])),
    };
  }
  return perViewport;
}

function sizeHistogram(runs) {
  const tally = {};
  for (const r of runs) for (const [size, n] of Object.entries(r.probe.sizeTally)) tally[size] = (tally[size] || 0) + n;
  return Object.fromEntries(Object.entries(tally).sort((a, b) => Number(a[0]) - Number(b[0])));
}

function buildThresholds({ perViewport, css, viewFacts, zoom, runs }) {
  const primary = perViewport[PRIMARY_VIEWPORT];
  const total = key => Object.values(perViewport).reduce((n, v) => n + v[key], 0);
  const allText = total('textNodes');
  const allBelow = total('belowThirteen');
  const allContrast = total('contrastFails');
  const allTargets = total('targetsBelowFloor');

  const destructive = runs.flatMap(r => r.probe.destructive);
  const destructiveNoUndo = new Set(
    destructive.filter(d => !d.hasUndo).map(d => d.label + '|' + d.cls)
  ).size;

  // An empty state passes when it carries its own action. A primary action elsewhere in the
  // view is not the same thing, and counting it that way let a bare actionless empty state
  // pass because an unrelated button existed on the page.
  const viewsWithEmptyState = Object.values(viewFacts)
    .filter(v => v.emptyStates > 0 && v.emptyStateHasAction).length;

  const bodySizes = runs.map(r => r.probe.bodySize).filter(Number.isFinite);
  const minBody = bodySizes.length ? Math.min(...bodySizes) : 0;

  return {
    T1: {
      name: 'Rendered text below 13px',
      value: allBelow,
      share: allText ? Math.round((allBelow / allText) * 1000) / 10 : 0,
      target: 0, pass: allBelow === 0, unit: 'nodes (all viewports)',
    },
    T2: {
      name: 'Body text size',
      value: minBody, target: 15, pass: minBody >= 15,
      unit: 'px (computed on <body>)', higherIsBetter: true,
    },
    T3: {
      name: 'Type in rem; UI holds at 200% text zoom',
      value: css.fontSizeUnits.total ? Math.round((css.fontSizeUnits.rem / css.fontSizeUnits.total) * 1000) / 10 : 0,
      target: 100,
      pass: css.fontSizeUnits.total > 0 && css.fontSizeUnits.rem === css.fontSizeUnits.total
        && zoom.scalesWithRoot && zoom.overflow <= 0
        && (zoom.clippedAtZoom || []).length === 0 && (zoom.overflowAtZoom || []).length === 0,
      unit: '% of font-size declarations in rem', higherIsBetter: true,
      detail: zoom,
    },
    T4: (() => {
      const unverifiable = total('contrastFailsUnverifiable');
      const boundaryFails = total('boundaryFails');
      return {
        name: 'Contrast failures (WCAG AA + 1.4.11 boundaries)',
        value: allContrast + unverifiable + boundaryFails,
        target: 0,
        pass: allContrast === 0 && unverifiable === 0 && boundaryFails === 0,
        unit: 'text nodes + control boundaries under 3:1 (all viewports)',
        detail: {
          measuredFailures: allContrast,
          unverifiableOverImage: unverifiable,
          boundaryFailures: boundaryFails,
          boundaryWorst: perViewport[PRIMARY_VIEWPORT]?.boundaryWorst || [],
        },
      };
    })(),
    T5: {
      name: 'Controls under 36px desktop / 44px narrow',
      value: allTargets, target: 0, pass: allTargets === 0, unit: 'controls (all viewports)',
    },
    T6: (() => {
      // Monospace is a data type, not a second visual world - DESIGN.md says so explicitly -
      // so it is excluded. What this counts is how many *display/UI* faces are shipping,
      // which is where the warm-serif / cool-sans split lived.
      const proportional = primary.families.filter(f => !/mono|consolas|courier/i.test(f));
      return {
        name: 'Distinct visual systems shipping',
        value: proportional.length, target: 1, pass: proportional.length <= 1,
        unit: 'distinct proportional font families (monospace excluded as a data type)',
        note: 'Machine proxy for the two-worlds defect; confirmed by eye at each surface pass.',
        detail: { proportional, all: primary.families },
      };
    })(),
    T7: {
      name: 'Non-semantic accent hues',
      value: css.nonSemanticHues.length, target: 1, pass: css.nonSemanticHues.length <= 1,
      unit: 'hue families outside ok/warn/danger', detail: css.nonSemanticHues,
    },
    T8: {
      name: 'Unique radii (and >=8 spacing tokens)',
      value: css.radii.length, target: 4,
      pass: css.radii.length <= 4 && css.tokenFamilies.space >= 8,
      unit: 'unique border-radius values',
      detail: { radii: css.radii, spacingTokens: css.tokenFamilies.space },
    },
    T9: {
      name: 'Views with an empty state and one primary action',
      value: viewsWithEmptyState, target: VIEWS.length, pass: viewsWithEmptyState === VIEWS.length,
      unit: 'of ' + VIEWS.length + ' views', higherIsBetter: true,
      detail: Object.fromEntries(Object.entries(viewFacts)
        .map(([k, v]) => [k, v.emptyStates > 0 && v.emptyStateHasAction])),
    },
    T10: (() => {
      // Ornament by any means, not just an image URL. Removing five photographs while
      // shipping a fractal-noise data URI, radial accent washes, vignettes and connector
      // glow is not what this threshold was written to measure.
      const value = css.decorativeMediaRefs.length + css.ornament.length;
      return {
        name: 'Decorative media and ornament with no informational role',
        value, target: 0, pass: value === 0,
        unit: 'stylesheet references and decorative layers',
        detail: { mediaRefs: css.decorativeMediaRefs, ornament: css.ornament.slice(0, 12) },
      };
    })(),
    T11: {
      name: 'Destructive actions without undo',
      value: destructiveNoUndo, target: 0, pass: destructiveNoUndo === 0, unit: 'distinct controls',
      detail: [...new Set(destructive.filter(d => !d.hasUndo).map(d => d.label))],
    },
  };
}

// ---------------------------------------------------------------- diff

function diff(previous, current) {
  if (!previous) return { firstRun: true, regressions: [], improvements: [] };
  const regressions = [], improvements = [];
  for (const key of Object.keys(current)) {
    const before = previous[key]?.value, after = current[key].value;
    if (before == null || before === after) continue;
    const higherIsBetter = current[key].higherIsBetter === true;
    const worse = higherIsBetter ? after < before : after > before;
    (worse ? regressions : improvements).push({ id: key, name: current[key].name, before, after });
  }
  return { firstRun: false, regressions, improvements };
}

// ---------------------------------------------------------------- main

async function main() {
  const started = Date.now();
  if (!findChrome()) {
    console.error('ui-metrics: no Chrome binary found. Set CONVENIUM_DESIGN_CHROME to a chrome.exe path.');
    process.exit(2);
  }
  mkdirSync(METRICS_DIR, { recursive: true });

  const css = auditCss([join(ROOT, 'public/styles.css')]);
  const scriptMotion = auditScriptMotion(join(ROOT, 'public/app.js'));
  const { proc: server, base } = await startServer();
  const browser = await launch();
  const runs = [];
  const consoleErrors = [];
  const viewFacts = {};
  let zoom = { scalesWithRoot: false, overflow: 0, bodyAt200: 0 };
  let reducedMotion = { honoured: false, worstDurationMs: null };

  try {
    const page = await browser.newPage();
    page.on('Runtime.consoleAPICalled', ev => {
      if (ev.type === 'error' || ev.type === 'warning') {
        consoleErrors.push({
          type: ev.type,
          text: ev.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200),
        });
      }
    });
    page.on('Runtime.exceptionThrown', ev => {
      consoleErrors.push({
        type: 'exception',
        text: (ev.exceptionDetails?.exception?.description || ev.exceptionDetails?.text || '').slice(0, 200),
      });
    });

    for (const vp of VIEWPORTS) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false,
      });
      trace('viewport', vp.name);
      const loaded = page.once('Page.loadEventFired');
      // A fresh query per viewport: navigating to the same URL would only change the hash,
      // which fires no load event and would hang the wait below.
      await withTimeout(page.send('Page.navigate', { url: base + '/?vp=' + vp.name + '#/work' }), 20000, 'Page.navigate');
      await withTimeout(loaded, 20000, 'Page.loadEventFired');
      await settle(page, 900);

      for (const view of VIEWS) {
        await evaluate(page, "location.hash = '/" + view + "'");
        await settle(page, 420);
        const probe = await evaluate(page, '(' + PROBE_SOURCE + ')("view", true)');
        trace(vp.name, view, probe.text.length + ' text', probe.controls.length + ' controls');
        runs.push({ viewport: vp.name, view, probe });
        if (vp.name === PRIMARY_VIEWPORT) {
          viewFacts[view] = {
            emptyStates: probe.emptyStates,
            primaryActions: probe.primaryActions,
            emptyStateHasAction: probe.emptyStateHasAction,
          };
        }
      }
      const chromeProbe = await evaluate(page, '(' + PROBE_SOURCE + ')("chrome", false)');
      trace(vp.name, 'chrome', chromeProbe.text.length + ' text');
      runs.push({ viewport: vp.name, view: '_chrome', probe: chromeProbe });
    }

    // T3 runtime half: double the root font size and see whether anything moves.
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    // T3's name is "UI holds at 200% text zoom" and it only ever visited one view. The
    // composer on Work was clipped out of existence at 200% and the threshold said 100%.
    const zoomViews = {};
    for (const view of VIEWS) {
      await evaluate(page, "location.hash = '/" + view + "'");
      await settle(page, 320);
      zoomViews[view] = await evaluate(page, [
        '(() => {',
        '  const root = document.documentElement;',
        '  const prior = root.style.fontSize;',
        "  root.style.fontSize = '32px';",
        '  void root.offsetWidth;',
        '  const clipped = [];',
        '  const vw = root.clientWidth, vh = root.clientHeight;',
        "  const controls = '.view.is-active button, .view.is-active a[href], .view.is-active input, .view.is-active select, .view.is-active textarea, .view.is-active summary';",
        '  for (const el of document.querySelectorAll(controls)) {',
        '    const r = el.getBoundingClientRect();',
        '    if (!r.width || !r.height) continue;',
        '    let n = el.parentElement;',
        '    while (n) {',
        '      const cs = getComputedStyle(n);',
        "      const clips = /(hidden|clip)/.test(cs.overflowY) || /(hidden|clip)/.test(cs.overflowX);",
        '      if (clips) {',
        '        const b = n.getBoundingClientRect();',
        '        const cut = Math.max(0, r.bottom - b.bottom) + Math.max(0, b.top - r.top)',
        '          + Math.max(0, r.right - b.right) + Math.max(0, b.left - r.left);',
        "        if (cut > 2) clipped.push(el.tagName + '.' + String(el.className).slice(0, 26) + ' cut ' + Math.round(cut) + 'px');",
        '        break;',
        '      }',
        '      n = n.parentElement;',
        '    }',
        '  }',
        '  const overflow = root.scrollWidth - root.clientWidth;',
        '  root.style.fontSize = prior;',
        '  return { overflow, clipped: clipped.slice(0, 6), clippedCount: clipped.length };',
        '})()',
      ].join(String.fromCharCode(10)));
    }
    await evaluate(page, "location.hash = '/knowledge'");
    await settle(page, 400);
    zoom = await evaluate(page, [
      '(() => {',
      '  const before = parseFloat(getComputedStyle(document.body).fontSize);',
      '  const root = document.documentElement;',
      '  const prior = root.style.fontSize;',
      "  root.style.fontSize = '32px';",
      '  void root.offsetWidth;',
      '  const after = parseFloat(getComputedStyle(document.body).fontSize);',
      '  const overflow = root.scrollWidth - root.clientWidth;',
      '  root.style.fontSize = prior;',
      '  return { bodyAt100: before, bodyAt200: after, scalesWithRoot: after >= before * 1.6, overflow };',
      '})()',
    ].join('\n'));
    zoom.perView = zoomViews;
    zoom.clippedAtZoom = Object.entries(zoomViews)
      .filter(([, v]) => v.clippedCount > 0)
      .map(([view, v]) => view + ': ' + v.clippedCount + ' (' + v.clipped[0] + ')');
    zoom.overflowAtZoom = Object.entries(zoomViews).filter(([, v]) => v.overflow > 0).map(([view]) => view);
    // Reduced motion is a promise the product makes; a rule that exists is not evidence
    // that it wins, so this reads the computed durations under the emulated preference.
    await page.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    const reloaded = page.once('Page.loadEventFired');
    await withTimeout(page.send('Page.navigate', { url: base + '/?rm=1#/architecture' }), 20000, 'Page.navigate rm');
    await withTimeout(reloaded, 20000, 'Page.loadEventFired rm');
    await settle(page, 700);
    reducedMotion = await evaluate(page, [
      '(() => {',
      '  const ms = v => v.split(",").map(x => parseFloat(x) * (x.includes("ms") ? 1 : 1000));',
      '  let worst = 0, offender = null;',
      '  const animating = [];',
      '  for (const el of document.querySelectorAll("*")) {',
      '    const cs = getComputedStyle(el);',
      '    for (const v of [...ms(cs.transitionDuration), ...ms(cs.animationDuration)]) {',
      '      if (v > worst) { worst = v; offender = el.tagName + "." + String(el.className).slice(0, 40); }',
      '    }',
      // DESIGN.md: under reduced motion no transform is applied. A keyframe still named here
      // (even at ~0ms) can leave a translate on screen; the view container is the known case.
      '    if (cs.animationName !== "none" && el.matches(".view.is-active, .view.is-active *")) {',
      '      animating.push(el.tagName + "." + String(el.className).slice(0, 40) + " -> " + cs.animationName);',
      '    }',
      '  }',
      '  return { worstDurationMs: worst, offender, animatingUnderReduce: animating.slice(0, 6), honoured: worst <= 1 && animating.length === 0 };',
      '})()',
    ].join(String.fromCharCode(10)));
    await page.send('Emulation.setEmulatedMedia', { features: [] });
  } finally {
    await browser.close();
    server.kill();
  }

  const viewRuns = runs.filter(r => r.view !== '_chrome');
  const perViewport = summarise(runs);
  const chrome = runs.find(r => r.view === '_chrome' && r.viewport === PRIMARY_VIEWPORT);
  const thresholds = buildThresholds({ perViewport, css, viewFacts, zoom, runs });

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    thresholds,
    perViewport,
    chrome: chrome ? {
      textNodes: chrome.probe.text.length,
      belowThirteen: chrome.probe.text.filter(t => t.size < 13).length,
      contrastFails: chrome.probe.text.filter(t => !t.pass).length,
      targetsBelow36: chrome.probe.controls.filter(c => c.min < 36).length,
      unmeasuredControls: chrome.probe.unmeasured.length,
    } : null,
    sizeHistogram: sizeHistogram(viewRuns.filter(r => r.viewport === PRIMARY_VIEWPORT)),
    css,
    consoleErrors,
    reducedMotion,
    scriptMotion,
    worstContrast: viewRuns.filter(r => r.viewport === PRIMARY_VIEWPORT)
      .flatMap(r => r.probe.text.filter(t => !t.pass).map(t => ({ view: r.view, ...t })))
      .sort((a, b) => a.ratio - b.ratio).slice(0, 15),
    unmeasuredControls: viewRuns.filter(r => r.viewport === PRIMARY_VIEWPORT)
      .flatMap(r => r.probe.unmeasured.map(c => ({ view: r.view, ...c }))).slice(0, 20),
    smallestTargets: viewRuns.filter(r => r.viewport === PRIMARY_VIEWPORT)
      .flatMap(r => r.probe.controls.filter(c => c.min < 36).map(c => ({ view: r.view, ...c })))
      .sort((a, b) => a.min - b.min).slice(0, 15),
  };

  const priorReport = existsSync(LATEST) ? JSON.parse(readFileSync(LATEST, 'utf8')) : null;
  const previousSpacingLiterals = priorReport?.css?.spacingLiterals ?? css.spacingLiterals;

  report.standingRules = {
    motionBudget: {
      name: 'No transition or animation over 150ms, in CSS or in script',
      value: css.longMotion.length + scriptMotion.overBudget.length + scriptMotion.staggers.length,
      target: 0,
      pass: css.longMotion.length === 0 && scriptMotion.overBudget.length === 0 && scriptMotion.staggers.length === 0,
      detail: {
        css: [...new Set(css.longMotion)],
        scriptOverBudget: scriptMotion.overBudget,
        staggers: scriptMotion.staggers,
      },
    },
    spacingTokens: {
      name: 'Spacing literals in rules (DESIGN.md Token Rule) - ratchet to 0',
      value: css.spacingLiterals,
      target: previousSpacingLiterals,
      // The end state is 0. The ratchet only enforces "never rises"; a churn that removes one
      // literal and adds another elsewhere still passes, so this is a floor on regression,
      // not evidence the rule is met. It is "ratcheting", never "ok", until it reaches 0.
      pass: css.spacingLiterals <= previousSpacingLiterals,
      met: css.spacingLiterals === 0,
      remaining: css.spacingLiterals,
      note: 'Ratchet, not a gate. Met only at 0; ' + css.spacingLiterals + ' literals still in the sheet.',
    },
    clipping: {
      name: 'Nothing clipped by its own container at any measured viewport',
      value: Object.values(report.perViewport).reduce((n, v) => n + v.clipped.reduce((m, c) => m + c.count, 0), 0),
      target: 0,
      pass: Object.values(report.perViewport).every(v => v.clipped.length === 0),
      detail: Object.entries(report.perViewport)
        .flatMap(([vp, v]) => v.clipped.map(c => vp + ' ' + c.view + ': ' + c.count + ' (' + (c.worst?.sample || c.worst?.cls) + ' cut ' + c.worst?.cut + 'px)'))
        .slice(0, 8),
    },
    specificity: {
      name: 'No !important outside the reduced-motion reset',
      value: css.important - 3, target: 0, pass: css.important <= 3,
    },
  };

  const previous = existsSync(LATEST) ? JSON.parse(readFileSync(LATEST, 'utf8')) : null;
  report.diff = diff(previous?.thresholds, thresholds);
  const ruleDiff = diff(previous?.standingRules, report.standingRules);
  report.diff.regressions.push(...ruleDiff.regressions);
  report.diff.improvements.push(...ruleDiff.improvements);

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
    const num = v => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
    log('');
    log('Convenium.Design Studio UI metrics - ' + report.generatedAt + '  (' + (report.durationMs / 1000).toFixed(1) + 's)');
    log('');
    log('  ' + pad('#', 5) + pad('Threshold', 52) + padS('now', 8) + padS('target', 8) + '  result');
    log('  ' + '-'.repeat(80));
    for (const [id, t] of Object.entries(thresholds)) {
      log('  ' + pad(id, 5) + pad(t.name, 52) + padS(num(t.value), 8) + padS(t.target, 8) + '  ' + (t.pass ? 'PASS' : 'FAIL'));
    }
    log('');
    log('  ' + pad('viewport', 12) + padS('text', 7) + padS('<13px', 7) + padS('AA fail', 9) + padS('<floor', 8) + padS('<32px', 8) + '  overflow');
    for (const [name, v] of Object.entries(perViewport)) {
      const ov = v.overflow.length ? v.overflow.map(o => o.view + ':' + o.px).join(',') : 'none';
      log('  ' + pad(name, 12) + padS(v.textNodes, 7) + padS(v.belowThirteen, 7) + padS(v.contrastFails, 9) + padS(v.targetsBelowFloor, 8) + padS(v.targetsBelow32, 8) + '  ' + ov);
    }
    log('');
    log('  per view @ ' + PRIMARY_VIEWPORT);
    log('  ' + pad('view', 14) + padS('text', 7) + padS('<13px', 7) + padS('AA fail', 9) + padS('<36px', 8) + padS('<32px', 8) + '  dominant');
    for (const [view, v] of Object.entries(perViewport[PRIMARY_VIEWPORT].perView)) {
      if (view === '_chrome' && v.textNodes === 0) continue;
      const dom = v.dominantSize ? v.dominantSize[0] + 'px x' + v.dominantSize[1] : '-';
      log('  ' + pad(view, 14) + padS(v.textNodes, 7) + padS(v.belowThirteen, 7) + padS(v.contrastFails, 9) + padS(v.targetsBelowFloor, 8) + padS(v.targetsBelow32, 8) + '  ' + dom);
    }
    log('');
    if (consoleErrors.length) {
      log('  console: ' + consoleErrors.length + ' error/warning entries');
      for (const e of consoleErrors.slice(0, 5)) log('    [' + e.type + '] ' + e.text);
    } else {
      log('  console: clean');
    }
    for (const [key, rule] of Object.entries(report.standingRules)) {
      const state = !rule.pass ? 'RULE FAIL'
        : (rule.met === false ? 'ratcheting' : 'rule ok  ');
      log('  ' + state + '  ' + key + ': ' + rule.value + ' (target ' + rule.target + ')');
    }
    log('  reduced motion: ' + (reducedMotion.honoured ? 'honoured' : 'NOT honoured - worst ' + reducedMotion.worstDurationMs + 'ms on ' + reducedMotion.offender));
    if (report.diff.firstRun) {
      log('  diff: first recorded run');
    } else {
      for (const r of report.diff.improvements) log('  improved  ' + r.id + ' ' + r.before + ' -> ' + r.after);
      for (const r of report.diff.regressions) log('  REGRESSED ' + r.id + ' ' + r.before + ' -> ' + r.after);
      if (!report.diff.improvements.length && !report.diff.regressions.length) log('  diff: no threshold moved');
    }
    log('');
    log('  written: metrics/latest.json');
    log('');
  }

  if (wantCheck && report.diff.regressions.length) {
    console.error('ui-metrics: ' + report.diff.regressions.length + ' threshold(s) regressed.');
    process.exit(1);
  }
}

main().catch(err => { console.error('ui-metrics failed:', err); process.exit(2); });
