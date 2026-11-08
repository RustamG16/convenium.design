// v2 variants on the Bridge: how this ship spawns the selected member. The library agent is unchanged;
// the exported run plan asks for the tuned tier, and the kickoff quotes the addendum for that agent's
// phases. "Promote to library" is the only way an override reaches library/, through the Forge (dev).
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { TruthLabel } from '../../components/TruthLabel';
import type { Member, MemberOverride, Ship } from '../../domain/schema';
import { ADDENDUM_MAX, effectiveModel } from '../../domain/variant';
import { useKb } from '../../kb/context';
import { useDispatch } from '../../store/context';
import { useNotify } from '../shared/notices';

const TIERS = ['opus', 'sonnet', 'haiku'] as const;

export function TuningCard({ ship, member, readOnly, onLocked }: { ship: Ship; member: Member; readOnly: boolean; onLocked: () => void }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const id = useId();
  const lib = idx.agent.get(member.agent)?.model ?? 'inherit';
  const runs = effectiveModel(idx, member);
  const o = member.override;
  const [editing, setEditing] = useState(false);
  const [model, setModel] = useState<MemberOverride['model'] | ''>(o?.model ?? '');
  const [addendum, setAddendum] = useState(o?.addendum ?? '');
  const name = member.character.name;

  const save = (next: MemberOverride | null, message: string) => {
    dispatch({ type: 'crew/override', shipId: ship.id, member: member.id, override: next });
    notify(message, { undo: true });
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <form
        className="tuning-card stack-sm"
        data-testid="tuning-editor"
        onSubmit={(e) => {
          e.preventDefault();
          save({ ...(model ? { model } : {}), ...(addendum.trim() ? { addendum } : {}) }, `Tuned ${name} for ${ship.name}.`);
        }}
      >
        <p className="label">Tune {name} for this ship</p>
        <fieldset className="menu-group">
          <legend className="label">Spawn at</legend>
          <div className="choice-row">
            <label className="choice">
              <input type="radio" name={`${id}-tier`} checked={!model} onChange={() => setModel('')} data-testid="tune-model-library" /> Library ({lib})
            </label>
            {TIERS.filter((t) => t !== lib).map((t) => (
              <label key={t} className="choice">
                <input type="radio" name={`${id}-tier`} checked={model === t} onChange={() => setModel(t)} data-testid={`tune-model-${t}`} /> {t}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field-row" htmlFor={`${id}-add`}>
          <span className="label">
            Addendum <span className="muted">· {addendum.length} of {ADDENDUM_MAX}</span>
          </span>
          <textarea id={`${id}-add`} className="field" rows={3} maxLength={ADDENDUM_MAX} value={addendum} onChange={(e) => setAddendum(e.target.value)} placeholder="For example: keep every motion under 300 ms." data-testid="tune-addendum" aria-describedby={`${id}-why`} />
        </label>
        <p id={`${id}-why`} className="muted sheet-line">
          Quoted in the kickoff prompt for this agent&rsquo;s phases. It cannot add an agent, a skill or a phase; pre-flight PF-16 says so if it tries.
        </p>
        <div className="row" style={{ gap: 'var(--s2)' }}>
          <button type="submit" className="btn btn-primary" data-testid="tune-save">
            Save tuning
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className="tuning-card stack-sm" data-testid="tuning-card" data-tuned={o ? 'true' : undefined} aria-labelledby={`${id}-h`}>
      <div className="row tuning-head">
        <h3 id={`${id}-h`} className="label">
          Tuning on this ship
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
        A dry run in the Regatta sees the tier only through its cost and the pre-flight rules (a critic below the builder's tier fails one), and cannot read an addendum; a live run judges both.{o?.addendum ? ' The addendum stays on this ship: Promote carries only the tier.' : ''}
      </p>
      <div className="row tuning-actions">
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          data-testid="tune"
          onClick={() => {
            if (readOnly) return onLocked();
            setModel(o?.model ?? '');
            setAddendum(o?.addendum ?? '');
            setEditing(true);
          }}
        >
          Tune {name}
        </button>
        {o && !readOnly && (
          <button type="button" className="btn btn-text btn-sm" data-testid="tune-reset" onClick={() => save(null, `${name} back to the library's settings.`)}>
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
