// `#/ship/:id/board` — the boarding walk (06 section 4.2): the free-roam first-person tour of the
// ship, with the ship's own crew at their stations and its loadouts on their holo screens.
//
// Ported from ArkhEthos `IntroTour.tsx`: one full-height stage; you walk anywhere on the floor with
// WASD or the arrows and look with the captured mouse (a drag on phones); where you stand and what
// you face decides the card (`zoneAt`). The rail, 1-9, Space and Next/Back hand the walk to an
// autopilot that routes round the props. Talk opens the identity line; the last stop ends with
// "Meet the crew". Every ArkhEthos number is kept. Changes: the crew, stations and tour come from
// the ship, "Skip to bridge" replaces "Skip to crew", Talk lists the artifacts the member wears
// (editing is T6), and the walk plays once per ship (`ui.introSeen`), with a replay from the bridge.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import '../../styles/ship.css';
import * as THREE from 'three';
import { useProgress } from '@react-three/drei';
import { Icon } from '../../components/Icons';
import { SkewBadge } from '../../components/SkewBadge';
import { TruthLabel } from '../../components/TruthLabel';
import type { Ship } from '../../domain/schema';
import { useKb } from '../../kb/context';
import { force2d, hasWebGL, useIsMobile, useReducedMotion } from '../../lib/preferences';
import { isFamilyId } from '../../scene/artifacts/familyIds';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { sceneCrew, screenLines, type SceneMember } from '../../scene/crew';
import { ShipScene } from '../../scene/ShipScene';
import { playOneShot } from '../../scene/ShipSound';
import { INSPECT, layoutFor } from '../../scene/stations';
import type { WalkKey } from '../../scene/tourModel';
import { useTourControls } from '../../scene/useTourControls';
import { Walker } from '../../scene/Walker';
import { createWalkMap } from '../../scene/walk';
import { useDispatch } from '../../store/context';
import { useShip } from '../shared/useShip';
import { PHASE_LABEL, pipelineOf } from './pipeline';

/** Longest the loading veil stays up: past this the scene shows whatever it has, never a stuck veil. */
const LOADING_MAX_MS = 20_000;
/** When the loader never reports work (every GLB already cached), the veil lifts after this grace (critic n5). */
const LOADING_IDLE_GRACE_MS = 1_500;
/** After this long the veil offers a way out: enter the bridge without 3D, or retry (critic n5). */
const LOADING_SLOW_MS = 8_000;

/**
 * Cold load (finish review): the corridor's GLBs take a few seconds, and the stage was plain black
 * meanwhile. The veil names what is coming with a progress line, and lifts once the loader has started
 * and gone idle, once the loader has stayed idle for a short grace, or after LOADING_MAX_MS. It covers
 * only the stage: the card, Skip and the rail work at once. It is a polite status region, so a screen
 * reader hears "Loading" and then "Ready" (v2, critic n5).
 */
function LoadingVeil({ name, onSkip }: { name: string; onSkip: () => void }) {
  const { active, progress, total } = useProgress();
  const [elapsed, setElapsed] = useState<'start' | 'grace' | 'slow' | 'max'>('start');
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const ts = [
      window.setTimeout(() => setElapsed((e) => (e === 'start' ? 'grace' : e)), LOADING_IDLE_GRACE_MS),
      window.setTimeout(() => setElapsed((e) => (e === 'max' ? e : 'slow')), LOADING_SLOW_MS),
      window.setTimeout(() => setElapsed('max'), LOADING_MAX_MS),
    ];
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, []);
  // remembered during render (React's pattern for state derived from a changing input), not in an effect
  if (active && !seen) setSeen(true);
  const done = elapsed === 'max' || (seen && !active) || (!seen && !active && elapsed !== 'start') || (total > 0 && !active && progress >= 100);
  const slow = !done && elapsed === 'slow';
  return (
    <div className="ship-loading" data-testid="scene-loading" data-done={done || undefined} role="status" aria-live="polite" style={{ ['--p' as string]: String(Math.min(1, progress / 100)) } as CSSProperties}>
      {done ? (
        <span className="sr-only">{name} is ready.</span>
      ) : (
        <>
          <span className="label">Boarding {name}</span>
          <span className="ship-loading-bar" aria-hidden="true">
            <span />
          </span>
          {slow && (
            <span className="ship-loading-slow">
              <span className="prose">The ship is taking a while to load.</span>
              <span className="ship-loading-actions">
                <button type="button" className="btn btn-primary" onClick={onSkip} data-testid="enter-without-3d">
                  Enter without 3D
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </span>
            </span>
          )}
        </>
      )}
    </div>
  );
}

