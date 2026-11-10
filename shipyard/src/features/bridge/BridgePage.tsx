// `#/ship/:id/bridge?member=` — the crew profile (06 section 4.3): the screen the owner lives in.
// Left: the 3D turntable of the member wearing their artifacts (a drop target: the nearest free
// anchor is ringed while an artifact is dragged over it), the crew rail and Recruit. Centre: the
// identity (name, role, tier, one line; the lore sits behind one "Profile" disclosure) with Edit
// mode. Right: the Loadout rack (anchor diagram, slots, hold). The crew ecosystem is one
// disclosure away. A library ship is a read-only template: everything shows, and any edit gesture
// opens the one-step "Clone to edit" dialog. Without WebGL (or with `?2d`) the left card is the
// design sheet and the anchor diagram carries every equip; the boarding walk is skipped.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import '../../styles/ship.css';
import '../../styles/bridge-arcade.css';
import { TruthLabel } from '../../components/TruthLabel';
import { MAX_CREW } from '../../domain/crew';
import type { Anchor } from '../../domain/schema';
import { isLibraryShip } from '../../domain/ship';
import { skillCount } from '../../kb/artifacts';
import { useKb } from '../../kb/context';
import { totalCapacity } from '../../domain/loadout';
import { effectiveModel } from '../../domain/variant';
import { arcadeMedia } from '../../lib/arcadeArt';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { sceneCrew } from '../../scene/crew';
import { layoutFor } from '../../scene/stations';
import type { AnchorScreen } from '../../scene/Turntable';
import { useStoreState } from '../../store/context';
import { useEquip, useEquipTarget } from '../armory/equip';
import { ArmoryView } from '../armory/ArmoryView';
import { ShipNav, TemplateLine, useCloneToEdit } from '../shared/ShipNav';
import { useShip } from '../shared/useShip';
import { LoadoutRack } from './LoadoutRack';
import { RecruitDialog } from './RecruitDialog';
import { CrewRail, DismissButton, IdentityCard, IdentityEditor } from './ShipCards';
import { TuningCard, TunePanel } from './TuningCard';
import { AgentStats, CrewStage } from './ArcadeBridge';

const Turntable = lazy(() => import('../../scene/Turntable').then((m) => ({ default: m.Turntable })));
const EcosystemMap = lazy(() => import('./EcosystemMap'));

