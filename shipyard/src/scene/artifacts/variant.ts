// Per-skill variation, deterministic and runtime-random-free (06 section 5): a stable hash of the
// skill id picks one of four variants of the family mesh and a small tilt, so 31 gyroscopes are not
// identical and the same skill always looks the same.

/** FNV-1a, 32 bit. */
export function hashOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Variant = 0 | 1 | 2 | 3;
export const VARIANTS: readonly Variant[] = [0, 1, 2, 3];

export function variantOf(skillId: string): Variant {
  return (hashOf(skillId) % 4) as Variant;
}

/** A tilt in radians within plus or minus 12 degrees, from another slice of the hash. */
export function tiltOf(skillId: string): number {
  const step = (hashOf(`${skillId}:tilt`) >>> 3) % 25; // 0..24
  return ((step - 12) * Math.PI) / 180;
}
