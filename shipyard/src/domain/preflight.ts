/**
 * Pre-flight: the real rules of the Convenium.Design activation protocol as hull checks
 * (06 section 8, PF-01..PF-15). Pure: `preflight(idx, ship)` reads a ship and the knowledge base
 * and returns a report; nothing is stored, timed, ranked or randomised.
 *
 * A library workflow converted through its table must come out clean (no block, no warn): a false
 * positive there is a bug in a rule or in the table. `info` findings (off-route notes) are shown
 * but are not problems.
 */
import type { KbIndex } from '../kb/artifacts';
import type { KbAgent } from '../kb/schema';
import { equipNotes } from './loadout';
import { isGate, isStage, type Member, type Ship, type Stage } from './schema';

export type Severity = 'block' | 'warn' | 'info';
export type CheckStatus = 'pass' | Severity | 'na';
export type HullGroup = 'crew' | 'stages' | 'gates' | 'parallel' | 'library';

export type Fix =
  | { kind: 'stage'; id: string }
  | { kind: 'member'; id: string }
  | { kind: 'socket'; member: string; skill: string }
  | { kind: 'ship' };

export interface Finding {
  severity: Severity;
  reason: string;
  fix?: Fix;
}

export interface Check {
  id: string;
  title: string;
  group: HullGroup;
  /** the severity this rule carries when it finds something */
  severity: Severity;
  status: CheckStatus;
  /** one line: why it passed, why it is not applicable, or the first finding */
  reason: string;
  findings: Finding[];
}

export interface PreflightReport {
  checks: Check[];
  applicable: number;
  /** pass + info */
  passed: number;
  /** 0..100: passed / applicable; capped at 99 while a blocker stands. Truth: Verified (computed). */
  integrity: number;
  blockers: number;
  warnings: number;
  /** no block and no warn */
  clean: boolean;
  /** Export is enabled only without blockers */
  canExport: boolean;
  /** the first block, else the first warn: the next goal shown on screen */
  next: Check | null;
}

const TIER = { opus: 3, sonnet: 2, haiku: 1 } as const;
const WRITE_PLANS = /^(00-run-plan|06-build-plan)\.md$/;
const basename = (p: string) => p.split('/').pop() ?? p;
const RANK: Record<Severity, number> = { info: 1, warn: 2, block: 3 };

interface Ctx {
  idx: KbIndex;
  ship: Ship;
  stages: Stage[];
  agentOf: (memberId: string) => KbAgent | undefined;
  member: (memberId: string) => Member | undefined;
}

function makeCtx(idx: KbIndex, ship: Ship): Ctx {
  const director = ship.crew.find((m) => m.agent === 'design-director');
  const member = (id: string) => (id === 'director' ? director : ship.crew.find((m) => m.id === id));
  return {
    idx,
    ship,
    stages: ship.voyage.filter(isStage),
    member,
    agentOf: (id) => {
      const m = member(id);
      return m ? idx.agent.get(m.agent) : undefined;
    },
  };
}

type Rule = {
  id: string;
  title: string;
  group: HullGroup;
  severity: Severity;
  /** returns null when the rule does not apply, with the reason */
  run: (c: Ctx) => { na: string } | Finding[];
};

const stageFix = (s: Stage): Fix => ({ kind: 'stage', id: s.id });

