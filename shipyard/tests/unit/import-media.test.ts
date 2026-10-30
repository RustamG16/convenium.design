import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parseManifest } from '../../scripts/import-arkhethos-media.mjs';

const SCRIPT = fileURLToPath(new URL('../../scripts/import-arkhethos-media.mjs', import.meta.url));
const REAL_MANIFEST = fileURLToPath(new URL('../../plan/05-asset-manifest.md', import.meta.url));
const made: string[] = [];

afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

const sha16 = (b: Buffer) => createHash('sha256').update(b).digest('hex').slice(0, 16);

/** A fake ArkhEthos with two files and a manifest describing the bytes it is supposed to hold. */
function fixture(actual: Record<string, Buffer>, expected: Record<string, Buffer>) {
  const dir = mkdtempSync(join(tmpdir(), 'shipyard-import-'));
  made.push(dir);
  const ark = join(dir, 'ark');
  for (const [p, buf] of Object.entries(actual)) {
    mkdirSync(join(ark, 'public', 'media', p, '..'), { recursive: true });
    writeFileSync(join(ark, 'public', 'media', p), buf);
  }
  mkdirSync(join(ark, 'public', 'media'), { recursive: true });
  const rows = Object.entries(expected).map(([p, b]) => `| \`${p}\` | ${b.length} | \`${sha16(b)}\` | to import |`);
  const manifest = join(dir, 'manifest.md');
  writeFileSync(manifest, ['### `crew/` — Owner-generated; owner-owned, not CC0', '', '| File | Bytes | sha | Status |', '|---|---|---|---|', ...rows, ''].join('\n'));
  return { dir, ark, manifest, out: join(dir, 'out') };
}

function run(args: string[]) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('import-arkhethos-media', () => {
  it('the real manifest parses to the 55 files and 12,410,762 bytes it states', () => {
    const { sections } = parseManifest(readFileSync(REAL_MANIFEST, 'utf8'));
    const files = sections.flatMap((s) => s.files);
    expect(files).toHaveLength(55);
    expect(files.reduce((n, f) => n + f.bytes, 0)).toBe(12_410_762);
    expect(sections.map((s) => s.dir)).toEqual(['crew', 'ship-kit', 'ship-sound', 'ships']);
  });

  it('copies matching files and writes LICENSES.md', () => {
    const a = Buffer.from('alpha bytes');
    const b = Buffer.from('beta bytes!!');
    const fx = fixture({ 'crew/a.glb': a, 'crew/b.glb': b }, { 'crew/a.glb': a, 'crew/b.glb': b });
    const r = run(['--from', fx.ark, '--out', fx.out, '--manifest', fx.manifest]);
    expect(r.code).toBe(0);
    expect(readFileSync(join(fx.out, 'crew', 'a.glb'))).toEqual(a);
    expect(readFileSync(join(fx.out, 'LICENSES.md'), 'utf8')).toContain('owner-owned, not CC0');
  });

  it('refuses a recompressed file, names it, and writes nothing', () => {
    const a = Buffer.from('alpha bytes');
    const b = Buffer.from('beta bytes!!');
    const fx = fixture({ 'crew/a.glb': a, 'crew/b.glb': Buffer.from('meshopt') }, { 'crew/a.glb': a, 'crew/b.glb': b });
    const r = run(['--from', fx.ark, '--out', fx.out, '--manifest', fx.manifest]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('crew/b.glb');
    expect(r.stderr).not.toContain('crew/a.glb');
    expect(existsSync(fx.out)).toBe(false);
  });

  it('refuses a missing file and names it', () => {
    const a = Buffer.from('alpha bytes');
    const fx = fixture({ 'crew/a.glb': a }, { 'crew/a.glb': a, 'crew/gone.glb': Buffer.from('x') });
    const r = run(['--from', fx.ark, '--out', fx.out, '--manifest', fx.manifest]);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/MISSING\s+crew\/gone\.glb/);
    expect(existsSync(fx.out)).toBe(false);
  });

  it('--check verifies and writes nothing; no --from is a usage error', () => {
    const a = Buffer.from('alpha bytes');
    const fx = fixture({ 'crew/a.glb': a }, { 'crew/a.glb': a });
    expect(run(['--from', fx.ark, '--out', fx.out, '--manifest', fx.manifest, '--check']).code).toBe(0);
    expect(existsSync(fx.out)).toBe(false);
    expect(run([]).code).toBe(2);
  });
});
