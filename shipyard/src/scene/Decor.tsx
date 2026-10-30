// Phase 1.5 set dressing: lockers, a hatch, pipes and floor grates in the corridor; crates in the
// media hold, the critic's lectern, the engineer's workbench and tool rack, the metrics readout and
// the strategist's vial rig on the bridge. Every kit piece has its own ModelBoundary with a box
// stand-in, so one missing file costs one prop, not the room. `lite` (phones) keeps about half.
import { Suspense, useMemo, type ReactNode } from 'react';
import { ModelBoundary } from './common';
import { Piece, type PieceId } from './ShipInterior';
import { CORRIDOR, inFront, STATIONS } from './stations';

type V3 = [number, number, number];

function StandIn({ position, size, color = '#2A2423' }: { position: V3; size: V3; color?: string }) {
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

/** A kit piece with its own fallback box (footprint in metres after scale). */
function Kit({ id, position, rotation, scale, footprint, tint }: { id: PieceId; position: V3; rotation?: V3; scale?: number | V3; footprint: V3; tint?: string }) {
  const fallback: ReactNode = <StandIn position={position} size={footprint} />;
  return (
    <Suspense fallback={fallback}>
      <ModelBoundary fallback={fallback}>
        <Piece id={id} position={position} rotation={rotation} scale={scale} tint={tint} />
      </ModelBoundary>
    </Suspense>
  );
}

const PIPE_Y = [3.15, 3.38] as const;

function CorridorDecor({ lite }: { lite: boolean }) {
  const half = CORRIDOR.halfWidth;
  const lockers = lite ? [19.5] : [19.5, 18.5, 9.5, 8.5];
  const collars = useMemo(() => {
    const out: number[] = [];
    for (let z = CORRIDOR.zStart - 3; z > CORRIDOR.zEnd + 1; z -= lite ? 8 : 4) out.push(z);
    return out;
  }, [lite]);
  const grates = useMemo(() => {
    const out: number[] = [];
    for (let z = CORRIDOR.zStart - 2; z >= CORRIDOR.zEnd + 2; z -= 4) out.push(z);
    return out;
  }, []);
  const pipeLen = CORRIDOR.zStart - CORRIDOR.zEnd - 1;
  const pipeZ = (CORRIDOR.zStart + CORRIDOR.zEnd) / 2;
  return (
    <group name="corridor-decor">
      {lockers.map((z) => (
        <Kit key={`l${z}`} id="locker" position={[half - 0.27, 0, z]} rotation={[0, -Math.PI / 2, 0]} scale={0.95} footprint={[0.5, 2.5, 0.95]} />
      ))}
      {/* A sealed maintenance hatch on the left wall. */}
      <Kit id="hatch" position={[-half + 0.12, 0, 16]} rotation={[0, Math.PI / 2, 0]} scale={4} footprint={[0.4, 2.8, 1.6]} />
      {/* Two pipes along the upper right wall, with collars. */}
      {PIPE_Y.map((y, i) => (
        <mesh key={`p${y}`} position={[half - 0.25 - i * 0.22, y, pipeZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, pipeLen, 10]} />
          <meshStandardMaterial color={i === 0 ? '#6E5F57' : '#4F4743'} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      {collars.map((z) => (
        <Kit key={`c${z}`} id="pipe-ring" position={[half - 0.25, PIPE_Y[0] - 0.2, z]} rotation={[Math.PI / 2, 0, 0]} scale={0.7} footprint={[0.25, 0.25, 0.35]} />
      ))}
      {/* Wall displays on the left, a vertical pipe drop where the corridor meets the bridge. */}
      {(lite ? [11] : [11, 5]).map((z) => (
        <Kit key={`d${z}`} id="wall-display" position={[-half + 0.55, 1.1, z]} rotation={[0, Math.PI / 2, 0]} scale={2.2} footprint={[0.85, 1, 0.9]} />
      ))}
      <Kit id="pipe" position={[half - 0.2, 0, 3.4]} scale={[1, 6.4, 1]} footprint={[0.25, 3.2, 0.28]} />
      {!lite &&
        grates.map((z) => <Kit key={`g${z}`} id="floor-grate" position={[0, -0.01, z]} scale={[1.2, 0.12, 2]} footprint={[1.2, 0.04, 2]} tint="#3E3634" />)}
    </group>
  );
}

/** The strategist's vial rig: a little frame with four glowing vials on the console. */
function VialRig() {
  const [x, , z] = inFront('strategist');
  const vials: [number, string][] = [
    [-0.42, '#9BD38A'],
    [-0.2, '#E5C07B'],
    [0.2, '#C98FB0'],
    [0.42, '#7FB0D9'],
  ];
  return (
    <group position={[x, 0.83, z]} name="vial-rig">
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.24, 0.04, 1.05]} />
        <meshStandardMaterial color="#3A312E" roughness={0.6} metalness={0.4} />
      </mesh>
      {vials.map(([dz, c]) => (
        <mesh key={dz} position={[0, 0.16, dz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 10]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.4} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function BridgeDecor({ lite }: { lite: boolean }) {
  const critic = inFront('critic');
  const engineer = inFront('engineer');
  return (
    <group name="bridge-decor">
      {/* Media hold: a large crate against the back wall, tall containers beside it. */}
      <Kit id="crate-large" position={[-2.6, 0, -10.45]} scale={0.5} footprint={[1.73, 0.75, 0.75]} />
      {!lite && (
        <>
          <Kit id="container-tall" position={[-4.5, 0, -10.3]} scale={2} footprint={[1.2, 1.8, 1.2]} />
          <Kit id="container-tall" position={[-0.9, 0, -10.4]} rotation={[0, 0.4, 0]} scale={1.6} footprint={[1, 1.45, 1]} />
        </>
      )}
      {/* Scoring alcove: a lectern, no tools. */}
      <Kit id="lectern" position={critic} rotation={[0, STATIONS.critic.yaw + Math.PI, 0]} scale={1.7} footprint={[1.4, 1, 1.4]} />
      {/* Build bay: workbench in front of the engineer, the tool rack on the side wall behind. */}
      <Kit id="workbench" position={engineer} rotation={[0, Math.PI / 2, 0]} scale={[0.6, 0.9, 0.7]} footprint={[0.72, 0.85, 1.7]} tint="#5A4A42" />
      {!lite && <Kit id="tool-rack" position={[7.68, 0, -2.2]} rotation={[0, -Math.PI / 2, 0]} footprint={[0.54, 2.67, 1.37]} />}
      {/* Sensor mast readout. */}
      <Kit id="readout" position={[3.45, 0, -8.15]} scale={1.4} footprint={[1.12, 0.92, 0.6]} />
      <VialRig />
    </group>
  );
}

export function Decor({ lite }: { lite: boolean }) {
  return (
    <group>
      <CorridorDecor lite={lite} />
      <BridgeDecor lite={lite} />
    </group>
  );
}
