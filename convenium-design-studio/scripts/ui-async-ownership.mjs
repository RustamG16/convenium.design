import assert from 'node:assert/strict';
import {launch} from './lib/cdp.mjs';
import {startServer,navigate,settle,evaluate} from './lib/harness.mjs';
const server=await startServer({scratchData:true}),browser=await launch();
try{
 const ws=await(await fetch(server.base+'/api/workspace')).json(),project=ws.projects[0];
 const second=await(await fetch(server.base+`/api/projects/${project.id}/chats`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).json();
 const a=project.chats[0].id,b=second.chat?.id||second.id;
 const page=await browser.newPage();await navigate(page,server.base+`/#/projects/${project.id}/work/${a}`);await settle(page,2000);
 await evaluate(page,`window.originalFetch=window.fetch;window.fetch=async(...args)=>{const response=await originalFetch(...args);if(String(args[0]).includes('/messages')&&args[1]?.method==='POST')location.hash='#/projects/${project.id}/work/${b}';return response;};document.querySelector('#work-prompt').value='Async ownership fixture';document.querySelector('#work-composer').requestSubmit();`);
 await settle(page,900);
 const detailA=await(await fetch(server.base+'/api/chats/'+a)).json(),detailB=await(await fetch(server.base+'/api/chats/'+b)).json();
 assert.equal(detailB.messages.length,0,'Delayed reply must not write to the newly selected chat');
 assert.equal(detailA.messages.at(-1).role,'assistant','Reply belongs to the initiating conversation');
 await evaluate(page,`window.fetch=async(...args)=>{const response=await originalFetch(...args);if(String(args[0])==='/api/loadouts')await new Promise(resolve=>window.releaseLoadouts=resolve);return response;};location.hash='#/projects/${project.id}/playground'`);await settle(page,200);
 await evaluate(page,`location.hash='#/projects/${project.id}/home'`);await settle(page,200);
 await evaluate(page,`window.releaseLoadouts()`);await settle(page,200);
 assert.equal(await evaluate(page,`document.querySelector('#home #journey-setup-0')!==null`),false,'Old Playground response cannot append into Home');
 console.log('Async page and chat ownership PASS');
}finally{await browser.close();server.proc.kill();}
