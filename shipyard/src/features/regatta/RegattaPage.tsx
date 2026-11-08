// `#/regatta` — v2 (owner decision 2026-11-08: full game scoring). Ships sail the same test brief and
// are compared criterion by criterion. A dry run is a deterministic simulation of the ship's plan
// (Simulated); a live run on the dev server executes it (Verified, T23). The ethics gate in the UI:
// - every number carries its truth label;
// - ratings and places come only from fresh Verified trial records; Simulated scores have their own
//   column and never rank anyone;
// - a record whose ship or library changed since is stale: listed, flagged, not counted;
// - ties are ties; nothing here rewards clicks, visits or time.
import * as Tabs from '@radix-ui/react-tabs';
import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router';
import '../../styles/ship.css';
import '../../styles/regatta.css';
import { TruthLabel } from '../../components/TruthLabel';
import { BRIEFS } from '../../domain/briefs';
import { compare, leaderboard, overall, recordFromDry, type Current, type TrialRecord } from '../../domain/regatta';
import { displayHull, type Ship } from '../../domain/schema';
import { libraryShips, LIBRARY_EPOCH } from '../../domain/ship';
import { CRITERIA, shipHash, simulate, type Brief, type DryTrial, type TrialEvent, failingChecks } from '../../domain/trial';
import { onlyTuningDiffers, tuningTwins } from '../../domain/variant';
import { useKb } from '../../kb/context';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import type { ArenaLane } from '../../scene/Arena';
import { useStoreState } from '../../store/context';
import { LIVE_AVAILABLE, LiveTrialButton } from './LiveTrial';
import { recordId, trials, useTrials } from './records';

const MIN_SHIPS = 2;
const MAX_SHIPS = 4;
/** Every lane is revealed over the same beats (finish review v2, M3); 0.65 s a beat (plan 12 § 2: 0.6–1.2 s). */
const REVEAL_BEATS = 10;
const STEP_MS = 650;
const LANE_COLORS = ['var(--sw-1)', 'var(--sw-2)', 'var(--sw-3)', 'var(--sw-4)'];
/** the same swatches as hex, for the 3D arena (tokens.css --sw-1..4) */
const LANE_HEX = ['#d9a441', '#86c2a8', '#c79fdc', '#93aedb'];
const Arena = lazy(() => import('../../scene/Arena'));

/** Every ship the owner can enter: their own, then the library's templates they have not replaced. */
function useEntrants(): Ship[] {
  const idx = useKb();
  const { ships } = useStoreState();
  return useMemo(() => {
    const own = new Set(ships.map((s) => s.id));
    return [...ships, ...libraryShips(idx, LIBRARY_EPOCH).ships.filter((s) => !own.has(s.id))];
  }, [idx, ships]);
}

