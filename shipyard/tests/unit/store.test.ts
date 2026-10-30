import { describe, expect, it } from 'vitest';
import type { Ship } from '../../src/domain/schema';
import { browserlessStorage } from './storage';
import { readPersisted, STORAGE_KEY, writePersisted } from '../../src/store/persist';
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
