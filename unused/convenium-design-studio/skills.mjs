// GENERATED-DATA MODULE — do not add literal skill/tool/plugin/preset arrays here.
// The single source of truth is `library/registry/`. This module only re-exports it so
// `knowledge.mjs` (mergeSkill), `server.mjs`, and `mcp-server.mjs` keep the exact symbol
// names and field shapes they always consumed.
//   skills   : { id, name, phase, group, defaultOn, description, runtimePrompt, ... }
//   tools    : { id, name, kind, usable, status, description }
//   plugins  : { id, name, status, description }
//   presets  : { id, name, skills: [id, ...] }
//   slots    : { id, name, owner, question, why, default, candidates: [{ skill, changes }] }
// Rebuild the registry with `python library/tools/project.py` (see library/README.md).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const reg = name =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../library/registry/${name}.json`, import.meta.url)), 'utf8'));

// The slot map lives in its own file because library/tools/project.py regenerates
// skills.registry.json; a `slot` field added there would not survive a rebuild. Joining it
// here keeps one source of truth per fact and one shape for every consumer.
export const slots = reg('slots').slots;

const slotBySkill = new Map();
for (const slot of slots) {
  for (const candidate of slot.candidates) {
    if (!slotBySkill.has(candidate.skill)) {
      slotBySkill.set(candidate.skill, {
        slot: slot.id,
        isSlotDefault: slot.default === candidate.skill,
        changes: candidate.changes,
      });
    }
  }
}

export const skills = reg('skills.registry').map(s => ({
  id: s.id,
  name: s.name,
  phase: s.phase,
  group: s.group,
  defaultOn: Boolean(s.defaultOn),
  // `enabled` gates convenium_design_get_context's inventory: true for pipeline-routed skills,
  // false for the unrouted capability library. Registry is the source of truth; default
  // to (phase !== 'unrouted') for any record written before the field existed.
  enabled: s.enabled ?? (s.phase !== 'unrouted'),
  description: s.description,
  runtimePrompt: s.runtimePrompt || '',
  status: s.status,
  category: s.category,
  hosts: s.hosts,
  // A skill either answers one of the eight loadout questions or it belongs to the
  // browsable capability library. `slot` is null for the second kind, which is what makes
  // "unrouted" a description rather than a choice the user has to make 84 times.
  slot: slotBySkill.get(s.id)?.slot ?? null,
  isSlotDefault: slotBySkill.get(s.id)?.isSlotDefault ?? false,
  slotChanges: slotBySkill.get(s.id)?.changes ?? '',
  ...(s.disableModelInvocation ? { disableModelInvocation: true } : {}),
}));

export const tools = reg('tools');
export const plugins = reg('plugins');
export const presets = reg('presets');