const RULES: Rule[] = [
  {
    id: 'PF-01',
    title: 'A design-director is aboard and never runs in parallel',
    group: 'crew',
    severity: 'block',
    run: ({ ship, stages, member }) => {
      const out: Finding[] = [];
      if (!ship.crew.some((m) => m.agent === 'design-director')) {
        out.push({ severity: 'block', reason: 'No design-director aboard. The main session needs a captain; recruit one.', fix: { kind: 'ship' } });
      }
      for (const s of stages) {
        const m = member(s.member);
        if (s.parallel && (s.member === 'director' || m?.agent === 'design-director')) {
          out.push({ severity: 'block', reason: `Stage ${s.id} runs the director in parallel; the director is one session and never parallel.`, fix: stageFix(s) });
        }
      }
      return out;
    },
  },
  {
    id: 'PF-02',
    title: 'Every stage opens at most one skill, and it is in the library',
    group: 'stages',
    severity: 'block',
    run: ({ stages, idx }) =>
      stages.flatMap((s): Finding[] => {
        const sk = s.activeSkill as unknown;
        if (Array.isArray(sk)) return [{ severity: 'block', reason: `Stage ${s.id} lists ${sk.length} skills; one phase opens one skill body.`, fix: stageFix(s) }];
        if (typeof sk === 'string' && !idx.skill.has(sk)) {
          return [{ severity: 'block', reason: `Stage ${s.id} opens ${sk}, which is not in the library (retired).`, fix: stageFix(s) }];
        }
        return [];
      }),
  },
  {
    id: 'PF-03',
    title: "Every stage's member exists and carries the skill the stage opens",
    group: 'crew',
    severity: 'block',
    run: ({ stages, member }) =>
      stages.flatMap((s): Finding[] => {
        const m = member(s.member);
        if (!m) return [{ severity: 'block', reason: `Stage ${s.id} is assigned to ${s.member}, who is not aboard.`, fix: stageFix(s) }];
        if (s.activeSkill && !m.loadout.some((e) => e.skill === s.activeSkill)) {
          return [{ severity: 'block', reason: `Stage ${s.id} opens ${s.activeSkill}, but ${m.character.name} is not wearing it. Equip it first.`, fix: { kind: 'member', id: m.id } }];
        }
        return [];
      }),
  },
  {
    id: 'PF-04',
    title: 'Every stage has an output and a stop condition',
    group: 'stages',
    severity: 'block',
    run: ({ stages }) =>
      stages.flatMap((s): Finding[] => {
        const out: Finding[] = [];
        if (s.outputs.length === 0 || s.outputs.some((o) => !o.trim())) out.push({ severity: 'block', reason: `Stage ${s.id} has no named output.`, fix: stageFix(s) });
        if (!s.stop.trim()) out.push({ severity: 'block', reason: `Stage ${s.id} has no stop condition.`, fix: stageFix(s) });
        return out;
      }),
  },
  {
    id: 'PF-05',
    title: 'Stage ids are unique',
    group: 'stages',
    severity: 'block',
    run: ({ stages }) => {
      const seen = new Set<string>();
      const dup = new Set<string>();
      for (const s of stages) (seen.has(s.id) ? dup : seen).add(s.id);
      return [...dup].map((id): Finding => ({ severity: 'block', reason: `Stage id ${id} is used more than once.`, fix: { kind: 'stage', id } }));
    },
  },
  {
    id: 'PF-06',
    title: 'Parallel work stays inside the rule',
    group: 'parallel',
    severity: 'block',
    run: ({ ship, stages, agentOf }) => {
      const parallel = stages.filter((s) => s.parallel);
      if (parallel.length === 0) return { na: 'No stage runs in parallel.' };
      const waves = new Map<number, Stage[]>();
      for (const s of parallel) waves.set(s.wave ?? 0, [...(waves.get(s.wave ?? 0) ?? []), s]);
      const out: Finding[] = [];
      for (const [wave, group] of waves) {
        if (ship.trail === 'fleet') {
          const writers = new Map<string, Stage[]>();
          for (const s of group) if (agentOf(s.member)?.access === 'write') writers.set(s.member, [...(writers.get(s.member) ?? []), s]);
          for (const [who, list] of writers) {
            if (list.length > 1) {
              out.push({ severity: 'block', reason: `Wave ${wave} has ${list.length} parallel stages for ${who}; a fleet wave allows one writing engineer per site.`, fix: stageFix(list[1]) });
            }
          }
        } else {
          for (const s of group) {
            if (agentOf(s.member)?.access === 'write') {
              out.push({ severity: 'block', reason: `Stage ${s.id} runs a writing agent in parallel; only read-only gatherers run in parallel outside a fleet.`, fix: stageFix(s) });
            }
          }
          const readers = group.filter((s) => agentOf(s.member)?.access === 'read-only');
          if (readers.length > 2) {
            out.push({ severity: 'block', reason: `Wave ${wave} runs ${readers.length} read-only gatherers in parallel; the limit is two.`, fix: stageFix(readers[2]) });
          }
        }
      }
      return out;
    },
  },
  {
    id: 'PF-07',
    title: 'A build stage is not run by a read-only agent',
    group: 'crew',
    severity: 'block',
    run: ({ stages, agentOf, member }) =>
      stages
        .filter((s) => s.phase === 'build')
        .flatMap((s): Finding[] => {
          const a = agentOf(s.member);
          if (a?.access === 'read-only') {
            return [{ severity: 'block', reason: `Stage ${s.id} builds, but ${member(s.member)?.character.name ?? s.member} plays ${a.id}, which cannot write files.`, fix: stageFix(s) }];
          }
          return [];
        }),
  },
  {
    id: 'PF-08',
    title: 'The trail has its gates, in order',
    group: 'gates',
    severity: 'block',
    run: ({ ship }) => {
      if (!ship.trail) return { na: 'No trail is set.' };
      const gates = ship.voyage.filter(isGate).map((g) => g.gate);
      const need = ship.trail === 'full' ? ['A', 'B', 'C'] : ['C'];
      const out: Finding[] = [];
      const missing = need.filter((g) => !gates.includes(g));
      for (const g of missing) out.push({ severity: 'block', reason: `Trail ${ship.trail} needs Gate ${g}.`, fix: { kind: 'ship' } });
      if (missing.length === 0) {
        const at = need.map((g) => gates.indexOf(g));
        if (at.some((v, i) => i > 0 && v < at[i - 1])) out.push({ severity: 'block', reason: `Gates must come in the order ${need.join(', ')}.`, fix: { kind: 'ship' } });
      }
      return out;
    },
  },
  {
    id: 'PF-09',
    title: 'The design system is written before the first build',
    group: 'gates',
    severity: 'block',
    run: ({ ship, stages }) => {
      if (ship.scoped) return { na: 'A scoped repair on a built site; the design system already exists.' };
      const firstBuild = stages.findIndex((s) => s.phase === 'build');
      if (firstBuild < 0) return { na: 'No build stage.' };
      const before = stages.slice(0, firstBuild).some((s) => s.outputs.some((o) => basename(o) === 'DESIGN.md'));
      return before ? [] : [{ severity: 'block', reason: `No stage before ${stages[firstBuild].id} outputs DESIGN.md.`, fix: stageFix(stages[firstBuild]) }];
    },
  },
  {
    id: 'PF-10',
    title: 'An independent finish review precedes the last gate',
    group: 'gates',
    severity: 'block',
    run: ({ ship, stages, agentOf }) => {
      const gateAt = ship.voyage.findIndex((v) => isGate(v) && v.gate === 'C');
      if (gateAt < 0) return { na: 'No Gate C (PF-08 reports it).' };
      const builders = new Set(stages.filter((s) => s.phase === 'build').map((s) => s.member));
      const before = ship.voyage.slice(0, gateAt).filter(isStage);
      // The reviewer is the independent critic, and must have built nothing in this ship (loop bound 1).
      const ok = before.some((s) => s.phase === 'verify' && agentOf(s.member)?.id === 'independent-critic' && !builders.has(s.member));
      return ok ? [] : [{ severity: 'block', reason: 'No verify stage by the independent critic, who built nothing here, comes before Gate C. The author does not review their own work.', fix: { kind: 'ship' } }];
    },
  },
  {
    id: 'PF-11',
    title: "The critic's model tier is at least the builder's",
    group: 'crew',
    severity: 'warn',
    run: ({ stages, agentOf, member }) => {
      const builders = stages.filter((s) => s.phase === 'build').map((s) => agentOf(s.member)).filter((a): a is KbAgent => !!a);
      const critics = stages.filter((s) => s.phase === 'verify' && agentOf(s.member)?.id === 'independent-critic');
      if (builders.length === 0 || critics.length === 0) return { na: 'No builder or no critic stage.' };
      const top = Math.max(...builders.map((a) => TIER[a.model]));
      return critics.flatMap((s): Finding[] => {
        const a = agentOf(s.member)!;
        return TIER[a.model] < top ? [{ severity: 'warn', reason: `${member(s.member)?.character.name ?? s.member} scores at ${a.model}, below the builder's tier.`, fix: stageFix(s) }] : [];
      });
    },
  },
  {
    id: 'PF-12',
    title: 'No plan is written by a reader-tier agent',
    group: 'crew',
    severity: 'warn',
    run: ({ stages, agentOf }) => {
      const plans = stages.filter((s) => s.outputs.some((o) => WRITE_PLANS.test(basename(o))));
      if (plans.length === 0) return { na: 'No stage writes a plan.' };
      return plans.flatMap((s): Finding[] => {
        const a = agentOf(s.member);
        return a?.model === 'haiku' ? [{ severity: 'warn', reason: `Stage ${s.id} writes a plan with ${a.id}, a reader-tier (haiku) agent; plans are written at planner tier.`, fix: stageFix(s) }] : [];
      });
    },
  },
  {
    id: 'PF-13',
    title: 'A run-plan stage comes first',
    group: 'stages',
    severity: 'warn',
    run: ({ stages }) => {
      const first = stages[0];
      if (!first) return [{ severity: 'warn', reason: 'The voyage has no stages.', fix: { kind: 'ship' } }];
      return first.outputs.some((o) => basename(o) === '00-run-plan.md') ? [] : [{ severity: 'warn', reason: `The first stage (${first.id}) does not write 00-run-plan.md; agents not in the run plan do not run.`, fix: stageFix(first) }];
    },
  },
  {
    id: 'PF-14',
    title: 'Equipped artifacts are on route, active and still in the library',
    group: 'crew',
    severity: 'warn',
    run: ({ ship, idx }) =>
      ship.crew.flatMap((m) =>
        m.loadout.flatMap((e): Finding[] =>
          equipNotes(idx, m.agent, e.skill)
            // A build skill on a read-only agent is judged per stage by PF-07, not per artifact.
            .filter((n) => n.code !== 'read-only-build')
            .map((n) => ({ severity: n.severity, reason: `${m.character.name}: ${e.skill}. ${n.message}`, fix: { kind: 'socket', member: m.id, skill: e.skill } as Fix })),
        ),
      ),
  },
  {
    id: 'PF-15',
    title: 'The ship was saved against the current library',
    group: 'library',
    severity: 'warn',
    run: ({ ship, idx }) =>
      ship.kbHash === idx.kb.sourceHash ? [] : [{ severity: 'warn', reason: 'The library changed since this ship was saved. Re-check its skills and stages.', fix: { kind: 'ship' } }],
  },
];

