/**
 * Convenium.Design planner — pure, deterministic, zero I/O, zero cost.
 *
 * Replaces agents.mjs:buildPlan. Three deliberate differences:
 *   1. Scored activation instead of boolean keyword matching (fixes S15).
 *   2. Emits a DAG with explicit inputs/outputs (fixes the "everyone gets the
 *      raw prompt" flaw at server.mjs:141).
 *   3. Effort levels instead of invented token budgets (fixes S2 + the
 *      fabricated-telemetry problem).
 *
 * This file must never import fs, fetch, or a database. That is what makes it
 * testable and what lets the product show a route before charging for it.
 */

export type Phase = 'diagnose' | 'direct' | 'prepare' | 'build' | 'verify'
export type Effort = 'brief' | 'standard' | 'deep'
export type Gate = 'A' | 'B' | 'C'

export interface SkillRef {
  id: string
  versionId: string
}

export interface AgentConfig {
  id: string
  name: string
  description: string
  phase: Phase
  activation: string
  /** Terms that raise the score. Weight defaults to 1. */
  signals: Array<{ term: string; weight?: number }>
  /** If any of these match, the agent is suppressed regardless of score. */
  vetoes?: string[]
  /** At least one must match for the agent to activate at all. */
  requires?: string[]
  skills: SkillRef[]
  effort: Effort
  /** Consumes the artifacts produced by these agent ids. */
  dependsOn: string[]
  outputs: string[]
  requiresApproval: boolean
  enabled: boolean
  /** Tie-break only. Never an execution order. */
  priority: number
}

export interface SystemConfig {
  id: string
  name: string
  instructions: string
  agents: AgentConfig[]
}

export interface PlannedStep {
  agentId: string
  name: string
  phase: Phase
  reason: string
  score: number
  skills: SkillRef[]
  effort: Effort
  dependsOn: string[]
  inputs: string[]
  outputs: string[]
  gate: Gate | null
  requiresApproval: boolean
}

export interface RunPlan {
  systemId: string
  systemName: string
  brief: string
  steps: PlannedStep[]
  dormant: Array<{ agentId: string; name: string; reason: string }>
  gates: Gate[]
  estimate: { calls: number; effortUnits: number }
  /** Set when nothing scored above threshold. The old planner could not express this. */
  noRouteReason: string | null
}

const PHASE_ORDER: Phase[] = ['diagnose', 'direct', 'prepare', 'build', 'verify']

/** The gate that must clear BEFORE a phase may run. */
const GATE_BEFORE_PHASE: Partial<Record<Phase, Gate>> = {
  direct: 'A',   // brief approved before concepts
  prepare: 'B',  // one concept selected before production
  build: 'B'
}

const EFFORT_UNITS: Record<Effort, number> = { brief: 1, standard: 2, deep: 4 }

const DEFAULT_THRESHOLD = 2

/**
 * Word-boundary match, tolerant of simple plurals and gerunds.
 *
 * The original agents.mjs matcher required an exact token, so "images" did not
 * match the signal "image" and "animations" did not match "animation" — a
 * silent routing miss on ordinary English. Suffixes are only allowed on terms
 * long enough that it cannot cause a false positive.
 */
function hit(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const suffix = term.length >= 4 ? '(?:s|es|ing)?' : ''
  return new RegExp(`(^|[^a-z0-9])${escaped}${suffix}($|[^a-z0-9])`, 'i').test(haystack)
}

/**
 * Negation windows. "no animation", "without motion", "skip the audit" must not
 * activate the agent whose signal they contain. Deliberately simple and
 * deliberately conservative: it only looks backwards a few tokens.
 */
const NEGATORS = ['no', 'not', 'without', 'skip', 'avoid', 'exclude', 'never', "don't", 'dont']

function isNegated(brief: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const suffix = term.length >= 4 ? '(?:s|es|ing)?' : ''
  const pattern = new RegExp(
    `\\b(${NEGATORS.join('|')})\\b(\\s+\\w+){0,2}\\s+${escaped}${suffix}\\b`,
    'i'
  )
  return pattern.test(brief)
}

