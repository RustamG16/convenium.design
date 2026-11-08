/**
 * v2 T19: when the generator or verify.py refuses a Forge change, every file goes back to its exact
 * earlier bytes (and a file the Forge created is removed). Run against a throwaway repo whose
 * "python" is node and whose project.py exits 1, so the real library is never touched.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const repo = mkdtempSync(join(tmpdir(), 'shipyard-rollback-'));
process.env.PYTHON = process.execPath;
mkdirSync(join(repo, 'library/tools'), { recursive: true });
mkdirSync(join(repo, 'library/registry'), { recursive: true });
writeFileSync(join(repo, 'library/tools/project.py'), 'process.exit(process.argv.includes("all") ? 1 : 0)\n');
writeFileSync(join(repo, 'library/tools/verify.py'), 'process.exit(0)\n');
const CREW = '{\n  "crew": []\n}\n';
writeFileSync(join(repo, 'library/registry/crew.json'), CREW);

afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe('applyChanges', () => {
  it('restores modified files byte for byte and removes created ones when the rebuild fails', async () => {
    const { Library, applyChanges } = await import('../../dev/forge');
    const lib = new Library(repo);
    const r = await applyChanges(lib, [
      { rel: 'library/registry/crew.json', next: '{\n  "crew": [1]\n}\n' },
      { rel: 'library/agents/new-agent.md', next: '---\nname: new-agent\n---\n' },
    ]);
    expect(r).toMatchObject({ ok: false, rolledBack: true });
    expect(readFileSync(join(repo, 'library/registry/crew.json'), 'utf8')).toBe(CREW);
    expect(existsSync(join(repo, 'library/agents/new-agent.md'))).toBe(false);
  });
});
