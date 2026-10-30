// The profile view's turntable: one crew member on a small canvas, wearing their artifacts, bounded
// orbit, 1 rpm autorotate (0 under reduced motion, where the canvas renders on demand). Falls back to
// the procedural stand-in if the GLB fails. Ported from ArkhEthos; Shipyard's version draws the
// loadout on the body and makes room above the head for the orbit slots.
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { CrewFigure } from './CrewMember';
import type { SceneMember } from './crew';

/** Metres above the head the orbit ring needs in frame. */
const ORBIT_ROOM = 0.25;

export function Turntable({ member, reduced, onContextLost, onReady }: { member: SceneMember; reduced: boolean; onContextLost?: () => void; onReady?: () => void }) {
  const hasOrbit = member.loadout.some((a) => a.anchor === 'orbit');
  // The frame is the body plus the orbit ring when something circles the head.
  const h = member.model.heightM + (hasOrbit ? ORBIT_ROOM : 0);
  const camera = useMemo(() => ({ position: [0, h * 0.62, h * 1.7] as [number, number, number], fov: 32, near: 0.05, far: 50 }), [h]);
  return (
    <div className="ship-turntable" data-testid="turntable" data-member={member.id} aria-label={`${member.name}, 3D turntable`} role="img">
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
          onReady?.();
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
        <CrewFigure key={member.id} member={member} reduced={reduced} attention={0.6} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[member.model.heightM * 0.45, 48]} />
          <meshStandardMaterial color="#1a1515" roughness={1} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={!reduced} autoRotateSpeed={1} minPolarAngle={0.9} maxPolarAngle={1.6} target={[0, h * 0.5, 0]} makeDefault />
      </Canvas>
    </div>
  );
}