function scoreAgent(agent: AgentConfig, brief: string): { score: number; reason: string } {
  if (agent.vetoes?.some(v => hit(brief, v))) {
    return { score: 0, reason: `Suppressed by "${agent.vetoes.find(v => hit(brief, v))}".` }
  }
  if (agent.requires?.length && !agent.requires.some(r => hit(brief, r) && !isNegated(brief, r))) {
    return { score: 0, reason: 'No required signal present.' }
  }

  let score = 0
  const matched: string[] = []
  for (const signal of agent.signals) {
    if (!hit(brief, signal.term)) continue
    if (isNegated(brief, signal.term)) {
      score -= 2
      continue
    }
    score += signal.weight ?? 1
    matched.push(signal.term)
  }

  return {
    score,
    reason: matched.length ? `Matched: ${matched.join(', ')}.` : 'No signal matched.'
  }
}

export function buildPlan(
  brief: string,
  system: SystemConfig,
  options: { threshold?: number } = {}
): RunPlan {
  const normalized = String(brief ?? '').toLowerCase()
  const threshold = options.threshold ?? DEFAULT_THRESHOLD

  const scored = system.agents
    .filter(agent => agent.enabled)
    .map(agent => ({ agent, ...scoreAgent(agent, normalized) }))

  const active = scored
    .filter(item => item.score >= threshold)
    .sort((a, b) => {
      const phaseDelta = PHASE_ORDER.indexOf(a.agent.phase) - PHASE_ORDER.indexOf(b.agent.phase)
      if (phaseDelta !== 0) return phaseDelta
      if (b.score !== a.score) return b.score - a.score
      return b.agent.priority - a.agent.priority
    })

  const activeIds = new Set(active.map(item => item.agent.id))

  const steps: PlannedStep[] = active.map(({ agent, score, reason }) => {
    // Drop dependencies on agents that did not activate, so the DAG stays valid.
    const dependsOn = agent.dependsOn.filter(id => activeIds.has(id))
    const inputs = dependsOn.flatMap(
      id => active.find(item => item.agent.id === id)?.agent.outputs ?? []
    )
    return {
      agentId: agent.id,
      name: agent.name,
      phase: agent.phase,
      reason: `${agent.activation} ${reason}`,
      score,
      skills: agent.skills,
      effort: agent.effort,
      dependsOn,
      inputs,
      outputs: agent.outputs,
      gate: GATE_BEFORE_PHASE[agent.phase] ?? null,
      requiresApproval: agent.requiresApproval
    }
  })

  const gates: Gate[] = []
  for (const step of steps) if (step.gate && !gates.includes(step.gate)) gates.push(step.gate)
  if (steps.some(step => step.phase === 'verify' || step.phase === 'build')) {
    if (!gates.includes('C')) gates.push('C')
  }

  return {
    systemId: system.id,
    systemName: system.name,
    brief: String(brief ?? '').trim(),
    steps,
    dormant: scored
      .filter(item => item.score < threshold)
      .map(item => ({ agentId: item.agent.id, name: item.agent.name, reason: item.reason })),
    gates,
    estimate: {
      calls: steps.length + (steps.length ? 1 : 0), // steps + synthesis
      effortUnits: steps.reduce((sum, step) => sum + EFFORT_UNITS[step.effort], 0)
    },
    noRouteReason: steps.length
      ? null
      : 'No specialist scored above the activation threshold. Answer directly or ask the customer to narrow the brief.'
  }
}

/** Topological order for execution. Throws on a cycle rather than silently looping. */
export function executionOrder(plan: RunPlan): PlannedStep[][] {
  const remaining = new Map(plan.steps.map(step => [step.agentId, step]))
  const done = new Set<string>()
  const waves: PlannedStep[][] = []

  while (remaining.size) {
    const wave = [...remaining.values()].filter(step =>
      step.dependsOn.every(id => done.has(id))
    )
    if (!wave.length) {
      throw new Error(
        `Cyclic dependency among: ${[...remaining.keys()].join(', ')}`
      )
    }
    for (const step of wave) {
      remaining.delete(step.agentId)
      done.add(step.agentId)
    }
    waves.push(wave)
  }
  return waves
}
