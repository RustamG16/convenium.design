// The one place an artifact gets equipped from: drag (mouse, pen), long-press (touch, 300 ms) and the
// keyboard `E` menu all end in `requestEquip`, which runs the domain rules, dispatches, and says what
// happened (with the warnings of 06 section 5.1 as notes, never locks). The drag layer owns the ghost
// that follows the pointer 1:1 and finds the drop target under it: a socket, the 3D body (nearest
// free anchor through a registered probe) or the hold.
import * as Dialog from '@radix-ui/react-dialog';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { equip, freeIndex, isWorn } from '../../domain/loadout';
import { ANCHOR_IDS, type Anchor, type Member, type Ship } from '../../domain/schema';
import { isLibraryShip, LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { useKb } from '../../kb/context';
import { useDispatch, useStoreState } from '../../store/context';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { isFamilyId } from '../../scene/artifacts/families';
import { isReducedMotion, MOTION, noteDrop, recordMotion, EASE_CSS } from '../../lib/motion';
import { useNotify } from '../shared/notices';

export interface EquipTarget {
  shipId: string;
  memberId: string;
}
export interface Hover {
  shipId: string;
  memberId: string;
  anchor: Anchor | 'hold';
  via: 'socket' | 'body' | 'hold';
  /** which socket of the anchor, when the pointer is on one */
  index?: number;
}
/** The reason a drop was refused, shown under the socket it was dropped on. */
export interface Invalid {
  memberId: string;
  anchor: Anchor | 'hold';
  index?: number;
  reason: string;
}
type RunResult = { ok: true } | { ok: false; reason: string } | { ok: 'pending' };
/** A body drop zone answers: which of these anchors is nearest to the pointer. */
export type BodyProbe = (clientX: number, clientY: number, candidates: Anchor[]) => Anchor | null;

export interface Source {
  /** a worn artifact being moved, or one taken out of the hold or the Armory */
  kind: 'armory' | 'hold' | 'worn';
  memberId?: string;
}

interface EquipApi {
  target: EquipTarget | null;
  setTarget(t: EquipTarget | null): void;
  getShip(id: string): Ship | undefined;
  drag: { skill: string; hover: Hover | null; source: Source } | null;
  invalid: Invalid | null;
  requestEquip(req: { shipId: string; memberId: string; skill: string; anchor?: Anchor; source?: Source }): RunResult;
  openMenu(req: { skill: string; shipId: string; memberId: string; source?: Source }): void;
  beginDrag(e: RPointerEvent, skill: string, source: Source): void;
  registerBody(memberId: string, probe: BodyProbe | null): void;
  consumeClickGuard(): boolean;
}

const EquipContext = createContext<EquipApi | null>(null);
export function useEquip(): EquipApi {
  const c = useContext(EquipContext);
  if (!c) throw new Error('EquipProvider is missing');
  return c;
}

/** Tells the controller which ship and member the Armory is equipping to; cleared when the screen leaves. */
export function useEquipTarget(target: EquipTarget | null): void {
  const { setTarget } = useEquip();
  const shipId = target?.shipId;
  const memberId = target?.memberId;
  useEffect(() => {
    setTarget(shipId && memberId ? { shipId, memberId } : null);
    return () => setTarget(null);
  }, [shipId, memberId, setTarget]);
}

const LONG_PRESS_MS = 300;
const MOVE_SLOP = 6;

export function EquipProvider({ children }: { children: ReactNode }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const state = useStoreState();
  const notify = useNotify();
  const [target, setTarget] = useState<EquipTarget | null>(null);
  const [drag, setDrag] = useState<EquipApi['drag']>(null);
  const [invalid, setInvalid] = useState<Invalid | null>(null);
  const [menu, setMenu] = useState<{ skill: string; shipId: string; memberId: string; source?: Source } | null>(null);
  const [full, setFull] = useState<{ shipId: string; memberId: string; skill: string; anchor: Anchor; source?: Source; occupants: string[] } | null>(null);
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH).ships, [idx]);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const getShip = useCallback((id: string) => stateRef.current.ships.find((s) => s.id === id) ?? library.find((s) => s.id === id), [library]);
  const bodies = useRef(new Map<string, BodyProbe>());
  const ghost = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ skill: string; source: Source; hover: Hover | null } | null>(null);
  const clickGuard = useRef(false);

  const nameOf = (skill: string) => idx.skill.get(skill)?.artifact.name ?? skill;

  const run = useCallback(
    (req: { shipId: string; memberId: string; skill: string; anchor?: Anchor; source?: Source; onFull?: 'swap' | 'hold' }): RunResult => {
      const refuse = (reason: string, note?: string): RunResult => {
        notify(reason, { note, tone: 'warn' });
        return { ok: false, reason };
      };
      const ship = getShip(req.shipId);
      if (!ship) return refuse('That ship is not in the drydock.');
      if (isLibraryShip(ship) && !stateRef.current.ships.some((s) => s.id === ship.id)) {
        return refuse(`${ship.name} is a template and cannot be edited.`, 'Clone it to edit.');
      }
      const member = ship.crew.find((m) => m.id === req.memberId);
      if (!member) return refuse('That crew member is not aboard.');
      const moving = req.source?.kind === 'worn' && req.source.memberId === req.memberId && isWorn(member, req.skill);
      const inHold = ship.hold?.includes(req.skill) ?? false;
      let probeShip = ship;
      if (moving) probeShip = { ...ship, crew: ship.crew.map((m) => (m.id === member.id ? { ...m, loadout: m.loadout.filter((e) => e.skill !== req.skill) } : m)) };
      const result = equip(idx, probeShip, req.memberId, req.skill, { anchor: req.anchor, onFull: req.onFull });
      if (!result.ok) {
        if (result.code === 'anchor-full' && req.anchor) {
          setFull({ shipId: req.shipId, memberId: req.memberId, skill: req.skill, anchor: req.anchor, source: req.source, occupants: result.occupants });
          return { ok: 'pending' };
        }
        return refuse(result.reason);
      }
      const opts = { anchor: req.anchor, onFull: req.onFull };
      if (moving) dispatch({ type: 'loadout/move', shipId: req.shipId, member: req.memberId, skill: req.skill, anchor: req.anchor ?? result.anchor, opts: { onFull: req.onFull } });
      else if (inHold) dispatch({ type: 'loadout/fromHold', shipId: req.shipId, member: req.memberId, skill: req.skill, opts });
      else dispatch({ type: 'loadout/equip', shipId: req.shipId, member: req.memberId, skill: req.skill, opts });
      const notes = result.notes.map((n) => n.message).join(' ');
      const where = idx.kb.anchors[result.anchor].label;
      notify(`${moving ? 'Moved' : 'Equipped'} ${nameOf(req.skill)} on ${member.character.name}, ${where}.`, {
        note: [result.displaced ? `${nameOf(result.displaced)} moved aside.` : '', notes].filter(Boolean).join(' ') || undefined,
        tone: result.notes.some((n) => n.severity !== 'info') ? 'warn' : 'info',
        undo: true,
      });
      return { ok: true };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx, dispatch, getShip, notify],
  );

  const hoverAt = useCallback(
    (x: number, y: number): Hover | null => {
      const el = document.elementsFromPoint(x, y).find((e) => e.closest('[data-drop-anchor],[data-drop-body],[data-drop-hold]'));
      if (!el) return null;
      const zone = el.closest<HTMLElement>('[data-drop-anchor],[data-drop-body],[data-drop-hold]')!;
      const shipId = zone.dataset.dropShip ?? '';
      const memberId = zone.dataset.dropMember ?? '';
      if (!shipId || !memberId) return null;
      if (zone.dataset.dropHold !== undefined) return { shipId, memberId, anchor: 'hold', via: 'hold' };
      if (zone.dataset.dropAnchor) return { shipId, memberId, anchor: zone.dataset.dropAnchor as Anchor, via: 'socket', index: Number(zone.dataset.dropIndex ?? 0) };
      const ship = getShip(shipId);
      const member = ship?.crew.find((m) => m.id === memberId);
      const probe = bodies.current.get(memberId);
      if (!ship || !member || !probe) return null;
      const free = ANCHOR_IDS.filter((a) => freeIndex(idx, member, a) !== null);
      const anchor = probe(x, y, free.length ? free : [...ANCHOR_IDS]);
      return anchor ? { shipId, memberId, anchor, via: 'body' } : null;
    },
    [getShip, idx],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
  }, []);

  const lastPoint = useRef({ x: -200, y: -200 });
  const invalidHandle = useRef(0);
  const showInvalid = useCallback((inv: Invalid | null) => {
    window.clearTimeout(invalidHandle.current);
    setInvalid(inv);
    if (inv) invalidHandle.current = window.setTimeout(() => setInvalid(null), 6000);
  }, []);

  /** A refused drop: the ghost shakes 2 px twice in 180 ms while it returns to where it came from in 240 ms. Reduced motion: it is simply gone. */
  const returnGhost = useCallback((origin: HTMLElement | null) => {
    const node = ghost.current;
    if (!node || isReducedMotion()) {
      recordMotion('invalid-drop', 0, { returned: false });
      return;
    }
    const clone = node.cloneNode(true) as HTMLDivElement;
    clone.setAttribute('data-returning', '');
    clone.setAttribute('data-testid', 'drag-ghost-returning');
    const from = `translate(${lastPoint.current.x + 12}px, ${lastPoint.current.y + 12}px)`;
    clone.style.transform = from;
    document.body.appendChild(clone);
    const rect = origin?.isConnected ? origin.getBoundingClientRect() : null;
    const home = rect ? `translate(${rect.left}px, ${rect.top}px)` : from;
    const back = clone.animate([{ transform: from, opacity: 1 }, { transform: home, opacity: rect ? 1 : 0 }], { duration: MOTION.invalid.returnMs, easing: EASE_CSS, fill: 'forwards' });
    const n = MOTION.invalid.shakeCount;
    const px = MOTION.invalid.shakePx;
    const offsets = ['0px 0px'];
    for (let i = 0; i < n; i++) offsets.push(`${px}px 0px`, `${-px}px 0px`);
    offsets.push('0px 0px');
    clone.animate(offsets.map((translate) => ({ translate })), { duration: MOTION.invalid.shakeMs, easing: 'linear' });
    back.finished.then(() => clone.remove(), () => clone.remove());
    recordMotion('invalid-drop', MOTION.invalid.returnMs, { shakePx: px, shakeCount: n, shakeMs: MOTION.invalid.shakeMs, returned: Boolean(rect) });
  }, []);

  const beginDrag = useCallback(
    (e: RPointerEvent, skill: string, source: Source) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const origin = e.currentTarget as HTMLElement;
      const touch = e.pointerType === 'touch';
      let pressHandle = 0;
      let picked = false;
      const pickUp = () => {
        picked = true;
        showInvalid(null);
        dragRef.current = { skill, source, hover: null };
        setDrag({ skill, hover: null, source });
        recordMotion('pick-up', MOTION.pickUp.ms, { scale: MOTION.pickUp.scale });
      };
      const place = () => {
        if (ghost.current) ghost.current.style.transform = `translate(${lastPoint.current.x + 12}px, ${lastPoint.current.y + 12}px)`;
      };
      const move = (ev: PointerEvent) => {
        lastPoint.current = { x: ev.clientX, y: ev.clientY };
        if (!picked) {
          const far = Math.hypot(ev.clientX - startX, ev.clientY - startY) > MOVE_SLOP;
          if (touch && far) return stop(); // a scroll, not a pick-up
          if (!touch && far) pickUp();
          else return;
        }
        place();
        const h = hoverAt(ev.clientX, ev.clientY);
        const prev = dragRef.current?.hover;
        if (dragRef.current && (prev?.anchor !== h?.anchor || prev?.memberId !== h?.memberId || prev?.via !== h?.via || prev?.index !== h?.index)) {
          dragRef.current.hover = h;
          setDrag({ skill, hover: h, source });
        }
      };
      const up = (ev: PointerEvent) => {
        const hover = picked ? hoverAt(ev.clientX, ev.clientY) : null;
        const wasPicked = picked;
        lastPoint.current = { x: ev.clientX, y: ev.clientY };
        if (!wasPicked) return stop();
        place();
        clickGuard.current = true;
        window.setTimeout(() => (clickGuard.current = false), 0);
        let refused = false;
        let reason: string | null = null;
        if (!hover) {
          notify('Dropped nowhere: nothing changed.');
          refused = true;
        } else if (hover.anchor === 'hold') {
          if (source.kind === 'worn' && source.memberId) {
            noteDrop(ev.clientX, ev.clientY);
            dispatch({ type: 'loadout/toHold', shipId: hover.shipId, member: source.memberId, skill });
            notify(`${nameOf(skill)} sent to the hold.`, { undo: true });
          } else {
            reason = 'Only a worn artifact can be sent to the hold.';
            notify(reason, { tone: 'warn' });
            refused = true;
          }
        } else {
          noteDrop(ev.clientX, ev.clientY);
          const r = run({ shipId: hover.shipId, memberId: hover.memberId, skill, anchor: hover.anchor, source });
          if (r.ok === false) {
            refused = true;
            reason = r.reason;
          }
        }
        if (refused) {
          // The ghost is cloned for its trip home before the dragged one unmounts.
          returnGhost(origin);
          if (hover && reason) showInvalid({ memberId: hover.memberId, anchor: hover.anchor, index: hover.index, reason });
        }
        stop();
      };
      const key = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') stop();
      };
      function stop() {
        window.clearTimeout(pressHandle);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', stop);
        window.removeEventListener('keydown', key);
        if (picked) endDrag();
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', stop);
      window.addEventListener('keydown', key);
      lastPoint.current = { x: startX, y: startY };
      if (touch) {
        pressHandle = window.setTimeout(() => {
          pickUp();
          place();
        }, LONG_PRESS_MS);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hoverAt, run, dispatch, notify, endDrag, returnGhost, showInvalid],
  );

  // While something is picked up by touch, the page must not scroll under the finger.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (dragRef.current && e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchmove', block, { passive: false });
    return () => window.removeEventListener('touchmove', block);
  }, []);

  const api = useMemo<EquipApi>(
    () => ({
      target,
      setTarget,
      getShip,
      drag,
      invalid,
      requestEquip: run,
      openMenu: setMenu,
      beginDrag,
      registerBody: (id, probe) => {
        if (probe) bodies.current.set(id, probe);
        else bodies.current.delete(id);
      },
      consumeClickGuard: () => {
        const was = clickGuard.current;
        clickGuard.current = false;
        return was;
      },
    }),
    [target, getShip, drag, invalid, run, beginDrag],
  );

  const draggedSkill = drag ? idx.skill.get(drag.skill) : undefined;
  return (
    <EquipContext.Provider value={api}>
      {children}
      {drag &&
        createPortal(
          <div ref={(el) => { ghost.current = el; if (el) el.style.transform = `translate(${lastPoint.current.x + 12}px, ${lastPoint.current.y + 12}px)`; }} className="drag-ghost" data-testid="drag-ghost" aria-hidden="true" style={{ ['--c' as string]: draggedSkill?.artifact.pigment }}>
            {draggedSkill && isFamilyId(draggedSkill.artifact.family) && <FamilyGlyph family={draggedSkill.artifact.family} pigment={draggedSkill.artifact.pigment} />}
            <span>{draggedSkill?.artifact.name ?? drag.skill}</span>
            <span className="drag-ghost-hint">{drag.hover ? (drag.hover.anchor === 'hold' ? 'Drop to send to the hold' : `Drop to equip: ${idx.kb.anchors[drag.hover.anchor].label}`) : 'Drop on a socket or the body'}</span>
          </div>,
          document.body,
        )}
      {menu && <EquipMenu req={menu} onClose={() => setMenu(null)} onPick={(m, anchor) => { run({ shipId: menu.shipId, memberId: m, skill: menu.skill, anchor, source: menu.source }); setMenu(null); }} />}
      {full && (
        <FullDialog
          full={full}
          onClose={() => setFull(null)}
          onChoose={(onFull) => {
            run({ shipId: full.shipId, memberId: full.memberId, skill: full.skill, anchor: full.anchor, source: full.source, onFull });
            setFull(null);
          }}
        />
      )}
    </EquipContext.Provider>
  );
}

