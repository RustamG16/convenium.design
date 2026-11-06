// The Armory inspector (06 section 4.4): the artifact on a slow turntable (its own small canvas, only
// while an artifact is open; the large family glyph without WebGL), its lore and registry facts, who
// routes it, which slots it can fill and what that changes, "Equip to..." and "Copy skill path".
import { lazy, Suspense, useRef, useState, type CSSProperties } from 'react';
import { TruthLabel } from '../../components/TruthLabel';
import type { KbIndex } from '../../kb/artifacts';
import type { KbSkill } from '../../kb/schema';
import { Flip, gsap, useGSAP } from '../../lib/gsap';
import { easeDefault, isReducedMotion, MOTION, recordMotion } from '../../lib/motion';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { isFamilyId } from '../../scene/artifacts/families';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { useStoreState } from '../../store/context';
import { useNotify } from '../shared/notices';
import { compareEquip } from './compare';
import { useEquip } from './equip';

const Inspector = lazy(() => import('../../scene/artifacts/ArtifactInspector').then((m) => ({ default: m.ArtifactInspector })));

export function ArtifactDetail({ idx, skill }: { idx: KbIndex; skill: KbSkill }) {
  const { target, openMenu, getShip, requestEquip } = useEquip();
  const notify = useNotify();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  // Grid -> inspector: the card's tile travels to the inspector's tile (GSAP Flip, 240 ms, the default ease).
  // Reduced motion: it simply appears there. Interruptible: a new selection remounts this and kills the tween.
  useGSAP(
    () => {
      const tile = root.current?.querySelector<HTMLElement>('[data-testid="detail-tile"]');
      const card = document.querySelector<HTMLElement>(`[data-testid="art-grid"] [data-skill="${CSS.escape(skill.id)}"] .art-card-tile`);
      if (!tile || !card || isReducedMotion()) return;
      gsap.set(tile, { clearProps: 'transform' });
      const natural = Flip.getState(tile);
      Flip.fit(tile, card, { scale: true });
      tile.setAttribute('data-flipping', '');
      Flip.from(natural, { duration: MOTION.panel / 1000, ease: easeDefault, scale: true, onComplete: () => {
          tile.removeAttribute('data-flipping');
          gsap.set(tile, { clearProps: 'transform' });
        },
      });
      recordMotion('flip', MOTION.panel, { skill: skill.id });
      return () => {
        tile.removeAttribute('data-flipping');
        gsap.set(tile, { clearProps: 'transform' });
      };
    },
    { scope: root, dependencies: [skill.id] },
  );
  const a = skill.artifact;
  const tier = idx.kb.tiers.find((t) => t.id === a.tier);
  const webgl = hasWebGL() && !force2d() && !failed;
  // Subscribe to the store so the compare strip and "worn by" follow an equip made from this very panel.
  const { ships: stored } = useStoreState();
  const ship = target ? (stored.find((s) => s.id === target.shipId) ?? getShip(target.shipId)) : undefined;
  const wearers = ship?.crew.filter((m) => m.loadout.some((e) => e.skill === skill.id)) ?? [];
  const member = ship?.crew.find((m) => m.id === target?.memberId);
  const cmp = ship && member ? compareEquip(idx, ship, member.id, skill.id) : null;
  const anchorLabel = cmp?.anchor ? idx.kb.anchors[cmp.anchor].label : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(skill.skillPath);
      notify(`Copied ${skill.skillPath}`);
    } catch {
      setPath(skill.skillPath); // clipboard blocked: show the path to copy by hand
    }
  };
  return (
    <article ref={root} className="art-detail stack" data-testid="art-detail" data-skill={skill.id} style={{ ['--c' as string]: a.pigment } as CSSProperties}>
      <header className="stack-sm">
        <p className="label">{a.familyName} · <span data-rim={tier?.rim}>{tier?.label ?? a.tier}</span> <TruthLabel truth="Verified" detail="from the registry" /></p>
        <div className="art-detail-title">
          <span className="art-detail-tile" data-testid="detail-tile" aria-hidden="true">{isFamilyId(a.family) && <FamilyGlyph family={a.family} pigment={a.pigment} />}</span>
          <h2 className="card-title">{a.name}</h2>
        </div>
        <code className="art-detail-id">{skill.id}</code>
        {a.lore && <p className="prose-sm">{a.lore}</p>}
      </header>
      <section className="art-compare" data-testid="art-compare" aria-label="What equipping does">
        {!member || !cmp ? (
          <p className="muted sheet-line">Choose a ship you can edit to equip this. A library ship is a template: clone it first.</p>
        ) : cmp.already ? (
          <p className="sheet-line" data-testid="compare-line">{member.character.name} already carries this.</p>
        ) : cmp.error ? (
          <p className="sheet-line" data-testid="compare-line">{cmp.error}</p>
        ) : (
          <>
            <p className="sheet-line" data-testid="compare-place">
              {cmp.replaces ? <>Replaces <strong>{idx.skill.get(cmp.replaces)?.artifact.name ?? cmp.replaces}</strong> on {anchorLabel}.</> : <>Fills an empty socket: {anchorLabel}.</>}
            </p>
            <p className="sheet-line" data-testid="compare-preflight">
              {cmp.addsBlockers + cmp.addsWarnings === 0
                ? `Pre-flight: no change.${cmp.reasons.length ? ` Note: ${cmp.reasons.join(', ')}.` : ''}`
                : `Pre-flight: adds ${cmp.addsBlockers ? `${cmp.addsBlockers} ${cmp.addsBlockers === 1 ? 'blocker' : 'blockers'}` : `${cmp.addsWarnings} ${cmp.addsWarnings === 1 ? 'warning' : 'warnings'}`}${cmp.reasons.length ? `: ${cmp.reasons.join(', ')}` : ''}.`}
            </p>
          </>
        )}
        <div className="row" style={{ gap: 'var(--s2)' }}>
          <button
            type="button"
            className={target ? 'btn btn-primary' : 'btn btn-quiet'}
            data-testid="detail-equip"
            disabled={!target || Boolean(cmp?.already)}
            onClick={() => target && cmp?.anchor && requestEquip({ shipId: target.shipId, memberId: target.memberId, skill: skill.id, anchor: cmp.anchor })}
          >
            Equip to {member?.character.name ?? 'a crew member'}
          </button>
          <button type="button" className="btn btn-quiet" data-testid="detail-equip-menu" disabled={!target} onClick={() => target && openMenu({ skill: skill.id, shipId: target.shipId, memberId: target.memberId })}>
            Choose a socket
          </button>
        </div>
      </section>
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
      <button type="button" className="btn btn-text" onClick={copy} data-testid="copy-path">Copy skill path</button>
      {path && <input className="field" readOnly value={path} aria-label="Skill path" onFocus={(e) => e.currentTarget.select()} data-testid="path-field" />}
    </article>
  );
}
