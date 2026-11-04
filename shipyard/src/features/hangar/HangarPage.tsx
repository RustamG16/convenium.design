// `#/` — the hangar (06 section 4.1). Default state is exactly one card: SS Full Run, a commissioned
// library template. The other library workflows live only in the Commission dialog. Custom ships sit
// in the drydock with rename, reset and delete (every one undoable). The fleet ring in 3D shows each
// ship's hull; without WebGL (or `?2d`) the cards carry a hull silhouette instead.
import * as Popover from '@radix-ui/react-popover';
import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { HullRing } from '../../components/HullRing';
import { TruthLabel } from '../../components/TruthLabel';
import { preflight } from '../../domain/preflight';
import type { Ship } from '../../domain/schema';
import { isLibraryShip, LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { skillCount } from '../../kb/artifacts';
import { useKb } from '../../kb/context';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { useDispatch, useStoreState } from '../../store/context';
import { useNotify } from '../shared/notices';
import { CommissionDialog } from './CommissionDialog';

const FleetRing = lazy(() => import('./FleetRing'));

const CLASS_PIGMENT: Record<Ship['class'], string> = { flagship: '#D9A441', abridged: '#86C2A8', retrofit: '#93AEDB', fleet: '#C79FDC', custom: '#E39B95' };

/** One silhouette per hull (ship-a..e): the DOM stand-in for the 3D hull. */
const HULL_PATHS: Record<string, string[]> = {
  'ship-a': ['M6 40 L58 22 L168 18 L226 36 L168 54 L58 52 Z', 'M58 22 L72 8 L118 8 L128 18', 'M58 52 L74 64 L122 64 L136 54'],
  'ship-b': ['M8 36 L70 20 L150 20 L230 36 L150 52 L70 52 Z', 'M96 20 L108 6 L132 6 L140 20'],
  'ship-c': ['M6 36 L40 24 L120 26 L226 36 L120 46 L40 48 Z', 'M40 24 L52 10 L88 10 L100 25', 'M40 48 L52 62 L88 62 L100 47'],
  'ship-d': ['M10 38 L64 16 L176 22 L228 38 L176 54 L64 60 Z', 'M64 16 L80 4 L140 6 L150 20', 'M64 60 L80 68 L140 66 L150 54'],
  'ship-e': ['M12 36 L52 26 L164 26 L224 36 L164 46 L52 46 Z', 'M52 26 L64 12 L110 12 L120 26'],
};

function HullSilhouette({ hull }: { hull?: string }) {
  const paths = HULL_PATHS[hull ?? 'ship-a'] ?? HULL_PATHS['ship-a'];
  return (
    <svg className="hull" viewBox="0 0 240 72" aria-hidden="true" focusable="false" data-hull={hull}>
      {paths.map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function ShipCard({ ship, focused, onFocusShip, show3d }: { ship: Ship; focused: boolean; onFocusShip: (id: string | null) => void; show3d: boolean }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const { logbook } = useStoreState();
  const report = useMemo(() => preflight(idx, ship), [idx, ship]);
  const library = isLibraryShip(ship);
  const stages = ship.voyage.filter((v) => v.kind === 'stage').length;
  const gates = ship.voyage.filter((v) => v.kind === 'gate').length;
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(ship.name);
  const lastExport = [...(logbook[ship.id] ?? [])].reverse().find((e) => e.kind === 'export');
  const resettable = !library && (ship.origin?.kind === 'clone' || ship.origin?.kind === 'blank') && (ship.origin?.workflow || ship.origin?.kind === 'blank');
  return (
    <article
      className="ship-card"
      data-testid="ship-card"
      data-ship={ship.id}
      data-focused={focused || undefined}
      aria-labelledby={`ship-${ship.id}`}
      onMouseEnter={() => onFocusShip(ship.id)}
      onFocusCapture={() => onFocusShip(ship.id)}
    >
      {!show3d && <HullSilhouette hull={ship.hull} />}
      <div className="ship-card-head">
        <h3 id={`ship-${ship.id}`} className="card-title">
          {ship.name}
        </h3>
        <span className="class-badge" style={{ ['--c' as string]: CLASS_PIGMENT[ship.class] } as CSSProperties}>{ship.class}</span>
      </div>
      {library ? (
        <p className="lock" data-testid="template-lock">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Commissioned · Template
        </p>
      ) : (
        <p className="lock" data-testid="drydock-label">Drydock · yours{ship.origin?.from ? ` · from ${ship.origin.from}` : ''}</p>
      )}
      {ship.summary && <p className="prose-sm">{ship.summary}</p>}
      <ul className="chips" aria-label={`Crew of ${ship.name}`} data-testid="crew-chips">
        {ship.crew.map((m) => (
          <li key={m.id} className="chip" data-crew={m.id}>
            <span className="dot" style={{ background: m.character.pigment }} aria-hidden="true" />
            {m.character.name}
          </li>
        ))}
      </ul>
      <div className="integrity">
        <HullRing percent={report.integrity} passed={report.passed} applicable={report.applicable} blockers={report.blockers} />
        <p className="stat">
          Hull integrity {report.passed} of {report.applicable} checks <TruthLabel truth="Verified" />
          <br />
          {report.next ? `Next: ${report.next.id} ${report.next.reason}` : 'Pre-flight is clean. Ready to export.'}
        </p>
      </div>
      <p className="stat">
        {ship.crew.length} crew · {stages} stages · {gates} gates · {lastExport ? `last export ${lastExport.at.slice(0, 10)}` : 'not exported yet'}
      </p>
      {renaming ? (
        <form
          className="row"
          style={{ gap: 'var(--s2)' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            dispatch({ type: 'ship/rename', id: ship.id, name: draft });
            notify(`Renamed to ${draft.trim()}.`, { undo: true });
            setRenaming(false);
          }}
        >
          <input className="field" style={{ flex: 1, minWidth: 160 }} value={draft} maxLength={48} onChange={(e) => setDraft(e.target.value)} aria-label={`New name for ${ship.name}`} data-testid="rename-input" autoFocus />
          <button type="submit" className="btn btn-primary" data-testid="rename-save">Save</button>
          <button type="button" className="btn btn-quiet" onClick={() => setRenaming(false)}>Cancel</button>
        </form>
      ) : (
        <div className="row card-actions" style={{ gap: 'var(--s2)' }}>
          <Link className="btn btn-quiet" to={`/ship/${ship.id}`} data-testid="open-ship">
            Open the ship
          </Link>
          {!library && (
            <Link className="btn btn-quiet" to={`/ship/${ship.id}/voyage`} data-testid="open-voyage">
              Plan the voyage
            </Link>
          )}
          <Link className="btn btn-quiet" to={`/ship/${ship.id}/preflight`} data-testid="open-preflight">
            Pre-flight and export
          </Link>
          {!library && (
            <>
              <button type="button" className="btn btn-quiet" onClick={() => { setDraft(ship.name); setRenaming(true); }} data-testid="rename">Rename</button>
              {resettable && (
                <button type="button" className="btn btn-quiet" data-testid="reset-ship" onClick={() => { dispatch({ type: 'ship/restoreDefault', id: ship.id }); notify(`${ship.name} reset to its template.`, { undo: true }); }}>
                  Reset ship
                </button>
              )}
              <button type="button" className="btn btn-quiet" data-testid="delete-ship" onClick={() => { dispatch({ type: 'ship/delete', id: ship.id }); notify(`${ship.name} deleted.`, { undo: true }); }}>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function HangarPage() {
  const idx = useKb();
  const { kb } = idx;
  const { ships } = useStoreState();
  const reduced = useReducedMotion();
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH), [idx]);
  // Acceptance 1: exactly one library ship, the default. The other workflows are templates in the Commission dialog.
  const flagship = library.ships.find((s) => s.id === kb.workflows.default);
  const skills = skillCount(kb);
  const [dialog, setDialog] = useState<null | { mode: 'clone' | 'blank' | 'import' }>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [lost, setLost] = useState(false);
  const fleet = useMemo(() => (flagship ? [flagship, ...ships] : ships), [flagship, ships]);
  const show3d = hasWebGL() && !force2d() && !lost;
  const items = useMemo(() => fleet.map((s) => ({ id: s.id, hull: s.hull ?? 'ship-e', pigment: CLASS_PIGMENT[s.class] })), [fleet]);
  const focus = focusId && fleet.some((s) => s.id === focusId) ? focusId : (fleet[0]?.id ?? null);

  return (
    <main id="main" className="page hangar">
      <header className="hangar-head">
        <h1 className="display">Shipyard</h1>
        <p className="lede">Fit out a ship, choose its crew, hang the skills on their bodies, and export the plan a session runs.</p>
        <Popover.Root>
          <Popover.Trigger className="pill" data-testid="how-it-works">
            How it works?
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
      </header>

      {show3d && (
        <div className="fleet-stage" data-testid="fleet-stage">
          <Suspense fallback={<div className="fleet-ring fleet-ring-loading" aria-hidden="true"><HullSilhouette hull={flagship?.hull} /></div>}>
            <FleetRing
              ships={items}
              focusId={focus}
              reduced={reduced}
              onContextLost={() => setLost(true)}
              onPick={(id) => {
                setFocusId(id);
                document.querySelector<HTMLElement>(`[data-ship="${id}"] [data-testid="open-ship"]`)?.focus();
              }}
            />
          </Suspense>
        </div>
      )}

      <section aria-labelledby="fleet-h" className="fleet">
        <div className="section-row">
          <h2 id="fleet-h" className="section-head">
            Fleet
          </h2>
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ mode: 'blank' })} data-testid="commission">
            Commission a ship
          </button>
        </div>
        {flagship ? <ShipCard ship={flagship} focused={focus === flagship.id} onFocusShip={setFocusId} show3d={show3d} /> : <p className="state-line">The default ship is missing from the library.</p>}
      </section>

      <section aria-labelledby="drydock-h" className="drydock">
        <h2 id="drydock-h" className="section-head">
          Drydock
        </h2>
        {ships.length === 0 ? (
          <div className="empty" data-testid="drydock-empty">
            <p className="prose">Your drydock is empty. Clone SS Full Run to start.</p>
            <button type="button" className="btn btn-quiet" onClick={() => setDialog({ mode: 'clone' })} data-testid="clone-default">
              Clone SS Full Run
            </button>
          </div>
        ) : (
          <div className="drydock-grid">
            {ships.map((s) => (
              <ShipCard key={s.id} ship={s} focused={focus === s.id} onFocusShip={setFocusId} show3d={show3d} />
            ))}
          </div>
        )}
      </section>

      <p className="stat footer-line" data-testid="library-count">
        <span data-testid="skill-count">{skills}</span> skills in the library <TruthLabel truth="Verified" />
      </p>
      {dialog && <CommissionDialog initialMode={dialog.mode} initialSource={kb.workflows.default} onClose={() => setDialog(null)} />}
    </main>
  );
}
