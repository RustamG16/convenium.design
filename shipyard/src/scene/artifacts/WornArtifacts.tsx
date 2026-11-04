// Artifacts on a body (06 section 5): bone anchors for the rigged GLBs, fixed offsets for the
// stand-in, a free circle round the head for the orbit slots.
//
// The ArkhEthos pattern: `createPortal(mesh, bone)` on the SkeletonUtils clone, so an artifact
// follows the baked working loop. The rig's Armature is scaled 0.01 (centimetres) and the clone is
// scaled again to the identity's height, so each mount cancels the bone's world scale and the
// artifact is a true size in metres.
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { EQUIP_EASE, isReducedMotion, MOTION, recordMotion } from '../../lib/motion';
import type { Anchor } from '../../domain/schema';
import type { SceneMember, WornArtifact } from '../crew';
import { ArtifactMesh, ACTIVE_RPS, type Pose } from './ArtifactMesh';

export const POSE_OF_ANCHOR: Record<Anchor, Pose> = { hand: 'held', offhand: 'held', head: 'crown', back: 'worn', belt: 'worn', orbit: 'floating' };

type V3 = [number, number, number];

/**
 * Per anchor orientation and nudge inside the bone. The seven GLBs share one Meshy rig (bones in
 * centimetres, Armature scaled 0.01). At rest Hips, Spine02 and Head are axis-aligned with the body
 * (Y up, Z forward) so the registry offsets work as written; the hands are not: their Y runs down
 * the fingers and their frame is turned, so the hand rotation below is the inverse of the hands'
 * rest orientation (measured on all seven files, averaged; they agree within 0.3 rad) and leaves
 * the artifact upright in the palm. Offsets are metres, in the upright frame, added to the registry
 * offset and scaled by the body's height over 1.8 m.
 */
export const BONE_TUNE: Record<Exclude<Anchor, 'orbit'>, { rotation: V3; offset: V3 }> = {
  hand: { rotation: [-0.55, -0.5, 2.9], offset: [0, -0.04, 0.02] },
  offhand: { rotation: [-0.4, 0.55, 3.04], offset: [0, -0.04, 0.02] },
  // above the crown, not over the face (T6): the head bone sits at the neck's top, so +0.3 m clears the head
  head: { rotation: [0, 0, 0], offset: [0, 0.3, -0.06] },
  back: { rotation: [0, 0, 0], offset: [0, 0.1, -0.02] },
  belt: { rotation: [0, 0, 0], offset: [0, 0, 0.02] },
};

const tmp = new THREE.Vector3();

/** Keys of the artifacts that arrive after the figure mounted: those are equips, and fly in. The ones present at mount are simply there. */
function useFresh(keys: string[]): Set<string> {
  const [initial] = useState(() => new Set(keys));
  return new Set(keys.filter((k) => !initial.has(k)));
}

/** Where an arriving artifact starts, relative to its anchor: 0.4 m away, up and to the side. */
const ARRIVAL_FROM = new THREE.Vector3(0.55, 0.45, 0.7).normalize().multiplyScalar(MOTION.equip.arcM);
/** The path bows 0.3 of its length off the straight line, so it reads as an arc. */
const ARC_LIFT = MOTION.equip.arcM * 0.3;

/**
 * Equip, 3D: the artifact flies along a 0.4 m arc to its anchor in 520 ms, `back.out(1.6)` (the only
 * overshoot in the product). Reduced motion: it is placed at once and fades in over 120 ms. Interruptible:
 * unmounting kills the tween. The group carries `userData.arrival` for the scene test hook.
 */
