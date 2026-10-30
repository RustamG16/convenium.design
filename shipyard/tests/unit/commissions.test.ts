import { describe, expect, it } from 'vitest';
import { COMMISSIONS, grantsFor, isOffRoute, newlyGranted, PROVEN_HULL_RUNS, shouldAnnounce } from '../../src/domain/commissions';
import { equip, isWorn } from '../../src/domain/loadout';
import { preflight } from '../../src/domain/preflight';
import { defaultShip } from '../../src/domain/ship';
import type { LogEntry } from '../../src/domain/schema';
import { isStage } from '../../src/domain/schema';
import { parseRunJson, runLogEntry } from '../../src/features/logbook/runJson';
import { outcomeEvents } from '../../src/store/outcomes';
import { createStore, initialState, LOGBOOK_CAP, reduce, type Action, type StoreState } from '../../src/store/store';
import { loadIndexFromDisk } from './helpers';

const idx = loadIndexFromDisk();
const env = { idx };
const AT = '2026-10-30T10:00:00.000Z';
const LATER = '2026-11-02T10:00:00.000Z';
const base = defaultShip(idx, AT);

const exportEntry = (clean: boolean, at = AT): LogEntry => ({ at, kind: 'export', truth: 'Verified', file: '00-run-plan.md', hull: clean ? 100 : 90, clean });
const verifyEntry = (): LogEntry => ({ at: AT, kind: 'verify-result', truth: 'User-reported', problems: 0 });
const runEntry = (n: number): LogEntry => {
  const parsed = parseRunJson(JSON.stringify({ target_project: 'sites/x', last_updated: `2026-10-0${n}`, phase_counts: { build: n }, artifact_hashes: { 'a.md': 'ab'.repeat(32) } }));
  if (!parsed.ok) throw new Error('fixture');
  return runLogEntry(parsed.summary, AT);
};

function run(state: StoreState, ...actions: Action[]): StoreState {
  return actions.reduce((s, a) => reduce(s, a, AT, env), state);
}
const cloned = (): StoreState => run(initialState(), { type: 'ship/clone', source: base, name: 'Fork' });

describe('the eight commissions', () => {
  it('are exactly the eight firsts of DESIGN.md, each with a plain condition and a truth label', () => {
    expect(COMMISSIONS.map((c) => c.id)).toEqual(['first-ship', 'first-recruit', 'first-off-route', 'first-clean', 'first-export', 'first-verify', 'first-run', 'proven-hull']);
    for (const c of COMMISSIONS) {
      expect(c.condition.length).toBeGreaterThan(10);
      expect(['Verified', 'User-reported']).toContain(c.truth);
    }
    expect(COMMISSIONS.find((c) => c.id === 'first-verify')!.truth).toBe('User-reported');
    expect(PROVEN_HULL_RUNS).toBe(3);
  });

  it('grantsFor grants each id once and never twice', () => {
    expect(grantsFor([{ kind: 'exported' }, { kind: 'exported' }], {})).toEqual(['first-export']);
    expect(grantsFor([{ kind: 'exported' }], { 'first-export': AT })).toEqual([]);
    expect(grantsFor([{ kind: 'run-logged', runsOnShip: 1 }], {})).toEqual(['first-run']);
    expect(grantsFor([{ kind: 'run-logged', runsOnShip: 3 }], {})).toEqual(['first-run', 'proven-hull']);
    expect(grantsFor([{ kind: 'owner-equipped', offRoute: false }], {})).toEqual([]);
  });
});

