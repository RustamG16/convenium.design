import * as Popover from '@radix-ui/react-popover';
import { Link } from 'react-router';
import { HullRing } from '../../components/HullRing';
import { TruthLabel } from '../../components/TruthLabel';
import { useKb } from '../../kb/context';
import { useMemo } from 'react';
import { preflight } from '../../domain/preflight';
import type { Ship } from '../../domain/schema';
import { LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { skillCount } from '../../kb/artifacts';
import { useStoreState } from '../../store/context';

/** Placeholder hull profile until the scene phase traces the five hull GLBs (05-asset-manifest). */
function HullSilhouette() {
  return (
    <svg className="hull" viewBox="0 0 240 72" aria-hidden="true" focusable="false">
      <path d="M6 40 L58 22 L168 18 L226 36 L168 54 L58 52 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M58 22 L72 8 L118 8 L128 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M58 52 L74 64 L122 64 L136 54" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ShipCard({ ship }: { ship: Ship }) {
  const idx = useKb();
  const report = useMemo(() => preflight(idx, ship), [idx, ship]);
  const stages = ship.voyage.filter((v) => v.kind === 'stage').length;
  const gates = ship.voyage.filter((v) => v.kind === 'gate').length;
  return (
    <article className="ship-card" data-testid="ship-card" data-ship={ship.id} aria-labelledby={`ship-${ship.id}`}>
      <HullSilhouette />
      <div className="ship-card-head">
        <h3 id={`ship-${ship.id}`} className="card-title">
          {ship.name}
        </h3>
        <span className="class-badge">{ship.class}</span>
      </div>
      <p className="lock" data-testid="template-lock">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Commissioned · Template
      </p>
      <p className="prose-sm">{ship.summary}</p>
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
        {ship.crew.length} crew · {stages} stages · {gates} gates
      </p>
      <p>
        <Link className="btn btn-quiet" to={`/ship/${ship.id}`} data-testid="open-ship">
          Open the ship
        </Link>{' '}
        <Link className="btn btn-quiet" to={`/ship/${ship.id}/preflight`} data-testid="open-preflight">
          Pre-flight and export
        </Link>
      </p>
    </article>
  );
}

export function HangarPage() {
  const idx = useKb();
  const { kb } = idx;
  const { ships } = useStoreState();
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH), [idx]);
  // Acceptance 1: exactly one ship, the default. The other library workflows are templates in the Commission dialog (T8).
  const flagship = library.ships.find((s) => s.id === kb.workflows.default);
  const skills = skillCount(kb);

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

      <section aria-labelledby="fleet-h" className="fleet">
        <div className="section-row">
          <h2 id="fleet-h" className="section-head">
            Fleet
          </h2>
          <button type="button" className="btn btn-primary" disabled aria-describedby="commission-stub" data-testid="commission">
            Commission a ship
          </button>
          <span id="commission-stub" className="label">
            Stub · arrives in T8
          </span>
        </div>
        {flagship ? <ShipCard ship={flagship} /> : <p className="state-line">The default ship is missing from the library.</p>}
      </section>

      <section aria-labelledby="drydock-h" className="drydock">
        <h2 id="drydock-h" className="section-head">
          Drydock
        </h2>
        {ships.length === 0 ? (
          <div className="empty" data-testid="drydock-empty">
            <p className="prose">Your drydock is empty. Clone SS Full Run to start.</p>
            <button type="button" className="btn btn-quiet" disabled>
              Clone SS Full Run
            </button>
            <span className="label">Stub · arrives in T8</span>
          </div>
        ) : (
          <ul className="drydock-list">
            {ships.map((s) => (
              <li key={s.id}>
                <Link to={`/ship/${s.id}/bridge`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="stat footer-line" data-testid="library-count">
        <span data-testid="skill-count">{skills}</span> skills in the library <TruthLabel truth="Verified" />
      </p>
    </main>
  );
}
