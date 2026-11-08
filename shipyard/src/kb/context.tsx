import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { indexKb, type KbIndex } from './artifacts';
import { describeDiff, diffKb } from './diff';
import { KbError, loadKb } from './load';

type KbStatus = { state: 'loading' } | { state: 'error'; message: string; issues: string[] } | { state: 'ready'; index: KbIndex };

const KbContext = createContext<KbStatus>({ state: 'loading' });

/**
 * v2 live library. Only the dev server sends these events (`import.meta.hot` is undefined in the
 * deployed build, so `enabled` stays false and nothing here runs there).
 */
export interface KbLive {
  enabled: boolean;
  /** library/ changed since the knowledge base was built */
  stale: boolean;
  rebuilding: boolean;
  notice: { kind: 'ok' | 'error'; text: string; log?: string } | null;
  rebuild: () => void;
  dismiss: () => void;
}

const noop = () => {};
const KbLiveContext = createContext<KbLive>({ enabled: false, stale: false, rebuilding: false, notice: null, rebuild: noop, dismiss: noop });

const hot = import.meta.hot;

export function KbProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<KbStatus>({ state: 'loading' });
  const [stale, setStale] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [notice, setNotice] = useState<KbLive['notice']>(null);
  const current = useRef<KbIndex | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const ctl = new AbortController();
    loadKb(ctl.signal).then(
      (kb) => {
        const index = indexKb(kb);
        current.current = index;
        setStatus({ state: 'ready', index });
      },
      (err: unknown) => {
        if (ctl.signal.aborted) return;
        if (err instanceof KbError) setStatus({ state: 'error', message: err.message, issues: err.issues });
        else setStatus({ state: 'error', message: 'The knowledge base could not be loaded.', issues: [] });
      },
    );
    return () => ctl.abort();
  }, []);

  /** Refetch after the file changed. A bad file never replaces a good index: the last good one stays. */
  const reload = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const kb = await loadKb(undefined, `${Date.now()}-${mine}`);
      if (mine !== seq.current) return; // a newer reload is in flight
      const before = current.current;
      setStale(false);
      if (before && before.kb.sourceHash === kb.sourceHash) return;
      const index = indexKb(kb);
      current.current = index;
      setStatus({ state: 'ready', index });
      if (before) setNotice({ kind: 'ok', text: describeDiff(diffKb(before, index)) });
    } catch (err) {
      if (mine !== seq.current) return;
      const log = err instanceof KbError ? err.issues.slice(0, 20).join('\n') : undefined;
      setNotice({ kind: 'error', text: err instanceof KbError ? err.message : 'The new knowledge base could not be loaded.', log });
    }
  }, []);

  useEffect(() => {
    if (!hot) return;
    const onKb = () => void reload();
    const onStale = (d: { stale?: boolean }) => setStale(!!d?.stale);
    hot.on('shipyard:kb', onKb);
    hot.on('shipyard:kb-stale', onStale);
    // a page opened after the change asks once
    fetch('/__shipyard/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { stale?: boolean } | null) => d && setStale(!!d.stale))
      .catch(noop);
    return () => {
      hot.off('shipyard:kb', onKb);
      hot.off('shipyard:kb-stale', onStale);
    };
  }, [reload]);

  const rebuild = useCallback(() => {
    setRebuilding(true);
    setNotice(null);
    fetch('/__shipyard/rebuild', { method: 'POST' })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; project?: string; verify?: string | null };
        if (d.ok) {
          await reload();
          setStale(false);
        } else {
          setNotice({ kind: 'error', text: d.error ? `Rebuild refused: ${d.error}.` : 'The rebuild failed.', log: [d.project, d.verify].filter(Boolean).join('\n\n') || undefined });
        }
      })
      .catch(() => setNotice({ kind: 'error', text: 'The dev server did not answer the rebuild.' }))
      .finally(() => setRebuilding(false));
  }, [reload]);

  const dismiss = useCallback(() => setNotice(null), []);
  const live = useMemo<KbLive>(() => ({ enabled: !!hot, stale, rebuilding, notice, rebuild, dismiss }), [stale, rebuilding, notice, rebuild, dismiss]);
  const value = useMemo(() => status, [status]);
  return (
    <KbContext.Provider value={value}>
      <KbLiveContext.Provider value={live}>{children}</KbLiveContext.Provider>
    </KbContext.Provider>
  );
}

export function useKbLive(): KbLive {
  return useContext(KbLiveContext);
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
