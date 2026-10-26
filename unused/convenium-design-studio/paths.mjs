// Where the runtime store lives.
//
// Every path here defaults to exactly where it has always been, so nothing changes without
// CONVENIUM_DESIGN_DATA_DIR set. It exists so the behaviour harness can boot the server against a
// throwaway directory: that sweep clicks real controls, Delete and "Clear local" among them,
// and it must never do that to the committed store. CLAUDE.md protects convenium-design-studio/data/;
// this is the mechanism that keeps the promise while still exercising the destructive paths,
// which are the ones most worth testing.
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const override = process.env.CONVENIUM_DESIGN_DATA_DIR || '';
const defaultDir = fileURLToPath(new URL('./data/', import.meta.url));

export const dataDir = override || defaultDir;
export const isScratchData = Boolean(override);

export const dataFile = name => join(dataDir, name);

// Design DNA profiles live in library/design-dna/, outside data/, because the schema and the
// two interview skills expect them there. They are still WRITTEN state, so the scratch
// override has to cover them - without this every behaviour-harness run left a real profile
// in the library for each B4 probe.
const defaultProfileDir = fileURLToPath(new URL('../library/design-dna/', import.meta.url));
export const profileDir = override ? join(override, 'design-dna') : defaultProfileDir;

// The knowledge tree is both read (84 capability folders) and written (index overrides, new
// skill folders, source notes). Under the scratch override it is copied once and then used in
// place, so the sweep can click "Save skill" and "Add source" for real without editing the
// repo's own knowledge tree - which is exactly what happened before this existed.
const defaultKnowledgeDir = fileURLToPath(new URL('./knowledge/', import.meta.url));
export const knowledgeDir = override ? join(override, 'knowledge') : defaultKnowledgeDir;
export const knowledgeSeedDir = defaultKnowledgeDir;
