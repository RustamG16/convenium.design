// The profile view's turntable: one crew member on a small canvas, wearing their artifacts, bounded
// orbit, 1 rpm autorotate (0 under reduced motion, where the canvas renders on demand). Falls back to
// the procedural stand-in if the GLB fails. Ported from ArkhEthos; Shipyard's version draws the
// loadout on the body and makes room above the head for the orbit slots.
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Anchor } from '../domain/schema';
import { ANCHOR_IDS } from '../domain/schema';
import { ORBIT_LIFT, standInOffset } from './artifacts/WornArtifacts';
import { useCallback, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { PortraitFace } from '../components/Portrait';
import { CrewFigure } from './CrewMember';
import type { SceneMember } from './crew';

/** Metres above the head the orbit ring needs in frame. */
const ORBIT_ROOM = 0.35;

/** Where each anchor of the body is on screen right now, as fractions (0..1) of the canvas; read by the drag layer to find the nearest anchor. */
export type AnchorScreen = Partial<Record<Anchor, { x: number; y: number }>>;

const ANCHOR_BONE: Record<Exclude<Anchor, 'orbit'>, string> = { hand: 'RightHand', offhand: 'LeftHand', head: 'Head', back: 'Spine02', belt: 'Hips' };

/** Projects the six anchors to the screen each frame into `out`. A rigged body uses its bones (and clears the head by the crown offset); the stand-in uses its fixed offsets. */
function AnchorProbe({ member, out }: { member: SceneMember; out: MutableRefObject<AnchorScreen> }) {
  const bones = useRef(new Map<string, THREE.Object3D | null>());
  const v = useRef(new THREE.Vector3());
  useFrame(({ scene, camera }) => {
    const h = member.model.heightM;
    const k = h / 1.8;
    for (const a of ANCHOR_IDS) {
      let ok = true;
      if (a === 'orbit') {
        v.current.set(0, h + ORBIT_LIFT, 0);
      } else if (!member.model.glb) {
        const o = standInOffset({ anchor: a, index: 1 }, h);
        v.current.set(o[0], o[1], o[2]);
      } else {
        const name = ANCHOR_BONE[a];
        let bone = bones.current.get(name);
        if (!bone) {
          bone = null;
          scene.traverse((o) => {
            if (!bone && (o as THREE.Bone).isBone && o.name === name) bone = o;
          });
          bones.current.set(name, bone);
        }
        if (bone) {
          (bone as THREE.Object3D).getWorldPosition(v.current);
          if (a === 'head') v.current.y += 0.3 * k;
        } else ok = false;
      }
      if (!ok) continue;
      v.current.project(camera);
      out.current[a] = { x: v.current.x * 0.5 + 0.5, y: -v.current.y * 0.5 + 0.5 };
    }
  });
  return null;
}

export function Turntable({ member, reduced, onContextLost, onReady, probe }: { member: SceneMember; reduced: boolean; onContextLost?: () => void; onReady?: () => void; probe?: MutableRefObject<AnchorScreen> }) {
  const hasOrbit = member.loadout.some((a) => a.anchor === 'orbit');
  // The frame is the body plus the orbit ring when something circles the head.
  const h = member.model.heightM + (hasOrbit ? ORBIT_ROOM : 0);
  const camera = useMemo(() => ({ position: [0, h * 0.6, h * 2.0] as [number, number, number], fov: 32, near: 0.05, far: 50 }), [h]);
  // Loading state: the design sheet fills the card until the model that stays on screen has mounted.
  const figureKey = `${member.id}:${member.body}`;
  const [readyKey, setReadyKey] = useState('');
  const ready = readyKey === figureKey;
  const loaded = useCallback(() => {
    setReadyKey(figureKey);
    onReady?.();
  }, [figureKey, onReady]);
  return (
    <div className="ship-turntable" data-testid="turntable" data-member={member.id} data-ready={ready} aria-label={`${member.name}, 3D turntable`} role="img" style={{ ['--c' as string]: member.pigment, position: 'relative' } as CSSProperties}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reduced ? 'demand' : 'always'}
        camera={camera}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
        onCreated={({ gl, scene, camera, get }) => {
          if (import.meta.env.DEV) (window as unknown as { __turntable?: unknown }).__turntable = { scene, camera, gl, get };
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLost?.();
          });
        }}
      >
        {/* A tiny procedural studio (three soft panels, no HDRI download): metal artifacts and the lifted GLB textures need something to reflect. */}
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[2.5, 2.5, 3]} scale={[4, 4, 1]} color="#fff2e0" />
          <Lightformer form="rect" intensity={1.2} position={[-3, 1.5, 1]} scale={[3, 5, 1]} color={member.pigment} />
          <Lightformer form="rect" intensity={1.6} position={[0, 4, -3]} scale={[6, 2, 1]} color="#fff6ea" />
        </Environment>
        <hemisphereLight args={['#fff6ea', '#2a2320', 2.4]} />
        <directionalLight position={[2, 4, 3]} intensity={4} />
        <directionalLight position={[-3, 2, -2]} intensity={1.2} color={member.pigment} />
        <directionalLight position={[0, 3, -4]} intensity={1.4} />
        {probe && <AnchorProbe member={member} out={probe} />}
        <CrewFigure key={member.id} member={member} reduced={reduced} attention={0.6} onLoaded={loaded} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[member.model.heightM * 0.45, 48]} />
          <meshStandardMaterial color="#1a1515" roughness={1} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={!reduced} autoRotateSpeed={1} minPolarAngle={0.9} maxPolarAngle={1.6} target={[0, h * 0.5, 0]} makeDefault />
      </Canvas>
      <div className="ship-turntable-veil" data-testid="turntable-veil" data-hidden={ready} aria-hidden="true">
        <PortraitFace member={member} />
      </div>
    </div>
  );
}
