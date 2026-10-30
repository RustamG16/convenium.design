import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { indexKb, type KbIndex } from './artifacts';
import { KbError, loadKb } from './load';

type KbStatus = { state: 'loading' } | { state: 'error'; message: string; issues: string[] } | { state: 'ready'; index: KbIndex };

const KbContext = createContext<KbStatus>({ state: 'loading' });

export function KbProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<KbStatus>({ state: 'loading' });

  useEffect(() => {
    const ctl = new AbortController();
    loadKb(ctl.signal).then(
      (kb) => setStatus({ state: 'ready', index: indexKb(kb) }),
      (err: unknown) => {
        if (ctl.signal.aborted) return;
        if (err instanceof KbError) setStatus({ state: 'error', message: err.message, issues: err.issues });
        else setStatus({ state: 'error', message: 'The knowledge base could not be loaded.', issues: [] });
      },
    );
    return () => ctl.abort();
  }, []);

  const value = useMemo(() => status, [status]);
  return <KbContext.Provider value={value}>{children}</KbContext.Provider>;
}

export function useKbStatus(): KbStatus {
  return useContext(KbContext);
}

/** The ready knowledge base. Only call below <KbGate>, which renders children once it is ready. */
export function useKb(): KbIndex {
  const status = useContext(KbContext);
  if (status.state !== 'ready') throw new Error('useKb outside <KbGate>');
  return status.index;
}

/** Renders the loading and error states; children only see a ready knowledge base. */
export function KbGate({ children }: { children: ReactNode }) {
  const status = useKbStatus();
  if (status.state === 'loading') {
    return (
      <p className="state-line" role="status" data-testid="kb-loading">
        Loading the library…
      </p>
    );
  }
  if (status.state === 'error') {
    return (
      <div className="state-panel" role="alert" data-testid="kb-error">
        <h2>The library did not load</h2>
        <p>{status.message}</p>
        {status.issues.length > 0 && (
          <ul>
            {status.issues.slice(0, 8).map((i) => (
              <li key={i}>
                <code>{i}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
