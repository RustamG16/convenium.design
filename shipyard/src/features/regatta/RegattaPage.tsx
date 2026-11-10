// `#/regatta` — v2 (owner decision 2026-11-08: full game scoring). Ships sail the same test brief and
// are compared criterion by criterion. A dry run is a deterministic simulation of the ship's plan
// (Simulated); a live run on the dev server executes it (Verified, T23). The ethics gate in the UI:
// - every number carries its truth label;
// - ratings and places come only from fresh Verified trial records; Simulated scores have their own
//   column and never rank anyone;
// - a record whose ship or library changed since is stale: listed, flagged, not counted;
// - ties are ties; nothing here rewards clicks, visits or time.
import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
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
import { arcadeMedia, shipArt } from '../../lib/arcadeArt';
import { useReducedMotion } from '../../lib/preferences';
import { useStoreState } from '../../store/context';
import { LIVE_AVAILABLE, LiveTrialButton } from './LiveTrial';
import { recordId, trials, useTrials } from './records';

const MIN_SHIPS = 2;
const MAX_SHIPS = 4;
/** Every lane is revealed over the same beats (finish review v2, M3); 0.65 s a beat (plan 12 § 2: 0.6–1.2 s). */
const REVEAL_BEATS = 10;
const STEP_MS = 650;
/** v3: a lane wears its ship's paint; two ships in one paint (a copy and its parent) fall back to these, in order */
const LANE_FALLBACK = ['#f4b740', '#45d39a', '#c36bff', '#5aa8ff'];
type LaneArt = Map<string, { src: string; tint: string }>;

/** The paint and render of each entrant, unique per lane (plan 13 § Regatta). */
function laneArt(runs: { ship: string }[], entrants: Ship[]): LaneArt {
  const out: LaneArt = new Map();
  const used = new Set<string>();
  runs.forEach((r, i) => {
    const ship = entrants.find((s) => s.id === r.ship);
    const art = shipArt(ship ?? { id: r.ship }, displayHull(ship?.hull, r.ship));
    const tint = used.has(art.tint) ? (LANE_FALLBACK.find((c) => !used.has(c)) ?? LANE_FALLBACK[i % 4]) : art.tint;
    used.add(tint);
    out.set(r.ship, { src: art.src, tint });
  });
  return out;
}

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
            <label key={s.id} className="choice rg-ship" data-testid="rg-ship" data-ship={s.id} style={{ ['--lane' as string]: shipArt(s, displayHull(s.hull, s.id)).tint } as CSSProperties}>
              <input type="checkbox" checked={on} disabled={!on && value.length >= MAX_SHIPS} onChange={() => toggle(s.id)} />
              <img className="rg-ship-art" src={shipArt(s, displayHull(s.hull, s.id)).src} alt="" />
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
const along = (frac: number) => `calc(100% * ${Math.max(0, Math.min(1, frac))})`;

