import assert from 'node:assert/strict';import {launch} from './lib/cdp.mjs';import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();try{const page=await browser.newPage(),p=(await(await fetch(server.base+'/api/workspace')).json()).projects[0];
 await navigate(page,server.base+'/#/home');await settle(page,2000);
 for(const width of [390,820,1280,1440,1920]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});for(const route of ['home','plan/configure','work/'+p.chats[0].id]){
  await evaluate(page,`location.hash='#/projects/${p.id}/${route}'`);await settle(page,200);
  const bounds=await evaluate(page,`(()=>{const main=document.querySelector('main').getBoundingClientRect(),oracle=document.querySelector('.shell-oracle-launcher').getBoundingClientRect();return {mainBottom:main.bottom,oracleTop:oracle.top,oracleBottom:oracle.bottom,height:innerHeight}})()`);
  assert.ok(bounds.mainBottom<=bounds.oracleTop+1,`${width} ${route}: Oracle must reserve space outside the scrolling workspace`);
  assert.ok(bounds.oracleBottom<=bounds.height+1,`${width} ${route}: Oracle remains inside the viewport`);
 }}console.log('Oracle reserves layout space at five widths across Home, Configure and Work PASS');
}finally{await browser.close();server.proc.kill();}
