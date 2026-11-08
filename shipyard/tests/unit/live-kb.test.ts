/**
 * v2 T17: invariants over the LIVE knowledge base (public/data/knowledge-base.json). No exact counts:
 * these must hold whatever the owner or Claude adds to `library/`, and fail only on real breakage.
 */
import { describe, expect, it } from 'vitest';
import { convertWorkflow, ConversionError } from '../../src/domain/conversion';
import { preflight } from '../../src/domain/preflight';
import { shipSchema } from '../../src/domain/schema';
import { defaultShip, libraryShips } from '../../src/domain/ship';
import { drawFamily } from '../../src/scene/artifacts/familyIds';
import { loadLiveIndex } from './helpers';

const idx = loadLiveIndex();
const AT = '2026-11-08T00:00:00.000Z';

describe('the live knowledge base', () => {
  it('parses, and every skill resolves to a drawable artifact', () => {
    expect(idx.kb.skills.length).toBeGreaterThan(0);
    for (const s of idx.kb.skills) expect(drawFamily(s.artifact.family)).toBeTruthy();
  });

  it('every agent has exactly one crew member, and every crew member an agent', () => {
    const crewAgents = idx.kb.crew.map((c) => c.role.agent);
    for (const a of idx.kb.agents) expect(crewAgents.filter((x) => x === a.id)).toHaveLength(1);
    for (const c of idx.kb.crew) expect(idx.agent.has(c.role.agent), c.id).toBe(true);
  });

  it('every library workflow becomes a ship or is reported with its problems (never dropped)', () => {
    const { ships, unconverted } = libraryShips(idx, AT);
    expect(ships.length + unconverted.length).toBe(idx.kb.workflows.ships.length);
    for (const s of ships) expect(shipSchema.safeParse(s).success, s.id).toBe(true);
    for (const u of unconverted) expect(u.problems.length, u.workflow).toBeGreaterThan(0);
  });

  it('the default ship converts and its pre-flight runs', () => {
    expect(() => convertWorkflow(idx, idx.kb.workflows.default)).not.toThrow(ConversionError);
    const r = preflight(idx, defaultShip(idx, AT));
    expect(r.applicable).toBeGreaterThan(0);
  });
});
