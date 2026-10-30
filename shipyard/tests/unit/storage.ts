import type { StorageLike } from '../../src/store/persist';

/** An in-memory stand-in for localStorage (the unit environment is node, no DOM). */
export function browserlessStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}
