/**
 * Library workflow -> ship conversion (06 section 9.1).
 *
 * `workflows.json` stages may name several crew, carry no skill and no stop condition, and `build`
 * lists no artifacts. A ship stage needs exactly one member, at most one active skill, outputs and
 * a stop. So the conversion is an AUTHORED table per library workflow, not a heuristic: each row
 * names the KB stage it comes from (`from`), the one member who does it, the one skill it opens,
 * its outputs and its stop. A stage's phase and a gate's label are read from the KB, so the table
 * cannot drift from `workflows.json` quietly.
 *
 * The converter checks the table against the KB and throws a ConversionError naming every gap: a
 * workflow the table cannot convert is a blocker to report, not something to paper over.
 *
 * Deliberate difference from `workflows.json` (recorded in PROGRESS-AND-DECISIONS.md): there the
 * `verify` stage lists critic + metrics for 07-qa.md and 10-finish-review.md together. Here
 * 07-qa.md belongs to the builder (the author's own pass) and 10-finish-review.md to the critic,
 * because loop bound 1 in the root AGENTS.md defines the finish review as someone who built nothing.
 * If the owner prefers the registry's reading, change the table, not the rule.
 */
import { isKbStage, type KbIndex } from '../kb/artifacts';
import type { KbGate, KbStage, KbWorkflow } from '../kb/schema';
import { PHASE_IDS, type Phase, type Ship, type Stage, type VoyageItem } from './schema';

export interface StageRow {
  /** the KB stage this row comes from; phase and default label are read from it */
  from: string;
  id: string;
  member: string;
  skill: string | null;
  label?: string;
  inputs?: string[];
  outputs: string[];
  stop: string;
  parallel?: boolean;
  wave?: number;
}
export interface GateRef {
  gate: string;
}
export type Row = StageRow | GateRef;
export const isGateRef = (r: Row): r is GateRef => 'gate' in r;

export interface ConversionTable {
  workflow: string;
  class: Ship['class'];
  trail: NonNullable<Ship['trail']>;
  scoped?: boolean;
  hull: NonNullable<Ship['hull']>;
  rows: Row[];
}

const DS = ['PRODUCT.md', 'DESIGN.md', 'design.json'];
const RUN_PLAN = '.olympus/00-run-plan.md';
const PLAN_CLEAN = 'verify.py --plan CLEAN';

/** SS Full Run, the default ship: exactly the table in 06 section 9.1. */
const SS_FULL_RUN: ConversionTable = {
  workflow: 'ss-full-run',
  class: 'flagship',
  trail: 'full',
  hull: 'ship-a',
  rows: [
    { from: 'run-plan', id: 'run-plan', member: 'captain', skill: 'olympus-design-director', outputs: [RUN_PLAN], stop: PLAN_CLEAN },
    {
      from: 'dna',
      id: 'dna',
      member: 'strategist',
      skill: 'product-marketing',
      inputs: [RUN_PLAN],
      outputs: ['brand-dna.json', 'BRAND.md', '00-brief.md'],
      stop: 'brand-dna.json validates against library/schemas/brand-dna.schema.json',
    },
    {
      from: 'audit',
      id: 'audit',
      member: 'analyst',
      skill: 'ux-evidence-audit',
      inputs: ['00-brief.md', 'brand-dna.json'],
      outputs: ['01-audit.md'],
      stop: 'evidence table returned; director ranks five problems',
    },
    { gate: 'A' },
    {
      from: 'direction',
      id: 'direction',
      member: 'captain',
      skill: 'concept-studio',
      label: 'One direction',
      inputs: ['00-brief.md', '01-audit.md'],
      outputs: ['02-concepts.md'],
      stop: 'one direction defended in writing',
    },
    { from: 'direction', id: 'critique', member: 'critic', skill: 'award-rubric', label: 'Critique the direction', inputs: ['02-concepts.md'], outputs: ['03-critique.md'], stop: 'scored; no redesign' },
    { gate: 'B' },
    { from: 'assets', id: 'assets', member: 'producer', skill: 'asset-director', outputs: ['05-asset-manifest.md'], stop: 'every asset has source, rights, fallback' },
    { from: 'plan', id: 'plan', member: 'captain', skill: null, outputs: ['06-build-plan.md'], stop: 'art direction, palette, type scale as numbers, media map' },
    { from: 'design-system', id: 'design-system', member: 'captain', skill: 'impeccable', inputs: ['06-build-plan.md'], outputs: DS, stop: 'no TBD in the token block' },
    { from: 'build', id: 'build', member: 'engineer', skill: 'apple-design', inputs: ['06-build-plan.md', 'DESIGN.md'], outputs: ['project source'], stop: 'build-plan tasks done; typecheck + lint green' },
    {
      from: 'verify',
      id: 'author-qa',
      member: 'engineer',
      skill: 'visual-qa',
      label: 'Author QA',
      outputs: ['07-qa.md'],
      stop: 'evidence for desktop, phone, states, reduced motion',
    },
    {
      from: 'verify',
      id: 'finish-review',
      member: 'critic',
      skill: 'visual-qa',
      label: 'Independent finish review',
      inputs: ['07-qa.md', 'DESIGN.md'],
      outputs: ['10-finish-review.md'],
      stop: 'scored against DESIGN.md',
    },
    { from: 'verify', id: 'metrics', member: 'metrics', skill: 'design-analytics', label: 'Metrics plan', outputs: ['08-metrics.md'], stop: 'event contract + readout plan' },
    { gate: 'C' },
    { from: 'handoff', id: 'handoff', member: 'captain', skill: null, outputs: ['09-handoff.md'], stop: 'handoff delivered' },
  ],
};