function useCurrent(entrants: Ship[]): Current {
  const idx = useKb();
  return useMemo(() => ({ kbHash: idx.kb.sourceHash, shipHash: new Map(entrants.map((s) => [s.id, shipHash(s)])) }), [idx, entrants]);
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const shortDate = (iso: string) => iso.slice(0, 10);

/* ------------------------------------------------------------------------------------------ setup */

function BriefPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const name = useId();
  return (
    <fieldset className="rg-briefs">
      <legend className="label">1 · The brief</legend>
      <div className="rg-brief-grid">
        {BRIEFS.map((b) => (
          <label key={b.id} className="rg-brief" data-testid="rg-brief" data-brief={b.id}>
            <input type="radio" name={name} checked={value === b.id} onChange={() => onChange(b.id)} />
            <span className="rg-brief-title">{b.title}</span>
            <span className="rg-brief-summary">{b.summary}</span>
            <span className="rg-brief-meta">
              {b.needs.length} needs · {b.requiredArtifacts.length} artifacts · gates {b.gates.join(', ') || 'none'} · budget {b.budget.tierPoints} tier points
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ShipPicker({ entrants, value, onChange }: { entrants: Ship[]; value: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : value.length < MAX_SHIPS ? [...value, id] : value);
  return (
    <fieldset className="rg-ships">
      <legend className="label">
        2 · The ships <span className="muted">· {value.length} of {MAX_SHIPS} chosen, at least {MIN_SHIPS}</span>
      </legend>
      <div className="rg-ship-grid">
        {entrants.map((s) => {
          const on = value.includes(s.id);
          return (
            <label key={s.id} className="choice rg-ship" data-testid="rg-ship" data-ship={s.id}>
              <input type="checkbox" checked={on} disabled={!on && value.length >= MAX_SHIPS} onChange={() => toggle(s.id)} />
              <span>
                {s.name}
                <span className="muted rg-ship-meta"> · {s.origin?.kind === 'library' ? 'template' : 'yours'} · {s.crew.length} crew</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ----------------------------------------------------------------------------------------- course */

function buoyKind(e: TrialEvent): 'scores' | 'plain' | 'gate' | 'gate-req' {
  if (e.kind === 'gate') return e.required ? 'gate-req' : 'gate';
  if (e.kind === 'stage') return e.needs.length || e.produced.length ? 'scores' : 'plain';
  return 'plain';
}

function buoyLabel(e: TrialEvent): string {
  if (e.kind === 'gate') return `Gate ${e.gate}${e.required ? ', which the brief requires' : ''}`;
  if (e.kind === 'stage') {
    const bits = [e.label, e.skill ? `opens ${e.skill}` : 'opens no skill'];
    if (e.needs.length) bits.push(`meets ${e.needs.join(', ')}`);
    if (e.produced.length) bits.push(`produces ${e.produced.join(', ')}`);
    return bits.join(' · ');
  }
  return 'Finish';
}

/** The share of the track a fraction of 100 points reaches (the hull's and the buoys' `left`). */
const along = (frac: number) => `calc(var(--s4) + 6px + (100% - 2 * var(--s4) - 12px) * ${Math.max(0, Math.min(1, frac))})`;

/**
 * The course is 100 points long. Every lane is revealed over the same beats and each ship sails as far
 * as its score, so the order on the course is always the order of the scores; a ship's buoys (its
 * stages and gates) are spread over the stretch it reaches.
 */
function Course({ runs, names, step, winners }: { runs: DryTrial[]; names: Map<string, string>; step: number; winners: string[] }) {
  const progress = Math.min(1, step / REVEAL_BEATS);
  const done = progress >= 1;
  return (
    <ol className="rg-course" data-testid="rg-course" aria-label="The course: 100 points long, one lane per ship, one buoy per stage or gate">
      {runs.map((r, i) => {
        const buoys = r.events.filter((e) => e.kind !== 'finish');
        const n = buoys.length;
        const passed = Math.min(n, Math.floor(progress * n + 1e-9));
        const reach = r.score.total / 100;
        const won = done && winners.includes(r.ship);
        return (
          <li key={r.ship} className="rg-lane" data-testid="rg-lane" data-ship={r.ship} data-done={done || undefined} data-winner={won || undefined} style={{ ['--lane' as string]: LANE_COLORS[i % LANE_COLORS.length] } as CSSProperties}>
            <span className="rg-lane-name">{names.get(r.ship) ?? r.ship}</span>
            <div className="rg-track">
              <ol className="rg-buoys" aria-label={`${names.get(r.ship)}: ${n} buoys`}>
                {buoys.map((e, j) => (
                  <li key={j} className="rg-buoy" data-kind={buoyKind(e)} data-passed={j < passed || undefined} title={buoyLabel(e)} style={{ left: along((reach * (j + 1)) / Math.max(1, n)) }}>
                    <span className="sr-only">{buoyLabel(e)}</span>
                  </li>
                ))}
              </ol>
              <span className="rg-boat" style={{ left: along(reach * progress) }} aria-hidden="true" />
            </div>
            <span className="rg-finish" aria-live="polite">
              {done ? (
                <>
                  {won && (
                    <span className="rg-winner-chip" data-testid="rg-lane-winner">
                      {winners.length > 1 ? 'Winner, tied' : 'Winner'}
                    </span>
                  )}
                  <span className="num" data-testid="rg-lane-total">
                    {fmt(r.score.total)}
                  </span>
                  <span className="muted"> / 100</span>
                </>
              ) : (
                <span className="muted">
                  {passed} of {n}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function arenaLanes(runs: DryTrial[], entrants: Ship[], step: number, winners: string[]): ArenaLane[] {
  const progress = Math.min(1, step / REVEAL_BEATS);
  return runs.map((r, i) => {
    const ship = entrants.find((s) => s.id === r.ship);
    const buoys = r.events.filter((e) => e.kind !== 'finish').map(buoyKind);
    return { ship: r.ship, hull: displayHull(ship?.hull, r.ship), color: LANE_HEX[i % LANE_HEX.length], buoys, reach: r.score.total / 100, progress, winner: winners.includes(r.ship) };
  });
}

/* ---------------------------------------------------------------------------------------- results */

/**
 * What a dry run can and cannot say about ships that differ only in tuning (re-review 3, new-f): it
 * cannot say which tuning works better, but it does hold a tier to the pre-flight rules, so a twin that
 * fails one is named with the check; any other gap is the tier's cost. `detailOnly` keeps just the
 * pre-flight sentence (a race of twins only, whose head already says the rest).
 */
function twinsSentences(twins: string[][], runs: DryTrial[], names: Map<string, string>, detailOnly = false): string[] {
  const pf = new Map(runs.map((r) => [r.ship, r.score.criteria.preflight]));
  const name = (id: string) => names.get(id) ?? id;
  const out: string[] = [];
  for (const g of twins) {
    const best = Math.max(...g.map((id) => pf.get(id)?.points ?? 0));
    const lower = g.filter((id) => (pf.get(id)?.points ?? 0) < best);
    const tier = lower.length
      ? `The dry run does hold a tier to the pre-flight rules: ${lower.map((id) => `${name(id)} fails “${failingChecks(pf.get(id)?.why ?? '').join('” and “')}”`).join('; ')}. Any other gap is the tier’s cost.`
      : 'Any gap between them is the tier’s cost.';
    if (detailOnly) {
      if (lower.length) out.push(tier);
    } else out.push(`${g.map(name).join(' and ')} differ only in tuning: the dry run cannot say which tuning works better. ${tier} Run them live to compare.`);
  }
  return out;
}

function TwinsNote({ twins, runs, names, testId, detailOnly }: { twins: string[][]; runs: DryTrial[]; names: Map<string, string>; testId: string; detailOnly?: boolean }) {
  const lines = twinsSentences(twins, runs, names, detailOnly);
  if (!lines.length) return null;
  return (
    <p className="muted prose-sm" data-testid={testId}>
      {lines.join(' ')}
    </p>
  );
}

function Results({ runs, names, brief, entrants, tuningOnly, twinTie, twins, allTwins }: { runs: DryTrial[]; names: Map<string, string>; brief: Brief; entrants: Ship[]; tuningOnly: boolean; twinTie: boolean; twins: string[][]; allTwins: string[][] }) {
  const noWinner = tuningOnly || twinTie;
  const cmp = useMemo(() => compare(runs.map((r) => ({ ship: r.ship, total: r.score.total, criteria: r.score.criteria }))), [runs]);
  const winners = cmp.winners.map((w) => names.get(w) ?? w);
  return (
    <section className="rg-results stack" data-testid="rg-results" aria-labelledby="rg-results-h">
      <div className="rg-results-head">
        <h2 id="rg-results-h" className="section-title">
          Results · {brief.title}
        </h2>
        <TruthLabel truth="Simulated" detail="a dry run of each ship's plan, not a live run" />
      </div>
      <p className="rg-winner" data-testid="rg-winner" data-tie={winners.length > 1 || undefined}>
        {tuningOnly ? (
          <>
            No winner: these ships differ only in a model tier or an addendum. A dry run sees a tier only through its cost and the pre-flight rules and cannot read an addendum, so only a live run can say which tuning works better.
          </>
        ) : twinTie ? (
          <>
            No winner: {winners.join(' and ')} tie at <strong className="num">{fmt(cmp.topTotal)}</strong>, and they differ only in tuning, which a dry run cannot judge.
          </>
        ) : winners.length > 1 ? (
          <>
            A tie at <strong className="num">{fmt(cmp.topTotal)}</strong>: {winners.join(' and ')} share first place.
          </>
        ) : (
          <>
            <strong>{winners[0]}</strong> wins the dry run with <strong className="num">{fmt(cmp.topTotal)}</strong> of 100.
          </>
        )}
      </p>
      {twins.length > 0 && <TwinsNote twins={twins} runs={runs} names={names} testId="rg-twins" />}
      {tuningOnly && <TwinsNote twins={allTwins} runs={runs} names={names} testId="rg-twins" detailOnly />}
      <div className="rg-table-wrap" tabIndex={0} role="region" aria-label="Score by criterion">
        <table className="rg-table" data-testid="rg-table">
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              {runs.map((r) => (
                <th key={r.ship} scope="col">
                  {names.get(r.ship)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  {c.label} <span className="muted">/ {c.max}</span>
                </th>
                {runs.map((r) => {
                  const cell = r.score.criteria[c.id];
                  const best = cmp.best[c.id].ships.includes(r.ship) && runs.length > 1;
                  return (
                    <td key={r.ship} data-best={best || undefined}>
                      <span className="num">{fmt(cell.points)}</span>
                      {best && <span className="rg-best">{cmp.best[c.id].ships.length > 1 ? 'Best, tied' : 'Best'}</span>}
                      <span className="rg-why">{cell.why}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="rg-total">
              <th scope="row">Total / 100</th>
              {runs.map((r) => (
                <td key={r.ship} data-best={(!noWinner && cmp.winners.includes(r.ship)) || undefined}>
                  <span className="num">{fmt(r.score.total)}</span>
                  {!noWinner && cmp.winners.includes(r.ship) && <span className="rg-best">{cmp.winners.length > 1 ? 'First, tied' : 'First'}</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="rg-lost">
        {runs.map((r) => {
          const lost = [...r.missing.needs.map((n) => `need ${n}`), ...r.missing.artifacts.map((a) => `artifact ${a}`), ...r.missing.gates.map((g) => `gate ${g}`)];
          return (
            <li key={r.ship}>
              <strong>{names.get(r.ship)}:</strong> {lost.length ? `missing ${lost.join(', ')}.` : 'covers everything the brief asks for.'}{' '}
              <Link to={`/ship/${r.ship}/bridge`}>Tune its crew</Link> · <Link to={`/ship/${r.ship}/voyage`}>Edit its voyage</Link>
              {LIVE_AVAILABLE && (() => {
                const ship = entrants.find((x) => x.id === r.ship);
                return ship ? (
                  <>
                    {' · '}
                    <LiveTrialButton ship={ship} brief={brief} />
                  </>
                ) : null;
              })()}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------------------------ leaderboard */

function RatingCell({ value, n, last }: { value: number | null; n: number; last: string | null }) {
  if (value === null) return <span className="muted">No live run yet</span>;
  return (
    <>
      <span className="num">{fmt(value)}</span> <TruthLabel truth="Verified" detail={`mean of ${n} live run${n === 1 ? '' : 's'}, last ${last ? shortDate(last) : ''}`} />
    </>
  );
}

/** One trial record. Records live outside the ship store, so delete asks once instead of offering undo. */
function RecordRow({ r, name, stale }: { r: TrialRecord; name: string; stale: boolean }) {
  const [armed, setArmed] = useState(false);
  return (
    <li data-testid="rg-record" data-stale={stale || undefined}>
      <span className="num">{fmt(r.total)}</span> <TruthLabel truth={r.truth} /> {name} · {BRIEFS.find((b) => b.id === r.brief)?.title ?? r.brief} · {shortDate(r.at)}
      {stale && <span className="rg-stale"> · stale: the ship or the library changed since, so it does not count</span>}
      {armed ? (
        <span className="rg-confirm">
          {' '}
          Delete this record?{' '}
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => trials.remove(r.id)}>
            Delete
          </button>{' '}
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setArmed(false)}>
            Keep
          </button>
        </span>
      ) : (
        <button type="button" className="btn btn-text btn-sm" onClick={() => setArmed(true)}>
          Delete
        </button>
      )}
    </li>
  );
}

function Board({ records, current, entrants }: { records: TrialRecord[]; current: Current; entrants: Ship[] }) {
  const [scope, setScope] = useState('overall');
  const name = useId();
  const names = useMemo(() => new Map(entrants.map((s) => [s.id, s.name])), [entrants]);
  const briefIds = BRIEFS.map((b) => b.id);
  const rows = scope === 'overall' ? null : leaderboard(records, scope, current);
  const all = scope === 'overall' ? overall(records, briefIds, current) : null;
  const anyVerified = records.some((r) => r.truth === 'Verified');
  const mine = records.filter((r) => scope === 'overall' || r.brief === scope).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="stack" data-testid="rg-board">
      <div className="choice-row" role="radiogroup" aria-label="Which board">
        {[{ id: 'overall', title: 'Overall' }, ...BRIEFS.map((b) => ({ id: b.id, title: b.title }))].map((o) => (
          <label key={o.id} className="choice">
            <input type="radio" name={name} checked={scope === o.id} onChange={() => setScope(o.id)} data-testid={`rg-board-${o.id}`} /> {o.title}
          </label>
        ))}
      </div>
      {!anyVerified && (
        <p className="rg-empty" data-testid="rg-board-empty">
          No ratings yet. Places come only from live, Verified trials, which run on the dev server. Dry results are shown in their own column and never rank a ship.
        </p>
      )}
      <div className="rg-table-wrap" tabIndex={0} role="region" aria-label="Leaderboard">
        <table className="rg-table rg-board-table">
          <thead>
            <tr>
              <th scope="col">Place</th>
              <th scope="col">Ship</th>
              <th scope="col">{scope === 'overall' ? 'Rating across briefs' : 'Rating'}</th>
              {scope === 'overall' ? <th scope="col">Briefs rated</th> : <th scope="col">Latest dry run</th>}
              {scope !== 'overall' && <th scope="col">Stale records</th>}
            </tr>
          </thead>
          <tbody>
            {all?.map((r) => (
              <tr key={r.ship} data-testid="rg-board-row" data-place={r.place ?? 'none'}>
                <td>{r.place ?? <span className="muted">unranked</span>}</td>
                <td>{names.get(r.ship) ?? r.shipName}</td>
                <td>{r.value === null ? <span className="muted">No live run yet</span> : <><span className="num">{fmt(r.value)}</span> <TruthLabel truth="Verified" detail={`mean over ${r.briefs} brief${r.briefs === 1 ? '' : 's'}`} /></>}</td>
                <td className="num">
                  {r.briefs} of {briefIds.length}
                </td>
              </tr>
            ))}
            {rows?.map((r) => (
              <tr key={r.ship} data-testid="rg-board-row" data-place={r.place ?? 'none'}>
                <td>{r.place ?? <span className="muted">unranked</span>}</td>
                <td>{names.get(r.ship) ?? r.shipName}</td>
                <td>
                  <RatingCell value={r.rating.value} n={r.rating.n} last={r.rating.last} />
                </td>
                <td>{r.rating.simulated === null ? <span className="muted">none</span> : <><span className="num">{fmt(r.rating.simulated)}</span> <TruthLabel truth="Simulated" /></>}</td>
                <td className="num">{r.rating.stale}</td>
              </tr>
            ))}
            {(all?.length ?? rows?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No trial on this board yet. Start a regatta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {mine.length > 0 && (
        <details className="rg-records">
          <summary className="btn btn-quiet btn-sm">Trial records · {mine.length}</summary>
          <ul className="rg-record-list">
            {mine.slice(0, 60).map((r) => (
              <RecordRow key={r.id} r={r} name={names.get(r.ship) ?? r.shipName} stale={r.kbHash !== current.kbHash || current.shipHash.get(r.ship) !== r.shipHash} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- page */

export default function RegattaPage() {
  const idx = useKb();
  const reduced = useReducedMotion();
  const entrants = useEntrants();
  const current = useCurrent(entrants);
  const records = useTrials();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'board' ? 'board' : 'race');
  const [brief, setBrief] = useState(() => BRIEFS.find((b) => b.id === params.get('brief'))?.id ?? BRIEFS[0]?.id ?? '');
  const [chosen, setChosen] = useState<string[]>(() => (params.get('ships') ?? '').split(',').filter((id) => entrants.some((s) => s.id === id)).slice(0, MAX_SHIPS));
  const [race, setRace] = useState<{ runs: DryTrial[]; brief: Brief } | null>(null);
  const [beat, setStep] = useState(0);
  const [arenaLost, setArenaLost] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const names = useMemo(() => new Map(entrants.map((s) => [s.id, s.name])), [entrants]);
  // the reveal: the same beats for every lane; reduced motion shows the finish at once. Nothing here is random.
  const step = reduced ? REVEAL_BEATS : beat;
  const finished = race !== null && step >= REVEAL_BEATS;
  const cmp = useMemo(() => (race ? compare(race.runs.map((r) => ({ ship: r.ship, total: r.score.total, criteria: r.score.criteria }))) : null), [race]);
  const winners = cmp?.winners ?? [];
  const raced = useMemo(() => (race ? race.runs.map((r) => entrants.find((s) => s.id === r.ship)).filter((s): s is Ship => !!s) : []), [race, entrants]);
  const tuningOnly = useMemo(() => onlyTuningDiffers(raced), [raced]);
  const allTwins = useMemo(() => tuningTwins(raced), [raced]);
  const twins = tuningOnly ? [] : allTwins;
  // twins that tie at the top have not been told apart either: no winner then (re-review 2, new-b)
  const twinTie = !tuningOnly && winners.length > 1 && twins.some((g) => winners.every((w) => g.includes(w)));
  // a race with no judgeable winner shows none anywhere: not in the copy, the 2D course or the arena (re-review v2, N1)
  const noWinner = tuningOnly || twinTie;
  const shownWinners = noWinner ? [] : winners;

  useEffect(() => {
    if (!race || finished) return;
    const next = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(next);
  }, [race, beat, finished]);

  // the result is announced where the race is, in the head row above the arena (finish review v2, M5)
  useEffect(() => {
    if (finished) headRef.current?.focus({ preventScroll: true });
  }, [finished]);

  const start = () => {
    const b = BRIEFS.find((x) => x.id === brief);
    if (!b || chosen.length < MIN_SHIPS) return;
    const ships = chosen.map((id) => entrants.find((s) => s.id === id)).filter((s): s is Ship => !!s);
    const runs = ships.map((s) => simulate(s, b, idx));
    // a dry result is the same every time for the same ship, brief and library: keep only the latest
    const at = new Date().toISOString();
    const fresh = runs.map((r) => recordFromDry(r, names.get(r.ship) ?? r.ship, at, recordId(r.ship, r.brief)));
    for (const old of trials.all()) if (old.source === 'dry' && fresh.some((f) => f.ship === old.ship && f.brief === old.brief && f.shipHash === old.shipHash && f.kbHash === old.kbHash)) trials.remove(old.id);
    trials.add(fresh);
    setStep(0);
    setRace({ runs, brief: b });
  };

  // the arena is a picture of the course; without WebGL, with ?2d or under reduced motion the course alone is the board
  const show3d = !reduced && !arenaLost && hasWebGL() && !force2d();
  const canStart = !!brief && chosen.length >= MIN_SHIPS && chosen.length <= MAX_SHIPS;
  return (
    <main id="main" className="page regatta" data-testid="regatta">
      <header>
        <h1 className="page-title">Regatta</h1>
        <p className="lede">Sail ships against the same brief and compare them, criterion by criterion. A dry run simulates each ship&rsquo;s plan; places on the leaderboard come only from live, Verified runs.</p>
      </header>
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="tabs rg-tabs" aria-label="Regatta sections">
          <Tabs.Trigger className="tab" value="race" data-testid="rg-tab-race">
            Race
          </Tabs.Trigger>
          <Tabs.Trigger className="tab" value="board" data-testid="rg-tab-board">
            Leaderboard
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="race" className="stack">
          {!race ? (
            <>
              <BriefPicker value={brief} onChange={setBrief} />
              <ShipPicker entrants={entrants} value={chosen} onChange={setChosen} />
              <div className="row rg-start">
                <button type="button" className="btn btn-primary" disabled={!canStart} onClick={start} data-testid="rg-start">
                  Start the dry run
                </button>
                <span className="muted">{canStart ? `${chosen.length} ships, one brief, scored out of 100.` : `Choose a brief and ${MIN_SHIPS} to ${MAX_SHIPS} ships.`}</span>
              </div>
            </>
          ) : (
            <>
              <div className="row rg-race-head">
                <div className="stack-sm">
                  <p className="label">
                    {race.brief.title} · {race.runs.length} ships <TruthLabel truth="Simulated" />
                  </p>
                  {finished && cmp && (
                    <p ref={headRef} tabIndex={-1} className="rg-head-winner" data-testid="rg-head-winner" data-tuning-only={tuningOnly || undefined} data-no-winner={noWinner || undefined}>
                      {tuningOnly ? (
                        <>These ships differ only in tuning. A dry run sees a tier only through its cost and the pre-flight rules and cannot read an addendum, so it cannot say which tuning works better. Run them live to compare.</>
                      ) : twinTie ? (
                        <>
                          No winner: {winners.map((w) => names.get(w) ?? w).join(' and ')} tie at <strong className="num">{fmt(cmp.topTotal)}</strong>, and they differ only in tuning, which a dry run cannot judge.
                        </>
                      ) : winners.length > 1 ? (
                        <>
                          A tie at <strong className="num">{fmt(cmp.topTotal)}</strong>: {winners.map((w) => names.get(w) ?? w).join(' and ')}.
                        </>
                      ) : (
                        <>
                          <strong>{names.get(winners[0]) ?? winners[0]}</strong> wins with <strong className="num">{fmt(cmp.topTotal)}</strong> of 100.
                        </>
                      )}{' '}
                      <button type="button" className="btn btn-text btn-sm" onClick={() => resultsRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })} data-testid="rg-to-results">
                        Compare criterion by criterion
                      </button>
                    </p>
                  )}
                  {finished && twins.length > 0 && <TwinsNote twins={twins} runs={race.runs} names={names} testId="rg-head-twins" />}
                  {finished && tuningOnly && <TwinsNote twins={allTwins} runs={race.runs} names={names} testId="rg-head-twins" detailOnly />}
                </div>
                <div className="row" style={{ gap: 'var(--s2)' }}>
                  {!finished && (
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => setStep(REVEAL_BEATS)} data-testid="rg-skip">
                      Show the results now
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm"
                    onClick={() => {
                      setRace(null);
                      setStep(0);
                    }}
                    data-testid="rg-new"
                  >
                    New regatta
                  </button>
                </div>
              </div>
              {show3d && (
                <Suspense fallback={<div className="rg-arena rg-arena-loading" aria-hidden="true" />}>
                  <Arena lanes={arenaLanes(race.runs, entrants, step, shownWinners)} onContextLost={() => setArenaLost(true)} />
                </Suspense>
              )}
              <Course runs={race.runs} names={names} step={step} winners={shownWinners} />
              <p className="rg-legend muted">
                The course is 100 points long: each ship sails as far as its score. <span className="rg-key" data-kind="scores" /> stage that meets a need or makes a required artifact · <span className="rg-key" data-kind="plain" /> other stage · <span className="rg-key" data-kind="gate-req" /> gate the brief requires
              </p>
              {finished && (
                <div ref={resultsRef} tabIndex={-1} className="rg-results-focus">
                  <Results runs={race.runs} names={names} brief={race.brief} entrants={entrants} tuningOnly={tuningOnly} twinTie={twinTie} twins={twins} allTwins={allTwins} />
                  <p className="muted sheet-line">
                    Saved as dry trial records.{' '}
                    <button type="button" className="btn btn-text btn-sm" onClick={() => setTab('board')}>
                      See the leaderboard
                    </button>
                  </p>
                </div>
              )}
            </>
          )}
        </Tabs.Content>
        <Tabs.Content value="board">
          <Board records={records} current={current} entrants={entrants} />
        </Tabs.Content>
      </Tabs.Root>
    </main>
  );
}
