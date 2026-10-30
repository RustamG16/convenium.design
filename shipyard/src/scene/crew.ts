// The scene's view of a crew member: everything the 3D and the DOM profile need, resolved from the
// ship and the knowledge base once, so no scene file reads either. Replaces ArkhEthos's fixed
// `CrewIdentity` (seven people, in source) with the ship's own crew (1 to 8, from the store or the
// library). Artifacts are resolved here too: the scene never looks a skill up.
import type { KbIndex } from '../kb/artifacts';
import type { Anchor, Member, Ship } from '../domain/schema';
import { isStage } from '../domain/schema';
import { BODIES, type BodyId } from './bodies';

export interface WornArtifact {
  skill: string;
  anchor: Anchor;
  /** socket on the anchor (belt 0..2, orbit 0..1) */
  index: number;
  /** family id from `artifacts.json` (lens, wrench, ...); empty when the skill left the library */
  family: string;
  pigment: string;
  tier: 'core' | 'swappable' | 'library' | 'dormant';
  name: string;
  /** where on the body it sits: the registry anchor's bone, offset in metres, and its spread/radius */
  slot: { bone: string; offset: [number, number, number]; spread?: number; radius?: number };
}

export interface SceneMember {
  id: string;
  name: string;
  pigment: string;
  glyph: string;
  station: number;
  agent: string;
  role: { title: string; agent: string };
  species: string;
  essence: string;
  analogy: string;
  plainMeaning: string;
  working: string;
  strengths: readonly string[];
  blindSpots: readonly string[];
  motivations: readonly string[];
  growthPaths: readonly string[];
  body: BodyId;
  /** the file, sheet and height the scene draws; `glb` null means the procedural stand-in */
  model: { glb: string | null; sheet: string | null; heightM: number };
  /** a recruit (not a library character): its body gets a pigment rim light instead of a recolour */
  recruit: boolean;
  /** the skill the member's first stage opens: it orbits and lights the holo screen */
  active: string | null;
  loadout: WornArtifact[];
}

export function wornArtifacts(idx: KbIndex, member: Member): WornArtifact[] {
  const out: WornArtifact[] = [];
  for (const e of member.loadout) {
    const s = idx.skill.get(e.skill);
    if (!s) continue; // retired: nothing to draw; the DOM shows the retired chip (T6)
    const a = idx.kb.anchors[e.anchor];
    out.push({ skill: e.skill, anchor: e.anchor, index: e.index ?? 0, family: s.artifact.family, pigment: s.artifact.pigment, tier: s.artifact.tier, name: s.artifact.name, slot: { bone: a.bone, offset: a.offset, spread: a.spread, radius: a.radius } });
  }
  return out;
}

export function sceneMember(idx: KbIndex, ship: Ship, member: Member): SceneMember {
  const ch = member.character;
  const crew = ch.fromCrew ? idx.crew.get(ch.fromCrew) : undefined;
  const body = BODIES[ch.body] ?? BODIES.standin;
  const active = ship.voyage.find((v) => isStage(v) && v.member === member.id && v.activeSkill);
  return {
    id: member.id,
    name: ch.name,
    pigment: ch.pigment,
    glyph: ch.glyph ?? crew?.glyph ?? '',
    station: member.station,
    agent: member.agent,
    role: { title: crew?.role.title ?? member.agent, agent: member.agent },
    species: ch.species ?? crew?.species ?? '',
    essence: ch.essence ?? crew?.essence ?? '',
    analogy: ch.analogy ?? crew?.analogy ?? '',
    plainMeaning: crew?.plainMeaning ?? idx.agent.get(member.agent)?.description ?? '',
    working: crew?.working ?? '',
    strengths: crew?.strengths ?? [],
    blindSpots: (crew?.blindSpots ?? []).map((b) => b.hypothesis),
    motivations: crew?.motivations ?? [],
    growthPaths: crew?.growthPaths ?? [],
    body: ch.body,
    model: { glb: body.glb, sheet: body.sheet, heightM: body.heightM },
    recruit: !ch.fromCrew,
    active: active && isStage(active) ? active.activeSkill : null,
    loadout: wornArtifacts(idx, member),
  };
}

export function sceneCrew(idx: KbIndex, ship: Ship): SceneMember[] {
  return [...ship.crew].sort((a, b) => a.station - b.station).map((m) => sceneMember(idx, ship, m));
}

/** What a member's holo screen lists: the artifact its first stage opens and how many it carries. */
export function screenLines(m: SceneMember): string[] {
  const lines = [m.active ? `Active: ${m.active}` : 'Active: none', `carries ${m.loadout.length}`];
  for (const a of m.loadout.filter((x) => x.skill !== m.active).slice(0, 3)) lines.push(a.name);
  if (m.loadout.length === 0) lines.push(`Working: ${m.working}`);
  return lines;
}
