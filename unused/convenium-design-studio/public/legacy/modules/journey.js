import {createOracleIntake,answerOracleQuestion} from './oracle.js';
import {loadWorkflowReceipt,workflowRows} from './workflow-view.js';
import {readRoleDraft,roleConfiguration} from './role-configuration.js';
import {projectSystem,projectKnowledge} from './project-evidence.js';
const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
const actor={kind:'user',id:'local-user'};
export function createJourneyUI({navigate,closeSurfaces,onState}) {
 let active=null,project=null,state=null,receipt=null,signature=null,version=0;
 const mounts=new Map();
 const historicalSurfaces=new Map();
 function replaceSurface(root,surface){const restore=root.contains(document.activeElement)&&document.activeElement.tagName==='H1';root.querySelector(':scope > .receipt-surface')?.remove();root.prepend(surface);if(restore){const heading=surface.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}}
 const serverActions=new Set(['journey-review-brief','journey-create-plan','journey-review-plan','journey-compare','journey-apply-setup','journey-execute','journey-accept-result','journey-approve-proposal','journey-cancel-proposal','journey-retry','new-project','new-chat','shell-create-project','duplicate-loadout','new-loadout','activate-loadout','delete-loadout','run-comparison','oracle-plan','oracle-run']);
 const offlineControls=new Map();
 function syncOffline(){for(const b of document.querySelectorAll('button')){if(!serverActions.has(b.id)&&!b.matches('form button[type="submit"],.keep-setup'))continue;if(!navigator.onLine){if(!offlineControls.has(b))offlineControls.set(b,{disabled:b.disabled,title:b.title});b.disabled=true;b.title='Reconnect to load current state before continuing.';}else if(offlineControls.has(b)){const saved=offlineControls.get(b);b.disabled=saved.disabled;b.title=saved.title;offlineControls.delete(b);}}}
 window.addEventListener('offline',syncOffline);
 window.addEventListener('online',()=>{syncOffline();signature=null;const values=[...document.querySelectorAll('.view.is-active textarea,.view.is-active input')].filter(n=>n.id).map(n=>[n.id,n.value]);if(lastRoute&&project)render(lastRoute,project).then(()=>{for(const [id,value] of values){const input=document.getElementById(id);if(input)input.value=value;}});});
 new MutationObserver(syncOffline).observe(document.body,{childList:true,subtree:true});
 const key=()=>`apollo-intake-${project.id}`;
 function intake(){try{return JSON.parse(localStorage.getItem(key()));}catch{return null;}}
 function saveIntake(value){localStorage.setItem(key(),JSON.stringify(value));}
 const href=view=>`#/projects/${encodeURIComponent(project.id)}/${view==='work'&&project.chats?.[0]?`work/${encodeURIComponent(project.chats[0].id)}`:view}`;
 async function api(command,id=project.id){const response=await fetch(`/api/projects/${encodeURIComponent(id)}/journey`,command?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(command)}:{});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save. Retry after reconnecting.');if(project.id===id){state=result;onState?.(id,result);}return result;}
 function error(error){const message=active.querySelector('[data-journey-status]');message.textContent=error.message;message.setAttribute('role','alert');}
 function button(id,label,handler,primary=false){const b=el('button',label,primary?'primary-action':'quiet-action');b.id=id;b.type='button';if(primary)b.dataset.primaryAction='';b.addEventListener('click',async()=>{b.disabled=true;try{await handler();}catch(e){error(e);}finally{b.disabled=false;}});return b;}
 function field(id,label,value=''){const host=el('label',label,'journey-field');const input=el('textarea');input.id=id;input.value=value;input.rows=3;host.append(input);active.append(host);return input;}
 function go(view){signature=null;navigate(href(view));}
 const artifact=kind=>state.artifacts.findLast(a=>a.kind===kind);
 const approved=gate=>state.approvals.some(a=>a.gate===gate&&a.status==='approved');
 const saveArtifact=(kind,content)=>({type:'artifact.save',artifact:{id:`${kind}-${project.id}`,projectId:project.id,kind,content}});
 function mount(root){
  if(mounts.has(root.id))return mounts.get(root.id);
  const host=el('section','','journey-surface');
  if(['home','oracle','plan','results','project-detail'].includes(root.id)){const retained=el('div');retained.hidden=true;retained.inert=true;retained.append(...root.childNodes);root.append(retained);}
  if(root.id==='playground'){const retained=el('details');const body=el('div');body.append(...root.childNodes);retained.append(el('summary','Advanced comparison editor'),body);root.append(retained);}
  if(root.id==='work')root.querySelector('.work-area').prepend(host);else root.prepend(host);mounts.set(root.id,host);return host;
 }
 async function propose(title,operations,next) {
  const proposalProject=project.id;
  const send=command=>api(command,proposalProject);
  const id=crypto.randomUUID();const operation=operations.length===1?operations[0]:{type:'batch',actor,operations};
  const prepared=await send({type:'proposal.create',id,operation});const proposal=prepared.proposals.find(p=>p.id===id);
  if(project.id!==proposalProject)return;
  closeSurfaces();const dialog=el('dialog','','journey-dialog');dialog.id='journey-proposal';dialog.setAttribute('aria-label',title);
  dialog.append(el('h2',title),el('p','Review these exact changes. Approval is bound to this content and the current project state.'),el('code',proposal.operationHash),el('pre',JSON.stringify(operation,null,2)));
  const status=el('p');status.setAttribute('role','status');dialog.append(status);
  const approve=button('journey-approve-proposal','Approve these changes',async()=>{try{await send({type:'proposal.resolve',id,operationHash:proposal.operationHash,approved:true,actor});await send({type:'proposal.apply',id});dialog.close();dialog.remove();signature=null;if(project.id!==proposalProject)return;if(next)go(next);else await renderCurrent();}catch(e){status.textContent=e.message;}},true);
  const cancel=async()=>{await send({type:'proposal.resolve',id,operationHash:proposal.operationHash,approved:false,actor});dialog.close();dialog.remove();};
  dialog.append(approve,button('journey-cancel-proposal','Cancel',cancel));dialog.addEventListener('cancel',event=>{event.preventDefault();cancel().catch(e=>status.textContent=e.message);});document.body.append(dialog);dialog.showModal();
 }
 function page(title,description){const restore=active.contains(document.activeElement)&&document.activeElement.tagName==='H1';const heading=el(lastRoute?.root==='work'?'h2':'h1',title);heading.tabIndex=-1;active.replaceChildren(el('p',project.name,'eyebrow'),heading,el('p',description));const status=el('p','','journey-status');status.dataset.journeyStatus='';status.setAttribute('role','status');active.append(status);if(restore)heading.focus({preventScroll:true});}
 async function renderCurrent(){signature=null;return render(lastRoute,project);}
 let lastRoute;
 async function render(route,currentProject){
  if(!currentProject||!['home','oracle','project-detail','plan','systems','agents','playground','work','results','architecture','knowledge'].includes(route.root)){version++;signature=null;return;}
  const nextSignature=route.path+'|'+currentProject.id;if(signature===nextSignature)return;signature=nextSignature;lastRoute=route;project=currentProject;const request=++version;
  if(['architecture','knowledge'].includes(route.root)&&(route.projectId||route.runId)){
   const root=document.getElementById(route.root);
   if(!historicalSurfaces.has(route.root))historicalSurfaces.set(route.root,root.querySelector(':scope > .receipt-surface'));
   try{const [loaded,source]=await Promise.all([api(),loadWorkflowReceipt()]);if(request!==version)return;
    replaceSurface(root,route.root==='architecture'?projectSystem(source,loaded,currentProject,route.runId):projectKnowledge(source,loaded,currentProject));
   }catch(e){if(request!==version)return;const failure=el('section',e.message,'receipt-surface');failure.setAttribute('role','alert');root.querySelector(':scope > .receipt-surface')?.remove();root.prepend(failure);}return;
  }
  if(['architecture','knowledge'].includes(route.root)){if(historicalSurfaces.has(route.root)){const root=document.getElementById(route.root);root.querySelector(':scope > .receipt-surface')?.remove();root.prepend(historicalSurfaces.get(route.root));}return;}
  if(['systems','agents'].includes(route.root)){
   const root=document.getElementById(route.root);
   try{const [loaded,source]=await Promise.all([api(),loadWorkflowReceipt()]);if(request!==version)return;
    for(const other of document.querySelectorAll('[data-role-configuration]'))if(other.parentElement!==root)other.remove();
    replaceSurface(root,roleConfiguration(source,currentProject,loaded.artifacts.findLast(a=>a.kind==='plan')?.content?.configuration?.roleSettings||{}));
   }catch(e){if(request!==version)return;const failure=el('section','','receipt-surface');failure.append(el('h1','Configuration unavailable'),el('p',e.message));const retry=el('button','Retry loading','primary-action');retry.dataset.primaryAction='';retry.addEventListener('click',renderCurrent);failure.append(retry);root.querySelector(':scope > .receipt-surface')?.remove();root.prepend(failure);}return;
  }
  active=mount(document.getElementById(route.root));page('Loading project','Reading saved decisions and evidence…');
  try{const [loaded,source]=await Promise.all([api(),loadWorkflowReceipt()]);if(request!==version)return;state=loaded;receipt=source;
   const view=route.trail[0].toLowerCase();
   if(route.root==='home'||view==='overview') {
    page('What do you want to build?','Describe your goal. Oracle will turn your answers into a brief you can review.');
    const goal=field('journey-goal','Project goal',intake()?.goal||'');
    active.append(button('journey-start','Start with Oracle',()=>{saveIntake(createOracleIntake(goal.value));go('intake');},true));
    if(artifact('brief'))active.append(button('journey-continue','Continue saved plan',()=>go('plan')));
   } else if(route.root==='oracle') {
    const draft=intake();if(!draft){page('Start your intake','Describe the outcome you want before answering the project questions.');const goal=field('journey-intake-goal','Project goal');active.append(button('journey-begin-intake','Begin intake',()=>{saveIntake(createOracleIntake(goal.value));return renderCurrent();},true));return;}if(draft.status==='review'){go('brief');return;}
    page('Guided intake',`Question ${Object.keys(draft.answers).length+1} of 5. Your answers shape the brief.`);
    const answer=field('journey-answer',draft.current.prompt);
    active.append(el('p',draft.current.purpose||'This answer helps define the project outcome before work starts.'));
    active.append(button('journey-confirm-answer','Confirm and continue',()=>{const next=answerOracleQuestion(draft,draft.current.id,answer.value);saveIntake(next);if(next.status==='review')go('brief');else renderCurrent();},true));
    const summary=el('aside','','receipt-inspector');summary.append(el('h2','Confirmed answers'));for(const [name,value] of Object.entries(draft.answers))summary.append(el('strong',name),el('p',value));active.append(summary);
   } else if(view==='brief') {
    const draft=intake();const brief=draft?.brief||artifact('brief')?.content?.brief;
    if(!brief){page('Brief not created','Complete the intake to create a sourced brief.');active.append(button('journey-start-intake','Start intake',()=>go('home'),true));return;}
    page('Clear direction. Reviewable decisions.','Review your answers and Design DNA before approving the brief.');
    const content=el('div','','receipt-inspector');for(const [name,value] of Object.entries(brief)){if(typeof value==='string')content.append(el('strong',name),el('p',value));}active.append(content);
    const dna=draft?.designDna||artifact('brief')?.content?.designDna;const dnaPanel=el('aside','','receipt-inspector');dnaPanel.append(el('h2','Design DNA'),el('pre',JSON.stringify(dna,null,2)));active.append(dnaPanel);
    active.append(button('journey-review-brief','Approve brief and create plan',()=>propose('Save brief and approve Gate A',[saveArtifact('brief',{brief,designDna:dna}),{type:'gate.approve',gate:'A',artifactId:`brief-${project.id}`,actor}], 'plan'),true));
    active.append(button('journey-revise','Revise answers',()=>{saveIntake(createOracleIntake(draft?.goal||brief.sourceRequest));go('intake');}));
   } else if(route.root==='plan') {
    page('Your master plan','Each phase has an owner, prerequisites and review requirements. Execution waits for the current plan and design approval.');
    if(!approved('A')){active.append(button('journey-review-intake','Review the brief first',()=>go('brief'),true));return;}
    const plan=artifact('plan');
    if(!plan||plan.content.briefHash!==artifact('brief').hash){
     const design=field('journey-design','Numeric design contract — edit before saving',JSON.stringify({mode:'local deterministic prototype',typeScaleRem:[1,1.25,1.5,2],spacingRem:[.5,1,1.5,2],colors:{background:'#F7F7F2',text:'#050506'},motionMs:160,reducedMotionMs:1},null,2));
     active.append(button('journey-create-plan','Review plan and design',()=>{const numeric=JSON.parse(design.value);if(!Array.isArray(numeric.typeScaleRem)||!numeric.typeScaleRem.every(n=>typeof n==='number'&&n>0))throw new Error('Enter a positive numeric type scale.');return propose('Commit the plan and numeric design',[saveArtifact('plan',{workflowId:receipt.workflow.id,version:receipt.workflow.version,phases:receipt.workflow.phases,briefHash:artifact('brief').hash,mode:'demo'}),saveArtifact('design',numeric)],'plan/configure');},true));
    }else active.append(button('journey-review-plan',approved('B')?'Open Work':'Review execution approval',()=>approved('B')?go('work'):propose('Approve the current plan and design',[{type:'gate.approve',gate:'B',artifactId:plan.id,actor}], 'work'),true));
    active.append(workflowRows(receipt));
    active.append(button('journey-configure','Configure team',()=>go('plan/configure')));
   }else if(route.root==='playground') {
    page('Test ideas. Compare configurations.','This local test measures routing and approval rules. It makes no model calls and changes no production state.');
    const response=await fetch('/api/loadouts');if(!response.ok)throw new Error('Could not load configurations.');const catalog=await response.json();if(request!==version)return;
    const grid=el('div','','journey-comparison-grid');const selects=[];
    for(const [index,name] of ['Setup A','Setup B'].entries()){const panel=el('section','','receipt-inspector');panel.append(el('h2',name));const label=el('label','Configuration');const select=el('select');select.id=`journey-setup-${index}`;for(const item of catalog.loadouts){const option=el('option',item.name);option.value=item.id;select.append(option);}select.selectedIndex=Math.min(index,catalog.loadouts.length-1);label.append(select);panel.append(label,el('p','Workflow: Savra v2 · six roles · reconstructed routing. Model, speed and output quality are not inferred.'));selects.push(select);grid.append(panel);}active.append(grid);
    const report=el('section','','receipt-inspector');report.id='journey-comparison';report.append(el('p','Not tested. Choose configurations and run the comparison.'));active.append(report);
    let comparison=null,comparisonGeneration=0;
    const compare=button('journey-compare','Run comparison',async()=>{const generation=++comparisonGeneration;const r=await fetch('/api/workflow/compare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:artifact('brief')?.content?.brief?.goal||'Inspect workflow routing',a:selects[0].value,b:selects[1].value,rolesA:artifact('plan')?.content?.configuration?.roleSettings||{},rolesB:readRoleDraft(project.id)})});const result=await r.json();if(request!==version||generation!==comparisonGeneration||!navigator.onLine)return;if(!r.ok)throw new Error(result.error);comparison=result;report.replaceChildren(el('h2',`${result.checks.filter(c=>c.pass).length} of ${result.checks.length} contract checks passed`));for(const check of result.checks)report.append(el('p',`${check.pass?'PASS':'FAIL'} · ${check.name}`));report.append(el('p',`Measured local planning time: ${result.elapsedMs} ms. ${result.limitations.join(' ')}`));for(const [index,plan] of [result.a,result.b].entries()){const d=el('details');d.append(el('summary',`${index?'B':'A'} · ${plan.loadout.name}: active skills and gates`),el('pre',JSON.stringify(plan.steps.map(s=>({role:s.name,phase:s.phase,skills:s.skills,gate:s.gate,status:s.status,budget:s.budget,roleBudgetWeight:plan.roleSettings[s.id].budget})),null,2)));report.append(d);}apply.disabled=!artifact('plan')||!result.checks.every(c=>c.pass);if(!apply.disabled){compare.removeAttribute('data-primary-action');compare.className='quiet-action';apply.dataset.primaryAction='';apply.className='primary-action';}},true);
    const apply=button('journey-apply-setup','Review and apply Setup B',()=>{if(!comparison)throw new Error('Run the comparison first.');const plan=artifact('plan');return propose('Apply the tested Setup B to the plan',[{type:'record.put',collection:'comparisons',record:{id:`comparison-${project.id}`,projectId:project.id,status:'draft',productionApplied:false,a:comparison.a.loadout,b:comparison.b.loadout,checks:comparison.checks,mode:'deterministic'}},saveArtifact('plan',{...plan.content,configuration:comparison.b.loadout,comparisonChecks:comparison.checks})],'plan');});apply.disabled=true;
    active.append(compare,apply,el('p',artifact('plan')?'Applying a setup changes the plan hash and requires fresh execution approval.':'Create a plan before applying a tested setup.'));
    for(const select of selects)select.addEventListener('change',()=>{comparisonGeneration++;comparison=null;apply.disabled=true;apply.removeAttribute('data-primary-action');apply.className='quiet-action';compare.dataset.primaryAction='';compare.className='primary-action';report.replaceChildren(el('p','Configuration changed. Run a fresh comparison.'));});
    const roles=el('details');roles.append(el('summary','Shared roles, skills and provenance'),workflowRows(receipt));active.append(roles);
   }else if(route.root==='work') {
    page('Execute the approved plan','The local fixture validates this journey without model calls, external generation or publishing. Your conversation remains below.');
    const send=document.querySelector('#work-composer button[type="submit"]');send.dataset.primaryAction='';
    if(!approved('B')){active.append(el('p','Execution is blocked: approve the current plan and design in Plan.'),button('journey-work-plan','Open Plan',()=>go('plan')));}
    else if(!state.artifacts.some(a=>a.kind==='output'&&a.content.planHash===artifact('plan')?.hash&&a.content.designHash===artifact('design')?.hash)){
     send.removeAttribute('data-primary-action');
     active.append(button('journey-execute','Review local fixture execution',async()=>{const response=await fetch(`/api/projects/${encodeURIComponent(project.id)}/journey/fixture`,{method:'POST'});const prepared=await response.json();if(!response.ok)throw new Error(prepared.error);return propose('Create local fixture output and record contract checks',prepared.operations,`results/${prepared.runId}`);},true));
    }else active.append(el('p','Local fixture complete. Its checks do not establish production readiness.'),button('journey-work-results','View Results',()=>go('results')));
   }else if(route.root==='results') {
    page('Results and QA','No completed output is inferred from navigation. Review the evidence tied to this project.');
    const run=route.runId?state.runs.find(r=>r.id===route.runId):null;
    if(route.runId&&!run){page('Run not found','This run is not part of the selected project. Choose its latest results or return to Work.');active.append(button('journey-latest-results','Open latest results',()=>go('results'),true));return;}
    const outputId=run?state.attempts.findLast(a=>a.runId===run.id&&a.status==='complete')?.outputs?.at(-1)?.id:null;
    const output=run?state.artifacts.find(a=>a.id===outputId):artifact('output');if(!output){active.append(button('journey-open-work','Open Work',()=>go('work'),true));return;}
    const preview=el('iframe');preview.title='Local fixture output preview';preview.setAttribute('sandbox','');preview.srcdoc=output.content.html||'';preview.className='journey-output';active.append(preview);
    active.append(el('p',output.content.limitations?.join(' ')||'Limitations unknown.'));
    const currentOutput=output.content.planHash===artifact('plan')?.hash&&output.content.designHash===artifact('design')?.hash;
    if(!currentOutput)active.append(el('p','This output belongs to an earlier plan or design. Execute the current approved plan in Work before accepting a new result.'));
    const reviews=state.reviews.filter(r=>r.artifactId===output.id&&r.artifactHash===output.hash);const qa=el('section','','receipt-inspector');qa.append(el('h2','Fixture contract QA'));for(const review of reviews)qa.append(el('h3',`${review.kind} · ${review.verdict}`),el('p',`${review.authorId} · ${review.scope}`),el('pre',review.evidence.join('\n')));active.append(qa);
    if(state.approvals.some(a=>a.gate==='C'&&a.status==='approved'&&a.artifactId===output.id))active.append(button('journey-next','Continue with a new goal',()=>go('home'),true));
    else {const accept=button('journey-accept-result','Review fixture acceptance',()=>propose('Accept this local fixture result',[{type:'gate.approve',gate:'C',artifactId:output.id,actor,evidence:{provenance:output.content.provenance,limitations:output.content.limitations,userReview:'User reviewed the explicitly labelled local fixture output and contract checks.'}}],'results'),true);accept.disabled=!currentOutput||reviews.length<2||reviews.some(r=>r.verdict!=='PASS');active.append(accept);}
    active.append(button('journey-request-changes','Request changes',()=>go('brief')),button('journey-export','Export local HTML',()=>{const url=URL.createObjectURL(new Blob([output.content.html],{type:'text/html'}));const link=el('a');link.href=url;link.download='apollo-local-fixture.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);active.querySelector('[data-journey-status]').textContent='Local HTML export prepared.';}));
   }else {
    page(route.trail.join(' / '),'Project evidence and conversation stay connected.');
    for(const a of state.artifacts){const d=el('details');d.append(el('summary',`${a.kind} · ${a.hash.slice(0,12)}`),el('pre',JSON.stringify(a.content,null,2)));active.append(d);}
    active.append(button('journey-project-work','Open Work',()=>go('work'),true));
   }
  }catch(e){if(request===version){error(e);active.append(button('journey-retry','Retry loading',renderCurrent,true));}}
 }
 return {render};
}

