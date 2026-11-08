/**
 * v2 live library (dev server only; `apply: 'serve'`, so the production bundle has none of this).
 *
 * - Watches `library/**`. After a change it asks the generator itself whether the knowledge base is
 *   stale (`project.py shipyard --dry-run` prints "1 write" when it would change the file) and sends
 *   `shipyard:kb-stale` so the UI can show "Library changed · Rebuild". It never regenerates on its
 *   own: Claude or the owner may be mid-edit, and an automatic rebuild would race them.
 * - Watches `public/data/knowledge-base.json`. When it changes (a Rebuild here, Claude running
 *   `project.py all`, or the Forge), it waits 300 ms for the write to settle and sends `shipyard:kb`;
 *   the app refetches the file and swaps the index without a page reload.
 * - `POST /__shipyard/rebuild` runs `project.py all` then `verify.py`, one at a time, and returns both logs.
 * - `GET /__shipyard/status` returns `{ stale }` for a page that opened after the change.
 */
import { spawn } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve, sep } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

export interface RunResult {
  code: number | null;
  out: string;
}

const PYTHON = process.env.PYTHON || 'python';
const STALE_DEBOUNCE_MS = 600;
const KB_SETTLE_MS = 300;
/** Library files the generator writes itself: a change there is the rebuild, not an edit. */
const GENERATED_IN_LIBRARY = /[\\/]registry[\\/]ROUTING-DIGEST\.md$/;

export function run(cmd: string, args: string[], cwd: string, timeoutMs = 180_000): Promise<RunResult> {
  return new Promise((done) => {
    let out = '';
    const p = spawn(cmd, args, { cwd, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    const timer = setTimeout(() => {
      out += `\n[timed out after ${timeoutMs / 1000}s]`;
      p.kill();
    }, timeoutMs);
    p.stdout.on('data', (d: Buffer) => (out += d.toString('utf8')));
    p.stderr.on('data', (d: Buffer) => (out += d.toString('utf8')));
    p.on('error', (e) => {
      clearTimeout(timer);
      done({ code: -1, out: `${out}\n${e.message}` });
    });
    p.on('close', (code) => {
      clearTimeout(timer);
      done({ code, out });
    });
  });
}

export function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

/** Same-origin only: a page on another site must not be able to drive the dev server. */
export function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  return !origin || new URL(origin).host === req.headers.host;
}

/** One library-writing job at a time (Rebuild, Forge apply): the second caller is refused, not queued. */
let busy: string | null = null;
export async function exclusive<T>(what: string, job: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; busy: string }> {
  if (busy) return { ok: false, busy };
  busy = what;
  try {
    return { ok: true, value: await job() };
  } finally {
    busy = null;
  }
}

export interface Paths {
  /** the Convenium.Design repo root (holds library/) */
  repo: string;
  kb: string;
}

export function pathsFrom(shipyardRoot: string): Paths {
  const repo = dirname(shipyardRoot);
  return { repo, kb: resolve(shipyardRoot, 'public/data/knowledge-base.json') };
}

export async function rebuild(repo: string): Promise<{ ok: boolean; project: RunResult; verify: RunResult | null }> {
  const project = await run(PYTHON, ['library/tools/project.py', 'all'], repo);
  if (project.code !== 0) return { ok: false, project, verify: null };
  const verify = await run(PYTHON, ['library/tools/verify.py'], repo);
  return { ok: verify.code === 0, project, verify };
}

export async function isStale(repo: string): Promise<boolean> {
  const r = await run(PYTHON, ['library/tools/project.py', 'shipyard', '--dry-run'], repo, 60_000);
  return /knowledge-base\.json: 1 write/.test(r.out);
}

export function shipyardLive(shipyardRoot: string): Plugin {
  const { repo, kb } = pathsFrom(shipyardRoot);
  const library = resolve(repo, 'library');
  let stale = false;
  let staleTimer: ReturnType<typeof setTimeout> | undefined;
  let kbTimer: ReturnType<typeof setTimeout> | undefined;

  const checkStale = (server: ViteDevServer) => {
    clearTimeout(staleTimer);
    staleTimer = setTimeout(async () => {
      if (busy) return; // a rebuild in flight will end in a KB change, which clears the flag
      const now = await isStale(repo);
      if (now !== stale) {
        stale = now;
        server.ws.send({ type: 'custom', event: 'shipyard:kb-stale', data: { stale } });
      }
    }, STALE_DEBOUNCE_MS);
  };

  return {
    name: 'shipyard-live',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add([library, kb]);
      const onFile = (file: string) => {
        const f = resolve(file);
        if (f === kb) {
          clearTimeout(kbTimer);
          kbTimer = setTimeout(() => {
            stale = false;
            server.ws.send({ type: 'custom', event: 'shipyard:kb', data: { at: Date.now() } });
          }, KB_SETTLE_MS);
          return;
        }
        if ((f === library || f.startsWith(library + sep)) && !GENERATED_IN_LIBRARY.test(f)) checkStale(server);
      };
      server.watcher.on('change', onFile);
      server.watcher.on('add', onFile);
      server.watcher.on('unlink', onFile);

      server.middlewares.use('/__shipyard/status', (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'GET only' });
        return json(res, 200, { ok: true, stale, busy });
      });
      server.middlewares.use('/__shipyard/rebuild', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        const r = await exclusive('rebuild', () => rebuild(repo));
        if (!r.ok) return json(res, 409, { ok: false, error: `busy: ${r.busy}` });
        const { ok, project, verify } = r.value;
        return json(res, ok ? 200 : 422, { ok, project: project.out.slice(-6000), verify: verify?.out.slice(-6000) ?? null });
      });
    },
    // The KB is a public file: never let Vite treat its change as a module update or a reload.
    handleHotUpdate(ctx) {
      if (resolve(ctx.file) === kb) return [];
    },
  };
}
