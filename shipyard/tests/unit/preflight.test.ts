import { describe, expect, it } from 'vitest';
import { preflight, type Check } from '../../src/domain/preflight';
import { isGate, isStage, type Ship, type Stage } from '../../src/domain/schema';
import { blankShip, defaultShip, libraryShips } from '../../src/domain/ship';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-10-30T12:00:00.000Z';
const fresh = (): Ship => structuredClone(defaultShip(idx, AT));
const stage = (s: Ship, id: string): Stage => s.voyage.filter(isStage).find((x) => x.id === id)!;
const check = (s: Ship, id: string): Check => preflight(idx, s).checks.find((c) => c.id === id)!;

describe('the four library workflows pass pre-flight clean (a false positive is a bug)', () => {
  const { ships } = libraryShips(idx, AT);
  for (const ship of ships) {
    it(`${ship.id}`, () => {
      const r = preflight(idx, ship);
      const problems = r.checks.filter((c) => c.status === 'block' || c.status === 'warn').map((c) => `${c.id}: ${c.reason}`);
      expect(problems).toEqual([]);
      expect(r.clean).toBe(true);
      expect(r.canExport).toBe(true);
      expect(r.integrity).toBe(100);
      expect(r.passed).toBe(r.applicable);
      expect(r.next).toBeNull();
    });
  }

  it('applicability: PF-06 only where a stage is parallel (fleet); PF-09 not on scoped repairs', () => {
    const by = Object.fromEntries(ships.map((s) => [s.id, preflight(idx, s)]));
    const status = (ship: string, id: string) => by[ship].checks.find((c) => c.id === id)!.status;
    expect(status('ss-full-run', 'PF-06')).toBe('na');
    expect(status('ss-mobile-fleet', 'PF-06')).toBe('pass');
    expect(status('ss-mobile-retrofit', 'PF-09')).toBe('na');
    expect(status('ss-mobile-fleet', 'PF-09')).toBe('na');
    expect(status('ss-full-run', 'PF-09')).toBe('pass');
    expect(status('ss-full-run', 'PF-08')).toBe('pass');
  });

  it('sixteen rules, PF-01 .. PF-16 (v2 adds PF-16)', () => {
    expect(preflight(idx, fresh()).checks.map((c) => c.id)).toEqual(Array.from({ length: 16 }, (_, i) => `PF-${String(i + 1).padStart(2, '0')}`));
  });
});

