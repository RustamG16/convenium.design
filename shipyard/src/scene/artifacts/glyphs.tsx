// Eleven family glyphs for the DOM (the no-WebGL view, chips, the Armory): 24px, 1.5px cotton
// stroke, the family pigment as a 0.2 fill. Decorative: the artifact's name carries the meaning,
// so each glyph is aria-hidden and sits beside text.
import type { ReactNode } from 'react';
import { drawFamily, type DrawFamily, type FamilyId } from './familyIds';

const SHAPES: Record<DrawFamily, ReactNode> = {
  // v2 fallback for a family with no glyph yet: a faceted stone in a ring
  relic: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6 16 12l-4 6-4-6z" />
    </>
  ),
  // faceted lens in a ring
  lens: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.5 17 10v4l-5 3.5L7 14v-4z" />
      <path d="M7 10l5 2.5L17 10M12 12.5v5" />
    </>
  ),
  // open-jaw wrench
  wrench: (
    <>
      <path d="M14.5 3.5a4.5 4.5 0 0 0-4 6.3L3.8 16.5a2 2 0 0 0 2.8 2.8l6.7-6.7a4.5 4.5 0 0 0 6.3-4l-3 3-2.6-.6-.6-2.6z" />
      <circle cx="5.6" cy="17.4" r="0.9" />
    </>
  ),
  // three nested rings
  gyroscope: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="3.4" />
      <ellipse cx="12" cy="12" rx="3.4" ry="9" />
      <circle cx="12" cy="12" r="6.2" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  // projector pack with a light cone
  projector: (
    <>
      <rect x="2.5" y="8" width="8" height="8" rx="1.5" />
      <path d="M10.5 10.5 21 6v12l-10.5-4.5z" />
      <circle cx="6.5" cy="12" r="1.6" />
    </>
  ),
  // feather quill with a drop
  quill: (
    <>
      <path d="M19.5 3.5C12 4 7.5 8.5 7 15.5l-3 5M19.5 3.5c0 7-4 11.5-11 12" />
      <path d="M12.5 11 9.5 14" />
      <circle cx="4.2" cy="20.2" r="0.9" />
    </>
  ),
  // signet on a chain
  seal: (
    <>
      <circle cx="12" cy="15" r="5.5" />
      <path d="M12 11.8 13 14l2.2.3-1.7 1.5.5 2.3-2-1.2-2 1.2.5-2.3L8.8 14.3 11 14z" />
      <path d="M7.5 9c0-4 9-4 9 0" />
    </>
  ),
  // three-stage spyglass
  spyglass: (
    <>
      <path d="M3 14.5 14 8l1.4 2.4L4.4 17z" />
      <path d="M14 8l3-1.7 1.2 2L15.4 10M18.2 8.3l2.6-1.5" />
      <circle cx="4.2" cy="16" r="1.1" />
    </>
  ),
  // calipers with a readout
  calipers: (
    <>
      <path d="M3 8h18v3H8.5v6H5.5v-6H3z" />
      <path d="M14 11v6h3v-6" />
      <rect x="9.5" y="4" width="5" height="2.4" rx="0.5" />
    </>
  ),
  // two cogs
  gearbox: (
    <>
      <circle cx="9" cy="12" r="4.4" />
      <circle cx="9" cy="12" r="1.3" />
      <path d="M9 5.6v1.4M9 17v1.4M2.6 12H4M14 12h1.4M4.5 7.5l1 1M12.5 15.5l1 1M4.5 16.5l1-1M12.5 8.5l1-1" />
      <circle cx="17.5" cy="15.5" r="3.2" />
      <circle cx="17.5" cy="15.5" r="0.9" />
    </>
  ),
  // bound tome with a clasp
  codex: (
    <>
      <rect x="5.5" y="3.5" width="13" height="17" rx="1.5" />
      <path d="M8.5 3.5v17M13.5 9h3M13.5 12h3" />
      <rect x="17.5" y="10.5" width="2" height="3" rx="0.4" />
    </>
  ),
  // core with two moons on tracks
  orrery: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-24 12 12)" />
      <circle cx="19" cy="8.4" r="1.4" />
      <circle cx="5.4" cy="15.6" r="1.1" />
    </>
  ),
};

/** `family` may be any id: one without a glyph draws as the relic (v2). */
export function FamilyGlyph({ family, pigment, size = 24 }: { family: string; pigment: string; size?: number }) {
  const shape = drawFamily(family);
  return (
    <svg className="glyph" data-family={shape} width={size} height={size} viewBox="0 0 24 24" fill={pigment} fillOpacity={0.2} stroke="var(--cotton, #edebdd)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
      {SHAPES[shape]}
    </svg>
  );
}

export const GLYPH_FAMILIES = (Object.keys(SHAPES) as DrawFamily[]).filter((f): f is FamilyId => f !== 'relic');
