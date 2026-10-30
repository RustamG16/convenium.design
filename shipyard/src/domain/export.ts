/**
 * Export contracts (06 section 9): `ship.json`, `00-run-plan.md` and the kickoff prompt.
 *
 * The run plan is the activation plan that `python library/tools/verify.py --plan` checks: one
 * phase per stage, one agent and one skill per phase. The design-director plays the main session,
 * so its phases export as agent `director` (as in templates/00-run-plan.md). Skill paths always use
 * forward slashes under the `convenium_design` path. Nothing here runs an agent or a check;
 * `npm run test:plans` runs the real verify.py on every library ship.
 */
import type { KbIndex } from '../kb/artifacts';
import { preflight, type PreflightReport } from './preflight';
import { isGate, isStage, type Member, type Ship, type Stage } from './schema';
import { shipSchema } from './schema';

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportError';
  }
}

export interface RunPlanPhase {
  id: string;
  agent: string;
  skill: string | null;
  skill_path: string | null;
  model: string;
  inputs: string[];
  outputs: string[];
  stop: string;
  parallel: boolean;
  wave?: number;
}

export interface RunPlan {
  run: string;
  trail: string;
  convenium_design: string;
  phases: RunPlanPhase[];
  gates: string[];
}

/** An absolute path with forward slashes and no trailing slash. */
export function normalizePath(p: string): string {
  return p.trim().replace(/\\/g, '/').replace(/\/+$/, '');
}

/** An absolute path on Windows (drive letter or UNC) or POSIX (a leading slash). */
export function isAbsolutePath(p: string): boolean {
  return /^([A-Za-z]:[\\/]|\/|\\\\)/.test(p.trim());
}

/** The run-plan agent id for a member: the design-director is the main session, `director`. */
export function runPlanAgent(agent: string): string {
  return agent === 'design-director' ? 'director' : agent;
}

function memberFor(ship: Ship, stage: Stage): Member | undefined {
  if (stage.member === 'director') return ship.crew.find((m) => m.agent === 'design-director');
  return ship.crew.find((m) => m.id === stage.member);
}

export function buildRunPlan(idx: KbIndex, ship: Ship, conveniumDesign: string): RunPlan {
  const root = normalizePath(conveniumDesign);
  if (!root) throw new ExportError('Set the path of the Convenium.Design folder before exporting a run plan.');
  const phases: RunPlanPhase[] = [];
  for (const stage of ship.voyage.filter(isStage)) {
    const member = memberFor(ship, stage);
    if (!member) throw new ExportError(`Stage ${stage.id} is assigned to ${stage.member}, who is not aboard.`);
    const agent = idx.agent.get(member.agent);
    if (!agent) throw new ExportError(`Agent ${member.agent} is not in the library.`);
    let skillPath: string | null = null;
    if (stage.activeSkill) {
      const skill = idx.skill.get(stage.activeSkill);
      if (!skill) throw new ExportError(`Stage ${stage.id} opens ${stage.activeSkill}, which is not in the library.`);
      skillPath = `${root}/${skill.skillPath}`;
    }
    phases.push({
      id: stage.id,
      agent: runPlanAgent(member.agent),
      skill: stage.activeSkill,
      skill_path: skillPath,
      model: agent.model,
      inputs: stage.inputs ?? [],
      outputs: stage.outputs,
      stop: stage.stop,
      parallel: stage.parallel === true,
      ...(stage.wave !== undefined ? { wave: stage.wave } : {}),
    });
  }
  return {
    run: ship.name,
    trail: ship.trail ?? 'abridged',
    convenium_design: root,
    phases,
    gates: ship.voyage.filter(isGate).map((g) => g.gate),
  };
}

const escapeCell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

