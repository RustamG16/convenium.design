import assert from 'node:assert/strict';
import {launch} from './lib/cdp.mjs';
import {startServer,navigate,settle,evaluate,captureConsole} from './lib/harness.mjs';
const server=await startServer({scratchData:true}); const browser=await launch();
try {
 const page=await browser.newPage(); const errors=[]; captureConsole(page,errors);
 const receipt=await (await fetch(server.base+'/api/systems/savra-v2-system/receipt')).json();
 for(const width of [390,820,1280,1440,1920]) {
  await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  for(const route of ['agents','system','plan/configure']) {
   await navigate(page,server.base+`/?receipt=${width}-${route}#/${route}`);
   for(let attempt=0;attempt<40;attempt++){await settle(page,100);if(await evaluate(page,`document.body.dataset.shellState==='ready'`))break;}
   assert.equal(await evaluate(page,`document.body.dataset.shellState`),'ready','Initialization must complete');
   const roles=await evaluate(page,`[...document.querySelectorAll('.view.is-active [data-workflow-role]')].map(e=>e.dataset.workflowRole)`);
   assert.deepEqual(roles,receipt.workflow.roles.map(r=>r.id),route+' exact role order');
   assert.equal(await evaluate(page,`document.documentElement.scrollWidth>innerWidth`),false,route+' overflow');
   if(['agents','plan/configure'].includes(route)){
    await evaluate(page,`document.querySelector('.view.is-active [data-configure-role]').click()`);
    assert.ok(await evaluate(page,`document.querySelector('[data-role-inspector]').textContent.includes('olympus-design-director')`));
    assert.equal(await evaluate(page,`document.querySelector('.view.is-active #role-budget').type`),'number','Role inspector supports budget configuration');
   }else{
    await evaluate(page,`document.querySelector('.view.is-active [data-workflow-role] summary').click()`);
    assert.ok(await evaluate(page,`document.querySelector('.view.is-active [data-workflow-role]').textContent.includes('olympus-design-director')`));
   }
  }
 }
 await evaluate(page,`location.hash='#/system'`); await settle(page,200);
 await evaluate(page,`document.querySelector('.view.is-active [data-show-graph]').click()`);
 assert.equal(await evaluate(page,`document.querySelectorAll('.view.is-active [data-phase-node]').length`),receipt.workflow.phases.length);
 await evaluate(page,`document.querySelector('.view.is-active [data-phase-node="build"]').click()`);
 assert.equal(await evaluate(page,`document.querySelector('.view.is-active [data-phase-list="build"]').getAttribute('aria-current')`),'true');
 assert.match(await evaluate(page,`document.querySelector('.view.is-active [data-phase-inspector]').textContent`),/design-engineer/);
 await evaluate(page,`location.hash='#/knowledge/connections'`);await settle(page,200);
 assert.equal(await evaluate(page,`document.querySelectorAll('.view.is-active [data-evidence-row]').length`),receipt.artifacts.length);
 await evaluate(page,`document.querySelector('.view.is-active [data-evidence-row="design"]').click()`);
 assert.match(await evaluate(page,`document.querySelector('.view.is-active [data-evidence-inspector]').textContent`),/DESIGN.md/);
 await evaluate(page,`document.querySelector('#knowledge-show-connections').click()`);
 assert.equal(await evaluate(page,`document.querySelectorAll('[data-evidence-edge]').length`),receipt.artifacts.length,'Each artifact has a real project membership edge');
 await evaluate(page,`document.querySelector('#knowledge-zoom-in').click()`);
 assert.equal(await evaluate(page,`document.querySelector('[data-knowledge-plane]').style.zoom`),'1.2');
 await evaluate(page,`document.querySelector('[data-evidence-node="plan"]').click()`);
 assert.equal(await evaluate(page,`document.querySelector('[data-evidence-row="plan"]').getAttribute('aria-pressed')`),'true');
 await evaluate(page,`document.querySelector('#knowledge-focus-selected').click()`);
 assert.equal(await evaluate(page,`document.activeElement.dataset.evidenceNode`),'plan');
 await evaluate(page,`document.querySelector('#knowledge-reset').click()`);
 assert.equal(await evaluate(page,`document.querySelector('[data-knowledge-plane]').style.zoom`),'1');
 assert.deepEqual(errors,[]);
 console.log('Savra System: six roles, five widths, disclosures, graph/list synchronization PASS');
} finally {await browser.close();server.proc.kill();}
