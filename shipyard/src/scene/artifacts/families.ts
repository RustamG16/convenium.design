// The eleven artifact families as procedural meshes (06 section 5, `library/registry/artifacts.json`
// `mesh` recipes). Each family builds four variants (a stable hash of the skill id picks one) of at
// most 600 triangles, in metres, centred on the origin with +Y up and +Z forward. All parts of a
// family share one MeshStandard material (metalness 0.6, roughness 0.35, emissive = the family
// pigment at 0.6); the projector's light cone is the one extra, an additive basic material.
//
// Pure three, no React: unit-tested for the triangle budget in tests/unit/artifacts.test.ts.
import * as THREE from 'three';
import type { Variant } from './variant';

type V3 = [number, number, number];

export type PartKind = 'main' | 'cone';

export interface Part {
  geometry: THREE.BufferGeometry;
  kind: PartKind;
  position?: V3;
  rotation?: V3;
  scale?: V3;
  /** radians per second about the part's own axes; static under reduced motion */
  spin?: V3;
  /** the part circles the origin in a plane tilted about X (orrery moons) */
  orbit?: { radius: number; rate: number; tilt: number; phase: number };
  /** one geometry drawn at many places (the seal's chain): counted per instance */
  instances?: { position: V3; rotation: V3 }[];
}

import type { FamilyId } from './familyIds';
export { FAMILY_IDS, isFamilyId, type FamilyId } from './familyIds';
export const TRIANGLE_BUDGET = 600;

const HALF_PI = Math.PI / 2;

function tris(g: THREE.BufferGeometry): number {
  return g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
}

export function triangleCount(parts: readonly Part[]): number {
  return parts.reduce((n, p) => n + tris(p.geometry) * (p.instances?.length ?? 1), 0);
}

const torus = (r: number, tube: number, radial: number, tubular: number) => new THREE.TorusGeometry(r, tube, radial, tubular);
const extrude = (shape: THREE.Shape, depth: number) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  return g;
};
const polygon = (pts: [number, number][]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));

// ---------------------------------------------------------------------------

function lens(v: Variant): Part[] {
  // A faceted prism lens in a brass ring. Variants: facet detail, a second ring, the gem's place.
  const facets = v === 1 || v === 3 ? 1 : 0;
  const parts: Part[] = [
    { geometry: new THREE.LatheGeometry([new THREE.Vector2(0.062, -0.006), new THREE.Vector2(0.07, -0.006), new THREE.Vector2(0.07, 0.006), new THREE.Vector2(0.062, 0.006), new THREE.Vector2(0.062, -0.006)], 20), kind: 'main', rotation: [HALF_PI, 0, 0] },
    { geometry: new THREE.IcosahedronGeometry(0.056, facets), kind: 'main', scale: [1, 1, 0.45] },
  ];
  if (v >= 2) parts.push({ geometry: new THREE.LatheGeometry([new THREE.Vector2(0.074, -0.004), new THREE.Vector2(0.081, -0.004), new THREE.Vector2(0.081, 0.004), new THREE.Vector2(0.074, 0.004), new THREE.Vector2(0.074, -0.004)], 20), kind: 'main', rotation: [HALF_PI, 0, 0] });
  const angle = [0.6, 2.2, 3.9, 5.3][v];
  parts.push({ geometry: new THREE.IcosahedronGeometry(0.011, 0), kind: 'main', position: [Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, 0.008] });
  return parts;
}

