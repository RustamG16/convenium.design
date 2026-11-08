// v2 Regatta arena (12-build-plan-v2 § 3): the dry race as a 3D course. The course is 100 points long:
// every lane is revealed over the same beats and each ship sails as far as its score, so the order on
// the water is always the order of the scores (finish review v2, M3). One buoy per stage or gate, spread
// along the stretch the ship reaches. Only the winner's post lights at the finish. Everything here comes
// from the race's deterministic reveal step — never chance. Decorative: the canvas is aria-hidden and
// the 2D course beside it carries every number. Not rendered without WebGL, with `?2d`, or under
// reduced motion (the parent decides); then the 2D course is the static board.
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { withBase } from '../lib/baseUrl';
import { disposeMaterials } from './common';

export type BuoyKind = 'scores' | 'plain' | 'gate' | 'gate-req';

export interface ArenaLane {
  ship: string;
  hull: string;
  /** lane colour, a hex token value (the 2D course uses the same swatches) */
  color: string;
  buoys: BuoyKind[];
  /** the ship's total / 100: how far along the course it finishes */
  reach: number;
  /** 0..1, the race's reveal progress, the same for every lane */
  progress: number;
  winner: boolean;
}

const COURSE = 10;
const LANE_GAP = 1.2;
const HULL_LENGTH = 1.15;
/** the widest a hull may be across its lane: clear of the buoys at BUOY_Z (re-review v2: wide-winged hulls read as sailing sideways) */
const HULL_BEAM = 0.9;
/** buoys ride this far to one side of the hull's path */
const BUOY_Z = 0.5;
/** camera elevation: high enough that the lead reads across lanes at a glance (re-review v2, n-e), low enough to read the hulls */
const ELEVATION = THREE.MathUtils.degToRad(40);
const CHILI = '#d73b3e';
const COTTON = '#edebdd';
const MUTED = '#8a7f78';
const WATER = '#1f2228';

/** The start and the finish line (100 points). */
export const START_X = -COURSE / 2 + 0.6;
export const FINISH_X = COURSE / 2 - 0.6;
const along = (frac: number) => START_X + (FINISH_X - START_X) * Math.max(0, Math.min(1, frac));

/** x of buoy j of n: spread evenly over the stretch the ship reaches. */
export function buoyX(j: number, n: number, reach: number): number {
  return along((reach * (j + 1)) / Math.max(1, n));
}

/** One scale for a hull: as long as HULL_LENGTH, unless its beam would then cross into the buoys. */
export function hullScale(length: number, beam: number): number {
  return Math.min(HULL_LENGTH / (length || 1), HULL_BEAM / (beam || 1));
}

/** Where a hull sits: its score's share of the course, times the race's progress. */
export function hullX(reach: number, progress: number): number {
  return along(reach * progress);
}

/**
 * The yaw that points each CC0 hull's bow down the course (+x). The kit models every hull nose along
 * +z, and some are wider than they are long, so the heading cannot be guessed from the bounds (checked
 * from above in the arena, finish review v2 m4). A hull missing here keeps the kit's heading.
 */
const HEADING: Record<string, number> = { 'ship-a': Math.PI / 2, 'ship-b': Math.PI / 2, 'ship-c': Math.PI / 2, 'ship-d': Math.PI / 2 };

function HullModel({ hull, color }: { hull: string; color: string }) {
  const { scene } = useGLTF(withBase(`/media/ships/${hull}.glb`));
  const model = useMemo(() => {
    // ship-e is rigged: a plain clone would stay bound to the original's bones
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const src = mesh.material as THREE.MeshStandardMaterial;
        // ash metal like the hangar's, with a faint glow in the lane's colour so each ship reads as its lane
        mesh.material = new THREE.MeshStandardMaterial({ map: src.map ?? null, color: '#C9BEB5', metalness: 0.45, roughness: 0.4, emissive: color, emissiveIntensity: 0.22 });
      }
    });
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.sub(box.getCenter(new THREE.Vector3()));
    const turn = new THREE.Group();
    turn.add(clone);
    // sail bow first down the lane
    turn.rotation.y = HEADING[hull] ?? 0;
    turn.updateMatrixWorld(true);
    // measured after the turn: x is the length down the course, z the beam across the lane
    const size = new THREE.Box3().setFromObject(turn).getSize(new THREE.Vector3());
    const wrap = new THREE.Group();
    wrap.add(turn);
    wrap.scale.setScalar(hullScale(size.x, size.z));
    return wrap;
  }, [scene, color, hull]);
  useEffect(() => () => disposeMaterials(model), [model]);
  return <primitive object={model} />;
}

function Buoy({ kind, x, passed, color }: { kind: BuoyKind; x: number; passed: boolean; color: string }) {
  const tint = kind === 'scores' ? color : kind === 'gate-req' ? CHILI : MUTED;
  const gate = kind === 'gate' || kind === 'gate-req';
  return (
    <mesh position={[x, gate ? 0.16 : 0.09, 0]} rotation={gate ? [0, Math.PI / 4, 0] : [0, 0, 0]}>
      {gate ? <octahedronGeometry args={[0.15]} /> : <sphereGeometry args={[0.09, 20, 12]} />}
      <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={passed ? 0.9 : 0.08} roughness={0.5} transparent opacity={passed ? 1 : 0.45} />
    </mesh>
  );
}

