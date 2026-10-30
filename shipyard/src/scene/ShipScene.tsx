// The intro's canvas: interior, the seven crew at their stations, lights, fog and the walking
// camera. Canvas settings follow the universe scene (dpr by quality, dark clear colour, context
// loss reported upward so the page can fall back to the profile view).
import { OrbitControls, useCursor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { CorridorDust, ReflectorFloor, ShipEffects, ShipPerf, WeldRig } from './Atmosphere';
import { ModelBoundary } from './common';
import type { SceneMember } from './crew';
import { CrewFigure, ProceduralCrew } from './CrewMember';
import { CrewSheet } from './CrewSheet';
import { HoloScreen } from './HoloScreen';
import { BubbleAnchor, CrewHotspot, InspectSpots } from './Hotspots';
import { ShipInterior } from './ShipInterior';
import { ShipSound } from './ShipSound';
import { screenPose, type Layout } from './stations';
import { WalkCamera, type Walker } from './Walker';

export interface ShipSceneProps {
  crew: readonly SceneMember[];
  /** where the crew stand and the order the walk visits them */
  layout: Layout;
  walker: Walker;
  reduced: boolean;
  quality: 'low' | 'high';
  /** The member the camera is at (gets full attention; the captain also turns for the welcome). */
  activeMember: string | null;
  welcome: boolean;
  /** Phones: lite decor, dpr 1, no postprocessing. */
  lite?: boolean;
  /** Lines on each member's holo screen (their slots and current choice). */
  screens?: Record<string, readonly string[]>;
  /** The member whose Talk is open: the speech bubble follows their head. */
  talking?: string | null;
  bubble?: RefObject<HTMLElement | null>;
  /** Inspect details already found. */
  found?: readonly string[];
  /** The current (or last visited) waypoint index (phones keep GLBs only for the nearest three members). */
  waypoint?: number;
  /** Sound opted in. */
  sound?: boolean;
  onPick?: (memberId: string) => void;
  onInspect?: (detailId: string) => void;
  onContextLost: () => void;
  onReady?: () => void;
}

/** Dev-only: `?dbg=orbit` replaces the walk with an orbit camera from above, to check placement. */
const DEBUG_ORBIT = import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('dbg=orbit');
/** Dev-only: `?dbg=high` keeps quality high (software GL in headless QA would drop it at once). */
const DEBUG_HIGH = import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('dbg=high');

export function ShipScene({ crew, layout, walker, reduced, quality, activeMember, welcome, lite = false, screens = {}, talking = null, bubble, found = [], waypoint = 0, sound = false, onPick, onInspect, onContextLost, onReady }: ShipSceneProps) {
  // The performance monitor can lower the tier for this visit; it never raises it.
  const [dropped, setDropped] = useState(false);
  const high = quality === 'high' && !lite && !dropped;
  const animate = !reduced;
  const [hovered, setHovered] = useState<string | null>(null);
  useCursor(hovered !== null);
  const heads = useMemo(() => new Map<string, THREE.Object3D>(), []);
  // Phones: the three crew waypoints nearest the camera keep their rigged GLB; the rest are sheets.
  const near = useMemo(() => nearestMembers(layout, waypoint, 3), [layout, waypoint]);
  // Loading budget (DESIGN.md > Performance): the captain and the two stations before him in the tour
  // load first (about 3.5 MB); the rest stream in once the first frames are up.
  const first = useMemo(() => firstMembers(layout, 3), [layout]);
  const [streamed, setStreamed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setStreamed(true), 1500);
    return () => window.clearTimeout(id);
  }, []);
  // The welcome glance (DESIGN: after the captain turns, 700 ms, everyone looks at you for 1 s).
  const [glance, setGlance] = useState(false);
  useEffect(() => {
    if (!welcome) return;
    const on = window.setTimeout(() => setGlance(true), reduced ? 0 : 700);
    const off = window.setTimeout(() => setGlance(false), (reduced ? 0 : 700) + 1000);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
      setGlance(false);
    };
  }, [welcome, reduced]);
  return (
    <Canvas
      className="ship-canvas"
      dpr={quality === 'high' && !lite ? [1, 1.5] : 1}
      frameloop="always"
      camera={{ position: DEBUG_ORBIT ? [14, 18, 14] : [0, 1.6, 22.5], fov: 62, near: 0.1, far: 80 }}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl, scene, camera }) => {
        gl.setClearColor('#0F0C0C');
        if (import.meta.env.DEV) (window as unknown as { __ship?: unknown }).__ship = { scene, camera, gl, THREE, walker };
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onContextLost();
        });
        onReady?.();
      }}
    >
      {!DEBUG_ORBIT && <fog attach="fog" args={['#0F0C0C', 22, 70]} />}
      {DEBUG_ORBIT && <ambientLight intensity={1.5} />}
      <hemisphereLight args={['#FFE7C8', '#141010', 1.2]} />
      <directionalLight position={[4, 8, -2]} intensity={1.6} color="#FFF1DE" />
      <pointLight position={[0, 3.6, -5]} intensity={28} distance={16} decay={2} color="#FFE2B0" />
      {[22, 16, 10, 5].map((z) => (
        <pointLight key={z} position={[0, 3.3, z]} intensity={16} distance={11} decay={2} color="#F2B65A" />
      ))}
      <ShipInterior lite={lite} animate={animate} gauge={layout.occupied.has('gauge')} />
      {high && animate && <CorridorDust animate />}
      {high && animate && <WeldRig />}
      {high && <ReflectorFloor />}
      {high && <ShipEffects />}
      {quality === 'high' && !lite && animate && !dropped && !DEBUG_HIGH && <ShipPerf onDrop={() => setDropped(true)} />}
      {crew.map((m) => {
        const key = layout.keyOf(m.id);
        const s = layout.stationOf(m.id);
        if (!s || !key) return null;
        const active = m.id === activeMember;
        const attention = active || glance ? 1 : 0.25;
        const stand = <ProceduralCrew member={m} reduced={reduced} />;
        return (
          <group key={m.id} position={s.position}>
            {lite && !near.has(m.id) && m.model.sheet ? (
              <Suspense fallback={stand}>
                <ModelBoundary fallback={stand}>
                  <CrewSheet member={m} />
                </ModelBoundary>
              </Suspense>
            ) : !streamed && !first.has(m.id) ? (
              stand
            ) : (
              <CrewFigure member={m} reduced={reduced} yaw={s.yaw} attention={attention} faceCamera={welcome && m.id === layout.welcome ? 1 : 0} outline={hovered === m.id ? m.pigment : null} heads={heads} />
            )}
            <pointLight position={[0, 2.6, 0]} intensity={active ? 10 : 4} distance={5} decay={2} color={m.pigment} />
            {(() => {
              const pose = screenPose(key);
              return (
                <group position={[-s.position[0], 0, -s.position[2]]}>
                  <HoloScreen position={pose.position} yaw={pose.yaw} color={m.pigment} title={m.role.title} lines={screens[m.id] ?? [m.working]} reduced={reduced} active={active} />
                </group>
              );
            })()}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 0.8, 40]} />
              <meshBasicMaterial color={m.pigment} transparent opacity={active ? 0.9 : 0.3} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {onPick &&
        crew.map((m) => {
          const key = layout.keyOf(m.id);
          return key ? <CrewHotspot key={`h-${m.id}`} member={m} stationKey={key} hovered={hovered === m.id} onHover={setHovered} onPick={onPick} /> : null;
        })}
      {onInspect && <InspectSpots found={found} onInspect={onInspect} animate={animate} occupied={layout.occupied} />}
      {sound && <ShipSound />}
      <CrosshairAim />
      {bubble && <BubbleAnchor bubble={bubble} memberId={talking} heads={heads} crew={crew} layout={layout} />}
      {DEBUG_ORBIT ? <OrbitControls makeDefault target={[0, 0, -4]} /> : <WalkCamera walker={walker} reduced={reduced} framePitch={lite ? 0.24 : 0} />}
    </Canvas>
  );
}

