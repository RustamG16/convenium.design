import assert from 'node:assert/strict';
import {launch} from './lib/cdp.mjs';
import {startServer,navigate,settle,evaluate,captureConsole} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try{
 const page=await browser.newPage(),errors=[];captureConsole(page,errors);
 const created=await(await fetch(server.base+'/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Keyboard fixture'})})).json();
 const key=async key=>{const code=key==='Tab'?9:13;await page.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,text:key==='Enter'?'\r':'',windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});};
 async function reach(id){
  for(let count=0;count<150;count++){
   if(await evaluate(page,`document.activeElement.id===${JSON.stringify(id)}`)){
    assert.equal(await evaluate(page,`getComputedStyle(document.activeElement).outlineStyle!=='none'||getComputedStyle(document.activeElement).boxShadow!=='none'`),true,'Visible keyboard focus: '+id);return;
   }
   await key('Tab');
  }
  throw new Error('Keyboard cannot reach '+id+' '+await evaluate(page,`location.hash+' '+document.querySelector('.view.is-active').textContent.slice(0,700)`));
 }
 async function activate(id){await reach(id);await key('Enter');await settle(page,220);}
 async function fill(id,text){await reach(id);await page.send('Input.insertText',{text});}
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
 await navigate(page,server.base+'/#/projects/'+created.project.id+'/home');await settle(page,2200);
 await fill('journey-goal','Build a keyboard fixture website');await activate('journey-start');
 for(const answer of ['Complete the local workflow','Keyboard users','Preserve the local stack','Supplied evidence','No new media']){await fill('journey-answer',answer);await activate('journey-confirm-answer');}
 await activate('journey-review-brief');await activate('journey-cancel-proposal');
 assert.equal(await evaluate(page,`!!document.querySelector('#journey-proposal')`),false,'Cancel closes the proposal');
 assert.equal((await(await fetch(server.base+`/api/projects/${created.project.id}/journey`)).json()).artifacts.length,0,'Cancel saves no brief');
 await activate('journey-review-brief');await activate('journey-approve-proposal');
 await activate('journey-create-plan');await activate('journey-approve-proposal');
 await activate('systems-workflow-primary');
 assert.match(await evaluate(page,'location.hash'),new RegExp('/projects/'+created.project.id+'/playground$'),'Configuration preserves project identity in its next route');
 await activate('journey-compare');
 await activate('journey-apply-setup');await activate('journey-approve-proposal');
 await activate('journey-review-plan');await activate('journey-approve-proposal');
 await activate('journey-execute');await activate('journey-approve-proposal');
 await activate('journey-accept-result');await activate('journey-approve-proposal');
 await activate('journey-next');
 assert.match(await evaluate(page,'location.hash'),/home$/);
 await activate('journey-start');
 for(const answer of ['A revised local goal','Returning users','Keep the framework','Existing evidence','No media']){await fill('journey-answer',answer);await activate('journey-confirm-answer');}
 await activate('journey-review-brief');await activate('journey-approve-proposal');
 assert.ok(await evaluate(page,`!!document.querySelector('#journey-create-plan')`),'Changed brief requires a refreshed plan');
 await activate('journey-create-plan');await activate('journey-approve-proposal');
 await evaluate(page,`location.hash='#/projects/${created.project.id}/plan'`);await settle(page,220);
 await activate('journey-review-plan');await activate('journey-approve-proposal');
 assert.ok(await evaluate(page,`!!document.querySelector('#journey-execute')`),'Old output cannot satisfy a revised plan: '+await evaluate(page,`location.hash+' '+document.querySelector('.view.is-active').textContent.slice(0,1400)`));
 assert.deepEqual(errors,[]);
 console.log('Keyboard-only full fixture journey, proposal cancellation and visible focus PASS');
}finally{await browser.close();server.proc.kill();}
