/**
 * Convenium.Design run workflow — Inngest.
 *
 * This is the piece the current codebase has no equivalent of. handleOracle
 * (server.mjs:113) tried to express a gated, multi-day workflow inside one HTTP
 * handler, so gates collapsed into an `approvedAgentIds` array passed up front.
 *
 * Here a gate is `step.waitForEvent`: the function suspends — no process held,
 * no worker billed — until an authenticated human resolves it, or the timeout
 * expires. That is what makes the gate real rather than advisory.
 */

import { inngest } from './client.ts'
import { NonRetriableError } from 'inngest'
import { buildPlan, executionOrder, type Gate, type PlannedStep } from '../core/planner.ts'
import * as store from '../db/queries.ts'
import { getExecutor } from '../core/executor/index.ts'

const GATE_TIMEOUT = '14d'

export const runOlympus = inngest.createFunction(
  {
    id: 'convenium-design-run',
    // Fair scheduling: one org cannot starve another.
    concurrency: [{ key: 'event.data.orgId', limit: 2 }],
    onFailure: async ({ event }) => {
      await store.failRun(event.data.event.data.runId, 'Workflow failed after retries.')
    }
  },
  { event: 'convenium-design/run.requested' },
  async ({ event, step }) => {
    const { runId, orgId, userId } = event.data

    // ── 1. Plan. Pure, deterministic, free. Never charge for this. ─────────
    const plan = await step.run('plan', async () => {
      const run = await store.getRun(runId, orgId)
      const system = await store.getSystem(run.systemId, orgId)
      const built = buildPlan(run.brief, system)
      await store.savePlan(runId, orgId, built)
      return built
    })

    if (!plan.steps.length) {
      await step.run('no-route', () =>
        store.completeRun(runId, orgId, { note: plan.noRouteReason! }))
      return { status: 'no-route' }
    }

    // ── 2. Reserve credits BEFORE any spend. Fail closed. ─────────────────
    await step.run('reserve-credits', async () => {
      const ok = await store.reserveCredits(orgId, runId, plan.estimate.effortUnits)
      if (!ok) throw new NonRetriableError('Insufficient credits.')
    })

    const waves = executionOrder(plan)
    const produced = new Map<string, string[]>()   // agentId → artifact ids
    let lastGate: Gate | null = null

    for (const [waveIndex, wave] of waves.entries()) {
      // ── 3. Gate before the phase that needs it. Blocks for real. ────────
      const gate = wave.find(s => s.gate)?.gate ?? null
      if (gate && gate !== lastGate) {
        await step.run(`open-gate-${gate}`, () =>
          store.openGate(runId, orgId, gate, [...produced.values()].flat()))

        const resolved = await step.waitForEvent(`await-gate-${gate}`, {
          event: 'convenium-design/gate.resolved',
          timeout: GATE_TIMEOUT,
          if: `async.data.runId == "${runId}" && async.data.gate == "${gate}"`
        })

        if (!resolved) {
          await step.run(`gate-${gate}-timeout`, () =>
            store.abandonRun(runId, orgId, `Gate ${gate} expired after ${GATE_TIMEOUT}.`))
          return { status: 'abandoned', gate }
        }
        if (resolved.data.decision !== 'approve') {
          await step.run(`gate-${gate}-stop`, () =>
            store.abandonRun(runId, orgId, `Gate ${gate}: ${resolved.data.decision}.`))
          return { status: resolved.data.decision, gate }
        }
        lastGate = gate
      }

      // ── 4. Execute the wave. Steps within a wave are independent by
      //       construction, so parallelism here is safe — unlike the current
      //       fixed batches of 2 that pair dependent agents. ───────────────
      const results = await Promise.all(
        wave.map(plannedStep =>
          step.run(`step-${plannedStep.agentId}-w${waveIndex}`, async () => {
            if (plannedStep.requiresApproval &&
                !(await store.isAgentApproved(runId, orgId, plannedStep.agentId))) {
              return { agentId: plannedStep.agentId, skipped: true, artifactIds: [] as string[] }
            }
            return runStep(plannedStep, { runId, orgId, produced })
          })
        )
      )

      for (const result of results) produced.set(result.agentId, result.artifactIds)
    }

    // ── 5. Gate C, then synthesis. ────────────────────────────────────────
    if (plan.gates.includes('C')) {
      await step.run('open-gate-C', () =>
        store.openGate(runId, orgId, 'C', [...produced.values()].flat()))
      const resolved = await step.waitForEvent('await-gate-C', {
        event: 'convenium-design/gate.resolved',
        timeout: GATE_TIMEOUT,
        if: `async.data.runId == "${runId}" && async.data.gate == "C"`
      })
      if (!resolved || resolved.data.decision !== 'approve') {
        await step.run('gate-c-stop', () =>
          store.abandonRun(runId, orgId, 'Gate C not approved.'))
        return { status: 'blocked-at-c' }
      }
    }

    await step.run('finalize', () => store.completeRun(runId, orgId, {}))
    await step.run('release-credits', () => store.releaseReservation(orgId, runId))
    return { status: 'complete', steps: plan.steps.length }
  }
)

async function runStep(
  plannedStep: PlannedStep,
  ctx: { runId: string; orgId: string; produced: Map<string, string[]> }
) {
  const inputArtifactIds = plannedStep.dependsOn.flatMap(id => ctx.produced.get(id) ?? [])
  const stepRow = await store.startStep(ctx.runId, ctx.orgId, plannedStep, inputArtifactIds)

  try {
    const executor = getExecutor()
    // The load-bearing line: the specialist reads prior ARTIFACTS, not the raw
    // brief. This is the single difference between orchestration and an
    // expensive ensemble.
    const { artifact, usage } = await executor.run(plannedStep, {
      inputs: await store.loadArtifacts(inputArtifactIds, ctx.orgId),
      orgId: ctx.orgId,
      runId: ctx.runId
    })

    const saved = await store.saveArtifact(ctx.orgId, ctx.runId, stepRow.id, artifact)
    await store.completeStep(stepRow.id, ctx.orgId, usage)
    await store.chargeCredits(ctx.orgId, ctx.runId, usage)
    return { agentId: plannedStep.agentId, skipped: false, artifactIds: [saved.id] }
  } catch (error) {
    // Usage is recorded even on failure — you paid for it either way.
    await store.failStep(stepRow.id, ctx.orgId, error)
    throw error
  }
}
