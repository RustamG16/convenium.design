// Shared plumbing for the two measurement harnesses.
//
// ui-metrics.mjs measures what the interface LOOKS like (T1-T11: type, contrast, targets,
// radii, ornament, undo). ui-behaviour.mjs measures whether it DOES what it says (B1-B8).
// Both boot the same server, drive the same headless Chrome and diff against the same kind
// of previous run, so that machinery lives here once instead of being copied.
//
// Why B exists at all: T1-T11 passed on every view while the Design DNA panel rendered an
// avoid-list headed "Never, in any run" that no run enforced, "Do it for me" prefilled a
// textarea, and "Keep this setup" kept nothing. An interface can be perfectly legible and
// still be lying. Nothing measured that until now.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const VIEWS = [
  'work', 'architecture', 'systems', 'playground', 'agents', 'knowledge', 'oracle', 'runs',
];

/** Nothing in a harness may hang the build. Every await that talks to Chrome is fenced. */
export function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out after ' + ms + 'ms: ' + label)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

/**
 * Boot server.mjs on a random high port.
 *
 * `scratchData: true` points the server at a throwaway data directory. The behaviour sweep
 * clicks real controls - including Delete and Clear - and it must never do that against the
 * committed store. CLAUDE.md protects convenium-design-studio/data/; this is how that promise is kept
 * while still exercising the destructive paths, which are exactly the ones worth testing.
 */
export async function startServer({ scratchData = false, env = {} } = {}) {
  const port = 4100 + Math.floor(Math.random() * 700);
  const dataDir = scratchData ? mkdtempSync(join(tmpdir(), 'convenium-design-harness-')) : null;
  const proc = spawn(process.execPath, [join(ROOT, 'server.mjs')], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      CONVENIUM_DESIGN_METRICS: '1',
      ...(dataDir ? { CONVENIUM_DESIGN_DATA_DIR: dataDir } : {}),
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
  const base = 'http://127.0.0.1:' + port;
  const deadline = Date.now() + 20000;
  for (;;) {
    if (Date.now() > deadline) { proc.kill(); throw new Error('Server did not start on ' + port + '. ' + stderr); }
    try {
      const response = await fetch(base + '/', { signal: AbortSignal.timeout(1500) });
      if (response.ok) break;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  // APOLLO_LEGACY_UI=1 points the legacy UI suites at the retained interface under /legacy/.
  return { proc, base: process.env.APOLLO_LEGACY_UI ? base + '/legacy' : base, dataDir };
}

export async function evaluate(page, expression, options = {}) {
  const { result, exceptionDetails } = await withTimeout(page.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, ...options,
  }), 30000, 'Runtime.evaluate ' + expression.slice(0, 40));
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}

export async function settle(page, ms = 420) {
  await new Promise(r => setTimeout(r, ms));
  await evaluate(page, 'document.readyState');
}

/** Navigate and wait for the load event. A same-URL hash change fires none, so vary the query. */
export async function navigate(page, url) {
  const loaded = page.once('Page.loadEventFired');
  await withTimeout(page.send('Page.navigate', { url }), 20000, 'Page.navigate');
  await withTimeout(loaded, 20000, 'Page.loadEventFired');
}

export async function showView(page, view, ms = 420) {
  await evaluate(page, "location.hash = '/" + view + "'");
  await settle(page, ms);
}

/**
 * Compare this run's threshold values against the previous run's.
 * `higherIsBetter` flips the direction; everything else counts up as worse.
 */
export function diff(previous, current) {
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

/** Collect console errors, warnings and uncaught exceptions off a page. */
export function captureConsole(page, sink) {
  page.on('Runtime.consoleAPICalled', event => {
    if (event.type === 'error' || event.type === 'warning') {
      sink.push({
        type: event.type,
        text: event.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200),
      });
    }
  });
  page.on('Runtime.exceptionThrown', event => {
    sink.push({
      type: 'exception',
      text: (event.exceptionDetails?.exception?.description || event.exceptionDetails?.text || '').slice(0, 200),
    });
  });
}
