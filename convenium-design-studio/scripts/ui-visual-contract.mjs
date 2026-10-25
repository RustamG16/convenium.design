import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try{const page=await browser.newPage();await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await navigate(page,server.base+'/#/agents');
 for(let i=0;i<80;i++){if(await evaluate(page,`!!document.querySelector('#agents [data-role-inspector]')`))break;await settle(page,100);}
 await evaluate(page,'document.fonts.ready');
 assert.ok(await evaluate(page,`[...document.fonts].some(f=>f.family==='Barlow'&&f.status==='loaded')`),'Actual bundled UI font must load');
 assert.equal(await evaluate(page,`document.querySelectorAll('#global-navigation a svg').length`),9,'Every navigation task has its icon');
 assert.equal(await evaluate(page,`document.querySelectorAll('#agents [data-configure-role] svg').length`),6,'All functional roles have icons');
 assert.equal(await evaluate(page,`document.querySelectorAll('#agents [data-role-responsibility]').length`),6,'Role responsibilities are scannable in rows');
 for(const route of ['system','knowledge/connections']){await evaluate(page,`location.hash='#/${route}'`);await settle(page,400);assert.equal(await evaluate(page,`(()=>{const g=document.querySelector('.view.is-active .receipt-graph,.view.is-active .receipt-knowledge-graph');return !!g&&!g.hidden&&g.getBoundingClientRect().top<600})()`),true,route+' exposes canvas on desktop');}
 console.log('Visual assets, role hierarchy and discoverable graph contract PASS');
}finally{await browser.close();server.proc.kill();}
