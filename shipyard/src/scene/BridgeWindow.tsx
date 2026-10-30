// The bridge window behind the captain: a RenderTexture of drifting stars and a faint nebula
// glow, dimmed so it reads as deep space rather than a light source. Under reduced motion or at
// quality low it renders once and holds still.
import { PerspectiveCamera, RenderTexture, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { BRIDGE } from './stations';

function Space({ animate }: { animate: boolean }) {
  const stars = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (animate && stars.current) stars.current.rotation.y += delta * 0.01;
  });
  return (
    <>
      <PerspectiveCamera makeDefault manual aspect={2.2 / 1.4} position={[0, 0, 5]} fov={50} />
      <color attach="background" args={['#05040A']} />
      <group ref={stars}>
        <Stars radius={60} depth={30} count={1800} factor={3.2} saturation={0.2} fade speed={animate ? 0.4 : 0} />
      </group>
      {/* A soft warm nebula patch, far behind the stars. */}
      <mesh position={[-6, 3, -40]}>
        <circleGeometry args={[14, 32]} />
        <meshBasicMaterial color="#3A1E2A" transparent opacity={0.35} />
      </mesh>
    </>
  );
}

export function BridgeWindow({ animate }: { animate: boolean }) {
  const w = 2.2;
  const h = 1.4;
  const z = BRIDGE.zBack + 0.05;
  return (
    <group position={[0, 2.35, z]}>
      <mesh name="bridge-window">
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial toneMapped={false} color="#B8B0C8">
          <RenderTexture attach="map" width={512} height={326} frames={animate ? Infinity : 1}>
            <Space animate={animate} />
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
      {/* Frame: four dark bars. */}
      {[
        [0, h / 2 + 0.05, w + 0.2, 0.1],
        [0, -h / 2 - 0.05, w + 0.2, 0.1],
        [-w / 2 - 0.05, 0, 0.1, h],
        [w / 2 + 0.05, 0, 0.1, h],
      ].map(([x, y, sw, sh], i) => (
        <mesh key={i} position={[x, y, 0.04]}>
          <boxGeometry args={[sw, sh, 0.08]} />
          <meshStandardMaterial color="#2A2423" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
