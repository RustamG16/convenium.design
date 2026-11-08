// The Loadout rack (06 section 4.3): the anchor diagram (a body silhouette with six anchor groups and
// nine sockets, every socket a named button), the slots the agent owns ("swap artifact in slot", as in
// the ArkhEthos Skills slots row) and the ship's hold. Every drag has a keyboard twin: `E` on an
// artifact opens the Equip menu, `Delete` takes it off, Enter on an empty socket opens the picker.
// A library ship is a read-only template: the sockets show what is worn and say how to edit.
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { TruthLabel } from '../../components/TruthLabel';
import { entryIndex, isWorn, totalCapacity } from '../../domain/loadout';
import { ANCHOR_IDS, type Anchor, type Member, type Ship } from '../../domain/schema';
import type { KbIndex } from '../../kb/artifacts';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { EASE_CSS, isReducedMotion, MOTION, recordMotion, takeDrop } from '../../lib/motion';
import { useReducedMotion } from '../../lib/preferences';
import { useDispatch } from '../../store/context';
import { useArtifactHandlers, useEquip } from '../armory/equip';
import { useNotify } from '../shared/notices';

export interface LoadoutRackProps {
  idx: KbIndex;
  ship: Ship;
  member: Member;
  /** the skill the member's first stage opens */
  active: string | null;
  readOnly: boolean;
  /** `?skill=` from a pre-flight Fix link: that socket is selected */
  focusSkill?: string | null;
  onOpenArmory: (anchor?: Anchor) => void;
  /** a read-only ship: an edit gesture asks to clone instead of editing */
  onLocked?: () => void;
}

/** Socket positions on the silhouette, in percent of the diagram box. */
const SPOT: Record<Anchor, [number, number][]> = {
  orbit: [[22, 6], [78, 6]],
  head: [[50, 17]],
  back: [[84, 33]],
  offhand: [[14, 54]],
  hand: [[86, 54]],
  belt: [[34, 68], [50, 70], [66, 68]],
};

function Silhouette() {
  return (
    <svg className="anchor-body" viewBox="0 0 200 300" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="100" cy="52" r="20" />
        <path d="M88 71 L84 84 L58 94 L46 150 L56 154 L68 112 L72 160 L70 204 L74 276 L94 276 L98 206 L102 206 L106 276 L126 276 L130 204 L128 160 L132 112 L144 154 L154 150 L142 94 L116 84 L112 71" />
        <path d="M72 160 L128 160" />
      </g>
    </svg>
  );
}

function tierOf(idx: KbIndex, skill: string): string {
  const s = idx.skill.get(skill);
  return s ? (idx.kb.tiers.find((t) => t.id === s.artifact.tier)?.label ?? s.artifact.tier) : 'Retired';
}

