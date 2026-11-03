// The Armory's other two tabs (06 section 4.4): Charts (the doctrines a ship may carry, with their
// avoid-lists) and Modules (plugins, tools and connectors with the status the registry gives them).
// Both are ship-level fittings: they write `ship.doctrine` / `ship.modules` on a ship you can edit.
import { useKb } from '../../kb/context';
import { useDispatch } from '../../store/context';
import type { Ship } from '../../domain/schema';
import { TruthLabel } from '../../components/TruthLabel';
import { useNotify } from '../shared/notices';

function NoShip() {
  return <p className="muted sheet-line">Choose a ship you can edit (clone SS Full Run first) to fit this to it. You can still read everything.</p>;
}

export function ChartsTab({ ship }: { ship?: Ship }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  return (
    <section className="stack" data-testid="charts-tab" aria-label="Charts: doctrines">
      <p className="muted sheet-line">A chart is a design doctrine the ship carries. One at a time; none is the default. <TruthLabel truth="Verified" detail="library/doctrines" /></p>
      {!ship && <NoShip />}
      <ul className="mod-list">
        {idx.kb.doctrines.map((d) => {
          const carried = ship?.doctrine === d.id;
          return (
            <li key={d.id} className="mod-card" data-testid="chart-card" data-doctrine={d.id} data-carried={carried || undefined}>
              <h3 className="card-title">{d.displayName}</h3>
              <p className="sheet-line">{d.summary}</p>
              {d.avoidList.length > 0 && (
                <details>
                  <summary className="label">Avoid list ({d.avoidList.length})</summary>
                  <ul className="plain-list">{d.avoidList.map((x) => <li key={x}>{x}</li>)}</ul>
                </details>
              )}
              <button
                type="button"
                className="btn btn-quiet"
                disabled={!ship}
                aria-pressed={carried}
                data-testid={`chart-${d.id}`}
                onClick={() => {
                  if (!ship) return;
                  dispatch({ type: 'ship/doctrine', shipId: ship.id, doctrine: carried ? null : d.id });
                  notify(carried ? `${ship.name} no longer carries ${d.displayName}.` : `${ship.name} carries ${d.displayName}.`, { undo: true });
                }}
              >
                {carried ? 'Carried: remove' : 'Carry this chart'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ModulesTab({ ship }: { ship?: Ship }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const groups = [
    { title: 'Plugins', items: idx.kb.plugins },
    { title: 'Tools and connectors', items: idx.kb.tools },
  ];
  return (
    <section className="stack" data-testid="modules-tab" aria-label="Modules">
      <p className="muted sheet-line">Modules are what a session may call on: plugins, tools, connectors. Status is the registry's. <TruthLabel truth="Verified" detail="library/registry" /></p>
      {!ship && <NoShip />}
      {groups.map((g) => (
        <div key={g.title} className="stack-sm">
          <h3 className="label">{g.title} <span className="num">{g.items.length}</span></h3>
          <ul className="mod-list">
            {g.items.map((m) => {
              const fitted = ship?.modules?.includes(m.id) ?? false;
              return (
                <li key={m.id} className="mod-card" data-testid="module-card" data-module={m.id} data-fitted={fitted || undefined}>
                  <h4 className="mod-name">{m.name}</h4>
                  <p className="muted sheet-line"><span className="mod-status">{m.status}</span>{m.kind ? ` · ${m.kind}` : ''}</p>
                  <p className="sheet-line">{m.description}</p>
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm"
                    disabled={!ship}
                    aria-pressed={fitted}
                    data-testid={`module-${m.id}`}
                    onClick={() => {
                      if (!ship) return;
                      dispatch({ type: 'ship/module', shipId: ship.id, module: m.id, on: !fitted });
                      notify(fitted ? `${m.name} removed from ${ship.name}.` : `${m.name} fitted to ${ship.name}.`, { undo: true });
                    }}
                  >
                    {fitted ? 'Fitted: remove' : 'Fit to the ship'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
