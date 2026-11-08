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
const LANE_GAP = 1.5;
const HULL_LENGTH = 1.15;
/** camera elevation: low enough to read the hulls, high enough to see every lane */
const ELEVATION = THREE.MathUtils.degToRad(32);
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
    const size = box.getSize(new THREE.Vector3());
    clone.position.sub(box.getCenter(new THREE.Vector3()));
    const turn = new THREE.Group();
    turn.add(clone);
    // sail bow first down the lane
    turn.rotation.y = HEADING[hull] ?? 0;
    const wrap = new THREE.Group();
    wrap.add(turn);
    wrap.scale.setScalar(HULL_LENGTH / (Math.max(size.x, size.y, size.z) || 1));
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
      <group position={[0, 0, -0.34]}>
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

/** Keeps the whole course in frame at any stage aspect. */
function Fit({ lanes }: { lanes: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // the lanes' depth is foreshortened by the elevation; the course length must fit the width
    const depth = lanes * LANE_GAP * Math.sin(ELEVATION) + 1.2;
    // + a hull length past each end, so a hull on the finish line is never cropped
    const dist = Math.max(5, (COURSE + 2 * HULL_LENGTH) / aspect / (2 * half), depth / (2 * half));
    camera.position.set(0, dist * Math.sin(ELEVATION), dist * Math.cos(ELEVATION));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, lanes, invalidate]);
  return null;
}

export default function Arena({ lanes, onContextLost }: { lanes: ArenaLane[]; onContextLost?: () => void }) {
  const z0 = -((lanes.length - 1) * LANE_GAP) / 2;
  return (
    <div className="rg-arena" data-testid="rg-arena" data-lanes={lanes.length} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 6, 8], fov: 30, near: 0.1, far: 60 }}
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
        <fog attach="fog" args={['#1b1717', 14, 34]} />
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
