// `#/ship/:id/bridge?member=` — the crew profile (06 section 4.3): the screen the owner lives in.
// Laid out like the ArkhEthos crew profile: page title and actions on top; on the left a real 3D
// turntable of the member wearing their artifacts and the crew rail; the identity card in the
// centre; the artifacts column on the right; the ecosystem map below.
//
// Ported from `ShipPage.tsx`'s profile branch. T4 is read-only: editing (T6) goes through the seams
// left in `IdentityCard`, `LoadoutRack` and `CrewRail`. The progression chrome, Business/Venture chrome, the app
// nav and login stay behind. Without WebGL (or with `?2d`, or after a lost context) the left card is
// the design sheet and the artifacts column carries the glyphs; the boarding walk is skipped.
import { lazy, Suspense, useCallback, useMemo, useState, type CSSProperties } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import '../../styles/ship.css';
import { TruthLabel } from '../../components/TruthLabel';
import { useKb } from '../../kb/context';
import { skillCount } from '../../kb/artifacts';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { withBase } from '../../lib/baseUrl';
import { layoutFor } from '../../scene/stations';
import { sceneCrew, type SceneMember } from '../../scene/crew';
import { useStoreState } from '../../store/context';
import { useShip } from '../shared/useShip';
import { LoadoutRack } from './LoadoutRack';
import { CrewRail, IdentityCard } from './ShipCards';

const Turntable = lazy(() => import('../../scene/Turntable').then((m) => ({ default: m.Turntable })));
const EcosystemMap = lazy(() => import('./EcosystemMap'));

export default function BridgePage() {
  const { id = '' } = useParams();
  const ship = useShip(id);
  const idx = useKb();
  const { codex } = useStoreState();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [sceneFailed, setSceneFailed] = useState(false);

  const crew = useMemo(() => (ship ? sceneCrew(idx, ship) : []), [idx, ship]);
  const welcome = useMemo(() => (ship ? layoutFor(ship.crew).welcome : null), [ship]);

  const select = useCallback(
    (memberId: string) => {
      const next = new URLSearchParams(params);
      next.set('member', memberId);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  if (!ship) {
    return (
      <main id="main" className="page ship-page" data-testid="no-ship">
        <h1 className="page-title">No such ship</h1>
        <p className="prose">There is no ship called {id} in this hangar.</p>
        <Link className="btn btn-quiet" to="/">
          Back to the hangar
        </Link>
      </main>
    );
  }

  const wanted = params.get('member');
  const member = crew.find((m) => m.id === wanted) ?? crew.find((m) => m.id === welcome) ?? crew[0];
  if (!member) return <Navigate to="/" replace />;
  const raw = ship.crew.find((m) => m.id === member.id)!;

  const webgl = hasWebGL() && !force2d() && !sceneFailed;

  return (
    <main id="main" className="page ship-page" data-testid="crew-profile" data-ship={ship.id} data-webgl={webgl || undefined}>
      <header className="ship-head row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--s3)', flexWrap: 'wrap' }}>
        <div>
          <p className="label">{ship.name} · crew</p>
          <h1 className="page-title ship-page-title">{member.name}</h1>
        </div>
        <div className="row" style={{ gap: 'var(--s2)', flexWrap: 'wrap' }}>
          {webgl && (
            <button type="button" className="btn btn-quiet" data-testid="replay-walk" onClick={() => navigate(`/ship/${ship.id}/board`)}>
              Replay the walk
            </button>
          )}
          <Link className="btn btn-quiet" to="/" data-testid="back-to-hangar">
            Back to the hangar
          </Link>
        </div>
      </header>
      <div className="ship-profile">
        <aside className="ship-profile-rail stack">
          {webgl ? (
            <Suspense fallback={<Portrait member={member} />}>
              <Turntable member={member} reduced={reduced} onContextLost={() => setSceneFailed(true)} />
            </Suspense>
          ) : (
            <Portrait member={member} />
          )}
          <CrewRail crew={crew} activeId={member.id} onSelect={select} />
          <p className="muted sheet-line" data-testid="codex-line">
            Codex <span className="num">{codex.length}</span> of <span className="num">{skillCount(idx.kb)}</span> skills inspected <TruthLabel truth="Simulated" />
          </p>
        </aside>
        <div className="ship-profile-main stack">
          <IdentityCard member={member} evidence={`KB ${idx.kb.sourceHash.slice(0, 8)}`} />
        </div>
        <LoadoutRack idx={idx} ship={ship} member={raw} active={member.active} />
      </div>
      <Suspense fallback={null}>
        <EcosystemMap ship={ship} crew={crew} activeId={member.id} onSelect={select} />
      </Suspense>
    </main>
  );
}

/** The design sheet instead of the turntable when WebGL is unavailable, `?2d` is set or the scene failed. */
function Portrait({ member }: { member: SceneMember }) {
  const sheet = member.model.sheet;
  return (
    <figure className="ship-turntable ship-portrait" data-testid="portrait" style={{ ['--c' as string]: member.pigment } as CSSProperties}>
      {sheet ? (
        <img src={withBase(`/media/${sheet}-640.webp`)} srcSet={`${withBase(`/media/${sheet}-640.webp`)} 640w, ${withBase(`/media/${sheet}-1280.webp`)} 1280w`} sizes="320px" alt={`${member.name}: ${member.species}`} loading="eager" />
      ) : (
        <span className="ship-portrait-glyph" role="img" aria-label={`${member.name}, no design sheet`}>
          {member.glyph || member.name.slice(0, 1)}
        </span>
      )}
    </figure>
  );
}
