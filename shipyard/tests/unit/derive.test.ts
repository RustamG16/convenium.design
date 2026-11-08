/** v2 T17: a workflow with no authored table derives a voyage, and one that cannot lands in dry dock. */
import { describe, expect, it } from 'vitest';
import { convertWorkflow, ConversionError, deriveTable, isDerivedWorkflow } from '../../src/domain/conversion';
import { isStage, shipSchema } from '../../src/domain/schema';
import { libraryShips } from '../../src/domain/ship';
import { indexKb } from '../../src/kb/artifacts';
import type { KbWorkflow } from '../../src/kb/schema';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-11-08T00:00:00.000Z';

describe('deriveTable', () => {
  for (const wf of idx.kb.workflows.ships) {
    it(`${wf.id}: derives a voyage that passes the same checks as an authored table`, () => {
      const c = convertWorkflow(idx, wf.id, {});
      expect(c.table.derived).toBe(true);
      const stages = c.voyage.filter(isStage);
      expect(stages.length).toBeGreaterThan(0);
      for (const s of stages) {
        expect(s.outputs.length).toBeGreaterThan(0);
        expect(s.stop).toMatch(/written$/);
        expect(idx.crew.has(s.member)).toBe(true);
      }
    });
  }

  it('is deterministic', () => {
    const wf = idx.kb.workflows.ships[0];
    expect(deriveTable(wf, idx)).toEqual(deriveTable(wf, idx));
  });

  it('turns several crew on one stage into one parallel wave', () => {
    const wf = idx.kb.workflows.ships.find((w) => w.stages.some((s) => 'crew' in s && s.crew.length > 1))!;
    const rows = deriveTable(wf, idx).rows.filter((r) => 'parallel' in r && r.parallel);
    expect(rows.length).toBeGreaterThan(1);
    expect(new Set(rows.map((r) => ('wave' in r ? r.wave : -1))).size).toBeLessThan(rows.length);
  });
});

describe('a new workflow in the library (no code change)', () => {
  const base = idx.kb.workflows.ships[0];
  const added: KbWorkflow = { ...base, id: 'ss-new-from-forge', name: 'SS New', class: 'expedition' };
  const kb = { ...idx.kb, workflows: { ...idx.kb.workflows, ships: [...idx.kb.workflows.ships, added] } };
  const idx2 = indexKb(kb);

  it('appears as a library ship with a derived voyage and an unknown class read as custom', () => {
    const { ships, unconverted } = libraryShips(idx2, AT);
    const ship = ships.find((s) => s.id === 'ss-new-from-forge');
    expect(unconverted).toEqual([]);
    expect(ship).toBeDefined();
    expect(ship!.class).toBe('custom');
    expect(isDerivedWorkflow(ship!.origin?.workflow)).toBe(true);
    expect(shipSchema.safeParse(ship).success).toBe(true);
  });

  it('a workflow whose stage names an unknown phase goes to dry dock with the problem named', () => {
    const broken: KbWorkflow = { ...added, id: 'ss-broken', stages: [{ id: 'odd', label: 'Odd', phase: 'meditate', artifacts: [], crew: ['captain'] }] };
    const idx3 = indexKb({ ...kb, workflows: { ...kb.workflows, ships: [...kb.workflows.ships, broken] } });
    expect(() => convertWorkflow(idx3, 'ss-broken')).toThrow(ConversionError);
    const { unconverted } = libraryShips(idx3, AT);
    expect(unconverted.find((u) => u.workflow === 'ss-broken')?.problems.join()).toContain('meditate');
  });
});
