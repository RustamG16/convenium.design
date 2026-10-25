import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPlan, executionOrder, type SystemConfig } from './planner.ts'

const skill = (id: string) => ({ id, versionId: `${id}@1` })

const system: SystemConfig = {
  id: 'olympus-web',
  name: 'Olympus Web System',
  instructions: 'Plan first, activate only relevant specialists, preserve gates.',
  agents: [
    {
      id: 'evidence-analyst',
      name: 'Evidence Analyst',
      description: 'Inspects current-state evidence.',
      phase: 'diagnose',
      activation: 'Existing page or references need diagnosis.',
      signals: [
        { term: 'audit', weight: 2 }, { term: 'existing', weight: 2 },
        { term: 'redesign', weight: 2 }, { term: 'evidence' }, { term: 'reference' }
      ],
      skills: [skill('ux-evidence-audit'), skill('reference-deconstruction')],
      effort: 'standard',
      dependsOn: [],
      outputs: ['01-audit.md'],
      requiresApproval: false,
      enabled: true,
      priority: 8
    },
    {
      id: 'experience-designer',
      name: 'Experience Designer',
      description: 'Shapes hierarchy and distinct directions.',
      phase: 'direct',
      activation: 'A visual or interaction direction must be designed.',
      signals: [
        { term: 'concept', weight: 2 }, { term: 'redesign', weight: 2 },
        { term: 'design' }, { term: 'layout' }, { term: 'hierarchy' }
      ],
      skills: [skill('concept-studio')],
      effort: 'deep',
      dependsOn: ['evidence-analyst'],
      outputs: ['02-concepts.md'],
      requiresApproval: false,
      enabled: true,
      priority: 7
    },
    {
      id: 'motion-engineer',
      name: 'Motion Engineer',
      description: 'Purposeful motion.',
      phase: 'prepare',
      activation: 'Motion communicates state or sequence.',
      signals: [
        { term: 'animation', weight: 2 }, { term: 'motion', weight: 2 },
        { term: 'scroll', weight: 2 }, { term: 'gsap', weight: 3 }
      ],
      skills: [skill('gsap-core')],
      effort: 'standard',
      dependsOn: ['experience-designer'],
      outputs: ['06-build-plan.md#motion'],
      requiresApproval: false,
      enabled: true,
      priority: 5
    },
    {
      id: 'media-producer',
      name: 'Media Producer',
      description: 'Plans media and provenance.',
      phase: 'prepare',
      activation: 'Missing visual media is required.',
      signals: [{ term: 'image', weight: 2 }, { term: 'photo', weight: 2 }, { term: 'video', weight: 2 }],
      requires: ['image', 'photo', 'video', 'asset'],
      skills: [skill('asset-director')],
      effort: 'brief',
      dependsOn: ['experience-designer'],
      outputs: ['05-asset-manifest.md'],
      requiresApproval: true,
      enabled: true,
      priority: 3
    }
  ]
}

test('routes an audit brief to diagnosis only', () => {
  const plan = buildPlan('Audit the existing pricing page', system)
  assert.deepEqual(plan.steps.map(s => s.agentId), ['evidence-analyst'])
  assert.equal(plan.noRouteReason, null)
})

test('later steps consume earlier artifacts instead of the raw brief', () => {
  const plan = buildPlan('Redesign the existing landing page concept', system)
  const designer = plan.steps.find(s => s.agentId === 'experience-designer')!
  assert.deepEqual(designer.dependsOn, ['evidence-analyst'])
  assert.deepEqual(designer.inputs, ['01-audit.md'])
})

test('negation suppresses an agent — the S15 regression', () => {
  const plan = buildPlan('Redesign the existing page but no animation please', system)
  assert.ok(!plan.steps.some(s => s.agentId === 'motion-engineer'))
  assert.ok(plan.dormant.some(d => d.agentId === 'motion-engineer'))
})

test('an unmatched brief produces an explicit no-route, not an empty list', () => {
  const plan = buildPlan('What is your refund policy?', system)
  assert.equal(plan.steps.length, 0)
  assert.match(plan.noRouteReason!, /threshold/)
})

test('dependencies on dormant agents are dropped so the DAG stays valid', () => {
  const plan = buildPlan('Add a scroll animation and gsap timeline', system)
  const motion = plan.steps.find(s => s.agentId === 'motion-engineer')!
  assert.deepEqual(motion.dependsOn, [])   // experience-designer never activated
  assert.deepEqual(motion.inputs, [])
})

test('gates are derived from the phases actually present', () => {
  const audit = buildPlan('Audit the existing page', system)
  assert.deepEqual(audit.gates, [])
  const full = buildPlan('Redesign the existing page concept with images', system)
  assert.ok(full.gates.includes('A'))
  assert.ok(full.gates.includes('B'))
})

test('approval-gated agents are flagged, not silently run', () => {
  const plan = buildPlan('Redesign the existing page concept with new photo assets', system)
  const media = plan.steps.find(s => s.agentId === 'media-producer')!
  assert.equal(media.requiresApproval, true)
})

test('execution order is layered and dependency-correct', () => {
  const plan = buildPlan('Redesign the existing page concept with scroll animation', system)
  const waves = executionOrder(plan)
  assert.deepEqual(waves[0].map(s => s.agentId), ['evidence-analyst'])
  assert.deepEqual(waves[1].map(s => s.agentId), ['experience-designer'])
})

test('a cyclic plan throws instead of looping forever', () => {
  const cyclic: SystemConfig = {
    ...system,
    agents: [
      { ...system.agents[0], dependsOn: ['experience-designer'] },
      { ...system.agents[1], dependsOn: ['evidence-analyst'] }
    ]
  }
  const plan = buildPlan('Redesign the existing page concept', cyclic)
  assert.throws(() => executionOrder(plan), /Cyclic/)
})

test('cost estimate is derived, never invented', () => {
  const plan = buildPlan('Redesign the existing page concept', system)
  assert.equal(plan.estimate.calls, plan.steps.length + 1)
  assert.ok(plan.estimate.effortUnits > 0)
})