describe('each rule fires on its own violation', () => {
  it('PF-01: no design-director, or the director in parallel', () => {
    const noCaptain = fresh();
    noCaptain.crew = noCaptain.crew.filter((m) => m.agent !== 'design-director');
    expect(check(noCaptain, 'PF-01').status).toBe('block');

    const parallel = fresh();
    stage(parallel, 'run-plan').parallel = true;
    expect(check(parallel, 'PF-01')).toMatchObject({ status: 'block', findings: [{ fix: { kind: 'stage', id: 'run-plan' } }] });
  });

  it('PF-02: a stage opening a skill that left the library', () => {
    const s = fresh();
    stage(s, 'build').activeSkill = 'gone-skill';
    expect(check(s, 'PF-02')).toMatchObject({ status: 'block' });
    expect(check(s, 'PF-02').reason).toContain('gone-skill');
  });

  it('PF-03: a stage skill the member is not wearing, or a member who left', () => {
    const s = fresh();
    s.crew.find((m) => m.id === 'engineer')!.loadout = [];
    expect(check(s, 'PF-03')).toMatchObject({ status: 'block' });
    expect(check(s, 'PF-03').findings.some((f) => f.fix?.kind === 'member' && f.fix.id === 'engineer')).toBe(true);

    const gone = fresh();
    gone.crew = gone.crew.filter((m) => m.id !== 'analyst');
    expect(check(gone, 'PF-03').reason).toContain('not aboard');
  });

  it('PF-04: a stage without an output or a stop', () => {
    const s = fresh();
    stage(s, 'assets').outputs = [];
    stage(s, 'plan').stop = '  ';
    const c = check(s, 'PF-04');
    expect(c.status).toBe('block');
    expect(c.findings).toHaveLength(2);
  });

  it('PF-05: duplicate stage ids', () => {
    const s = fresh();
    stage(s, 'assets').id = 'plan';
    expect(check(s, 'PF-05')).toMatchObject({ status: 'block' });
  });

  it('PF-06: three parallel readers, a parallel writer outside a fleet, two writers in one fleet wave', () => {
    const readers = fresh();
    for (const id of ['audit', 'dna', 'assets']) {
      const st = stage(readers, id);
      st.parallel = true;
      st.wave = 1;
    }
    // dna (brand-strategist) and assets (asset-producer) write; audit reads. Use three read-only stages instead.
    stage(readers, 'dna').member = 'analyst';
    stage(readers, 'assets').member = 'analyst';
    stage(readers, 'metrics').member = 'critic';
    stage(readers, 'metrics').parallel = true;
    stage(readers, 'metrics').wave = 1;
    const c = check(readers, 'PF-06');
    expect(c.status).toBe('block');
    expect(c.findings.some((f) => /limit is two/.test(f.reason))).toBe(true);

    const writer = fresh();
    stage(writer, 'build').parallel = true;
    expect(check(writer, 'PF-06').findings[0].reason).toContain('writing agent in parallel');

    const fleet = libraryShips(idx, AT).ships.find((x) => x.id === 'ss-mobile-fleet')!;
    const dup = structuredClone(fleet);
    const copy = { ...stage(dup, 'fleet'), id: 'fleet-b' };
    dup.voyage.splice(dup.voyage.findIndex((v) => isStage(v) && v.id === 'fleet') + 1, 0, copy);
    expect(check(dup, 'PF-06')).toMatchObject({ status: 'block' });
    expect(check(dup, 'PF-06').reason).toContain('one writing engineer per site');
  });

  it('PF-07: a build stage run by a read-only agent', () => {
    const s = fresh();
    stage(s, 'build').member = 'critic';
    expect(check(s, 'PF-07')).toMatchObject({ status: 'block' });
  });

  it('PF-08: a missing or misordered gate', () => {
    const s = fresh();
    s.voyage = s.voyage.filter((v) => !(isGate(v) && v.gate === 'B'));
    expect(check(s, 'PF-08')).toMatchObject({ status: 'block' });
    expect(check(s, 'PF-08').reason).toContain('Gate B');

    const swapped = fresh();
    const a = swapped.voyage.findIndex((v) => isGate(v) && v.gate === 'A');
    const b = swapped.voyage.findIndex((v) => isGate(v) && v.gate === 'B');
    [swapped.voyage[a], swapped.voyage[b]] = [swapped.voyage[b], swapped.voyage[a]];
    expect(check(swapped, 'PF-08').reason).toContain('order');

    const abridged = libraryShips(idx, AT).ships.find((x) => x.id === 'ss-abridged')!;
    const noC = structuredClone(abridged);
    noC.voyage = noC.voyage.filter((v) => !isGate(v));
    expect(check(noC, 'PF-08').reason).toContain('Gate C');
  });

  it('PF-09: build before the design system; not applicable when scoped', () => {
    const s = fresh();
    stage(s, 'design-system').outputs = ['design-notes.md'];
    expect(check(s, 'PF-09')).toMatchObject({ status: 'block' });
    s.scoped = true;
    expect(check(s, 'PF-09').status).toBe('na');
  });

  it('PF-10: the builder reviews their own work', () => {
    const s = fresh();
    stage(s, 'finish-review').member = 'engineer';
    expect(check(s, 'PF-10')).toMatchObject({ status: 'block' });
    const noGate = fresh();
    noGate.voyage = noGate.voyage.filter((v) => !(isGate(v) && v.gate === 'C'));
    expect(check(noGate, 'PF-10').status).toBe('na');
  });

  it('PF-11: a critic below the builder tier warns', () => {
    const s = fresh();
    // Make the builder an opus-tier agent by playing the design-engineer as the (opus) director.
    s.crew.find((m) => m.id === 'engineer')!.agent = 'design-director';
    // The engineer's agent is now opus; the critic is opus too: no warning.
    expect(check(s, 'PF-11').status).toBe('pass');
    const lowered = structuredClone(idx);
    lowered.agent.set('independent-critic', { ...idx.agent.get('independent-critic')!, model: 'haiku' });
    expect(preflight(lowered, fresh()).checks.find((c) => c.id === 'PF-11')).toMatchObject({ status: 'warn' });
  });

  it('PF-12: a plan written by a reader-tier agent warns', () => {
    const s = fresh();
    s.crew.push({ id: 'gauge', agent: 'fleet-measurer', character: { name: 'Gauge', body: 'standin', pigment: '#9FC7C0' }, station: 8, loadout: [] });
    stage(s, 'plan').member = 'gauge';
    expect(check(s, 'PF-12')).toMatchObject({ status: 'warn' });
  });

  it('PF-13: the first stage is not a run plan', () => {
    const s = fresh();
    stage(s, 'run-plan').outputs = ['notes.md'];
    expect(check(s, 'PF-13')).toMatchObject({ status: 'warn' });
  });

  it('PF-14: off-route is info, a dormant skill warns, a retired skill blocks', () => {
    const s = fresh();
    expect(check(s, 'PF-14').status).toBe('info');
    const dormant = idx.kb.skills.find((k) => k.status !== 'active')!.id;
    const producer = s.crew.find((m) => m.id === 'producer')!;
    producer.loadout.push({ skill: dormant, anchor: 'belt', index: 0 });
    expect(check(s, 'PF-14').status).toBe('warn');
    producer.loadout.push({ skill: 'gone-skill', anchor: 'belt', index: 1 });
    const c = check(s, 'PF-14');
    expect(c.status).toBe('block');
    expect(c.findings.some((f) => f.fix?.kind === 'socket' && f.fix.skill === 'gone-skill')).toBe(true);
  });

  it('PF-15: a ship saved against another library hash warns', () => {
    const s = fresh();
    s.kbHash = 'deadbeef';
    expect(check(s, 'PF-15')).toMatchObject({ status: 'warn' });
  });
});

describe('hull integrity (passed / applicable, truth: Verified)', () => {
  it('a blocker caps the ring at 99 and disables export; a warning only lowers it', () => {
    const blocked = fresh();
    stage(blocked, 'assets').outputs = [];
    const r = preflight(idx, blocked);
    expect(r.blockers).toBe(1);
    expect(r.canExport).toBe(false);
    expect(r.integrity).toBeLessThanOrEqual(99);
    expect(r.next?.id).toBe('PF-04');

    const warned = fresh();
    warned.kbHash = 'deadbeef';
    const w = preflight(idx, warned);
    expect(w).toMatchObject({ blockers: 0, warnings: 1, canExport: true, clean: false });
    expect(w.integrity).toBeLessThan(100);
    expect(w.next?.id).toBe('PF-15');
  });

  it('a blank ship is exportable-blocked until it has gates; its first goal is named', () => {
    const blank = blankShip(idx, { id: 'blank-ship', name: 'Blank' }, AT);
    const r = preflight(idx, blank);
    expect(r.canExport).toBe(false);
    expect(r.next?.id).toBe('PF-08');
    expect(r.applicable).toBeGreaterThan(0);
  });
});
