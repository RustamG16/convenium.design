/**
 * v2 live trials, the client (dev server only; dev/trial.ts is the runner). One ship sails one brief
 * with headless Claude Code on a scratch copy of the brief's fixture project:
 *   estimate (labelled Estimate) → type "run <ship>" → Start → the run's own log → its score.
 * A finished run that left a run.json is saved as a Verified trial record; that is the only way a ship
 * gets a place on the leaderboard. The deployed build has no runner, so nothing here renders there.
 */
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useId, useRef, useState } from 'react';
import '../../styles/bridge.css';
import { TruthLabel } from '../../components/TruthLabel';
import { buildRunPlan, ExportError, exportShip, isAbsolutePath, normalizePath } from '../../domain/export';
import type { Ship } from '../../domain/schema';
import { shipHash, type Brief } from '../../domain/trial';
import { useKb } from '../../kb/context';
import { useStoreState } from '../../store/context';
import { trials } from './records';

export const LIVE_AVAILABLE = import.meta.env.DEV;
const TIERS = ['opus', 'sonnet', 'haiku', 'inherit'] as const;
type Tier = (typeof TIERS)[number];
const MAX_LOG = 300;

interface EstimateView {
  id: string;
  tokens: { low: number; high: number };
  maxTurns: number;
  wallClockMs: number;
  confirmPhrase: string;
  tools: string[];
}

interface LiveResult {
  id: string;
  exitCode: number | null;
  durationMs: number;
  tokens: number | null;
  truth: 'Verified' | 'Unavailable';
  dir: string;
  score: { total: number; criteria: Record<string, { points: number; max: number; why: string }> } | null;
}

interface LogLine {
  n: number;
  kind: string;
  text: string;
}

type Phase =
  | { at: 'estimating' }
  | { at: 'problem'; problems: string[] }
  | { at: 'ready'; est: EstimateView; available: boolean; why: string | null; busy: string | null }
  | { at: 'running'; id: string; est: EstimateView }
  | { at: 'finished'; result: LiveResult; saved: boolean; cancelled: boolean };

async function post(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let data: Record<string, unknown>;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = { problems: [`the dev server answered ${res.status}`] };
  }
  return { ok: res.ok && data.ok === true, status: res.status, data };
}

const problemsOf = (data: Record<string, unknown>) => (Array.isArray(data.problems) ? data.problems.map(String) : [String(data.error ?? 'the request failed')]);
const fmtTokens = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
const fmtMinutes = (ms: number) => `${Math.round(ms / 60_000)} minutes`;

function lineText(e: Record<string, unknown>): string {
  switch (e.kind) {
    case 'start':
      return `Started in a scratch folder: ${String(e.dir)}`;
    case 'message':
      return `${String(e.type)}${e.subtype ? ` (${String(e.subtype)})` : ''}: ${String(e.text).slice(0, 240)}`;
    case 'timeout':
      return 'Stopped: the run reached its 20-minute cap.';
    case 'finish':
      return 'The run ended.';
    default:
      return String(e.text ?? '').slice(0, 240);
  }
}

export function LiveTrialButton({ ship, brief }: { ship: Ship; brief: Brief }) {
  const [open, setOpen] = useState(false);
  if (!LIVE_AVAILABLE) return null;
  return (
    <>
      <button type="button" className="btn btn-text btn-sm" onClick={() => setOpen(true)} data-testid="rg-live" data-ship={ship.id}>
        Run live…
      </button>
      {open && <LiveTrialDialog ship={ship} brief={brief} onClose={() => setOpen(false)} />}
    </>
  );
}