/** A holo gate ring, drawn edge-on: the buoy of a stage or gate, in the lane's paint. */
function Ring() {
  return (
    <svg className="rg-ring" viewBox="0 0 40 64" aria-hidden="true" focusable="false">
      <ellipse cx="20" cy="32" rx="13" ry="27" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="7 4" />
      <ellipse cx="20" cy="32" rx="8" ry="21" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

/**
 * The course is 100 points long and is the arena (v3: the race is drawn in the DOM over the race
 * circuit plate, no WebGL and no water). Every lane is revealed over the same beats and each ship
 * sails as far as its score, so the order on the course is always the order of the scores; a ship's
 * buoys (its stages and gates) are spread over the stretch it reaches.
 */
function Course({ runs, names, step, winners, art, still }: { runs: DryTrial[]; names: Map<string, string>; step: number; winners: string[]; art: LaneArt; still: boolean }) {
  const progress = Math.min(1, step / REVEAL_BEATS);
  const done = progress >= 1;
  return (
    <div className="rg-arena" data-testid="rg-arena" data-lanes={runs.length} data-winners={done ? winners.length : 0} data-still={still || undefined}>
      <div className="rg-arch" aria-hidden="true">
        <span className="rg-arch-gate" />
        <span className="rg-arch-word">Finish</span>
      </div>
      <ol className="rg-course" data-testid="rg-course" aria-label="The course: 100 points long, one lane per ship, one buoy per stage or gate">
        {runs.map((r, i) => {
          const buoys = r.events.filter((e) => e.kind !== 'finish');
          const n = buoys.length;
          const passed = Math.min(n, Math.floor(progress * n + 1e-9));
          const reach = r.score.total / 100;
          const won = done && winners.includes(r.ship);
          const a = art.get(r.ship);
          return (
            <li key={r.ship} className="rg-lane" data-testid="rg-lane" data-ship={r.ship} data-done={done || undefined} data-winner={won || undefined} style={{ ['--lane' as string]: a?.tint ?? LANE_FALLBACK[i % 4] } as CSSProperties}>
              <span className="rg-lane-tag">
                <span className="rg-lane-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="rg-lane-name">{names.get(r.ship) ?? r.ship}</span>
              </span>
              <div className="rg-track">
                <ol className="rg-buoys" aria-label={`${names.get(r.ship)}: ${n} buoys`}>
                  {buoys.map((e, j) => (
                    <li key={j} className="rg-buoy" data-kind={buoyKind(e)} data-passed={j < passed || undefined} title={buoyLabel(e)} style={{ left: along((reach * (j + 0.5)) / Math.max(1, n)) }}>
                      <Ring />
                      <span className="sr-only">{buoyLabel(e)}</span>
                    </li>
                  ))}
                </ol>
                <span className="rg-boat" style={{ left: along(reach * progress) }} aria-hidden="true">
                  <img className="rg-plume" src={arcadeMedia('thruster.webp')} alt="" />
                  {a && <img className="rg-hull" src={a.src} alt="" />}
                </span>
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
                    <span className="sr-only"> of 100</span>
                  </>
                ) : (
                  <span className="rg-progress">
                    {passed} of {n}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
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

const CRIT_ICON: Record<string, string> = {
  coverage: 'M12 3v3m0 12v3m9-9h-3M6 12H3m15 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0zm-4 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  artifacts: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5M3 16l9 5 9-5',
  gates: 'M4 20V8a8 8 0 0 1 16 0v12M8 20v-9m8 9v-9M4 12h16',
  preflight: 'M5 4h14v16H5zM8.5 12l2.5 2.5 4.5-5',
  economy: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  clarity: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6zm7 12l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
};
const CRIT_TINT = ['#f4b740', '#5fd59c', '#c79fff', '#78b4ff', '#f4b740', '#c79fff'];

function CritIcon({ id }: { id: string }) {
  return (
    <svg className="rg-crit-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={CRIT_ICON[id]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Places by total, ties sharing a place (1, 1, 3). A race with no judgeable winner places no one. */
function standings(runs: DryTrial[], noWinner: boolean): { ship: string; total: number; place: number | null }[] {
  const sorted = [...runs].sort((a, b) => b.score.total - a.score.total);
  return sorted.map((r) => ({ ship: r.ship, total: r.score.total, place: noWinner ? null : 1 + sorted.filter((o) => o.score.total > r.score.total).length }));
}
const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

function Podium({ runs, names, art, noWinner }: { runs: DryTrial[]; names: Map<string, string>; art: LaneArt; noWinner: boolean }) {
  const top = standings(runs, noWinner).slice(0, 3);
  // the reference podium: second, first, third
  const order = top.length >= 2 ? [top[1], top[0], ...top.slice(2)] : top;
  return (
    <div className="rg-standings" data-testid="rg-standings">
      <h3 className="rg-standings-h">
        <span className="rg-laurel" aria-hidden="true" />
        Final standings
        <span className="rg-laurel" data-flip aria-hidden="true" />
      </h3>
      <ol className="rg-podium">
        {order.map((p) => {
          const step = p === top[0] ? 1 : p === top[1] ? 2 : 3;
          const a = art.get(p.ship);
          return (
            <li key={p.ship} className="rg-step" data-step={step} data-place={p.place ?? 'none'} style={{ ['--lane' as string]: a?.tint } as CSSProperties}>
              {a && <img className="rg-step-ship" src={a.src} alt="" />}
              <span className="rg-step-block" aria-hidden={p.place ? undefined : true}>
                <span className="rg-step-place">{p.place ? ordinal(p.place) : '—'}</span>
              </span>
              <span className="rg-step-card">
                <span className="rg-step-name">{names.get(p.ship) ?? p.ship}</span>
                <span className="rg-step-total num">{fmt(p.total)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Results({ runs, names, brief, entrants, tuningOnly, twinTie, twins, allTwins, art }: { runs: DryTrial[]; names: Map<string, string>; brief: Brief; entrants: Ship[]; tuningOnly: boolean; twinTie: boolean; twins: string[][]; allTwins: string[][]; art: LaneArt }) {
  const noWinner = tuningOnly || twinTie;
  const cmp = useMemo(() => compare(runs.map((r) => ({ ship: r.ship, total: r.score.total, criteria: r.score.criteria }))), [runs]);
  const winners = cmp.winners.map((w) => names.get(w) ?? w);
  const lead = (r: DryTrial) => !noWinner && cmp.winners.includes(r.ship);
  return (
    <section className="rg-results" data-testid="rg-results" aria-labelledby="rg-results-h">
      <h2 id="rg-results-h" className="sr-only">
        Results · {brief.title}
      </h2>
      <div className="rg-results-grid">
        <div className="rg-results-side">
          <Podium runs={runs} names={names} art={art} noWinner={noWinner} />
          <p className="rg-winner" data-testid="rg-winner" data-tie={winners.length > 1 || undefined}>
            {tuningOnly ? (
              <>No winner: these ships differ only in a model tier or an addendum. A dry run sees a tier only through its cost and the pre-flight rules and cannot read an addendum, so only a live run can say which tuning works better.</>
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
            )}{' '}
            <TruthLabel truth="Simulated" detail="a dry run of each ship's plan, not a live run" />
          </p>
          {twins.length > 0 && <TwinsNote twins={twins} runs={runs} names={names} testId="rg-twins" />}
          {tuningOnly && <TwinsNote twins={allTwins} runs={runs} names={names} testId="rg-twins" detailOnly />}
        </div>
        <div className="rg-table-wrap" tabIndex={0} role="region" aria-label="Score by criterion">
          <table className="rg-table" data-testid="rg-table">
            <thead>
              <tr>
                <th scope="col" className="rg-table-title">
                  <span className="rg-bars-icon" aria-hidden="true" />
                  Results comparison
                </th>
                {runs.map((r) => {
                  const a = art.get(r.ship);
                  return (
                    <th key={r.ship} scope="col" data-lead={lead(r) || undefined} style={{ ['--lane' as string]: a?.tint } as CSSProperties}>
                      {lead(r) && <span className="rg-pennant" aria-hidden="true" />}
                      {a && <img className="rg-th-ship" src={a.src} alt="" />}
                      <span className="rg-th-name">{names.get(r.ship)}</span>
                      <TruthLabel truth="Simulated" />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c, ci) => (
                <tr key={c.id}>
                  <th scope="row" style={{ ['--bar' as string]: CRIT_TINT[ci], ['--fill' as string]: `${(cmp.best[c.id].points / c.max) * 100}%` } as CSSProperties}>
                    <span className="rg-crit-row">
                      <CritIcon id={c.id} />
                      <span className="rg-crit">{c.label}</span>
                      <span className="rg-crit-max">/ {c.max}</span>
                      <span className="rg-bar" aria-hidden="true" />
                    </span>
                  </th>
                  {runs.map((r) => {
                    const cell = r.score.criteria[c.id];
                    const best = cmp.best[c.id].ships.includes(r.ship) && runs.length > 1;
                    return (
                      <td key={r.ship} data-best={best || undefined} data-lead={lead(r) || undefined} title={cell.why}>
                        <span className="num">{fmt(cell.points)}</span>
                        {best && <span className="rg-best">{cmp.best[c.id].ships.length > 1 ? 'Best, tied' : 'Best'}</span>}
                        <span className="rg-why">{cell.why}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="rg-total">
                <th scope="row">
                  <span className="rg-crit-row">
                    <svg className="rg-crit-icon" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4m10-4h3a3 3 0 0 1-3 4M12 13v4m-4 3h8l-1-3H9z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    </svg>
                    <span className="rg-crit">Total</span>
                    <span className="rg-crit-max">/ 100</span>
                  </span>
                </th>
                {runs.map((r) => (
                  <td key={r.ship} data-best={lead(r) || undefined} data-lead={lead(r) || undefined}>
                    <span className="num">{fmt(r.score.total)}</span>
                    {lead(r) && <span className="rg-best">{cmp.winners.length > 1 ? 'First, tied' : 'First'}</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <ul className="rg-lost">
        {runs.map((r) => {
          const lost = [...r.missing.needs.map((n) => `need ${n}`), ...r.missing.artifacts.map((a) => `artifact ${a}`), ...r.missing.gates.map((g) => `gate ${g}`)];
          return (
            <li key={r.ship}>
              <strong>{names.get(r.ship)}:</strong> {lost.length ? `missing ${lost.join(', ')}.` : 'covers everything the brief asks for.'}{' '}
              <Link to={`/ship/${r.ship}/bridge`}>Tune its crew</Link> · <Link to={`/ship/${r.ship}/voyage`}>Edit its voyage</Link>
              {LIVE_AVAILABLE &&
                (() => {
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

  const canStart = !!brief && chosen.length >= MIN_SHIPS && chosen.length <= MAX_SHIPS;
  const shownBrief = race?.brief ?? BRIEFS.find((b) => b.id === brief);
  const art = useMemo<LaneArt>(() => (race ? laneArt(race.runs, entrants) : new Map()), [race, entrants]);
  return (
    <main id="main" className="page ar-full regatta" data-testid="regatta">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <section className="rg-hero" style={{ ['--plate' as string]: `url(${arcadeMedia('plate-race.webp')})` } as CSSProperties}>
          <div className="ar-band rg-hero-grid">
            <header className="rg-hero-copy">
              <h1 className="ar-wordmark rg-wordmark">
                Regatta
                <span className="ar-checkers" data-red aria-hidden="true" />
              </h1>
              <p className="rg-lede ar-caps">Sail ships against the same brief and compare them, criterion by criterion. A dry run simulates each ship&rsquo;s plan; places on the leaderboard come only from live, Verified runs.</p>
              <Tabs.List className="tabs rg-tabs" aria-label="Regatta sections">
                <Tabs.Trigger className="tab" value="race" data-testid="rg-tab-race">
                  Race
                </Tabs.Trigger>
                <Tabs.Trigger className="tab" value="board" data-testid="rg-tab-board">
                  Leaderboard
                </Tabs.Trigger>
              </Tabs.List>
            </header>
            {shownBrief && (
              <aside className="rg-brief-card" aria-label="The brief" data-testid="rg-brief-card">
                <svg className="rg-brief-icon" width="44" height="52" viewBox="0 0 44 52" aria-hidden="true" focusable="false">
                  <path d="M4 3h24l12 12v34H4z M28 3v12h12 M11 26h22 M11 33h22 M11 40h14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <span className="rg-brief-kicker ar-caps">Brief</span>
                <strong className="rg-brief-name">{shownBrief.title}</strong>
                <span className="rg-brief-sub ar-caps">
                  {race ? race.runs.length : chosen.length} ships · {shownBrief.needs.length} needs · <TruthLabel truth="Simulated" />
                </span>
              </aside>
            )}
          </div>
          {tab === 'race' && race && (
            <div className="ar-band rg-stage">
              <Course runs={race.runs} names={names} step={step} winners={shownWinners} art={art} still={reduced} />
              <div className="rg-banner" data-finished={finished || undefined}>
                {finished && cmp ? (
                  <p ref={headRef} tabIndex={-1} className="rg-head-winner" data-testid="rg-head-winner" data-tuning-only={tuningOnly || undefined} data-no-winner={noWinner || undefined}>
                    <span className="rg-banner-laurel" aria-hidden="true" />
                    <span className="rg-banner-text">
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
                          {names.get(winners[0]) ?? winners[0]} wins with <strong className="num">{fmt(cmp.topTotal)}</strong> of 100.
                        </>
                      )}
                    </span>
                    <button type="button" className="rg-to-results" onClick={() => resultsRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })} data-testid="rg-to-results">
                      Compare criterion by criterion <span aria-hidden="true">›</span>
                    </button>
                  </p>
                ) : (
                  <p className="rg-head-winner rg-racing">
                    <span className="rg-banner-text">Racing: {race.brief.title}</span>
                    <button type="button" className="rg-to-results" onClick={() => setStep(REVEAL_BEATS)} data-testid="rg-skip">
                      Show the results now <span aria-hidden="true">›</span>
                    </button>
                  </p>
                )}
              </div>
              {finished && twins.length > 0 && <TwinsNote twins={twins} runs={race.runs} names={names} testId="rg-head-twins" />}
              {finished && tuningOnly && <TwinsNote twins={allTwins} runs={race.runs} names={names} testId="rg-head-twins" detailOnly />}
            </div>
          )}
        </section>
        <Tabs.Content value="race" className="ar-band rg-body">
          {!race ? (
            <div className="rg-setup">
              <BriefPicker value={brief} onChange={setBrief} />
              <ShipPicker entrants={entrants} value={chosen} onChange={setChosen} />
              <div className="rg-start">
                <button type="button" className="btn btn-primary ar-cta" disabled={!canStart} onClick={start} data-testid="rg-start">
                  Start the dry run<span className="ar-cta-arrows" aria-hidden="true">»</span>
                </button>
                <span className="muted">{canStart ? `${chosen.length} ships, one brief, scored out of 100.` : `Choose a brief and ${MIN_SHIPS} to ${MAX_SHIPS} ships.`}</span>
              </div>
            </div>
          ) : (
            <>
              {finished && (
                <div ref={resultsRef} tabIndex={-1} className="rg-results-focus">
                  <Results runs={race.runs} names={names} brief={race.brief} entrants={entrants} tuningOnly={tuningOnly} twinTie={twinTie} twins={twins} allTwins={allTwins} art={art} />
                </div>
              )}
              <div className="rg-foot">
                <p className="rg-legend muted">
                  The course is 100 points long: each ship sails as far as its score. <span className="rg-key" data-kind="scores" /> stage that meets a need or makes a required artifact · <span className="rg-key" data-kind="plain" /> other stage · <span className="rg-key" data-kind="gate-req" /> gate the brief requires.
                  {finished && (
                    <>
                      {' '}
                      Saved as dry trial records.{' '}
                      <button type="button" className="btn btn-text btn-sm" onClick={() => setTab('board')}>
                        See the leaderboard
                      </button>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  className="btn btn-primary rg-new"
                  onClick={() => {
                    setRace(null);
                    setStep(0);
                  }}
                  data-testid="rg-new"
                >
                  New regatta <span aria-hidden="true">›</span>
                </button>
              </div>
            </>
          )}
        </Tabs.Content>
        <Tabs.Content value="board" className="ar-band rg-body">
          <Board records={records} current={current} entrants={entrants} />
        </Tabs.Content>
      </Tabs.Root>
    </main>
  );
}
