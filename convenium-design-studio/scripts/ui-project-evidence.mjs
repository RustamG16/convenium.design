import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try{const page=await browser.newPage();const p=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
 await navigate(page,server.base+`/#/projects/${p.id}/system/missing-run`);await settle(page,2000);
 assert.match(await evaluate(page,`document.querySelector('.view.is-active').textContent`),/Run not found/);
 await evaluate(page,`location.hash='#/projects/${p.id}/knowledge/connections'`);await settle(page,300);
 assert.ok(await evaluate(page,`!!document.querySelector('[data-project-knowledge]')`));
 assert.match(await evaluate(page,`document.querySelector('[data-project-knowledge]').textContent`),/No saved project artifacts/);
 await evaluate(page,`document.querySelector('[data-global-route="system"]').click()`);await settle(page,250);
 assert.equal(await evaluate(page,'location.hash'),`#/projects/${p.id}/system`,'Rail keeps selected project context');
 console.log('Project System run recovery and Knowledge ownership PASS');
}finally{await browser.close();server.proc.kill();}
