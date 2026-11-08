/** v2 T23: the live-trial runner's pure parts — argv guard, estimate and scoring from a run's own files. */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ALLOWED_TOOLS, estimate, FORBIDDEN_FLAGS, scoreLive, tokensFrom, trialArgs } from '../../dev/trial';

describe('the trial command line', () => {
  it('never carries a permission-bypass flag, and allows files and search only', () => {
    const argv = trialArgs(12).join(' ');
    for (const f of FORBIDDEN_FLAGS) expect(argv).not.toContain(f);
    expect(argv).toContain('--max-turns 12');
    expect(argv).toContain(`--allowedTools ${ALLOWED_TOOLS.join(',')}`);
    expect(ALLOWED_TOOLS).not.toContain('Bash');
  });
});

describe('estimate', () => {
  it('sums a token range per phase tier and asks for a typed confirmation', () => {
    const e = estimate({ ship: 's1', shipName: 'S', brief: 'b', fixture: 'landing-mini', plan: 'p', kickoff: 'k', tiers: ['opus', 'haiku'], maxTurns: 10 });
    expect(e.tokens.low).toBeLessThan(e.tokens.high);
    expect(e.truth).toBe('Estimate');
    expect(e.confirmPhrase).toBe('run s1');
  });
});

describe('scoreLive', () => {
  const dir = mkdtempSync(join(tmpdir(), 'shipyard-score-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const brief = { id: 'b', needs: [{ id: 'a', phase: 'diagnose' }, { id: 'q', phase: 'verify' }], requiredArtifacts: ['01-audit.md', '07-qa.md'], gates: ['C'] };

  it('a run with no run.json scores what its files show and says what is missing', () => {
    const s = scoreLive(dir, brief, { high: 1000 }, 1, null, null);
    expect(s.facts.runJson).toBe(false);
    expect(s.criteria.coverage.points).toBe(0);
    expect(s.criteria.preflight.why).toContain('no .olympus/00-run-plan.md');
    expect(s.criteria.clarity.points).toBe(0);
  });

  it('counts phases from run.json, files in .olympus, gates and a clean plan', () => {
    mkdirSync(join(dir, '.olympus'), { recursive: true });
    writeFileSync(join(dir, '.olympus', 'run.json'), JSON.stringify({ phase_counts: { audit: 1, qa: 0 }, gate_c: 'approved' }));
    writeFileSync(join(dir, '.olympus', '01-audit.md'), '# audit');
    const s = scoreLive(dir, brief, { high: 1000 }, 0, 800, true);
    expect(s.criteria.coverage.points).toBe(17.5);
    expect(s.criteria.artifacts.points).toBe(7.5);
    expect(s.criteria.gates.points).toBe(15);
    expect(s.criteria.preflight.points).toBe(20);
    expect(s.criteria.economy.points).toBe(10);
    expect(s.criteria.clarity.points).toBe(5);
    expect(s.total).toBe(75);
  });

  it('reads token use from the stream-json result message only', () => {
    expect(tokensFrom({ type: 'result', usage: { input_tokens: 10, output_tokens: 5 } })).toBe(15);
    expect(tokensFrom({ type: 'assistant' })).toBeNull();
  });
});
