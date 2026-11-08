// The artifact family ids, with no three.js import: the DOM (Armory, rack, equip layer) needs only
// the ids, and importing families.ts for them put three.js in the initial shell (T13: 310 KB of a
// 300 KB budget). families.ts re-exports these.
export const FAMILY_IDS = ['lens', 'wrench', 'gyroscope', 'projector', 'quill', 'seal', 'spyglass', 'calipers', 'gearbox', 'codex', 'orrery'] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export const isFamilyId = (s: string): s is FamilyId => (FAMILY_IDS as readonly string[]).includes(s);