function wrench(v: Variant): Part[] {
  // A double-ended wrench with a glowing core: open jaw on one end, a ring on the other.
  const jaw = [0.017, 0.014, 0.02, 0.015][v];
  const open = polygon([
    [-0.016, -0.1], [0.016, -0.1], [0.016, 0.06], [0.04, 0.075], [0.048, 0.12], [0.04, 0.165], [jaw, 0.178], [jaw, 0.128], [-jaw, 0.128], [-jaw, 0.178], [-0.04, 0.165], [-0.048, 0.12], [-0.04, 0.075], [-0.016, 0.06],
  ]);
  const head = new THREE.Shape();
  head.absarc(0, -0.13, 0.04, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, -0.13, [0.022, 0.026, 0.018, 0.024][v], 0, Math.PI * 2, true);
  head.holes.push(hole);
  const coreY = [0.0, -0.13, 0.05, -0.04][v];
  return [
    { geometry: extrude(open, 0.02), kind: 'main', scale: [1, [1, 1.1, 0.92, 1.18][v], 1] },
    { geometry: extrude(head, 0.02), kind: 'main' },
    v % 2 === 0 ? { geometry: new THREE.IcosahedronGeometry(0.014, 0), kind: 'main', position: [0, coreY, 0.012] } : { geometry: new THREE.OctahedronGeometry(0.016, 0), kind: 'main', position: [0, coreY, 0.012] },
  ];
}

function gyroscope(v: Variant): Part[] {
  // Three nested rings spinning on offset axes. Variants: ring section, axis offsets, a core gem.
  const tubular = [20, 18, 22, 16][v];
  const radial = v === 2 ? 3 : 4;
  const tilt = [0, 0.5, 0.9, 1.3][v];
  return [
    { geometry: torus(0.06, 0.004, radial, tubular), kind: 'main', rotation: [tilt, 0, 0], spin: [0, 1.1, 0] },
    { geometry: torus(0.05, 0.004, radial, tubular), kind: 'main', rotation: [0, HALF_PI, tilt], spin: [0.9, 0, 0] },
    { geometry: torus(0.04, 0.004, radial, tubular), kind: 'main', rotation: [HALF_PI, tilt, 0], spin: [0, 0, 1.4] },
    { geometry: new THREE.IcosahedronGeometry(0.012, 0), kind: 'main' },
  ];
}

function projector(v: Variant): Part[] {
  // A shoulder-pack projector with a light cone (additive, opacity 0.25).
  const w = [0.12, 0.14, 0.1, 0.13][v];
  const lenses: V3[] = v === 1 || v === 3 ? [[-0.03, 0, 0.05], [0.03, 0, 0.05]] : [[0, 0, 0.05]];
  const parts: Part[] = [
    { geometry: new THREE.BoxGeometry(w, 0.08, 0.07), kind: 'main' },
    { geometry: new THREE.BoxGeometry(w + 0.01, 0.012, 0.074), kind: 'main', position: [0, 0.046, 0] },
  ];
  for (const p of lenses) {
    parts.push({ geometry: new THREE.CylinderGeometry(0.02, 0.026, 0.03, 12), kind: 'main', position: p, rotation: [HALF_PI, 0, 0] });
    parts.push({ geometry: new THREE.ConeGeometry([0.05, 0.06, 0.045, 0.055][v], [0.16, 0.2, 0.14, 0.18][v], 12, 1, true), kind: 'cone', position: [p[0], 0, p[2] + [0.095, 0.115, 0.085, 0.105][v]], rotation: [-HALF_PI, 0, 0] });
  }
  return parts;
}

function quill(v: Variant): Part[] {
  // A long feather quill with an ink drop: lathe shaft and two curved vanes.
  const len = [0.15, 0.17, 0.13, 0.16][v];
  const shaft = new THREE.LatheGeometry([new THREE.Vector2(0.002, -len), new THREE.Vector2(0.0035, -len * 0.7), new THREE.Vector2(0.002, len * 0.8), new THREE.Vector2(0.0006, len)], 6);
  const vane = (side: 1 | -1) => {
    const g = new THREE.PlaneGeometry(0.045, len * 1.5, 1, 6);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, 0.012 * (x / 0.0225) ** 2 + 0.004 * (y / len));
      // taper to the tip
      pos.setX(i, x * (1 - 0.55 * Math.max(0, (y + len * 0.2) / (len * 1.0))));
    }
    g.computeVertexNormals();
    g.translate(side * 0.0235, len * 0.05, 0);
    return g;
  };
  const parts: Part[] = [
    { geometry: shaft, kind: 'main' },
    { geometry: vane(1), kind: 'main' },
    { geometry: vane(-1), kind: 'main', scale: [v === 2 ? 0.7 : 1, 1, 1] },
  ];
  if (v !== 3) parts.push({ geometry: new THREE.IcosahedronGeometry(0.008, 0), kind: 'main', position: [0, -len - 0.01, 0] });
  return parts;
}

