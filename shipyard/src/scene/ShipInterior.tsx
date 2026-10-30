// The inside of the ship: a corridor of CC0 Kenney pieces running to a wide bridge, station props
// per crew member, amber strip lights and a pulsing weld glow in the build bay. Every kit piece sits
// behind ModelBoundary with a procedural box stand-in so a missing file never empties the room.
import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { withBase } from '../lib/baseUrl';
import { BridgeWindow } from './BridgeWindow';
import { ModelBoundary } from './common';
import { Decor } from './Decor';
import kit from './ship-kit.json';
import { BRIDGE, CORRIDOR, STATIONS, type StationKey } from './stations';

const ASH = new THREE.Color('#A79B92');
const DARK = new THREE.Color('#2A2423');

export type PieceId = (typeof kit.pieces)[number]['id'];
const piece = (id: PieceId) => kit.pieces.find((p) => p.id === id)!;

/** One kit piece, tinted toward the ship's ash metal; textures stay for the detail. */
export function Piece({ id, position, rotation = [0, 0, 0], scale = 1, tint }: { id: PieceId; position: [number, number, number]; rotation?: [number, number, number]; scale?: number | [number, number, number]; tint?: string }) {
  const { scene } = useGLTF(withBase(piece(id).file));
  useEffect(() => {
    // Materials are shared per file (useGLTF caches the scene): use one tint per piece id.
    const target = tint ? new THREE.Color(tint) : ASH;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        if (std.isMeshStandardMaterial && !std.userData.shipTinted) {
          std.color.lerp(target, tint ? 0.75 : 0.35);
          std.roughness = 0.85;
          // No environment map in here: full metal would render black.
          std.metalness = Math.min(std.metalness, 0.3);
          std.userData.shipTinted = true;
        }
      }
    });
  }, [scene, tint]);
  return <Clone object={scene} position={position} rotation={rotation} scale={scale} />;
}

function Box({ position, size, color = DARK, emissive }: { position: [number, number, number]; size: [number, number, number]; color?: THREE.Color | string; emissive?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 1.2 : 0} />
    </mesh>
  );
}