function Arrival({ fresh, skill, children }: { fresh: boolean; skill: string; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const g = group.current;
    if (!fresh || !g) return;
    if (isReducedMotion()) {
      const swapped: { mesh: THREE.Mesh; original: THREE.Material }[] = [];
      g.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && !Array.isArray(mesh.material)) {
          swapped.push({ mesh, original: mesh.material });
          const m = mesh.material.clone();
          m.transparent = true;
          m.opacity = 0;
          mesh.material = m;
        }
      });
      const fade = { v: 0 };
      g.userData.arrival = { variant: 'opacity', ms: MOTION.reduced, state: 'running' };
      const done = () => {
        for (const { mesh, original } of swapped) {
          (mesh.material as THREE.Material).dispose();
          mesh.material = original;
        }
        g.userData.arrival = { ...(g.userData.arrival as object), state: 'done' };
        invalidate();
      };
      const tween = gsap.to(fade, {
        v: 1,
        duration: MOTION.reduced / 1000,
        ease: 'none',
        onUpdate: () => {
          for (const { mesh } of swapped) (mesh.material as THREE.Material).opacity = fade.v;
          invalidate();
        },
        onComplete: done,
      });
      recordMotion('equip-3d', MOTION.reduced, { skill, variant: 'opacity' });
      return () => {
        tween.kill();
        if (g.userData.arrival?.state === 'running') done();
      };
    }
    const t = { v: 0 };
    g.userData.arrival = { variant: 'arc', ms: MOTION.equip.ms, ease: EQUIP_EASE, arcM: MOTION.equip.arcM, state: 'flying' };
    const place = () => {
      const u = t.v;
      g.position.copy(ARRIVAL_FROM).multiplyScalar(1 - u);
      g.position.y += ARC_LIFT * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
      invalidate();
    };
    place();
    const tween = gsap.to(t, {
      v: 1,
      duration: MOTION.equip.ms / 1000,
      ease: EQUIP_EASE,
      onUpdate: place,
      onComplete: () => {
        g.position.set(0, 0, 0);
        g.userData.arrival = { ...(g.userData.arrival as object), state: 'done' };
        invalidate();
      },
    });
    recordMotion('equip-3d', MOTION.equip.ms, { skill, variant: 'arc', ease: EQUIP_EASE, arcM: MOTION.equip.arcM });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <group ref={group} name={`arrival-${skill}`}>
      {children}
    </group>
  );
}

/** A group in a bone, sized in metres whatever the bone's own scale; its children sit in the upright frame. */
function BoneMount({ bone, offset, rotation, children }: { bone: THREE.Object3D; offset: V3; rotation: V3; children: React.ReactNode }) {
  const mount = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = mount.current;
    if (!g) return;
    g.scale.setScalar(1 / (tmp.setFromMatrixScale(bone.matrixWorld).x || 1));
  });
  return createPortal(
    <group ref={mount} rotation={rotation}>
      <group position={offset}>{children}</group>
    </group>,
    bone,
  );
}

export function findBone(root: THREE.Object3D, name: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!found && (o as THREE.Bone).isBone && o.name === name) found = o;
  });
  return found;
}

function slotOffset(a: WornArtifact): V3 {
  const [x, y, z] = a.slot.offset;
  const spread = a.slot.spread ?? 0;
  // belt sockets fan out sideways across the hips
  return a.anchor === 'belt' ? [x + (a.index - 1) * spread, y, z] : [x, y, z];
}

/** The loadout on a rigged body: one portal per artifact into its bone. Orbit slots are separate. */
export function BoneArtifacts({ member, clone, animate }: { member: SceneMember; clone: THREE.Object3D; animate: boolean }) {
  const bones = useMemo(() => {
    const out = new Map<string, THREE.Object3D | null>();
    for (const a of member.loadout) if (a.anchor !== 'orbit' && !out.has(a.slot.bone)) out.set(a.slot.bone, findBone(clone, a.slot.bone));
    return out;
  }, [member.loadout, clone]);
  const keyOf = (a: WornArtifact) => `${a.anchor}-${a.index}-${a.skill}`;
  const fresh = useFresh(member.loadout.map(keyOf));
  return (
    <>
      {member.loadout
        .filter((a) => a.anchor !== 'orbit')
        .map((a) => {
          const bone = bones.get(a.slot.bone);
          if (!bone) return null;
          const tune = BONE_TUNE[a.anchor as Exclude<Anchor, 'orbit'>];
          const o = slotOffset(a);
          const k = member.model.heightM / 1.8;
          return (
            <Fragment key={keyOf(a)}>
              <BoneMount bone={bone} offset={[(o[0] + tune.offset[0]) * k, (o[1] + tune.offset[1]) * k, (o[2] + tune.offset[2]) * k]} rotation={tune.rotation}>
                <Arrival fresh={fresh.has(keyOf(a))} skill={a.skill}>
                  <ArtifactMesh family={a.family} pigment={a.pigment} skill={a.skill} pose={POSE_OF_ANCHOR[a.anchor]} animate={animate} active={a.skill === member.active} />
                </Arrival>
              </BoneMount>
            </Fragment>
          );
        })}
    </>
  );
}