function Socket({ idx, ship, member, anchor, index, skill, active, selected, readOnly, onSelect, onEmpty }: {
  idx: KbIndex;
  ship: Ship;
  member: Member;
  anchor: Anchor;
  index: number;
  skill: string | null;
  active: boolean;
  selected: boolean;
  readOnly: boolean;
  onSelect: (skill: string) => void;
  onEmpty: () => void;
}) {
  const dispatch = useDispatch();
  const notify = useNotify();
  const { drag, invalid } = useEquip();
  const reduced = useReducedMotion();
  const chip = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLSpanElement>(null);
  const was = useRef({ who: `${ship.id}:${member.id}`, skill });
  const art = skill ? idx.skill.get(skill) : undefined;
  const spec = idx.kb.anchors[anchor];
  const slotLabel = spec.capacity > 1 ? `${spec.label} slot ${index + 1}` : `${spec.label} slot`;
  const label = skill ? `${slotLabel}: ${art ? art.artifact.name : `${skill}, retired`}${art ? `, ${tierOf(idx, skill)}` : ''}${active ? ', active' : ''}` : `${slotLabel}, empty`;
  const handlers = useArtifactHandlers(skill ?? '', ship.id, member.id, { kind: 'worn', memberId: member.id });
  const hovered = drag?.hover?.via === 'socket' && drag.hover.memberId === member.id && drag.hover.anchor === anchor;
  const drop = !readOnly ? { 'data-drop-anchor': anchor, 'data-drop-ship': ship.id, 'data-drop-member': member.id } : {};
  const lifted = Boolean(skill && drag?.source.kind === 'worn' && drag.skill === skill && drag.source.memberId === member.id);
  const refused = invalid && invalid.memberId === member.id && invalid.anchor === anchor && (invalid.index === undefined ? index === 0 : invalid.index === index) ? invalid.reason : null;
  // R4: while an artifact is carried, the anchors with no free place for it are dimmed (a drop there offers a swap, it is never refused).
  const full = Boolean(drag && !readOnly && member.loadout.filter((e) => e.anchor === anchor && e.skill !== drag.skill).length >= spec.capacity);
  const [x, y] = SPOT[anchor][index];

  // Equip, 2D: the socket flashes for 80 ms and the chip lands in 240 ms (from the drop point when there was a drop).
  // Reduced motion: the chip is simply there, with a 120 ms opacity change.
  useLayoutEffect(() => {
    const who = `${ship.id}:${member.id}`;
    const before = was.current;
    was.current = { who, skill };
    const el = chip.current;
    if (!skill || !el || before.who !== who || before.skill === skill) return;
    if (reduced || isReducedMotion()) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION.reduced });
      recordMotion('equip-2d', MOTION.reduced, { skill, variant: 'opacity' });
      return;
    }
    const at = takeDrop();
    const r = el.getBoundingClientRect();
    const dx = at ? at.x - (r.left + r.width / 2) : 0;
    const dy = at ? at.y - (r.top + r.height / 2) : 0;
    el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${at ? MOTION.pickUp.scale : MOTION.unequip.scale})`, opacity: at ? 1 : 0 }, { transform: 'none', opacity: 1 }], { duration: MOTION.equip.chipMs, easing: EASE_CSS });
    flash.current?.animate([{ opacity: 0 }, { opacity: 0.8 }, { opacity: 0 }], { duration: MOTION.equip.socketFlashMs, easing: 'linear' });
    recordMotion('equip-2d', MOTION.equip.chipMs, { skill, flashMs: MOTION.equip.socketFlashMs, fromDrop: Boolean(at) });
  }, [skill, ship.id, member.id, reduced]);

  return (
    <button
      type="button"
      className="socket"
      data-testid={`socket-${anchor}-${index}`}
      data-anchor={anchor}
      data-index={index}
      data-skill={skill ?? undefined}
      data-filled={skill ? '' : undefined}
      data-tier={art?.artifact.tier}
      data-retired={skill && !art ? '' : undefined}
      data-active={active || undefined}
      data-hover={hovered || undefined}
      data-droppable={drag && !readOnly ? '' : undefined}
      data-full={full || undefined}
      data-lifted={lifted || undefined}
      aria-label={label}
      aria-pressed={skill ? selected : undefined}
      style={{ left: `${x}%`, top: `${y}%`, ['--c' as string]: art?.artifact.pigment } as CSSProperties}
      {...drop}
      data-drop-index={!readOnly ? index : undefined}
      {...(skill && !readOnly ? handlers : {})}
      onClick={() => (skill ? onSelect(skill) : onEmpty())}
      onKeyDown={(e) => {
        if (!skill) {
          if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            onEmpty();
          }
          return;
        }
        if (readOnly) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          dispatch({ type: 'loadout/unequip', shipId: ship.id, member: member.id, skill });
          notify(`${art?.artifact.name ?? skill} taken off ${member.character.name}.`, { undo: true });
        } else handlers.onKeyDown(e);
      }}
    >
      {skill && <span className="socket-flash" ref={flash} aria-hidden="true" />}
      {art ? <span className="socket-chip" ref={chip}><FamilyGlyph family={art.artifact.family} pigment={art.artifact.pigment} /></span> : skill ? <span className="socket-chip" ref={chip} aria-hidden="true">?</span> : <span className="socket-plus" aria-hidden="true">+</span>}
      {hovered && (
        <span className="socket-label" data-testid="socket-label" aria-hidden="true">
          {reduced ? `Drop to equip: ${spec.label}` : spec.label}
        </span>
      )}
      {refused && (
        <span className="socket-reason" data-testid="socket-reason">
          {refused}
        </span>
      )}
    </button>
  );
}

export function AnchorDiagram(props: Omit<LoadoutRackProps, 'focusSkill' | 'onOpenArmory' | 'onLocked'> & { focusSkill?: string | null; onEmpty: (anchor: Anchor) => void }) {
  const { idx, ship, member, active, readOnly, onEmpty } = props;
  const [picked, setPicked] = useState<string | null>(props.focusSkill ?? null);
  const dispatch = useDispatch();
  const notify = useNotify();
  const { openMenu } = useEquip();
  const figure = useRef<HTMLDivElement>(null);
  const seen = useRef<{ who: string; sockets: Map<string, { skill: string; html: string; left: string; top: string; c: string }> }>({ who: '', sockets: new Map() });
  // Unequip: a worn artifact that leaves the member fades to 0 and shrinks to 0.85 in 160 ms (a ghost of the socket, then gone).
  // One that merely moved to another socket is not a departure. Reduced motion: opacity only.
  useLayoutEffect(() => {
    const fig = figure.current;
    if (!fig) return;
    const who = `${ship.id}:${member.id}`;
    const sockets = new Map<string, { skill: string; html: string; left: string; top: string; c: string }>();
    fig.querySelectorAll<HTMLElement>('.socket[data-skill]').forEach((el) => {
      sockets.set(el.dataset.testid ?? '', { skill: el.dataset.skill ?? '', html: el.querySelector('.socket-chip')?.innerHTML ?? '', left: el.style.left, top: el.style.top, c: el.style.getPropertyValue('--c') });
    });
    if (seen.current.who === who) {
      for (const [key, was] of seen.current.sockets) {
        if (sockets.get(key)?.skill === was.skill || member.loadout.some((e) => e.skill === was.skill)) continue;
        const g = document.createElement('span');
        g.className = 'socket socket-ghost';
        g.setAttribute('aria-hidden', 'true');
        g.setAttribute('data-testid', 'unequip-ghost');
        g.setAttribute('data-filled', '');
        g.style.left = was.left;
        g.style.top = was.top;
        g.style.setProperty('--c', was.c);
        g.innerHTML = was.html;
        fig.appendChild(g);
        const reduced = isReducedMotion();
        const a = g.animate(reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: `scale(${MOTION.unequip.scale})` }], { duration: reduced ? MOTION.reduced : MOTION.unequip.ms, easing: EASE_CSS, fill: 'forwards' });
        a.finished.then(() => g.remove(), () => g.remove());
        recordMotion('unequip', reduced ? MOTION.reduced : MOTION.unequip.ms, { skill: was.skill, scale: reduced ? 1 : MOTION.unequip.scale });
      }
    }
    seen.current = { who, sockets };
  });
  const sel = picked && isWorn(member, picked) ? picked : null;
  const selArt = sel ? idx.skill.get(sel) : undefined;
  return (
    <div className="anchor-diagram" data-testid="anchor-diagram">
      <div className="anchor-figure" ref={figure}>
        <Silhouette />
        {ANCHOR_IDS.flatMap((anchor) =>
          Array.from({ length: idx.kb.anchors[anchor].capacity }, (_, i) => {
            const e = member.loadout.find((x) => x.anchor === anchor && entryIndex(x) === i);
            return (
              <Socket key={`${anchor}-${i}`} idx={idx} ship={ship} member={member} anchor={anchor} index={i} skill={e?.skill ?? null} active={e?.skill === active} selected={e?.skill === sel} readOnly={readOnly} onSelect={setPicked} onEmpty={() => onEmpty(anchor)} />
            );
          }),
        )}
      </div>
      {sel && (
        <div className="socket-detail" data-testid="socket-detail" style={{ ['--c' as string]: selArt?.artifact.pigment } as CSSProperties}>
          <p className="socket-detail-name">{selArt?.artifact.name ?? 'Retired'}{sel === active ? ' · active in its stage' : ''}</p>
          <p className="muted sheet-line"><code>{sel}</code> · {tierOf(idx, sel)}{selArt ? ` · ${selArt.phase}` : ''}</p>
          {readOnly ? (
            <p className="muted sheet-line">This ship is a template. Clone it to change what is worn.</p>
          ) : (
            <div className="row" style={{ gap: 'var(--s2)' }}>
              <button type="button" className="btn btn-quiet btn-sm" data-testid="socket-move" onClick={() => openMenu({ skill: sel, shipId: ship.id, memberId: member.id, source: { kind: 'worn', memberId: member.id } })}>Move</button>
              <button type="button" className="btn btn-quiet btn-sm" data-testid="socket-hold" onClick={() => { dispatch({ type: 'loadout/toHold', shipId: ship.id, member: member.id, skill: sel }); notify(`${selArt?.artifact.name ?? sel} sent to the hold.`, { undo: true }); }}>To the hold</button>
              <button type="button" className="btn btn-quiet btn-sm" data-testid="socket-unequip" onClick={() => { dispatch({ type: 'loadout/unequip', shipId: ship.id, member: member.id, skill: sel }); notify(`${selArt?.artifact.name ?? sel} taken off ${member.character.name}.`, { undo: true }); }}>Unequip</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlotRows({ idx, ship, member, readOnly, onLocked }: { idx: KbIndex; ship: Ship; member: Member; readOnly: boolean; onLocked?: () => void }) {
  const { requestEquip } = useEquip();
  const slots = useMemo(() => idx.kb.slots.filter((s) => s.runtimeOwner === member.agent), [idx, member.agent]);
  if (slots.length === 0) return null;
  return (
    <section className="slot-rows stack-sm" aria-label="Skill slots this agent owns" data-testid="slot-rows">
      <h3 className="label">Skill slots</h3>
      {slots.map((slot) => {
        const options = [slot.default, ...slot.candidates.map((c) => c.skill)].filter((s, i, a) => a.indexOf(s) === i);
        const current = options.find((s) => isWorn(member, s)) ?? '';
        const anchorOf = (s: string) => member.loadout.find((e) => e.skill === s)?.anchor;
        return (
          <div key={slot.id} className="slot-row" role="group" aria-label={`Slot ${slot.name}`} data-testid={`slot-${slot.id}`} data-current={current || undefined}>
            <span className="slot-name">{slot.name}</span>
            <span className="muted sheet-line">{current === '' ? `Empty. Choose a ${slot.name} artifact.` : slot.question}</span>
            <span className="slot-choices">
              {options.map((s) => {
                const worn = s === current;
                return (
                  <button
                    key={s}
                    type="button"
                    className="btn btn-quiet btn-sm slot-choice"
                    aria-pressed={worn}
                    data-skill={s}
                    data-testid={`slot-${slot.id}-${s}`}
                    onClick={() => {
                      if (readOnly) return onLocked?.();
                      if (worn) return;
                      const old = current ? anchorOf(current) : undefined;
                      // The new one takes the old one's socket; the old one goes to the hold.
                      requestEquip({ shipId: ship.id, memberId: member.id, skill: s, anchor: old });
                    }}
                  >
                    {idx.skill.get(s)?.artifact.name ?? s}
                    {s === slot.default ? ' (default)' : ''}
                  </button>
                );
              })}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function HoldRow({ idx, ship, member, skill, readOnly }: { idx: KbIndex; ship: Ship; member: Member; skill: string; readOnly: boolean }) {
  const h = useArtifactHandlers(skill, ship.id, member.id, { kind: 'hold' });
  const { drag } = useEquip();
  const a = idx.skill.get(skill);
  return (
    <li>
      <button type="button" className="hold-chip" data-testid="hold-chip" data-skill={skill} data-lifted={(drag?.source.kind === 'hold' && drag.skill === skill) || undefined} disabled={readOnly} style={{ ['--c' as string]: a?.artifact.pigment } as CSSProperties} {...h} aria-label={`${a?.artifact.name ?? skill} in the hold. Press E to equip it to ${member.character.name}.`}>
        {a && <FamilyGlyph family={a.artifact.family} pigment={a.artifact.pigment} />}
        <span>{a?.artifact.name ?? skill}</span>
      </button>
    </li>
  );
}

/** A searchable list of every registry skill: pick one to equip to this member (the Armory drawer is the full catalogue). */
export function SkillPicker({ idx, anchor, onPick, onClose }: { idx: KbIndex; anchor?: Anchor; onPick: (skill: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const n = q.trim().toLowerCase();
    return idx.kb.skills.filter((s) => !n || s.id.includes(n) || s.artifact.name.toLowerCase().includes(n)).slice(0, 60);
  }, [idx, q]);
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog dialog-tall" data-testid="skill-picker" aria-describedby={undefined}>
          <Dialog.Title className="card-title">Equip a skill{anchor ? `: ${idx.kb.anchors[anchor].label}` : ''}</Dialog.Title>
          <input className="field" type="search" placeholder="Search by name or skill id" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search skills" data-testid="picker-search" autoFocus />
          <ul className="picker-list">
            {hits.map((s) => (
              <li key={s.id}>
                <button type="button" className="picker-item" data-skill={s.id} onClick={() => onPick(s.id)} style={{ ['--c' as string]: s.artifact.pigment } as CSSProperties}>
                  {<FamilyGlyph family={s.artifact.family} pigment={s.artifact.pigment} />}
                  <span>{s.artifact.name}</span>
                  <code>{s.id}</code>
                </button>
              </li>
            ))}
            {hits.length === 0 && <li className="muted">No skill matches “{q}”.</li>}
          </ul>
          <Dialog.Close className="btn btn-quiet">Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LoadoutRack({ idx, ship, member, active, readOnly, focusSkill, onOpenArmory, onLocked }: LoadoutRackProps) {
  const { requestEquip } = useEquip();
  const [picker, setPicker] = useState<{ anchor?: Anchor } | null>(null);
  const worn = member.loadout.length;
  const capacity = totalCapacity(idx);
  const hold = ship.hold ?? [];
  const retired = member.loadout.filter((e) => !idx.skill.has(e.skill));
  const dispatch = useDispatch();
  const notify = useNotify();
  return (
    <aside className="ship-rack stack" aria-label="Artifacts" data-testid="loadout-rack">
      <header className="ship-rack-head">
        <h2 className="ship-rack-title">Artifacts</h2>
        <TruthLabel truth="Verified" detail={`KB ${idx.kb.sourceHash.slice(0, 8)}`} />
      </header>
      <p className="muted sheet-line" data-testid="rack-count">
        {/* a retired artifact holds its socket but does no work, so it is counted apart (finish review m6) */}
        <span className="num">{worn - retired.length}</span> of <span className="num">{capacity}</span> sockets worn
        {retired.length > 0 && (
          <>
            {' '}
            · <span className="num">{retired.length}</span> retired
          </>
        )}
      </p>
      {retired.length > 0 && (
        // DESIGN.md required state: an artifact whose skill left the registry is a greyed "Retired" chip, kept until removed.
        <ul className="retired-list" data-testid="retired-list">
          {retired.map((e) => (
            <li key={e.skill}>
              <span className="retired-chip">Retired</span> <code>{e.skill}</code> left the library.
              {!readOnly && (
                <button type="button" className="btn btn-quiet btn-sm" data-testid="retired-remove" onClick={() => { dispatch({ type: 'loadout/unequip', shipId: ship.id, member: member.id, skill: e.skill }); notify(`${e.skill} removed from ${member.character.name}.`, { undo: true }); }}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <AnchorDiagram idx={idx} ship={ship} member={member} active={active} readOnly={readOnly} focusSkill={focusSkill} onEmpty={(a) => (readOnly ? onLocked?.() : setPicker({ anchor: a }))} />
      <div className="row" style={{ gap: 'var(--s2)' }}>
        {/* On a template the edit gestures ask to clone first; "Clone to edit" is then the one filled button. */}
        <button type="button" className={readOnly ? 'btn btn-quiet' : 'btn btn-primary'} data-testid="equip-skill" onClick={() => (readOnly ? onLocked?.() : setPicker({}))}>Equip a skill</button>
        {!readOnly && <button type="button" className="btn btn-quiet" data-testid="open-armory" onClick={() => onOpenArmory()}>Open Armory</button>}
      </div>
      <ol className="sr-only" aria-label="Worn artifacts, by anchor" data-testid="worn-list">
        {ANCHOR_IDS.flatMap((a) => member.loadout.filter((e) => e.anchor === a).sort((x, y) => entryIndex(x) - entryIndex(y)).map((e) => <li key={e.skill} data-skill={e.skill} data-anchor={a}>{idx.kb.anchors[a].label}: {idx.skill.get(e.skill)?.artifact.name ?? e.skill}</li>))}
      </ol>
      <SlotRows idx={idx} ship={ship} member={member} readOnly={readOnly} onLocked={onLocked} />
      <section className="ship-anchor" aria-label={`Ship hold, ${hold.length} artifacts`} data-testid="hold" data-drop-hold="" data-drop-ship={ship.id} data-drop-member={member.id}>
        <h3 className="label">Ship&rsquo;s hold <span className="num">{hold.length}</span></h3>
        {hold.length === 0 ? <p className="muted sheet-line">Nothing spare aboard. Drop an artifact here to keep it for later.</p> : (
          <ul className="hold-list">{hold.map((s) => <HoldRow key={s} idx={idx} ship={ship} member={member} skill={s} readOnly={readOnly} />)}</ul>
        )}
      </section>
      {picker && (
        <SkillPicker
          idx={idx}
          anchor={picker.anchor}
          onClose={() => setPicker(null)}
          onPick={(skill) => {
            requestEquip({ shipId: ship.id, memberId: member.id, skill, anchor: picker.anchor });
            setPicker(null);
          }}
        />
      )}
    </aside>
  );
}
