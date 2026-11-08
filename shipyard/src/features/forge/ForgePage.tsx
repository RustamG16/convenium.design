// `#/forge` — v2 write-back (owner decision 2026-11-08). The one path from Shipyard into library/:
// pick an agent or a skill from the rack (or start a new one), edit it at the bench, read the exact diff,
// then apply. The dev server writes the files, runs project.py all and verify.py, rolls back on any
// failure and never commits. The live library (T18) then swaps the new knowledge base in, so the rest
// of the app shows the change without a reload. The deployed build is read-only and says so.
import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import '../../styles/forge.css';
import { useKb } from '../../kb/context';
import type { KbAgent, KbCrew } from '../../kb/schema';
import { apply, categories, FORGE_AVAILABLE, ForgeProblem, MODELS, PHASES, preview, type AgentPayload, type ApplyOutcome, type ForgeRequest, type Preview, type SkillPayload } from './forgeApi';

const NEW = '__new__';
const SLUG = /^[a-z][a-z0-9-]{1,47}$/;

type Bench = { step: 'edit' } | { step: 'previewing' } | { step: 'preview'; preview: Preview } | { step: 'applying'; preview: Preview } | { step: 'done'; outcome: ApplyOutcome };

/** Preview → apply, shared by both tabs. `request` is null while the form is not ready to send. */
function Workbench({ request, problems: formProblems, onApplied, children }: { request: ForgeRequest | null; problems: string[]; onApplied: (o: ApplyOutcome) => void; children: ReactNode }) {
  const [bench, setBench] = useState<Bench>({ step: 'edit' });
  const [problems, setProblems] = useState<string[]>([]);
  const busy = bench.step === 'previewing' || bench.step === 'applying';

  const doPreview = async () => {
    if (!request) return;
    setProblems([]);
    setBench({ step: 'previewing' });
    try {
      setBench({ step: 'preview', preview: await preview(request) });
    } catch (e) {
      setProblems(e instanceof ForgeProblem ? e.problems : [String(e)]);
      setBench({ step: 'edit' });
    }
  };
  const doApply = async (p: Preview) => {
    setProblems([]);
    setBench({ step: 'applying', preview: p });
    try {
      const outcome = await apply(p.token);
      // success is shown by the page (this bench remounts when the new library arrives); a rollback stays here
      if (outcome.ok) {
        setBench({ step: 'edit' });
        onApplied(outcome);
      } else setBench({ step: 'done', outcome });
    } catch (e) {
      setProblems(e instanceof ForgeProblem ? e.problems : [String(e)]);
      setBench({ step: 'preview', preview: p });
    }
  };

  if (bench.step === 'done') return <Outcome outcome={bench.outcome} onClose={() => setBench({ step: 'edit' })} />;

  if (bench.step === 'preview' || bench.step === 'applying') {
    const p = bench.preview;
    return (
      <section className="forge-preview" data-testid="forge-preview">
        <h3 className="forge-step-title">The change, exactly</h3>
        <ul className="forge-files">
          {p.files.map((f) => (
            <li key={f.path} data-action={f.action}>
              <span className="forge-action">{f.action}</span> <code>{f.path}</code>
            </li>
          ))}
        </ul>
        {p.dirty.length > 0 && (
          <p className="forge-warn" role="alert">
            {p.dirty.join(', ')} {p.dirty.length === 1 ? 'has' : 'have'} uncommitted edits that are not the Forge’s. Apply will refuse until they are committed or discarded.
          </p>
        )}
        <DiffView diff={p.diff} />
        <Problems problems={problems} />
        <div className="forge-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => doApply(p)} data-testid="forge-apply">
            {bench.step === 'applying' ? 'Applying: project.py all, then verify.py…' : 'Apply to library/'}
          </button>
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => setBench({ step: 'edit' })}>
            Edit again
          </button>
        </div>
      </section>
    );
  }

  const all = [...formProblems, ...problems];
  return (
    <>
      {children}
      <Problems problems={all} />
      <div className="forge-actions">
        <button type="button" className="btn btn-primary" disabled={!request || busy} onClick={doPreview} data-testid="forge-preview-btn">
          {bench.step === 'previewing' ? 'Rendering the diff…' : 'Preview the change'}
        </button>
        <span className="prose-sm forge-hint">Nothing is written until you apply.</span>
      </div>
    </>
  );
}

