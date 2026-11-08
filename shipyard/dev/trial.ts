/**
 * v2 live trials (dev server only; owner decision 2026-11-08). Runs a ship's exported plan with headless
 * Claude Code on a SCRATCH COPY of a fixture project in the OS temp folder — never in this repo — and
 * scores the result from the files the run leaves behind (Verified: computed from the run's own files).
 *
 * Guards: an estimate first (Estimate), a typed confirmation to start, one trial at a time, a turn cap
 * and a wall-clock cap, a fixed tool allow-list, and NEVER a permission-bypass flag. Cancel kills the
 * whole process tree. The CLI is `$CLAUDE_BIN`, else `claude` on PATH; with neither, the UI says so.
 *
 * Endpoints: POST /__shipyard/trial/estimate · POST /__shipyard/trial/start · GET /__shipyard/trial/events?id=
 * (server-sent events; also written to shipyard/trials/<id>/log.ndjson) · POST /__shipyard/trial/cancel.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { json, pathsFrom, run, sameOrigin } from './live';

export const DEFAULT_MAX_TURNS = 30;
export const WALL_CLOCK_MS = 20 * 60_000;
/** The tools a trial may use: files and search only. No shell, no network, no MCP. */
export const ALLOWED_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep'];
/** Tokens per phase by tier, for an estimate with no earlier Verified runs (labelled Estimate). */
const TOKENS_PER_PHASE: Record<string, [number, number]> = { opus: [25_000, 70_000], sonnet: [15_000, 45_000], haiku: [5_000, 15_000], inherit: [15_000, 60_000] };

const estimateInput = z.strictObject({
  ship: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
  shipName: z.string().max(48),
  brief: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
  fixture: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
  plan: z.string().min(1).max(200_000),
  kickoff: z.string().min(1).max(50_000),
  tiers: z.array(z.enum(['opus', 'sonnet', 'haiku', 'inherit'])).min(1).max(64),
  maxTurns: z.number().int().min(1).max(200).default(DEFAULT_MAX_TURNS),
});
type EstimateInput = z.infer<typeof estimateInput>;

export interface Estimate {
  id: string;
  input: EstimateInput;
  tokens: { low: number; high: number };
  maxTurns: number;
  wallClockMs: number;
  truth: 'Estimate';
  confirmPhrase: string;
}

export function estimate(input: EstimateInput): Estimate {
  const low = input.tiers.reduce((s, t) => s + TOKENS_PER_PHASE[t][0], 0);
  const high = input.tiers.reduce((s, t) => s + TOKENS_PER_PHASE[t][1], 0);
  return { id: randomUUID(), input, tokens: { low, high }, maxTurns: input.maxTurns, wallClockMs: WALL_CLOCK_MS, truth: 'Estimate', confirmPhrase: `run ${input.ship}` };
}

/**
 * Pick the runnable entry from `where claude` output. On Windows an npm install lists an extensionless
 * shell shim first, which `spawn` cannot start; prefer .exe, then .cmd/.bat (finish review v2, M4).
 */
export function pickBin(lines: string[], win: boolean): string | null {
  const all = lines.map((l) => l.trim()).filter(Boolean);
  if (!win) return all[0] ?? null;
  return all.find((l) => /\.exe$/i.test(l)) ?? all.find((l) => /\.(cmd|bat)$/i.test(l)) ?? null;
}

/** The CLI to run, or null. `$CLAUDE_BIN` wins; else `claude` resolved on PATH. */
export function claudeBin(): string | null {
  if (process.env.CLAUDE_BIN) return existsSync(process.env.CLAUDE_BIN) ? process.env.CLAUDE_BIN : null;
  const win = process.platform === 'win32';
  const r = spawnSync(win ? 'where' : 'which', ['claude'], { encoding: 'utf8' });
  return r.status === 0 ? pickBin(r.stdout.split(/\r?\n/), win) : null;
}

/**
 * The argv for one trial. Asserted by the unit test: no bypass flag ever appears. The prompt goes on
 * stdin (`claude -p` reads it there), so no shell ever has to quote a multi-line prompt.
 */
