import { describe, expect, it } from 'vitest';
import {
  availableOnRequest,
  buildRunPlan,
  exportShip,
  ExportError,
  normalizePath,
  renderKickoffPrompt,
  renderRunPlan,
  renderShipJson,
  runPlanAgent,
} from '../../src/domain/export';
import { isStage, shipSchema, type Ship } from '../../src/domain/schema';
import { defaultShip, libraryShips } from '../../src/domain/ship';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const AT = '2026-10-30T12:00:00.000Z';
const CD = 'D:\\Analyst_Designer\\Convenium.Design-shipyard\\';
const fresh = (): Ship => structuredClone(defaultShip(idx, AT));

function jsonBlock(md: string): ReturnType<typeof buildRunPlan> {
  const m = md.match(/```json\s*\n([\s\S]*?)\n```/);
  return JSON.parse(m![1]);
}

describe('run plan', () => {
  it('maps design-director to director, everyone else to their agent', () => {
    expect(runPlanAgent('design-director')).toBe('director');
    expect(runPlanAgent('design-engineer')).toBe('design-engineer');
    const plan = buildRunPlan(idx, fresh(), CD);
    const byId = Object.fromEntries(plan.phases.map((p) => [p.id, p]));
    expect(byId['run-plan'].agent).toBe('director');
    expect(byId['dna'].agent).toBe('brand-strategist');
    expect(byId['build'].agent).toBe('design-engineer');
    expect(plan.phases.some((p) => p.agent === 'design-director')).toBe(false);
  });

  it('skill_path uses forward slashes under the convenium_design path, whatever the input', () => {
    const plan = buildRunPlan(idx, fresh(), CD);
    expect(plan.convenium_design).toBe('D:/Analyst_Designer/Convenium.Design-shipyard');
    const build = plan.phases.find((p) => p.id === 'build')!;
    expect(build.skill).toBe('apple-design');
    expect(build.skill_path).toBe(`D:/Analyst_Designer/Convenium.Design-shipyard/${idx.skill.get('apple-design')!.skillPath}`);
    expect(JSON.stringify(plan)).not.toContain('\\\\');
    expect(plan.phases.find((p) => p.id === 'plan')).toMatchObject({ skill: null, skill_path: null });
  });

  it('carries the model from the agent file, one phase per stage in order, and the gates', () => {
    const ship = fresh();
    const plan = buildRunPlan(idx, ship, CD);
    expect(plan.phases.map((p) => p.id)).toEqual(ship.voyage.filter(isStage).map((s) => s.id));
    expect(plan.phases.find((p) => p.id === 'build')!.model).toBe(idx.agent.get('design-engineer')!.model);
    expect(plan.phases.find((p) => p.id === 'finish-review')!.model).toBe('opus');
    expect(plan.gates).toEqual(['A', 'B', 'C']);
    expect(plan.trail).toBe('full');
    expect(plan.run).toBe('SS Full Run');
  });

  it('exports the fleet wave and parallel flag', () => {
    const fleet = libraryShips(idx, AT).ships.find((s) => s.id === 'ss-mobile-fleet')!;
    const plan = buildRunPlan(idx, fleet, CD);
    expect(plan.phases.find((p) => p.id === 'fleet')).toMatchObject({ parallel: true, wave: 1 });
    expect(plan.phases.find((p) => p.id === 'plan')!.parallel).toBe(false);
    expect(plan.gates).toEqual(['0', '1', '2', 'C']);
  });

  it('the markdown has one json block, first, and a crew table after it', () => {
    const md = renderRunPlan(idx, fresh(), CD, AT);
    expect((md.match(/```json/g) ?? []).length).toBe(1);
    expect(jsonBlock(md).phases).toHaveLength(13);
    expect(md.indexOf('```json')).toBeLessThan(md.indexOf('## Crew characters'));
    expect(md).toContain('| Captain Oddvar Quill | design-director | 1 | 9 |');
  });

  it('refuses without a Convenium.Design path or with a stage nobody can play', () => {
    expect(() => buildRunPlan(idx, fresh(), '  ')).toThrow(ExportError);
    const orphan = fresh();
    orphan.crew = orphan.crew.filter((m) => m.id !== 'analyst');
    expect(() => buildRunPlan(idx, orphan, CD)).toThrow(/not aboard/);
  });

  it('normalizePath', () => {
    expect(normalizePath('C:\\a\\b\\')).toBe('C:/a/b');
    expect(normalizePath(' /x/y// ')).toBe('/x/y');
  });
});

describe('ship.json', () => {
  it('validates against the schema and round-trips', () => {
    const ship = fresh();
    const text = renderShipJson(ship);
    expect(JSON.parse(text)).toEqual(ship);
    expect(shipSchema.safeParse(JSON.parse(text)).success).toBe(true);
  });
});

describe('kickoff prompt', () => {
  it('starts from the run plan and lists equipped-but-inactive artifacts as available on request', () => {
    const ship = fresh();
    const text = renderKickoffPrompt(ship, CD);
    expect(text).toContain('.olympus/00-run-plan.md');
    expect(text).toContain('verify.py --plan');
    expect(text).toContain('Available on request');
    expect(text).toContain('never pre-loaded');
    // The captain wears ux-evidence-audit, which no captain stage opens.
    const extra = availableOnRequest(ship).find((x) => x.member.id === 'captain')!;
    expect(extra.skills).toContain('ux-evidence-audit');
    expect(extra.skills).not.toContain('olympus-design-director');
    expect(text).toContain("In the ship's hold: design-analytics, visual-qa, copywriting");
  });
});

describe('exportShip', () => {
  it('produces the three artifacts for a clean ship', () => {
    const b = exportShip(idx, fresh(), CD, AT);
    expect(b.report.clean).toBe(true);
    expect(b.runPlan).toContain('```json');
    expect(b.kickoff).toContain('SS Full Run');
    expect(b.shipJson.endsWith('\n')).toBe(true);
  });

  it('is blocked by a blocker and names the first one; a warning does not stop it', () => {
    const blocked = fresh();
    blocked.voyage = blocked.voyage.filter((v) => !(v.kind === 'gate' && v.gate === 'C'));
    expect(() => exportShip(idx, blocked, CD, AT)).toThrow(/PF-08/);

    const warned = fresh();
    warned.kbHash = 'deadbeef';
    expect(exportShip(idx, warned, CD, AT).report.warnings).toBe(1);
  });
});
