// DOM pieces of the crew profile: the crew rail and the identity card. 3D lives in src/scene; these
// render the same data without it. Ported from ArkhEthos `ShipCards.tsx`: the identity card keeps
// its anatomy (station badge, truth line, name, role, species, essence, quote, four facets); the
// briefed checklist became the Codex line (T6 adds the edit mode: name, species, essence, body,
// pigment, glyph go through `editing`, not through a rewrite of this layout).
import type { CSSProperties } from 'react';
import { SkewBadge } from '../../components/SkewBadge';
import { TruthLabel, type Truth } from '../../components/TruthLabel';
import type { SceneMember } from '../../scene/crew';

export function CrewRail({ crew, activeId, onSelect }: { crew: readonly SceneMember[]; activeId: string | null; onSelect: (id: string) => void }) {
  return (
    <nav className="ship-rail" aria-label="Crew">
      <ol className="ship-rail-list">
        {crew.map((m) => (
          <li key={m.id}>
            <button type="button" className="ship-rail-item" data-active={m.id === activeId || undefined} aria-current={m.id === activeId ? 'true' : undefined} onClick={() => onSelect(m.id)} style={{ ['--c' as string]: m.pigment } as CSSProperties} data-testid={`crew-${m.id}`}>
              <span className="ship-rail-station num" aria-hidden="true">
                {m.station}
              </span>
              <span className="ship-rail-name">{m.name}</span>
              <span className="ship-rail-role muted">{m.role.title}</span>
              <span className="ship-rail-count num" aria-label={`${m.loadout.length} artifacts`}>
                {m.loadout.length}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function IdentityCard({ member, evidence }: { member: SceneMember; evidence?: string }) {
  return (
    <article className="ship-identity stack" style={{ ['--c' as string]: member.pigment } as CSSProperties} data-testid="identity-card">
      <header className="stack" style={{ gap: 'var(--s1)' }}>
        <div className="row" style={{ gap: 'var(--s2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <SkewBadge>Station {member.station}</SkewBadge>
          <TruthLabel truth="Verified" detail={evidence ? `agent ${member.agent}, ${evidence}` : `agent ${member.agent}`} />
        </div>
        <h2 className="section-title ship-identity-name">{member.name}</h2>
        <p className="muted sheet-line">{member.role.title}</p>
        {member.species && <p className="ship-identity-species">{member.species}</p>}
      </header>
      {member.essence && <p className="ship-identity-essence">{member.essence}</p>}
      {member.analogy && (
        <blockquote className="ship-identity-line">
          <p>“{member.analogy}”</p>
          <footer className="muted sheet-line">{member.plainMeaning}</footer>
        </blockquote>
      )}
      {(member.strengths.length > 0 || member.blindSpots.length > 0) && (
        <div className="ship-identity-grid">
          <Facet title="Strengths" items={member.strengths} />
          <Facet title="Blind spots (hypotheses)" items={member.blindSpots} truth="Simulated" />
          <Facet title="Motivations" items={member.motivations} />
          <Facet title="Growth paths" items={member.growthPaths} />
        </div>
      )}
    </article>
  );
}

function Facet({ title, items, truth = 'Simulated' }: { title: string; items: readonly string[]; truth?: Truth }) {
  if (items.length === 0) return null;
  return (
    <section className="ship-facet">
      <h3 className="label">
        {title} <TruthLabel truth={truth} />
      </h3>
      <ul className="ship-facet-list">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