/** How often the card checks where you are (ms); the walk itself runs every frame in the scene. */
const ZONE_POLL_MS = 120;

export default function BoardPage() {
  const { id = '' } = useParams();
  const ship = useShip(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sound, setSound] = useState(false);

  if (!ship) {
    return (
      <main id="main" className="page">
        <h1 className="page-title">No such ship</h1>
        <p className="prose">There is no ship called {id} in this hangar.</p>
      </main>
    );
  }
  // No WebGL, `?2d` or a lost context: the DOM bridge, the walk skipped.
  if (force2d() || !hasWebGL() || sceneFailed) return <Navigate to={`/ship/${ship.id}/bridge`} replace />;

  const toBridge = (member?: string) => {
    dispatch({ type: 'ui/introSeen', shipId: ship.id });
    navigate(`/ship/${ship.id}/bridge${member ? `?member=${encodeURIComponent(member)}` : ''}`, { replace: true });
  };

  return (
    <main id="main" className="page ship-page ship-page-intro">
      <BoardTour key={ship.id} ship={ship} reduced={reduced} quality={mobile ? 'low' : 'high'} lite={mobile} sound={sound} onSound={setSound} onSkip={() => toBridge()} onFinish={(welcome) => toBridge(welcome ?? undefined)} onContextLost={() => setSceneFailed(true)} />
    </main>
  );
}

export interface BoardTourProps {
  ship: Ship;
  reduced: boolean;
  quality: 'low' | 'high';
  /** Phones: the cheaper scene and the on-screen pad. */
  lite: boolean;
  sound: boolean;
  onSound: (on: boolean) => void;
  onSkip: () => void;
  /** The member the walk ended on (the welcome), for the bridge to open on. */
  onFinish: (welcome: string | null) => void;
  onContextLost: () => void;
}

