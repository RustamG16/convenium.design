import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { indexKb, type KbIndex } from '../../src/kb/artifacts';
import { parseKb } from '../../src/kb/load';
import type { KnowledgeBase } from '../../src/kb/schema';

const KB_PATH = fileURLToPath(new URL('../../public/data/knowledge-base.json', import.meta.url));

export function readKbRaw(): unknown {
  return JSON.parse(readFileSync(KB_PATH, 'utf8'));
}

export function loadKbFromDisk(): KnowledgeBase {
  return parseKb(readKbRaw());
}

export function loadIndexFromDisk(): KbIndex {
  return indexKb(loadKbFromDisk());
}
