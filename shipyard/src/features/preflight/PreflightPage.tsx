// `#/ship/:id/preflight` — the hull diagram, the checks and the export (06 sections 4.6 and 8).
// Pre-flight is the real activation rules as checks; this screen shows them, says what to fix and
// where, and exports a ship only when nothing blocks it. Nothing is stored, timed or ranked here.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import '../../styles/preflight.css';
import { CountUp, HullRing } from '../../components/HullRing';
import { TruthLabel } from '../../components/TruthLabel';
import { preflight, type Check, type Finding } from '../../domain/preflight';
import type { Ship } from '../../domain/schema';
import { largeSeen, markLargeSeen, playLarge } from '../../lib/feel';
import { gsap, useGSAP } from '../../lib/gsap';
import { easeDefault, isReducedMotion, MOTION, recordMotion } from '../../lib/motion';
import { useKb } from '../../kb/context';
import { ShipNav } from '../shared/ShipNav';
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
  const row = useRef<HTMLLIElement>(null);
  const was = useRef(check.status);
  // A check that flips while you watch ticks once (a 400 ms tint); reduced motion shows the final state.
  useEffect(() => {
    const before = was.current;
    was.current = check.status;
    if (before === check.status || isReducedMotion()) return;
    row.current?.animate([{ backgroundColor: 'color-mix(in srgb, var(--cotton) 14%, transparent)' }, { backgroundColor: 'transparent' }], { duration: MOTION.checkFlip.ms, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    recordMotion('check-flip', MOTION.checkFlip.ms, { check: check.id, from: before, to: check.status });
  }, [check.status, check.id]);
  return (
    <li ref={row} className="pf-check" data-check={check.id} data-status={check.status} data-testid="check-row">
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
  const root = useRef<HTMLElement>(null);
  const swept = useRef<string | null>(null);
  const cleanShip = ship && report && report.applicable > 0 && !report.next ? ship.id : null;

  // Clean pre-flight, the first time for each ship only: the ring closes, the hull lights sweep stern to bow
  // (900 ms in all) and the cotton line settles. It never plays again for that ship. Reduced motion: the final
  // state and the line, nothing moves. Interruptible: leaving the page kills the timeline.
  useGSAP(
    () => {
      const scope = root.current;
      if (!scope || !cleanShip) return;
      if (isReducedMotion()) {
        recordMotion('sweep', 0, { ship: cleanShip, variant: 'final-state' });
        return;
      }
      if (swept.current !== cleanShip && !playLarge(cleanShip, largeSeen(), true)) return;
      swept.current = cleanShip;
      markLargeSeen(cleanShip);
      const hull = scope.querySelector<HTMLElement>('.pf-hull');
      const arc = scope.querySelector<SVGCircleElement>('.pf-hull .ring-arc');
      const lights = gsap.utils.toArray<SVGRectElement>('.hull-light', scope);
      const line = scope.querySelector<HTMLElement>('[data-testid="cleared"]');
      const step = (MOTION.sweep.ms / 1000 - 0.3) / Math.max(1, lights.length - 1);
      const tl = gsap.timeline({
        onStart: () => hull?.setAttribute('data-sweep', 'playing'),
        onComplete: () => hull?.setAttribute('data-sweep', 'done'),
      });
      if (arc) {
        const c = Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0] ?? 0);
        const end = Number(arc.getAttribute('stroke-dashoffset') ?? 0);
        tl.fromTo(arc, { strokeDashoffset: c }, { strokeDashoffset: end, duration: 0.4, ease: easeDefault }, 0);
      }
      const t0 = performance.now();
      const logged = new Set<SVGRectElement>();
      lights.forEach((light, i) => {
        tl.fromTo(light, { opacity: 0 }, { opacity: 0.9, duration: 0.15, ease: 'power1.out', yoyo: true, repeat: 1, onStart: () => {
              if (logged.has(light)) return; // a yoyo starts twice
              logged.add(light);
              recordMotion('sweep-light', 150, { group: light.dataset.light, at: Math.round(performance.now() - t0) });
            },
          }, i * step);
      });
      if (line) tl.fromTo(line, { y: 4 }, { y: 0, duration: 0.3, ease: easeDefault, clearProps: 'transform' }, MOTION.sweep.ms / 1000 - 0.3);
      hull?.setAttribute('data-sweep', 'playing');
      recordMotion('sweep', MOTION.sweep.ms, { ship: cleanShip, order: lights.map((l) => l.dataset.light) });
      return () => {
        tl.kill();
        gsap.set([arc, ...lights, line].filter(Boolean), { clearProps: 'all' });
        hull?.setAttribute('data-sweep', 'done');
      };
    },
    { scope: root, dependencies: [cleanShip], revertOnUpdate: false },
  );

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
    <main id="main" ref={root} className="page preflight" data-testid="preflight" data-ship={ship.id}>
      <header className="pf-head">
        <p className="label">
          Pre-flight · {ship.name} · {ship.class}
        </p>
        <h1 className="page-title">Pre-flight</h1>
      </header>
      <ShipNav ship={ship} current="preflight" showNext={false} />

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
            <button type="button" className="btn btn-quiet" onClick={focusExport} data-testid="goal-export">
              Export
            </button>
          </div>
        )}
      </section>

      <div className="pf-grid">
        <section className="pf-hull" aria-labelledby="hull-h" data-sweep={cleanShip ? 'idle' : undefined}>
          <h2 id="hull-h" className="panel-head">
            Hull
          </h2>
          <div className="pf-ring-row">
            <HullRing percent={report.integrity} passed={report.passed} applicable={report.applicable} size={120} blockers={report.blockers} />
            <div>
              <p className="stat" data-testid="hull-stat">
                <CountUp value={report.passed} /> of {report.applicable} checks pass <TruthLabel truth="Verified" />
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
