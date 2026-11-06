// The artifact grid: one card per skill. Virtualised above 60 cards (only the rows in view, plus an
// overscan, are in the DOM); at 60 or fewer every card renders. Cards are buttons: Enter or click
// inspects, `E` opens the equip menu, a drag or a 300 ms touch hold picks the artifact up.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Ship } from '../../domain/schema';
import type { KbIndex } from '../../kb/artifacts';
import type { KbSkill } from '../../kb/schema';
import { MOTION } from '../../lib/motion';
import { isFamilyId } from '../../scene/artifacts/families';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { useNotify } from '../shared/notices';
import { useArtifactHandlers, useEquip } from './equip';

export const VIRTUALISE_ABOVE = 60;
const GAP = 12;
const ROW_H = 128;
const OVERSCAN = 2;

export interface GridProps {
  idx: KbIndex;
  skills: readonly KbSkill[];
  selected: string | null;
  onSelect: (skill: string) => void;
  /** the ship being equipped to (for "Equipped by") */
  ship?: Ship;
  /** shortest card, px: 200 on a desktop, 150 on a phone (two columns) */
  minCard: number;
}

function Card({ idx, skill, selected, onSelect, ship, enter }: { idx: KbIndex; skill: KbSkill; selected: boolean; onSelect: () => void; ship?: Ship; enter?: number }) {
  const { target, drag } = useEquip();
  const notify = useNotify();
  const a = skill.artifact;
  const tier = idx.kb.tiers.find((t) => t.id === a.tier);
  const h = useArtifactHandlers(skill.id, target?.shipId, target?.memberId, { kind: 'armory' });
  const wearers = ship?.crew.filter((m) => m.loadout.some((e) => e.skill === skill.id)) ?? [];
  return (
    <button
      type="button"
      className="art-card"
      data-testid="art-card"
      data-skill={skill.id}
      data-tier={a.tier}
      aria-pressed={selected}
      data-lifted={(drag?.source.kind === 'armory' && drag.skill === skill.id) || undefined}
      data-enter={enter !== undefined ? '' : undefined}
      style={{ ['--c' as string]: a.pigment, ...(enter !== undefined ? { ['--i' as string]: enter } : {}) } as CSSProperties}
      {...h}
      onKeyDown={(e) => {
        if ((e.key === 'e' || e.key === 'E') && !target) {
          e.preventDefault();
          notify('Choose a ship and a crew member to equip to first. Clone SS Full Run if the drydock is empty.', { tone: 'warn' });
          return;
        }
        h.onKeyDown(e);
      }}
      onClickCapture={h.onClickCapture}
      onClick={onSelect}
      aria-label={`${a.name}, ${skill.id}, ${tier?.label ?? a.tier}, ${skill.phase} phase${wearers.length ? `, worn by ${wearers.map((m) => m.character.name).join(', ')}` : ''}. Press E to equip.`}
    >
      <span className="art-card-tile">{isFamilyId(a.family) ? <FamilyGlyph family={a.family} pigment={a.pigment} /> : null}</span>
      <span className="art-card-meta">
        {a.familyName} · <span className="art-card-tier" data-rim={tier?.rim}>{tier?.label ?? a.tier}</span>
      </span>
      <span className="art-card-name">{a.name}</span>
      {wearers.length > 0 && (
        <span className="art-card-wearers" aria-hidden="true">
          {wearers.slice(0, 5).map((m) => (
            <span key={m.id} className="wearer" style={{ background: m.character.pigment }} title={m.character.name} />
          ))}
        </span>
      )}
    </button>
  );
}

export function ArtifactGrid({ idx, skills, selected, onSelect, ship, minCard }: GridProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(600);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setHeight(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const cols = Math.max(1, Math.floor((Math.max(width, minCard) + GAP) / (minCard + GAP)));
  const rows = Math.ceil(skills.length / cols);
  // The first dozen cards enter 45 ms apart, once, when the grid first has a width; after that the grid is still.
  const [fresh, setFresh] = useState(true);
  useEffect(() => {
    if (width === 0) return;
    const h = window.setTimeout(() => setFresh(false), MOTION.stagger * MOTION.staggerCards + MOTION.micro + 100);
    return () => window.clearTimeout(h);
  }, [width === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const virtual = skills.length > VIRTUALISE_ABOVE;
  const first = virtual ? Math.max(0, Math.floor(top / (ROW_H + GAP)) - OVERSCAN) : 0;
  const last = virtual ? Math.min(rows - 1, Math.ceil((top + height) / (ROW_H + GAP)) + OVERSCAN) : rows - 1;
  const visible = useMemo(() => {
    const out: { skill: KbSkill; row: number; col: number }[] = [];
    if (width === 0) return out;
    for (let r = first; r <= last; r++) for (let c = 0; c < cols; c++) {
      const s = skills[r * cols + c];
      if (s) out.push({ skill: s, row: r, col: c });
    }
    return out;
  }, [skills, first, last, cols, width]);
  return (
    <div ref={box} className="art-grid-scroll" data-testid="art-grid" data-virtual={virtual} data-count={skills.length} data-rendered={visible.length} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
      {skills.length === 0 ? (
        <p className="state-line" data-testid="grid-empty">No artifact matches. Clear a filter or the search.</p>
      ) : (
        <ul className="art-grid" style={{ height: rows * (ROW_H + GAP) - GAP, ['--cols' as string]: cols, ['--row-h' as string]: `${ROW_H}px` } as CSSProperties} aria-label={`${skills.length} artifacts`}>
          {visible.map(({ skill, row, col }, n) => (
            <li key={skill.id} style={{ top: row * (ROW_H + GAP), left: `calc(${col} * (100% - ${(cols - 1) * GAP}px) / ${cols} + ${col * GAP}px)` }}>
              <Card idx={idx} skill={skill} selected={selected === skill.id} onSelect={() => onSelect(skill.id)} ship={ship} enter={fresh && n < MOTION.staggerCards ? n : undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
