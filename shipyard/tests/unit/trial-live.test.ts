/** v2 T23: the live-trial runner's pure parts — argv guard, estimate and scoring from a run's own files. */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ALLOWED_TOOLS, estimate, FORBIDDEN_FLAGS, MIN_ARTIFACT_BYTES, pickBin, scoreLive, shellQuote, substantial, tokensFrom, trialArgs } from '../../dev/trial';

describe('the trial command line', () => {
  it('never carries a permission-bypass flag, and allows files and search only', () => {
    const argv = trialArgs(12).join(' ');
    for (const f of FORBIDDEN_FLAGS) expect(argv).not.toContain(f);
    expect(argv).toContain('--max-turns 12');
    expect(argv).toContain(`--allowedTools ${ALLOWED_TOOLS.join(',')}`);
    expect(ALLOWED_TOOLS).not.toContain('Bash');
  });

  it('quotes a shell-run path that has a space, once', () => {
    expect(shellQuote('C:\\Users\\First Last\\AppData\\Roaming\\npm\\claude.cmd')).toBe('"C:\\Users\\First Last\\AppData\\Roaming\\npm\\claude.cmd"');
    expect(shellQuote('"C:\\x\\claude.cmd"')).toBe('"C:\\x\\claude.cmd"');
  });

  it('on Windows picks the .exe, then the .cmd, never the extensionless npm shim', () => {
    expect(pickBin(['C:/npm/claude', 'C:/npm/claude.cmd'], true)).toBe('C:/npm/claude.cmd');
    expect(pickBin(['C:/npm/claude', 'C:/npm/claude.cmd', 'C:/bin/claude.exe'], true)).toBe('C:/bin/claude.exe');
    expect(pickBin(['C:/npm/claude'], true)).toBeNull();
    expect(pickBin(['/usr/local/bin/claude', ''], false)).toBe('/usr/local/bin/claude');
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

const AUDIT = `# Audit\n\n${'The hero image is 2.1 MB and blocks the first paint on a phone. '.repeat(5)}\n\n- finding one\n- finding two\n`;

describe('scoreLive', () => {
  it('the audit fixture clears the size floor', () => expect(AUDIT.length).toBeGreaterThan(MIN_ARTIFACT_BYTES));
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
    writeFileSync(join(dir, '.olympus', '01-audit.md'), AUDIT);
    const s = scoreLive(dir, brief, { high: 1000 }, 0, 800, true);
    expect(s.criteria.coverage.points).toBe(17.5);
    expect(s.criteria.artifacts.points).toBe(7.5);
    expect(s.criteria.gates.points).toBe(15);
    // pre-flight, economy and clarity pay for the share of required files delivered: 1 of 2
    expect(s.criteria.preflight.points).toBe(10);
    expect(s.criteria.economy.points).toBe(5);
    expect(s.criteria.clarity.points).toBe(2.5);
    // Verified = the measured criteria only (artifacts, pre-flight, economy, clarity: 25 of 50), scaled to 100
    expect(s.total).toBe(50);
    // what the run says about itself (coverage, gates) is kept apart and never counted
    expect(s.reported).toEqual({ points: 32.5, max: 50 });
    expect(s.criteria.coverage.source).toBe('reported');
    expect(s.criteria.gates.source).toBe('reported');
    expect(s.criteria.artifacts.source).toBe('measured');
  });

  it('a stub file is not a deliverable, and a run that stops early cannot win on thrift', () => {
    writeFileSync(join(dir, '.olympus', '07-qa.md'), '# qa\n');
    expect(substantial(join(dir, '.olympus', '07-qa.md'))).toBe(false);
    expect(substantial(join(dir, '.olympus', '01-audit.md'))).toBe(true);
    const s = scoreLive(dir, brief, { high: 1000 }, 0, 10, true);
    expect(s.facts.artifactsFound).toEqual(['01-audit.md']);
    expect(s.criteria.economy.points).toBe(5);
  });

  it('a run that delivers no required file scores 0 Verified, whatever else went right', () => {
    const empty = mkdtempSync(join(tmpdir(), 'shipyard-empty-'));
    mkdirSync(join(empty, '.olympus'), { recursive: true });
    const s = scoreLive(empty, brief, { high: 1000 }, 0, 10, true);
    expect(s.total).toBe(0);
    rmSync(empty, { recursive: true, force: true });
  });

  it('a gate counts only when the run says it passed, not on any word', () => {
    writeFileSync(join(dir, '.olympus', 'run.json'), JSON.stringify({ phase_counts: {}, gate_c: 'skipped by headless mode' }));
    expect(scoreLive(dir, brief, { high: 1000 }, 0, 800, true).criteria.gates.points).toBe(0);
  });

  it('reads token use from the stream-json result message only', () => {
    expect(tokensFrom({ type: 'result', usage: { input_tokens: 10, output_tokens: 5 } })).toBe(15);
    // cache reads are not counted
    expect(tokensFrom({ type: 'result', usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 9000 } })).toBe(15);
    expect(tokensFrom({ type: 'assistant' })).toBeNull();
  });
});