/** cmd.exe splits an unquoted path at its spaces (C:\Users\First Last\...\claude.cmd); quote it when the shell runs it (re-review v2, n-b). */
export function shellQuote(path: string): string {
  return /^".*"$/.test(path) ? path : `"${path}"`;
}

export function trialArgs(maxTurns: number): string[] {
  return ['-p', '--output-format', 'stream-json', '--verbose', '--max-turns', String(maxTurns), '--allowedTools', ALLOWED_TOOLS.join(',')];
}

export const FORBIDDEN_FLAGS = ['--dangerously-skip-permissions', '--permission-mode=bypassPermissions', 'bypassPermissions'];

/** Kill a process and everything it started. */
export function killTree(p: ChildProcess) {
  if (!p.pid || p.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { windowsHide: true });
  else {
    try {
      process.kill(-p.pid, 'SIGKILL');
    } catch {
      p.kill('SIGKILL');
    }
  }
}

/** How a brief need's phase shows up in run.json phase_counts. */
const PHASE_KEYS: Record<string, string[]> = {
  always: ['run_plan', 'intake'],
  diagnose: ['audit', 'measure', 'brand_dna'],
  direct: ['direction', 'critique'],
  prepare: ['prepare', 'design_system'],
  build: ['build', 'shell', 'fleet'],
  verify: ['qa', 'finish', 'review'],
};

export interface LiveBrief {
  id: string;
  needs: { id: string; phase: string }[];
  requiredArtifacts: string[];
  gates: string[];
}

export interface LiveScore {
  /** Verified: the measured criteria only, scaled to 100. The only number that rates or ranks. */
  total: number;
  /** what the run wrote about itself in run.json (coverage and gates): shown, never counted */
  reported: { points: number; max: number };
  criteria: Record<string, { points: number; max: number; why: string; source: 'measured' | 'reported' }>;
  facts: { runJson: boolean; planClean: boolean | null; artifactsFound: string[]; exitCode: number | null; tokens: number | null };
}

/**
 * Score a finished scratch project. Pure apart from reading `dir`; unit-tested on a fixture.
 *
 * Measured by the dev server (Verified): the required files present in .olympus/, verify.py --plan on
 * the plan the run wrote, the tokens the CLI reported and the exit code. Reported by the run (never
 * ranked, finish review v2 M2): coverage and gates, which come from the run's own run.json.
 */
/** Smallest file that counts as a required artifact: a stub heading is not a deliverable (re-review v2, n-c). */
export const MIN_ARTIFACT_BYTES = 300;

/** A required artifact counts when it has real content: a Markdown file of at least MIN_ARTIFACT_BYTES with a heading and body lines, or a JSON file that parses. */
export function substantial(path: string): boolean {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return false;
  }
  if (/\.json$/i.test(path)) {
    try {
      JSON.parse(text);
      return text.trim().length > 2;
    } catch {
      return false;
    }
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return Buffer.byteLength(text, 'utf8') >= MIN_ARTIFACT_BYTES && lines.some((l) => l.startsWith('#')) && lines.filter((l) => !l.startsWith('#')).length >= 2;
}

