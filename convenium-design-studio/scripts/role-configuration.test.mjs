import test from 'node:test';import assert from 'node:assert/strict';import {buildPlan} from '../agents.mjs';
test('role draft budget and optional participation affect routing without granting gates',async()=>{
 const a=await buildPlan('Build',10000),b=await buildPlan('Build',10000,{roleSettings:{'design-engineer':{budget:8000,approval:true},'asset-producer':{enabled:true}},mediaWork:true});
 assert.notEqual(a.steps.find(s=>s.phase==='build').budget,b.steps.find(s=>s.phase==='build').budget);
 assert.equal(b.steps.find(s=>s.phase==='build').status,'blocked');
 assert.equal(b.roleSettings['design-engineer'].budget,8000);
 await assert.rejects(buildPlan('Build',10000,{roleSettings:{'design-director':{enabled:false}}}),/required/i);
 await assert.rejects(buildPlan('Build',10000,{roleSettings:{invented:{budget:3000}}}),/role/i);
});