function worst(findings: Finding[]): Severity | null {
  let w: Severity | null = null;
  for (const f of findings) if (!w || RANK[f.severity] > RANK[w]) w = f.severity;
  return w;
}

export function preflight(idx: KbIndex, ship: Ship): PreflightReport {
  const ctx = makeCtx(idx, ship);
  const checks: Check[] = RULES.map((rule) => {
    const result = rule.run(ctx);
    const base = { id: rule.id, title: rule.title, group: rule.group, severity: rule.severity };
    if (!Array.isArray(result)) return { ...base, status: 'na' as const, reason: result.na, findings: [] };
    const status = worst(result);
    return { ...base, status: status ?? ('pass' as const), reason: result[0]?.reason ?? 'Passed.', findings: result };
  });
  const applicable = checks.filter((c) => c.status !== 'na').length;
  const passed = checks.filter((c) => c.status === 'pass' || c.status === 'info').length;
  const blockers = checks.filter((c) => c.status === 'block').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const raw = applicable === 0 ? 0 : Math.round((100 * passed) / applicable);
  return {
    checks,
    applicable,
    passed,
    integrity: blockers > 0 ? Math.min(99, raw) : raw,
    blockers,
    warnings,
    clean: blockers === 0 && warnings === 0,
    canExport: blockers === 0,
    next: checks.find((c) => c.status === 'block') ?? checks.find((c) => c.status === 'warn') ?? null,
  };
}
