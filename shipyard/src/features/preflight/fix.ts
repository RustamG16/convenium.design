/**
 * Where a pre-flight finding is repaired. The links target the Bridge (`?member=`) and the Voyage
 * planner (`?stage=`); those screens read the parameter when they are filled in, and ignore it until then.
 * A finding with no member or stage of its own (a ship-wide one) goes to the screen that owns the rule.
 */
import type { Check, Finding } from '../../domain/preflight';

export interface FixTarget {
  /** a router path, for `<Link to>` */
  to: string;
  label: string;
}

const VOYAGE_RULES = new Set(['PF-08', 'PF-10', 'PF-13']);

export function fixTarget(shipId: string, check: Pick<Check, 'id'>, finding: Finding, memberName?: (id: string) => string): FixTarget | null {
  const fix = finding.fix;
  if (!fix) return null;
  const base = `/ship/${encodeURIComponent(shipId)}`;
  switch (fix.kind) {
    case 'stage':
      return { to: `${base}/voyage?stage=${encodeURIComponent(fix.id)}`, label: `Fix stage ${fix.id}` };
    case 'member':
      return { to: `${base}/bridge?member=${encodeURIComponent(fix.id)}`, label: `Fix ${memberName?.(fix.id) ?? fix.id}` };
    case 'socket':
      return {
        to: `${base}/bridge?member=${encodeURIComponent(fix.member)}&skill=${encodeURIComponent(fix.skill)}`,
        label: `Open ${memberName?.(fix.member) ?? fix.member}'s ${fix.skill}`,
      };
    case 'ship':
      return VOYAGE_RULES.has(check.id)
        ? { to: `${base}/voyage`, label: 'Fix in the voyage' }
        : { to: `${base}/bridge`, label: check.id === 'PF-01' ? 'Recruit on the bridge' : 'Review on the bridge' };
  }
}
