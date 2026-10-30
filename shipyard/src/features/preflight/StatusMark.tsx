import type { Check, CheckStatus } from '../../domain/preflight';

/** The word for a check status. `info` is a pass that carries a note (an off-route artifact, say). */
export const STATUS_WORD: Record<CheckStatus, string> = {
  pass: 'Pass',
  info: 'Pass · note',
  warn: 'Warn',
  block: 'Block',
  na: 'n.a.',
};

/** A status as a shape AND a word; colour never carries it alone (DESIGN.md token block). */
export function StatusMark({ status, withWord = true }: { status: CheckStatus; withWord?: boolean }) {
  return (
    <span className="pf-status" data-status={status}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {status === 'pass' || status === 'info' ? (
          <>
            <circle cx="8" cy="8" r="6.4" />
            <path d="M5 8.2l2 2 4-4.4" />
          </>
        ) : status === 'warn' ? (
          <>
            <path d="M8 2l6.4 11.4H1.6z" />
            <path d="M8 6.6v3.2M8 11.6v.1" />
          </>
        ) : status === 'block' ? (
          <>
            <rect x="2" y="2" width="12" height="12" rx="1.5" />
            <path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" />
          </>
        ) : (
          <>
            <circle cx="8" cy="8" r="6.4" strokeDasharray="1.5 2.5" />
            <path d="M5.4 8h5.2" />
          </>
        )}
      </svg>
      {withWord && <span>{STATUS_WORD[status]}</span>}
    </span>
  );
}

/** The worst status in a set of checks, for one hull panel. */
export function groupStatus(checks: Check[]): CheckStatus {
  const live = checks.filter((c) => c.status !== 'na');
  if (live.length === 0) return 'na';
  if (live.some((c) => c.status === 'block')) return 'block';
  if (live.some((c) => c.status === 'warn')) return 'warn';
  return live.every((c) => c.status === 'pass' || c.status === 'info') ? 'pass' : 'warn';
}
