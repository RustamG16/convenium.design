// v3 Space Regatta Arcade art (plan/13-build-plan-v3.md § Art). Every file is in public/media/arcade/,
// written by scripts/import-arcade-art.py from the approved concept renders.
import { withBase } from './baseUrl';

const LIBRARY_ART = ['ss-full-run', 'ss-abridged', 'ss-mobile-retrofit', 'ss-mobile-fleet', 'ss-site-pass'] as const;
type ArtId = (typeof LIBRARY_ART)[number];
const BY_HULL: Record<string, ArtId> = { 'ship-a': 'ss-full-run', 'ship-b': 'ss-abridged', 'ship-c': 'ss-mobile-retrofit', 'ship-d': 'ss-mobile-fleet', 'ship-e': 'ss-site-pass' };

/** The colour each ship render is painted in: lanes, rims and bars take it. */
export const ART_TINT: Record<ArtId, string> = {
  'ss-full-run': '#ff3b3f',
  'ss-abridged': '#f4b740',
  'ss-mobile-retrofit': '#45d39a',
  'ss-mobile-fleet': '#c36bff',
  'ss-site-pass': '#5aa8ff',
};

type ShipLike = { id: string; hull?: string; origin?: { from?: string | null; workflow?: string | null } | null };

function artId(ship: ShipLike, hull?: string): ArtId {
  for (const c of [ship.id, ship.origin?.workflow, ship.origin?.from]) if (c && (LIBRARY_ART as readonly string[]).includes(c)) return c as ArtId;
  return BY_HULL[hull ?? ship.hull ?? ''] ?? 'ss-full-run';
}

/** A library ship and its copies wear the library render; any other ship wears its hull's. */
export function shipArt(ship: ShipLike, hull?: string): { src: string; tint: string; id: ArtId } {
  const id = artId(ship, hull);
  return { src: withBase(`/media/arcade/ship-${id}.webp`), tint: ART_TINT[id], id };
}

const CREW_BY_AGENT: Record<string, string> = {
  'design-director': 'captain',
  'brand-strategist': 'strategist',
  'visual-analyst': 'analyst',
  'independent-critic': 'critic',
  'design-engineer': 'engineer',
  'asset-producer': 'producer',
  'analytics-specialist': 'metrics',
  'fleet-measurer': 'gauge',
};
const CREW_IDS = new Set(Object.values(CREW_BY_AGENT));

/** The alien crew render for an agent (or a crew id); null for an agent the library has no art for yet. */
export function crewArt(agentOrId: string): { stage: string; card: string } | null {
  const id = CREW_IDS.has(agentOrId) ? agentOrId : CREW_BY_AGENT[agentOrId];
  if (!id) return null;
  return { stage: withBase(`/media/arcade/crew-${id}.webp`), card: withBase(`/media/arcade/card-${id}.webp`) };
}

export const arcadeMedia = (file: string) => withBase(`/media/arcade/${file}`);
