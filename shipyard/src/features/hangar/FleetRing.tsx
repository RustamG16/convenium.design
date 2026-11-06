// The hangar's fleet ring in 3D (06 section 4.1): every ship of the fleet as its class hull (the five
// CC0 Quaternius hulls from ArkhEthos, fitted to one unit and tinted toward ash metal like the
// factory's), on a ring that turns the focused ship to the front. A single ship sits at the front, a
// ring of one. Decorative: the DOM cards are the controls and the canvas is aria-hidden; a click on a
// hull moves focus to its card. Tweens are GSAP (motion/react is not used). Reduced motion: the ring
// jumps, hulls do not spin, the canvas renders on demand.
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { withBase } from '../../lib/baseUrl';
import { disposeMaterials } from '../../scene/common';

export interface FleetItem {
  id: string;
  hull: string;
  pigment: string;
}

const RING_RADIUS = 3.4;
/** Hull length in scene units; the camera is set so a hull seen side-on fills about 80% of the stage width. */
const HULL_LENGTH = 3.6;
const RING_Y = -0.5;

function Hull({ hull, pigment, spin, focused, onPick }: { hull: string; pigment: string; spin: boolean; focused: boolean; onPick: () => void }) {
  const { scene } = useGLTF(withBase(`/media/ships/${hull}.glb`));
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const src = mesh.material as THREE.MeshStandardMaterial;
        mesh.material = new THREE.MeshStandardMaterial({ map: src.map ?? null, color: '#A79B92', metalness: 0.6, roughness: 0.45, emissive: '#1A1412' });
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    clone.position.sub(box.getCenter(new THREE.Vector3()));
    const wrap = new THREE.Group();
    wrap.add(clone);
    wrap.scale.setScalar(HULL_LENGTH / longest);
    return wrap;
  }, [scene]);
  useEffect(() => () => disposeMaterials(model), [model]);
  const turn = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin && turn.current) turn.current.rotation.y += dt * 0.3;
  });
  return (
    <group ref={turn} rotation={[0, 0.6, 0]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <primitive object={model} />
      </group>
      {focused && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, RING_Y, 0]}>
          <ringGeometry args={[1.95, 2.0, 96]} />
          <meshBasicMaterial color={pigment} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Ring({ ships, focusId, reduced, onPick }: { ships: FleetItem[]; focusId: string | null; reduced: boolean; onPick: (id: string) => void }) {
  const ring = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const n = ships.length;
  const angleOf = (i: number) => (n > 1 ? (i / n) * Math.PI * 2 : 0);
  const radius = n > 1 ? RING_RADIUS : 0;
  const index = Math.max(0, ships.findIndex((s) => s.id === focusId));
  useEffect(() => {
    const g = ring.current;
    if (!g) return;
    const target = -angleOf(index);
    if (reduced) {
      g.rotation.y = target;
      invalidate();
      return;
    }
    // shortest way round
    const turn = THREE.MathUtils.euclideanModulo(target - g.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    const tween = gsap.to(g.rotation, { y: g.rotation.y + turn, duration: 0.7, ease: 'power3.out', onUpdate: invalidate });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, n, reduced, invalidate]);
  return (
    <group ref={ring} position={[0, 0, -radius]}>
      {ships.map((s, i) => (
        <group key={s.id} position={[Math.sin(angleOf(i)) * radius, 0, Math.cos(angleOf(i)) * radius]}>
          <Hull hull={s.hull} pigment={s.pigment} spin={!reduced} focused={i === index} onPick={() => onPick(s.id)} />
        </group>
      ))}
    </group>
  );
}

export default function FleetRing({ ships, focusId, reduced, onPick, onContextLost }: { ships: FleetItem[]; focusId: string | null; reduced: boolean; onPick: (id: string) => void; onContextLost?: () => void }) {
  return (
    <div className="fleet-ring" data-testid="fleet-ring" data-count={ships.length} data-focus={focusId ?? undefined} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reduced ? 'demand' : 'always'}
        camera={{ position: [0, 1.5, 6.4], fov: 32, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl, scene, camera }) => {
          if (import.meta.env.DEV) (window as unknown as { __fleet?: unknown }).__fleet = { scene, camera };
          camera.lookAt(0, -0.15, 0);
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLost?.();
          });
        }}
      >
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[2.5, 2.5, 3]} scale={[4, 4, 1]} color="#fff2e0" />
          <Lightformer form="rect" intensity={1.2} position={[-3, 1.5, 1]} scale={[3, 5, 1]} color="#D9A441" />
          <Lightformer form="rect" intensity={1.6} position={[0, 4, -3]} scale={[6, 2, 1]} color="#fff6ea" />
        </Environment>
        <hemisphereLight args={['#fff6ea', '#2a2320', 2]} />
        <directionalLight position={[2, 4, 3]} intensity={3} />
        <Ring ships={ships} focusId={focusId} reduced={reduced} onPick={onPick} />
      </Canvas>
    </div>
  );
}
