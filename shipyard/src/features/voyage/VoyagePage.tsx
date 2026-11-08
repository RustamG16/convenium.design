// `#/ship/:id/voyage?stage=` — the voyage planner (06 section 4.5): a navigator's chart. Stages are
// cards on a track, gates are buoys between them. Add, reorder (drag a handle, or Alt+Left/Right on a
// focused card, or the Earlier/Later buttons), duplicate, delete with undo, templates from the library
// workflows, and the selected stage's run-plan row live. Pre-flight's Fix links land here with
// `?stage=<id>`. A library ship is a read-only template ("Clone to edit").
import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import '../../styles/voyage.css';
import { isGate, isStage, type VoyageItem } from '../../domain/schema';
import { isLibraryShip, LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { newGate, newStage } from '../../domain/voyage';
import { useKb } from '../../kb/context';
import { useMinWidth } from '../../lib/preferences';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { isFamilyId } from '../../scene/artifacts/familyIds';
import { useDispatch, useStoreState } from '../../store/context';
import { useNotify } from '../shared/notices';
import { ShipNav, TemplateLine, useCloneToEdit } from '../shared/ShipNav';
import { useShip } from '../shared/useShip';
import { StageInspector } from './StageInspector';

const PHASE_COLOR: Record<string, string> = { always: '#A8A29A', diagnose: '#93AEDB', direct: '#D9A441', prepare: '#C79FDC', build: '#E39B95', verify: '#86C2A8' };

export default function VoyagePage() {
  const { id = '' } = useParams();
  const ship = useShip(id);
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const { ships: stored } = useStoreState();
  const [params, setParams] = useSearchParams();
  const wide = useMinWidth(1200);
  const [templateId, setTemplateId] = useState('ss-abridged');
  const [dragging, setDragging] = useState<{ from: number; over: number } | null>(null);
  const pendingFocus = useRef<number | null>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH).ships, [idx]);
  const readOnly = ship ? isLibraryShip(ship) && !stored.some((s) => s.id === ship.id) : true;

  const stageParam = params.get('stage');
  const selected = ship ? ship.voyage.findIndex((v) => isStage(v) && v.id === stageParam) : -1;
  const [gateSel, setGateSel] = useState<number | null>(null);
  const sel = selected >= 0 ? selected : gateSel;
  // Any edit gesture on a template opens the one-step dialog, then lands in the clone on this screen with this stage selected.
  const clone = useCloneToEdit(ship, (newId) => `/ship/${newId}/voyage${stageParam ? `?stage=${encodeURIComponent(stageParam)}` : ''}`);

  const select = useCallback(
    (index: number | null) => {
      if (!ship) return;
      const item = index === null ? undefined : ship.voyage[index];
      const next = new URLSearchParams(params);
      if (item && isStage(item)) {
        next.set('stage', item.id);
        setGateSel(null);
      } else {
        next.delete('stage');
        setGateSel(index);
      }
      setParams(next, { replace: true });
    },
    [ship, params, setParams],
  );

  // Restore focus to a moved card, and bring a linked stage into view.
  useEffect(() => {
    if (pendingFocus.current === null) return;
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-index="${pendingFocus.current}"] [data-card]`);
    pendingFocus.current = null;
    el?.focus();
  }, [ship]);
  useEffect(() => {
    if (selected < 0) return;
    trackRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected]);

  if (!ship) {
    return (
      <main id="main" className="page" data-testid="no-ship">
        <h1 className="page-title">No such ship</h1>
        <Link className="btn btn-quiet" to="/">Back to the hangar</Link>
      </main>
    );
  }

  const move = (from: number, to: number) => {
    if (readOnly || to < 0 || to >= ship.voyage.length || from === to) return;
    dispatch({ type: 'voyage/move', shipId: ship.id, from, to });
    pendingFocus.current = to;
  };
  const label = (v: VoyageItem) => (isStage(v) ? v.label : `Gate ${v.gate}`);
  const remove = (i: number) => {
    const v = ship.voyage[i];
    if (isStage(v) && ship.voyage.filter(isStage).length <= 1) return notify('A voyage keeps at least one stage.', { tone: 'warn' });
    dispatch({ type: 'voyage/delete', shipId: ship.id, index: i });
    notify(`${label(v)} deleted.`, { undo: true });
  };
  const addStage = () => {
    const at = sel !== null ? sel + 1 : ship.voyage.length;
    const owner = (sel !== null && (ship.voyage[sel] as { member?: string })?.member) || ship.crew[0].id;
    const st = newStage(ship, owner);
    dispatch({ type: 'voyage/add', shipId: ship.id, item: st, at });
    const next = new URLSearchParams(params);
    next.set('stage', st.id);
    setParams(next, { replace: true });
    notify('Stage added.', { undo: true });
  };
  const addGate = () => {
    const at = sel !== null ? sel + 1 : ship.voyage.length;
    dispatch({ type: 'voyage/add', shipId: ship.id, item: newGate(ship), at });
    setGateSel(at);
    notify('Gate added.', { undo: true });
  };

  // Drag a handle: the item nearest the pointer is the drop target; release moves the card there.
  const startDrag = (e: React.PointerEvent, from: number) => {
    if (readOnly || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    let over = from;
    setDragging({ from, over });
    const find = (x: number, y: number): number => {
      let best = from;
      let bd = Infinity;
      trackRef.current?.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
        if (d < bd) {
          bd = d;
          best = Number(el.dataset.index);
        }
      });
      return best;
    };
    const mv = (ev: PointerEvent) => {
      over = find(ev.clientX, ev.clientY);
      setDragging({ from, over });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      setDragging(null);
      if (over !== from) move(from, over);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // Nothing picked: no inspector and no empty 360 px box. The track takes the full width (as the Armory does) until a stage or a gate is picked.
  const inspector = sel !== null ? <StageInspector ship={ship} index={sel} onGuard={readOnly ? clone.ask : undefined} /> : null;
  const stageNo = (i: number) => ship.voyage.slice(0, i + 1).filter(isStage).length;

  return (
    <main id="main" className="page voyage-page" data-testid="voyage-page" data-ship={ship.id} data-readonly={readOnly || undefined}>
      <header className="ship-head">
        <p className="label">{ship.name} · voyage</p>
        <h1 className="page-title ship-page-title">Voyage planner</h1>
        <p className="muted sheet-line">{ship.voyage.filter(isStage).length} stages · {ship.voyage.filter(isGate).length} gates · trail {ship.trail ?? 'abridged'}</p>
      </header>
      <ShipNav ship={ship} current="voyage" />
      {readOnly && <TemplateLine ship={ship} onClone={clone.ask} />}
      {readOnly && (
        <div className="voyage-tools row" role="toolbar" aria-label="Voyage tools">
          <button type="button" className="btn btn-quiet" onClick={clone.ask} data-testid="add-stage">Add stage</button>
        </div>
      )}
      {!readOnly && (
        <div className="voyage-tools row" role="toolbar" aria-label="Voyage tools">
          <button type="button" className="btn btn-primary" onClick={addStage} data-testid="add-stage">Add stage</button>
          <button type="button" className="btn btn-quiet" onClick={addGate} data-testid="add-gate">Add gate</button>
          <span className="voyage-template">
            <label className="sr-only" htmlFor="tpl">Template</label>
            <select id="tpl" className="field" value={templateId} onChange={(e) => setTemplateId(e.target.value)} data-testid="template-select">
              {library.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" className="btn btn-quiet" data-testid="template-append" onClick={() => { dispatch({ type: 'voyage/applyTemplate', shipId: ship.id, workflow: templateId, mode: 'append' }); notify('Template stages added at the end.', { undo: true }); }}>Add its stages</button>
            <button type="button" className="btn btn-quiet" data-testid="template-replace" onClick={() => { dispatch({ type: 'voyage/applyTemplate', shipId: ship.id, workflow: templateId, mode: 'replace' }); notify('Voyage replaced by the template.', { undo: true }); }}>Replace the voyage</button>
          </span>
          {(ship.origin?.workflow || ship.origin?.kind === 'blank') && (
            <button type="button" className="btn btn-quiet" data-testid="reset-ship" onClick={() => { dispatch({ type: 'ship/restoreDefault', id: ship.id }); notify(`${ship.name} reset to its template.`, { undo: true }); }}>Reset ship</button>
          )}
        </div>
      )}
      <div className="voyage-layout" data-wide={(wide && inspector) || undefined}>
        <ol className="voyage-track" ref={trackRef} aria-label="Voyage, stages and gates in order" data-testid="voyage-track">
          {ship.voyage.map((item, i) => {
            const isSel = sel === i;
            const over = dragging?.over === i && dragging.from !== i;
            const common = { 'data-index': i, 'data-testid': isStage(item) ? 'stage-item' : 'gate-item', 'data-over': over || undefined, 'data-dragging': dragging?.from === i || undefined } as const;
            if (isGate(item)) {
              return (
                <li key={`g${i}`} className="voyage-item voyage-gate" {...common}>
                  <div
                    className="gate-card"
                    data-card
                    data-selected={isSel || undefined}
                    tabIndex={0}
                    role="group"
                    aria-label={`Gate ${item.gate}: ${item.label}. Alt plus arrow keys move it.`}
                    onClick={() => select(i)}
                    onKeyDown={(e) => {
                      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); move(i, i - 1); }
                      else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); move(i, i + 1); }
                      else if (e.key === 'Enter') select(i);
                      else if (e.key === 'Delete' && !readOnly) remove(i);
                    }}
                  >
                    <span className="buoy" aria-hidden="true">{item.gate}</span>
                    <span className="gate-name">Gate {item.gate}</span>
                    <span className="gate-label">{item.label}</span>
                  </div>
                  {!readOnly && <ItemActions label={`Gate ${item.gate}`} i={i} n={ship.voyage.length} move={move} remove={remove} startDrag={startDrag} />}
                </li>
              );
            }
            const member = ship.crew.find((m) => m.id === item.member);
            const skill = item.activeSkill ? idx.skill.get(item.activeSkill) : undefined;
            return (
              <li key={item.id} className="voyage-item voyage-stage" {...common}>
                <div
                  className="stage-card"
                  data-card
                  data-selected={isSel || undefined}
                  data-stage={item.id}
                  tabIndex={0}
                  role="group"
                  style={{ ['--phase' as string]: PHASE_COLOR[item.phase] ?? 'var(--muted)', ['--c' as string]: member?.character.pigment ?? 'var(--muted)' } as CSSProperties}
                  aria-label={`Stage ${stageNo(i)} of ${ship.voyage.filter(isStage).length}: ${item.label}. ${member ? member.character.name : `${item.member}, not aboard`}. ${skill ? `Opens ${skill.artifact.name}.` : 'Opens no skill.'} Alt plus arrow keys move it.`}
                  onClick={() => select(i)}
                  onKeyDown={(e) => {
                    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); move(i, i - 1); }
                    else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); move(i, i + 1); }
                    else if (e.key === 'Enter') select(i);
                    else if (e.key === 'Delete' && !readOnly) remove(i);
                  }}
                >
                  <span className="stage-phase">{item.phase}{item.parallel ? ' · parallel' : ''}{item.wave !== undefined ? ` · wave ${item.wave}` : ''}</span>
                  <span className="stage-title">{stageNo(i)}. {item.label}</span>
                  <span className="stage-crew"><span className="dot" style={{ background: member?.character.pigment ?? 'var(--muted)' }} aria-hidden="true" />{member ? member.character.name : `${item.member} (not aboard)`}</span>
                  <span className="stage-art" data-testid="stage-art">
                    {skill && isFamilyId(skill.artifact.family) ? <FamilyGlyph family={skill.artifact.family} pigment={skill.artifact.pigment} /> : <span className="glyph" />}
                    <span>{skill ? skill.artifact.name : item.activeSkill ? `${item.activeSkill} (retired)` : 'No artifact'}</span>
                  </span>
                  <span className="stage-out">{item.outputs[0]}{item.outputs.length > 1 ? ` +${item.outputs.length - 1}` : ''}</span>
                  <span className="stage-stop">Stops when: {item.stop}</span>
                </div>
                {!readOnly && <ItemActions label={item.label} i={i} n={ship.voyage.length} move={move} remove={remove} startDrag={startDrag} duplicate={() => { dispatch({ type: 'voyage/duplicate', shipId: ship.id, index: i }); notify('Stage duplicated.', { undo: true }); }} />}
              </li>
            );
          })}
        </ol>
        {wide ? (
          inspector && <aside className="voyage-inspector" aria-label="Stage inspector">{inspector}</aside>
        ) : (
          sel !== null && (
            <Dialog.Root open onOpenChange={(o) => !o && select(null)}>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="dialog dialog-sheet" data-testid="inspector-sheet" aria-describedby={undefined}>
                  <Dialog.Title className="sr-only">Stage inspector</Dialog.Title>
                  {inspector}
                  <Dialog.Close className="btn btn-quiet" data-testid="inspector-close">Done</Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )
        )}
      </div>
      {clone.dialog}
    </main>
  );
}

function ItemActions({ label, i, n, move, remove, startDrag, duplicate }: { label: string; i: number; n: number; move: (a: number, b: number) => void; remove: (i: number) => void; startDrag: (e: React.PointerEvent, from: number) => void; duplicate?: () => void }) {
  return (
    <div className="item-actions" role="group" aria-label={`Actions for ${label}`}>
      <button type="button" className="item-btn" onPointerDown={(e) => startDrag(e, i)} aria-label={`Drag ${label} to reorder`} data-testid="drag-handle" style={{ touchAction: 'none' }}>⠿</button>
      <button type="button" className="item-btn" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move ${label} earlier`} data-testid="move-earlier">←</button>
      <button type="button" className="item-btn" disabled={i === n - 1} onClick={() => move(i, i + 1)} aria-label={`Move ${label} later`} data-testid="move-later">→</button>
      {duplicate && <button type="button" className="item-btn" onClick={duplicate} aria-label={`Duplicate ${label}`} data-testid="duplicate">⧉</button>}
      <button type="button" className="item-btn" onClick={() => remove(i)} aria-label={`Delete ${label}`} data-testid="delete-item">✕</button>
    </div>
  );
}
