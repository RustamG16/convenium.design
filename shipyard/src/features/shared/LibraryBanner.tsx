// v2 live library: the signal lamp under the header. Dev server only — the deployed build never hears a
// library change, so this renders nothing there. It says, in words:
// - "Library changed · Rebuild" when library/ was edited and the knowledge base is out of date;
// - "Rebuilding…" while project.py all + verify.py run;
// - "Library updated: 2 new skills · 1 changed" once the new knowledge base is live (no page reload);
// - the failure and its log when verify.py refuses, with the last good library still on screen.
import { useEffect } from 'react';
import { useKbLive } from '../../kb/context';

const NOTICE_MS = 8_000;

export function LibraryBanner() {
  const live = useKbLive();
  const { notice, dismiss } = live;
  useEffect(() => {
    if (!notice || notice.kind !== 'ok') return;
    const t = window.setTimeout(dismiss, NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [notice, dismiss]);

  if (!live.enabled) return null;
  if (!live.stale && !live.rebuilding && !notice) return <p className="sr-only" role="status" data-testid="library-banner" data-state="idle" />;

  const state = live.rebuilding ? 'rebuilding' : notice?.kind === 'error' ? 'error' : live.stale ? 'stale' : 'updated';
  return (
    <div className="library-banner" role="status" data-testid="library-banner" data-state={state}>
      <span className="library-lamp" aria-hidden="true" />
      {state === 'rebuilding' && <span>Rebuilding the library: project.py all, then verify.py…</span>}
      {state === 'stale' && (
        <>
          <span>
            <strong>Library changed.</strong> The screens show the last build until you rebuild.
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={live.rebuild} data-testid="library-rebuild">
            Rebuild
          </button>
        </>
      )}
      {state === 'updated' && notice && (
        <>
          <span>
            <strong>Library updated:</strong> {notice.text}
          </span>
          <button type="button" className="btn btn-text btn-sm" onClick={dismiss}>
            Dismiss
          </button>
        </>
      )}
      {state === 'error' && notice && (
        <>
          <span>
            <strong>{notice.text}</strong> The last good library is still on screen.
          </span>
          {notice.log && (
            <details className="library-log">
              <summary>Show the log</summary>
              <pre>{notice.log}</pre>
            </details>
          )}
          <button type="button" className="btn btn-quiet btn-sm" onClick={dismiss}>
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
