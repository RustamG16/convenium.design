import { describe, expect, it } from 'vitest';
import { CONVERSION_TABLES, ConversionError, convertWorkflow, isGateRef, type ConversionTable } from '../../src/domain/conversion';
import { isGate, isStage } from '../../src/domain/schema';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();

/** member:skill per stage, gates as G<letter>: the golden shape of each authored table. */
function shape(workflow: string): string[] {
  return convertWorkflow(idx, workflow).voyage.map((v) => (isStage(v) ? `${v.id}=${v.member}:${v.activeSkill ?? '-'}` : `G${v.gate}`));
}

describe('authored conversion tables (golden)', () => {
  it('SS Full Run matches the table in the build plan, section 9.1', () => {
    expect(shape('ss-full-run')).toEqual([
      'run-plan=captain:olympus-design-director',
      'dna=strategist:product-marketing',
      'audit=analyst:ux-evidence-audit',
      'GA',
      'direction=captain:concept-studio',
      'critique=critic:award-rubric',
      'GB',
      'assets=producer:asset-director',
      'plan=captain:-',
      'design-system=captain:impeccable',
      'build=engineer:apple-design',
      'author-qa=engineer:visual-qa',
      'finish-review=critic:visual-qa',
      'metrics=metrics:design-analytics',
      'GC',
      'handoff=captain:-',
    ]);
  });

  it('SS Abridged', () => {
    expect(shape('ss-abridged')).toEqual([
      'run-plan=captain:olympus-design-director',
      'resolve=captain:-',
      'plan=captain:-',
      'design-system=engineer:impeccable',
      'build=engineer:apple-design',
      'author-qa=engineer:visual-qa',
      'finish-review=critic:visual-qa',
      'GC',
    ]);
  });

  it('SS Mobile Retrofit: mobile-app-shell builds, visual-qa reviews', () => {
    expect(shape('ss-mobile-retrofit')).toEqual([
      'run-plan=captain:olympus-design-director',
      'measure=analyst:mobile-app-shell',
      'plan=captain:-',
      'build=engineer:mobile-app-shell',
      'author-qa=engineer:visual-qa',
      'finish-review=critic:visual-qa',
      'GC',
    ]);
  });

  it('SS Mobile Fleet: gates 0, 1, 2 and C, the fleet stage parallel in wave 1', () => {
    expect(shape('ss-mobile-fleet')).toEqual([
      'plan=captain:olympus-design-director',
      'measure=gauge:mobile-app-shell',
      'G0',
      'shell=engineer:mobile-app-shell',
      'G1',
      'fleet=engineer:mobile-app-shell',
      'G2',
      'review=critic:visual-qa',
      'GC',
    ]);
    const fleet = convertWorkflow(idx, 'ss-mobile-fleet').voyage.filter(isStage).find((s) => s.id === 'fleet')!;
    expect(fleet.parallel).toBe(true);
    expect(fleet.wave).toBe(1);
  });

  it('stage phases and gate labels come from the library, not from the table', () => {
    const wf = idx.workflow.get('ss-full-run')!;
    const { voyage } = convertWorkflow(idx, 'ss-full-run');
    expect(voyage.find((v) => isStage(v) && v.id === 'build')).toMatchObject({ phase: 'build' });
    const gateA = wf.stages.find((s) => 'gate' in s && s.gate === 'A') as { label: string };
    expect(voyage.find((v) => isGate(v) && v.gate === 'A')).toMatchObject({ label: gateA.label });
  });

  it('every row is a single member and at most one skill, with outputs and a stop', () => {
    for (const t of Object.values(CONVERSION_TABLES)) {
      for (const r of t.rows) {
        if (isGateRef(r)) continue;
        expect(typeof r.member).toBe('string');
        expect(r.skill === null || typeof r.skill === 'string').toBe(true);
        expect(r.outputs.length).toBeGreaterThan(0);
        expect(r.stop.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('a workflow the table cannot convert is reported, not worked around', () => {
  const good = CONVERSION_TABLES['ss-abridged'];
  const withRows = (rows: ConversionTable['rows']): Record<string, ConversionTable> => ({ 'ss-abridged': { ...good, rows } });

  const problemsOf = (tables: Record<string, ConversionTable>, wf = 'ss-abridged'): string[] => {
    try {
      convertWorkflow(idx, wf, tables);
    } catch (e) {
      expect(e).toBeInstanceOf(ConversionError);
      return (e as ConversionError).problems;
    }
    throw new Error('expected a ConversionError');
  };

  it('no table at all: v2 derives one instead of refusing (see derive.test.ts)', () => {
    expect(convertWorkflow(idx, 'ss-abridged', {}).table.derived).toBe(true);
  });

  it('a library stage with no row', () => {
    const rows = good.rows.filter((r) => isGateRef(r) || r.from !== 'plan');
    expect(problemsOf(withRows(rows)).join('\n')).toContain('stage plan has no row');
  });

  it('a row naming an unknown skill or crew member', () => {
    const rows = good.rows.map((r) => (!isGateRef(r) && r.id === 'build' ? { ...r, skill: 'no-such-skill', member: 'nobody' } : r));
    const p = problemsOf(withRows(rows)).join('\n');
    expect(p).toContain('skill no-such-skill is not in the registry');
    expect(p).toContain('nobody is not a crew id');
  });

  it('a library artifact that no row produces', () => {
    const rows = good.rows.map((r) => (!isGateRef(r) && r.id === 'plan' ? { ...r, outputs: ['something-else.md'] } : r));
    expect(problemsOf(withRows(rows)).join('\n')).toContain('artifact 06-build-plan.md is not produced by any row');
  });

  it('a gate in the wrong place', () => {
    const rows = [{ gate: 'C' }, ...good.rows.filter((r) => !isGateRef(r))];
    expect(problemsOf(withRows(rows)).join('\n')).toContain('order differs');
  });

  it('an unknown workflow', () => {
    expect(problemsOf({}, 'ss-nope').join()).toContain('no such workflow');
  });
});
