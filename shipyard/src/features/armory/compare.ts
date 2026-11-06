// "What will equipping this do?" for the Armory inspector (simplicity brief A3): which socket it
// takes, what it replaces, and what pre-flight would say afterwards. Pure: it runs the same `equip`
// and `preflight` the app uses on a copy of the ship and compares; nothing is dispatched.
import { equip, occupants, placement } from '../../domain/loadout';
import { preflight } from '../../domain/preflight';
import type { Anchor, Ship } from '../../domain/schema';
import type { KbIndex } from '../../kb/artifacts';

export interface EquipCompare {
  /** the member already carries it */
  already: boolean;
  /** where it would land (the free socket, or the full anchor it would replace on) */
  anchor: Anchor | null;
  /** the artifact it displaces when the anchor is full */
  replaces: string | null;
  /** nothing could be computed (an unknown member or skill) */
  error: string | null;
  /** pre-flight warnings / blockers after minus before */
  addsWarnings: number;
  addsBlockers: number;
  /** short names of what it adds, for the strip: "off-route", "manual skill" */
  reasons: string[];
}

const SHORT: Record<string, string> = { 'off-phase': 'off-route', 'off-routes': 'off-route', dormant: 'manual skill', 'read-only-build': 'agent cannot write', retired: 'retired' };

export function compareEquip(idx: KbIndex, ship: Ship, memberId: string, skillId: string): EquipCompare {
  const member = ship.crew.find((m) => m.id === memberId);
  const none: EquipCompare = { already: false, anchor: null, replaces: null, error: null, addsWarnings: 0, addsBlockers: 0, reasons: [] };
  if (!member || !idx.skill.has(skillId)) return { ...none, error: 'Nothing to compare.' };
  if (member.loadout.some((e) => e.skill === skillId)) return { ...none, already: true };
  const place = placement(idx, member, skillId);
  let anchor: Anchor;
  let replaces: string | null = null;
  let result;
  if (place) {
    anchor = place.anchor;
    result = equip(idx, ship, memberId, skillId, { anchor });
  } else {
    anchor = idx.skill.get(skillId)?.artifact.autoPlace[0] ?? 'belt';
    replaces = occupants(member, anchor)[0]?.skill ?? null;
    result = equip(idx, ship, memberId, skillId, { anchor, onFull: 'swap' });
  }
  if (!result.ok) return { ...none, anchor, replaces, error: result.reason };
  const before = preflight(idx, ship);
  const after = preflight(idx, result.ship);
  const reasons = [...new Set(result.notes.map((n) => SHORT[n.code] ?? n.code))];
  return { already: false, anchor, replaces, error: null, addsWarnings: Math.max(0, after.warnings - before.warnings), addsBlockers: Math.max(0, after.blockers - before.blockers), reasons };
}
