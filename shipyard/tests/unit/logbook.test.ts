import { describe, expect, it } from 'vitest';
import { exportShip, ExportError, isAbsolutePath } from '../../src/domain/export';
import { preflight } from '../../src/domain/preflight';
import { defaultShip } from '../../src/domain/ship';
import { isStage } from '../../src/domain/schema';
import { fixTarget } from '../../src/features/preflight/fix';
import { panelStates, HULL_PANELS } from '../../src/features/preflight/HullDiagram';
import { parseVerifyOutput, verifyWords } from '../../src/features/preflight/verifyOutput';
import { MAX_RUN_JSON_BYTES, parseRunJson } from '../../src/features/logbook/runJson';
import { readPersisted, STORAGE_KEY, writePersisted } from '../../src/store/persist';
import { emptyPersisted, initialState, reduce, toPersisted } from '../../src/store/store';
import { browserlessStorage } from './storage';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-10-30T10:00:00.000Z';
const env = { idx };

describe('verify.py output', () => {
  it('reads CLEAN as clean and N problem(s) as N', () => {
    expect(parseVerifyOutput('\nCLEAN (run plan C:\\tmp\\00-run-plan.md)\n')).toMatchObject({ ok: true, clean: true, problems: 0 });
    expect(parseVerifyOutput('FAIL  plan x: no outputs\nFAIL  plan y: no stop condition\n\n2 problem(s)\n')).toMatchObject({ ok: true, clean: false, problems: 2 });
    expect(parseVerifyOutput('1 problem(s)')).toMatchObject({ ok: true, problems: 1 });
    expect(verifyWords(0)).toBe('CLEAN');
    expect(verifyWords(1)).toBe('1 problem');
    expect(verifyWords(3)).toBe('3 problems');
  });
  it('refuses anything else, with a reason', () => {
    for (const bad of ['', 'hello', 'Traceback (most recent call last):\n  File "x"', 'CLEAN\nFAIL a: b']) {
      const r = parseVerifyOutput(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.length).toBeGreaterThan(10);
    }
    expect(parseVerifyOutput('x'.repeat(30_000)).ok).toBe(false);
  });
});

describe('run.json import', () => {
  const valid = { target_project: 'sites/convenium', last_updated: '2026-10-21', phase_counts: { intake: 1, build: 2, qa: 0 }, artifact_hashes: { '.olympus/06-build-plan.md': 'a'.repeat(64), '.olympus/07-qa.md': 'b'.repeat(64) } };

  it('reads phase_counts and counts artifact_hashes', () => {
    const r = parseRunJson(JSON.stringify(valid));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary).toMatchObject({ project: 'sites/convenium', phaseRuns: 3, phasesRun: 2, artifactHashes: 2 });
      expect(r.summary.runKey).toMatch(/^[0-9a-f]{16}$/);
    }
  });
  it('a file with no artifact_hashes is Unavailable for that number, never zero', () => {
    const { artifact_hashes: _omit, ...rest } = valid;
    const r = parseRunJson(JSON.stringify(rest));
    expect(r.ok && r.summary.artifactHashes).toBe(undefined);
  });
  it('the template with an empty artifact_hashes counts zero hashes', () => {
    const r = parseRunJson(JSON.stringify({ ...valid, artifact_hashes: {} }));
    expect(r.ok && r.summary.artifactHashes).toBe(0);
  });
  it('the same content has the same key; a different run has another', () => {
    const a = parseRunJson(JSON.stringify(valid));
    const b = parseRunJson(JSON.stringify({ ...valid, phase_counts: { qa: 0, build: 2, intake: 1 } }));
    const c = parseRunJson(JSON.stringify({ ...valid, last_updated: '2026-10-22' }));
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(a.summary.runKey).toBe(b.summary.runKey);
      expect(a.summary.runKey).not.toBe(c.summary.runKey);
    }
  });
  it('lists every problem of an invalid file', () => {
    const r = parseRunJson(JSON.stringify({ phase_counts: { build: -1, qa: 'two' }, artifact_hashes: { x: 5 } }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.length).toBeGreaterThanOrEqual(3);
      expect(r.issues.join('\n')).toMatch(/phase_counts\.build/);
      expect(r.issues.join('\n')).toMatch(/artifact_hashes\.x/);
    }
  });
  it('rejects missing phase_counts, non-JSON, non-objects and oversized files', () => {
    expect(parseRunJson('{"system":"x"}')).toMatchObject({ ok: false });
    expect(parseRunJson('{nope')).toEqual({ ok: false, issues: ['(root): not valid JSON'] });
    expect(parseRunJson('[1]')).toMatchObject({ ok: false });
    expect(parseRunJson('null')).toMatchObject({ ok: false });
    expect(parseRunJson(' '.repeat(MAX_RUN_JSON_BYTES + 1))).toMatchObject({ ok: false });
  });
});

