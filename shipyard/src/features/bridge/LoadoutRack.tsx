// The Artifacts column of the crew profile: what the member wears, by anchor, read-only in T4.
// Replaces ArkhEthos's ArtifactRack shelves (06 section 4.3). The sockets are real buttons-to-be:
// each row carries the skill id and anchor in data attributes, so T6 adds equip, unequip and move
// to this list without a new layout.
import type { CSSProperties } from 'react';
import { TruthLabel } from '../../components/TruthLabel';
import { ANCHOR_IDS, type Anchor, type Member, type Ship } from '../../domain/schema';
import { entryIndex } from '../../domain/loadout';
import type { KbIndex } from '../../kb/artifacts';
import { isFamilyId } from '../../scene/artifacts/families';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';

export interface LoadoutRackProps {
  idx: KbIndex;
  ship: Ship;
  member: Member;
  /** the skill the member's first stage opens */
  active: string | null;
}

function ArtifactRow({ idx, skill, active, anchor }: { idx: KbIndex; skill: string; active: boolean; anchor?: Anchor }) {
  const s = idx.skill.get(skill);
  if (!s) {
    return (
      <li className="ship-art ship-art-retired" data-skill={skill} data-anchor={anchor}>
        <span className="ship-art-name">Retired</span>
        <code>{skill}</code>
        <span className="ship-art-tier">no longer in the library</span>
      </li>
    );
  }
  const a = s.artifact;
  const tier = idx.kb.tiers.find((t) => t.id === a.tier);
  return (
    <li className="ship-art" data-skill={skill} data-anchor={anchor} data-tier={a.tier} data-active={active || undefined} style={{ ['--c' as string]: a.pigment } as CSSProperties}>
      {isFamilyId(a.family) ? <FamilyGlyph family={a.family} pigment={a.pigment} /> : <span className="glyph" />}
      <span className="ship-art-name">{a.name}</span>
      <code>{skill}</code>
      <span className="ship-art-tier" data-rim={tier?.rim}>
        {tier?.label ?? a.tier}
        {active ? ' · active' : ''}
      </span>
    </li>
  );
}

export function LoadoutRack({ idx, ship, member, active }: LoadoutRackProps) {
  const worn = member.loadout.length;
  const capacity = ANCHOR_IDS.reduce((n, a) => n + (idx.kb.anchors[a]?.capacity ?? 0), 0);
  const hold = ship.hold ?? [];
  return (
    <aside className="ship-rack stack" aria-label="Artifacts" data-testid="loadout-rack">
      <header className="ship-rack-head">
        <h2 className="ship-rack-title">Artifacts</h2>
        <TruthLabel truth="Verified" detail={`KB ${idx.kb.sourceHash.slice(0, 8)}`} />
      </header>
      <p className="muted sheet-line" data-testid="rack-count">
        <span className="num">{worn}</span> of <span className="num">{capacity}</span> sockets worn
      </p>
      <div className="stack-sm ship-anchors">
        {ANCHOR_IDS.map((anchor) => {
          const spec = idx.kb.anchors[anchor];
          const rows = member.loadout.filter((e) => e.anchor === anchor).sort((a, b) => entryIndex(a) - entryIndex(b));
          return (
            <section key={anchor} className="ship-anchor" data-anchor={anchor} aria-label={`${spec.label}, ${rows.length} of ${spec.capacity}`}>
              <h3 className="label">
                {spec.label} <span className="num">{rows.length}/{spec.capacity}</span>
              </h3>
              <ul className="ship-art-list">
                {rows.map((e) => (
                  <ArtifactRow key={e.skill} idx={idx} skill={e.skill} anchor={anchor} active={e.skill === active} />
                ))}
                {Array.from({ length: Math.max(0, spec.capacity - rows.length) }, (_, i) => (
                  <li key={`empty-${i}`} className="ship-art ship-art-empty" aria-label={`${spec.label} socket empty`}>
                    Empty
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section className="ship-anchor" aria-label={`Ship hold, ${hold.length} artifacts`} data-testid="hold">
        <h3 className="label">
          Ship&rsquo;s hold <span className="num">{hold.length}</span>
        </h3>
        {hold.length === 0 ? (
          <p className="muted sheet-line">Nothing spare aboard.</p>
        ) : (
          <ul className="ship-art-list">
            {hold.map((s) => (
              <ArtifactRow key={s} idx={idx} skill={s} active={false} />
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
