/**
 * v2 variants (plan Phase 5): tune a crew member for this ship only, then trial the ship against its
 * original. A member's `override` changes what the exported run plan asks for, never the library:
 *
 * - `model`: the tier this ship spawns the agent at (written into the phase's `model` in 00-run-plan.md);
 * - `addendum`: a few lines of extra instruction, quoted in the kickoff prompt for that agent's phases.
 *
 * Which skill a stage opens is already per ship (the stage's active skill), so it is not duplicated
 * here. "Promote to library" is the only path from an override into library/, through the Forge.
 */
import type { KbIndex } from '../kb/artifacts';
import type { CrewResult } from './crew';
import type { Member, MemberOverride, Ship } from './schema';

export type Tier = 'opus' | 'sonnet' | 'haiku' | 'inherit';

export const ADDENDUM_MAX = 600;

/** The tier this ship actually spawns the member at: the override, else the agent file's model. */
export function effectiveModel(idx: KbIndex, member: Member): Tier {
  return member.override?.model ?? idx.agent.get(member.agent)?.model ?? 'inherit';
}

/** True when the member differs from its library agent on this ship. */
export function isTuned(idx: KbIndex, member: Member): boolean {
  const o = member.override;
  if (!o) return false;
  const lib = idx.agent.get(member.agent)?.model;
  return (o.model !== undefined && o.model !== lib) || Boolean(o.addendum?.trim());
}

/** Normalise an override: drop a model equal to the library's and an empty addendum; null when nothing is left. */
export function normalizeOverride(idx: KbIndex, member: Member, o: MemberOverride | null): MemberOverride | null {
  if (!o) return null;
  const lib = idx.agent.get(member.agent)?.model;
  const out: MemberOverride = {};
  if (o.model && o.model !== lib) out.model = o.model;
  const text = o.addendum?.replace(/\r\n/g, '\n').trim();
  if (text) out.addendum = text.slice(0, ADDENDUM_MAX);
  return Object.keys(out).length ? out : null;
}

export function setOverride(idx: KbIndex, ship: Ship, memberId: string, o: MemberOverride | null): CrewResult {
  const m = ship.crew.find((x) => x.id === memberId);
  if (!m) return { ok: false, reason: `No crew member ${memberId} on ${ship.name}.` };
  const next = normalizeOverride(idx, m, o);
  if (JSON.stringify(next ?? null) === JSON.stringify(m.override ?? null)) return { ok: false, reason: 'No change.' };
  const member: Member = { ...m };
  if (next) member.override = next;
  else delete member.override;
  return { ok: true, ship: { ...ship, crew: ship.crew.map((x) => (x.id === memberId ? member : x)) }, member };
}

/**
 * Words in an addendum that would widen the run beyond the run plan: the protocol says an agent not in
 * the plan does not run and a phase opens one skill body. PF-16 warns on them.
 */
const WIDENS = /\b(spawn|sub-?agents?|delegate|load (another|other|more) skills?|open (another|other|more) skills?|skip (the )?gates?|ignore (the )?(run plan|gates?))\b/i;

export function addendumProblems(idx: KbIndex, member: Member, openedSkills: ReadonlySet<string>): string[] {
  const text = member.override?.addendum ?? '';
  if (!text) return [];
  const out: string[] = [];
  const w = text.match(WIDENS);
  if (w) out.push(`its addendum says "${w[0]}", which would widen the run beyond the run plan`);
  for (const id of idx.skill.keys()) {
    if (id.length < 4 || openedSkills.has(id)) continue;
    if (new RegExp(`(^|[^a-z0-9-])${id.replace(/[-]/g, '\\-')}([^a-z0-9-]|$)`).test(text)) out.push(`its addendum names the skill ${id}, which none of its stages opens`);
  }
  return out;
}

/** "SS Full Run B", then C, D… — the first letter not already used by a ship of that name. */
export function variantName(name: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const stem = name.replace(/ [B-Z]$/, '');
  for (let c = 66; c <= 90; c++) {
    const n = `${stem} ${String.fromCharCode(c)}`.slice(0, 48);
    if (!used.has(n)) return n;
  }
  return `${stem} variant`.slice(0, 48);
}

/**
 * True when two or more ships have the same crew, loadouts and voyage and differ only in tuning (a
 * model tier or an addendum). A dry run cannot tell such ships apart on quality — it reads a tier only
 * as cost and never reads an addendum — so the Regatta says so instead of naming a winner (finish
 * review v2, M1).
 */
export function onlyTuningDiffers(ships: readonly Ship[]): boolean {
  if (ships.length < 2) return false;
  const shape = (s: Ship) => JSON.stringify({ crew: s.crew.map((m) => [m.id, m.agent, m.loadout.map((l) => l.skill)]), voyage: s.voyage });
  const tuning = (s: Ship) => JSON.stringify(s.crew.map((m) => m.override ?? null));
  const first = shape(ships[0]);
  return ships.every((s) => shape(s) === first) && new Set(ships.map(tuning)).size > 1;
}
