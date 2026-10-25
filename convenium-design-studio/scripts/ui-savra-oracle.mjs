import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate,captureConsole} from './lib/harness.mjs';
const server=await startServer({scratchData:true});const browser=await launch();
async function waitFor(page,selector){for(let attempt=0;attempt<60;attempt++){if(await evaluate(page,`!!document.querySelector(${JSON.stringify(selector)})`))return;await settle(page,100);}assert.fail('Timed out waiting for '+selector+': '+await evaluate(page,`location.hash+' '+document.querySelector('.view.is-active').textContent.slice(-1500)`));}
try{
 for(const width of [390,820,1280,1440,1920]) {
 const created=await(await fetch(server.base+'/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Journey fixture '+width})})).json();
 const page=await browser.newPage();const errors=[];captureConsole(page,errors);
 await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await navigate(page,server.base+'/#/projects/'+created.project.id+'/home');await settle(page,2500);
 assert.ok(await evaluate(page,`!!document.querySelector('#journey-goal')`),'Home has the journey goal entry');
 await evaluate(page,`document.querySelector('#journey-goal').value='Build a deterministic fixture website';document.querySelector('#journey-start').click()`);await settle(page,400);
 for(const answer of ['Demonstrate the complete workflow','Design teams','Keep the local stack','Supplied Savra evidence','Supplied local media only']) {
  await evaluate(page,`document.querySelector('#journey-answer').value=${JSON.stringify(answer)};document.querySelector('#journey-confirm-answer').click()`);await settle(page,150);
 }
 assert.match(await evaluate(page,'location.hash'),/brief$/);
 await evaluate(page,`document.querySelector('#journey-review-brief').click()`);await settle(page,300);
 assert.ok(await evaluate(page,`document.querySelector('#journey-proposal').textContent.includes('artifact.save')`),'Proposal displays concrete changes');
 await evaluate(page,`document.querySelector('#journey-approve-proposal').click()`);await settle(page,500);
 assert.match(await evaluate(page,'location.hash'),/plan$/);
 await evaluate(page,`document.querySelector('#journey-create-plan').click()`);await settle(page,300);
 await evaluate(page,`document.querySelector('#journey-approve-proposal').click()`);await settle(page,400);
 assert.match(await evaluate(page,'location.hash'),/plan\/configure$/);
 await evaluate(page,`document.querySelector('[data-configure-role="design-engineer"]').click();document.querySelector('#role-budget').value='8000';document.querySelector('#role-budget').dispatchEvent(new Event('change'))`);
 await evaluate(page,`document.querySelector('.view.is-active [data-primary-action]').click()`);await settle(page,400);
 await evaluate(page,`document.querySelector('#journey-compare').click()`);await settle(page,500);
 assert.match(await evaluate(page,`document.querySelector('#journey-comparison').textContent`),/4 of 4/);
 await evaluate(page,`document.querySelector('#journey-apply-setup').click()`);await settle(page,250);
 await evaluate(page,`document.querySelector('#journey-approve-proposal').click()`);await settle(page,400);
 assert.match(await evaluate(page,'location.hash'),/plan$/);
 const savedJourney=await(await fetch(server.base+`/api/projects/${created.project.id}/journey`)).json();
 assert.equal(savedJourney.artifacts.find(a=>a.kind==='plan').content.configuration.roleSettings['design-engineer'].budget,8000,'Reviewed Setup B retains role draft');
 const routed=await(await fetch(server.base+'/api/oracle/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'Inspect approved project configuration',projectId:created.project.id})})).json();
 assert.equal(routed.plan.roleSettings['design-engineer'].budget,8000,'Oracle uses the same applied role configuration');
 await evaluate(page,`document.querySelector('#journey-review-plan').click()`);await settle(page,250);
 await evaluate(page,`document.querySelector('#journey-approve-proposal').click()`);await settle(page,400);
 assert.match(await evaluate(page,'location.hash'),/work/);
 await evaluate(page,`document.querySelector('#journey-execute').click()`);await waitFor(page,'#journey-approve-proposal');
 await evaluate(page,`document.querySelector('#journey-approve-proposal').click()`);await settle(page,500);
 assert.match(await evaluate(page,'location.hash'),/results/);
 assert.match(await evaluate(page,`document.querySelector('.view.is-active').textContent`),/Automated fixture contract only/);
 const currentResult=await evaluate(page,'location.hash');
 const runId=currentResult.split('/').at(-1);
 await evaluate(page,`location.hash='#/projects/${created.project.id}/system/${runId}'`);await settle(page,250);
 assert.match(await evaluate(page,`document.querySelector('[data-project-system]').textContent`),new RegExp(runId));
 await evaluate(page,`document.querySelector('[data-phase-list="build"]').click()`);
 assert.match(await evaluate(page,`document.querySelector('[data-phase-inspector]').textContent`),/Output recorded/);
 await evaluate(page,`location.hash='#/projects/${created.project.id}/knowledge/connections'`);await settle(page,250);
 assert.ok(await evaluate(page,`document.querySelector('[data-project-knowledge] [data-evidence-row="designDNA"]')!==null`),'Project Design DNA is linked evidence');
 assert.ok(await evaluate(page,`[...document.querySelectorAll('[data-project-knowledge] [data-evidence-row]')].some(e=>e.textContent.includes('output'))`),'Produced output is project evidence');
 await evaluate(page,`location.hash=${JSON.stringify('#/projects/')}+${JSON.stringify(created.project.id)}+'/results/missing-run'`);await settle(page,200);
 assert.match(await evaluate(page,`document.querySelector('.view.is-active').textContent`),/Run not found/,'Unknown run must never show another run output');
 await evaluate(page,`location.hash=${JSON.stringify(currentResult)}`);await settle(page,200);
 await evaluate(page,`document.querySelector('#journey-accept-result').click()`);await settle(page,250);
 await evaluate(page,`document.querySelector('#journey-approve-proposal').click()`);await settle(page,400);
 assert.ok(await evaluate(page,`!!document.querySelector('#journey-next')`));
 const resultUrl=await evaluate(page,'location.href');await navigate(page,resultUrl.replace('/#','/?reload#'));await waitFor(page,'#journey-next');
 assert.ok(await evaluate(page,`!!document.querySelector('#journey-next')`),'Accepted result survives reload at '+width+': '+await evaluate(page,`location.hash+' '+document.querySelector('.view.is-active').textContent.slice(0,1200)`));
 await evaluate(page,`document.querySelector('#journey-next').click()`);await settle(page,300);
 assert.match(await evaluate(page,'location.hash'),/home$/);
 assert.equal(await evaluate(page,'document.documentElement.scrollWidth>innerWidth'),false,'No overflow at '+width);
 assert.deepEqual(errors,[]);
 }
 console.log('Complete deterministic journey: Home → intake → brief → plan → configure → comparison → approve → fixture execution → QA → accept → reload → continue PASS');
}finally{await browser.close();server.proc.kill();}
