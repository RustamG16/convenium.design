import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, agentDefinitions } from '../agents.mjs';

test('six functional roles replace aliases; ordinary planning cannot bypass Gate B', async () => {
  assert.deepEqual(agentDefinitions.map(r => r.name), ['Design Director','Visual Analyst','Asset Producer','Design Engineer','Independent Critic','Analytics Specialist']);
  const plan = await buildPlan('Implement the website', 10000, { systemId: 'savra-v2-system' });
  assert.equal(plan.system.id, 'savra-v2-system');
  assert.equal(plan.steps.find(s => s.phase === 'build').status, 'blocked');
  assert.ok(plan.dormant.includes('Asset Producer'));
  assert.ok(plan.dormant.includes('Analytics Specialist'));
  assert.ok(plan.steps.findIndex(s => s.phase === 'finish-review') > plan.steps.findIndex(s => s.phase === 'author-qa'));
  assert.ok(plan.steps.every(s => s.canDelegate === false && s.inputs && s.outputs));
  assert.ok(plan.allocatedBudget <= 10000);
});
test('explicit media and analytics scope activate bounded owners; booleans cannot forge approvals', async () => {
  const plan = await buildPlan('Build', 1000, { systemId: 'savra-v2-system', mediaWork: true, analyticsScope: true, measurableGoal: 'reservation intent', gateB: true, repairCycles: 2 });
  assert.ok(plan.steps.some(s => s.id === 'asset-producer'));
  assert.ok(plan.steps.some(s => s.id === 'analytics-specialist'));
  assert.equal(plan.steps.find(s => s.phase === 'build').status, 'blocked');
  assert.equal(plan.steps.find(s => s.phase === 'repair')?.status, 'blocked');
  assert.ok(plan.allocatedBudget <= 1000);
  assert.ok(plan.steps.filter(s => s.id === 'independent-critic').every(s => s.readOnly));
});

test('loadout context, selected skills and review requests affect the plan without granting gates', async () => {
  const loadout = { id:'fixture', name:'Fixture', slots:{craft:'apple-design'}, brief:'Preserve the existing page', budget:{approvals:{'design-engineer':true}} };
  const first = await buildPlan('Build', 5000, {loadout});
  const next = await buildPlan('Build', 5000, {loadout:{...loadout,slots:{craft:'awwwards-web-design'},brief:'Use supplied evidence'}});
  assert.notDeepEqual(first.steps.find(s=>s.phase==='build').skills,next.steps.find(s=>s.phase==='build').skills);
  assert.notEqual(first.context,next.context);
  assert.match(first.context,/Preserve the existing page/);
  assert.equal(first.steps.find(s=>s.phase==='build').status,'blocked');
});
test('displayed configuration slots use the same functional role IDs as runtime routing',async()=>{
 const {listLoadouts}=await import('../systems.mjs');const {slots}=await listLoadouts();
 assert.ok(slots.every(slot=>agentDefinitions.some(role=>role.id===slot.owner)));
});

test('phases wait for persisted input evidence, not another planned phase',async()=>{
 const plan=await buildPlan('Build',5000);
 assert.deepEqual(plan.steps.filter(s=>s.status==='ready').map(s=>s.phase),['intake']);
 assert.deepEqual(plan.steps.find(s=>s.phase==='evidence').missingInputs,['brief']);
 assert.ok(plan.steps.find(s=>s.phase==='finish-review').missingInputs.includes('qa'));
});
