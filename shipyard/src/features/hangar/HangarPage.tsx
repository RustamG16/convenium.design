// `#/` — the hangar, v3 Space Regatta Arcade (plan/13-build-plan-v3.md § Hangar; reference
// plan/concepts-v3/space/hangar-space-arcade.png). A hero over the orbital dock with the fleet on
// numbered launch pads, the shipyard ticker, the Fleet row of cards (every library ship, then the
// drydock), and the footer: the focused ship's hull integrity and Commission a ship. Every number
// on screen is the real one, from pre-flight and the knowledge base.
import * as Popover from '@radix-ui/react-popover';
import '../../styles/hangar.css';
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { CountUp } from '../../components/HullRing';
import { TruthLabel } from '../../components/TruthLabel';
import { preflight, type PreflightReport } from '../../domain/preflight';
import { displayHull, type Ship } from '../../domain/schema';
import { isLibraryShip, LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { skillCount } from '../../kb/artifacts';
import { useKb } from '../../kb/context';
import { arcadeMedia, shipArt } from '../../lib/arcadeArt';
import { useDispatch, useStoreState } from '../../store/context';
import { useNotify } from '../shared/notices';
import { CommissionDialog } from './CommissionDialog';

const stagesOf = (s: Ship) => s.voyage.filter((v) => v.kind === 'stage').length;
const gatesOf = (s: Ship) => s.voyage.filter((v) => v.kind === 'gate').length;

/** READY, or the count of checks that pass: the card's status bar. */
function statusOf(report: PreflightReport): { kind: 'ready' | 'warn' | 'block' | 'empty'; text: string } {
  if (report.applicable === 0) return { kind: 'empty', text: 'No crew yet' };
  if (!report.next) return { kind: 'ready', text: 'Ready' };
  return { kind: report.blockers > 0 ? 'block' : 'warn', text: `${report.passed} of ${report.applicable} checks pass` };
}

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const I_LOCK = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z';
const I_CHECK = 'M5 12.5l4.5 4.5L19 7.5';
const I_CREW = 'M12 4a4 4 0 0 1 4 4v1H8V8a4 4 0 0 1 4-4zM5 13h14l-2 6H7zM3 10h18';
const I_FLAG = 'M5 21V4m0 0h12l-2 4 2 4H5';
const I_CROWN = 'M3 8l4 4 5-7 5 7 4-4-2 11H5z';

/** The laurel badge: the focused ship's hull integrity, the number pre-flight computes. */
function LaurelScore({ report }: { report: PreflightReport }) {
  const label = `Hull integrity ${report.integrity} percent, ${report.passed} of ${report.applicable} checks passed${report.blockers > 0 ? `, ${report.blockers} ${report.blockers === 1 ? 'blocker' : 'blockers'} cap it at 99` : ''}`;
  return (
    <div className="hg-laurel" data-testid="hull-ring" role="img" aria-label={label}>
      <img src={arcadeMedia('laurel.webp')} alt="" width="96" height="95" />
      <CountUp className="hg-laurel-num" value={report.integrity} />
    </div>
  );
}

function FleetCard({ ship, report, flagship, focused, onFocusShip }: { ship: Ship; report: PreflightReport; flagship: boolean; focused: boolean; onFocusShip: (id: string) => void }) {
  const dispatch = useDispatch();
  const notify = useNotify();
  const library = isLibraryShip(ship);
  const art = shipArt(ship, displayHull(ship.hull, ship.id));
  const status = statusOf(report);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(ship.name);
  const resettable = !library && (ship.origin?.kind === 'clone' || ship.origin?.kind === 'blank') && (ship.origin?.workflow || ship.origin?.kind === 'blank');
  return (
    <article
      className="ship-card hg-card"
      data-testid="ship-card"
      data-ship={ship.id}
      data-focused={focused || undefined}
      data-flagship={flagship || undefined}
      aria-labelledby={`ship-${ship.id}`}
      style={{ ['--tint' as string]: art.tint } as CSSProperties}
      onMouseEnter={() => onFocusShip(ship.id)}
      onFocusCapture={() => onFocusShip(ship.id)}
    >
      {flagship && (
        <span className="hg-flag-tab" aria-hidden="true">
          <Icon d={I_CROWN} size={14} /> Flagship
        </span>
      )}
      <div className="hg-card-art" aria-hidden="true">
        <img src={art.src} alt="" loading="lazy" />
      </div>
      <h3 id={`ship-${ship.id}`} className="hg-card-name">
        <Link to={`/ship/${ship.id}`} data-testid="open-ship" aria-label={`Open the ship: ${ship.name}`}>
          {ship.name}
        </Link>
      </h3>
      {library ? (
        <p className="hg-card-lock" data-testid="template-lock">
          <Icon d={I_LOCK} size={13} /> <span className="hg-lock-hot">Commissioned</span> · Template
        </p>
      ) : (
        <p className="hg-card-lock" data-testid="drydock-label">
          Drydock · yours{ship.origin?.from ? ` · from ${ship.origin.from}` : ''}
        </p>
      )}
      <dl className="hg-card-stats">
        <div>
          <dt>
            <Icon d={I_CREW} size={18} /> Crew
          </dt>
          <dd data-testid="card-crew">{ship.crew.length}</dd>
        </div>
        <div>
          <dt>
            <Icon d={I_FLAG} size={18} /> Stages
          </dt>
          <dd>{stagesOf(ship)}</dd>
        </div>
      </dl>
      <Link className="hg-status" data-kind={status.kind} to={`/ship/${ship.id}/preflight`} data-testid="open-preflight" aria-label={`${status.text}. Pre-flight and export ${ship.name}`}>
        {status.kind === 'ready' ? (
          <span className="hg-status-tick">
            <Icon d={I_CHECK} size={15} />
          </span>
        ) : (
          <Icon d={I_CHECK} size={17} />
        )}
        {status.text}
      </Link>
      {!library &&
        (renaming ? (
          <form
            className="hg-rename"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              dispatch({ type: 'ship/rename', id: ship.id, name: draft });
              notify(`Renamed to ${draft.trim()}.`, { undo: true });
              setRenaming(false);
            }}
          >
            <input className="field" value={draft} maxLength={48} onChange={(e) => setDraft(e.target.value)} aria-label={`New name for ${ship.name}`} data-testid="rename-input" autoFocus />
            <button type="submit" className="btn btn-quiet btn-sm" data-testid="rename-save">
              Save
            </button>
            <button type="button" className="btn btn-text btn-sm" onClick={() => setRenaming(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <div className="hg-manage">
            <Link className="btn btn-text btn-sm" to={`/ship/${ship.id}/voyage`} data-testid="open-voyage">
              Voyage
            </Link>
            <button type="button" className="btn btn-text btn-sm" onClick={() => { setDraft(ship.name); setRenaming(true); }} data-testid="rename">
              Rename
            </button>
            {resettable && (
              <button type="button" className="btn btn-text btn-sm" data-testid="reset-ship" onClick={() => { dispatch({ type: 'ship/restoreDefault', id: ship.id }); notify(`${ship.name} reset to its template.`, { undo: true }); }}>
                Reset
              </button>
            )}
            <button type="button" className="btn btn-text btn-sm" data-testid="delete-ship" onClick={() => { dispatch({ type: 'ship/delete', id: ship.id }); notify(`${ship.name} deleted.`, { undo: true }); }}>
              Delete
            </button>
          </div>
        ))}
    </article>
  );
}

/** Pad positions across the hero, read off the reference (percent of the hero box). */
const PADS = [
  { x: 34, y: 91, w: 30 },
  { x: 54, y: 76, w: 13.5 },
  { x: 67, y: 71, w: 11.5 },
  { x: 78, y: 67, w: 10 },
  { x: 87.5, y: 64, w: 9 },
];

function LaunchPads({ fleet }: { fleet: Ship[] }) {
  return (
    <div className="hg-pads" aria-hidden="true">
      <div className="hg-deck" />
      {fleet.slice(0, PADS.length).map((s, i) => {
        const p = PADS[i];
        const art = shipArt(s, displayHull(s.hull, s.id));
        return (
          <div key={s.id} className="hg-pad" data-lead={i === 0 || undefined} style={{ ['--x' as string]: `${p.x}%`, ['--y' as string]: `${p.y}%`, ['--w' as string]: `${p.w}%`, ['--tint' as string]: art.tint } as CSSProperties}>
            <span className="hg-pad-ring" />
            <span className="hg-pad-num">{String(i + 1).padStart(2, '0')}</span>
            <img className="hg-pad-ship" src={art.src} alt="" />
          </div>
        );
      })}
    </div>
  );
}

export function HangarPage() {
  const idx = useKb();
  const { kb } = idx;
  const { ships, logbook } = useStoreState();
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH), [idx]);
  const flagship = library.ships.find((s) => s.id === kb.workflows.default);
  const skills = skillCount(kb);
  const [dialog, setDialog] = useState<null | { mode: 'clone' | 'blank' | 'import' }>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const row = useRef<HTMLDivElement>(null);
  // the reference fleet: the flagship first, the other library ships, then the drydock
  const fleet = useMemo(() => [...(flagship ? [flagship] : []), ...library.ships.filter((s) => s !== flagship), ...ships], [flagship, library.ships, ships]);
  const reports = useMemo(() => new Map(fleet.map((s) => [s.id, preflight(idx, s)])), [fleet, idx]);
  const focus = fleet.find((s) => s.id === focusId) ?? fleet[0];
  const focusReport = focus ? reports.get(focus.id)! : null;
  const lastExport = focus ? [...(logbook[focus.id] ?? [])].reverse().find((e) => e.kind === 'export') : undefined;
  const ticker = useMemo(() => {
    const lines = library.ships.map((s) => {
      const r = reports.get(s.id)!;
      return `${s.name}: ${r.next ? `${r.passed} of ${r.applicable} checks pass` : 'ready to export'}`;
    });
    lines.splice(1, 0, `${skills} skills in the Armory`);
    lines.splice(3, 0, 'Regatta: race ships against a brief');
    if (import.meta.env.DEV) lines.push('Forge: make and change agents and skills');
    return lines;
  }, [library.ships, reports, skills]);
  const scrollRow = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.hg-card');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 260) + 16), behavior: 'smooth' });
  };

  return (
    <main id="main" className="page ar-full hangar">
      <section className="hg-hero" style={{ ['--plate' as string]: `url(${arcadeMedia('plate-dock.webp')})` } as CSSProperties}>
        <LaunchPads fleet={fleet} />
        <Link className="hg-sign" to="/regatta" data-testid="hg-sign">
          <span className="hg-sign-laurel" aria-hidden="true" />
          Regatta Arcade
        </Link>
        <div className="ar-band hg-hero-copy">
          <h1 className="ar-wordmark hg-wordmark">
            Shipyard
            <span className="hg-flagmark" aria-hidden="true" />
          </h1>
          <p className="hg-lede ar-caps">Fit out a ship, choose its crew, hang the skills on their bodies, and export the plan a session runs.</p>
          <Popover.Root>
            <Popover.Trigger className="pill hg-how" data-testid="how-it-works">
              How it works
              <svg className="hg-how-chev" width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
                <path d="M2 1l6 6-6 6" fill="none" stroke="#ff3b3f" strokeWidth="2.4" />
              </svg>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="popover" sideOffset={8} align="start">
                <ol>
                  <li>A ship is a workflow. Its crew are the agents; a crew member&rsquo;s artifacts are the skills they may be handed.</li>
                  <li>Equip skills, plan the voyage, and watch pre-flight say what would break.</li>
                  <li>Export a ship that passes pre-flight and paste its plan into a session.</li>
                </ol>
                <p className="promise">Nothing here runs an agent; it writes the plan a session runs.</p>
                <Popover.Arrow className="popover-arrow" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </section>

      <div className="hg-ticker" data-testid="hg-ticker">
        <span className="hg-ticker-tag">
          Shipyard ticker <span aria-hidden="true">»</span>
        </span>
        <div className="hg-ticker-window">
          <ul className="hg-ticker-track ar-ticker-track">
            {[...ticker, ...ticker].map((t, i) => (
              <li key={i} aria-hidden={i >= ticker.length || undefined}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section aria-labelledby="fleet-h" className="ar-band hg-fleet">
        <div className="hg-fleet-side">
          <h2 id="fleet-h" className="ar-wordmark hg-fleet-h">
            Fleet
          </h2>
          <span className="ar-tag" data-testid="fleet-count">
            {fleet.length} ship{fleet.length === 1 ? '' : 's'}
          </span>
        </div>
        <button type="button" className="hg-arrow" onClick={() => scrollRow(-1)} aria-label="Previous ships">
          <Icon d="M15 5l-7 7 7 7" size={22} />
        </button>
        <div className="hg-row" ref={row} data-testid="fleet-row">
          {fleet.map((s) => (
            <FleetCard key={s.id} ship={s} report={reports.get(s.id)!} flagship={s === flagship} focused={focus?.id === s.id} onFocusShip={setFocusId} />
          ))}
        </div>
        <button type="button" className="hg-arrow" onClick={() => scrollRow(1)} aria-label="More ships">
          <Icon d="M9 5l7 7-7 7" size={22} />
        </button>
      </section>

      {focus && focusReport && (
        <section className="ar-band hg-foot" aria-label={`${focus.name} at a glance`} data-testid="hg-foot">
          <LaurelScore report={focusReport} />
          <p className="hg-foot-text">
            Hull integrity {focusReport.passed} of {focusReport.applicable} checks <TruthLabel truth="Verified" />
            <br />
            {focusReport.next ? `Next: ${focusReport.next.id} ${focusReport.next.reason}` : 'Pre-flight is clean. Ready to export.'}
          </p>
          <span className="hg-foot-rule" aria-hidden="true" />
          <p className="hg-foot-text">
            {focus.crew.length} crew · {stagesOf(focus)} stages · {gatesOf(focus)} gates · {lastExport ? `last export ${lastExport.at.slice(0, 10)}` : 'not exported yet'}
            <br />
            <TruthLabel truth="Verified" detail="counted from the ship" />
          </p>
          <button type="button" className="btn btn-primary ar-cta hg-commission" onClick={() => setDialog({ mode: 'blank' })} data-testid="commission">
            Commission a ship<span className="ar-cta-arrows" aria-hidden="true">»</span>
          </button>
        </section>
      )}

      <section aria-labelledby="drydock-h" className="ar-band drydock">
        <h2 id="drydock-h" className="ar-head">
          Drydock
        </h2>
        {ships.length === 0 ? (
          <div className="empty" data-testid="drydock-empty">
            <p className="prose">Your drydock is empty. Clone SS Full Run to start.</p>
            <button type="button" className="btn btn-quiet btn-next" onClick={() => setDialog({ mode: 'clone' })} data-testid="clone-default">
              Next step: Clone SS Full Run
            </button>
          </div>
        ) : (
          <p className="prose muted" data-testid="drydock-note">
            {ships.length} ship{ships.length === 1 ? '' : 's'} of yours sail in the fleet row, after the library templates.
          </p>
        )}
      </section>

      {library.unconverted.length > 0 && (
        <section aria-labelledby="blocks-h" className="ar-band blocks" data-testid="on-the-blocks">
          <h2 id="blocks-h" className="ar-head">
            On the blocks
          </h2>
          <p className="prose muted">Library workflows that cannot become a ship yet. Nothing is hidden: fix the problems below in the library and the hull launches on the next rebuild.</p>
          <ul className="blocks-grid">
            {library.unconverted.map((u) => {
              const wf = idx.workflow.get(u.workflow);
              return (
                <li key={u.workflow} className="card blocks-card" data-testid="blocks-card" data-workflow={u.workflow}>
                  <h3 className="card-title">{wf?.name ?? u.workflow}</h3>
                  <p className="stat">
                    {u.problems.length} problem{u.problems.length === 1 ? '' : 's'} <TruthLabel truth="Verified" detail="checked against the knowledge base" />
                  </p>
                  <ul className="blocks-problems">
                    {u.problems.slice(0, 6).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                    {u.problems.length > 6 && <li className="muted">and {u.problems.length - 6} more</li>}
                  </ul>
                  <p className="stat muted">
                    Fix in <code>library/registry/workflows.json</code>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="ar-band stat footer-line" data-testid="library-count">
        <span data-testid="skill-count">{skills}</span> skills in the library <TruthLabel truth="Verified" />
      </p>
      {dialog && <CommissionDialog initialMode={dialog.mode} initialSource={kb.workflows.default} onClose={() => setDialog(null)} />}
    </main>
  );
}
