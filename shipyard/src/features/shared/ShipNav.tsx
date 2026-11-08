// The one ship sub-nav (simplicity brief G1): Bridge · Voyage · Pre-flight on every ship screen, the
// current one marked, a readiness pill and the next-goal button beside it. "Replay the walk" and
// "Back to the hangar" sit in a quiet overflow. A read-only template shows one slim line with
// "Clone to edit" (G2); any edit gesture on a template opens the same one-step dialog and lands in
// the clone on the same screen with the same selection. Nothing is cloned without that dialog.
import * as Dialog from '@radix-ui/react-dialog';
import '../../styles/ship.css';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { TruthLabel } from '../../components/TruthLabel';
import { preflight } from '../../domain/preflight';
import type { Ship } from '../../domain/schema';
import { useKb } from '../../kb/context';
import { force2d, hasWebGL } from '../../lib/preferences';
import { useDispatch } from '../../store/context';
import { uniqueShipId } from '../../store/store';
import { useStoreState } from '../../store/context';
import { fixNames, fixTarget } from '../preflight/fix';

export type ShipScreen = 'bridge' | 'voyage' | 'preflight';

/**
 * Clone-to-edit for a read-only ship. `ask()` opens the dialog; confirming clones and navigates to
 * `land(newId)`. The dialog element must be rendered by the caller (`dialog`).
 */
export function useCloneToEdit(ship: Ship | null, land: (newId: string) => string): { ask: () => void; dialog: ReactNode } {
  const idx = useKb();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { ships: stored } = useStoreState();
  const [open, setOpen] = useState(false);
  const ask = useCallback(() => setOpen(true), []);
  const confirm = () => {
    if (!ship) return;
    const name = `${ship.name} copy`;
    const taken = [...stored.map((x) => x.id), ...idx.kb.workflows.ships.map((w) => w.id)];
    const newId = uniqueShipId(taken, name);
    dispatch({ type: 'ship/clone', source: ship, name });
    setOpen(false);
    navigate(land(newId));
  };
  const dialog = open && ship && (
    <Dialog.Root open onOpenChange={(o) => !o && setOpen(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog" data-testid="clone-dialog" aria-describedby="clone-dialog-why">
          <Dialog.Title className="card-title">Clone to edit</Dialog.Title>
          <p id="clone-dialog-why" className="prose-sm">
            {ship.name} is a read-only template. Cloning makes a copy that is yours to change; it opens here, on the same screen, with the same selection. The template stays as it is.
          </p>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" data-testid="clone-confirm" onClick={confirm} autoFocus>
              Clone to edit
            </button>
            <Dialog.Close className="btn btn-quiet" data-testid="clone-cancel">
              Not now
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return { ask, dialog: dialog || null };
}

/** The slim template line: one sentence and the screen's primary action. */
export function TemplateLine({ ship, onClone }: { ship: Ship; onClone: () => void }) {
  return (
    <p className="template-line" role="note" data-testid="template-banner">
      <span>
        <strong>Template, read-only.</strong> {ship.name} stays as it is.
      </span>
      <button type="button" className="btn btn-primary" onClick={onClone} data-testid="clone-to-edit">
        Clone to edit
      </button>
    </p>
  );
}

function ReadyRing({ percent }: { percent: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--cotton)" strokeWidth="3" strokeLinecap="butt" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 12 12)" />
    </svg>
  );
}

export function ShipNav({ ship, current, showNext = true }: { ship: Ship; current: ShipScreen; showNext?: boolean }) {
  const idx = useKb();
  const navigate = useNavigate();
  const report = useMemo(() => preflight(idx, ship), [idx, ship]);
  const base = `/ship/${ship.id}`;
  const webgl = hasWebGL() && !force2d();
  const next = report.next;
  const finding = next?.findings.find((f) => f.severity === next.status) ?? next?.findings[0];
  const fix = next && finding ? fixTarget(ship.id, next, finding, fixNames(ship, idx)) : null;
  const nextTo = report.applicable === 0 ? `${base}/bridge` : (fix?.to ?? `${base}/preflight`);
  const nextLabel = report.applicable === 0 ? 'Add a crew member' : next ? (fix?.label ?? 'Open Pre-flight') : 'Ready to export'; // the fix in words, not a check code (finish review m2)
  const items: { id: ShipScreen; label: string; testid?: string }[] = [
    { id: 'bridge', label: 'Bridge', testid: 'to-bridge' },
    { id: 'voyage', label: 'Voyage', testid: 'to-voyage' },
    { id: 'preflight', label: 'Pre-flight', testid: 'to-preflight' },
  ];
  return (
    <div className="ship-subnav" data-testid="ship-subnav">
      <nav aria-label={`${ship.name} screens`} className="ship-subnav-links">
        <ul>
          {items.map((it) => (
            <li key={it.id}>
              <Link to={`${base}/${it.id}`} data-testid={it.testid} aria-current={it.id === current ? 'page' : undefined} className="ship-subnav-link">
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ship-subnav-side">
        <p className="ready-pill" data-testid="ship-ready" title={`Hull integrity ${report.integrity} percent. Computed from this ship.`}>
          <ReadyRing percent={report.integrity} />
          <span className="num">
            {report.passed} of {report.applicable}
          </span>
          <span className="sr-only"> checks pass</span> <TruthLabel truth="Verified" />
        </p>
        {showNext && (
          <Link className="btn btn-quiet ship-next" to={nextTo} data-testid="ship-next" title={next ? `${next.id}: ${next.reason}` : undefined} data-check={next?.id}>
            {nextLabel}
          </Link>
        )}
        <details className="ship-more">
          <summary className="btn btn-quiet" data-testid="ship-more">
            More
          </summary>
          <div className="ship-more-menu">
            {webgl && (
              <button type="button" className="btn btn-quiet" data-testid="replay-walk" onClick={() => navigate(`${base}/board`)}>
                Replay the walk
              </button>
            )}
            <Link className="btn btn-quiet" to="/logbook">
              Logbook
            </Link>
            <Link className="btn btn-quiet" to="/" data-testid="back-to-hangar">
              Back to the hangar
            </Link>
          </div>
        </details>
      </div>
    </div>
  );
}
