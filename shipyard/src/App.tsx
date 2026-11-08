import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { CommissionToast } from './features/logbook/CommissionToast';
import { EquipProvider } from './features/armory/equip';
import { LibraryBanner } from './features/shared/LibraryBanner';
import { NoticeProvider } from './features/shared/notices';
import { KbGate } from './kb/context';
import { usePersistBanner } from './store/context';

const BANNER_TEXT = {
  malformed: 'Saved ships could not be read, so Shipyard started fresh. Your old data was left untouched in this browser.',
  unavailable: 'Browser storage is unavailable: ships last for this session only. Export a ship to keep it.',
  'newer-version': 'Saved ships were written by a newer Shipyard. Started fresh; nothing was overwritten yet.',
} as const;

export function App() {
  const banner = usePersistBanner();
  // WCAG 2.4.11: a sheet's focus trap moves focus with preventScroll, which can leave the focused control below the fold. Bring it back clear of the sticky bars.
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !el.closest?.('[role="dialog"]')) return;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'nearest' });
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);
  return (
    <NoticeProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <NavLink className="brand" to="/" end>
          Shipyard
        </NavLink>
        <nav aria-label="Primary">
          <NavLink to="/" end>
            Hangar
          </NavLink>
          <NavLink to="/armory">Armory</NavLink>
          <NavLink to="/logbook">Logbook</NavLink>
        </nav>
      </header>
      <LibraryBanner />
      {banner && (
        <p className="banner" role="status" data-testid="persist-banner">
          {BANNER_TEXT[banner]}
        </p>
      )}
      <KbGate>
        <EquipProvider>
          <Outlet />
        </EquipProvider>
      </KbGate>
      <CommissionToast />
    </NoticeProvider>
  );
}
