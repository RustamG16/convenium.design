import { useMemo } from 'react';
import type { Ship } from '../../domain/schema';
import { LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { useKb } from '../../kb/context';
import { useStoreState } from '../../store/context';

/** A ship by id: the owner's custom ships first, then the library ships rebuilt from the knowledge base. */
export function useShip(id: string): Ship | null {
  const idx = useKb();
  const { ships } = useStoreState();
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH).ships, [idx]);
  return ships.find((s) => s.id === id) ?? library.find((s) => s.id === id) ?? null;
}
