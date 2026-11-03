// DOM pieces of the crew profile: the crew rail and the identity card. 3D lives in src/scene; these
// render the same data without it. Ported from ArkhEthos `ShipCards.tsx`: the identity card keeps
// its anatomy (station badge, truth line, name, role, species, essence, quote, four facets); the
// briefed checklist became the Codex line (T6 adds the edit mode: name, species, essence, body,
// pigment, glyph go through `editing`, not through a rewrite of this layout).
import { useState, type CSSProperties } from 'react';
import { BODY_IDS, type Character } from '../../domain/schema';
import { MAX_CREW, SWATCHES, stagesOwnedBy } from '../../domain/crew';
import type { Ship } from '../../domain/schema';
import { useDispatch } from '../../store/context';
import { useNotify } from '../shared/notices';
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

export function IdentityCard({ member, evidence, access, model }: { member: SceneMember; evidence?: string; access?: string; model?: string }) {
  return (
    <article className="ship-identity stack" style={{ ['--c' as string]: member.pigment } as CSSProperties} data-testid="identity-card">
      <header className="stack" style={{ gap: 'var(--s1)' }}>
        <div className="row" style={{ gap: 'var(--s2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <SkewBadge>Station {member.station}</SkewBadge>
          <TruthLabel truth="Verified" detail={evidence ? `agent ${member.agent}, ${evidence}` : `agent ${member.agent}`} />
        </div>
        <h2 className="section-title ship-identity-name">{member.name}</h2>
        <p className="muted sheet-line">{member.role.title}</p>
        <p className="agent-chip" data-testid="agent-chip">
          <code>{member.agent}</code>
          {access && <span>{access === 'write' ? 'Can write files' : 'Read-only'}</span>}
          {model && <span>Model tier: {model}</span>}
          <TruthLabel truth="Verified" detail="from the agent file" />
        </p>
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

const BODY_LABEL: Record<Character['body'], string> = { captain: 'Captain', strategist: 'Strategist', analyst: 'Analyst', critic: 'Critic', engineer: 'Engineer', producer: 'Producer', metrics: 'Metrics', standin: 'Stand-in' };

/** Edit mode: one draft, one Save (one undo step). The runtime agent is not editable here: it is what the ship runs. */
export function IdentityEditor({ ship, member, onDone }: { ship: Ship; member: SceneMember; onDone: () => void }) {
  const dispatch = useDispatch();
  const notify = useNotify();
  const [d, setD] = useState({ name: member.name, species: member.species, essence: member.essence, analogy: member.analogy, glyph: member.glyph, body: member.body as Character['body'], pigment: member.pigment });
  const [station, setStation] = useState(member.station);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="ship-identity ship-edit stack"
      data-testid="identity-editor"
      style={{ ['--c' as string]: d.pigment } as CSSProperties}
      onSubmit={(e) => {
        e.preventDefault();
        if (!d.name.trim()) return;
        dispatch({ type: 'crew/edit', shipId: ship.id, member: member.id, patch: d });
        if (station !== member.station) dispatch({ type: 'crew/station', shipId: ship.id, member: member.id, station });
        notify(`Saved ${d.name.trim()}.`, { undo: true });
        onDone();
      }}
    >
      <p className="label">Editing {member.name} <TruthLabel truth="Verified" detail={`agent ${member.agent} stays`} /></p>
      <label className="field-row"><span className="label">Name</span><input className="field" required maxLength={40} value={d.name} onChange={(e) => set('name', e.target.value)} data-testid="edit-name" /></label>
      <label className="field-row"><span className="label">Species</span><input className="field" maxLength={160} value={d.species} onChange={(e) => set('species', e.target.value)} data-testid="edit-species" /></label>
      <label className="field-row"><span className="label">Essence</span><textarea className="field" rows={3} maxLength={400} value={d.essence} onChange={(e) => set('essence', e.target.value)} data-testid="edit-essence" /></label>
      <label className="field-row"><span className="label">Analogy</span><input className="field" maxLength={200} value={d.analogy} onChange={(e) => set('analogy', e.target.value)} data-testid="edit-analogy" /></label>
      <label className="field-row"><span className="label">Glyph (up to 4 characters)</span><input className="field" maxLength={4} value={d.glyph} onChange={(e) => set('glyph', e.target.value)} data-testid="edit-glyph" /></label>
      <fieldset className="menu-group"><legend className="label">Body</legend>
        <div className="choice-row">
          {BODY_IDS.map((b) => (
            <label key={b} className="choice"><input type="radio" name="body" checked={d.body === b} onChange={() => set('body', b)} data-testid={`edit-body-${b}`} /><span>{BODY_LABEL[b]}</span></label>
          ))}
        </div>
      </fieldset>
      <fieldset className="menu-group"><legend className="label">Pigment</legend>
        <div className="choice-row">
          {SWATCHES.map((c, i) => (
            <label key={c} className="swatch" style={{ ['--sw' as string]: c } as CSSProperties}>
              <input type="radio" name="pigment" checked={d.pigment.toUpperCase() === c} onChange={() => set('pigment', c)} aria-label={`Pigment ${i + 1}, ${c}`} data-testid={`edit-pigment-${i}`} />
              <span aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field-row"><span className="label">Station (1 to {MAX_CREW})</span>
        <select className="field" value={station} onChange={(e) => setStation(Number(e.target.value))} data-testid="edit-station">
          {Array.from({ length: MAX_CREW }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}{ship.crew.find((m) => m.station === n && m.id !== member.id) ? ` (swaps with ${ship.crew.find((m) => m.station === n)!.character.name})` : ''}</option>)}
        </select>
      </label>
      <div className="row" style={{ gap: 'var(--s2)' }}>
        <button type="submit" className="btn btn-primary" data-testid="edit-save">Save</button>
        <button type="button" className="btn btn-quiet" onClick={onDone} data-testid="edit-cancel">Cancel</button>
      </div>
    </form>
  );
}

export function DismissButton({ ship, member }: { ship: Ship; member: SceneMember }) {
  const dispatch = useDispatch();
  const notify = useNotify();
  const owned = stagesOwnedBy(ship, member.id);
  const [armed, setArmed] = useState(false);
  if (ship.crew.length <= 1) return <p className="muted sheet-line">A ship keeps at least one crew member.</p>;
  if (!armed) return <button type="button" className="btn btn-quiet" onClick={() => setArmed(true)} data-testid="dismiss">Dismiss {member.name}</button>;
  return (
    <div className="stack-sm" data-testid="dismiss-confirm">
      <p className="sheet-line">{member.name}&rsquo;s artifacts go to the hold.{owned > 0 ? ` ${owned} stage${owned === 1 ? '' : 's'} will need a new member; pre-flight names them.` : ''} You can undo this.</p>
      <div className="row" style={{ gap: 'var(--s2)' }}>
        <button type="button" className="btn btn-primary" data-testid="dismiss-yes" onClick={() => { dispatch({ type: 'crew/dismiss', shipId: ship.id, member: member.id }); notify(`${member.name} dismissed.`, { undo: true }); }}>Dismiss</button>
        <button type="button" className="btn btn-quiet" onClick={() => setArmed(false)}>Keep</button>
      </div>
    </div>
  );
}

