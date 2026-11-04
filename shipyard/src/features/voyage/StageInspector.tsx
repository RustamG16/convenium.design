// The selected stage (or gate), editable, with its run-plan row shown live as JSON (06 section 4.5).
// The active artifact is chosen from the stage member's worn loadout only (PF-03 makes that a rule);
// text fields commit on blur or Enter so one edit is one undo step, selects and toggles commit at once.
import { useState } from 'react';
import { Link } from 'react-router';
import { TruthLabel } from '../../components/TruthLabel';
import { buildRunPlan, ExportError } from '../../domain/export';
import { PHASE_IDS, type Gate, type Phase, type Ship, type Stage } from '../../domain/schema';
import type { StagePatch, GatePatch } from '../../domain/voyage';
import { useKb } from '../../kb/context';
import { useDispatch } from '../../store/context';

function CommitField({ label, value, onCommit, multiline, testId, hint }: { label: string; value: string; onCommit: (v: string) => void; multiline?: boolean; testId: string; hint?: string }) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  const commit = () => draft !== value && onCommit(draft);
  return (
    <label className="field-row">
      <span className="label">{label}</span>
      {multiline ? (
        <textarea className="field" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} data-testid={testId} />
      ) : (
        <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), e.preventDefault())} data-testid={testId} />
      )}
      {hint && <span className="muted sheet-line">{hint}</span>}
    </label>
  );
}

export function StageInspector({ ship, index }: { ship: Ship; index: number }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const item = ship.voyage[index];
  if (!item) return <p className="state-line">Pick a stage to edit it.</p>;
  const edit = (patch: StagePatch | GatePatch) => dispatch({ type: 'voyage/edit', shipId: ship.id, index, patch });

  if (item.kind === 'gate') return <GateForm gate={item} edit={edit} />;
  const stage: Stage = item;
  const member = ship.crew.find((m) => m.id === stage.member);
  const worn = member?.loadout ?? [];
  const wornHas = stage.activeSkill ? worn.some((e) => e.skill === stage.activeSkill) : true;
  let row: string;
  try {
    const plan = buildRunPlan(idx, ship, '<convenium_design>');
    row = JSON.stringify(plan.phases.find((p) => p.id === stage.id) ?? {}, null, 2);
  } catch (e) {
    row = e instanceof ExportError ? e.message : 'The run-plan row could not be built.';
  }
  return (
    <div className="stage-form stack" data-testid="stage-inspector" data-stage={stage.id}>
      <header>
        <p className="label">Stage {ship.voyage.slice(0, index + 1).filter((v) => v.kind === 'stage').length} · <code>{stage.id}</code></p>
        <h2 className="card-title">{stage.label}</h2>
      </header>
      <CommitField label="Label" value={stage.label} onCommit={(v) => edit({ label: v })} testId="stage-label" />
      <label className="field-row">
        <span className="label">Phase</span>
        <select className="field" value={stage.phase} onChange={(e) => edit({ phase: e.target.value as Phase })} data-testid="stage-phase">
          {PHASE_IDS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="field-row">
        <span className="label">Crew member</span>
        <select className="field" value={stage.member} onChange={(e) => edit({ member: e.target.value, activeSkill: null })} data-testid="stage-member">
          {!member && <option value={stage.member}>{stage.member} (not aboard)</option>}
          {ship.crew.map((m) => <option key={m.id} value={m.id}>{m.character.name} ({m.agent})</option>)}
        </select>
        <span className="muted sheet-line">Changing the member clears the active artifact: it must be one they wear.</span>
      </label>
      <label className="field-row">
        <span className="label">Active artifact (one per stage)</span>
        <select className="field" value={stage.activeSkill ?? ''} onChange={(e) => edit({ activeSkill: e.target.value || null })} data-testid="stage-skill">
          <option value="">None: the stage opens no skill</option>
          {!wornHas && stage.activeSkill && <option value={stage.activeSkill}>{stage.activeSkill} (not worn)</option>}
          {worn.map((e) => <option key={e.skill} value={e.skill}>{idx.skill.get(e.skill)?.artifact.name ?? e.skill} · {e.skill}</option>)}
        </select>
        {!wornHas && member && (
          <span className="sheet-line" role="note" data-testid="stage-skill-warning">
            {member.character.name} does not wear it. <Link to={`/ship/${ship.id}/bridge?member=${member.id}`}>Equip it on the bridge</Link> or pick one they wear.
          </span>
        )}
        {worn.length === 0 && member && <span className="muted sheet-line">{member.character.name} wears nothing yet; equip something first.</span>}
      </label>
      <CommitField label="Outputs (one per line)" value={stage.outputs.join('\n')} multiline testId="stage-outputs" onCommit={(v) => edit({ outputs: v.split('\n') })} hint="At least one." />
      <CommitField label="Inputs (one per line)" value={(stage.inputs ?? []).join('\n')} multiline testId="stage-inputs" onCommit={(v) => edit({ inputs: v.split('\n').map((x) => x.trim()).filter(Boolean) })} />
      <CommitField label="Stop condition" value={stage.stop} testId="stage-stop" onCommit={(v) => edit({ stop: v })} />
      <label className="menu-radio">
        <input type="checkbox" checked={stage.parallel === true} onChange={(e) => edit({ parallel: e.target.checked })} data-testid="stage-parallel" />
        <span>Runs in parallel with its neighbours</span>
      </label>
      {(ship.trail === 'fleet' || stage.wave !== undefined) && (
        <label className="field-row">
          <span className="label">Wave</span>
          <input className="field" type="number" min={0} value={stage.wave ?? 0} onChange={(e) => edit({ wave: Number(e.target.value) })} data-testid="stage-wave" />
        </label>
      )}
      <section className="stack-sm" aria-label="Run plan row">
        <h3 className="label">Its run-plan row <TruthLabel truth="Verified" detail="what exports" /></h3>
        <pre className="runplan-row" data-testid="runplan-row">{row}</pre>
      </section>
    </div>
  );
}

function GateForm({ gate, edit }: { gate: Gate; edit: (p: GatePatch) => void }) {
  return (
    <div className="stage-form stack" data-testid="gate-inspector">
      <header>
        <p className="label">Gate</p>
        <h2 className="card-title">Gate {gate.gate}</h2>
      </header>
      <label className="field-row">
        <span className="label">Letter or number</span>
        <select className="field" value={gate.gate} onChange={(e) => edit({ gate: e.target.value })} data-testid="gate-letter">
          {[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <CommitField label="What the owner decides" value={gate.label} onCommit={(v) => edit({ label: v })} testId="gate-label" />
      <p className="muted sheet-line">A gate stops the run until the owner decides. Pre-flight checks that the trail has the gates it needs, in order.</p>
    </div>
  );
}
