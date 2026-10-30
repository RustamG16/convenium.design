// A holographic station screen: text drawn into a canvas texture (the page's own font, no font
// fetch) on a plane with a thin custom shader — scanlines, a slow flicker and the member's
// pigment. DESIGN.md › Ship tour: scene upgrade: scanline period 3 px, flicker 0.92–1.0 at about
// 0.3 Hz (static under reduced motion), opacity 0.85.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const W = 512;
const H = 320;

// Shader logic as ArkhEthos wrote it (scanlines, flicker, pigment ink), patched into a plain
// MeshBasicMaterial with `onBeforeCompile` instead of three-custom-shader-material (not in the
// pinned package list). The material keeps fog and the output colour space; `vMapUv` is the UV.
const MAP_FRAGMENT = /* glsl */ `
  vec4 t = texture2D(map, vMapUv);
  float scan = 0.82 + 0.18 * step(0.5, fract(vMapUv.y * ${(H / 3).toFixed(1)}));
  float flicker = mix(1.0, 0.96 + 0.04 * sin(uTime * 1.9) * sin(uTime * 0.7 + 1.3), uFlicker);
  vec3 base = uColor * 0.16;
  vec3 ink = mix(uColor, vec3(1.0), 0.55);
  vec3 col = mix(base, ink, t.r) * scan * flicker;
  float edge = smoothstep(0.0, 0.02, vMapUv.x) * smoothstep(1.0, 0.98, vMapUv.x) * smoothstep(0.0, 0.03, vMapUv.y) * smoothstep(1.0, 0.97, vMapUv.y);
  diffuseColor = vec4(col, (0.55 + 0.3 * t.r) * edge * opacity);
`;

export interface HoloScreenProps {
  position: [number, number, number];
  yaw: number;
  color: string;
  /** Heading line (the member's name or the station). */
  title: string;
  /** Up to five lines below it. */
  lines: readonly string[];
  width?: number;
  reduced: boolean;
  /** Brighter while the camera stands at this station. */
  active?: boolean;
}

function drawScreen(ctx: CanvasRenderingContext2D, title: string, lines: readonly string[]) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  ctx.font = `600 34px ${font}`;
  ctx.textBaseline = 'top';
  ctx.fillText(title, 28, 24, W - 56);
  ctx.fillRect(28, 72, W - 56, 2);
  ctx.font = `400 25px ${font}`;
  lines.slice(0, 6).forEach((l, i) => ctx.fillText(l, 28, 92 + i * 36, W - 56));
}

export function HoloScreen({ position, yaw, color, title, lines, width = 0.8, reduced, active = false }: HoloScreenProps) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, [canvas]);
  const key = `${title}\n${lines.join('\n')}`;
  // three.js objects are mutated through the mesh ref (the universe scene's pattern).
  const mesh = useRef<THREE.Mesh>(null);
  const shader = () => mesh.current?.material as THREE.MeshBasicMaterial | undefined;

  const material = useMemo(() => {
    const uniforms = { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uFlicker: { value: reduced ? 0 : 1 } };
    const m = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      const decl = 'uniform vec3 uColor;\nuniform float uTime;\nuniform float uFlicker;\nvoid main() {';
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', decl).replace('#include <map_fragment>', MAP_FRAGMENT);
    };
    m.customProgramCacheKey = () => 'shipyard-holo-screen';
    return m;
  }, [texture, color, reduced]);
  useEffect(
    () => () => {
      material.dispose();
      texture.dispose();
    },
    [material, texture],
  );
  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScreen(ctx, title, lines);
    texture.needsUpdate = true;
    // `key` carries title and lines; the arrays themselves are rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, canvas, texture]);
  useFrame((state) => {
    const m = shader();
    if (!m) return;
    (m.userData.uniforms as { uTime: { value: number } }).uTime.value = reduced ? 0 : state.clock.elapsedTime;
    m.opacity = active ? 1 : 0.85;
  });

  const h = width * (H / W);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh ref={mesh} material={material} name="holo-screen" userData={{ selectiveBloom: true }}>
        <planeGeometry args={[width, h]} />
      </mesh>
      {/* A thin dark mount so the screen reads as hung, not floating. */}
      <mesh position={[0, -h / 2 - 0.03, -0.02]}>
        <boxGeometry args={[width * 0.9, 0.04, 0.04]} />
        <meshStandardMaterial color="#2A2423" roughness={0.8} />
      </mesh>
    </group>
  );
}
