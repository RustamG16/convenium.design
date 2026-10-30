/** Read helpers over the knowledge base. Pure; counts always come from the KB, never a constant. */
import type { KbAgent, KbCrew, KbSkill, KbWorkflow, KnowledgeBase, KbStage } from './schema';

export interface KbIndex {
  kb: KnowledgeBase;
  skill: Map<string, KbSkill>;
  agent: Map<string, KbAgent>;
  crew: Map<string, KbCrew>;
  workflow: Map<string, KbWorkflow>;
}

export function indexKb(kb: KnowledgeBase): KbIndex {
  return {
    kb,
    skill: new Map(kb.skills.map((s) => [s.id, s])),
    agent: new Map(kb.agents.map((a) => [a.id, a])),
    crew: new Map(kb.crew.map((c) => [c.id, c])),
    workflow: new Map(kb.workflows.ships.map((w) => [w.id, w])),
  };
}

export const isKbStage = (s: KbWorkflow['stages'][number]): s is KbStage => 'id' in s;

/** The crew a library workflow names across its stages, in station order. */
export function workflowCrew(kb: KnowledgeBase, workflow: KbWorkflow): KbCrew[] {
  const ids = new Set<string>();
  for (const s of workflow.stages) if (isKbStage(s)) s.crew.forEach((c) => ids.add(c));
  return kb.crew.filter((c) => ids.has(c.id)).sort((a, b) => a.station - b.station);
}

export function skillCount(kb: KnowledgeBase): number {
  return kb.skills.length;
}

export function tierCounts(kb: KnowledgeBase): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of kb.skills) out[s.artifact.tier] = (out[s.artifact.tier] ?? 0) + 1;
  return out;
}