function Strip({ position, length, color = '#F2B65A' }: { position: [number, number, number]; length: number; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.06, 0.05, length]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** Corridor: floor, walls, ceiling, two airlock frames, conduits along the left wall. */
function Corridor() {
  const tiles = useMemo(() => {
    const out: number[] = [];
    for (let z = CORRIDOR.zEnd + 2; z <= CORRIDOR.zStart - 2; z += 4) out.push(z);
    return out;
  }, []);
  return (
    <group>
      {tiles.map((z) => (
        <group key={z}>
          <Piece id="corridor-floor" position={[0, 0, z]} />
          <Piece id="corridor-wall" position={[-CORRIDOR.halfWidth, 0, z]} rotation={[0, Math.PI / 2, 0]} />
          <Piece id="corridor-wall" position={[CORRIDOR.halfWidth, 0, z]} rotation={[0, -Math.PI / 2, 0]} />
          {z % 8 === 0 && <Piece id="conduit-cables" position={[-CORRIDOR.halfWidth + 0.15, 2.6, z]} rotation={[0, Math.PI / 2, 0]} />}
          <Strip position={[-CORRIDOR.halfWidth + 0.08, 1.1, z]} length={3.6} />
          <Strip position={[CORRIDOR.halfWidth - 0.08, 1.1, z]} length={3.6} />
        </group>
      ))}
      {/* Corridor ceiling: a dark plane with one warm strip; the kit's "wall-top" piece is a wall, not a lid. */}
      <mesh position={[0, BRIDGE.height - 0.6, (CORRIDOR.zStart + CORRIDOR.zEnd) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR.halfWidth * 2 + 0.4, CORRIDOR.zStart - CORRIDOR.zEnd]} />
        <meshStandardMaterial color="#1E1918" roughness={1} />
      </mesh>
      <Strip position={[0, BRIDGE.height - 0.66, (CORRIDOR.zStart + CORRIDOR.zEnd) / 2]} length={CORRIDOR.zStart - CORRIDOR.zEnd - 2} color="#FFE2B0" />
      <Piece id="airlock-frame" position={[0, 0, CORRIDOR.zStart - 0.5]} />
      <Piece id="airlock-frame" position={[0, 0, CORRIDOR.zEnd + 0.5]} />
    </group>
  );
}

/** Bridge: a floor of tiles, back and side walls with windows, pillars, and the station props. */
function Bridge({ gauge }: { gauge: boolean }) {
  const floor = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = BRIDGE.xMin + 2; x <= BRIDGE.xMax - 2; x += 4) for (let z = BRIDGE.zBack + 2; z <= BRIDGE.zFront - 2; z += 4) out.push([x, z]);
    return out;
  }, []);
  const backWall = useMemo(() => {
    const out: number[] = [];
    for (let x = BRIDGE.xMin + 2; x <= BRIDGE.xMax - 2; x += 4) out.push(x);
    return out;
  }, []);
  const sideWall = useMemo(() => {
    const out: number[] = [];
    for (let z = BRIDGE.zBack + 2; z <= BRIDGE.zFront - 2; z += 4) out.push(z);
    return out;
  }, []);
  return (
    <group>
      {floor.map(([x, z]) => (
        <Piece key={`f${x}${z}`} id="corridor-floor" position={[x, 0, z]} />
      ))}
      {backWall.map((x) => (
        <group key={`b${x}`}>
          <Piece id="wall-panel" position={[x, 0, BRIDGE.zBack]} />
          <Piece id="window-frame" position={[x, 1.8, BRIDGE.zBack + 0.3]} scale={1.6} />
        </group>
      ))}
      {sideWall.map((z) => (
        <group key={`s${z}`}>
          <Piece id="corridor-wall" position={[BRIDGE.xMin, 0, z]} rotation={[0, Math.PI / 2, 0]} />
          <Piece id="corridor-wall" position={[BRIDGE.xMax, 0, z]} rotation={[0, -Math.PI / 2, 0]} />
        </group>
      ))}
      {/* Front wall either side of the corridor mouth. */}
      {[-6, 6].map((x) => (
        <Piece key={`fw${x}`} id="wall-panel" position={[x, 0, BRIDGE.zFront]} />
      ))}
      {[
        [BRIDGE.xMin + 1, BRIDGE.zFront - 1],
        [BRIDGE.xMax - 1, BRIDGE.zFront - 1],
        [BRIDGE.xMin + 1, BRIDGE.zBack + 1],
        [BRIDGE.xMax - 1, BRIDGE.zBack + 1],
      ].map(([x, z]) => (
        <Piece key={`p${x}${z}`} id="support-pillar" position={[x, 0, z]} />
      ))}
      {/* Ceiling is a dark plane with strip lights; the kit ceiling tiles are too busy at this scale. */}
      <mesh position={[0, BRIDGE.height, (BRIDGE.zFront + BRIDGE.zBack) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BRIDGE.xMax - BRIDGE.xMin, BRIDGE.zFront - BRIDGE.zBack]} />
        <meshStandardMaterial color="#1E1918" roughness={1} />
      </mesh>
      {[-4, 0, 4].map((x) => (
        <Strip key={`c${x}`} position={[x, BRIDGE.height - 0.05, (BRIDGE.zFront + BRIDGE.zBack) / 2]} length={BRIDGE.zFront - BRIDGE.zBack - 2} color="#FFE2B0" />
      ))}
      <Props gauge={gauge} />
    </group>
  );
}

