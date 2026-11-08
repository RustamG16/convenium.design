/** v2 T19: the Forge's planning half, read-only against the real library (nothing is written here). */
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allowed, ForgeRefusal, Library, plan, renderAgentMd, type AgentInput, type ForgeOp } from '../../dev/forge';

const lib = new Library(resolve(process.cwd(), '..'));

const agent = (over: Partial<AgentInput> = {}): AgentInput => ({
  id: 'motion-scout',
  description: 'Scouts a page for motion opportunities and returns a ranked list.',
  model: 'sonnet',
  access: 'read-only',
  routes: ['find-animation-opportunities'],
  phase: 'diagnose',
  priority: 4,
  activateWhen: 'the brief asks where motion would help',
  contract: '',
  crew: { id: 'scout', name: 'Wren Scout', title: 'Motion scout', pigment: '#9fc7c0', glyph: '', species: '', essence: '' },
  ...over,
});
const refusal = (op: ForgeOp): string[] => {
  try {
    plan(lib, op);
  } catch (e) {
    expect(e).toBeInstanceOf(ForgeRefusal);
    return (e as ForgeRefusal).problems;
  }
  throw new Error('expected a refusal');
};

describe('the allow-list', () => {
  it('admits only agent files, SKILL.md files and the two registry files', () => {
    expect(allowed('library/agents/motion-scout.md')).toBe(true);
    expect(allowed('library/skills/03-motion-3d/new-skill/SKILL.md')).toBe(true);
    expect(allowed('library/registry/crew.json')).toBe(true);
    expect(allowed('library/registry/skills.registry.json')).toBe(true);
    for (const bad of ['library/registry/workflows.json', 'library/tools/verify.py', 'library/agents/../tools/x.md', 'shipyard/src/App.tsx', '.claude/agents/x.md', 'library/skills/03-motion-3d/x/scripts/run.mjs']) expect(allowed(bad), bad).toBe(false);
  });
});

describe('create an agent', () => {
  it('writes the agent file and one crew member at the next free station', () => {
    const changes = plan(lib, { kind: 'agent', op: 'create', payload: agent() });
    expect(changes.map((c) => c.rel).sort()).toEqual(['library/agents/motion-scout.md', 'library/registry/crew.json']);
    const md = changes.find((c) => c.rel.endsWith('.md'))!.next!;
    expect(md).toMatch(/^---\nname: motion-scout\n/);
    expect(md).toContain('routes: [find-animation-opportunities]');
    expect(md).toContain('- **Phase:** `diagnose`  ·  **Priority:** 4');
    const crew = JSON.parse(changes.find((c) => c.rel.endsWith('crew.json'))!.next!).crew as { id: string; station: number; role: { agent: string } }[];
    const added = crew.find((m) => m.role.agent === 'motion-scout')!;
    expect(added.id).toBe('scout');
    expect(added.station).toBe(Math.max(...crew.filter((m) => m !== added).map((m) => m.station)) + 1);
    expect(changes.every((c) => allowed(c.rel))).toBe(true);
  });

  it('refuses a taken id, an unknown route and a taken crew id, naming each', () => {
    const p = refusal({ kind: 'agent', op: 'create', payload: agent({ id: 'design-engineer', routes: ['no-such-skill'], crew: { ...agent().crew, id: 'captain' } }) });
    expect(p.join('\n')).toContain('agent design-engineer already exists');
    expect(p.join('\n')).toContain('route no-such-skill is not a registry skill');
    expect(p.join('\n')).toContain('crew id captain is taken');
  });
});

describe('update an agent', () => {
  it('changes the frontmatter and activation, and keeps every hand-written line', () => {
    const existing = lib.read('library/agents/fleet-measurer.md')!;
    const next = renderAgentMd(agent({ id: 'fleet-measurer', model: 'sonnet', routes: ['mobile-app-shell'], phase: 'diagnose', priority: 3 }), existing);
    expect(next).toContain('model: sonnet');
    expect(next).toContain('**Priority:** 3');
    expect(next).toContain('## Contract');
    expect(next).toContain('Reports a URL that failed to load as a row with `error`, never as a guess.');
    expect((next.match(/\*\*Phase:\*\*/g) ?? []).length).toBe(1);
  });
});