function EquipMenu({ req, onClose, onPick }: { req: { skill: string; shipId: string; memberId: string; source?: Source }; onClose: () => void; onPick: (member: string, anchor: Anchor | undefined) => void }) {
  const idx = useKb();
  const { getShip } = useEquip();
  const ship = getShip(req.shipId);
  const [memberId, setMemberId] = useState(req.memberId);
  const [anchor, setAnchor] = useState<Anchor | 'auto'>('auto');
  const skill = idx.skill.get(req.skill);
  if (!ship || !skill) return null;
  const moving = req.source?.kind === 'worn';
  const member: Member | undefined = ship.crew.find((m) => m.id === memberId);
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog" data-testid="equip-menu" aria-describedby={undefined}>
          <Dialog.Title className="card-title">{moving ? 'Move' : 'Equip'} {skill.artifact.name}</Dialog.Title>
          <p className="muted sheet-line"><code>{req.skill}</code> · {ship.name}</p>
          {!moving && (
            <fieldset className="menu-group">
              <legend className="label">Crew member</legend>
              {ship.crew.map((m) => (
                <label key={m.id} className="menu-radio">
                  <input type="radio" name="equip-member" value={m.id} checked={memberId === m.id} onChange={() => setMemberId(m.id)} data-testid={`equip-member-${m.id}`} />
                  <span>{m.character.name}</span> <span className="muted">{m.agent}</span>
                </label>
              ))}
            </fieldset>
          )}
          <fieldset className="menu-group">
            <legend className="label">Anchor</legend>
            <label className="menu-radio">
              <input type="radio" name="equip-anchor" checked={anchor === 'auto'} onChange={() => setAnchor('auto')} data-testid="equip-anchor-auto" />
              <span>Place it for me</span> <span className="muted">{idx.kb.anchors[skill.artifact.autoPlace[0]].label} first</span>
            </label>
            {ANCHOR_IDS.map((a) => {
              const cap = idx.kb.anchors[a].capacity;
              const used = member ? member.loadout.filter((e) => e.anchor === a && e.skill !== req.skill).length : 0;
              return (
                <label key={a} className="menu-radio">
                  <input type="radio" name="equip-anchor" checked={anchor === a} onChange={() => setAnchor(a)} data-testid={`equip-anchor-${a}`} />
                  <span>{idx.kb.anchors[a].label}</span> <span className="muted num">{used}/{cap}{used >= cap ? ' · full, can swap' : ''}</span>
                </label>
              );
            })}
          </fieldset>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={() => onPick(memberId, anchor === 'auto' ? undefined : anchor)} data-testid="equip-confirm">
              {moving ? 'Move' : 'Equip'}
            </button>
            <Dialog.Close className="btn btn-quiet">Cancel</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FullDialog({ full, onClose, onChoose }: { full: { skill: string; anchor: Anchor; occupants: string[] }; onClose: () => void; onChoose: (how: 'swap' | 'hold') => void }) {
  const idx = useKb();
  const old = full.occupants[0];
  const name = (s: string) => idx.skill.get(s)?.artifact.name ?? s;
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog" data-testid="anchor-full" aria-describedby={undefined}>
          <Dialog.Title className="card-title">{idx.kb.anchors[full.anchor].label} is full</Dialog.Title>
          <p className="prose-sm">{name(old)} sits there. Capacity is the one hard limit; choose what happens to it.</p>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={() => onChoose('swap')} data-testid="full-swap">Swap: {name(full.skill)} takes the socket</button>
            <button type="button" className="btn btn-quiet" onClick={() => onChoose('hold')} data-testid="full-hold">Send {name(old)} to the hold</button>
            <Dialog.Close className="btn btn-quiet">Cancel</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Spread on anything that is an artifact: pointer drag, long-press and the `E` key. */
export function useArtifactHandlers(skill: string, shipId: string | undefined, memberId: string | undefined, source: Source) {
  const { beginDrag, openMenu, consumeClickGuard } = useEquip();
  return {
    onPointerDown: (e: RPointerEvent) => beginDrag(e, skill, source),
    onKeyDown: (e: React.KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey && !e.altKey && shipId && memberId) {
        e.preventDefault();
        openMenu({ skill, shipId, memberId, source });
      }
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (consumeClickGuard()) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
  };
}