function seal(v: Variant): Part[] {
  // A round signet seal on a chain: disc, a raised emblem, and instanced chain links.
  const emblem: THREE.BufferGeometry = [new THREE.CylinderGeometry(0.024, 0.024, 0.01, 16), new THREE.OctahedronGeometry(0.026, 0), new THREE.ConeGeometry(0.026, 0.024, 6), torus(0.02, 0.005, 3, 12)][v];
  const links = 4 + (v % 3); // 4..6
  const instances = Array.from({ length: links }, (_, i) => {
    const a = (i / (links - 1) - 0.5) * Math.PI * 0.9;
    return { position: [Math.sin(a) * 0.07, 0.07 + Math.cos(a) * 0.04 - 0.02, 0] as V3, rotation: [0, i % 2 ? HALF_PI : 0, a] as V3 };
  });
  return [
    { geometry: new THREE.CylinderGeometry(0.045, 0.045, 0.014, 16), kind: 'main', rotation: [HALF_PI, 0, 0] },
    { geometry: emblem, kind: 'main', position: [0, 0, 0.012], rotation: v === 0 || v === 2 ? [HALF_PI, 0, 0] : [0, 0, 0] },
    { geometry: torus(0.012, 0.003, 3, 8), kind: 'main', instances },
  ];
}

function spyglass(v: Variant): Part[] {
  // A collapsible three-stage spyglass: stepped cylinders, bands at the joints, a lit lens.
  const radii = [0.024, 0.019, 0.014];
  const lengths = [[0.1, 0.09, 0.08], [0.12, 0.1, 0.08], [0.09, 0.09, 0.09], [0.1, 0.08, 0.11]][v];
  const parts: Part[] = [];
  let y = -lengths.reduce((a, b) => a + b, 0) / 2;
  lengths.forEach((l, i) => {
    parts.push({ geometry: new THREE.CylinderGeometry(radii[i], radii[i], l, 14), kind: 'main', position: [0, y + l / 2, 0] });
    if (i < 2) parts.push({ geometry: torus(radii[i] + 0.002, 0.002, 3, 14), kind: 'main', position: [0, y + l, 0], rotation: [HALF_PI, 0, 0] });
    y += l;
  });
  parts.push({ geometry: new THREE.CylinderGeometry(radii[0] * 1.15, radii[0] * 1.15, 0.008, 14), kind: 'main', position: [0, -lengths.reduce((a, b) => a + b, 0) / 2 - 0.004, 0] });
  if (v >= 2) parts.push({ geometry: new THREE.CylinderGeometry(radii[2] * 1.2, radii[2] * 1.2, 0.01, 14), kind: 'main', position: [0, y + 0.005, 0] });
  return parts;
}

function calipers(v: Variant): Part[] {
  // Vernier calipers with a readout: an extruded beam and fixed jaw, a sliding jaw, a lit plane.
  const beam = polygon([[-0.1, 0.032], [-0.1, -0.032], [-0.088, -0.032], [-0.088, -0.008], [0.1, -0.008], [0.1, 0.008], [-0.088, 0.008], [-0.088, 0.032]]);
  const gap = [0.05, 0.075, 0.035, 0.095][v];
  const x = -0.088 + gap;
  const parts: Part[] = [
    { geometry: extrude(beam, 0.008), kind: 'main' },
    { geometry: new THREE.BoxGeometry(0.014, 0.064, 0.012), kind: 'main', position: [x, 0, 0] },
    { geometry: new THREE.PlaneGeometry(0.042, 0.02), kind: 'main', position: [x + 0.03, 0.022, 0.0062] },
  ];
  if (v === 1 || v === 3) parts.push({ geometry: new THREE.BoxGeometry(0.008, 0.012, 0.012), kind: 'main', position: [0.085, 0.0, 0] });
  return parts;
}

