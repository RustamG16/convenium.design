import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate,captureConsole} from './lib/harness.mjs';
const server=await startServer({scratchData:true});const browser=await launch();
try{
 const page=await browser.newPage();const errors=[];captureConsole(page,errors);
 const project=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await navigate(page,server.base+`/#/projects/${project.id}/work/${project.chats[0].id}`);await settle(page,2200);
 await evaluate(page,`document.querySelector('#workspace-open').click()`);
 assert.equal(await evaluate(page,`document.querySelectorAll('.workspace-overlay').length`),1);
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
 assert.equal(await evaluate(page,'document.activeElement.id'),'workspace-open');
 await evaluate(page,`document.querySelector('#workspace-open').click();document.querySelector('#toggle-navigation').click()`);
 assert.equal(await evaluate(page,`document.querySelectorAll('.workspace-overlay').length`),0,'Navigation replaces workspace drawer');
 await evaluate(page,`document.querySelector('#toggle-oracle').click()`);
 assert.equal(await evaluate(page,`document.body.classList.contains('shell-drawer-open')`),false,'Oracle replaces navigation drawer');
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
 const routes=['home','intake','brief','plan','plan/configure','playground','work/'+project.chats[0].id,'results','knowledge/connections','system'];
 for(const width of [390,820,1280,1440,1920]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  for(const route of routes){await evaluate(page,`location.hash='#/projects/${project.id}/${route}'`);await settle(page,120);assert.equal(await evaluate(page,'document.documentElement.scrollWidth>innerWidth'),false,`${width} ${route} overflow`);}
 }
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-reduced-transparency',value:'reduce'}]});
 assert.equal(await evaluate(page,`getComputedStyle(document.querySelector('#main-content'),'::before').display`),'none');
 await evaluate(page,`location.hash='#/projects/${project.id}/home'`);await settle(page,200);
 await evaluate(page,`document.documentElement.style.fontSize='32px'`);
 for(const width of [390,820,1280,1440,1920]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  for(const route of routes){await evaluate(page,`location.hash='#/projects/${project.id}/${route}'`);await settle(page,120);assert.equal(await evaluate(page,'document.documentElement.scrollWidth>innerWidth'),false,`200% text ${width} ${route} overflow`);}
 }
 await page.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});await settle(page,120);
 assert.equal(await evaluate(page,'document.body.dataset.shellState'),'offline');
 await evaluate(page,`location.hash='#/projects'`);await settle(page,150);
 assert.equal(await evaluate(page,`document.querySelector('#shell-create-project').disabled`),true,'Offline project creation disabled');
 await evaluate(page,`location.hash='#/projects/${project.id}/playground'`);await settle(page,150);
 assert.equal(await evaluate(page,`document.querySelector('#journey-compare')?.disabled ?? true`),true,'Offline comparison disabled');
 await page.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await settle(page,120);
 assert.equal(await evaluate(page,'document.body.dataset.shellState'),'ready');
 assert.deepEqual(errors,[]);console.log('Recovery states: overlay ownership, focus return, 50 route/width pairs, 200% text, reduced motion/transparency and offline recovery PASS');
}finally{await browser.close();server.proc.kill();}