function LiveTrialDialog({ ship, brief, onClose }: { ship: Ship; brief: Brief; onClose: () => void }) {
  const idx = useKb();
  const { ui } = useStoreState();
  const [phase, setPhase] = useState<Phase>({ at: 'estimating' });
  const [typed, setTyped] = useState('');
  const [log, setLog] = useState<LogLine[]>([]);
  const [startProblems, setStartProblems] = useState<string[]>([]);
  const cancelled = useRef(false);
  const source = useRef<EventSource | null>(null);
  // the hashes the record is filed under are the ones the ship sailed with, not whatever it is later
  const sailed = useRef({ kbHash: idx.kb.sourceHash, shipHash: shipHash(ship) });
  const confirmId = useId();

  useEffect(() => {
    let live = true;
    (async () => {
      let repo: string;
      try {
        const s = (await (await fetch('/__shipyard/status', { cache: 'no-store' })).json()) as { repo?: string };
        repo = s.repo ?? '';
      } catch {
        repo = '';
      }
      const cd = isAbsolutePath(ui.designPath) ? normalizePath(ui.designPath) : repo;
      let input: Record<string, unknown>;
      try {
        const bundle = exportShip(idx, ship, cd, new Date().toISOString());
        const tiers = buildRunPlan(idx, ship, cd).phases.map((p): Tier => ((TIERS as readonly string[]).includes(p.model) ? (p.model as Tier) : 'inherit'));
        input = { ship: ship.id, shipName: ship.name.slice(0, 48), brief: brief.id, fixture: brief.fixtureProject, plan: bundle.runPlan, kickoff: bundle.kickoff, tiers };
      } catch (e) {
        if (live) setPhase({ at: 'problem', problems: [e instanceof ExportError ? e.message : String(e)] });
        return;
      }
      const r = await post('/__shipyard/trial/estimate', input);
      if (!live) return;
      if (!r.ok) return setPhase({ at: 'problem', problems: problemsOf(r.data) });
      setPhase({ at: 'ready', est: r.data.estimate as EstimateView, available: r.data.available === true, why: (r.data.why as string | null) ?? null, busy: (r.data.busy as string | null) ?? null });
    })();
    return () => {
      live = false;
    };
  }, [idx, ship, brief, ui.designPath]);

  useEffect(() => () => source.current?.close(), []);

  const follow = (id: string) => {
    const es = new EventSource(`/__shipyard/trial/events?id=${encodeURIComponent(id)}`);
    source.current = es;
    let n = 0;
    es.onmessage = (m) => {
      let e: Record<string, unknown>;
      try {
        e = JSON.parse(m.data as string) as Record<string, unknown>;
      } catch {
        return;
      }
      n += 1;
      const line = { n, kind: String(e.kind), text: lineText(e) };
      setLog((l) => [...l, line].slice(-MAX_LOG));
      if (e.kind === 'finish') {
        es.close();
        const result = e.result as LiveResult;
        let saved = false;
        if (result.truth === 'Verified' && result.score) {
          trials.add({
            id: result.id.slice(0, 64),
            at: new Date().toISOString(),
            ship: ship.id,
            shipName: ship.name.slice(0, 48),
            brief: brief.id,
            source: 'live',
            truth: 'Verified',
            total: Math.min(100, Math.max(0, result.score.total)),
            criteria: result.score.criteria,
            kbHash: sailed.current.kbHash,
            shipHash: sailed.current.shipHash,
            durationMs: Math.max(0, Math.round(result.durationMs)),
            ...(result.tokens !== null ? { tokens: Math.max(0, Math.round(result.tokens)) } : {}),
          });
          saved = true;
        }
        setPhase({ at: 'finished', result, saved, cancelled: cancelled.current });
      }
    };
    // the server ends the stream after the finish event; anything else is the dev server going away
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) setLog((l) => [...l, { n: n + 1, kind: 'stderr', text: 'Lost the connection to the dev server.' }]);
    };
  };

  const start = async () => {
    if (phase.at !== 'ready') return;
    setStartProblems([]);
    const r = await post('/__shipyard/trial/start', { estimate: phase.est.id, confirm: typed.trim() });
    if (!r.ok) return setStartProblems(problemsOf(r.data));
    const id = String(r.data.id);
    setPhase({ at: 'running', id, est: phase.est });
    follow(id);
  };

  const cancel = async () => {
    cancelled.current = true;
    const r = await post('/__shipyard/trial/cancel', {});
    if (!r.ok) setLog((l) => [...l, { n: l.length + 1, kind: 'stderr', text: problemsOf(r.data).join(' ') }]);
  };

  const running = phase.at === 'running';
  return (
    <Dialog.Root open onOpenChange={(o) => !o && !running && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog dialog-tall rg-live-dialog" data-testid="rg-live-dialog" aria-describedby={undefined} onEscapeKeyDown={(e) => running && e.preventDefault()} onPointerDownOutside={(e) => running && e.preventDefault()}>
          <Dialog.Title className="card-title">
            Live run · {ship.name} on {brief.title}
          </Dialog.Title>

          {phase.at === 'estimating' && (
            <p className="state-line" role="status">
              Exporting the plan and asking the dev server for an estimate…
            </p>
          )}

          {phase.at === 'problem' && (
            <div role="alert" className="import-problems" data-testid="rg-live-problems">
              <p className="label">This ship cannot sail live yet:</p>
              <ul className="plain-list">
                {phase.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {phase.at === 'ready' && (
            <>
              <dl className="rg-live-facts" data-testid="rg-live-estimate">
                <div>
                  <dt className="label">Tokens</dt>
                  <dd>
                    <span className="num">
                      {fmtTokens(phase.est.tokens.low)}–{fmtTokens(phase.est.tokens.high)}
                    </span>{' '}
                    <TruthLabel truth="Estimate" detail="per-tier defaults" />
                  </dd>
                </div>
                <div>
                  <dt className="label">Turns</dt>
                  <dd>
                    at most <span className="num">{phase.est.maxTurns}</span>
                  </dd>
                </div>
                <div>
                  <dt className="label">Length</dt>
                  <dd>stopped after {fmtMinutes(phase.est.wallClockMs)} at most</dd>
                </div>
                <div>
                  <dt className="label">Tools</dt>
                  <dd>{phase.est.tools.join(', ')}. No shell, no network.</dd>
                </div>
              </dl>
              <p className="prose-sm">
                The run works on a scratch copy of the <code>{brief.fixtureProject}</code> project in your temp folder, never in this repository. Claude Code runs with its own permission prompts; nothing is bypassed. It uses your Claude account and counts against its usage.
              </p>
              {!phase.available ? (
                <p role="alert" className="import-problems" data-testid="rg-live-unavailable">
                  {phase.why}
                </p>
              ) : phase.busy ? (
                <p role="alert" className="import-problems">
                  Another live run is still going ({phase.busy}). One at a time.
                </p>
              ) : (
                <label className="field-row" htmlFor={confirmId}>
                  <span className="label">
                    Type <code>{phase.est.confirmPhrase}</code> to start
                  </span>
                  <input id={confirmId} className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} data-testid="rg-live-confirm" />
                </label>
              )}
              {startProblems.length > 0 && (
                <ul role="alert" className="plain-list import-problems">
                  {startProblems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {(phase.at === 'running' || phase.at === 'finished') && (
            <ol className="rg-live-log" role="log" aria-label="What the run is doing" data-testid="rg-live-log">
              {log.map((l) => (
                <li key={l.n} data-kind={l.kind}>
                  {l.text}
                </li>
              ))}
            </ol>
          )}

          {phase.at === 'finished' && (
            <div className="rg-live-result" data-testid="rg-live-result" data-saved={phase.saved || undefined}>
              {phase.result.score && phase.saved ? (
                <p>
                  Scored <strong className="num">{phase.result.score.total}</strong> of 100 <TruthLabel truth="Verified" detail="from the files the run left" />. Saved as a live trial record; it counts on the leaderboard.
                </p>
              ) : (
                <p>
                  {phase.cancelled ? 'Cancelled. ' : ''}No record saved: the run left no <code>.olympus/run.json</code>, so there is nothing to verify. <TruthLabel truth="Unavailable" />
                </p>
              )}
              <p className="muted prose-sm">
                Ended with code {String(phase.result.exitCode)} after {Math.round(phase.result.durationMs / 1000)} s
                {phase.result.tokens !== null ? `, ${phase.result.tokens} tokens` : ''}. The scratch folder stays at <code>{phase.result.dir}</code>.
              </p>
            </div>
          )}

          <div className="dialog-actions">
            {phase.at === 'ready' && phase.available && !phase.busy && (
              <button type="button" className="btn btn-primary" disabled={typed.trim() !== phase.est.confirmPhrase} onClick={start} data-testid="rg-live-start">
                Start the live run
              </button>
            )}
            {running && (
              <button type="button" className="btn btn-quiet" onClick={cancel} data-testid="rg-live-cancel">
                Cancel the run
              </button>
            )}
            {!running && (
              <Dialog.Close asChild>
                <button type="button" className="btn btn-quiet" data-testid="rg-live-close">
                  Close
                </button>
              </Dialog.Close>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
