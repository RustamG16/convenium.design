// The Armory inspector (06 section 4.4): the artifact on a slow turntable (its own small canvas, only
// while an artifact is open; the large family glyph without WebGL), its lore and registry facts, who
// routes it, which slots it can fill and what that changes, "Equip to..." and "Copy skill path".
import { lazy, Suspense, useState, type CSSProperties } from 'react';
import { TruthLabel } from '../../components/TruthLabel';
import type { KbIndex } from '../../kb/artifacts';
import type { KbSkill } from '../../kb/schema';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { isFamilyId } from '../../scene/artifacts/families';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { useNotify } from '../shared/notices';
import { useEquip } from './equip';

const Inspector = lazy(() => import('../../scene/artifacts/ArtifactInspector').then((m) => ({ default: m.ArtifactInspector })));

export function ArtifactDetail({ idx, skill }: { idx: KbIndex; skill: KbSkill }) {
  const { target, openMenu, getShip } = useEquip();
  const notify = useNotify();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const a = skill.artifact;
  const tier = idx.kb.tiers.find((t) => t.id === a.tier);
  const webgl = hasWebGL() && !force2d() && !failed;
  const ship = target ? getShip(target.shipId) : undefined;
  const wearers = ship?.crew.filter((m) => m.loadout.some((e) => e.skill === skill.id)) ?? [];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(skill.skillPath);
      notify(`Copied ${skill.skillPath}`);
    } catch {
      setPath(skill.skillPath); // clipboard blocked: show the path to copy by hand
    }
  };
  return (
    <article className="art-detail stack" data-testid="art-detail" data-skill={skill.id} style={{ ['--c' as string]: a.pigment } as CSSProperties}>
      <div className="art-detail-view" data-testid="art-detail-view">
        {webgl ? (
          <Suspense fallback={<div className="art-detail-glyph" aria-hidden="true">{isFamilyId(a.family) && <FamilyGlyph family={a.family} pigment={a.pigment} />}</div>}>
            <Inspector artifact={{ skill: skill.id, family: a.family, pigment: a.pigment }} reduced={reduced} onContextLost={() => setFailed(true)} />
          </Suspense>
        ) : (
          <div className="art-detail-glyph" data-testid="art-detail-glyph" role="img" aria-label={`${a.familyName} glyph`}>
            {isFamilyId(a.family) && <FamilyGlyph family={a.family} pigment={a.pigment} />}
          </div>
        )}
      </div>
      <header className="stack-sm">
        <p className="label">{a.familyName} · <span data-rim={tier?.rim}>{tier?.label ?? a.tier}</span> <TruthLabel truth="Verified" detail="from the registry" /></p>
        <h2 className="card-title">{a.name}</h2>
        <code className="art-detail-id">{skill.id}</code>
        {a.lore && <p className="prose-sm">{a.lore}</p>}
      </header>
      <p className="prose-sm">{skill.description}</p>
      <dl className="art-facts">
        <dt>Phase</dt><dd>{skill.phase}</dd>
        <dt>Group</dt><dd>{skill.group}</dd>
        <dt>Category</dt><dd>{skill.category}</dd>
        <dt>Hosts</dt><dd>{skill.hosts.join(', ') || 'any'}</dd>
        <dt>Routed by</dt><dd>{skill.routedBy.length ? skill.routedBy.join(', ') : 'no agent (library or manual)'}</dd>
        <dt>Status</dt><dd>{skill.status}</dd>
      </dl>
      {skill.slots.length > 0 && (
        <section className="stack-sm" aria-label="Slots this skill can fill">
          <h3 className="label">Slots it can fill</h3>
          <ul className="plain-list">
            {skill.slots.map((s) => (
              <li key={s.slot}><strong>{idx.kb.slots.find((x) => x.id === s.slot)?.name ?? s.slot}</strong>: {s.changes}</li>
            ))}
          </ul>
        </section>
      )}
      {wearers.length > 0 && <p className="sheet-line" data-testid="worn-by">Worn by {wearers.map((m) => m.character.name).join(', ')} on {ship?.name}.</p>}
      <div className="row" style={{ gap: 'var(--s2)' }}>
        <button
          type="button"
          className="btn btn-primary"
          data-testid="detail-equip"
          disabled={!target}
          onClick={() => target && openMenu({ skill: skill.id, shipId: target.shipId, memberId: target.memberId })}
        >
          Equip to...
        </button>
        <button type="button" className="btn btn-quiet" onClick={copy} data-testid="copy-path">Copy skill path</button>
      </div>
      {!target && <p className="muted sheet-line">Choose a ship you can edit to equip this. A library ship is a template: clone it first.</p>}
      {path && <input className="field" readOnly value={path} aria-label="Skill path" onFocus={(e) => e.currentTarget.select()} data-testid="path-field" />}
    </article>
  );
}