describe('a ship with a blocker', () => {
  function blocked() {
    let s = reduce(initialState(), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Fork' }, AT, env);
    const ship = s.ships[0];
    const st = ship.voyage.filter(isStage).find((x) => x.activeSkill)!;
    s = reduce(s, { type: 'loadout/unequip', shipId: ship.id, member: st.member, skill: st.activeSkill! }, AT, env);
    return s.ships[0];
  }

  it('caps the ring at 99, cannot export, and names the first blocker', () => {
    const ship = blocked();
    const r = preflight(idx, ship);
    expect(r.blockers).toBeGreaterThan(0);
    expect(r.canExport).toBe(false);
    expect(r.integrity).toBeLessThanOrEqual(99);
    expect(r.next?.status).toBe('block');
    expect(() => exportShip(idx, ship, 'D:/x', AT)).toThrow(ExportError);
    expect(() => exportShip(idx, ship, 'D:/x', AT)).toThrow(new RegExp(r.next!.id));
  });

  it('even with every other check passing, a lone blocker holds the ring below 100', () => {
    const r = preflight(idx, blocked());
    const raw = Math.round((100 * r.passed) / r.applicable);
    expect(raw).toBeGreaterThanOrEqual(r.integrity);
    expect(r.integrity).toBeLessThan(100);
  });

  it('every finding of the blocked ship has a Fix target on the Bridge or the Voyage', () => {
    const ship = blocked();
    const r = preflight(idx, ship);
    for (const c of r.checks.filter((x) => x.status === 'block')) {
      const t = fixTarget(ship.id, c, c.findings[0]);
      expect(t?.to).toMatch(new RegExp(`^/ship/${ship.id}/(bridge\\?member=|voyage\\?stage=|voyage$|bridge$)`));
    }
  });
});

describe('fix links', () => {
  const check = { id: 'PF-03' };
  it('stage -> voyage?stage=, member -> bridge?member=, socket -> bridge?member=&skill=', () => {
    expect(fixTarget('s', check, { severity: 'block', reason: 'r', fix: { kind: 'stage', id: 'build' } })?.to).toBe('/ship/s/voyage?stage=build');
    expect(fixTarget('s', check, { severity: 'block', reason: 'r', fix: { kind: 'member', id: 'engineer' } }, { member: () => 'Forge' })).toEqual({ to: '/ship/s/bridge?member=engineer', label: 'Fix Forge' });
    expect(fixTarget('s', check, { severity: 'info', reason: 'r', fix: { kind: 'socket', member: 'engineer', skill: 'gsap-core' } })?.to).toBe('/ship/s/bridge?member=engineer&skill=gsap-core');
  });
  it('ship-wide findings go to the screen that owns the rule; a finding without a fix has no link', () => {
    expect(fixTarget('s', { id: 'PF-01' }, { severity: 'block', reason: 'r', fix: { kind: 'ship' } })?.to).toBe('/ship/s/bridge');
    expect(fixTarget('s', { id: 'PF-08' }, { severity: 'block', reason: 'r', fix: { kind: 'ship' } })?.to).toBe('/ship/s/voyage');
    expect(fixTarget('s', check, { severity: 'block', reason: 'r' })).toBeNull();
  });
});

describe('hull panels and the export path', () => {
  it('one panel per rule group, fully lit on a clean ship', () => {
    const r = preflight(idx, defaultShip(idx, AT));
    const panels = panelStates(r.checks);
    expect(panels.map((p) => p.group)).toEqual(HULL_PANELS.map((p) => p.group));
    for (const p of panels.filter((x) => x.applicable > 0)) expect(p.status).toBe('pass');
    expect(panels.find((p) => p.group === 'parallel')?.status).toBe('na');
  });
  it('accepts Windows and POSIX absolute paths and nothing relative', () => {
    for (const ok of ['D:\\Analyst_Designer\\Convenium.Design', 'D:/Analyst_Designer/Convenium.Design', '/home/me/Convenium.Design', '\\\\server\\share\\cd']) expect(isAbsolutePath(ok)).toBe(true);
    for (const bad of ['', 'Convenium.Design', './Convenium.Design', '..\\x', 'D:Convenium']) expect(isAbsolutePath(bad)).toBe(false);
  });
});

describe('persistence of the logbook', () => {
  it('round-trips logbook and commissions', () => {
    const storage = browserlessStorage();
    let s = initialState();
    s = reduce(s, { type: 'log/add', shipId: 'ss-full-run', entry: { at: AT, kind: 'verify-result', truth: 'User-reported', problems: 0 } }, AT, env);
    expect(writePersisted(storage, toPersisted(s))).toBe(true);
    const read = readPersisted(storage);
    expect(read.banner).toBeNull();
    expect(read.state.logbook['ss-full-run']).toHaveLength(1);
    expect(read.state.commissions).toEqual({ 'first-verify': AT });
  });
  it('a store written before the logbook existed loads, with an empty logbook', () => {
    const storage = browserlessStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ships: [], codex: [], commissions: { 'first-ship': AT }, ui: { introSeen: {}, sound: false, designPath: '' } }));
    const read = readPersisted(storage);
    expect(read.banner).toBeNull();
    expect(read.state.logbook).toEqual({});
    expect(read.state.commissions).toEqual({ 'first-ship': AT });
  });
  it('a malformed logbook recovers to defaults with a banner', () => {
    const storage = browserlessStorage();
    const bad = { version: 1, ships: [], codex: [], commissions: {}, logbook: { x: [{ at: 'yesterday', kind: 'export', truth: 'Verified' }] }, ui: { introSeen: {}, sound: false, designPath: '' } };
    storage.setItem(STORAGE_KEY, JSON.stringify(bad));
    const read = readPersisted(storage);
    expect(read.banner).toBe('malformed');
    expect(read.state).toEqual(emptyPersisted());
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...bad, logbook: { x: 'no' } }));
    expect(readPersisted(storage).banner).toBe('malformed');
  });
});
