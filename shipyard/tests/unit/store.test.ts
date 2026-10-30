import { describe, expect, it } from 'vitest';
import type { Ship } from '../../src/domain/schema';
import { browserlessStorage } from './storage';
import { readPersisted, STORAGE_KEY, writePersisted } from '../../src/store/persist';
import { defaultShip } from '../../src/domain/ship';
import { wornSkills } from '../../src/domain/loadout';
import { loadIndexFromDisk } from './helpers';
import { createStore, emptyPersisted, initialState, reduce, uniqueShipId, UNDO_DEPTH, toPersisted } from '../../src/store/store';

const AT = '2026-10-30T10:00:00.000Z';

function ship(id: string): Ship {
  return {
    schema: 'shipyard.ship.v1',
    id,
    name: id,
    class: 'custom',
    kbHash: 'abcdef12',
    crew: [{ id: 'cap', agent: 'design-director', character: { name: 'Cap', body: 'standin', pigment: '#D9A441' }, station: 1, loadout: [] }],
    voyage: [{ kind: 'stage', id: 'plan', label: 'Plan', phase: 'prepare', member: 'cap', activeSkill: null, outputs: ['06-build-plan.md'], stop: 'written' }],
    createdAt: AT,
    updatedAt: AT,
  };
}

describe('store reducer', () => {
  it('adds, renames and deletes ships, and undo brings them back', () => {
    let s = initialState();
    s = reduce(s, { type: 'ship/add', ship: ship('alpha') }, AT);
    s = reduce(s, { type: 'ship/rename', id: 'alpha', name: '  Alpha Prime ' }, AT);
    expect(s.ships[0].name).toBe('Alpha Prime');
    s = reduce(s, { type: 'ship/delete', id: 'alpha' }, AT);
    expect(s.ships).toHaveLength(0);
    s = reduce(s, { type: 'history/undo' }, AT);
    expect(s.ships.map((x) => x.id)).toEqual(['alpha']);
    s = reduce(s, { type: 'history/redo' }, AT);
    expect(s.ships).toHaveLength(0);
  });

  it('keeps at most 50 undo snapshots', () => {
    let s = initialState();
    s = reduce(s, { type: 'ship/add', ship: ship('alpha') }, AT);
    for (let i = 0; i < UNDO_DEPTH + 20; i++) s = reduce(s, { type: 'ship/rename', id: 'alpha', name: `n${i}` }, AT);
    expect(s.past).toHaveLength(UNDO_DEPTH);
  });

  it('view-state actions do not enter the undo stack', () => {
    let s = initialState();
    s = reduce(s, { type: 'codex/inspect', skill: 'impeccable' }, AT);
    s = reduce(s, { type: 'codex/inspect', skill: 'impeccable' }, AT);
    s = reduce(s, { type: 'ui/introSeen', shipId: 'x' }, AT);
    s = reduce(s, { type: 'ui/sound', on: true }, AT);
    expect(s.codex).toEqual(['impeccable']);
    expect(s.past).toHaveLength(0);
  });

  it('imports under a fresh id when the id is taken', () => {
    let s = initialState();
    s = reduce(s, { type: 'ship/add', ship: ship('alpha') }, AT);
    s = reduce(s, { type: 'ship/import', ship: ship('alpha') }, AT);
    expect(s.ships.map((x) => x.id)).toEqual(['alpha', 'alpha-2']);
    expect(s.ships[1].origin?.kind).toBe('import');
  });

  it('grants a commission once and keeps the first date', () => {
    let s = initialState();
    s = reduce(s, { type: 'commission/grant', id: 'first-export' }, AT);
    s = reduce(s, { type: 'commission/grant', id: 'first-export' }, '2027-01-01T00:00:00.000Z');
    expect(s.commissions).toEqual({ 'first-export': AT });
  });

  it('the store shell notifies subscribers only on change', () => {
    const store = createStore(initialState(), () => AT);
    let calls = 0;
    store.subscribe(() => calls++);
    store.dispatch({ type: 'history/undo' });
    expect(calls).toBe(0);
    store.dispatch({ type: 'ship/add', ship: ship('alpha') });
    expect(calls).toBe(1);
  });

  it('uniqueShipId yields valid ids', () => {
    expect(uniqueShipId([], 'SS Full Run!')).toBe('ss-full-run');
    expect(uniqueShipId(['ss-full-run'], 'ss-full-run')).toBe('ss-full-run-2');
    expect(uniqueShipId([], '123')).toMatch(/^[a-z][a-z0-9-]{1,47}$/);
  });
});

