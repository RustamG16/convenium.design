// `#/ship/:id/preflight` — the hull diagram, the checks and the export (06 sections 4.6 and 8).
// Pre-flight is the real activation rules as checks; this screen shows them, says what to fix and
// where, and exports a ship only when nothing blocks it. Nothing is stored, timed or ranked here.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import '../../styles/preflight.css';
import { HullRing } from '../../components/HullRing';
import { TruthLabel } from '../../components/TruthLabel';
import { preflight, type Check, type Finding } from '../../domain/preflight';
import type { Ship } from '../../domain/schema';
import { useKb } from '../../kb/context';
import { useShip } from '../shared/useShip';
import { ExportPanel } from './ExportPanel';
import { fixTarget } from './fix';
import { HullDiagram } from './HullDiagram';
import { StatusMark } from './StatusMark';

function FixLink({ shipId, check, finding, ship }: { shipId: string; check: Check; finding: Finding; ship: Ship }) {
  const target = fixTarget(shipId, check, finding, (id) => ship.crew.find((m) => m.id === id)?.character.name ?? id);
  if (!target) return null;
  return (
    <Link className="btn btn-quiet pf-fix" to={target.to} data-testid="fix-link">
      {target.label}
    </Link>
  );
}

function CheckRow({ check, ship }: { check: Check; ship: Ship }) {
  const first = check.findings[0];
  const more = check.findings.length - 1;
  return (
    <li className="pf-check" data-check={check.id} data-status={check.status} data-testid="check-row">
      <div className="pf-check-head">
        <StatusMark status={check.status} />
        <span className="pf-id">{check.id}</span>
        <h3 className="pf-title">{check.title}</h3>
      </div>
      {/* A plain pass says so in its status word; only a reason that tells something is written out. */}
      {!(check.status === 'pass' && check.reason === 'Passed.') && (
        <p className="pf-reason" data-testid="check-reason">
          {check.reason}
        </p>
      )}
      {first && check.status !== 'pass' && <FixLink shipId={ship.id} check={check} finding={first} ship={ship} />}
      {more > 0 && (
        <details className="pf-more">
          <summary>
            {more} more {more === 1 ? 'finding' : 'findings'}
          </summary>
          <ul>
            {check.findings.slice(1).map((f, i) => (
              <li key={i}>
                <p className="pf-reason">{f.reason}</p>
                <FixLink shipId={ship.id} check={check} finding={f} ship={ship} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

function focusExport() {
  const panel = document.getElementById('export');
  panel?.scrollIntoView({ block: 'start' });
  panel?.focus({ preventScroll: true });
}

export default function PreflightPage() {
  const { id = '' } = useParams();
  const idx = useKb();
  const ship = useShip(id);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const report = useMemo(() => (ship ? preflight(idx, ship) : null), [idx, ship]);

  if (!ship || !report) {
    return (
      <main id="main" className="page preflight" data-testid="preflight-missing">
        <h1 className="page-title">No such ship</h1>
        <p className="prose">There is no ship called &ldquo;{id}&rdquo; here.</p>
        <Link className="btn btn-quiet" to="/">
          Back to the Hangar
        </Link>
      </main>
    );
  }

  const stale = ship.kbHash !== idx.kb.sourceHash;
  const retired = ship.crew.flatMap((m) => m.loadout.filter((e) => !idx.skill.has(e.skill)).map((e) => `${m.character.name}: ${e.skill}`));
  const next = report.next;
  const nextFinding = next?.findings.find((f) => f.severity === next.status) ?? next?.findings[0];
  const shown = onlyProblems ? report.checks.filter((c) => c.status === 'block' || c.status === 'warn') : report.checks;
  const live = `Hull integrity ${report.integrity} percent, ${report.passed} of ${report.applicable} checks pass. ${report.blockers} ${report.blockers === 1 ? 'blocker' : 'blockers'}, ${report.warnings} ${report.warnings === 1 ? 'warning' : 'warnings'}. ${next ? `Next: ${next.id} ${next.reason}` : 'Cleared for departure.'}`;

  return (
    <main id="main" className="page preflight" data-testid="preflight" data-ship={ship.id}>
      <header className="pf-head">
        <p className="label">
          Pre-flight · {ship.name} · {ship.class}
        </p>
        <h1 className="page-title">Pre-flight</h1>
        <p className="pf-links">
          <Link to={`/ship/${ship.id}/bridge`}>Bridge</Link>
          <Link to={`/ship/${ship.id}/voyage`}>Voyage</Link>
          <Link to="/logbook">Logbook</Link>
        </p>
      </header>

      <p className="sr-only" role="status" aria-live="polite" data-testid="preflight-live">
        {live}
      </p>

      {stale && (
        <p className="banner pf-stale" role="status" data-testid="stale-banner">
          <strong>Library changed since this ship was saved.</strong> It was saved against {ship.kbHash.slice(0, 8)}; the library is now {idx.kb.sourceHash.slice(0, 8)}.{' '}
          {retired.length > 0 ? `No longer in the library: ${retired.join(', ')}.` : 'None of its equipped skills has left the library; re-check its stages.'}
        </p>
      )}

      <section className="pf-goal" aria-labelledby="goal-h" data-testid="next-goal" data-goal={report.applicable === 0 ? 'begin' : next ? next.id : 'export'}>
        <h2 id="goal-h" className="label">
          Next goal
        </h2>
        {report.applicable === 0 ? (
          <p className="pf-goal-line">
            Add a crew member to begin. <Link to={`/ship/${ship.id}/bridge`}>Go to the bridge</Link>
          </p>
        ) : next ? (
          <>
            <p className="pf-goal-line" data-testid="next-goal-line">
              <StatusMark status={next.status} /> <span className="pf-id">{next.id}</span> {next.reason}
            </p>
            <div className="pf-goal-actions">
              {nextFinding && <FixLink shipId={ship.id} check={next} finding={nextFinding} ship={ship} />}
              <p className="prose-sm">{report.canExport ? 'A warning does not stop an export.' : 'Export stays off until this is fixed.'}</p>
            </div>
          </>
        ) : (
          <div className="pf-goal-actions">
            <p className="cleared" data-testid="cleared">
              Cleared for departure
            </p>
            <button type="button" className="btn btn-primary" onClick={focusExport} data-testid="goal-export">
              Export
            </button>
          </div>
        )}
      </section>

      <div className="pf-grid">
        <section className="pf-hull" aria-labelledby="hull-h">
          <h2 id="hull-h" className="panel-head">
            Hull
          </h2>
          <div className="pf-ring-row">
            <HullRing percent={report.integrity} passed={report.passed} applicable={report.applicable} size={120} blockers={report.blockers} />
            <div>
              <p className="stat" data-testid="hull-stat">
                {report.passed} of {report.applicable} checks pass <TruthLabel truth="Verified" />
              </p>
              <p className="stat" data-testid="hull-counts">
                {report.blockers} {report.blockers === 1 ? 'blocker' : 'blockers'} · {report.warnings} {report.warnings === 1 ? 'warning' : 'warnings'}
              </p>
              {report.blockers > 0 && <p className="prose-sm">A blocker holds the ring at 99.</p>}
            </div>
          </div>
          <HullDiagram checks={report.checks} />
        </section>

        <section className="pf-checks" aria-labelledby="checks-h">
          <div className="pf-checks-head">
            <h2 id="checks-h" className="panel-head">
              Checks
            </h2>
            <div className="seg" role="group" aria-label="Which checks to show">
              <button type="button" aria-pressed={!onlyProblems} onClick={() => setOnlyProblems(false)}>
                All {report.checks.length}
              </button>
              <button type="button" aria-pressed={onlyProblems} onClick={() => setOnlyProblems(true)} data-testid="only-problems">
                Needs attention {report.blockers + report.warnings}
              </button>
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="state-line" data-testid="checks-empty">
              Nothing needs attention.
            </p>
          ) : (
            <ol className="pf-list" data-testid="check-list">
              {shown.map((c) => (
                <CheckRow key={c.id} check={c} ship={ship} />
              ))}
            </ol>
          )}
        </section>

        <ExportPanel ship={ship} report={report} />
      </div>
    </main>
  );
}
