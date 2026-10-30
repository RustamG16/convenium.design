import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildArtifact, coneMaterial, FAMILY_IDS, familyMaterial, familyParts, isFamilyId, TRIANGLE_BUDGET, triangleCount } from '../../src/scene/artifacts/families';
import { tiltOf, variantOf, VARIANTS } from '../../src/scene/artifacts/variant';
import { loadIndexFromDisk } from './helpers';

describe('artifact families', () => {
  it('has the eleven families the registry defines, each a known mesh recipe', () => {
    const idx = loadIndexFromDisk();
    expect(idx.kb.families.map((f) => f.id).sort()).toEqual([...FAMILY_IDS].sort());
  });

  for (const family of FAMILY_IDS) {
    it(`${family}: four variants, each within ${TRIANGLE_BUDGET} triangles, none empty`, () => {
      for (const v of VARIANTS) {
        const parts = familyParts(family, v);
        const n = triangleCount(parts);
        expect(n, `${family} v${v}`).toBeGreaterThan(0);
        expect(n, `${family} v${v}`).toBeLessThanOrEqual(TRIANGLE_BUDGET);
        const box = new THREE.Box3().setFromObject(buildArtifact(family, v, '#ffffff').group);
        const size = box.getSize(new THREE.Vector3());
        // Hand-sized: between 4 cm and 40 cm on the longest side.
        expect(Math.max(size.x, size.y, size.z), `${family} v${v} size`).toBeGreaterThan(0.04);
        expect(Math.max(size.x, size.y, size.z), `${family} v${v} size`).toBeLessThan(0.4);
      }
    });

    it(`${family}: one shared MeshStandard material (metalness 0.6, roughness 0.35, emissive 0.6)`, () => {
      const m = familyMaterial(family, '#E8C46A');
      expect(m.metalness).toBe(0.6);
      expect(m.roughness).toBe(0.35);
      expect(m.emissiveIntensity).toBe(0.6);
      expect(m.emissive.getHexString()).toBe('e8c46a');
      for (const v of VARIANTS) {
        const meshes: THREE.Mesh[] = [];
        buildArtifact(family, v, '#E8C46A').group.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && o.userData.kind === 'main') meshes.push(o as THREE.Mesh);
        });
        for (const mesh of meshes) expect(mesh.material).toBe(m);
      }
    });
  }

  it('the projector cone is the only additive extra', () => {
    expect(coneMaterial('#E79A8E').opacity).toBe(0.25);
    expect(coneMaterial('#E79A8E').blending).toBe(THREE.AdditiveBlending);
  });

  it('shares geometry between instances of a variant', () => {
    expect(familyParts('lens', 0)).toBe(familyParts('lens', 0));
  });
});

describe('variants', () => {
  it('are deterministic and spread over the four', () => {
    expect(variantOf('visual-qa')).toBe(variantOf('visual-qa'));
    const idx = loadIndexFromDisk();
    const seen = new Set(idx.kb.skills.map((s) => variantOf(s.id)));
    expect(seen.size).toBe(4);
    for (const s of idx.kb.skills) expect(Math.abs(tiltOf(s.id))).toBeLessThanOrEqual((12 * Math.PI) / 180 + 1e-9);
  });

  it('renders every registry skill through its family, with a variant that stays in budget', () => {
    const idx = loadIndexFromDisk();
    expect(idx.kb.skills.length).toBeGreaterThanOrEqual(101);
    for (const s of idx.kb.skills) {
      expect(isFamilyId(s.artifact.family), s.id).toBe(true);
      const parts = familyParts(s.artifact.family as (typeof FAMILY_IDS)[number], variantOf(s.id));
      expect(triangleCount(parts), s.id).toBeLessThanOrEqual(TRIANGLE_BUDGET);
    }
  });
});
