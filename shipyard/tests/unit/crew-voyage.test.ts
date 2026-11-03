import { describe, expect, it } from 'vitest';
import { dismiss, editCharacter, MAX_CREW, recruit, seat, stagesOwnedBy } from '../../src/domain/crew';
import { preflight } from '../../src/domain/preflight';
import { cloneShip, defaultShip } from '../../src/domain/ship';
import { isStage } from '../../src/domain/schema';
import { addItem, applyTemplate, deleteItem, duplicateItem, editItem, moveItem, newGate, newStage, stageIds } from '../../src/domain/voyage';
import { createStore, emptyPersisted, initialState, reduce } from '../../src/store/store';
import { loadIndexFromDisk } from './helpers';

const AT = '2026-11-01T10:00:00.000Z';
const idx = loadIndexFromDisk();
const base = () => cloneShip(defaultShip(idx, AT), { id: 'mine', name: 'Mine' }, AT);

describe('crew operations', () => {
  it('recruits up to eight, with a derived loadout and a free station, then refuses', () => {
    let ship = base();
    expect(ship.crew).toHaveLength(7);
    const r = recruit(idx, ship, { agent: 'fleet-measurer', name: 'Gauge Hand' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ship = r.ship;
    expect(ship.crew).toHaveLength(MAX_CREW);
    expect(r.member?.station).toBe(8);
    expect(r.member?.character.fromCrew).toBeUndefined();
    expect(r.member!.loadout.length).toBeLessThanOrEqual(9);
    const again = recruit(idx, ship, { agent: 'visual-analyst', name: 'Ninth' });
    expect(again.ok).toBe(false);
  });

  it('refuses an empty name, ids stay unique for equal names', () => {
    const ship = base();
    expect(recruit(idx, ship, { agent: 'design-engineer', name: '   ' }).ok).toBe(false);
    const a = recruit(idx, { ...ship, crew: ship.crew.slice(0, 2) }, { agent: 'design-engineer', name: 'Captain Oddvar Quill' });
    expect(a.ok && a.member!.id).toMatch(/^captain-oddvar-quill/);
    if (!a.ok) return;
    const b = recruit(idx, a.ship, { agent: 'design-engineer', name: 'Captain Oddvar Quill' });
    expect(b.ok && b.member!.id).not.toBe(a.member!.id);
  });

  it('edits a character and keeps the agent fixed; a bad pigment is ignored', () => {
    const ship = base();
    const r = editCharacter(ship, 'captain', { name: 'Skipper', pigment: '#93AEDB', body: 'standin', species: 'x' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = r.ship.crew.find((c) => c.id === 'captain')!;
    expect(m.character).toMatchObject({ name: 'Skipper', pigment: '#93AEDB', body: 'standin', species: 'x' });
    expect(m.agent).toBe('design-director');
    expect(editCharacter(r.ship, 'captain', { pigment: 'red' }).ok).toBe(true);
    expect(editCharacter(r.ship, 'captain', { name: '' }).ok).toBe(false);
    expect(editCharacter(r.ship, 'nobody', { name: 'x' }).ok).toBe(false);
  });

  it('dismiss sends the artifacts to the hold, keeps the stages and pre-flight names them; the last member stays', () => {
    const ship = base();
    const worn = ship.crew.find((m) => m.id === 'engineer')!.loadout.map((e) => e.skill);
    const r = dismiss(ship, 'engineer');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ship.crew.some((m) => m.id === 'engineer')).toBe(false);
    for (const s of worn) expect(r.ship.hold).toContain(s);
    expect(stagesOwnedBy(ship, 'engineer')).toBeGreaterThan(0);
    const report = preflight(idx, r.ship);
    expect(report.blockers).toBeGreaterThan(0);
    expect(JSON.stringify(report)).toContain('not aboard');
    const one = { ...ship, crew: ship.crew.slice(0, 1) };
    expect(dismiss(one, one.crew[0].id).ok).toBe(false);
  });

  it('seats a member at a station, swapping with whoever sat there', () => {
    const ship = base();
    const cap = ship.crew.find((m) => m.id === 'captain')!;
    const eng = ship.crew.find((m) => m.id === 'engineer')!;
    const r = seat(ship, 'captain', eng.station);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ship.crew.find((m) => m.id === 'captain')!.station).toBe(eng.station);
    expect(r.ship.crew.find((m) => m.id === 'engineer')!.station).toBe(cap.station);
    expect(seat(ship, 'captain', 9).ok).toBe(false);
  });
});

describe('voyage operations', () => {
  it('adds, edits, duplicates, moves and deletes while stage ids stay unique', () => {
    let ship = base();
    const n = ship.voyage.length;
    const a = addItem(ship, newStage(ship, 'captain'));
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    ship = a.ship;
    expect(ship.voyage).toHaveLength(n + 1);
    const d = duplicateItem(ship, 0);
    if (!d.ok) throw new Error(d.reason);
    ship = d.ship;
    const ids = stageIds(ship.voyage);
    expect(new Set(ids).size).toBe(ids.length);
    const e = editItem(ship, 0, { label: 'Renamed', activeSkill: null });
    if (!e.ok) throw new Error(e.reason);
    expect((e.ship.voyage[0] as { label: string }).label).toBe('Renamed');
    expect(editItem(ship, 0, { outputs: [] }).ok).toBe(false);
    expect(editItem(ship, 0, { stop: ' ' }).ok).toBe(false);
    const m = moveItem(ship, 0, 3);
    if (!m.ok) throw new Error(m.reason);
    expect(m.ship.voyage[3]).toEqual(ship.voyage[0]);
    const del = deleteItem(ship, 0);
    expect(del.ok && del.ship.voyage.length).toBe(ship.voyage.length - 1);
  });

  it('a voyage keeps one stage', () => {
    const ship = base();
    const one = { ...ship, voyage: ship.voyage.filter(isStage).slice(0, 1) };
    expect(deleteItem(one, 0).ok).toBe(false);
  });

  it('applies a library template by append and by replace', () => {
    const ship = base();
    const appended = applyTemplate(idx, ship, 'ss-abridged', 'append');
    if (!appended.ok) throw new Error(appended.reason);
    const ids = stageIds(appended.ship.voyage);
    expect(new Set(ids).size).toBe(ids.length);
    expect(appended.ship.voyage.length).toBeGreaterThan(ship.voyage.length);
    const replaced = applyTemplate(idx, ship, 'ss-abridged', 'replace');
    if (!replaced.ok) throw new Error(replaced.reason);
    expect(replaced.ship.voyage.length).toBeLessThan(ship.voyage.length);
    expect(applyTemplate(idx, ship, 'no-such', 'append').ok).toBe(false);
  });

  it('gates are added with a free letter', () => {
    const ship = base();
    const g = newGate(ship);
    expect(ship.voyage.some((v) => v.kind === 'gate' && v.gate === g.gate)).toBe(false);
  });
});

describe('store: crew and voyage actions are undoable and never touch a library ship', () => {
  const env = { idx };
  const withShip = () => reduce(initialState(emptyPersisted()), { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Mine' }, AT, env);

  it('recruit grants the first-recruit commission once, and undo restores the crew', () => {
    let s = withShip();
    const id = s.ships[0].id;
    s = reduce(s, { type: 'crew/recruit', shipId: id, input: { agent: 'fleet-measurer', name: 'Hand' } }, AT, env);
    expect(s.ships[0].crew).toHaveLength(8);
    expect(s.commissions['first-recruit']).toBeTruthy();
    s = reduce(s, { type: 'history/undo' }, AT, env);
    expect(s.ships[0].crew).toHaveLength(7);
  });

  it('restoreDefault returns a clone to its template and keeps its id and name', () => {
    let s = withShip();
    const id = s.ships[0].id;
    s = reduce(s, { type: 'crew/dismiss', shipId: id, member: 'engineer' }, AT, env);
    s = reduce(s, { type: 'voyage/delete', shipId: id, index: 0 }, AT, env);
    expect(s.ships[0].crew).toHaveLength(6);
    s = reduce(s, { type: 'ship/restoreDefault', id }, AT, env);
    expect(s.ships[0].crew).toHaveLength(7);
    expect(s.ships[0].id).toBe(id);
    expect(s.ships[0].name).toBe('Mine');
    expect(s.ships[0].class).toBe('custom');
  });

  it('an edit addressed to a library ship id changes nothing', () => {
    const s = withShip();
    const next = reduce(s, { type: 'crew/dismiss', shipId: 'ss-full-run', member: 'engineer' }, AT, env);
    expect(next).toBe(s);
  });

  it('a store survives a full run of actions through createStore', () => {
    const store = createStore(initialState(emptyPersisted()), () => AT, env);
    store.dispatch({ type: 'ship/clone', source: defaultShip(idx, AT), name: 'Run' });
    const id = store.getState().ships[0].id;
    store.dispatch({ type: 'crew/station', shipId: id, member: 'captain', station: 5 });
    store.dispatch({ type: 'voyage/move', shipId: id, from: 0, to: 2 });
    expect(store.getState().past.length).toBe(3);
  });
});