function Lane({ lane, z }: { lane: ArenaLane; z: number }) {
  const boat = useRef<THREE.Group>(null);
  const n = lane.buoys.length;
  const done = lane.progress >= 1;
  const passed = Math.min(n, Math.floor(lane.progress * n + 1e-9));
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const g = boat.current;
    if (!g) return;
    const tween = gsap.to(g.position, { x: hullX(lane.reach, lane.progress), duration: 0.6, ease: 'power1.inOut', onUpdate: invalidate });
    return () => {
      tween.kill();
    };
  }, [lane.reach, lane.progress, invalidate]);
  useFrame(({ clock }) => {
    // a slow bob on the water; position along the lane comes only from the score and the reveal step
    if (boat.current) boat.current.position.y = 0.16 + Math.sin(clock.elapsedTime * 1.6 + z) * 0.02;
  });
  const won = done && lane.winner;
  return (
    <group position={[0, 0, z]}>
      {/* the lane line, start to the 100-point finish */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(START_X + FINISH_X) / 2, 0.005, 0]}>
        <planeGeometry args={[FINISH_X - START_X, 0.03]} />
        <meshBasicMaterial color={lane.color} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {/* buoys ride beside the hull's path, so a passing hull never hides one */}
      <group position={[0, 0, -BUOY_Z]}>
        {lane.buoys.map((k, j) => (
          <Buoy key={j} kind={k} x={buoyX(j, n, lane.reach)} passed={j < passed} color={lane.color} />
        ))}
      </group>
      {/* the finish post: only the winner's lights, with a pennant — the one celebration */}
      <mesh position={[FINISH_X, 0.35, 0.34]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 12]} />
        <meshStandardMaterial color={won ? lane.color : '#5a524d'} emissive={won ? lane.color : '#000000'} emissiveIntensity={won ? 1.3 : 0} />
      </mesh>
      {won && (
        <mesh position={[FINISH_X + 0.22, 0.58, 0.34]}>
          <planeGeometry args={[0.4, 0.22]} />
          <meshBasicMaterial color={lane.color} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
      <group ref={boat} position={[hullX(lane.reach, 0), 0.16, 0]}>
        <HullModel hull={lane.hull} color={lane.color} />
      </group>
    </group>
  );
}

/** Camera distance along the elevation ray; with an orthographic camera it sets no scale, only the fog's reach. */
const CAMERA_DIST = 12;

/**
 * The visible size, in scene units, that must fit: the course plus a hull length past each end (a hull
 * on the finish line is never cropped), and every lane's depth foreshortened by the elevation plus the
 * posts' height.
 */
export function arenaExtent(lanes: number): { width: number; height: number } {
  return { width: COURSE + 2 * HULL_LENGTH + 0.4, height: lanes * LANE_GAP * Math.sin(ELEVATION) + 1.4 };
}

/** Pixels per scene unit that keep the whole course in frame at any stage aspect. */
export function arenaZoom(px: { width: number; height: number }, lanes: number): number {
  const e = arenaExtent(lanes);
  return Math.min(px.width / e.width, px.height / e.height);
}

/**
 * Keeps the whole course in frame. The camera is orthographic, so there is no perspective: the same
 * score sits at the same x on screen in every lane, and the lead reads at a glance (re-review 2, n-e).
 */
function Fit({ lanes }: { lanes: number }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.zoom = arenaZoom(size, lanes);
    camera.position.set(0, CAMERA_DIST * Math.sin(ELEVATION), CAMERA_DIST * Math.cos(ELEVATION));
    camera.lookAt(0, 0.25, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, lanes, invalidate]);
  return null;
}

export default function Arena({ lanes, onContextLost }: { lanes: ArenaLane[]; onContextLost?: () => void }) {
  const z0 = -((lanes.length - 1) * LANE_GAP) / 2;
  return (
    <div className="rg-arena" data-testid="rg-arena" data-lanes={lanes.length} data-winners={lanes.filter((l) => l.winner).length} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        orthographic
        camera={{ position: [0, 7.7, 9.2], zoom: 80, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl, scene, camera }) => {
          if (import.meta.env.DEV) (window as unknown as { __arena?: unknown }).__arena = { scene, camera };
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLost?.();
          });
        }}
      >
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[2.5, 3, 3]} scale={[5, 4, 1]} color="#fff2e0" />
          <Lightformer form="rect" intensity={1.1} position={[-4, 1.5, 1]} scale={[3, 5, 1]} color="#D9A441" />
        </Environment>
        <hemisphereLight args={['#fff6ea', '#1b1717', 1.6]} />
        <directionalLight position={[3, 6, 4]} intensity={2.6} />
        {/* the course sits 8–16 units from the camera: the fog only softens the far water */}
        <fog attach="fog" args={['#1b1717', 20, 40]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color={WATER} metalness={0.35} roughness={0.55} />
        </mesh>
        {/* start and finish lines */}
        {[START_X, FINISH_X].map((x) => (
          <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, 0]}>
            <planeGeometry args={[0.04, lanes.length * LANE_GAP + 0.6]} />
            <meshBasicMaterial color={COTTON} transparent opacity={0.55} toneMapped={false} />
          </mesh>
        ))}
        <Fit lanes={lanes.length} />
        {lanes.map((l, i) => (
          <Lane key={l.ship} lane={l} z={z0 + i * LANE_GAP} />
        ))}
      </Canvas>
    </div>
  );
}
