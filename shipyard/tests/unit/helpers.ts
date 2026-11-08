import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { indexKb, type KbIndex } from '../../src/kb/artifacts';
import { parseKb } from '../../src/kb/load';
import type { KnowledgeBase } from '../../src/kb/schema';

/**
 * v2 (live library): the exact-number tests (12 captain skills, 13 phases, 7 crew…) read a PINNED copy
 * of the knowledge base, so adding a skill or an agent to `library/` never breaks them. The live file
 * is checked by invariants only (`live-kb.test.ts`). Refresh the pin deliberately, with the numbers:
 *   cp public/data/knowledge-base.json tests/unit/fixtures/kb-pinned.json
 */
const PINNED = fileURLToPath(new URL('./fixtures/kb-pinned.json', import.meta.url));
const LIVE = fileURLToPath(new URL('../../public/data/knowledge-base.json', import.meta.url));

export function readKbRaw(path: string = PINNED): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadKbFromDisk(): KnowledgeBase {
  return parseKb(readKbRaw());
}

export function loadIndexFromDisk(): KbIndex {
  return indexKb(loadKbFromDisk());
}

/** The generated file the app actually serves — for invariant tests only, never exact counts. */
export function loadLiveIndex(): KbIndex {
  return indexKb(parseKb(readKbRaw(LIVE)));
}