describe('opening, browsing or clicking alone grants nothing', () => {
  it('every view-state action, in any order, leaves commissions empty', () => {
    const actions: Action[] = [
      ...idx.kb.skills.map((s): Action => ({ type: 'codex/inspect', skill: s.id })),
      { type: 'ui/introSeen', shipId: 'ss-full-run' },
      { type: 'ui/sound', on: true },
      { type: 'ui/sound', on: false },
      { type: 'ui/designPath', path: 'D:/x' },
      { type: 'history/undo' },
      { type: 'history/redo' },
      { type: 'ship/rename', id: 'nobody', name: 'Nope' },
      { type: 'ship/delete', id: 'nobody' },
      { type: 'loadout/equip', shipId: 'nobody', member: 'engineer', skill: 'gsap-core' },
    ];
    const s = run(initialState(), ...actions);
    expect(s.commissions).toEqual({});
    expect(s.codex).toHaveLength(idx.kb.skills.length);
    // a store shell that is subscribed to and read changes nothing either
    const store = createStore(initialState(), () => AT, env);
    store.subscribe(() => undefined);
    store.getState();
    expect(store.getState().commissions).toEqual({});
  });

  it('no action type grants a commission directly', () => {
    const grant = { type: 'commission/grant', id: 'first-export' } as unknown as Action;
    const s = initialState();
    expect(reduce(s, grant, AT, env)).toBe(s);
  });

  it('a state loaded with commissions already granted announces none of them', () => {
    const granted = { 'first-ship': AT, 'first-export': AT };
    expect(newlyGranted(granted, granted)).toEqual([]);
    expect(newlyGranted({}, granted)).toEqual(['first-ship', 'first-export']);
    // visible: announced as it happens; hidden (granted while the tab is not in front): stored, not announced
    expect(shouldAnnounce(true)).toBe(true);
    expect(shouldAnnounce(false)).toBe(false);
  });
});

describe('first-off-route counts the owner equips only', () => {
  it('a derived default loadout already wears off-route artifacts, and cloning it grants no first-off-route', () => {
    const wornOffRoute = base.crew.flatMap((m) => m.loadout.filter((e) => isOffRoute(idx, m.agent, e.skill)).map((e) => `${m.id}:${e.skill}`));
    expect(wornOffRoute.length).toBeGreaterThan(0);
    const s = cloned();
    expect(s.commissions).toEqual({ 'first-ship': AT });
    expect(s.commissions['first-off-route']).toBeUndefined();
  });

  it('an on-route equip does not grant it; the owner equipping an off-route artifact does, once', () => {
    let s = cloned();
    const id = s.ships[0].id;
    const member = s.ships[0].crew.find((m) => m.id === 'engineer')!;
    const agent = idx.agent.get(member.agent)!;
    const onRoute = agent.routes.find((r) => idx.skill.has(r) && !isWorn(member, r));
    if (onRoute) {
      s = reduce(s, { type: 'loadout/equip', shipId: id, member: 'engineer', skill: onRoute }, LATER, env);
      expect(s.commissions['first-off-route']).toBeUndefined();
    } else {
      // every route is already worn: take an on-route one off and put it back
      const first = member.loadout.map((e) => e.skill).find((k) => !isOffRoute(idx, member.agent, k))!;
      expect(first).toBeDefined();
      s = reduce(s, { type: 'loadout/unequip', shipId: id, member: 'engineer', skill: first }, LATER, env);
      s = reduce(s, { type: 'loadout/equip', shipId: id, member: 'engineer', skill: first }, LATER, env);
      expect(s.commissions['first-off-route']).toBeUndefined();
    }
    const current = s.ships[0].crew.find((m) => m.id === 'engineer')!;
    const offRoute = idx.kb.skills.find((k) => !isWorn(current, k.id) && isOffRoute(idx, current.agent, k.id) && equip(idx, s.ships[0], 'engineer', k.id).ok)!;
    expect(offRoute).toBeDefined();
    s = reduce(s, { type: 'loadout/equip', shipId: id, member: 'engineer', skill: offRoute.id }, LATER, env);
    expect(s.commissions['first-off-route']).toBe(LATER);
    const again = reduce(s, { type: 'loadout/unequip', shipId: id, member: 'engineer', skill: offRoute.id }, '2027-01-01T00:00:00.000Z', env);
    const again2 = reduce(again, { type: 'loadout/equip', shipId: id, member: 'engineer', skill: offRoute.id }, '2027-01-01T00:00:00.000Z', env);
    expect(again2.commissions['first-off-route']).toBe(LATER);
  });

  it('a refused equip grants nothing', () => {
    const s = cloned();
    const before = s.commissions;
    const worn = s.ships[0].crew[0].loadout[0].skill;
    const dup = reduce(s, { type: 'loadout/equip', shipId: s.ships[0].id, member: s.ships[0].crew[0].id, skill: worn }, LATER, env);
    expect(dup.commissions).toBe(before);
  });
});