/** SS Abridged: the plan is the brief; gates A and B are recorded approved-in-plan. */
const SS_ABRIDGED: ConversionTable = {
  workflow: 'ss-abridged',
  class: 'abridged',
  trail: 'abridged',
  hull: 'ship-b',
  rows: [
    { from: 'run-plan', id: 'run-plan', member: 'captain', skill: 'olympus-design-director', outputs: [RUN_PLAN], stop: PLAN_CLEAN },
    { from: 'resolve', id: 'resolve', member: 'captain', skill: null, inputs: [RUN_PLAN], outputs: ['00-brief.md'], stop: 'brief resolved in writing; gates A and B recorded approved-in-plan' },
    { from: 'plan', id: 'plan', member: 'captain', skill: null, inputs: ['00-brief.md'], outputs: ['06-build-plan.md'], stop: 'art direction, palette, type scale as numbers, media map' },
    { from: 'design-system', id: 'design-system', member: 'engineer', skill: 'impeccable', inputs: ['06-build-plan.md'], outputs: DS, stop: 'no TBD in the token block' },
    { from: 'build', id: 'build', member: 'engineer', skill: 'apple-design', inputs: ['06-build-plan.md', 'DESIGN.md'], outputs: ['project source'], stop: 'build-plan tasks done; typecheck + lint green' },
    { from: 'verify', id: 'author-qa', member: 'engineer', skill: 'visual-qa', label: 'Author QA', outputs: ['07-qa.md'], stop: 'evidence for desktop, phone, states, reduced motion' },
    { from: 'verify', id: 'finish-review', member: 'critic', skill: 'visual-qa', label: 'Independent finish review', inputs: ['07-qa.md', 'DESIGN.md'], outputs: ['10-finish-review.md'], stop: 'scored against DESIGN.md' },
    { gate: 'C' },
  ],
};

