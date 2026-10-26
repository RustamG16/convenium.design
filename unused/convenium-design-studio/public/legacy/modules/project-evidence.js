import {workflowRows,phaseGraph,knowledgeConnections} from './workflow-view.js';
const node=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
export function projectEvidence(state,project){
 const artifacts=state.artifacts.filter(a=>a.projectId===project.id).map(a=>({id:a.id,path:a.kind+' / '+a.id,available:true,hash:a.hash,content:JSON.stringify(a.content,null,2),relationship:`Saved ${a.kind} of ${project.name}`,provenance:'Verified local record and content hash; authored claims are not independently verified.'}));
 const brief=state.artifacts.findLast(a=>a.projectId===project.id&&a.kind==='brief');
 for(const [id,value] of Object.entries({designDNA:brief?.content.designDna,suppliedSources:brief?.content.brief?.references,assetScope:brief?.content.brief?.assets}))if(value)artifacts.push({id,path:id,available:true,content:JSON.stringify(value,null,2),relationship:'Declared in '+brief.id,provenance:'Reconstructed projection of user-provided brief; source content and rights are not independently verified.'});
 return {artifacts};
}
export function projectSystem(receipt,state,project,runId){
 const host=node('section','','receipt-surface');host.dataset.projectSystem='';
 const run=runId?state.runs.find(r=>r.id===runId&&r.projectId===project.id):state.runs.findLast(r=>r.projectId===project.id);
 host.append(node('p',project.name+' / SYSTEM','eyebrow'),node('h1',runId&&!run?'Run not found':'Understand the workflow'));
 const link=node('a',runId&&!run?'Open project System':'Configure team','primary-action');link.dataset.primaryAction='';link.href='#/projects/'+encodeURIComponent(project.id)+'/'+(runId&&!run?'system':'plan/configure');host.append(link);
 if(runId&&!run){host.append(node('p','This run does not belong to the selected project. Choose its project or open this project’s System.'));return host;}
 const attempts=run?state.attempts.filter(a=>a.runId===run.id):[],outputIds=new Set(attempts.flatMap(a=>a.outputs.map(o=>o.id)));
 const outputs=state.artifacts.filter(a=>outputIds.has(a.id)),reviews=state.reviews.filter(r=>outputIds.has(r.artifactId)&&outputs.some(a=>a.hash===r.artifactHash));
 host.append(node('p',run?`Run ${run.id} · ${run.status} · ${run.mode}`:'No recorded run. The workflow below shows prerequisites for this project.'));
 const gates=state.approvals.filter(a=>a.projectId===project.id&&a.status==='approved');
 host.append(node('p','Current gates: '+(['A','B','C'].map(g=>`${g}: ${gates.some(a=>a.gate===g)?'approved':'waiting'}`).join(' · '))));
 const phases={};
 for(const phase of receipt.workflow.phases){
  const missing=phase.inputs.filter(kind=>!state.artifacts.some(a=>a.projectId===project.id&&(a.kind===kind||a.kind==='evidence'&&a.content.workflowArtifact===kind))&&!reviews.some(r=>(kind==='qa'?'qa':kind==='review'?'independent':null)===r.kind&&r.verdict==='PASS'));
  let status=missing.length?'Waiting for evidence':'Prerequisites recorded; execution not inferred',evidence=missing.length?'Missing: '+missing.join(', '):'Inputs exist; no phase completion record.';
  if(phase.id==='build'&&outputs.length){status='Output recorded';evidence=outputs.map(a=>a.id+' · '+a.hash).join('\n');}
  if(['author-qa','finish-review'].includes(phase.id)){const kind=phase.id==='author-qa'?'qa':'independent',review=reviews.findLast(r=>r.kind===kind);if(review){status=review.verdict+' · '+review.status;evidence=review.scope+' · '+review.evidence.join('\n');}}
  if(phase.gate&&!gates.some(a=>a.gate===phase.gate)){status+=' · Gate '+phase.gate+' waiting';}
  phases[phase.id]={status,evidence};
 }
 host.append(phaseGraph(receipt,{phases,description:run?`Recorded run ${run.id}. States are evidence, not simulated activity.`:'No execution is inferred.'}),workflowRows(receipt));
 const raw=node('details');raw.append(node('summary','Recorded attempts and output hashes'),node('pre',JSON.stringify({run:run||null,attempts,reviews},null,2)));host.append(raw);return host;
}
export function projectKnowledge(receipt,state,project){
 const host=knowledgeConnections(projectEvidence(state,project),{name:project.name});host.dataset.projectKnowledge='';
 const archive=node('details');archive.append(node('summary','Historical Savra source archive'));
 for(const a of receipt.artifacts){const d=node('details');d.append(node('summary',a.path+' · '+(a.available?'verified':'unknown')),node('pre',a.content||a.reason));archive.append(d);}
 host.append(archive);return host;
}
