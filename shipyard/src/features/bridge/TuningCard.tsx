// v2 variants on the Bridge: how this ship spawns the selected member. The library agent is unchanged;
// the exported run plan asks for the tuned tier, and the kickoff quotes the addendum for that agent's
// phases. "Promote to library" is the only way an override reaches library/, through the Forge (dev).
// v3 (plan 13 § Bridge): the summary stays in the identity column; the editor is the always-open
// Tune Agent panel in the right column.
import { useId, useState, type CSSProperties, type Ref } from 'react';
import { Link } from 'react-router';
import { TruthLabel } from '../../components/TruthLabel';
import type { Member, MemberOverride, Ship } from '../../domain/schema';
import { ADDENDUM_MAX, effectiveModel } from '../../domain/variant';
import { useKb } from '../../kb/context';
import { useDispatch } from '../../store/context';
import { useNotify } from '../shared/notices';

/** The tuning summary in the identity column: what the exported plan asks for, and the Tune button. */
export function TuningCard({ ship, member, readOnly, onLocked, onTune }: { ship: Ship; member: Member; readOnly: boolean; onLocked: () => void; onTune: () => void }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const id = useId();
  const lib = idx.agent.get(member.agent)?.model ?? 'inherit';
  const runs = effectiveModel(idx, member);
  const o = member.override;
  const name = member.character.name;
  const reset = () => {
    dispatch({ type: 'crew/override', shipId: ship.id, member: member.id, override: null });
    notify(`${name} back to the library's settings.`, { undo: true });
  };
  return (
    <section className="tuning-card stack-sm" data-testid="tuning-card" data-tuned={o ? 'true' : undefined} aria-labelledby={`${id}-h`}>
      <div className="row tuning-head">
        <h3 id={`${id}-h`} className="label">
          Tuning on this crew member
        </h3>
        <TruthLabel truth="Verified" detail="what the exported run plan asks for" />
      </div>
      <p className="tuning-line" data-testid="tuning-model">
        Spawns at <strong>{runs}</strong>
        {o?.model ? <span className="muted"> · the library says {lib}</span> : <span className="muted"> · as the library says</span>}
      </p>
      {o?.addendum ? (
        <blockquote className="tuning-addendum" data-testid="tuning-addendum">
          {o.addendum}
        </blockquote>
      ) : (
        <p className="muted sheet-line">No addendum.</p>
      )}
      <p className="muted sheet-line" data-testid="tuning-judged">
        A dry run in the Regatta sees the tier only through its cost and the pre-flight rules (a critic below the builder&apos;s tier fails one), and cannot read an addendum; a live run judges both.{o?.addendum ? ' The addendum stays on this ship: Promote carries only the tier.' : ''}
      </p>
      <div className="row tuning-actions">
        <button type="button" className="btn btn-quiet tuning-go" data-testid="tune" onClick={() => (readOnly ? onLocked() : onTune())}>
          Tune {name}
        </button>
        {o && !readOnly && (
          <button type="button" className="btn btn-text btn-sm" data-testid="tune-reset" onClick={reset}>
            Reset to library
          </button>
        )}
        {o?.model && import.meta.env.DEV && (
          <Link className="btn btn-text btn-sm" to={`/forge?agent=${encodeURIComponent(member.agent)}&model=${o.model}`} data-testid="tune-promote">
            Promote {o.model} to the library…
          </Link>
        )}
      </div>
    </section>
  );
}

const TIER_ICON: Record<string, string> = {
  opus: 'M12 2l1.8 5.6L19.5 9l-5.7 1.6L12 16l-1.8-5.4L4.5 9l5.7-1.4zM18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z',
  sonnet: 'M20 4c-7 0-13 5-14 12l-2 4m16-16c0 8-5 13-12 13M9 13c2-2 5-4 8-5',
  haiku: 'M13 2L5 14h6l-1 8 8-12h-6z',
};

/**
 * The Tune Agent panel (v3, reference bridge-space-arcade.png): the model tier as three tiles, the
 * agent's skill route, the prompt addendum, Tune and Send to Regatta. On a template every gesture
 * opens the one-step Clone to edit dialog instead. Keyed by the caller on the override, so an undo
 * from the toast resets the form.
 */