describe('first-clean needs a ship you changed or exported to be clean', () => {
  it('cloning alone is not it; an edit that breaks the ship is not it; the edit that repairs it is', () => {
    let s = cloned();
    expect(s.commissions['first-clean']).toBeUndefined();
    const id = s.ships[0].id;
    const st = s.ships[0].voyage.filter(isStage).find((x) => x.activeSkill && s.ships[0].crew.some((m) => m.id === x.member && isWorn(m, x.activeSkill!)))!;
    s = reduce(s, { type: 'loadout/unequip', shipId: id, member: st.member, skill: st.activeSkill! }, LATER, env);
    expect(preflight(idx, s.ships[0]).canExport).toBe(false);
    expect(s.commissions['first-clean']).toBeUndefined();
    s = reduce(s, { type: 'loadout/equip', shipId: id, member: st.member, skill: st.activeSkill! }, LATER, env);
    expect(preflight(idx, s.ships[0]).clean).toBe(true);
    expect(s.commissions['first-clean']).toBe(LATER);
  });

  it('exporting a clean ship grants it; exporting one with warnings does not', () => {
    let s = run(initialState(), { type: 'log/add', shipId: 'ss-full-run', entry: exportEntry(false) });
    expect(s.commissions).toEqual({ 'first-export': AT });
    s = reduce(s, { type: 'log/add', shipId: 'ss-full-run', entry: exportEntry(true) }, LATER, env);
    expect(s.commissions).toEqual({ 'first-export': AT, 'first-clean': LATER });
  });
});

describe('logbook outcomes', () => {
  it('a pasted verify result grants first-verify; a run.json grants first-run; three distinct runs on one ship grant proven-hull', () => {
    let s = run(initialState(), { type: 'log/add', shipId: 'ss-full-run', entry: verifyEntry() });
    expect(s.commissions).toEqual({ 'first-verify': AT });
    s = run(s, { type: 'log/add', shipId: 'ss-full-run', entry: runEntry(1) });
    expect(Object.keys(s.commissions)).toEqual(['first-verify', 'first-run']);
    s = run(s, { type: 'log/add', shipId: 'ss-full-run', entry: runEntry(2) });
    expect(s.commissions['proven-hull']).toBeUndefined();
    s = reduce(s, { type: 'log/add', shipId: 'ss-full-run', entry: runEntry(3) }, LATER, env);
    expect(s.commissions['proven-hull']).toBe(LATER);
    expect(s.logbook['ss-full-run']).toHaveLength(4);
  });

  it('the same run.json is logged once, so repeating it cannot farm proven-hull', () => {
    let s = initialState();
    for (let i = 0; i < 5; i++) s = run(s, { type: 'log/add', shipId: 'ss-full-run', entry: runEntry(1) });
    expect(s.logbook['ss-full-run']).toHaveLength(1);
    expect(s.commissions['proven-hull']).toBeUndefined();
  });

  it('runs on different ships do not add up to a proven hull', () => {
    let s = initialState();
    s = run(s, { type: 'log/add', shipId: 'a-ship', entry: runEntry(1) }, { type: 'log/add', shipId: 'b-ship', entry: runEntry(2) }, { type: 'log/add', shipId: 'c-ship', entry: runEntry(3) });
    expect(s.commissions['proven-hull']).toBeUndefined();
    expect(s.commissions['first-run']).toBe(AT);
  });

  it('the logbook keeps the newest entries within its cap and log entries are not undoable', () => {
    let s = initialState();
    for (let i = 0; i < LOGBOOK_CAP + 5; i++) s = run(s, { type: 'log/add', shipId: 'x', entry: { at: AT, kind: 'export', truth: 'Verified', file: `f${i}` } });
    expect(s.logbook.x).toHaveLength(LOGBOOK_CAP);
    expect(s.logbook.x.at(-1)?.file).toBe(`f${LOGBOOK_CAP + 4}`);
    expect(s.past).toHaveLength(0);
  });

  it('a recruited member is an outcome (the action arrives with the Bridge); a crew count that did not grow is not', () => {
    const before = cloned();
    const grown: StoreState = { ...before, ships: before.ships.map((sh) => ({ ...sh, crew: [...sh.crew, { ...sh.crew[0], id: 'newcomer', station: 8 }] })) };
    const recruit = { type: 'crew/recruit' } as unknown as Action;
    expect(outcomeEvents(before, grown, recruit, env)).toContainEqual({ kind: 'member-recruited' });
    expect(outcomeEvents(before, before, recruit, env)).not.toContainEqual({ kind: 'member-recruited' });
    expect(grantsFor(outcomeEvents(before, grown, recruit, env), {})).toContain('first-recruit');
  });
});