/** Orbit radius and height over the head (T6, director defect 2): tighter than the registry's 0.45 m at +0.1 m, so the pair reads as gear beside the crown, not saucers across the room. */
export const ORBIT_RADIUS = 0.34;
export const ORBIT_LIFT = 0.2;

/**
 * Orbit slots: artifacts circling a point above the head, 0.25 revolutions per second. The ring turns
 * the positions only; each artifact is counter-rotated so its face keeps toward the viewer (the old
 * tilt turned with the ring and showed a flat disc edge-on half the time, which read as a saucer).
 */
export function OrbitArtifacts({ member, heightM, animate }: { member: SceneMember; heightM: number; animate: boolean }) {
  const ring = useRef<THREE.Group>(null);
  const facing = useRef<(THREE.Group | null)[]>([]);
  const orbiters = member.loadout.filter((a) => a.anchor === 'orbit');
  const fresh = useFresh(orbiters.map((a) => `${a.index}-${a.skill}`));
  const angle = useRef(0);
  useFrame((_, dt) => {
    if (animate) angle.current += ACTIVE_RPS * Math.PI * 2 * dt;
    if (ring.current) ring.current.rotation.y = angle.current;
    for (const f of facing.current) if (f) f.rotation.y = -angle.current;
  });
  if (orbiters.length === 0) return null;
  return (
    <group ref={ring} position={[0, heightM + ORBIT_LIFT, 0]} name="orbit-ring">
      {orbiters.map((a, i) => {
        const r = (a.slot.radius ?? 0.45) * (ORBIT_RADIUS / 0.45);
        const phase = (a.index / Math.max(2, orbiters.length)) * Math.PI * 2 + Math.PI / 2;
        return (
          <group key={`${a.index}-${a.skill}`} position={[Math.cos(phase) * r, 0, Math.sin(phase) * r]}>
            <group
              ref={(g) => {
                facing.current[i] = g;
              }}
            >
              <group rotation={[0.5, 0, 0]}>
                <Arrival fresh={fresh.has(`${a.index}-${a.skill}`)} skill={a.skill}>
                  <ArtifactMesh family={a.family} pigment={a.pigment} skill={a.skill} pose="floating" animate={animate} active={a.skill === member.active} />
                </Arrival>
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/** Fixed offsets on the procedural stand-in, whose body is a capsule of the identity's height. */
export function standInOffset(a: Pick<WornArtifact, 'anchor' | 'index'>, h: number): V3 {
  const r = h * 0.14;
  switch (a.anchor) {
    case 'hand':
      return [r + 0.1, h * 0.4, h * 0.05];
    case 'offhand':
      return [-(r + 0.1), h * 0.4, h * 0.05];
    case 'head':
      return [0, h * 0.86 + h * 0.11 + 0.1, 0];
    case 'back':
      return [0, h * 0.58, -(r + 0.09)];
    case 'belt':
      return [(a.index - 1) * 0.14, h * 0.32, r + 0.05];
    default:
      return [0, h, 0];
  }
}

export function StandInArtifacts({ member, h, animate }: { member: SceneMember; h: number; animate: boolean }) {
  const fresh = useFresh(member.loadout.filter((a) => a.anchor !== 'orbit').map((a) => `${a.anchor}-${a.index}-${a.skill}`));
  return (
    <>
      {member.loadout
        .filter((a) => a.anchor !== 'orbit')
        .map((a) => (
          <group key={`${a.anchor}-${a.index}-${a.skill}`} position={standInOffset(a, h)}>
            <Arrival fresh={fresh.has(`${a.anchor}-${a.index}-${a.skill}`)} skill={a.skill}>
              <ArtifactMesh family={a.family} pigment={a.pigment} skill={a.skill} pose={POSE_OF_ANCHOR[a.anchor]} animate={animate} active={a.skill === member.active} />
            </Arrival>
          </group>
        ))}
      <OrbitArtifacts member={member} heightM={h} animate={animate} />
    </>
  );
}
