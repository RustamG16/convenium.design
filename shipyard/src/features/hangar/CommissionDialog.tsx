// Commission a ship (06 section 4.1): Blank, Clone from any of the four library workflows or one of
// your own ships, or Import a ship.json. The other library workflows live only here, as templates.
// Nothing here writes to library/: a clone is a custom copy, an import is validated with the ship
// schema and refused with its list of problems.
import * as Dialog from '@radix-ui/react-dialog';
import { isDerivedWorkflow } from '../../domain/conversion';
import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { useKb } from '../../kb/context';
import { parseShipFile } from '../../store/files';
import { useDispatch, useStoreState } from '../../store/context';
import { uniqueShipId } from '../../store/store';
import { useNotify } from '../shared/notices';

type Mode = 'blank' | 'clone' | 'import';
const MAX_IMPORT_BYTES = 1_000_000;

export function CommissionDialog({ onClose, initialMode = 'clone', initialSource }: { onClose: () => void; initialMode?: Mode; initialSource?: string }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const { ships } = useStoreState();
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH), [idx]);
  const sources = useMemo(() => [...library.ships, ...ships], [library, ships]);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [source, setSource] = useState(initialSource ?? idx.kb.workflows.default);
  const [name, setName] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [text, setText] = useState('');
  const nameId = useId();
  const taken = [...ships.map((s) => s.id), ...idx.kb.workflows.ships.map((w) => w.id)];
  const src = sources.find((s) => s.id === source);
  const finalName = name.trim() || (mode === 'blank' ? 'New ship' : `${src?.name ?? 'Ship'} copy`);

  const done = (id: string, label: string) => {
    notify(`${label} commissioned.`, { undo: true });
    onClose();
    navigate(`/ship/${id}/bridge`);
  };
  const commission = () => {
    if (mode === 'blank') {
      const id = uniqueShipId(taken, finalName);
      dispatch({ type: 'ship/create', name: finalName });
      return done(id, finalName);
    }
    if (mode === 'clone') {
      if (!src) return;
      const id = uniqueShipId(taken, finalName);
      dispatch({ type: 'ship/clone', source: src, name: finalName });
      return done(id, finalName);
    }
    if (text.length > MAX_IMPORT_BYTES) return setProblems([`(file): larger than ${MAX_IMPORT_BYTES / 1000} KB`]);
    const parsed = parseShipFile(text);
    if (!parsed.ok) return setProblems(parsed.issues);
    const id = uniqueShipId(taken, parsed.ship.id);
    dispatch({ type: 'ship/import', ship: { ...parsed.ship, ...(name.trim() ? { name: name.trim().slice(0, 48) } : {}) } });
    return done(id, name.trim() || parsed.ship.name);
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog dialog-tall" data-testid="commission-dialog" aria-describedby={undefined}>
          <Dialog.Title className="card-title">Commission a ship</Dialog.Title>
          <p className="muted sheet-line">A new ship is a copy you own. Library ships stay as they are.</p>
          <fieldset className="menu-group">
            <legend className="label">Start from</legend>
            <div className="choice-row">
              {(['blank', 'clone', 'import'] as const).map((m) => (
                <label key={m} className="choice">
                  <input type="radio" name="commission-mode" checked={mode === m} onChange={() => { setMode(m); setProblems([]); }} data-testid={`mode-${m}`} />
                  <span>{m === 'blank' ? 'Blank' : m === 'clone' ? 'Clone from...' : 'Import ship.json'}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {mode === 'clone' && (
            <label className="field-row">
              <span className="label">Clone</span>
              <select className="field" value={source} onChange={(e) => setSource(e.target.value)} data-testid="clone-source">
                <optgroup label="Library workflows (templates)">
                  {library.ships.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.class}{isDerivedWorkflow(s.origin?.workflow) ? ' · derived voyage' : ''}</option>)}
                </optgroup>
                {ships.length > 0 && (
                  <optgroup label="Your ships">
                    {ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                )}
              </select>
              {src?.summary && <span className="muted sheet-line">{src.summary}</span>}
            </label>
          )}
          {mode === 'blank' && <p className="prose-sm">The captain and one run-plan stage: enough for pre-flight to start. Recruit and plan from there.</p>}
          {mode === 'import' && (
            <div className="field-row">
              <label className="field-row">
                <span className="label">ship.json file</span>
                <input className="field" type="file" accept=".json,application/json" data-testid="import-ship-file" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > MAX_IMPORT_BYTES) return setProblems([`(file): larger than ${MAX_IMPORT_BYTES / 1000} KB`]);
                  setText(await f.text());
                  setProblems([]);
                }} />
              </label>
              <label className="field-row">
                <span className="label">or paste its text</span>
                <textarea className="field" rows={5} value={text} onChange={(e) => { setText(e.target.value); setProblems([]); }} data-testid="import-ship-text" />
              </label>
            </div>
          )}
          <label className="field-row" htmlFor={nameId}>
            <span className="label">Name</span>
            <input id={nameId} className="field" maxLength={48} value={name} onChange={(e) => setName(e.target.value)} placeholder={finalName} data-testid="commission-name" />
          </label>
          {problems.length > 0 && (
            <div role="alert" className="import-problems" data-testid="import-problems">
              <p className="label">This file is not a ship Shipyard can open:</p>
              <ul className="plain-list">{problems.slice(0, 12).map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={commission} disabled={mode === 'import' && !text.trim()} data-testid="commission-confirm">Commission</button>
            <Dialog.Close className="btn btn-quiet">Cancel</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
