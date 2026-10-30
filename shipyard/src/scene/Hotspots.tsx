// Phase 1.5 interactivity in the scene (DESIGN.md › Ship tour: scene upgrade). Each crew member
// has an invisible hit volume over the body and its station prop: hover shows a label and the
// outline, click goes to that waypoint and opens Talk. The seven Inspect details are small glowing
// objects with the same hover/click contract. `BubbleAnchor` projects the talking member's head
// bone to the screen every frame and writes it to the speech bubble as CSS variables.
import { Html, useCursor } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import type { SceneMember } from './crew';
import { inFront, INSPECT, STATIONS, type InspectDetail, type Layout, type StationKey } from './stations';

/** Shared invisible material: raycastable, never drawn. */
const HIT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

function stop<T extends ThreeEvent<PointerEvent | MouseEvent>>(e: T) {
  e.stopPropagation();
}

export function CrewHotspot({ member, stationKey, hovered, onHover, onPick }: { member: SceneMember; stationKey: StationKey; hovered: boolean; onHover: (id: string | null) => void; onPick: (id: string) => void }) {
  const s = STATIONS[stationKey];
  const h = member.model.heightM;
  const [px, , pz] = inFront(stationKey);
  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      stop(e);
      onHover(member.id);
    },
    onPointerOut: () => onHover(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      stop(e);
      onPick(member.id);
    },
  };
  return (
    <group name={`hotspot-${member.id}`}>
      <mesh position={[s.position[0], h / 2, s.position[2]]} material={HIT} {...handlers}>
        <cylinderGeometry args={[0.45, 0.45, h, 10]} />
      </mesh>
      <mesh position={[px, 0.55, pz]} material={HIT} {...handlers}>
        <boxGeometry args={[1, 1.1, 1]} />
      </mesh>
      {hovered && (
        <Html position={[s.position[0], h + 0.25, s.position[2]]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="ship-hotspot-label" style={{ ['--c' as string]: member.pigment }}>
            <strong>{member.name}</strong>
            <span>Talk</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function InspectSpot({ detail, found, onInspect, animate }: { detail: InspectDetail; found: boolean; onInspect: (id: string) => void; animate: boolean }) {
  const [hot, setHot] = useState(false);
  useCursor(hot);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: detail.color, emissive: detail.color, emissiveIntensity: 0.6, roughness: 0.6 }), [detail.color]);
  useEffect(() => () => material.dispose(), [material]);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = mesh.current?.material as THREE.MeshStandardMaterial | undefined;
    if (!m) return;
    // A slow shimmer until found, so it can be noticed without a marker; steady afterwards.
    m.emissiveIntensity = found ? 0.25 : hot ? 1.4 : animate ? 0.5 + 0.35 * Math.sin(state.clock.elapsedTime * 2 + detail.position[0]) : 0.7;
  });
  return (
    <group position={detail.position} name={`inspect-${detail.id}`}>
      <mesh ref={mesh} material={material}>
        <boxGeometry args={detail.size} />
      </mesh>
      {/* A generous invisible hit box: the details are small. */}
      <mesh
        material={HIT}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHot(true);
        }}
        onPointerOut={() => setHot(false)}
        onClick={(e) => {
          e.stopPropagation();
          onInspect(detail.id);
        }}
      >
        <boxGeometry args={[Math.max(0.35, detail.size[0] * 1.6), Math.max(0.3, detail.size[1] * 2), Math.max(0.35, detail.size[2] * 1.6)]} />
      </mesh>
      {hot && (
        <Html position={[0, 0.3, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="ship-hotspot-label">
            <strong>{detail.title}</strong>
            <span>{found ? 'Inspected' : 'Inspect'}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export function InspectSpots({ found, onInspect, animate, occupied }: { found: readonly string[]; onInspect: (id: string) => void; animate: boolean; occupied: ReadonlySet<StationKey> }) {
  const set = new Set(found);
  return (
    <group>
      {INSPECT.filter((d) => occupied.has(d.key)).map((d) => (
        <InspectSpot key={d.id} detail={d} found={set.has(d.id)} onInspect={onInspect} animate={animate} />
      ))}
    </group>
  );
}

/**
 * Projects the talking member's head (the rig's head bone, or the identity height when the GLB
 * fell back) to the canvas and writes `--bx` / `--by` (px) on the bubble; hides it off-screen.
 */
export function BubbleAnchor({ bubble, memberId, heads, crew, layout }: { bubble: RefObject<HTMLElement | null>; memberId: string | null; heads: Map<string, THREE.Object3D>; crew: readonly SceneMember[]; layout: Layout }) {
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const el = bubble.current;
    if (!el) return;
    if (!memberId) {
      el.setAttribute('data-hidden', 'true');
      return;
    }
    const head = heads.get(memberId);
    if (head) {
      head.getWorldPosition(v);
      v.setY(v.y + 0.22);
    } else {
      const m = crew.find((c) => c.id === memberId);
      const s = layout.stationOf(memberId);
      if (!m || !s) return;
      v.set(s.position[0], m.model.heightM + 0.15, s.position[2]);
    }
    v.project(camera);
    const off = v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05;
    el.setAttribute('data-hidden', off ? 'true' : 'false');
    if (off) return;
    el.style.setProperty('--bx', `${((v.x + 1) / 2) * size.width}px`);
    el.style.setProperty('--by', `${((1 - v.y) / 2) * size.height}px`);
  });
  return null;
}