describe('skills', () => {
  it('create: a registry record (unrouted, not enabled) and a SKILL.md scaffold in the category folder', () => {
    const changes = plan(lib, { kind: 'skill', op: 'create', payload: { id: 'zz-forge-probe', category: '03-motion-3d', group: 'Motion', description: 'A probe skill for the Forge unit test.', body: '' } });
    const reg = JSON.parse(changes.find((c) => c.rel.endsWith('skills.registry.json'))!.next!) as { id: string; phase: string; enabled: boolean }[];
    expect(reg.at(-1)).toMatchObject({ id: 'zz-forge-probe', phase: 'unrouted', enabled: false });
    expect(changes.find((c) => c.rel === 'library/skills/03-motion-3d/zz-forge-probe/SKILL.md')?.next).toMatch(/^---\nname: zz-forge-probe\n/);
  });

  it('refuses a category with no artifact family', () => {
    expect(refusal({ kind: 'skill', op: 'create', payload: { id: 'zz-x', category: '99-nowhere', group: 'X', description: 'Nowhere to live at all.', body: '' } }).join()).toContain('has no artifact family');
  });

  it('delete: refused while an agent still routes the skill, and without the id typed back', () => {
    expect(refusal({ kind: 'skill', op: 'delete', payload: { id: 'mobile-app-shell', confirm: 'mobile-app-shell' } }).join()).toContain('still referenced by agent');
    expect(refusal({ kind: 'skill', op: 'delete', payload: { id: 'animate', confirm: 'anim' } }).join()).toContain('type animate to confirm');
  });
});

describe('delete an agent', () => {
  it('is refused while the agent crews a library workflow', () => {
    expect(refusal({ kind: 'agent', op: 'delete', payload: { id: 'design-engineer', confirm: 'design-engineer' } }).join()).toContain('crews workflow');
  });
});

describe('the request schema', () => {
  it('parses every operation the page sends, and refuses an unknown op', async () => {
    const { forgeOp } = await import('../../dev/forge');
    expect(forgeOp.safeParse({ kind: 'agent', op: 'update', payload: agent() }).success).toBe(true);
    expect(forgeOp.safeParse({ kind: 'agent', op: 'delete', payload: { id: 'motion-scout', confirm: 'motion-scout' } }).success).toBe(true);
    expect(forgeOp.safeParse({ kind: 'skill', op: 'create', payload: { id: 'zz-x', category: '03-motion-3d', group: 'Motion', description: 'A probe skill description.', body: '' } }).success).toBe(true);
    expect(forgeOp.safeParse({ kind: 'skill', op: 'delete', payload: { id: 'animate', confirm: 'animate' } }).success).toBe(true);
    expect(forgeOp.safeParse({ kind: 'workflow', op: 'create', payload: {} }).success).toBe(false);
    expect(forgeOp.safeParse({ kind: 'agent', op: 'rename', payload: agent() }).success).toBe(false);
  });
});

describe('a model-only edit', () => {
  it('changes exactly the model line, keeping an agent-specific phase word such as measurement', async () => {
    const { readFileSync } = await import('node:fs');
    const kb = JSON.parse(readFileSync('public/data/knowledge-base.json', 'utf8')) as { agents: { id: string; description: string; model: string; access: 'read-only' | 'write'; routes: string[]; phase: string | null; priority: number | null; activateWhen: string | null }[] };
    const a = kb.agents.find((x) => x.id === 'analytics-specialist')!;
    const existing = lib.read('library/agents/analytics-specialist.md')!;
    const next = renderAgentMd(agent({ id: a.id, description: a.description, model: 'opus', access: a.access, routes: a.routes, phase: a.phase as never, priority: a.priority, activateWhen: a.activateWhen ?? '' }), existing);
    const before = existing.split('\n');
    const after = next.split('\n');
    const changed = after.filter((l, i) => l !== before[i]);
    expect(changed).toEqual(['model: opus']);
    expect(after.length).toBe(before.length);
    // and the whole plan touches that one file: the crew card (and its console phase) is left alone
    const crew = JSON.parse(lib.read('library/registry/crew.json')!).crew.find((m: { role: { agent: string } }) => m.role.agent === a.id);
    const op = { kind: 'agent' as const, op: 'update' as const, payload: agent({ id: a.id, description: a.description, model: 'opus', access: a.access, routes: a.routes, phase: a.phase as never, priority: a.priority, activateWhen: a.activateWhen ?? '', crew: { id: crew.id, name: crew.name, title: crew.role.title, pigment: crew.pigment, glyph: '', species: '', essence: '' } }) };
    expect(plan(lib, op).map((c) => c.rel)).toEqual(['library/agents/analytics-specialist.md']);
  });
});