export function scoreLive(dir: string, brief: LiveBrief, est: { high: number }, exitCode: number | null, tokens: number | null, planClean: boolean | null): LiveScore {
  const olympus = join(dir, '.olympus');
  let run: Record<string, unknown> | null = null;
  try {
    run = JSON.parse(readFileSync(join(olympus, 'run.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    run = null;
  }
  const counts = (run?.phase_counts ?? {}) as Record<string, number>;
  const files = existsSync(olympus) ? readdirSync(olympus) : [];
  const found = brief.requiredArtifacts.map((a) => basename(a).replace(/ per site$/, '')).filter((a) => files.includes(a) && substantial(join(olympus, a)));
  const share = brief.requiredArtifacts.length ? found.length / brief.requiredArtifacts.length : 1;
  const covered = brief.needs.filter((n) => (PHASE_KEYS[n.phase] ?? []).some((k) => (counts[k] ?? 0) > 0));
  // a gate counts only when the run says it was passed, not on any word
  const gateDone = (g: string) => /^(approved|passed|pass)$/i.test(String(run?.[`gate_${g.toLowerCase()}`] ?? ''));
  const gates = brief.gates.filter(gateDone);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const criteria = {
    coverage: { source: 'reported' as const, points: r1((35 * covered.length) / brief.needs.length), max: 35, why: `${covered.length} of ${brief.needs.length} needs have a phase the run says it ran (its run.json)` },
    artifacts: { source: 'measured' as const, points: r1(brief.requiredArtifacts.length ? (15 * found.length) / brief.requiredArtifacts.length : 15), max: 15, why: `${found.length} of ${brief.requiredArtifacts.length} required files in .olympus/ with real content (a heading, body lines, at least ${MIN_ARTIFACT_BYTES} bytes)` },
    gates: { source: 'reported' as const, points: r1(brief.gates.length ? (15 * gates.length) / brief.gates.length : 15), max: 15, why: `${gates.length} of ${brief.gates.length} ${brief.gates.length === 1 ? 'gate' : 'gates'} the run says it passed (its run.json)` },
    // pre-flight and a clean exit pay only for the work the run left, like economy: copying the plan it was handed and stopping is not a Verified 50 (re-review 2, new-c)
    preflight: { source: 'measured' as const, points: planClean ? r1(20 * share) : 0, max: 20, why: planClean === null ? 'the run wrote no .olympus/00-run-plan.md' : planClean ? 'verify.py --plan CLEAN on the plan the run wrote, scaled by the share of required files delivered' : 'verify.py --plan found problems' },
    // economy pays only for the work the run left: a run that stops early cannot win on thrift (re-review v2, n-c)
    economy: { source: 'measured' as const, points: tokens === null ? 0 : r1(share * (tokens <= est.high ? 10 : Math.max(0, 10 - (10 * (tokens - est.high)) / est.high))), max: 10, why: tokens === null ? 'token use not reported' : `${tokens} tokens against an estimate of at most ${est.high}, scaled by the share of required files delivered` },
    clarity: { source: 'measured' as const, points: exitCode === 0 ? r1(5 * share) : 0, max: 5, why: exitCode === 0 ? 'the run ended cleanly, scaled by the share of required files delivered' : `the run ended with code ${exitCode}` },
  };
  const part = (src: 'measured' | 'reported') => Object.values(criteria).filter((c) => c.source === src);
  const sum = (cs: { points: number; max: number }[]) => cs.reduce((a, c) => ({ points: a.points + c.points, max: a.max + c.max }), { points: 0, max: 0 });
  const measured = sum(part('measured'));
  const reported = sum(part('reported'));
  const total = r1((100 * measured.points) / measured.max);
  return { total, reported: { points: r1(reported.points), max: reported.max }, criteria, facts: { runJson: !!run, planClean, artifactsFound: found, exitCode, tokens } };
}

/** Sum the token usage the stream-json `result` message reports, when it reports it. */
export function tokensFrom(line: unknown): number | null {
  if (!line || typeof line !== 'object') return null;
  const o = line as { type?: string; usage?: Record<string, number> };
  if (o.type !== 'result' || !o.usage) return null;
  const u = o.usage;
  // input + output only: cache reads dominate a long run and would sink economy for every ship alike (finish review v2, m10)
  return (u.input_tokens ?? 0) + (u.output_tokens ?? 0);
}

interface Live {
  id: string;
  est: Estimate;
  dir: string;
  proc: ChildProcess | null;
  started: number;
  lines: string[];
  listeners: Set<ServerResponse>;
  done: boolean;
  result: unknown;
}

function send(t: Live, logDir: string, event: Record<string, unknown>) {
  const line = JSON.stringify({ at: Date.now(), ...event });
  t.lines.push(line);
  try {
    appendFileSync(join(logDir, 'log.ndjson'), `${line}\n`, 'utf8');
  } catch {
    /* the log file is a convenience; the stream still goes to the page */
  }
  for (const res of t.listeners) res.write(`data: ${line}\n\n`);
}

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 400_000) throw new Error('request too large');
    chunks.push(c as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function shipyardTrials(shipyardRoot: string): Plugin {
  const { repo } = pathsFrom(shipyardRoot);
  const estimates = new Map<string, Estimate>();
  const trials = new Map<string, Live>();
  let current: Live | null = null;
  const briefsDir = resolve(shipyardRoot, 'fixtures/briefs');
  const projectsDir = resolve(shipyardRoot, 'fixtures/projects');
  const trialsDir = resolve(shipyardRoot, 'trials');

  return {
    name: 'shipyard-trials',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shipyard/trial/estimate', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        let parsed;
        try {
          parsed = estimateInput.safeParse(await body(req));
        } catch (e) {
          return json(res, 400, { ok: false, problems: [String(e)] });
        }
        if (!parsed.success) return json(res, 400, { ok: false, problems: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
        if (!existsSync(join(projectsDir, parsed.data.fixture))) return json(res, 400, { ok: false, problems: [`no fixture project ${parsed.data.fixture}`] });
        const bin = claudeBin();
        const e = estimate(parsed.data);
        estimates.set(e.id, e);
        return json(res, 200, { ok: true, available: !!bin, why: bin ? null : 'The Claude Code CLI was not found. Install it, or set CLAUDE_BIN to its path, then restart the dev server.', estimate: { id: e.id, tokens: e.tokens, maxTurns: e.maxTurns, wallClockMs: e.wallClockMs, truth: e.truth, confirmPhrase: e.confirmPhrase, tools: ALLOWED_TOOLS }, busy: current && !current.done ? current.id : null });
      });

      server.middlewares.use('/__shipyard/trial/start', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        let input: { estimate?: string; confirm?: string };
        try {
          input = (await body(req)) as typeof input;
        } catch (e) {
          return json(res, 400, { ok: false, problems: [String(e)] });
        }
        const est = estimates.get(String(input.estimate ?? ''));
        if (!est) return json(res, 400, { ok: false, problems: ['estimate expired; ask for a new one'] });
        if (input.confirm !== est.confirmPhrase) return json(res, 400, { ok: false, problems: [`type "${est.confirmPhrase}" to start`] });
        if (current && !current.done) return json(res, 409, { ok: false, problems: [`a trial is already running (${current.id})`] });
        const bin = claudeBin();
        if (!bin) return json(res, 400, { ok: false, problems: ['The Claude Code CLI was not found (set CLAUDE_BIN).'] });
        estimates.delete(est.id);

        const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${est.input.ship}`;
        const dir = mkdtempSync(join(tmpdir(), `shipyard-trial-${est.input.ship}-`));
        cpSync(join(projectsDir, est.input.fixture), dir, { recursive: true });
        mkdirSync(join(dir, '.olympus'), { recursive: true });
        writeFileSync(join(dir, 'SHIP-PLAN.md'), est.input.plan, 'utf8');
        writeFileSync(join(dir, 'KICKOFF.md'), est.input.kickoff, 'utf8');
        const logDir = join(trialsDir, id);
        mkdirSync(logDir, { recursive: true });
        const t: Live = { id, est, dir, proc: null, started: Date.now(), lines: [], listeners: new Set(), done: false, result: null };
        trials.set(id, t);
        current = t;

        const prompt = `${est.input.kickoff}\n\nThe ship's plan is in SHIP-PLAN.md in this folder. Work only inside this folder. Record the run in .olympus/run.json: phase_counts, and gate_a / gate_b / gate_c each set to "approved", "passed" or "pass" only when that gate was actually passed (any other value counts as not passed). Write your own .olympus/00-run-plan.md, and give every required file a heading and real content.`;
        const args = trialArgs(est.maxTurns);
        // a .mjs/.js CLAUDE_BIN (the e2e fake) runs under this Node; a .cmd shim needs the shell on Windows
        const script = /\.(mjs|cjs|js)$/i.test(bin);
        const viaShell = !script && process.platform === 'win32' && /\.(cmd|bat)$/i.test(bin);
        const proc = spawn(script ? process.execPath : viaShell ? shellQuote(bin) : bin, script ? [bin, ...args] : args, { cwd: dir, windowsHide: true, detached: process.platform !== 'win32', shell: viaShell, env: { ...process.env } });
        t.proc = proc;
        proc.stdin?.on('error', () => {
          /* a CLI that exits before reading its prompt reports through its exit code */
        });
        proc.stdin?.end(prompt, 'utf8');
        send(t, logDir, { kind: 'start', dir, maxTurns: est.maxTurns, tools: ALLOWED_TOOLS });
        let tokens: number | null = null;
        let buf = '';
        proc.stdout?.on('data', (d: Buffer) => {
          buf += d.toString('utf8');
          let i: number;
          while ((i = buf.indexOf('\n')) >= 0) {
            const raw = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!raw) continue;
            let msg: unknown;
            try {
              msg = JSON.parse(raw);
            } catch {
              send(t, logDir, { kind: 'text', text: raw.slice(0, 2000) });
              continue;
            }
            tokens = tokensFrom(msg) ?? tokens;
            const m = msg as { type?: string; subtype?: string };
            send(t, logDir, { kind: 'message', type: m.type ?? 'unknown', subtype: m.subtype ?? null, text: raw.slice(0, 2000) });
          }
        });
        proc.stderr?.on('data', (d: Buffer) => send(t, logDir, { kind: 'stderr', text: d.toString('utf8').slice(0, 2000) }));
        const timer = setTimeout(() => {
          send(t, logDir, { kind: 'timeout', afterMs: WALL_CLOCK_MS });
          killTree(proc);
        }, WALL_CLOCK_MS);
        const finish = async (code: number | null) => {
          clearTimeout(timer);
          if (t.done) return;
          const planPath = join(dir, '.olympus', '00-run-plan.md');
          const planClean = existsSync(planPath) ? (await run(process.env.PYTHON || 'python', ['library/tools/verify.py', '--plan', planPath], repo, 60_000)).code === 0 : null;
          let brief: LiveBrief | null;
          try {
            brief = JSON.parse(readFileSync(join(briefsDir, `${est.input.brief}.json`), 'utf8')) as LiveBrief;
          } catch {
            brief = null;
          }
          const score = brief ? scoreLive(dir, brief, est.tokens, code, tokens, planClean) : null;
          const durationMs = Date.now() - t.started;
          t.result = { id, ship: est.input.ship, shipName: est.input.shipName, brief: est.input.brief, exitCode: code, durationMs, tokens, score, truth: score && code === 0 ? 'Verified' : 'Unavailable', dir };
          writeFileSync(join(logDir, 'result.json'), `${JSON.stringify(t.result, null, 2)}\n`, 'utf8');
          t.done = true;
          send(t, logDir, { kind: 'finish', result: t.result });
          for (const r of t.listeners) r.end();
          t.listeners.clear();
        };
        proc.on('error', (e) => {
          send(t, logDir, { kind: 'stderr', text: e.message });
          void finish(-1);
        });
        proc.on('close', (code) => void finish(code));
        return json(res, 200, { ok: true, id });
      });

      server.middlewares.use('/__shipyard/trial/events', (req, res) => {
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? '';
        const t = trials.get(id);
        if (!t) return json(res, 404, { ok: false, error: 'no such trial' });
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        for (const line of t.lines) res.write(`data: ${line}\n\n`);
        if (t.done) return res.end();
        t.listeners.add(res);
        req.on('close', () => t.listeners.delete(res));
      });

      server.middlewares.use('/__shipyard/trial/cancel', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        if (!current || current.done || !current.proc) return json(res, 409, { ok: false, problems: ['no trial is running'] });
        killTree(current.proc);
        return json(res, 200, { ok: true, id: current.id });
      });
    },
  };
}
