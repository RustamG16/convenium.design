/**
 * Armory filtering. Pure. The haystack of every skill is lower-cased once (`buildHaystack`), so a
 * keystroke is one pass of `includes` over 101 strings: well under the 50 ms budget (unit-tested).
 */
import { equipNotes } from '../../domain/loadout';
import type { KbIndex } from '../../kb/artifacts';
import type { KbSkill } from '../../kb/schema';

export interface Filters {
  q: string;
  /** artifact family id */
  family: string | null;
  phase: string | null;
  tier: string | null;
  /** only skills the selected member's agent can wear without a warning */
  fits: boolean;
  uninspected: boolean;
}

export const NO_FILTERS: Filters = { q: '', family: null, phase: null, tier: null, fits: false, uninspected: false };

export const PHASES = ['always', 'diagnose', 'direct', 'prepare', 'build', 'verify', 'unrouted'] as const;

export interface Entry {
  skill: KbSkill;
  hay: string;
}

export function buildHaystack(skills: readonly KbSkill[]): Entry[] {
  return skills.map((skill) => ({ skill, hay: `${skill.id} ${skill.name} ${skill.artifact.name} ${skill.description} ${skill.group} ${skill.category}`.toLowerCase() }));
}

export function filterEntries(entries: readonly Entry[], f: Filters, ctx: { codex: ReadonlySet<string>; idx: KbIndex; agent?: string }): KbSkill[] {
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const out: KbSkill[] = [];
  for (const { skill, hay } of entries) {
    if (f.family && skill.artifact.family !== f.family) continue;
    if (f.phase && skill.phase !== f.phase) continue;
    if (f.tier && skill.artifact.tier !== f.tier) continue;
    if (f.uninspected && ctx.codex.has(skill.id)) continue;
    if (terms.length && !terms.every((t) => hay.includes(t))) continue;
    if (f.fits && ctx.agent && equipNotes(ctx.idx, ctx.agent, skill.id).some((n) => n.severity !== 'info')) continue;
    out.push(skill);
  }
  return out;
}

export function familyCounts(skills: readonly KbSkill[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of skills) m.set(s.artifact.family, (m.get(s.artifact.family) ?? 0) + 1);
  return m;
}