function gear(teeth: number, outer: number, inner: number): THREE.BufferGeometry {
  const pts: [number, number][] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    for (const [da, r] of [[0, inner], [0.28, outer], [0.5, outer], [0.78, inner]] as [number, number][]) {
      const t = a + da * step;
      pts.push([Math.cos(t) * r, Math.sin(t) * r]);
    }
  }
  return extrude(polygon(pts), 0.016);
}

function gearbox(v: Variant): Part[] {
  // An open gearbox with two meshing cogs that counter-rotate, in a four-bar frame.
  const n = [8, 10, 12, 9][v];
  const m = Math.max(6, n - 2);
  const ra = 0.032;
  const rb = ra * (m / n);
  const spinA = 1.2;
  const bar = (x: number, y: number, w: number, h: number): Part => ({ geometry: new THREE.BoxGeometry(w, h, 0.04), kind: 'main', position: [x, y, 0] });
  return [
    bar(0, 0.05, 0.13, 0.008),
    bar(0, -0.05, 0.13, 0.008),
    bar(-0.061, 0, 0.008, 0.1),
    bar(0.061, 0, 0.008, 0.1),
    { geometry: gear(n, ra, ra * 0.8), kind: 'main', position: [-0.03, 0, 0], spin: [0, 0, spinA] },
    { geometry: gear(m, rb, rb * 0.8), kind: 'main', position: [-0.03 + ra + rb + 0.002, 0, 0], spin: [0, 0, -spinA * (n / m)] },
  ];
}

function codex(v: Variant): Part[] {
  // A small bound tome with a clasp. Variants: corner studs, a ribbon, the clasp's side.
  const parts: Part[] = [
    { geometry: new THREE.BoxGeometry(0.1, 0.14, 0.035), kind: 'main' },
    { geometry: new THREE.BoxGeometry(0.104, 0.144, 0.006), kind: 'main', position: [0, 0, 0.0205] },
    { geometry: new THREE.CylinderGeometry(0.0185, 0.0185, 0.144, 8), kind: 'main', position: [-0.05, 0, 0] },
    { geometry: new THREE.BoxGeometry(0.014, 0.03, 0.008), kind: 'main', position: [v === 3 ? -0.04 : 0.05, 0, 0.026] },
  ];
  if (v === 1 || v === 3) {
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push({ geometry: new THREE.BoxGeometry(0.01, 0.01, 0.008), kind: 'main', position: [sx * 0.045, sy * 0.065, 0.026] });
  }
  if (v === 2) parts.push({ geometry: new THREE.BoxGeometry(0.008, 0.05, 0.004), kind: 'main', position: [0.02, -0.095, 0] });
  return parts;
}

function orrery(v: Variant): Part[] {
  // A miniature orrery: a core and two moons on torus tracks.
  const tilt = [0.35, 0.6, 0.2, 0.8][v];
  const detail = v === 3 ? 7 : 8;
  return [
    { geometry: new THREE.SphereGeometry([0.022, 0.026, 0.02, 0.024][v], detail, 6), kind: 'main' },
    { geometry: torus(0.05, 0.002, 3, 24), kind: 'main', rotation: [HALF_PI + tilt, 0, 0] },
    { geometry: torus(0.075, 0.002, 3, 24), kind: 'main', rotation: [HALF_PI - tilt, 0, 0] },
    { geometry: new THREE.SphereGeometry([0.011, 0.014, 0.01, 0.013][v], 6, 4), kind: 'main', orbit: { radius: 0.05, rate: 1.3, tilt, phase: 0 } },
    { geometry: new THREE.SphereGeometry([0.014, 0.01, 0.016, 0.012][v], 6, 4), kind: 'main', orbit: { radius: 0.075, rate: 0.8, tilt: -tilt, phase: 2.4 } },
  ];
}

