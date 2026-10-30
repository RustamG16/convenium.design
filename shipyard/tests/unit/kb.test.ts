import { describe, expect, it } from 'vitest';
import { indexKb, skillCount, tierCounts, workflowCrew } from '../../src/kb/artifacts';
import { KbError, parseKb } from '../../src/kb/load';
import { loadKbFromDisk, readKbRaw } from './helpers';

describe('knowledge base loader', () => {
  it('validates the generated file', () => {
    const kb = loadKbFromDisk();
    expect(kb.schema).toBe('shipyard.kb.v1');
    expect(kb.sourceHash).toMatch(/^[0-9a-f]{16,}$/);
    expect(kb.agents.map((a) => a.id)).toContain('design-director');
  });

  it('counts skills from the file, and every skill resolves to an artifact', () => {
    const kb = loadKbFromDisk();
    expect(skillCount(kb)).toBe(kb.skills.length);
    expect(kb.skills.every((s) => s.artifact.family && s.artifact.name.includes(s.artifact.familyName))).toBe(true);
    const tiers = tierCounts(kb);
    expect(Object.values(tiers).reduce((a, b) => a + b, 0)).toBe(kb.skills.length);
  });

  it('the default ship names seven crew: crew.json minus gauge', () => {
    const kb = loadKbFromDisk();
    const idx = indexKb(kb);
    const flagship = idx.workflow.get(kb.workflows.default)!;
    const crew = workflowCrew(kb, flagship).map((c) => c.id);
    expect(crew).toHaveLength(7);
    expect(crew).not.toContain('gauge');
    expect(kb.crew.map((c) => c.id).filter((id) => !crew.includes(id))).toEqual(['gauge']);
  });

  it('refuses a malformed file with one line per problem', () => {
    const raw = readKbRaw() as Record<string, unknown>;
    expect(() => parseKb({ ...raw, skills: 'nope' })).toThrow(KbError);
    try {
      parseKb({ ...raw, sourceHash: '' });
    } catch (e) {
      expect((e as KbError).issues.join('\n')).toContain('sourceHash');
    }
  });
});
