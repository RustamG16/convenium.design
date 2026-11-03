// `#/ship/:id/bridge?member=` — the crew profile (06 section 4.3): the screen the owner lives in.
// Left: the 3D turntable of the member wearing their artifacts (a drop target: the nearest free
// anchor is ringed while an artifact is dragged over it), the crew rail and Recruit. Centre: the
// identity card with Edit mode. Right: the Loadout rack (anchor diagram, slots, hold). Below: the
// ecosystem map. A library ship is a read-only template: everything shows, and "Clone to edit" is
// the way in. Without WebGL (or with `?2d`) the left card is the design sheet and the anchor
// diagram carries every equip; the boarding walk is skipped.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import '../../styles/ship.css';
import { Portrait } from '../../components/Portrait';
import { TruthLabel } from '../../components/TruthLabel';
import { MAX_CREW } from '../../domain/crew';
import type { Anchor } from '../../domain/schema';
import { isLibraryShip } from '../../domain/ship';
import { skillCount } from '../../kb/artifacts';
import { useKb } from '../../kb/context';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { sceneCrew } from '../../scene/crew';
import { layoutFor } from '../../scene/stations';
import type { AnchorScreen } from '../../scene/Turntable';
import { useDispatch, useStoreState } from '../../store/context';
import { uniqueShipId } from '../../store/store';
import { useEquip, useEquipTarget } from '../armory/equip';
import { useShip } from '../shared/useShip';
import { LoadoutRack } from './LoadoutRack';
import { RecruitDialog } from './RecruitDialog';
import { CrewRail, DismissButton, IdentityCard, IdentityEditor } from './ShipCards';

const Turntable = lazy(() => import('../../scene/Turntable').then((m) => ({ default: m.Turntable })));
const EcosystemMap = lazy(() => import('./EcosystemMap'));