export function BoardTour({ ship, reduced, quality, lite, sound, onSound, onSkip, onFinish, onContextLost }: BoardTourProps) {
  const idx = useKb();
  const crew = useMemo(() => sceneCrew(idx, ship), [idx, ship]);
  const layout = useMemo(() => layoutFor(ship.crew), [ship.crew]);
  const walker = useMemo(() => new Walker(createWalkMap(layout), 0), [layout]);
  const screens = useMemo(() => Object.fromEntries(crew.map((m) => [m.id, screenLines(m)])), [crew]);
  const tour = layout.tour;
  const count = tour.length;

  // Where you are: a waypoint index, or null on open bridge floor. `stop` is the last waypoint you
  // were at, so Next and Back still mean something on open floor.
  const [index, setIndex] = useState<number | null>(0);
  const [stop, setStop] = useState(0);
  const [talking, setTalking] = useState<string | null>(null);
  const [met, setMet] = useState<readonly string[]>([]);
  const [found, setFound] = useState<readonly string[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  // The Inspect detail being read, tied to the waypoint it was opened at.
  const [reading, setReading] = useState<{ id: string; at: number } | null>(null);

  useEffect(() => {
    let current: number | null = 0;
    const poll = window.setInterval(() => {
      const next = walker.map.zoneAt(walker.pos, walker.yaw, current);
      if (next === current) return;
      current = next;
      setIndex(next);
      if (next !== null) setStop(next);
    }, ZONE_POLL_MS);
    return () => window.clearInterval(poll);
  }, [walker]);

  const go = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(count - 1, i));
      setTalking(null);
      walker.goTo(target, reduced);
    },
    [walker, reduced, count],
  );

  // A soft servo each time you arrive somewhere new, only once sound is on.
  const lastIndex = useRef(index);
  useEffect(() => {
    if (lastIndex.current === index) return;
    lastIndex.current = index;
    if (sound && index !== null) playOneShot('servo');
  }, [index, sound]);
  const toggleSound = useCallback(() => {
    // The click is the user gesture that lets the audio context start.
    if (!sound) void (THREE.AudioContext.getContext() as unknown as globalThis.AudioContext).resume().catch(() => undefined);
    onSound(!sound);
  }, [sound, onSound]);

  const meet = useCallback((id: string) => setMet((m) => (m.includes(id) ? m : [...m, id])), []);
  const pick = useCallback(
    (id: string) => {
      const i = tour.findIndex((w) => w.member === id);
      if (i < 0) return;
      // Clicking someone you already stand at only opens Talk; otherwise the autopilot walks there.
      if (i !== index) go(i);
      setTalking(id);
      meet(id);
      if (sound) playOneShot('click');
    },
    [go, index, meet, sound, tour],
  );
  const walkTo = useCallback((id: string) => go(tour.findIndex((w) => w.member === id)), [go, tour]);
  const inspect = useCallback(
    (detail: string) => {
      if (index === null) return;
      setReading({ id: detail, at: index });
      setFound((f) => (f.includes(detail) ? f : [...f, detail]));
    },
    [index],
  );
  const finish = useCallback(() => onFinish(layout.welcome), [onFinish, layout.welcome]);
  const { press, lockable, captured } = useTourControls({ stage, walker, index: index ?? stop, count, goTo: go, onSkip, lite });

  const wp = index === null ? null : tour[index];
  const member = wp?.member ? (crew.find((m) => m.id === wp.member) ?? null) : null;
  const last = index === count - 1;
  const metSet = new Set(met);
  const talkingHere = member && talking === member.id ? member.id : null;
  const detail = wp?.key ? (INSPECT.find((d) => d.key === wp.key) ?? null) : null;
  const foundSet = new Set(found);
  const readingDetail = reading && reading.at === index ? (INSPECT.find((d) => d.id === reading.id) ?? null) : null;
  const inspected = INSPECT.filter((d) => foundSet.has(d.id) && layout.occupied.has(d.key)).length;
  const inspectable = INSPECT.filter((d) => layout.occupied.has(d.key)).length;
  const heading = member ? member.name : wp?.id === 'airlock' ? ship.name : wp?.id === 'corridor' ? 'How the work moves' : 'The bridge';
  const welcomeName = crew.find((m) => m.id === layout.welcome)?.name ?? 'The captain';

  return (
    <div className="ship-intro" data-testid="ship-intro" data-waypoint={wp?.id ?? 'bridge'}>
      <div className="ship-intro-stage" ref={stage} data-look={lockable ? 'capture' : 'drag'}>
        <LoadingVeil name={ship.name} onSkip={onSkip} />
        <ShipScene crew={crew} layout={layout} walker={walker} reduced={reduced} quality={quality} activeMember={member?.id ?? null} welcome={last} lite={lite} screens={screens} talking={talkingHere} bubble={bubble} found={found} waypoint={index ?? stop} sound={sound} onPick={pick} onInspect={inspect} onContextLost={onContextLost} />
        {lockable &&
          (captured ? (
            <span className="ship-crosshair" data-testid="crosshair" aria-hidden="true" />
          ) : (
            <p className="ship-look-hint" data-testid="look-hint" aria-hidden="true">
              Click to look around · <kbd>Esc</kbd> to release
            </p>
          ))}

        <button type="button" className="btn btn-text ship-skip" onClick={onSkip} data-testid="skip-to-bridge">
          Skip to bridge
        </button>

        <ol className="ship-waypoints" aria-label="Walk me to">
          {tour.map((w, i) => (
            <li key={w.id}>
              <button type="button" className="ship-waypoint-btn" data-testid={`rail-${w.id}`} data-active={i === index || undefined} aria-current={i === index ? 'step' : undefined} onClick={() => go(i)}>
                <span className="ship-waypoint-dot" aria-hidden="true" />
                <span className="ship-waypoint-title">
                  {i + 1}. {w.title}
                </span>
              </button>
            </li>
          ))}
        </ol>

        {member && talkingHere && (
          <div ref={bubble} className="ship-bubble" data-hidden="true" data-testid="speech-bubble" aria-hidden="true" style={{ ['--c' as string]: member.pigment } as CSSProperties}>
            {member.analogy}
          </div>
        )}

        <div className="ship-tools">
          <button type="button" className="btn btn-quiet btn-sm ship-sound-toggle" data-testid="sound-toggle" aria-pressed={sound} onClick={toggleSound}>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
        </div>
        {lite ? (
          <WalkPad press={press} />
        ) : (
          <ControlsDisclosure lockable={lockable} />
        )}

        <article className="ship-wp-card panel-glass" key={wp?.id ?? 'bridge'} data-testid="waypoint-card" data-kind={member ? 'station' : (wp?.id ?? 'bridge')} aria-live="polite" style={{ ['--c' as string]: member?.pigment ?? '#C9473F' } as CSSProperties}>
          <header className="ship-wp-head">
            <div className="row ship-wp-meta">
              <SkewBadge tone={member ? 'cotton' : 'signal'}>{member ? `Station ${member.station}` : (wp?.title ?? 'Open floor')}</SkewBadge>
              <span className="label">
                {index === null ? (
                  ship.name
                ) : (
                  <>
                    <span className="num">{index + 1}</span> of <span className="num">{count}</span> · {member ? wp?.title : ship.name}
                  </>
                )}
              </span>
            </div>
            <h2 className="section-title ship-wp-name">{heading}</h2>
            {member && (
              <p className="ship-wp-role">
                {member.role.title} <span className="ship-eco-role">{member.role.agent}</span>
              </p>
            )}
          </header>

          {wp?.id === 'airlock' && (
            <div className="stack ship-wp-body" data-testid="boarding">
              <p className="ship-wp-lead">
                {ship.summary ? `${ship.summary} ` : ''}A crew of {crew.length} does the work, one specialist at a time. Walk down the corridor to the bridge and meet them, or pick a name to be walked there.
              </p>
              <CrewChips crew={crew} onPick={walkTo} />
            </div>
          )}
          {wp?.id === 'corridor' && <PipelineBody ship={ship} crew={crew} />}
          {index === null && (
            <div className="stack ship-wp-body" data-testid="bridge-card">
              <p className="ship-wp-lead">Walk up to anyone and face them to meet them, or pick a name to be walked there.</p>
              <CrewChips crew={crew} onPick={walkTo} met={metSet} />
            </div>
          )}

          {member && (
            <>
              <blockquote className="ship-wp-quote">
                <p>{last ? `Welcome aboard. ${member.analogy}` : `“${member.analogy}”`}</p>
                <footer className="muted sheet-line">{member.plainMeaning}</footer>
              </blockquote>
              {talking === member.id && (
                <div className="ship-wp-talk stack" data-testid="waypoint-talk">
                  <p className="ship-identity-essence">{member.essence}</p>
                  <p className="muted sheet-line">
                    Working on: {member.working}. <TruthLabel truth="Simulated" />
                  </p>
                  <div className="ship-walk-slots" data-testid="walk-slots">
                    <p className="label">
                      Carries {member.loadout.length} <TruthLabel truth="Verified" detail={`agent ${member.agent}`} />
                    </p>
                    {member.loadout.length === 0 ? (
                      <p className="muted sheet-line">Nothing yet. Equip artifacts from the bridge.</p>
                    ) : (
                      <ul className="ship-carry">
                        {member.loadout.map((a) => (
                          <li key={a.skill} data-active={a.skill === member.active || undefined}>
                            {isFamilyId(a.family) && <FamilyGlyph family={a.family} pigment={a.pigment} size={18} />}
                            <span>{a.name}</span>
                            <code>{a.skill}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {readingDetail && (
                <div className="ship-wp-talk stack" data-testid="inspect-found">
                  <p className="ship-wp-line">
                    <strong>{readingDetail.title}.</strong> {readingDetail.line}
                  </p>
                  <TruthLabel truth="Simulated" />
                </div>
              )}
              {detail && (
                <div className="world-chips">
                  <button type="button" className="world-chip" data-testid="inspect-btn" data-found={foundSet.has(detail.id) || undefined} onClick={() => inspect(detail.id)}>
                    <Icon name={foundSet.has(detail.id) ? 'check' : 'search'} size={15} />
                    {foundSet.has(detail.id) ? `Inspected: ${detail.title}` : `Inspect: ${detail.title}`}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="row ship-wp-actions">
            {last ? (
              <button type="button" className="btn btn-primary" data-testid="meet-the-crew" onClick={finish}>
                Meet the crew
              </button>
            ) : (
              <button type="button" className="btn btn-primary" data-testid="waypoint-next" onClick={() => go(stop + 1)}>
                {index === 0 ? 'Walk in' : index === 1 ? 'To the bridge' : 'Next stop'}
              </button>
            )}
            {member && (
              <button
                type="button"
                className="btn btn-quiet"
                data-testid="waypoint-talk-btn"
                aria-pressed={talking === member.id}
                onClick={() => {
                  setTalking((t) => (t === member.id ? null : member.id));
                  meet(member.id);
                  if (sound) playOneShot('click');
                }}
              >
                {metSet.has(member.id) ? 'Talk again' : 'Talk'}
              </button>
            )}
            {stop > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => go(stop - 1)}>
                Back
              </button>
            )}
          </div>
          {inspected > 0 && (
            <p className="label ship-inspected" data-testid="ship-inspected" key={inspected}>
              Ship inspected <span className="num">{inspected}</span> of <span className="num">{inspectable}</span> <TruthLabel truth="Simulated" />
            </p>
          )}
          {last && (
            <p className="muted sheet-line" style={{ margin: 0 }}>
              {welcomeName} is turning to you; the crew profile opens on them.
            </p>
          )}
        </article>
      </div>
    </div>
  );
}

/** The crew as chips; a click walks you to that member's station. */
function CrewChips({ crew, onPick, met }: { crew: readonly SceneMember[]; onPick: (id: string) => void; met?: ReadonlySet<string> }) {
  return (
    <div className="world-chips" role="group" aria-label="Crew aboard">
      {crew.map((m) => (
        <button key={m.id} type="button" className="world-chip ship-crew-chip" data-met={met?.has(m.id) || undefined} style={{ ['--c' as string]: m.pigment } as CSSProperties} onClick={() => onPick(m.id)} title={`${m.role.title}: walk me there`}>
          <span className="ship-chip-dot num" aria-hidden="true">
            {m.station}
          </span>
          {m.name}
        </button>
      ))}
    </div>
  );
}

/** Corridor: the ship's phases, the crew who own each, and the gates between them. */
function PipelineBody({ ship, crew }: { ship: Ship; crew: readonly SceneMember[] }) {
  const steps = pipelineOf(ship, crew);
  return (
    <div className="stack ship-wp-body" data-testid="pipeline">
      <p className="ship-wp-lead">Every job passes {steps.length} phases in this order. The gates are the owner&rsquo;s decisions; nobody skips ahead.</p>
      <ol className="ship-pipeline">
        {steps.map(({ phase, members, gate }, i) => (
          <li key={`${phase}-${i}`} className="ship-pipeline-step">
            <span className="ship-pipeline-phase">{PHASE_LABEL[phase]}{steps.findIndex((x) => x.phase === phase) < i ? ' (cont.)' : ''}</span>
            <span className="ship-pipeline-crew">
              {members.map((m) => (
                <span key={m.id} className="ship-pipeline-member" style={{ ['--c' as string]: m.pigment } as CSSProperties}>
                  <span className="ship-chip-dot num" aria-hidden="true">
                    {m.station}
                  </span>
                  {m.name.replace(/^Captain /, '')}
                </span>
              ))}
            </span>
            {gate && <span className="ship-pipeline-gate label">{gate}</span>}
          </li>
        ))}
      </ol>
      <TruthLabel truth="Verified" detail="the ship's voyage" />
    </div>
  );
}

/** Phones: hold to walk and strafe (drag the scene to look). Pointer capture keeps a slid thumb pressed. */
function WalkPad({ press }: { press: (key: WalkKey, on: boolean) => void }) {
  const keys: { key: WalkKey; label: string; area: string }[] = [
    { key: 'forward', label: 'Walk forward', area: 'up' },
    { key: 'left', label: 'Step left', area: 'left' },
    { key: 'right', label: 'Step right', area: 'right' },
    { key: 'back', label: 'Walk back', area: 'down' },
  ];
  return (
    <div className="ship-pad" data-testid="walk-pad">
      {keys.map((k) => (
        <button
          key={k.key}
          type="button"
          className="ship-pad-btn"
          data-area={k.area}
          aria-label={k.label}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            press(k.key, true);
          }}
          onPointerUp={() => press(k.key, false)}
          onPointerCancel={() => press(k.key, false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Icon name="arrow" size={18} />
        </button>
      ))}
    </div>
  );
}

const CONTROLS_KEY = 'convenium.shipyard.ui.controlsSeen';

/**
 * The walking controls, one "Controls" disclosure (simplicity brief B1). On a first visit it is open for
 * 4 s or until the first key is pressed, then it closes and stays closed; it is always one click away and
 * the summary is a real button, so the keyboard reaches it.
 */
function ControlsDisclosure({ lockable }: { lockable: boolean }) {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(CONTROLS_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const closeFirst = useRef(open);
  useEffect(() => {
    if (!closeFirst.current) return;
    const done = () => {
      closeFirst.current = false;
      setOpen(false);
      try {
        window.localStorage.setItem(CONTROLS_KEY, '1');
      } catch {
        /* storage unavailable: it shows again next visit */
      }
    };
    const closeAfter = window.setTimeout(done, 4000);
    const onKey = (e: KeyboardEvent) => {
      if (/^(w|a|s|d|arrow\w+| )$/i.test(e.key)) done();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(closeAfter);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <details className="ship-controls" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} data-testid="controls">
      <summary className="btn btn-quiet btn-sm">Controls</summary>
      <p className="ship-keys" data-testid="walk-keys">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> walk <kbd>&larr;</kbd>
        <kbd>&rarr;</kbd> turn <kbd>Shift</kbd> run · {lockable ? 'mouse to look, click to talk' : 'drag to look'} · <kbd>Space</kbd> next stop
      </p>
    </details>
  );
}
