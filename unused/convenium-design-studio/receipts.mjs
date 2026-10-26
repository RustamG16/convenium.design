import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflow } from './workflow.mjs';
const sourceRoot = fileURLToPath(new URL('../test_projects/Savra_v2/', import.meta.url));
export async function savraReceipt(artifact = null) {
  if (artifact && !workflow.artifacts.some(a => a.path === artifact)) throw new Error('Artifact is not allowlisted.');
  const root = await realpath(sourceRoot);
  const artifacts = await Promise.all(workflow.artifacts.filter(a => !artifact || a.path === artifact).map(async item => {
    try {
      const path = await realpath(resolve(root, item.path));
      const rel = relative(root, path);
      if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Artifact escapes source root.');
      const bytes = await readFile(path);
      return { ...item, available: true, hash: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, content: bytes.toString('utf8'), provenance: { status: 'verified', source: `test_projects/Savra_v2/${item.path}` } };
    } catch (error) { return { ...item, available: false, hash: null, reason: error.code === 'ENOENT' ? 'Not recorded in restored repository.' : 'Evidence cannot be read safely.' }; }
  }));
  return { id: 'savra-v2-system', workflow, artifacts, limitations: workflow.limitations };
}
