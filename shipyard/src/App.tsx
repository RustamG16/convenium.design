import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
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
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  // a fade only at an end that has more to scroll, so the first and last tabs are never dimmed (re-review v2, n-g)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const mark = () => {
      const more = nav.scrollWidth - nav.clientWidth;
      nav.toggleAttribute('data-more-start', nav.scrollLeft > 1);
      nav.toggleAttribute('data-more-end', more - nav.scrollLeft > 1);
    };
    mark();
    nav.addEventListener('scroll', mark, { passive: true });
    window.addEventListener('resize', mark);
    return () => {
      nav.removeEventListener('scroll', mark);
      window.removeEventListener('resize', mark);
    };
  }, []);
  // at phone widths the nav scrolls inside the header: keep the current section in view
  useEffect(() => {
    document.querySelector('.site-header nav a[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    navRef.current?.dispatchEvent(new Event('scroll'));
  }, [pathname]);
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
        <NavLink className="brand" to="/" end aria-label="Convenium Shipyard, the hangar">
          <svg className="brand-mark" viewBox="0 0 52 28" aria-hidden="true" focusable="false">
            <path d="M14 0h10L10 28H0z" fill="#ff3b3f" />
            <path d="M30 0h10L26 28H16z" fill="#d7262b" />
            <path d="M44 4h8l-12 24h-8z" fill="#a5151a" />
          </svg>
          <span className="brand-words" aria-hidden="true">
            <small>Convenium</small>
            <strong>Shipyard</strong>
          </span>
        </NavLink>
        <nav aria-label="Primary" ref={navRef} data-testid="primary-nav">
          <NavLink to="/" end>
            Hangar
          </NavLink>
          <NavLink to="/armory">Armory</NavLink>
          <NavLink to="/regatta">Regatta</NavLink>
          <NavLink to="/logbook">Logbook</NavLink>
          {/* the Forge writes library/, so only the dev server lists it; the route still explains itself elsewhere */}
          {import.meta.env.DEV && <NavLink to="/forge">Forge</NavLink>}
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