const BUILD: Record<FamilyId, (v: Variant) => Part[]> = { lens, wrench, gyroscope, projector, quill, seal, spyglass, calipers, gearbox, codex, orrery };

const cache = new Map<string, Part[]>();

/** The parts of one family variant. Built once and shared: geometry is never mutated after this. */
export function familyParts(family: FamilyId, variant: Variant): Part[] {
  const key = `${family}:${variant}`;
  let parts = cache.get(key);
  if (!parts) {
    parts = BUILD[family](variant);
    cache.set(key, parts);
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Materials: one MeshStandard per family, one additive cone per pigment.

const ASH = new THREE.Color('#8A7F78');
const materials = new Map<string, THREE.MeshStandardMaterial>();
const cones = new Map<string, THREE.MeshBasicMaterial>();

/** The family's single shared material: metalness 0.6, roughness 0.35, emissive = pigment at 0.6. */
export function familyMaterial(family: FamilyId, pigment: string): THREE.MeshStandardMaterial {
  const key = `${family}|${pigment}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(pigment).lerp(ASH, 0.3), metalness: 0.6, roughness: 0.35, emissive: new THREE.Color(pigment), emissiveIntensity: 0.6, side: THREE.DoubleSide });
    m.name = `artifact-${family}`;
    materials.set(key, m);
  }
  return m;
}

export function coneMaterial(pigment: string): THREE.MeshBasicMaterial {
  let m = cones.get(pigment);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(pigment), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    cones.set(pigment, m);
  }
  return m;
}

/** Where an orbiting part sits at time `t` seconds (its starting phase at t = 0). */
export function orbitAt(o: NonNullable<Part['orbit']>, t: number): V3 {
  const a = o.phase + t * o.rate;
  const x = Math.cos(a) * o.radius;
  const z = Math.sin(a) * o.radius;
  return [x, -Math.sin(o.tilt) * z, Math.cos(o.tilt) * z];
}

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const ONE = new THREE.Vector3(1, 1, 1);

export interface Artifact {
  group: THREE.Group;
  /** parts that move: the scene rotates them each frame unless motion is reduced */
  movers: { object: THREE.Object3D; spin?: V3; orbit?: Part['orbit'] }[];
}

/** One artifact object: meshes over the shared geometry and material. Dispose nothing here: both are shared. */
export function buildArtifact(family: FamilyId, variant: Variant, pigment: string): Artifact {
  const group = new THREE.Group();
  group.name = `artifact-${family}-${variant}`;
  const main = familyMaterial(family, pigment);
  const movers: Artifact['movers'] = [];
  for (const p of familyParts(family, variant)) {
    const material = p.kind === 'cone' ? coneMaterial(pigment) : main;
    let object: THREE.Object3D;
    if (p.instances) {
      const inst = new THREE.InstancedMesh(p.geometry, material, p.instances.length);
      p.instances.forEach((it, i) => {
        tmpQuat.setFromEuler(new THREE.Euler(...it.rotation));
        tmpMatrix.compose(new THREE.Vector3(...it.position), tmpQuat, ONE);
        inst.setMatrixAt(i, tmpMatrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      inst.frustumCulled = false;
      object = inst;
    } else {
      object = new THREE.Mesh(p.geometry, material);
    }
    if (p.position) object.position.set(...p.position);
    if (p.orbit) object.position.set(...orbitAt(p.orbit, 0));
    if (p.rotation) object.rotation.set(...p.rotation);
    if (p.scale) object.scale.set(...p.scale);
    object.userData.kind = p.kind;
    group.add(object);
    if (p.spin || p.orbit) movers.push({ object, spin: p.spin, orbit: p.orbit });
  }
  return { group, movers };
}

/** Dispose the shared caches (tests, hot reload). Live artifacts must not be drawn afterwards. */
export function disposeArtifactCaches(): void {
  for (const parts of cache.values()) for (const p of parts) p.geometry.dispose();
  cache.clear();
  for (const m of materials.values()) m.dispose();
  materials.clear();
  for (const m of cones.values()) m.dispose();
  cones.clear();
}
