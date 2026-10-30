// One artifact in 3D: a family mesh (shared geometry, one shared material per family), a per-skill
// variant and tilt, and the pose the anchor asks for. `ArtifactMesh` is what the Turntable, the
// boarding walk and the Armory inspector (T7) all draw. Motion stops when `animate` is false.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildArtifact, familyMaterial, isFamilyId, orbitAt, type FamilyId } from './families';
import { tiltOf, variantOf } from './variant';

/** Pose by anchor (06 section 5): held 1, worn 0.7, floating 0.8. */
export type Pose = 'held' | 'worn' | 'floating';
export const POSE_SCALE: Record<Pose, number> = { held: 1, worn: 0.7, floating: 0.8 };
/**
 * Family meshes are modelled at hand size (about 10 to 25 cm). On a 2 m crew member that reads as
 * a speck, so every artifact is drawn at this multiple of its modelled size (the pose scales above
 * apply on top). One number, not per family, so relative sizes stay as modelled.
 */
export const ARTIFACT_SCALE = 1.8;
/** Active artifact: a slow turn, 0.25 revolutions per second (06 section 5). */
export const ACTIVE_RPS = 0.25;

export interface ArtifactMeshProps {
  /** family id from the knowledge base; an unknown family draws nothing */
  family: string;
  pigment: string;
  /** the skill id: its hash picks the variant and the tilt */
  skill: string;
  pose?: Pose;
  animate?: boolean;
  /** the artifact the selected stage opens: turns on its own axis and carries a rim halo */
  active?: boolean;
}

const HALO = new THREE.TorusGeometry(0.1, 0.0035, 3, 36);
const haloMaterials = new Map<string, THREE.MeshBasicMaterial>();
function haloMaterial(pigment: string) {
  let m = haloMaterials.get(pigment);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(pigment), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    haloMaterials.set(pigment, m);
  }
  return m;
}

export function ArtifactMesh({ family, pigment, skill, pose = 'held', animate = true, active = false }: ArtifactMeshProps) {
  const known = isFamilyId(family);
  const art = useMemo(() => (known ? buildArtifact(family as FamilyId, variantOf(skill), pigment) : null), [known, family, skill, pigment]);
  const turn = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const clock = useRef(0);
  useEffect(() => {
    invalidate();
  }, [art, invalidate, animate]);
  useEffect(() => {
    // The family material is shared and lives for the page; only the per-instance meshes are dropped with the group.
    if (known) familyMaterial(family as FamilyId, pigment);
  }, [known, family, pigment]);

  useFrame((_, dt) => {
    if (!art || !animate) return;
    clock.current += dt;
    for (const m of art.movers) {
      if (m.spin) {
        m.object.rotation.x += m.spin[0] * dt;
        m.object.rotation.y += m.spin[1] * dt;
        m.object.rotation.z += m.spin[2] * dt;
      }
      if (m.orbit) {
        m.object.position.set(...orbitAt(m.orbit, clock.current));
      }
    }
    if (active && turn.current) turn.current.rotation.y += ACTIVE_RPS * Math.PI * 2 * dt;
  });

  if (!art) return null;
  const s = POSE_SCALE[pose] * ARTIFACT_SCALE;
  return (
    <group scale={s} rotation={[0, 0, tiltOf(skill)]} name={`artifact-${skill}`} userData={{ skill, family }}>
      <group ref={turn}>
        <primitive object={art.group} />
      </group>
      {active && <mesh geometry={HALO} material={haloMaterial(pigment)} rotation={[HALF_PI, 0, 0]} />}
    </group>
  );
}

const HALF_PI = Math.PI / 2;
