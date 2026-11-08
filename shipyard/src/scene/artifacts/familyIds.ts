// The artifact family ids, with no three.js import: the DOM (Armory, rack, equip layer) needs only
// the ids, and importing families.ts for them put three.js in the initial shell (T13: 310 KB of a
// 300 KB budget). families.ts re-exports these.
export const FAMILY_IDS = ['lens', 'wrench', 'gyroscope', 'projector', 'quill', 'seal', 'spyglass', 'calipers', 'gearbox', 'codex', 'orrery'] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export const isFamilyId = (s: string): s is FamilyId => (FAMILY_IDS as readonly string[]).includes(s);

/**
 * v2 (live library): a family added to `library/registry/artifacts.json` after this build has no
 * hand-made recipe yet. It draws as a generic relic (a faceted stone in a ring) in the family's own
 * pigment, so a new skill is visible the moment the knowledge base reloads, never an empty socket.
 */
export const RELIC = 'relic' as const;
export type DrawFamily = FamilyId | typeof RELIC;
export const drawFamily = (s: string): DrawFamily => (isFamilyId(s) ? s : RELIC);