describe('persistence', () => {
  it('round-trips the persisted slice', () => {
    const storage = browserlessStorage();
    let s = initialState();
    s = reduce(s, { type: 'ship/add', ship: ship('alpha') }, AT);
    expect(writePersisted(storage, toPersisted(s))).toBe(true);
    const read = readPersisted(storage);
    expect(read.banner).toBeNull();
    expect(read.state.ships.map((x) => x.id)).toEqual(['alpha']);
  });

  it('malformed or newer data falls back to defaults with a banner', () => {
    const storage = browserlessStorage();
    storage.setItem(STORAGE_KEY, '{nope');
    expect(readPersisted(storage)).toMatchObject({ banner: 'malformed', state: emptyPersisted() });
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ships: [{}], codex: [], commissions: {}, ui: { introSeen: {}, sound: false, designPath: '' } }));
    expect(readPersisted(storage).banner).toBe('malformed');
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2 }));
    expect(readPersisted(storage).banner).toBe('newer-version');
  });

  it('unavailable storage is reported, not thrown', () => {
    expect(readPersisted(null).banner).toBe('unavailable');
    expect(writePersisted(null, emptyPersisted())).toBe(false);
    const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => undefined };
    expect(readPersisted(throwing).banner).toBe('unavailable');
    expect(writePersisted(throwing, emptyPersisted())).toBe(false);
  });
});

describe('ship-editing actions (need the knowledge base)', () => {
  const idx = loadIndexFromDisk();
  const env = { idx };

  it('create makes a blank ship under an id that avoids library ids; clone forks a library ship', () => {
    let s = initialState();
    s = reduce(s, { type: 'ship/create', name: 'SS Full Run' }, AT, env);
    expect(s.ships).toHaveLength(1);
    expect(s.ships[0].id).toBe('ss-full-run-2');
    s = reduce(s, { type: 'ship/clone', source: defaultShip(idx, AT), name: 'My Full Run' }, AT, env);
    expect(s.ships[1]).toMatchObject({ id: 'my-full-run', class: 'custom', origin: { kind: 'clone', from: 'ss-full-run' } });
    s = reduce(s, { type: 'history/undo' }, AT, env);
    expect(s.ships).toHaveLength(1);
  });

  it('equip, unequip, toHold and fromHold edit the ship, stamp updatedAt and undo', () => {
    let s = initialState();
    s = reduce(s, { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Fork' }, AT, env);
    const id = s.ships[0].id;
    const later = '2026-10-31T00:00:00.000Z';
    s = reduce(s, { type: 'loadout/unequip', shipId: id, member: 'engineer', skill: 'gsap-core' }, later, env);
    expect(wornSkills(s.ships[0].crew.find((m) => m.id === 'engineer')!)).not.toContain('gsap-core');
    expect(s.ships[0].updatedAt).toBe(later);
    s = reduce(s, { type: 'loadout/equip', shipId: id, member: 'engineer', skill: 'gsap-core' }, later, env);
    expect(wornSkills(s.ships[0].crew.find((m) => m.id === 'engineer')!)).toContain('gsap-core');
    s = reduce(s, { type: 'loadout/toHold', shipId: id, member: 'engineer', skill: 'gsap-core' }, later, env);
    expect(s.ships[0].hold).toContain('gsap-core');
    s = reduce(s, { type: 'loadout/fromHold', shipId: id, member: 'engineer', skill: 'gsap-core' }, later, env);
    expect(s.ships[0].hold).not.toContain('gsap-core');
    s = reduce(s, { type: 'history/undo' }, later, env);
    expect(s.ships[0].hold).toContain('gsap-core');
  });

  it('a refused equip leaves the ship and the undo stack untouched', () => {
    let s = initialState();
    s = reduce(s, { type: 'ship/clone', source: defaultShip(idx, AT), name: 'Fork' }, AT, env);
    const before = s;
    s = reduce(s, { type: 'loadout/equip', shipId: s.ships[0].id, member: 'engineer', skill: 'impeccable' }, AT, env);
    expect(s).toBe(before);
  });

  it('without the knowledge base the ship-building actions do nothing', () => {
    const s = initialState();
    expect(reduce(s, { type: 'ship/create', name: 'X' }, AT)).toBe(s);
  });
});
