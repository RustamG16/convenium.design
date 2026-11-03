// `#/armory` — the knowledge base as a cabinet of artifacts. The left column carries the filters and
// the equip target: which ship you can edit and which crew member wears what you pick, shown as the
// same anchor diagram the Bridge uses (so a drag from the grid lands on a socket here). A library
// ship is a template; with no custom ship the page offers to clone SS Full Run.
import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import '../../styles/ship.css';
import type { Anchor } from '../../domain/schema';
import { LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { useKb } from '../../kb/context';
import { useDispatch, useStoreState } from '../../store/context';
import { uniqueShipId } from '../../store/store';
import { AnchorDiagram } from '../bridge/LoadoutRack';
import { ArmoryView } from './ArmoryView';
import { useEquip, useEquipTarget } from './equip';

export default function ArmoryPage() {
  const idx = useKb();
  const { ships } = useStoreState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { requestEquip } = useEquip();
  const wantedShip = params.get('ship');
  const ship = ships.find((s) => s.id === wantedShip) ?? ships[0];
  const member = ship?.crew.find((m) => m.id === params.get('member')) ?? ship?.crew[0];
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH).ships.find((s) => s.id === idx.kb.workflows.default), [idx]);
  useEquipTarget(ship && member ? { shipId: ship.id, memberId: member.id } : null);
  const pick = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    setParams(next, { replace: true });
  };
  const cloneDefault = () => {
    if (!library) return;
    const name = `${library.name} copy`;
    const id = uniqueShipId([...ships.map((s) => s.id), ...idx.kb.workflows.ships.map((w) => w.id)], name);
    dispatch({ type: 'ship/clone', source: library, name });
    pick({ ship: id, member: library.crew[0].id });
  };
  const anchor = (params.get('anchor') as Anchor | null) ?? undefined;
  return (
    <main id="main" className="page armory-page" data-testid="armory-page">
      <header className="armory-page-head">
        <p className="label">Armory</p>
        <h1 className="page-title">Every skill, as a thing you can wear</h1>
        <p className="lede">Drag an artifact onto a socket, press <kbd>E</kbd> on it, or hold it for a third of a second on a phone.</p>
      </header>
      <ArmoryView
        variant="page"
        ship={ship}
        member={member}
        initialSkill={params.get('skill')}
        targetPanel={
        <section className="armory-target stack" aria-label="Equip target" data-testid="armory-target">
          <h2 className="ship-rack-title">Equip to</h2>
          {ship && member ? (
            <>
              <label className="field-row">
                <span className="label">Ship</span>
                <select className="field" value={ship.id} onChange={(e) => pick({ ship: e.target.value, member: ships.find((s) => s.id === e.target.value)!.crew[0].id })} data-testid="target-ship">
                  {ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field-row">
                <span className="label">Crew member</span>
                <select className="field" value={member.id} onChange={(e) => pick({ member: e.target.value })} data-testid="target-member">
                  {ship.crew.map((m) => <option key={m.id} value={m.id}>{m.character.name} ({m.agent})</option>)}
                </select>
              </label>
              <AnchorDiagram
                idx={idx}
                ship={ship}
                member={member}
                active={null}
                readOnly={false}
                onEmpty={(a) => {
                  const picked = document.querySelector<HTMLElement>('[data-testid="art-detail"]')?.dataset.skill;
                  if (picked) requestEquip({ shipId: ship.id, memberId: member.id, skill: picked, anchor: a });
                  else pick({ anchor: a });
                }}
              />
              {anchor && <p className="muted sheet-line">Socket chosen: {idx.kb.anchors[anchor].label}. Open an artifact and press Equip.</p>}
              <Link className="btn btn-quiet" to={`/ship/${ship.id}/bridge?member=${member.id}`}>Open on the bridge</Link>
            </>
          ) : (
            <div className="stack" data-testid="armory-no-ship">
              <p className="prose-sm">No ship of yours to equip yet. A library ship is a template you read, not edit.</p>
              <button type="button" className="btn btn-primary" onClick={cloneDefault} data-testid="armory-clone">Clone {library?.name ?? 'SS Full Run'} to start</button>
              <button type="button" className="btn btn-quiet" onClick={() => navigate('/')}>Back to the hangar</button>
            </div>
          )}
        </section>
        }
      />
    </main>
  );
}
