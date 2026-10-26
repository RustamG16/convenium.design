import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try{const page=await browser.newPage();const p=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
 await navigate(page,server.base+`/#/projects/${p.id}/plan/configure`);await settle(page,2000);
 assert.ok(await evaluate(page,`!!document.querySelector('[data-role-inspector]')`));
 await evaluate(page,`document.querySelector('[data-configure-role="design-engineer"]').click();document.querySelector('#role-budget').value='8000';document.querySelector('#role-budget').dispatchEvent(new Event('change'));document.querySelector('#systems-workflow-primary').click()`);await settle(page,300);
 await evaluate(page,`document.querySelector('#journey-compare').click()`);await settle(page,400);
 assert.match(await evaluate(page,`document.querySelector('#journey-comparison').textContent`),/8000/);
 await evaluate(page,`location.hash='#/projects/${p.id}/plan/configure'`);await settle(page,250);
 await evaluate(page,`document.querySelector('[data-configure-role="design-engineer"]').click();document.querySelector('#role-reset').click()`);
 assert.equal(await evaluate(page,`document.querySelector('#role-budget').value`),'4000');
 await evaluate(page,`document.querySelector('#role-undo').click()`);
 assert.equal(await evaluate(page,`document.querySelector('#role-budget').value`),'8000','Reset is reversible');
 console.log('Role inspector draft reaches comparison and reset PASS');
}finally{await browser.close();server.proc.kill();}
