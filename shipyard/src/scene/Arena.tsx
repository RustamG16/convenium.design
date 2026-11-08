// v2 Regatta arena (12-build-plan-v2 § 3): the dry race as a 3D course. One lane per ship, sailed by the
// ship's class hull (the same CC0 hulls as the hangar's fleet ring); one buoy per stage or gate. A hull
// moves only when the race's reveal step passes a buoy, so the scene is a picture of the same
// deterministic events the 2D course lists — never chance. Decorative: the canvas is aria-hidden and
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
  /** buoys passed so far, from the race's reveal step */
  passed: number;
}

const COURSE = 10;
const LANE_GAP = 1.5;
const HULL_LENGTH = 1.7;
/** camera elevation: low enough to read the hulls, high enough to see every lane */
const ELEVATION = THREE.MathUtils.degToRad(32);
const CHILI = '#d73b3e';
const COTTON = '#edebdd';
const MUTED = '#8a7f78';
const WATER = '#1f2228';

/** x of buoy j of n: spread between the start and the finish line. */
export function buoyX(j: number, n: number): number {
  const start = -COURSE / 2 + 0.9;
  const end = COURSE / 2 - 0.9;
  return n <= 1 ? end : start + ((end - start) * j) / (n - 1);
}

/** Where a hull sits: before the first buoy at the start, else on the last buoy it passed. */
export function hullX(passed: number, n: number): number {
  return passed <= 0 ? -COURSE / 2 + 0.1 : buoyX(Math.min(passed, n) - 1, n);
}

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
    // sail along the lane: the hull's long axis on x
    if (size.z > size.x) turn.rotation.y = Math.PI / 2;
    const wrap = new THREE.Group();
    wrap.add(turn);
    wrap.scale.setScalar(HULL_LENGTH / (Math.max(size.x, size.y, size.z) || 1));
    return wrap;
  }, [scene, color]);
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
  const done = lane.passed >= n;
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const g = boat.current;
    if (!g) return;
    const tween = gsap.to(g.position, { x: hullX(lane.passed, n), duration: 0.4, ease: 'power2.out', onUpdate: invalidate });
    return () => {
      tween.kill();
    };
  }, [lane.passed, n, invalidate]);
  useFrame(({ clock }) => {
    // a slow bob on the water; position along the lane comes only from the reveal step
    if (boat.current) boat.current.position.y = 0.18 + Math.sin(clock.elapsedTime * 1.6 + z) * 0.025;
  });
  return (
    <group position={[0, 0, z]}>
      {/* the lane line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[COURSE, 0.03]} />
        <meshBasicMaterial color={lane.color} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {lane.buoys.map((k, j) => (
        <Buoy key={j} kind={k} x={buoyX(j, n)} passed={j < lane.passed} color={lane.color} />
      ))}
      {/* the finish post lights up in the lane's colour when the ship finishes: the only celebration */}
      <mesh position={[COURSE / 2 - 0.2, 0.35, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 12]} />
        <meshStandardMaterial color={done ? lane.color : COTTON} emissive={done ? lane.color : '#000000'} emissiveIntensity={done ? 1.2 : 0} />
      </mesh>
      <group ref={boat} position={[hullX(0, n), 0.18, 0]}>
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
    const dist = Math.max(5, (COURSE + 0.8) / aspect / (2 * half), depth / (2 * half));
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
        {[-COURSE / 2, COURSE / 2 - 0.2].map((x) => (
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
