// The eight bodies a crew member can wear: the seven owner-generated GLBs and the procedural
// stand-in. Heights are the ArkhEthos crew identities' `model.heightM`; the files and sheets are
// the imported media (public/media/crew/*, plan/05-asset-manifest.md). `standin` has no file.
import type { Character } from '../domain/schema';

export type BodyId = Character['body'];

export interface Body {
  /** base-free path of the rigged GLB, or null for the stand-in */
  glb: string | null;
  /** base-free path stem of the design sheet (`-640.webp` / `-1280.webp` follow), or null */
  sheet: string | null;
  heightM: number;
}

export const BODIES: Record<BodyId, Body> = {
  captain: { glb: '/media/crew/captain.glb', sheet: 'crew/captain-sheet', heightM: 2.1 },
  strategist: { glb: '/media/crew/strategist.glb', sheet: 'crew/strategist-sheet', heightM: 1.7 },
  analyst: { glb: '/media/crew/analyst.glb', sheet: 'crew/analyst-sheet', heightM: 1.3 },
  critic: { glb: '/media/crew/critic.glb', sheet: 'crew/critic-sheet', heightM: 2.0 },
  engineer: { glb: '/media/crew/engineer.glb', sheet: 'crew/engineer-sheet', heightM: 1.8 },
  producer: { glb: '/media/crew/producer.glb', sheet: 'crew/producer-sheet', heightM: 1.2 },
  metrics: { glb: '/media/crew/metrics.glb', sheet: 'crew/metrics-sheet', heightM: 1.9 },
  standin: { glb: null, sheet: null, heightM: 1.8 },
};

/** Every body GLB path, for preloading and the network assertion in the e2e. */
export const BODY_GLBS = Object.values(BODIES).flatMap((b) => (b.glb ? [b.glb] : []));
