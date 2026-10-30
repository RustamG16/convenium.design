// The corridor card's pipeline, read from the ship: phases in voyage order, who works each, and the
// gates after them. Pure, so it is unit-tested without the scene.
import { isGate, isStage, type Phase, type Ship } from '../../domain/schema';
import type { SceneMember } from '../../scene/crew';

export const PHASE_LABEL: Record<Phase, string> = { always: 'Always', diagnose: 'Diagnose', direct: 'Direct', prepare: 'Prepare', build: 'Build', verify: 'Verify' };

/** The voyage's phases in order, who works each, and the gates after them (read from the ship, not prose). */
export function pipelineOf(ship: Ship, crew: readonly SceneMember[]): { phase: Phase; members: SceneMember[]; gate?: string }[] {
  const out: { phase: Phase; members: SceneMember[]; gate?: string }[] = [];
  for (const item of ship.voyage) {
    if (isStage(item)) {
      let group = out[out.length - 1];
      if (!group || group.phase !== item.phase || group.gate) {
        group = { phase: item.phase, members: [] };
        out.push(group);
      }
      const m = crew.find((c) => c.id === item.member);
      if (m && !group.members.includes(m)) group.members.push(m);
    } else if (isGate(item) && out.length) {
      const g = out[out.length - 1];
      g.gate = g.gate ? `${g.gate} · ${item.label}` : item.label;
    }
  }
  return out;
}

