// One crew member in 3D: the rigged GLB with its baked working loop, a head that turns toward the
// camera (or a hovered target) without extra clips, and a procedural stand-in when the file fails.
// Skinned meshes cannot be `scene.clone()`d, so each instance is a SkeletonUtils clone.
import { Outlines, useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Fragment, Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { BoneArtifacts, OrbitArtifacts, StandInArtifacts } from './artifacts/WornArtifacts';
import { approach, disposeMaterials, ModelBoundary } from './common';
import type { SceneMember } from './crew';
import { withBase } from '../lib/baseUrl';

/** DESIGN.md › Ship tour: look-at approach rate 6, clamp ±0.6 rad. */
const LOOK_RATE = 6;
const LOOK_CLAMP = 0.6;

export interface CrewMemberProps {
  member: SceneMember;
  reduced: boolean;
  /** 0 = ignore the viewer, 1 = full head turn toward the camera. */
  attention?: number;
  /** Uniform scale on top of the file's metre units. */
  scale?: number;
  /** The whole body turns to face the camera (the captain's welcome); 0..1. */
  faceCamera?: number;
  /** Resting facing (radians about y); the welcome blends from this toward the camera. */
  yaw?: number;
  /** Hovered: an outline in this colour around every mesh (DESIGN: 2 px). */
  outline?: string | null;
  /** Registry of head bones by member id, for speech bubbles anchored to the head. */
  heads?: Map<string, THREE.Object3D>;
  /** Worn artifacts follow the bones (and the orbit ring circles above the head) unless false. */
  artifacts?: boolean;
  /** Called once the figure that will stay on screen is mounted (the GLB, or the stand-in when there is no file or it failed). */
  onLoaded?: () => void;
}

export function CrewMember({ member, reduced, attention = 1, scale = 1, faceCamera = 0, yaw: baseYaw = 0, outline = null, heads, artifacts = true, onLoaded }: CrewMemberProps) {
  const { scene, animations } = useGLTF(withBase(member.model.glb!));
  // Clone the skinned hierarchy, then stand it on the floor, centred, at the identity's height.
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const wrap = new THREE.Group();
    wrap.add(c);
    const k = size.y > 0 ? member.model.heightM / size.y : 1;
    c.position.set(-centre.x, -box.min.y, -centre.z);
    wrap.scale.setScalar(k);
    return wrap;
  }, [scene, member.model.heightM]);
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    onLoaded?.();
  }, [clone, onLoaded]);
  const { actions, mixer } = useAnimations(animations, group);
  const invalidate = useThree((st) => st.invalidate);

  // On-demand canvases (reduced motion) draw nothing until asked: show the loaded model once.
  useEffect(() => {
    invalidate();
  }, [clone, invalidate]);

  useEffect(() => {
    const first = Object.values(actions)[0];
    if (!first) return;
    first.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
    return () => {
      first.fadeOut(0.2);
    };
  }, [actions]);

  useEffect(() => {
    // The mixer is a three.js object owned by this component's group; pausing it is the documented way
    // to hold the pose under reduced motion.
    mixer.timeScale = reduced ? 0 : 1;
  }, [mixer, reduced]);

  // Lift the baked SAM textures a little: they arrive dark and fully rough.
  useEffect(() => {
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        if (std.isMeshStandardMaterial) {
          std.roughness = Math.min(std.roughness, 0.85);
          std.envMapIntensity = 1.2;
          std.needsUpdate = true;
        }
      }
    });
    return () => disposeMaterials(clone);
  }, [clone]);

  const head = useMemo(() => {
    let bone: THREE.Bone | null = null;
    const find = (re: RegExp) =>
      clone.traverse((o) => {
        if (!bone && (o as THREE.Bone).isBone && re.test(o.name)) bone = o as THREE.Bone;
      });
    find(/head/i);
    if (!bone) find(/neck/i);
    return bone as THREE.Bone | null;
  }, [clone]);

  useEffect(() => {
    if (!heads || !head) return;
    heads.set(member.id, head);
    return () => {
      if (heads.get(member.id) === head) heads.delete(member.id);
    };
  }, [heads, head, member.id]);

  const meshes = useMemo(() => {
    const out: THREE.Mesh[] = [];
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
    });
    return out;
  }, [clone]);

  const yaw = useRef(0);
  const pitch = useRef(0);
  const facing = useRef(0);
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), headPos: new THREE.Vector3(), local: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() }), []);

  // Registered after useAnimations, so it runs after the mixer update at the same (default) priority:
  // the look-at sits on top of the baked pose. A positive priority would switch off R3F's own render.
  function lookFrame(camera: THREE.Camera, delta: number) {
    const g = group.current;
    if (!g) return;
    camera.getWorldPosition(tmp.target);
    // Whole-body turn toward the camera for the welcome.
    g.getWorldPosition(tmp.local);
    const bodyYaw = Math.atan2(tmp.target.x - tmp.local.x, tmp.target.z - tmp.local.z);
    facing.current = approach(facing.current, faceCamera, delta, 3, reduced);
    g.rotation.y = baseYaw + (bodyYaw - baseYaw) * facing.current;
    if (!head) return;
    head.getWorldPosition(tmp.headPos);
    const dx = tmp.target.x - tmp.headPos.x;
    const dz = tmp.target.z - tmp.headPos.z;
    const dy = tmp.target.y - tmp.headPos.y;
    const wantYaw = THREE.MathUtils.clamp((Math.atan2(dx, dz) - g.rotation.y) * attention, -LOOK_CLAMP, LOOK_CLAMP);
    const wantPitch = THREE.MathUtils.clamp(Math.atan2(dy, Math.hypot(dx, dz)) * attention * 0.5, -LOOK_CLAMP * 0.5, LOOK_CLAMP * 0.5);
    yaw.current = approach(yaw.current, wantYaw, delta, LOOK_RATE, reduced);
    pitch.current = approach(pitch.current, wantPitch, delta, LOOK_RATE, reduced);
    // Head bones in these rigs point along their local Y; yaw about Y, nod about X.
    tmp.e.set(-pitch.current, yaw.current, 0, 'YXZ');
    tmp.q.setFromEuler(tmp.e);
    head.quaternion.multiply(tmp.q);
  }

  // One bad frame must not take the whole canvas with it: a failing look-at just switches itself off.
  const failed = useRef(false);
  useFrame((state, delta) => {
    if (failed.current) return;
    try {
      lookFrame(state.camera, delta);
    } catch (err) {
      failed.current = true;
      console.error('[CrewMember] frame callback failed', err);
    }
  });


  return (
    <group ref={group} scale={scale}>
      <primitive object={clone} />
      {/* A recruit wears a library body: a pigment rim light from behind tints it, no texture recolour. */}
      {member.recruit && <pointLight position={[0, member.model.heightM * 0.7, -0.9]} intensity={5} distance={4} decay={2} color={member.pigment} />}
      {artifacts && <BoneArtifacts member={member} clone={clone} animate={!reduced} />}
      {artifacts && <OrbitArtifacts member={member} heightM={member.model.heightM} animate={!reduced} />}
      {outline && meshes.map((m) => <Fragment key={m.uuid}>{createPortal(<Outlines thickness={2} screenspace color={outline} />, m)}</Fragment>)}
    </group>
  );
}

