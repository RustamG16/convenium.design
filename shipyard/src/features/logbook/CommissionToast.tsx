import { useState } from 'react';
import { Link } from 'react-router';
import { commissionById, newlyGranted, shouldAnnounce } from '../../domain/commissions';
import { MOTION, usePresence } from '../../lib/motion';
import { useStoreState } from '../../store/context';

/**
 * A grant is announced once, when it happens in front of the owner (a polite status line, no sound,
 * it enters and leaves in 240 ms, and it stays until dismissed). A commission that was already in the store when
 * the page loaded, or that lands while the tab is hidden, is not announced; it is on the rail next visit.
 */
export function CommissionToast() {
  const { commissions } = useStoreState();
  const [seen, setSeen] = useState(commissions);
  const [shown, setShown] = useState<string[]>([]);

  if (seen !== commissions) {
    setSeen(commissions);
    const fresh = newlyGranted(seen, commissions);
    if (fresh.length > 0 && shouldAnnounce(!document.hidden)) setShown((s) => [...s, ...fresh]);
  }

  const { value: lines, leaving } = usePresence(shown.length > 0 ? shown : null, MOTION.panel);
  return (
    <div className="toast-region" role="status" aria-live="polite" data-testid="commission-toast-region">
      {lines && (
        <div className="toast" data-leaving={leaving || undefined} data-testid="commission-toast">
          <p className="label">Commission granted</p>
          {lines.map((id) => (
            <p key={id} className="toast-line">
              <strong>{commissionById(id)?.title ?? id}</strong> · {commissionById(id)?.condition}
            </p>
          ))}
          <div className="toast-actions">
            <Link className="btn btn-quiet" to="/logbook" onClick={() => setShown([])}>
              Open the logbook
            </Link>
            <button type="button" className="btn btn-quiet" onClick={() => setShown([])} data-testid="toast-dismiss">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