/**
 * While the mouse is captured, hover and click aim from the centre of the view (the crosshair)
 * instead of the frozen cursor position. Walking with the keys moves the view under a still
 * mouse, so the aim is refreshed every frame while captured.
 */
function CrosshairAim() {
  const setEvents = useThree((s) => s.setEvents);
  useEffect(() => {
    setEvents({
      compute: (event, state) => {
        if (document.pointerLockElement) state.pointer.set(0, 0);
        else state.pointer.set((event.offsetX / state.size.width) * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1);
        state.raycaster.setFromCamera(state.pointer, state.camera);
      },
    });
  }, [setEvents]);
  useFrame((state) => {
    if (document.pointerLockElement) state.events.update?.();
  });
  return null;
}

/** The welcome member and the stations just before them in the tour: what loads first. */
export function firstMembers(layout: Layout, n: number): Set<string> {
  const members = layout.tour.flatMap((w) => (w.member ? [w.member] : []));
  return new Set(members.slice(-n));
}

/** Member ids of the `n` station waypoints closest (in tour order) to waypoint `i`. */
export function nearestMembers(layout: Layout, i: number, n: number): Set<string> {
  return new Set(
    layout.tour
      .map((w, k) => ({ id: w.member, d: Math.abs(k - i) }))
      .filter((x): x is { id: string; d: number } => Boolean(x.id))
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((x) => x.id),
  );
}