export function TunePanel({ ship, member, readOnly, onLocked, addendumRef }: { ship: Ship; member: Member; readOnly: boolean; onLocked: () => void; addendumRef?: Ref<HTMLTextAreaElement> }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const id = useId();
  const agent = idx.agent.get(member.agent);
  const lib = agent?.model ?? 'inherit';
  const o = member.override;
  const [model, setModel] = useState<MemberOverride['model'] | ''>(o?.model ?? '');
  const [addendum, setAddendum] = useState(o?.addendum ?? '');
  const name = member.character.name;
  const runs = model || lib;
  const route = (agent?.routes ?? []).slice(0, 4);
  const guard = (fn: () => void) => () => (readOnly ? onLocked() : fn());
  return (
    <form
      className="tune-panel"
      data-testid="tuning-editor"
      aria-labelledby={`${id}-h`}
      onSubmit={(e) => {
        e.preventDefault();
        if (readOnly) return onLocked();
        const next: MemberOverride = { ...(model ? { model } : {}), ...(addendum.trim() ? { addendum } : {}) };
        dispatch({ type: 'crew/override', shipId: ship.id, member: member.id, override: Object.keys(next).length ? next : null });
        notify(`Tuned ${name} for ${ship.name}.`, { undo: true });
      }}
    >
      <h2 id={`${id}-h`} className="tune-title">
        Tune agent<span className="sr-only">: {name}</span>
      </h2>
      <fieldset className="tune-block">
        <legend className="ar-head tune-legend">
          Model tier <span className="tune-note">Spawns at {runs}</span>
        </legend>
        <div className="tune-tiers">
          {(['opus', 'sonnet', 'haiku'] as const).map((t) => {
            const isLib = t === lib;
            const checked = isLib ? !model : model === t;
            return (
              <label key={t} className="tune-tier" data-checked={checked || undefined}>
                <input type="radio" name={`${id}-tier`} checked={checked} onChange={guard(() => setModel(isLib ? '' : t))} data-testid={isLib ? 'tune-model-library' : `tune-model-${t}`} />
                <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={TIER_ICON[t]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <span className="tune-tier-name">{t}</span>
                {isLib && <span className="tune-tier-lib">Library</span>}
              </label>
            );
          })}
          {lib === 'inherit' && (
            <label className="tune-tier tune-tier-inherit" data-checked={!model || undefined}>
              <input type="radio" name={`${id}-tier`} checked={!model} onChange={guard(() => setModel(''))} data-testid="tune-model-library" />
              <span className="tune-tier-name">Inherit</span>
              <span className="tune-tier-lib">Library</span>
            </label>
          )}
        </div>
      </fieldset>
      {route.length > 0 && (
        <div className="tune-block">
          <h3 className="ar-head tune-legend">Skill route</h3>
          <ol className="tune-route" aria-label={`Skill route of ${name}`}>
            {route.map((sk, i) => {
              const art = idx.skill.get(sk)?.artifact;
              return (
                <li key={sk} data-core={i === 0 || undefined} style={{ ['--c' as string]: art?.pigment } as CSSProperties}>
                  <span className="tune-node" aria-hidden="true">
                    {i === 0 ? '★' : i + 1}
                  </span>
                  <span className="tune-node-name">
                    {art?.name ?? sk}
                    {i === 0 && ' (core)'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <label className="tune-block" htmlFor={`${id}-add`}>
        <span className="ar-head tune-legend">
          Prompt addendum <span className="tune-note">Optional</span>
        </span>
        <textarea
          ref={addendumRef}
          id={`${id}-add`}
          className="field tune-addendum"
          rows={4}
          maxLength={ADDENDUM_MAX}
          value={addendum}
          onChange={(e) => (readOnly ? onLocked() : setAddendum(e.target.value))}
          placeholder="No addendum."
          data-testid="tune-addendum"
          aria-describedby={`${id}-why`}
        />
        <span className="tune-count num">
          {addendum.length} / {ADDENDUM_MAX.toLocaleString('en')}
        </span>
      </label>
      <p id={`${id}-why`} className="muted sheet-line">
        Quoted in the kickoff prompt for this agent&rsquo;s phases. It cannot add an agent, a skill or a phase; pre-flight PF-16 says so if it tries.
      </p>
      <div className="tune-actions">
        <button type="submit" className="btn btn-quiet tune-save" data-testid="tune-save">
          Tune
        </button>
        <Link className="btn btn-primary tune-regatta" to={`/regatta?ships=${encodeURIComponent(ship.id)}`} data-testid="tune-to-regatta">
          <span className="tune-laurel" aria-hidden="true" />
          Send to Regatta
        </Link>
      </div>
    </form>
  );
}
