import test from 'node:test';import assert from 'node:assert/strict';
import {startServer} from './lib/harness.mjs';
test('Oracle uses the receipt and cannot execute blocked build phases through role checkboxes',async()=>{
 const server=await startServer({scratchData:true});
 try{
  const receipt=await(await fetch(server.base+'/api/systems/savra-v2-system/receipt')).json();
  const response=await fetch(server.base+'/api/oracle/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'Build a website',mode:'demo',approvedAgentIds:receipt.workflow.roles.map(r=>r.id)})});
  assert.equal(response.status,200);const run=await response.json();
  assert.deepEqual(run.plan.workflow,receipt.workflow);
  assert.ok(run.waiting.some(s=>s.phase==='build'),'Gate B still blocks build');
  assert.ok(!run.trace.some(s=>s.phase==='build'),'Blocked build is never simulated as executed');
 }finally{server.proc.kill();}
});
test('project journey commands persist reviewed hash-bound proposals and reject direct writes',async()=>{
 const server=await startServer({scratchData:true});
 try{
  const project=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
  const path=server.base+`/api/projects/${project.id}/journey`;
  assert.equal((await fetch(path)).status,200);
  const post=async command=>{const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(command)});return {status:r.status,body:await r.json()};};
  const operation={type:'artifact.save',artifact:{id:'brief-test',projectId:project.id,kind:'brief',content:{goal:'Fixture goal'}}};
  assert.equal((await post(operation)).status,400);
  const proposed=await post({type:'proposal.create',id:'p1',operation});assert.equal(proposed.status,200);
  assert.equal(proposed.body.artifacts.length,0);
  const hash=proposed.body.proposals[0].operationHash;
  assert.equal((await post({type:'proposal.resolve',id:'p1',operationHash:'wrong',approved:true,actor:{kind:'user',id:'local-user'}})).status,400);
  await post({type:'proposal.resolve',id:'p1',operationHash:hash,approved:true,actor:{kind:'user',id:'local-user'}});
  assert.equal((await post({type:'proposal.apply',id:'p1'})).body.artifacts[0].content.goal,'Fixture goal');
  assert.equal((await(await fetch(path)).json()).artifacts[0].id,'brief-test');
  const routed=await fetch(server.base+'/api/oracle/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'Inspect evidence',projectId:project.id})});
  assert.equal(routed.status,200);
  assert.equal((await routed.json()).plan.steps.find(s=>s.phase==='evidence').status,'ready','Server reads persisted project evidence');
  const batch={type:'batch',operations:[{type:'artifact.save',artifact:{id:'plan-test',projectId:project.id,kind:'plan',content:{title:'Fixture plan'}}},{type:'artifact.save',artifact:{id:'design-test',projectId:project.id,kind:'design',content:{typeScale:[16,24,32]}}}]};
  const prepared=await post({type:'proposal.create',id:'batch',operation:batch});assert.equal(prepared.status,200,'Atomic plan/design proposal supported');
  assert.equal(prepared.body.artifacts.length,1,'Preparing a batch does not apply it');
  const proposal=prepared.body.proposals.find(p=>p.id==='batch');await post({type:'proposal.resolve',id:'batch',operationHash:proposal.operationHash,approved:true,actor:{kind:'user',id:'local-user'}});
  assert.equal((await post({type:'proposal.apply',id:'batch'})).body.artifacts.length,3);
 }finally{server.proc.kill();}
});
test('comparison evaluates both drafts against the same immutable workflow without executing them',async()=>{
 const server=await startServer({scratchData:true});try{
  const loadouts=await(await fetch(server.base+'/api/loadouts')).json();
  const r=await fetch(server.base+'/api/workflow/compare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'Build the supplied page',a:loadouts.loadouts[0].id,b:loadouts.loadouts[1].id})});
  assert.equal(r.status,200);const result=await r.json();assert.equal(result.mode,'deterministic');assert.equal(result.a.workflow.id,result.b.workflow.id);assert.equal(result.checks.every(c=>c.pass),true);assert.equal(result.productionApplied,false);
 }finally{server.proc.kill();}
});

