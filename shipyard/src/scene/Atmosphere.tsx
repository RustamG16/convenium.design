// Phase 1.5 atmosphere (DESIGN.md › Ship tour: scene upgrade). Corridor dust and the weld's
// volumetric cone and sparks only at quality high with motion on; bloom (selective by luminance
// threshold, the universe scene's method) and the vignette only at high. `ShipPerf` drops the
// scene to low once when frames stay slow, as the universe scene's FpsWatch does.
import { MeshReflectorMaterial, PerformanceMonitor, Sparkles, SpotLight } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mulberry } from './common';
import { BRIDGE, CORRIDOR, inFront } from './stations';

/** Fine dust drifting through the corridor's light. */
export function CorridorDust({ animate }: { animate: boolean }) {
  const len = CORRIDOR.zStart - CORRIDOR.zEnd;
  return <Sparkles count={90} scale={[CORRIDOR.halfWidth * 1.8, 3, len]} position={[0, 1.8, (CORRIDOR.zStart + CORRIDOR.zEnd) / 2]} size={1.6} speed={animate ? 0.2 : 0} opacity={0.35} color="#F6D9B0" noise={0.5} />;
}

function useSparkMaterial() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2.4, 1.6, 0.9) }), [texture]);
  useEffect(
    () => () => {
      material.dispose();
      texture.dispose();
    },
    [material, texture],
  );
  return material;
}

/**
 * The weld: a volumetric cone from the bay light and short bursts of falling sparks.
 *
 * ArkhEthos drew the sparks with three.quarks (not in Shipyard's pinned list). The same look and the
 * same numbers run here on one InstancedMesh of camera-facing, velocity-stretched quads: a looping
 * 0.7 s cycle with a burst of 14 to 26 sparks (85% of cycles), life 0.25 to 0.6 s, speed 1.5 to 3.4
 * m/s out of a 0.03 m cone of half-angle 60 degrees, size 0.02 to 0.05 m falling to nothing, gravity
 * 9 m/s2, colour from (1, .95, .8) to (1, .45, .1) fading out, stretch factor 0.04. Seeded, not random.
 */
const SPARKS = { max: 64, cycle: 0.7, life: [0.25, 0.6], speed: [1.5, 3.4], size: [0.02, 0.05], gravity: 9, burst: [14, 26], chance: 0.85, cone: Math.PI / 3, radius: 0.03, stretch: 0.04 } as const;

/** Bezier(1, 0.8, 0.4, 0) over life, ArkhEthos's SizeOverLife. */
function sizeOverLife(t: number) {
  const u = 1 - t;
  return u * u * u + 3 * u * u * t * 0.8 + 3 * u * t * t * 0.4;
}

function Sparks({ origin }: { origin: THREE.Vector3 }) {
  const material = useSparkMaterial();
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const sim = useMemo(() => {
    const n = SPARKS.max;
    return { pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), life: new Float32Array(n), age: new Float32Array(n).fill(Infinity), size: new Float32Array(n), cycle: 0, rand: mulberry(7), dummy: new THREE.Object3D(), tint: new THREE.Color(), v: new THREE.Vector3(), q: new THREE.Quaternion(), r: new THREE.Quaternion(), z: new THREE.Vector3(0, 0, 1) };
  }, []);
  useFrame(({ camera }, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 0.1);
    const { pos, vel, life, age, size, rand, dummy, tint, v, q, r: rollQ, z: zAxis } = sim;
    sim.cycle -= dt;
    if (sim.cycle <= 0) {
      sim.cycle += SPARKS.cycle;
      if (rand() < SPARKS.chance) {
        const count = Math.round(SPARKS.burst[0] + rand() * (SPARKS.burst[1] - SPARKS.burst[0]));
        let made = 0;
        for (let i = 0; i < SPARKS.max && made < count; i++) {
          if (age[i] < life[i]) continue;
          made++;
          const a = rand() * Math.PI * 2;
          const r = Math.sqrt(rand()) * SPARKS.radius;
          const spread = rand() * SPARKS.cone;
          const speed = SPARKS.speed[0] + rand() * (SPARKS.speed[1] - SPARKS.speed[0]);
          pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3);
          // the cone opens upward from the weld point
          vel.set([Math.sin(spread) * Math.cos(a) * speed, Math.cos(spread) * speed, Math.sin(spread) * Math.sin(a) * speed], i * 3);
          life[i] = SPARKS.life[0] + rand() * (SPARKS.life[1] - SPARKS.life[0]);
          size[i] = SPARKS.size[0] + rand() * (SPARKS.size[1] - SPARKS.size[0]);
          age[i] = 0;
        }
      }
    }
    // The quad faces the camera and lies along the spark's on-screen velocity.
    q.copy(camera.quaternion);
    for (let i = 0; i < SPARKS.max; i++) {
      if (age[i] >= life[i]) {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        continue;
      }
      age[i] += dt;
      vel[i * 3 + 1] -= SPARKS.gravity * dt;
      for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt;
      const t = Math.min(1, age[i] / life[i]);
      const s = size[i] * sizeOverLife(t);
      v.set(vel[i * 3], vel[i * 3 + 1], vel[i * 3 + 2]).transformDirection(camera.matrixWorldInverse);
      const roll = Math.atan2(v.y, v.x);
      const speed = Math.hypot(vel[i * 3], vel[i * 3 + 1], vel[i * 3 + 2]);
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).add(origin);
      dummy.quaternion.copy(q).multiply(rollQ.setFromAxisAngle(zAxis, roll));
      dummy.scale.set(s * (1 + speed * SPARKS.stretch * 12), s, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      // (1, .95, .8) to (1, .45, .1), fading to nothing under additive blending
      tint.setRGB(1, 0.95 + (0.45 - 0.95) * t, 0.8 + (0.1 - 0.8) * t).multiplyScalar(1 - t);
      m.setColorAt(i, tint);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[geometry, material, SPARKS.max]} frustumCulled={false} />;
}

export function WeldRig() {
  const [x, , z] = inFront('engineer', 0.9, 0, 0.2);
  const origin = useMemo(() => new THREE.Vector3(x, 0.98, z), [x, z]);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(x, 0.9, z);
    return o;
  }, [x, z]);
  return (
    <group>
      <primitive object={target} />
      <SpotLight position={[x, 3.7, z]} target={target} color="#FFC48A" angle={0.32} penumbra={0.6} distance={5} attenuation={4.5} anglePower={4} intensity={3} opacity={0.3} />
      <group name="weld-sparks">
        <Sparks origin={origin} />
      </group>
    </group>
  );
}

/** A faint reflection over the bridge floor tiles (quality high only; it re-renders the scene). */
export function ReflectorFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, (BRIDGE.zFront + BRIDGE.zBack) / 2]} name="reflector-floor">
      <planeGeometry args={[BRIDGE.xMax - BRIDGE.xMin, BRIDGE.zFront - BRIDGE.zBack]} />
      <MeshReflectorMaterial resolution={512} mixBlur={1} mixStrength={0.8} blur={[240, 80]} mirror={0.5} roughness={0.85} metalness={0.3} color="#3A312E" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

/** Bloom on what is brighter than the lit walls (screens, strips, sparks), and a soft vignette. */
export function ShipEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.1} intensity={0.9} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  );
}

/** Drops to quality low once when the frame rate stays under the monitor's lower bound. */
export function ShipPerf({ onDrop }: { onDrop: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  return (
    <PerformanceMonitor
      flipflops={1}
      onDecline={() => {
        onDrop();
        invalidate();
      }}
    />
  );
}