/** Station props: what each crew member is working at. */
function Props({ gauge }: { gauge: boolean }) {
  const weld = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (weld.current) weld.current.intensity = 6 + Math.max(0, Math.sin(state.clock.elapsedTime * 9) + Math.sin(state.clock.elapsedTime * 23)) * 8;
  });
  const at = (id: StationKey, dx = 0, dz = 0): [number, number, number] => {
    const [x, , z] = STATIONS[id].position;
    const yaw = STATIONS[id].yaw;
    // Place the prop in front of the character (along its facing direction).
    return [x + Math.sin(yaw) * 0.9 + dx, 0, z + Math.cos(yaw) * 0.9 + dz];
  };
  return (
    <group>
      {/* The gauge bay (the fleet measurer's console), only when somebody stands there. */}
      {gauge && <Piece id="console-terminal" position={at('gauge')} rotation={[0, Math.PI, 0]} scale={2.2} />}
      {/* Captain's dais with a railing. */}
      <mesh position={[0, 0.12, -7.5]}>
        <cylinderGeometry args={[1.9, 2.1, 0.24, 32]} />
        <meshStandardMaterial color="#3A312E" roughness={0.8} metalness={0.2} />
      </mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <Piece key={`r${x}`} id="railing" position={[x, 0.24, -5.7]} scale={1.2} />
      ))}
      <Piece id="console-terminal" position={at('captain')} rotation={[0, Math.PI, 0]} scale={2.2} />
      {/* The DNA still: a glowing vial on a console. */}
      <Piece id="console-terminal" position={at('strategist')} rotation={[0, -Math.PI / 2, 0]} scale={2.2} />
      <mesh position={[at('strategist')[0], 1.1, at('strategist')[2]]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
        <meshStandardMaterial color="#9BD38A" emissive="#7FB069" emissiveIntensity={2} transparent opacity={0.85} />
      </mesh>
      {/* Evidence bay: console plus a hovering page (a thin lit plane). */}
      <Piece id="console-terminal" position={at('analyst')} rotation={[0, -Math.PI / 2, 0]} scale={2.2} />
      <Piece id="crew-seat" position={at('analyst', 0.9, 0)} rotation={[0, -Math.PI / 2, 0]} scale={2.4} />
      <mesh position={[at('analyst')[0] - 0.2, 1.5, at('analyst')[2]]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshBasicMaterial color="#9ED0F2" transparent opacity={0.35} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* Media hold: barrels and crates. */}
      <Piece id="cargo-barrels" position={at('producer', -0.6, 0)} scale={2.2} />
      <Piece id="cargo-barrels" position={at('producer', 0.7, -0.4)} rotation={[0, 1.2, 0]} scale={2.2} />
      <Box position={[at('producer')[0] + 0.1, 0.35, at('producer')[2] + 0.8]} size={[0.7, 0.7, 0.7]} color="#4A3B32" />
      {/* Sensor mast: a tall thin pole with a lit band; the readout is in Decor. */}
      <mesh position={[at('metrics')[0], 1.6, at('metrics')[2]]}>
        <cylinderGeometry args={[0.05, 0.08, 3.2, 10]} />
        <meshStandardMaterial color="#8FA3B5" metalness={0.6} roughness={0.4} />
      </mesh>
      <Box position={[at('metrics')[0], 2.6, at('metrics')[2]]} size={[0.14, 0.4, 0.14]} color="#1E2A33" emissive="#6FB7E8" />
      {/* Build bay: barrels and the weld light; the bench, rack and the critic's lectern are in Decor. */}
      <Piece id="cargo-barrels" position={at('engineer', 0, 1.2)} scale={2} />
      <pointLight ref={weld} position={[at('engineer')[0], 1.2, at('engineer')[2]]} color="#FFB36B" intensity={8} distance={7} decay={2} />
    </group>
  );
}

/** Everything without kit files: dark boxes in the same places, so the walk still reads. */
export function ProceduralInterior() {
  return (
    <group>
      <Box position={[0, -0.05, (CORRIDOR.zStart + CORRIDOR.zEnd) / 2]} size={[CORRIDOR.halfWidth * 2, 0.1, CORRIDOR.zStart - CORRIDOR.zEnd]} />
      <Box position={[-CORRIDOR.halfWidth, 2, (CORRIDOR.zStart + CORRIDOR.zEnd) / 2]} size={[0.2, 4, CORRIDOR.zStart - CORRIDOR.zEnd]} />
      <Box position={[CORRIDOR.halfWidth, 2, (CORRIDOR.zStart + CORRIDOR.zEnd) / 2]} size={[0.2, 4, CORRIDOR.zStart - CORRIDOR.zEnd]} />
      <Box position={[0, -0.05, (BRIDGE.zFront + BRIDGE.zBack) / 2]} size={[BRIDGE.xMax - BRIDGE.xMin, 0.1, BRIDGE.zFront - BRIDGE.zBack]} />
      <Box position={[0, 2, BRIDGE.zBack]} size={[BRIDGE.xMax - BRIDGE.xMin, 4, 0.2]} />
      {Object.entries(STATIONS).map(([id, s]) => (
        <Box key={id} position={[s.position[0], 0.5, s.position[2] + 0.9]} size={[0.8, 1, 0.5]} color="#3A312E" />
      ))}
    </group>
  );
}

export function ShipInterior({ lite = false, animate = true, gauge = false }: { lite?: boolean; animate?: boolean; gauge?: boolean }) {
  return (
    <>
      <Suspense fallback={<ProceduralInterior />}>
        <ModelBoundary fallback={<ProceduralInterior />}>
          <Corridor />
          <Bridge gauge={gauge} />
        </ModelBoundary>
      </Suspense>
      <Decor lite={lite} />
      <ModelBoundary fallback={null}>
        <BridgeWindow animate={animate && !lite} />
      </ModelBoundary>
    </>
  );
}

export function preloadInterior() {
  for (const p of kit.pieces) useGLTF.preload(withBase(p.file));
}
