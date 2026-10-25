import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {startServer} from './lib/harness.mjs';
test('scratch agent settings never write the real knowledge directory',async()=>{
 const server=await startServer({scratchData:true});
 try {
  const r=await fetch(server.base+'/api/agents/design-engineer',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({budget:4321})});
  assert.equal(r.status,200);
  const saved=JSON.parse(await readFile(join(server.dataDir,'knowledge','agents.json'),'utf8'));
  assert.equal(saved['design-engineer'].budget,4321);
 }finally{server.proc.kill();}
});
