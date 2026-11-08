/** What changed between two knowledge bases, in words the banner can say (v2 live library). Pure. */
import type { KbIndex } from './artifacts';

export interface KbDiff {
  added: { skills: string[]; agents: string[]; workflows: string[] };
  removed: { skills: string[]; agents: string[]; workflows: string[] };
  /** skills or agents whose record changed (description, routes, model, phase…) */
  changed: string[];
}

function keyed<T extends { id: string }>(xs: readonly T[]): Map<string, string> {
  return new Map(xs.map((x) => [x.id, JSON.stringify(x)]));
}

function delta(a: Map<string, string>, b: Map<string, string>) {
  const added = [...b.keys()].filter((k) => !a.has(k));
  const removed = [...a.keys()].filter((k) => !b.has(k));
  const changed = [...b.keys()].filter((k) => a.has(k) && a.get(k) !== b.get(k));
  return { added, removed, changed };
}

export function diffKb(before: KbIndex, after: KbIndex): KbDiff {
  const s = delta(keyed(before.kb.skills), keyed(after.kb.skills));
  const a = delta(keyed(before.kb.agents), keyed(after.kb.agents));
  const w = delta(keyed(before.kb.workflows.ships), keyed(after.kb.workflows.ships));
  return {
    added: { skills: s.added, agents: a.added, workflows: w.added },
    removed: { skills: s.removed, agents: a.removed, workflows: w.removed },
    changed: [...s.changed, ...a.changed, ...w.changed],
  };
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** "2 new skills · 1 new agent · 3 changed", or "No visible change" — never a number without its noun. */
export function describeDiff(d: KbDiff): string {
  const parts: string[] = [];
  if (d.added.skills.length) parts.push(`${plural(d.added.skills.length, 'new skill')}`);
  if (d.added.agents.length) parts.push(`${plural(d.added.agents.length, 'new agent')}`);
  if (d.added.workflows.length) parts.push(`${plural(d.added.workflows.length, 'new workflow')}`);
  const gone = d.removed.skills.length + d.removed.agents.length + d.removed.workflows.length;
  if (gone) parts.push(`${gone} removed`);
  if (d.changed.length) parts.push(`${d.changed.length} changed`);
  return parts.length ? parts.join(' · ') : 'No visible change';
}
