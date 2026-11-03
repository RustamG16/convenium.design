// A small notice line for edits: what just happened, any warning that goes with it, and Undo while
// the undo is still the owner's one step back. Polite live region, no sound, no motion beyond the
// 120-240 ms fade. Dismisses itself after 8 s (the undo-toast contract); Undo and `U` / Ctrl+Z stay
// available as long as the undo stack has the step. Never an achievement, never a score.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDispatch, useStoreState } from '../../store/context';

export interface Notice {
  id: number;
  text: string;
  /** a note to read after the text (a warning that goes with an equip) */
  note?: string;
  tone: 'info' | 'warn';
  undo: boolean;
}

interface NoticeApi {
  notify(text: string, opts?: { note?: string; tone?: 'info' | 'warn'; undo?: boolean }): void;
  dismiss(): void;
}

const NoticeContext = createContext<NoticeApi | null>(null);
export const NOTICE_MS = 8000;

export function useNotify(): NoticeApi['notify'] {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error('NoticeProvider is missing');
  return ctx.notify;
}

const isTyping = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
};

export function NoticeProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const { past } = useStoreState();
  const [notice, setNotice] = useState<Notice | null>(null);
  const counter = useRef(0);

  const notify = useCallback<NoticeApi['notify']>((text, opts = {}) => {
    counter.current += 1;
    setNotice({ id: counter.current, text, note: opts.note, tone: opts.tone ?? 'info', undo: opts.undo ?? false });
  }, []);
  const dismiss = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice((n) => (n && n.id === notice.id ? null : n)), NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [notice]);

  const undo = useCallback(() => {
    dispatch({ type: 'history/undo' });
    setNotice({ id: ++counter.current, text: 'Undone.', tone: 'info', undo: false });
  }, [dispatch]);

  // `U` and Ctrl+Z (Cmd+Z) undo the last edit, anywhere but in a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.altKey) return;
      const ctrlZ = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
      const plainU = !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key.toLowerCase() === 'u';
      if (!ctrlZ && !plainU) return;
      if (past.length === 0) return;
      e.preventDefault();
      undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [past.length, undo]);

  const api = useMemo<NoticeApi>(() => ({ notify, dismiss }), [notify, dismiss]);
  return (
    <NoticeContext.Provider value={api}>
      {children}
      <div className="notice-region" role="status" aria-live="polite" data-testid="notice-region">
        {notice && (
          <div className="notice" data-tone={notice.tone} data-testid="notice" key={notice.id}>
            <p className="notice-text">
              {notice.text}
              {notice.note && <span className="notice-note"> {notice.note}</span>}
            </p>
            {notice.undo && past.length > 0 && (
              <button type="button" className="btn btn-quiet btn-sm" onClick={undo} data-testid="notice-undo">
                Undo
              </button>
            )}
            <button type="button" className="btn btn-quiet btn-sm" onClick={dismiss} aria-label="Dismiss this message" data-testid="notice-dismiss">
              Close
            </button>
          </div>
        )}
      </div>
    </NoticeContext.Provider>
  );
}
