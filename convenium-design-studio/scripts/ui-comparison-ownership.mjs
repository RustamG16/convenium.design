import assert from 'node:assert/strict';
import {launch} from './lib/cdp.mjs';
import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try {
 const page=await browser.newPage(),p=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
 const other=(await(await fetch(server.base+'/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:'{"name":"Comparison ownership"}'})).json()).project.id;
 await navigate(page,server.base+`/#/projects/${p.id}/playground`);await settle(page,1800);
 for(const index of [0,1]) {
  await evaluate(page,`window.realFetch ||= window.fetch;window.fetch=async(...args)=>{const response=await realFetch(...args);if(String(args[0])==='/api/workflow/compare')await new Promise(resolve=>window.releaseComparison=resolve);return response;};document.querySelector('#journey-compare').click()`);await settle(page,250);
  await evaluate(page,`{const select=document.querySelector('#journey-setup-${index}');select.selectedIndex=(select.selectedIndex+1)%select.options.length;select.dispatchEvent(new Event('change'));window.releaseComparison()}`);await settle(page,250);
  assert.match(await evaluate(page,`document.querySelector('#journey-comparison').textContent`),/fresh comparison/,'Obsolete response cannot restore invalidated comparison');
  assert.equal(await evaluate(page,`document.querySelector('#journey-apply-setup').disabled`),true);
 }
 for(const transition of ['route','project','reconnect']) {
  await evaluate(page,`document.querySelector('#journey-compare').click()`);await settle(page,250);
  if(transition==='reconnect') {
   await page.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
   await page.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await settle(page,400);
  } else {
   const target=transition==='project'?other:p.id;
   await evaluate(page,`location.hash='#/projects/${target}/home'`);await settle(page,250);
   await evaluate(page,`location.hash='#/projects/${p.id}/playground'`);await settle(page,300);
  }
  await evaluate(page,`window.releaseComparison()`);await settle(page,250);
  assert.match(await evaluate(page,`document.querySelector('#journey-comparison').textContent`),/Not tested/,transition+' invalidates pending comparison');
  assert.equal(await evaluate(page,`document.querySelector('#journey-apply-setup').disabled`),true);
 }
 await evaluate(page,`window.fetch=window.realFetch;document.querySelector('#journey-compare').click()`);await settle(page,300);
 assert.match(await evaluate(page,`document.querySelector('#journey-comparison').textContent`),/4 of 4/,'Current inputs can still complete a fresh comparison');
 console.log('Comparison input, route, project and reconnect ownership PASS');
}finally{await browser.close();server.proc.kill();}

