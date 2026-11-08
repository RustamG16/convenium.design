/**
 * Where a pre-flight finding is repaired. The links target the Bridge (`?member=`) and the Voyage
 * planner (`?stage=`); those screens read the parameter when they are filled in, and ignore it until then.
 * A finding with no member or stage of its own (a ship-wide one) goes to the screen that owns the rule.
 */
import type { Check, Finding } from '../../domain/preflight';
import { isStage, type Ship } from '../../domain/schema';
import type { KbIndex } from '../../kb/artifacts';

/** Words for the ids a fix names (critic n4): the crew member's name, the stage's label, the artifact's name. An id shows only when nothing names it (a retired item). */
export interface FixNames {
  member?: (id: string) => string;
  stage?: (id: string) => string;
  skill?: (id: string) => string;
}

export function fixNames(ship: Ship, idx?: KbIndex): FixNames {
  return {
    member: (id) => ship.crew.find((m) => m.id === id)?.character.name ?? id,
    stage: (id) => ship.voyage.find((v) => isStage(v) && v.id === id)?.label ?? id,
    skill: (id) => idx?.skill.get(id)?.name ?? id,
  };
}

export interface FixTarget {
  /** a router path, for `<Link to>` */
  to: string;
  label: string;
}

const VOYAGE_RULES = new Set(['PF-08', 'PF-10', 'PF-13']);

export function fixTarget(shipId: string, check: Pick<Check, 'id'>, finding: Finding, names: FixNames = {}): FixTarget | null {
  const fix = finding.fix;
  if (!fix) return null;
  const base = `/ship/${encodeURIComponent(shipId)}`;
  switch (fix.kind) {
    case 'stage':
      return { to: `${base}/voyage?stage=${encodeURIComponent(fix.id)}`, label: `Fix the ${names.stage?.(fix.id) ?? fix.id} stage` };
    case 'member':
      return { to: `${base}/bridge?member=${encodeURIComponent(fix.id)}`, label: `Fix ${names.member?.(fix.id) ?? fix.id}` };
    case 'socket':
      return {
        to: `${base}/bridge?member=${encodeURIComponent(fix.member)}&skill=${encodeURIComponent(fix.skill)}`,
        label: `Open ${names.member?.(fix.member) ?? fix.member}'s ${names.skill?.(fix.skill) ?? fix.skill}`,
      };
    case 'ship':
      return VOYAGE_RULES.has(check.id)
        ? { to: `${base}/voyage`, label: 'Fix in the voyage' }
        : { to: `${base}/bridge`, label: check.id === 'PF-01' ? 'Recruit on the bridge' : 'Review on the bridge' };
  }
}