/** The stand-in: a capsule in the member's pigment with a visor, bobbing slowly. */
export function ProceduralCrew({ member, reduced, scale = 1, artifacts = true, onLoaded }: { member: SceneMember; reduced: boolean; scale?: number; artifacts?: boolean; onLoaded?: () => void }) {
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);
  const h = member.model.heightM;
  useFrame((state) => {
    if (!group.current || reduced) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.4 + member.station) * 0.02;
  });
  return (
    <group ref={group} scale={scale} name="stand-in">
      <mesh position={[0, h * 0.45, 0]}>
        <capsuleGeometry args={[h * 0.14, h * 0.5, 6, 12]} />
        <meshStandardMaterial color={member.pigment} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, h * 0.86, 0]}>
        <sphereGeometry args={[h * 0.11, 20, 16]} />
        <meshStandardMaterial color="#A79B92" roughness={0.6} />
      </mesh>
      <mesh position={[0, h * 0.87, h * 0.08]}>
        <boxGeometry args={[h * 0.14, h * 0.04, h * 0.05]} />
        <meshStandardMaterial color={member.pigment} emissive={member.pigment} emissiveIntensity={0.8} />
      </mesh>
      {artifacts && <StandInArtifacts member={member} h={h} animate={!reduced} />}
    </group>
  );
}

/**
 * A member's body as the ship's data asks for it: the rigged GLB when the body has one (the
 * stand-in shows while it loads and if the file fails), the procedural stand-in otherwise.
 */
export function CrewFigure(props: CrewMemberProps) {
  const { member, reduced, artifacts, onLoaded } = props;
  // The stand-in shown while the file streams does not report "loaded"; the one that replaces a failed or absent file does.
  const loading = <ProceduralCrew member={member} reduced={reduced} artifacts={artifacts} />;
  const final = <ProceduralCrew member={member} reduced={reduced} artifacts={artifacts} onLoaded={onLoaded} />;
  if (!member.model.glb) return final;
  return (
    <Suspense fallback={loading}>
      <ModelBoundary fallback={final}>
        <CrewMember {...props} />
      </ModelBoundary>
    </Suspense>
  );
}