function Outcome({ outcome: o, onClose }: { outcome: ApplyOutcome; onClose: () => void }) {
  return (
    <section className="forge-result" data-testid="forge-result" data-ok={o.ok} role="status">
      <h3 className="forge-step-title">{o.ok ? 'Applied to library/' : 'Refused and rolled back'}</h3>
      <p className="prose-sm">
        {o.ok
          ? 'project.py all and verify.py passed. Nothing was committed: review the change with git diff, then commit it yourself. The library banner says when the new knowledge base is live.'
          : 'verify.py or the generator refused the change, so every file was restored to its exact earlier bytes and the generated trees were rebuilt. The log says why.'}
      </p>
      {o.stat && <pre className="forge-pre" data-testid="forge-stat">{o.stat}</pre>}
      <details className="forge-log">
        <summary>Generator and verify log</summary>
        <pre className="forge-pre">{[o.project, o.verify].filter(Boolean).join('\n\n')}</pre>
      </details>
      <button type="button" className="btn btn-quiet" onClick={onClose} data-testid="forge-again">
        {o.ok ? 'Dismiss' : 'Back to the bench'}
      </button>
    </section>
  );
}

function Problems({ problems }: { problems: string[] }) {
  if (!problems.length) return null;
  return (
    <ul className="forge-problems" role="alert" data-testid="forge-problems">
      {problems.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

function DiffView({ diff }: { diff: string }) {
  const lines = diff.split('\n');
  return (
    <div className="forge-diff-wrap">
      <pre className="forge-diff" data-testid="forge-diff" tabIndex={0} aria-label="Unified diff of the change">
        {lines.map((l, i) => {
          const kind = l.startsWith('+++') || l.startsWith('---') ? 'file' : l.startsWith('@@') ? 'hunk' : l.startsWith('+') ? 'add' : l.startsWith('-') ? 'del' : 'ctx';
          return (
            <span key={i} className="forge-line" data-kind={kind}>
              {l || ' '}
              {'\n'}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field-row">
      <label htmlFor={id} className="forge-label">
        {label}
        {hint && <span className="forge-label-hint"> {hint}</span>}
      </label>
      {children(id)}
    </div>
  );
}

/* ----------------------------------------------------------------------------------------- agents */

function blankAgent(): AgentPayload {
  return { id: '', description: '', model: 'sonnet', access: 'read-only', routes: [], phase: null, priority: null, activateWhen: '', contract: '', crew: { id: '', name: '', title: '', pigment: '#9FC7C0', glyph: '', species: '', essence: '' } };
}

function agentFrom(a: KbAgent, c: KbCrew | undefined): AgentPayload {
  const phase = a.phase;
  return {
    id: a.id,
    description: a.description,
    model: a.model,
    access: a.access,
    routes: [...a.routes],
    phase,
    priority: phase ? a.priority : null,
    activateWhen: a.activateWhen,
    contract: '',
    crew: { id: c?.id ?? a.id.slice(0, 32), name: c?.name ?? a.id, title: c?.role.title ?? '', pigment: c?.pigment ?? '#9FC7C0', glyph: c?.glyph ?? '', species: c?.species ?? '', essence: c?.essence ?? '' },
  };
}

function RoutePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const idx = useKb();
  const [q, setQ] = useState('');
  // the Forge refuses a route that is a stub or not projected to both hosts, so the picker never offers one
  const routable = useMemo(() => idx.kb.skills.filter((s) => s.status !== 'stub' && s.hosts.includes('claude') && s.hosts.includes('codex')), [idx]);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return routable.filter((s) => !n || s.id.includes(n) || s.name.toLowerCase().includes(n) || s.group.toLowerCase().includes(n)).slice(0, 60);
  }, [routable, q]);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="forge-routes">
      {value.length > 0 && (
        <ul className="chips" aria-label="Chosen routes">
          {value.map((r) => (
            <li key={r}>
              <button type="button" className="chip forge-chip" onClick={() => toggle(r)} aria-label={`Remove route ${r}`}>
                {r} <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${routable.length} routable skills`} aria-label="Search skills to route" data-testid="forge-route-search" />
      <div className="forge-route-list" role="group" aria-label="Routable skills">
        {shown.map((s) => (
          <label key={s.id} className="forge-route">
            <input type="checkbox" checked={value.includes(s.id)} onChange={() => toggle(s.id)} />
            <span>
              <code>{s.id}</code> <span className="forge-route-meta">{s.group} · {s.phase}</span>
            </span>
          </label>
        ))}
        {shown.length === 0 && <p className="prose-sm">No routable skill matches.</p>}
      </div>
    </div>
  );
}

function AgentBench({ selected, onSelect, onApplied }: { selected: string; onSelect: (id: string) => void; onApplied: (o: ApplyOutcome) => void }) {
  const idx = useKb();
  const crewByAgent = useMemo(() => new Map(idx.kb.crew.map((c) => [c.role.agent, c])), [idx]);
  const isNew = selected === NEW;
  const source = isNew ? null : idx.agent.get(selected) ?? null;
  const [form, setForm] = useState<AgentPayload>(() => (source ? agentFrom(source, crewByAgent.get(source.id)) : blankAgent()));
  const waiting = !isNew && !source;
  const [confirm, setConfirm] = useState('');
  const [mode, setMode] = useState<'edit' | 'delete'>('edit');
  const set = <K extends keyof AgentPayload>(k: K, v: AgentPayload[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setCrew = <K extends keyof AgentPayload['crew']>(k: K, v: AgentPayload['crew'][K]) => setForm((f) => ({ ...f, crew: { ...f.crew, [k]: v } }));

  const problems: string[] = [];
  if (mode === 'edit') {
    if (!SLUG.test(form.id)) problems.push('Agent id: a slug of 2–48 characters (a–z, 0–9, -), starting with a letter.');
    if (form.description.trim().length < 12) problems.push('Description: at least 12 characters.');
    if (isNew && !/^[a-z][a-z0-9-]{1,31}$/.test(form.crew.id)) problems.push('Crew id: a slug of 2–32 characters.');
    if (!form.crew.name.trim() || !form.crew.title.trim()) problems.push('Crew name and title are required.');
  }
  if (waiting) return <p className="state-line" role="status">Waiting for the new library to load…</p>;
  const request: ForgeRequest | null =
    mode === 'delete'
      ? source && confirm === source.id
        ? { kind: 'agent', op: 'delete', payload: { id: source.id, confirm } }
        : null
      : problems.length
        ? null
        : { kind: 'agent', op: isNew ? 'create' : 'update', payload: { ...form, priority: form.phase ? form.priority ?? 50 : null } };

  return (
    <Workbench request={request} problems={mode === 'edit' && form.id ? problems : []} onApplied={(o) => {
        onApplied(o);
        onSelect(mode === 'delete' ? NEW : form.id);
      }}>
      <div className="forge-bench-head">
        <span className="forge-swatch" style={{ ['--c' as string]: form.crew.pigment } as CSSProperties} aria-hidden="true">
          {form.crew.glyph || form.crew.name.slice(0, 1) || '+'}
        </span>
        <div>
          <h3 className="forge-step-title">{isNew ? 'New agent' : form.crew.name || form.id}</h3>
          <p className="prose-sm">{isNew ? 'Writes library/agents/<id>.md and one crew member at the next free station.' : `library/agents/${form.id}.md · the hand-written body is kept`}</p>
        </div>
        {!isNew && (
          <div className="choice-row forge-mode" role="radiogroup" aria-label="What to do">
            <label className="choice">
              <input type="radio" name="agent-mode" checked={mode === 'edit'} onChange={() => setMode('edit')} /> Edit
            </label>
            <label className="choice">
              <input type="radio" name="agent-mode" checked={mode === 'delete'} onChange={() => setMode('delete')} data-testid="forge-mode-delete" /> Delete
            </label>
          </div>
        )}
      </div>

      {mode === 'delete' && source ? (
        <Field label={`Type ${source.id} to delete it`} hint="Refused while a library workflow still crews it.">
          {(id) => <input id={id} className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" data-testid="forge-confirm" />}
        </Field>
      ) : (
        <div className="forge-form">
          <fieldset className="forge-set">
            <legend>The agent</legend>
            <Field label="Id" hint={isNew ? 'the file name; cannot change later' : undefined}>
              {(id) => <input id={id} className="field" value={form.id} disabled={!isNew} onChange={(e) => set('id', e.target.value.trim())} autoComplete="off" data-testid="forge-agent-id" />}
            </Field>
            <Field label="Description" hint="when to use it, in one or two sentences">
              {(id) => <textarea id={id} className="field" value={form.description} onChange={(e) => set('description', e.target.value)} data-testid="forge-agent-description" />}
            </Field>
            <div className="field-row">
              <span className="forge-label">Model tier</span>
              <div className="choice-row" role="radiogroup" aria-label="Model tier">
                {MODELS.map((m) => (
                  <label key={m} className="choice">
                    <input type="radio" name="agent-model" checked={form.model === m} onChange={() => set('model', m)} /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="field-row">
              <span className="forge-label">Access</span>
              <div className="choice-row" role="radiogroup" aria-label="Access">
                {(['read-only', 'write'] as const).map((a) => (
                  <label key={a} className="choice">
                    <input type="radio" name="agent-access" checked={form.access === a} onChange={() => set('access', a)} /> {a}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="forge-set">
            <legend>Routes and activation</legend>
            <div className="field-row">
              <span className="forge-label">Skills it opens ({form.routes.length})</span>
              <RoutePicker value={form.routes} onChange={(v) => set('routes', v)} />
            </div>
            <div className="forge-two">
              <Field label="Phase">
                {(id) => (
                  <select id={id} className="field" value={form.phase ?? ''} onChange={(e) => set('phase', e.target.value || null)}>
                    <option value="">unphased</option>
                    {[...PHASES, ...(form.phase && !(PHASES as readonly string[]).includes(form.phase) ? [form.phase] : [])].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Priority" hint="lower runs first">
                {(id) => <input id={id} className="field" type="number" min={0} max={99} disabled={!form.phase} value={form.phase ? form.priority ?? 50 : ''} onChange={(e) => set('priority', e.target.value === '' ? null : Math.max(0, Math.min(99, Number(e.target.value))))} />}
              </Field>
            </div>
            <Field label="Activate when" hint="the condition in the brief that calls it">
              {(id) => <input id={id} className="field" value={form.activateWhen} onChange={(e) => set('activateWhen', e.target.value)} />}
            </Field>
            {isNew && (
              <Field label="Contract" hint="optional markdown; becomes the ## Contract section">
                {(id) => <textarea id={id} className="field" value={form.contract} onChange={(e) => set('contract', e.target.value)} />}
              </Field>
            )}
          </fieldset>

          <fieldset className="forge-set">
            <legend>Crew card (crew.json)</legend>
            <div className="forge-two">
              {isNew && (
                <Field label="Crew id">
                  {(id) => <input id={id} className="field" value={form.crew.id} onChange={(e) => setCrew('id', e.target.value.trim())} autoComplete="off" data-testid="forge-crew-id" />}
                </Field>
              )}
              <Field label="Name">
                {(id) => <input id={id} className="field" value={form.crew.name} onChange={(e) => setCrew('name', e.target.value)} data-testid="forge-crew-name" />}
              </Field>
              <Field label="Title">
                {(id) => <input id={id} className="field" value={form.crew.title} onChange={(e) => setCrew('title', e.target.value)} data-testid="forge-crew-title" />}
              </Field>
              <Field label="Pigment">
                {(id) => <input id={id} className="field forge-color" type="color" value={form.crew.pigment} onChange={(e) => setCrew('pigment', e.target.value.toUpperCase())} />}
              </Field>
            </div>
          </fieldset>
        </div>
      )}
    </Workbench>
  );
}

/* ----------------------------------------------------------------------------------------- skills */

function SkillBench({ selected, onSelect, onApplied }: { selected: string; onSelect: (id: string) => void; onApplied: (o: ApplyOutcome) => void }) {
  const idx = useKb();
  const isNew = selected === NEW;
  const source = isNew ? null : idx.skill.get(selected) ?? null;
  const [cats, setCats] = useState<string[] | null>(null);
  const [form, setForm] = useState<SkillPayload>(() => (source ? { id: source.id, category: source.category, group: source.group, description: source.description, body: '' } : { id: '', category: '', group: '', description: '', body: '' }));
  const [mode, setMode] = useState<'edit' | 'delete'>('edit');
  const [confirm, setConfirm] = useState('');
  useEffect(() => {
    categories().then(setCats, () => setCats([]));
  }, []);
  const set = <K extends keyof SkillPayload>(k: K, v: SkillPayload[K]) => setForm((f) => ({ ...f, [k]: v }));
  if (!isNew && !source) return <p className="state-line" role="status">Waiting for the new library to load…</p>;

  const problems: string[] = [];
  if (!SLUG.test(form.id)) problems.push('Skill id: a slug of 2–48 characters.');
  if (!form.category) problems.push('Choose a category.');
  if (!form.group.trim()) problems.push('Group is required.');
  if (form.description.trim().length < 12) problems.push('Description: at least 12 characters.');
  const request: ForgeRequest | null =
    mode === 'delete' ? (source && confirm === source.id ? { kind: 'skill', op: 'delete', payload: { id: source.id, confirm } } : null) : problems.length ? null : { kind: 'skill', op: isNew ? 'create' : 'update', payload: form };

  return (
    <Workbench request={request} problems={mode === 'edit' && form.id ? problems : []} onApplied={(o) => {
        onApplied(o);
        onSelect(mode === 'delete' ? NEW : form.id);
      }}>
      <div className="forge-bench-head">
        <span className="forge-swatch forge-swatch-skill" aria-hidden="true">
          ◇
        </span>
        <div>
          <h3 className="forge-step-title">{isNew ? 'New skill' : form.id}</h3>
          <p className="prose-sm">{isNew ? 'Adds a registry record (unrouted, not enabled) and a SKILL.md scaffold. Route it from an agent to put it to work.' : `${source?.skillPath ?? ''} · registry record and SKILL.md description`}</p>
        </div>
        {!isNew && (
          <div className="choice-row forge-mode" role="radiogroup" aria-label="What to do">
            <label className="choice">
              <input type="radio" name="skill-mode" checked={mode === 'edit'} onChange={() => setMode('edit')} /> Edit
            </label>
            <label className="choice">
              <input type="radio" name="skill-mode" checked={mode === 'delete'} onChange={() => setMode('delete')} data-testid="forge-mode-delete" /> Delete
            </label>
          </div>
        )}
      </div>
      {mode === 'delete' && source ? (
        <Field label={`Type ${source.id} to delete it`} hint="Refused while an agent routes it or a workflow lists it.">
          {(id) => <input id={id} className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" data-testid="forge-confirm" />}
        </Field>
      ) : (
        <div className="forge-form">
          <fieldset className="forge-set">
            <legend>The skill</legend>
            <Field label="Id" hint={isNew ? 'the folder name; cannot change later' : undefined}>
              {(id) => <input id={id} className="field" value={form.id} disabled={!isNew} onChange={(e) => set('id', e.target.value.trim())} autoComplete="off" data-testid="forge-skill-id" />}
            </Field>
            <div className="forge-two">
              <Field label="Category" hint="its artifact family">
                {(id) => (
                  <select id={id} className="field" value={form.category} disabled={!isNew} onChange={(e) => set('category', e.target.value)} data-testid="forge-skill-category">
                    <option value="">{cats === null ? 'Loading…' : 'Choose…'}</option>
                    {(cats ?? (form.category ? [form.category] : [])).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Group">
                {(id) => <input id={id} className="field" value={form.group} onChange={(e) => set('group', e.target.value)} data-testid="forge-skill-group" />}
              </Field>
            </div>
            <Field label="Description" hint="what it does and when to load it">
              {(id) => <textarea id={id} className="field" value={form.description} onChange={(e) => set('description', e.target.value)} data-testid="forge-skill-description" />}
            </Field>
            {isNew && (
              <Field label="SKILL.md body" hint="optional markdown; a scaffold is written when empty">
                {(id) => <textarea id={id} className="field forge-body" value={form.body} onChange={(e) => set('body', e.target.value)} />}
              </Field>
            )}
          </fieldset>
        </div>
      )}
    </Workbench>
  );
}

/* ------------------------------------------------------------------------------------------- page */

function Rack({ label, items, selected, onSelect, newLabel, testid }: { label: string; items: { id: string; title: string; meta: string; pigment?: string }[]; selected: string; onSelect: (id: string) => void; newLabel: string; testid: string }) {
  const [q, setQ] = useState('');
  const shown = items.filter((i) => !q || i.id.includes(q.toLowerCase()) || i.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <nav className="forge-rack" aria-label={label} data-testid={testid}>
      <button type="button" className="forge-rack-item forge-rack-new" aria-current={selected === NEW || undefined} onClick={() => onSelect(NEW)} data-testid={`${testid}-new`}>
        + {newLabel}
      </button>
      {items.length > 8 && <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" aria-label={`Filter ${label}`} />}
      <ul>
        {shown.map((i) => (
          <li key={i.id}>
            <button type="button" className="forge-rack-item" aria-current={selected === i.id || undefined} onClick={() => onSelect(i.id)} data-id={i.id} style={i.pigment ? ({ ['--c' as string]: i.pigment } as CSSProperties) : undefined}>
              <span className="forge-rack-title">{i.title}</span>
              <span className="forge-rack-meta">{i.meta}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function ForgePage() {
  const idx = useKb();
  const [tab, setTab] = useState('agents');
  const [agent, setAgent] = useState(NEW);
  const [skill, setSkill] = useState(NEW);
  const [outcome, setOutcome] = useState<ApplyOutcome | null>(null);
  const crewByAgent = useMemo(() => new Map(idx.kb.crew.map((c) => [c.role.agent, c])), [idx]);
  const agentItems = useMemo(() => idx.kb.agents.map((a) => ({ id: a.id, title: crewByAgent.get(a.id)?.name ?? a.id, meta: `${a.id} · ${a.model} · ${a.access}`, pigment: crewByAgent.get(a.id)?.pigment })), [idx, crewByAgent]);
  const skillItems = useMemo(() => [...idx.kb.skills].sort((a, b) => a.id.localeCompare(b.id)).map((s) => ({ id: s.id, title: s.id, meta: `${s.group} · ${s.phase}` })), [idx]);

  return (
    <main id="main" className="page forge" data-testid="forge">
      <header>
        <h1 className="page-title">Forge</h1>
        <p className="lede">Make and change the library’s agents and skills. Every change is shown as a diff first, checked by verify.py, and left uncommitted for you to review.</p>
      </header>
      {!FORGE_AVAILABLE ? (
        <div className="state-panel" data-testid="forge-readonly">
          <h2>Read-only here</h2>
          <p>The Forge writes into library/ and runs the generator, so it works only on the dev server: run <code>npm run dev</code> in shipyard/ and open it there. This deployed copy never writes anything.</p>
        </div>
      ) : (
        <Tabs.Root value={tab} onValueChange={setTab}>
          {outcome && <Outcome outcome={outcome} onClose={() => setOutcome(null)} />}
          <Tabs.List className="tabs forge-tabs" aria-label="Forge sections">
            <Tabs.Trigger className="tab" value="agents" data-testid="forge-tab-agents">
              Agents · {idx.kb.agents.length}
            </Tabs.Trigger>
            <Tabs.Trigger className="tab" value="skills" data-testid="forge-tab-skills">
              Skills · {idx.kb.skills.length}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="agents" className="forge-layout">
            <Rack label="Agents" items={agentItems} selected={agent} onSelect={setAgent} newLabel="New agent" testid="forge-agent-rack" />
            <div className="forge-bench">
              <AgentBench key={`${agent}:${idx.kb.sourceHash}`} selected={agent} onSelect={setAgent} onApplied={setOutcome} />
            </div>
          </Tabs.Content>
          <Tabs.Content value="skills" className="forge-layout">
            <Rack label="Skills" items={skillItems} selected={skill} onSelect={setSkill} newLabel="New skill" testid="forge-skill-rack" />
            <div className="forge-bench">
              <SkillBench key={`${skill}:${idx.kb.sourceHash}`} selected={skill} onSelect={setSkill} onApplied={setOutcome} />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </main>
  );
}
