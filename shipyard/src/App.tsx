import { NavLink, Outlet } from 'react-router';
import { CommissionToast } from './features/logbook/CommissionToast';
import { EquipProvider } from './features/armory/equip';
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