/** SS Mobile Retrofit: a scoped repair on a built site; mobile-app-shell and visual-qa are its skills. */
const SS_MOBILE_RETROFIT: ConversionTable = {
  workflow: 'ss-mobile-retrofit',
  class: 'retrofit',
  trail: 'abridged',
  scoped: true,
  hull: 'ship-c',
  rows: [
    { from: 'run-plan', id: 'run-plan', member: 'captain', skill: 'olympus-design-director', outputs: [RUN_PLAN], stop: PLAN_CLEAN },
    {
      from: 'measure',
      id: 'measure',
      member: 'analyst',
      skill: 'mobile-app-shell',
      inputs: [RUN_PLAN],
      outputs: ['01-audit.md'],
      stop: 'one table of numbers per route: screens, overflow, targets, inputs; no opinions',
    },
    { from: 'plan', id: 'plan', member: 'captain', skill: null, inputs: ['01-audit.md'], outputs: ['06-build-plan.md'], stop: 'per-page screen budgets and the treatment per over-budget section' },
    { from: 'build', id: 'build', member: 'engineer', skill: 'mobile-app-shell', inputs: ['06-build-plan.md'], outputs: ['project source'], stop: 'budgets pass as tests; desktop behaviour unchanged' },
    { from: 'verify', id: 'author-qa', member: 'engineer', skill: 'visual-qa', label: 'Before/after author QA', outputs: ['07-qa.md'], stop: 'before/after evidence at 390 and 360 px' },
    { from: 'verify', id: 'finish-review', member: 'critic', skill: 'visual-qa', label: 'Independent finish review', inputs: ['07-qa.md', '06-build-plan.md'], outputs: ['10-finish-review.md'], stop: 'scored against the budgets; no redesign' },
    { gate: 'C' },
  ],
};

/** SS Mobile Fleet: many built sites, one phone standard; waves, one writing engineer per site per wave. */
const SS_MOBILE_FLEET: ConversionTable = {
  workflow: 'ss-mobile-fleet',
  class: 'fleet',
  trail: 'fleet',
  scoped: true,
  hull: 'ship-d',
  rows: [
    { from: 'plan', id: 'plan', member: 'captain', skill: 'olympus-design-director', outputs: [RUN_PLAN, 'fleet.json'], stop: `${PLAN_CLEAN}; fleet.json lists sites, waves and budgets` },
    {
      from: 'measure',
      id: 'measure',
      member: 'gauge',
      skill: 'mobile-app-shell',
      inputs: ['fleet.json'],
      outputs: ['01-audit.md'],
      stop: 'numbers table returned for every route; the director writes 01-audit.md',
    },
    { gate: '0' },
    { from: 'shell', id: 'shell', member: 'engineer', skill: 'mobile-app-shell', inputs: ['01-audit.md'], outputs: ['shell/PORTING.md'], stop: 'shell built once on the reference site' },
    { gate: '1' },
    {
      from: 'fleet',
      id: 'fleet',
      member: 'engineer',
      skill: 'mobile-app-shell',
      inputs: ['shell/PORTING.md', 'fleet.json'],
      outputs: ['07-qa.json per site', '02-results.md'],
      stop: 'every site in the wave meets fleet.json budgets or its gap is named',
      parallel: true,
      wave: 1,
    },
    { gate: '2' },
    { from: 'review', id: 'review', member: 'critic', skill: 'visual-qa', inputs: ['02-results.md', 'fleet.json'], outputs: ['03-finish-review.md'], stop: 'one critic per wave; scored against fleet.json budgets and the reference' },
    { gate: 'C' },
  ],
};

export const CONVERSION_TABLES: Record<string, ConversionTable> = {
  [SS_FULL_RUN.workflow]: SS_FULL_RUN,
  [SS_ABRIDGED.workflow]: SS_ABRIDGED,
  [SS_MOBILE_RETROFIT.workflow]: SS_MOBILE_RETROFIT,
  [SS_MOBILE_FLEET.workflow]: SS_MOBILE_FLEET,
};

export class ConversionError extends Error {
  readonly workflow: string;
  readonly problems: string[];
  constructor(workflow: string, problems: string[]) {
    super(`Workflow ${workflow} cannot be converted to a ship: ${problems.join('; ')}`);
    this.name = 'ConversionError';
    this.workflow = workflow;
    this.problems = problems;
  }
}

export interface Converted {
  workflow: KbWorkflow;
  table: ConversionTable;
  voyage: VoyageItem[];
  /** member ids in order of first appearance */
  crew: string[];
}

const basename = (p: string) => p.split('/').pop() ?? p;