export default function BridgePage() {
  const { id = '' } = useParams();
  const ship = useShip(id);
  const idx = useKb();
  const { codex, ships: stored } = useStoreState();
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [recruiting, setRecruiting] = useState(false);
  const [snap, setSnap] = useState<'peek' | 'mid' | 'full'>('peek');

  const crew = useMemo(() => (ship ? sceneCrew(idx, ship) : []), [idx, ship]);
  const welcome = useMemo(() => (ship ? layoutFor(ship.crew).welcome : null), [ship]);

  const select = useCallback(
    (memberId: string) => {
      const next = new URLSearchParams(params);
      next.set('member', memberId);
      next.delete('skill');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const wanted = params.get('member');
  const member = crew.find((m) => m.id === wanted) ?? crew.find((m) => m.id === welcome) ?? crew[0];
  const readOnly = ship ? isLibraryShip(ship) && !stored.some((x) => x.id === ship.id) : true;
  useEquipTarget(ship && member && !readOnly ? { shipId: ship.id, memberId: member.id } : null);

  if (!ship) {
    return (
      <main id="main" className="page ship-page" data-testid="no-ship">
        <h1 className="page-title">No such ship</h1>
        <p className="prose">There is no ship called {id} in this hangar.</p>
        <Link className="btn btn-quiet" to="/">
          Back to the hangar
        </Link>
      </main>
    );
  }
  if (!member) return <Navigate to="/" replace />;
  const raw = ship.crew.find((m) => m.id === member.id)!;
  const webgl = hasWebGL() && !force2d() && !sceneFailed;
  const agent = idx.agent.get(member.agent);

  const cloneToEdit = () => {
    const name = `${ship.name} copy`;
    const taken = [...stored.map((x) => x.id), ...idx.kb.workflows.ships.map((w) => w.id)];
    const newId = uniqueShipId(taken, name);
    dispatch({ type: 'ship/clone', source: ship, name });
    navigate(`/ship/${newId}/bridge?member=${member.id}`);
  };

  return (
    <main id="main" className="page ship-page" data-testid="crew-profile" data-ship={ship.id} data-webgl={webgl || undefined} data-readonly={readOnly || undefined}>
      <header className="ship-head row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--s3)', flexWrap: 'wrap' }}>
        <div>
          <p className="label">{ship.name} · crew</p>
          <h1 className="page-title ship-page-title">{member.name}</h1>
        </div>
        <div className="row" style={{ gap: 'var(--s2)', flexWrap: 'wrap' }}>
          {!readOnly && !editing && (
            <button type="button" className="btn btn-quiet" data-testid="edit-identity" onClick={() => setEditing(true)}>
              Edit {member.name}
            </button>
          )}
          {!readOnly && (
            <Link className="btn btn-quiet" to={`/ship/${ship.id}/voyage`} data-testid="to-voyage">
              Plan the voyage
            </Link>
          )}
          {webgl && (
            <button type="button" className="btn btn-quiet" data-testid="replay-walk" onClick={() => navigate(`/ship/${ship.id}/board`)}>
              Replay the walk
            </button>
          )}
          <Link className="btn btn-quiet" to="/" data-testid="back-to-hangar">
            Back to the hangar
          </Link>
        </div>
      </header>
      {readOnly && (
        <p className="template-banner" role="note" data-testid="template-banner">
          <span>{ship.name} is a template: look at everything, change nothing. Clone it to edit.</span>
          <button type="button" className="btn btn-primary" onClick={cloneToEdit} data-testid="clone-to-edit">
            Clone to edit
          </button>
        </p>
      )}
      <div className="ship-profile">
        <aside className="ship-profile-rail stack">
          {webgl ? (
            <Suspense fallback={<Portrait member={member} />}>
              <BodyDropZone ship={ship} member={member} editable={!readOnly}>
                {(probe) => <Turntable member={member} reduced={reduced} probe={probe} onContextLost={() => setSceneFailed(true)} />}
              </BodyDropZone>
            </Suspense>
          ) : (
            <Portrait member={member} />
          )}
          <CrewRail crew={crew} activeId={member.id} onSelect={select} />
          {!readOnly && (
            <button type="button" className="btn btn-quiet" onClick={() => setRecruiting(true)} disabled={ship.crew.length >= MAX_CREW} data-testid="recruit" aria-describedby={ship.crew.length >= MAX_CREW ? 'crew-full' : undefined}>
              Recruit
            </button>
          )}
          {ship.crew.length >= MAX_CREW && (
            <p id="crew-full" className="muted sheet-line">
              A ship carries at most {MAX_CREW} crew.
            </p>
          )}
          <p className="muted sheet-line" data-testid="codex-line">
            Codex <span className="num">{codex.length}</span> of <span className="num">{skillCount(idx.kb)}</span> skills inspected <TruthLabel truth="Simulated" />
          </p>
        </aside>
        <div className="ship-profile-main stack">
          {editing && !readOnly ? (
            <IdentityEditor key={member.id} ship={ship} member={member} onDone={() => setEditing(false)} />
          ) : (
            <IdentityCard member={member} evidence={`KB ${idx.kb.sourceHash.slice(0, 8)}`} access={agent?.access} model={agent?.model} />
          )}
          {!readOnly && !editing && <DismissButton ship={ship} member={member} />}
        </div>
        <div className="rack-sheet" data-snap={snap} data-testid="rack-sheet">
          <button type="button" className="rack-handle" onClick={() => setSnap((v) => (v === 'peek' ? 'mid' : v === 'mid' ? 'full' : 'peek'))} aria-expanded={snap !== 'peek'} data-testid="rack-handle">
            <span aria-hidden="true" className="rack-grip" />
            Artifacts · {raw.loadout.length} worn · {snap === 'full' ? 'Collapse' : 'Expand'}
          </button>
          <LoadoutRack
            idx={idx}
            ship={ship}
            member={raw}
            active={member.active}
            readOnly={readOnly}
            focusSkill={params.get('skill')}
            onOpenArmory={(a?: Anchor) => navigate(`/armory?ship=${ship.id}&member=${member.id}${a ? `&anchor=${a}` : ''}`)}
          />
        </div>
      </div>
      {recruiting && !readOnly && <RecruitDialog ship={ship} onClose={() => setRecruiting(false)} onRecruited={select} />}
      <Suspense fallback={null}>
        <EcosystemMap ship={ship} crew={crew} activeId={member.id} onSelect={select} />
      </Suspense>
    </main>
  );
}

/** The turntable as a drop target: while an artifact is dragged over it, the nearest free anchor is ringed and named. */
function BodyDropZone({ ship, member, editable, children }: { ship: { id: string }; member: { id: string }; editable: boolean; children: (probe: MutableRefObject<AnchorScreen>) => ReactNode }) {
  const { drag, registerBody } = useEquip();
  const idx = useKb();
  const box = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const probe = useRef<AnchorScreen>({});
  useEffect(() => {
    if (!editable) return;
    registerBody(member.id, (cx, cy, candidates) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return null;
      let best: Anchor | null = null;
      let bd = Infinity;
      for (const a of candidates) {
        const p = probe.current[a];
        if (!p) continue;
        const d = Math.hypot(r.left + p.x * r.width - cx, r.top + p.y * r.height - cy);
        if (d < bd) {
          bd = d;
          best = a;
        }
      }
      return best;
    });
    return () => registerBody(member.id, null);
  }, [editable, member.id, registerBody]);
  const hover = drag?.hover?.via === 'body' && drag.hover.memberId === member.id ? drag.hover.anchor : null;
  useEffect(() => {
    if (!hover || hover === 'hold') return;
    let raf = 0;
    const tick = () => {
      const p = probe.current[hover];
      const el = ring.current;
      if (p && el) {
        el.style.left = `${p.x * 100}%`;
        el.style.top = `${p.y * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [hover]);
  return (
    <div ref={box} className="body-drop" data-testid="body-drop" data-drop-body={editable ? '' : undefined} data-drop-ship={ship.id} data-drop-member={member.id} data-hover-anchor={hover ?? undefined}>
      {children(probe)}
      {hover && hover !== 'hold' && (
        <div ref={ring} className="body-drop-ring" data-testid="body-drop-ring" aria-hidden="true">
          <span>Drop to equip: {idx.kb.anchors[hover].label}</span>
        </div>
      )}
    </div>
  );
}