/** `00-run-plan.md`: the template's prose header, one fenced json block, then the cosmetic crew table. */
export function renderRunPlan(idx: KbIndex, ship: Ship, conveniumDesign: string, now: string): string {
  const plan = buildRunPlan(idx, ship, conveniumDesign);
  const rows = ship.crew
    .slice()
    .sort((a, b) => a.station - b.station)
    .map((m) => `| ${escapeCell(m.character.name)} | ${m.agent} | ${m.station} | ${m.loadout.length} |`);
  return [
    `# 00 — Run plan: ${ship.name} (the activation plan)`,
    '',
    `Exported by Convenium Shipyard from ship \`${ship.id}\` on ${now.slice(0, 10)} (library hash \`${idx.kb.sourceHash.slice(0, 8)}\`).`,
    'Check it before the first spawn, and again after any edit:',
    '',
    '```',
    'python <Convenium.Design>/library/tools/verify.py --plan .olympus/00-run-plan.md',
    '```',
    '',
    'One phase, one agent, one skill body. An agent, a skill body or a parallel wave not in this file does not run:',
    'update the file first, re-check, then spawn. `agent: director` is the main session. `parallel: true` is allowed only',
    'for agents whose file sets do not overlap.',
    '',
    '```json',
    JSON.stringify(plan, null, 2),
    '```',
    '',
    '## Crew characters',
    '',
    'Cosmetic: the character is a name and a face; the agent is what runs. Ignored by `verify.py`.',
    '',
    '| Character | Agent | Station | Artifacts worn |',
    '|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

export function renderShipJson(ship: Ship): string {
  // Validate on the way out: an export that would not import is a bug here, not at the reader.
  const parsed = shipSchema.safeParse(ship);
  if (!parsed.success) throw new ExportError(`The ship does not match shipyard.ship.v1: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
  return `${JSON.stringify(parsed.data, null, 2)}\n`;
}

/** Equipped artifacts no stage opens: available on request, never pre-loaded. */
export function availableOnRequest(ship: Ship): { member: Member; skills: string[] }[] {
  const opened = (m: Member) => new Set(ship.voyage.filter(isStage).filter((s) => memberFor(ship, s)?.id === m.id).map((s) => s.activeSkill));
  return ship.crew
    .map((member) => ({ member, skills: member.loadout.map((e) => e.skill).filter((s) => !opened(member).has(s)) }))
    .filter((x) => x.skills.length > 0);
}

/** A paste-ready kickoff prompt: start from the run plan, in its order, one skill body per phase. */
export function renderKickoffPrompt(ship: Ship, conveniumDesign: string): string {
  const cd = normalizePath(conveniumDesign) || '<Convenium.Design folder>';
  const extra = availableOnRequest(ship);
  const hold = ship.hold ?? [];
  const lines = [
    `You are the Convenium.Design Design Director (main session) running the ship "${ship.name}" (${ship.trail ?? 'abridged'} trail).`,
    '',
    `Convenium.Design = ${cd}`,
    '',
    `Read ${cd}/ARCHITECTURE-ESSENTIALS.md and ${cd}/AGENTS.md completely, then this project's own CLAUDE.md, AGENTS.md and DESIGN.md where they exist.`,
    '',
    'Start from the run plan, `.olympus/00-run-plan.md` (create `.olympus/` first if it is missing, and copy the exported file there). Then:',
    `1. Check it: python ${cd}/library/tools/verify.py --plan .olympus/00-run-plan.md. It must print CLEAN before the first agent is spawned.`,
    '2. Spawn only the agents the file names, in its order, one skill body per phase, quoting that phase\'s row and nothing from the conversation.',
    '3. Open exactly the `skill_path` of the phase you are running; load no other SKILL.md. Agents preload nothing.',
    '4. Stop at each gate and ask the owner; do not decide a gate for them.',
  ];
  if (extra.length > 0 || hold.length > 0) {
    lines.push('', 'Available on request (equipped but not opened by any stage; never pre-loaded; add a phase to the run plan and re-check it before using one):');
    for (const { member, skills } of extra) lines.push(`- ${member.character.name} (${member.agent}): ${skills.join(', ')}`);
    if (hold.length > 0) lines.push(`- In the ship's hold: ${hold.join(', ')}`);
  }
  lines.push('', 'Nothing in this prompt runs an agent by itself; the run plan is the only roster.');
  return `${lines.join('\n')}\n`;
}

export interface ExportBundle {
  report: PreflightReport;
  shipJson: string;
  runPlan: string;
  kickoff: string;
}

/**
 * Everything an export produces, or an ExportError naming the first blocker. Export is enabled only
 * when pre-flight has no blocker (06 section 4.6); warnings do not stop it.
 */
export function exportShip(idx: KbIndex, ship: Ship, conveniumDesign: string, now: string): ExportBundle {
  const report = preflight(idx, ship);
  if (!report.canExport) {
    const first = report.checks.find((c) => c.status === 'block');
    throw new ExportError(first ? `Export is blocked by ${first.id}: ${first.reason}` : 'Export is blocked.');
  }
  return {
    report,
    shipJson: renderShipJson(ship),
    runPlan: renderRunPlan(idx, ship, conveniumDesign, now),
    kickoff: renderKickoffPrompt(ship, conveniumDesign),
  };
}