/** Convert one library workflow through its authored table, checking the table against the KB first. */
export function convertWorkflow(idx: KbIndex, workflowId: string, tables: Record<string, ConversionTable> = CONVERSION_TABLES): Converted {
  const workflow = idx.workflow.get(workflowId);
  if (!workflow) throw new ConversionError(workflowId, ['no such workflow in the library']);
  const table = tables[workflowId];
  if (!table) throw new ConversionError(workflowId, ['no conversion table (add one to src/domain/conversion.ts)']);

  const problems: string[] = [];
  const kbStages = new Map<string, KbStage>();
  const kbGates = new Map<string, KbGate>();
  const kbSequence: string[] = [];
  for (const s of workflow.stages) {
    if (isKbStage(s)) {
      kbStages.set(s.id, s);
      kbSequence.push(`stage:${s.id}`);
    } else {
      kbGates.set(s.gate, s);
      kbSequence.push(`gate:${s.gate}`);
    }
  }

  const rowIds = new Set<string>();
  const byFrom = new Map<string, StageRow[]>();
  const tableSequence: string[] = [];
  for (const row of table.rows) {
    if (isGateRef(row)) {
      if (!kbGates.has(row.gate)) problems.push(`gate ${row.gate} is not in the workflow`);
      tableSequence.push(`gate:${row.gate}`);
      continue;
    }
    const source = kbStages.get(row.from);
    if (!source) problems.push(`row ${row.id}: stage ${row.from} is not in the workflow`);
    else if (!PHASE_IDS.includes(source.phase as Phase)) problems.push(`row ${row.id}: phase ${source.phase} of stage ${row.from} is not a ship phase`);
    if (rowIds.has(row.id)) problems.push(`row ${row.id}: duplicate id`);
    rowIds.add(row.id);
    if (!idx.crew.has(row.member)) problems.push(`row ${row.id}: ${row.member} is not a crew id`);
    if (row.skill !== null && !idx.skill.has(row.skill)) problems.push(`row ${row.id}: skill ${row.skill} is not in the registry`);
    if (row.outputs.length === 0) problems.push(`row ${row.id}: no outputs`);
    if (!row.stop.trim()) problems.push(`row ${row.id}: no stop condition`);
    byFrom.set(row.from, [...(byFrom.get(row.from) ?? []), row]);
    tableSequence.push(`stage:${row.from}`);
  }

  const collapse = (xs: string[]) => xs.filter((x, i) => x !== xs[i - 1]);
  if (collapse(tableSequence).join('>') !== collapse(kbSequence).join('>')) {
    problems.push(`order differs from the workflow: table ${collapse(tableSequence).join(' > ')} vs library ${collapse(kbSequence).join(' > ')}`);
  }

  for (const [id, stage] of kbStages) {
    const rows = byFrom.get(id) ?? [];
    if (rows.length === 0) {
      problems.push(`stage ${id} has no row`);
      continue;
    }
    const outputs = new Set(rows.flatMap((r) => r.outputs.map(basename)));
    for (const a of stage.artifacts) if (!outputs.has(basename(a))) problems.push(`stage ${id}: artifact ${a} is not produced by any row`);
    const members = new Set(rows.map((r) => r.member));
    for (const c of stage.crew) if (!members.has(c)) problems.push(`stage ${id}: crew ${c} has no row`);
  }
  if (problems.length > 0) throw new ConversionError(workflowId, problems);

  const voyage: VoyageItem[] = [];
  const crew: string[] = [];
  for (const row of table.rows) {
    if (isGateRef(row)) {
      const g = kbGates.get(row.gate)!;
      voyage.push({ kind: 'gate', gate: g.gate, label: g.label.slice(0, 80) });
      continue;
    }
    const kb = kbStages.get(row.from)!;
    const stage: Stage = {
      kind: 'stage',
      id: row.id,
      label: (row.label ?? kb.label).slice(0, 80),
      phase: kb.phase as Phase,
      member: row.member,
      activeSkill: row.skill,
      ...(row.inputs ? { inputs: row.inputs } : {}),
      outputs: row.outputs,
      stop: row.stop,
      ...(row.parallel ? { parallel: true } : {}),
      ...(row.wave !== undefined ? { wave: row.wave } : {}),
    };
    voyage.push(stage);
    if (!crew.includes(row.member)) crew.push(row.member);
  }
  return { workflow, table, voyage, crew };
}
