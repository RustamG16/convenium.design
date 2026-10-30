import type { ReactNode } from 'react';
import { TruthLabel } from '../../components/TruthLabel';
import { COMMISSIONS, type CommissionId } from '../../domain/commissions';

/** One small mark per commission, drawn in the card's art box. Granted marks are filled; the rest are outlines. */
const ART: Record<CommissionId, (on: boolean) => ReactNode> = {
  'first-ship': (on) => <path d="M6 44 L20 30 L58 28 L74 42 L58 56 L20 54 Z" fill={on ? 'currentColor' : 'none'} />,
  'first-recruit': (on) => (
    <>
      <circle cx="40" cy="26" r="10" fill={on ? 'currentColor' : 'none'} />
      <path d="M18 62c2-14 12-20 22-20s20 6 22 20z" fill={on ? 'currentColor' : 'none'} />
    </>
  ),
  'first-off-route': (on) => (
    <>
      <path d="M10 56C26 56 30 24 46 24s14 32 24 32" strokeDasharray="3 5" />
      <circle cx="46" cy="24" r="6" fill={on ? 'currentColor' : 'none'} />
    </>
  ),
  'first-clean': (on) => (
    <>
      <circle cx="40" cy="40" r="24" fill={on ? 'currentColor' : 'none'} opacity={on ? 0.9 : 1} />
      <path d="M28 41l8 8 16-18" stroke={on ? 'var(--bg)' : 'currentColor'} />
    </>
  ),
  'first-export': (on) => (
    <>
      <path d="M22 14h26l12 12v40H22z" fill={on ? 'currentColor' : 'none'} opacity={on ? 0.9 : 1} />
      <path d="M48 14v12h12" stroke={on ? 'var(--bg)' : 'currentColor'} />
    </>
  ),
  'first-verify': (on) => (
    <>
      <rect x="14" y="20" width="52" height="40" rx="4" fill={on ? 'currentColor' : 'none'} opacity={on ? 0.9 : 1} />
      <path d="M24 34l8 6-8 6M38 48h14" stroke={on ? 'var(--bg)' : 'currentColor'} />
    </>
  ),
  'first-run': (on) => (
    <>
      <path d="M14 58V22M14 58h52" />
      <rect x="22" y="38" width="10" height="20" fill={on ? 'currentColor' : 'none'} />
      <rect x="38" y="28" width="10" height="30" fill={on ? 'currentColor' : 'none'} />
      <rect x="54" y="44" width="10" height="14" fill={on ? 'currentColor' : 'none'} />
    </>
  ),
  'proven-hull': (on) => (
    <>
      <path d="M40 12l24 8v20c0 14-10 24-24 28-14-4-24-14-24-28V20z" fill={on ? 'currentColor' : 'none'} opacity={on ? 0.9 : 1} />
      <path d="M30 40l7 7 14-15" stroke={on ? 'var(--bg)' : 'currentColor'} />
    </>
  ),
};

/** The date a commission was granted, as written in the store (ISO), shown as a plain date. */
export const grantedOn = (iso: string): string => iso.slice(0, 10);

/**
 * Eight tall cards (the ArkhEthos rewards-rail anatomy): truth label, mark, title, the plain
 * condition, and the state. A state is either GRANTED with its date or "Not yet". There is no
 * order of merit, no count toward anything, and no card that is hidden until it is earned.
 */
export function CommissionsRail({ granted }: { granted: Readonly<Record<string, string>> }) {
  const got = COMMISSIONS.filter((c) => c.id in granted).length;
  return (
    <section className="lb-commissions" aria-labelledby="comm-h" data-testid="commissions">
      <div className="section-row">
        <h2 id="comm-h" className="section-head">
          Commissions
        </h2>
        <p className="stat" data-testid="commission-count">
          {got} of {COMMISSIONS.length} granted <TruthLabel truth="Verified" detail="from your logbook" />
        </p>
      </div>
      <p className="prose-sm lb-note">Each one marks a thing you did, and stays granted once it is. None of them unlocks anything.</p>
      <ul className="reward-rail" aria-label="Commissions" tabIndex={0}>
        {COMMISSIONS.map((c) => {
          const at = granted[c.id];
          const on = at !== undefined;
          return (
            <li key={c.id} className="reward-card" data-testid="commission-card" data-commission={c.id} data-granted={on}>
              <span className="reward-tag">
                <TruthLabel truth={c.truth} />
              </span>
              <svg className="reward-art" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ART[c.id](on)}
              </svg>
              <h3 className="reward-title">{c.title}</h3>
              <p className="reward-desc">{c.condition}</p>
              <p className={`reward-state${on ? ' is-granted' : ''}`} data-testid="commission-state">
                {on ? (
                  <>
                    Granted <time dateTime={at}>{grantedOn(at)}</time>
                  </>
                ) : (
                  'Not yet'
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
