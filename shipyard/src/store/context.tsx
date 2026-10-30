import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { useKbStatus } from '../kb/context';
import { browserStorage, readPersisted, writePersisted, type PersistBanner } from './persist';
import { createStore, initialState, toPersisted, type Store, type StoreState } from './store';

interface StoreContextValue {
  store: Store;
  banner: PersistBanner | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** Mount below <KbProvider>: actions that build or edit ships read the knowledge base from it. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const kb = useKbStatus();
  const value = useMemo<StoreContextValue>(() => {
    const storage = browserStorage();
    const read = readPersisted(storage);
    return { store: createStore(initialState(read.state)), banner: read.banner };
  }, []);

  const index = kb.state === 'ready' ? kb.index : undefined;
  useEffect(() => {
    value.store.setEnv(index ? { idx: index } : undefined);
  }, [value, index]);

  useEffect(() => {
    const storage = browserStorage();
    let last = toPersisted(value.store.getState());
    return value.store.subscribe(() => {
      const next = toPersisted(value.store.getState());
      // History changes ships only; persist whenever any persisted slice changed.
      if (JSON.stringify(next) === JSON.stringify(last)) return;
      last = next;
      writePersisted(storage, next);
    });
  }, [value]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useCtx(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('StoreProvider is missing');
  return ctx;
}

export function useStoreState(): StoreState {
  const { store } = useCtx();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useDispatch(): Store['dispatch'] {
  return useCtx().store.dispatch;
}

export function usePersistBanner(): PersistBanner | null {
  return useCtx().banner;
}
