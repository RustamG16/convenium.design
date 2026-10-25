import assert from 'node:assert/strict';
import { launch } from './lib/cdp.mjs';
import { startServer, navigate, settle, evaluate, captureConsole } from './lib/harness.mjs';
const server = await startServer({scratchData:true}); const browser = await launch();
try {
  const page = await browser.newPage(); const errors=[]; captureConsole(page,errors);
  const workspace = await (await fetch(server.base+'/api/workspace')).json(); const project=workspace.projects[0]; const chat=project.chats[0];
  const created = await (await fetch(server.base+'/api/projects', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Route isolation fixture'})})).json();
  await navigate(page,server.base+`/?isolation#/projects/${created.project.id}/plan`); await settle(page,1500);
  assert.equal(await evaluate(page,'location.hash'),`#/projects/${created.project.id}/plan`,'Selecting a deep-linked project must preserve its destination');
  await evaluate(page,`location.hash='#/projects/${project.id}/plan'`); await settle(page,500);
  assert.equal(await evaluate(page,'location.hash'),`#/projects/${project.id}/plan`,'Switching project context must not redirect Plan to Work');
  await evaluate(page,`location.hash='#/projects/${project.id}/work/${chat.id}'`); await settle(page,300);
  await evaluate(page,`location.hash='#/projects/${created.project.id}/work/${chat.id}'`); await settle(page,300);
  assert.equal(await evaluate(page,`[...document.querySelectorAll('#project-tabs button')].some(e=>e.textContent===${JSON.stringify(chat.name)})`),false,'Invalid chat must clear the previous project chat list');
  await evaluate(page,`location.hash='#/projects/${project.id}/work/${chat.id}'`); await settle(page,300);
  await evaluate(page,`document.querySelector('#new-chat').click()`); await settle(page,500);
  assert.notEqual(await evaluate(page,'location.hash'),`#/projects/${project.id}/work/${chat.id}`,'New conversation receives its own canonical URL');
  for (const width of [390,820,1280,1440,1920]) {
    await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await navigate(page,server.base+`/?width=${width}#/projects/${project.id}/work/${chat.id}`); await settle(page,2500);
    const state=await evaluate(page,`({switcher:!!document.querySelector('#workspace-project'),chat:document.querySelector('#active-chat-name')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,composers:document.querySelectorAll('#work-composer').length})`);
    assert.equal(state.switcher,true); assert.equal(state.chat,chat.name); assert.equal(state.overflow,false); assert.equal(state.composers,1);
    await evaluate(page,`document.querySelector('#work-prompt').focus()`);
    assert.equal(await evaluate(page,`(()=>{const a=document.querySelector('#work-composer').getBoundingClientRect(),b=document.querySelector('.shell-oracle-launcher').getBoundingClientRect();return Math.max(a.left,b.left)<Math.min(a.right,b.right)&&Math.max(a.top,b.top)<Math.min(a.bottom,b.bottom)})()`),false,'Oracle overlaps composer at '+width+' '+JSON.stringify(await evaluate(page,`['main','#work-composer','.shell-oracle-launcher'].map(s=>({s,rect:document.querySelector(s).getBoundingClientRect().toJSON(),overflow:getComputedStyle(document.querySelector(s)).overflow}))`)));
  }
  assert.deepEqual(errors,[]); console.log('Workspace: five widths, deep-linked chat, composer ownership and console PASS');
} finally { await browser.close(); server.proc.kill(); }

