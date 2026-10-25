import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try{const page=await browser.newPage(),p=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
 await navigate(page,server.base+`/#/projects/${p.id}/plan/configure`);await settle(page,1800);
 await evaluate(page,`location.hash='#/agents'`);await settle(page,300);
 assert.ok(await evaluate(page,`!!document.querySelector('#agents [data-role-inspector]')`),'Agents exposes the same configurable role inspector');
 await evaluate(page,`window.originalFetch=window.fetch;window.fetch=(...args)=>{if(String(args[0])==='/api/oracle/plan')window.oracleBody=JSON.parse(args[1].body);return originalFetch(...args);};document.querySelector('#oracle-prompt').value='Inspect project workflow';document.querySelector('#oracle-plan').click()`);await settle(page,350);
 assert.equal(await evaluate(page,`window.oracleBody?.projectId`),p.id,'Oracle carries selected project approval/configuration context');
 console.log('Agents inspector and Oracle project context PASS');
}finally{await browser.close();server.proc.kill();}