export default function BridgePage() {
  const { id = '' } = useParams();
  const ship = useShip(id);
  const idx = useKb();
  const { codex, ships: stored } = useStoreState();
  const [params, setParams] = useSearchParams();
  const reduced = useReducedMotion();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [recruiting, setRecruiting] = useState(false);
  const [armoryOpen, setArmoryOpen] = useState(false);
  const [ecoOpen, setEcoOpen] = useState(false);
  const [snap, setSnap] = useState<'peek' | 'mid' | 'full'>('peek');
  const addendumRef = useRef<HTMLTextAreaElement>(null);
  const [view3d, setView3d] = useState(readView);

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
  // An edit gesture on a template opens one "Clone to edit" step, then lands in the clone on this screen with this selection.
  const qs = new URLSearchParams(params);
  if (member) qs.set('member', member.id);
  const clone = useCloneToEdit(ship, (newId) => `/ship/${newId}/bridge?${qs.toString()}`);

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
  // v3: the crew render on its pedestal is the figure; the 3D turntable (and dragging onto the body) is one toggle away (?view=3d)
  const want3d = params.get('view') ? params.get('view') === '3d' : view3d;
  const webgl = want3d && hasWebGL() && !force2d() && !sceneFailed;
  const agent = idx.agent.get(member.agent);
  const orbit = raw.loadout.filter((e) => e.anchor === 'orbit').length;
  const toggleView = () => {
    const next = new URLSearchParams(params);
    next.delete('view');
    setView3d(!want3d);
    writeView(!want3d);
    setParams(next, { replace: true });
  };
  const others = Math.max(0, crew.length - 1);
  const tune = () => {
    const el = addendumRef.current;
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  };

  return (
    <main
      id="main"
      className="page ar-full ship-page bridge-ar"
      data-testid="crew-profile"
      data-ship={ship.id}
      data-webgl={webgl || undefined}
      data-readonly={readOnly || undefined}
      style={{ ['--plate' as string]: `url(${arcadeMedia('plate-bridge.webp')})`, ['--laurel' as string]: `url(${arcadeMedia('laurel.webp')})` } as CSSProperties}
    >
      <div className="ar-band br-band">
        <header className="ship-head br-head">
          <div>
            <p className="label br-kicker">{ship.name} · crew</p>
            <h1 className="ar-wordmark br-name">{member.name}</h1>
          </div>
          {!editing && (
            <button type="button" className="btn btn-quiet br-edit" data-testid="edit-identity" onClick={() => (readOnly ? clone.ask() : setEditing(true))}>
              Edit crew: {member.name}
            </button>
          )}
        </header>
        <ShipNav ship={ship} current="bridge" />
        {readOnly && <TemplateLine ship={ship} onClone={clone.ask} />}
        <div className="br-grid">
          <aside className="br-fig ship-profile-rail">
            {webgl ? (
              <Suspense fallback={<CrewStage member={member} orbit={orbit} />}>
                <BodyDropZone ship={ship} member={member} editable={!readOnly}>
                  {(probe) => <Turntable member={member} reduced={reduced} probe={probe} onContextLost={() => setSceneFailed(true)} />}
                </BodyDropZone>
              </Suspense>
            ) : (
              <CrewStage member={member} orbit={orbit} />
            )}
            {hasWebGL() && !force2d() && (
              <button type="button" className="btn btn-text btn-sm br-view" onClick={toggleView} aria-pressed={want3d} data-testid="view-3d">
                {want3d ? 'Show the crew render' : 'View the body in 3D'}
              </button>
            )}
          </aside>
          <div className="br-id ship-profile-main stack">
            {armoryOpen && !readOnly ? (
              <div className="armory-drawer" data-testid="armory-drawer" role="region" aria-label="Armory">
                <ArmoryView variant="drawer" ship={ship} member={raw} onClose={() => setArmoryOpen(false)} />
              </div>
            ) : editing && !readOnly ? (
              <IdentityEditor key={member.id} ship={ship} member={member} onDone={() => setEditing(false)} />
            ) : (
              <>
                <IdentityCard member={member} evidence={`KB ${idx.kb.sourceHash.slice(0, 8)}`} access={agent?.access} model={agent?.model} />
                <TuningCard key={member.id} ship={ship} member={raw} readOnly={readOnly} onLocked={clone.ask} onTune={tune} />
              </>
            )}
            {!readOnly && !editing && !armoryOpen && <DismissButton ship={ship} member={member} />}
          </div>
          <div className="br-mid">
            <AgentStats idx={idx} member={raw} runs={effectiveModel(idx, raw)} worn={raw.loadout.length} capacity={totalCapacity(idx)} />
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
                onOpenArmory={() => setArmoryOpen((v) => !v)}
                onLocked={clone.ask}
              />
            </div>
          </div>
          <div className="br-tune">
            <TunePanel key={`${member.id}:${JSON.stringify(raw.override ?? null)}`} ship={ship} member={raw} readOnly={readOnly} onLocked={clone.ask} addendumRef={addendumRef} />
          </div>
          <section className="br-crew ship-crew-block" aria-labelledby="br-crew-h">
            <div className="br-crew-head">
              <h2 id="br-crew-h" className="ar-head">
                Crew ({others} other agent{others === 1 ? '' : 's'})
              </h2>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => (readOnly ? clone.ask() : setRecruiting(true))} disabled={!readOnly && ship.crew.length >= MAX_CREW} data-testid="recruit" aria-describedby={ship.crew.length >= MAX_CREW ? 'crew-full' : undefined}>
                Recruit
              </button>
            </div>
            <CrewRail crew={crew} activeId={member.id} onSelect={select} />
            {ship.crew.length >= MAX_CREW && (
              <p id="crew-full" className="muted sheet-line">
                A ship carries at most {MAX_CREW} crew.
              </p>
            )}
            <p className="muted sheet-line" data-testid="codex-line">
              Codex <span className="num">{codex.length}</span> of <span className="num">{skillCount(idx.kb)}</span> skills inspected <TruthLabel truth="Simulated" />
            </p>
          </section>
        </div>
        <details className="eco-disclosure" data-testid="eco-disclosure" open={ecoOpen} onToggle={(e) => setEcoOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary className="btn btn-quiet btn-sm">Crew ecosystem</summary>
          {ecoOpen && (
            <Suspense fallback={null}>
              <EcosystemMap ship={ship} crew={crew} activeId={member.id} onSelect={select} />
            </Suspense>
          )}
        </details>
      </div>
      {recruiting && !readOnly && <RecruitDialog ship={ship} onClose={() => setRecruiting(false)} onRecruited={select} />}
      {clone.dialog}
    </main>
  );
}

const VIEW_KEY = 'convenium.shipyard.ui.bridgeView';
/** The Bridge figure: the crew render by default, the 3D turntable once chosen; the choice is remembered (a per-viewer convenience). */
function readView(): boolean {
  try {
    return window.localStorage.getItem(VIEW_KEY) === '3d';
  } catch {
    return false;
  }
}
function writeView(on: boolean) {
  try {
    window.localStorage.setItem(VIEW_KEY, on ? '3d' : '2d');
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
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
