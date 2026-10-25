import { projectWorkflow } from './workflow-receipt.js';
import {icon,roleIcons,decorateNavigation} from './icons.js';

const node = (tag, value = '', className = '') => { const el=document.createElement(tag); el.textContent=value; if(className) el.className=className; return el; };
const freeze = value => { if(value && typeof value==='object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
let receiptPromise;
export function loadWorkflowReceipt() {
  if(!receiptPromise) receiptPromise=fetch('/api/systems/savra-v2-system/receipt').then(async response=>{if(!response.ok) throw new Error('Workflow evidence unavailable. Retry loading.'); return freeze(await response.json());}).catch(error=>{receiptPromise=null;throw error;});
  return receiptPromise;
}
function action(label, handler, primary=false) {
  const el=node('button',label,primary?'primary-action':'quiet-action'); el.type='button';
  if(primary) el.dataset.primaryAction=''; el.addEventListener('click',handler); return el;
}
function disclosure(title, content) { const d=node('details'); d.append(node('summary',title),content); return d; }
function fact(host, label, value) { const row=node('div','','receipt-fact'); row.append(node('strong',label),node('span',value)); host.append(row); }

export function workflowRows(receipt) {
  const list=node('div','','receipt-roles'); list.setAttribute('aria-label','Six functional workflow roles');
  projectWorkflow(receipt).forEach((role,index)=>{
    const details=node('details','','receipt-role'); details.dataset.workflowRole=role.id;
    const summary=node('summary'); summary.append(node('span',String(index+1).padStart(2,'0')),node('strong',role.name),node('span',role.activation==='media'||role.activation==='analytics'?'Conditional':'Required'),node('span',role.readOnly?'Read only':'Bounded author'));
    const body=node('div','','receipt-role-body');
    fact(body,'Responsibility',role.responsibility);
    fact(body,'Skills',role.skills.join(' · '));
    fact(body,'Activation',role.activation==='media'?'Dormant until approved media work exists.':role.activation==='analytics'?'Dormant until a measurable goal and analytics scope exist.':`Required during ${role.phases.map(p=>p.id).join(', ')}.`);
    fact(body,'Inputs',[...new Set(role.phases.flatMap(p=>p.inputs))].join(', ')||'User goal');
    fact(body,'Outputs',[...new Set(role.phases.flatMap(p=>p.outputs))].join(', '));
    fact(body,'Approval',[...new Set(role.phases.map(p=>p.gate).filter(Boolean))].map(g=>'Gate '+g).join(', ')||'No execution approval granted here');
    fact(body,'Historical model / environment','Unknown — not recorded in the Savra session evidence.');
    fact(body,'Provenance',`${role.provenance.status} · ${receipt.workflow.sources.find(s=>s.id===role.provenance.source)?.path || role.provenance.source}`);
    fact(body,'Boundary','No specialist delegation. Author and critic work sequentially. Maximum two repair cycles.');
    details.append(summary,body); list.append(details);
  });
  return list;
}

export function phaseGraph(receipt, runtime={}) {
  const host=node('section','','receipt-pipeline'); host.setAttribute('aria-label','Workflow phases and dependencies');
  const graph=node('div','','receipt-graph'); graph.hidden=matchMedia('(max-width:819px)').matches;
  const toolbar=node('div','','receipt-actions');
  const viewport=node('div','','receipt-viewport'); viewport.tabIndex=0; viewport.setAttribute('aria-label','Workflow graph. Arrow keys pan; Tab visits phase nodes.');
  const plane=node('div','','receipt-plane'); const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('aria-hidden','true'); svg.classList.add('receipt-edges');
  const list=node('ol','','receipt-phase-list'); const inspector=node('aside','','receipt-inspector'); inspector.dataset.phaseInspector=''; inspector.setAttribute('aria-live','polite');
  const status=node('p',runtime.description||'Historical workflow explanation; no run is executing.','receipt-status'); status.setAttribute('role','status');
  let selected=receipt.workflow.phases[0].id; let zoom=1; const buttons=new Map(); const rows=new Map();
  const select=id=>{
    selected=id; const phase=receipt.workflow.phases.find(p=>p.id===id);
    for(const [key,b] of buttons) b.setAttribute('aria-pressed',String(key===id));
    for(const [key,b] of rows) { if(key===id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current'); }
    inspector.replaceChildren(node('h3',phase.id));
    fact(inspector,'Owner',phase.owner); fact(inspector,'Requires',phase.inputs.join(', ')||'User goal'); fact(inspector,'Produces',phase.outputs.join(', '));
    fact(inspector,'Gate',phase.gate?`Gate ${phase.gate} — current approval required`:'No execution approval granted');
    fact(inspector,'Source',`${phase.provenance.status} · ${phase.provenance.source}`);
    if(runtime.phases?.[id]){fact(inspector,'Recorded state',runtime.phases[id].status);fact(inspector,'Evidence / blockers',runtime.phases[id].evidence);}
    status.textContent=`Selected ${phase.id}. ${phase.owner}. ${phase.activation==='always'?'Required phase.':'Conditional: '+phase.activation+'.'}`;
  };
  const updateZoom=()=>{ plane.style.zoom=String(zoom); status.textContent=`Graph zoom ${Math.round(zoom*100)}%.`; };
  toolbar.append(action('Zoom out',()=>{zoom=Math.max(.4,zoom-.2);updateZoom();}),action('Zoom in',()=>{zoom=Math.min(2,zoom+.2);updateZoom();}),action('Fit',()=>{zoom=Math.min(1,viewport.clientWidth/plane.scrollWidth);updateZoom();viewport.scrollTo(0,0);}),action('Reset view',()=>{zoom=1;updateZoom();viewport.scrollTo(0,0);}),action('Focus selected',()=>buttons.get(selected)?.focus()));
  graph.append(toolbar,viewport); viewport.append(plane); plane.append(svg);
  const columns=4, cardW=230, cardH=140, gapX=70, gapY=65;
  const positions=new Map();
  receipt.workflow.phases.forEach((phase,index)=>{
    const x=(index%columns)*(cardW+gapX)+24,y=Math.floor(index/columns)*(cardH+gapY)+24;
    positions.set(phase.id,{x,y});
    const button=action('',()=>select(phase.id)); button.dataset.phaseNode=phase.id; button.className='receipt-node'; button.style.left=x+'px'; button.style.top=y+'px';
    button.append(icon(roleIcons[phase.owner]),node('strong',phase.id.replaceAll('-',' ')),node('span',receipt.workflow.roles.find(r=>r.id===phase.owner).name),node('small',phase.gate?'Gate '+phase.gate:'Evidence'),node('small',runtime.phases?.[phase.id]?.status||phase.provenance.status));
    buttons.set(phase.id,button); plane.append(button);
    const li=node('li'); const row=action(`${phase.id} · ${phase.owner}`,()=>select(phase.id)); row.id='phase-list-'+phase.id;row.dataset.phaseList=phase.id; rows.set(phase.id,row); li.append(row,node('span',`Requires ${phase.inputs.join(', ')||'goal'} → ${phase.outputs.join(', ')}`));list.append(li);
  });
  const producers=new Map();
  for(const phase of receipt.workflow.phases) {
    for(const artifact of phase.inputs) {
      const from=producers.get(artifact); if(!from)continue;
      const a=positions.get(from),b=positions.get(phase.id); const edge=document.createElementNS(svg.namespaceURI,'path');
      edge.setAttribute('d',`M${a.x+cardW} ${a.y+cardH/2} C${a.x+cardW+35} ${a.y+cardH/2},${b.x-35} ${b.y+cardH/2},${b.x} ${b.y+cardH/2}`); edge.dataset.artifact=artifact; svg.append(edge);
    }
    phase.outputs.forEach(id=>producers.set(id,phase.id));
  }
  viewport.addEventListener('keydown',event=>{if(event.target!==viewport)return;const deltas={ArrowLeft:[-80,0],ArrowRight:[80,0],ArrowUp:[0,-80],ArrowDown:[0,80]}; if(deltas[event.key]){event.preventDefault();viewport.scrollBy(...deltas[event.key]);}});
  let drag=null;
  viewport.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);});
  viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}});
  viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
  const toggle=action(graph.hidden?'Show graph (advanced)':'Hide graph',()=>{graph.hidden=!graph.hidden;toggle.setAttribute('aria-expanded',String(!graph.hidden));toggle.textContent=graph.hidden?'Show graph (advanced)':'Hide graph';});toggle.id='system-show-graph';toggle.dataset.showGraph='';toggle.setAttribute('aria-expanded',String(!graph.hidden));
  const grid=node('div','','receipt-phase-layout graph-layout'); grid.append(graph,inspector);
  host.append(node('h2','System Node Control'),node('p','Inspect artifact dependencies and select a phase. The readable list stays synchronized below.'),toggle,grid,status,list);select(selected);return host;
}

function evidence(receipt) {
 const body=node('div','','receipt-evidence');
 const design=receipt.artifacts.find(a=>a.id==='design');
 const sample=node('section','','savra-evidence'); sample.append(node('h3','Savra visual evidence'),node('p','Verified from DESIGN.md; font samples use local fallbacks when original fonts are unavailable.'));
 const preview=node('iframe');preview.title='Savra typography specimen — isolated project artifact';preview.setAttribute('sandbox','');preview.className='savra-specimen';
 preview.srcdoc='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Savra typography evidence</title><style>body{background:#e8e0d1;color:#111312;margin:1rem;font-size:1rem}p{overflow-wrap:anywhere}h1{font:500 2rem "Cormorant Garamond",Georgia,serif}p{font:1.25rem "Barlow Condensed","Arial Narrow",sans-serif}small{font:1rem "IBM Plex Mono",monospace}</style><h1>SAVRA — Enter the Ritual</h1><p>A room between fire, stone and season.</p><small>VIENNA / SOURCE EVIDENCE</small></html>';
 sample.append(preview);
 sample.append(node('p','Palette: petrol #173A42 · oxblood #6D2924 · amber #E2A94F · bone #E8E0D1 · charcoal #111312'),node('p','Recorded display scale: clamp(8.5rem, 25vw, 29rem). This scale belongs to Savra, not the Convenium.Design shell.'));
 body.append(sample);
 for(const artifact of receipt.artifacts) {
  const content=node('div');fact(content,'Availability',artifact.available?'Verified file · SHA-256 '+artifact.hash:artifact.reason||'Unknown');
  if(artifact.available)content.append(node('pre',artifact.content));
  body.append(disclosure(`${artifact.path} · ${artifact.available?'verified':'unknown'}`,content));
 }
 body.append(node('p',receipt.limitations.join(' ')));return disclosure('Savra sources, typography and media map',body);
}

export function knowledgeConnections(receipt, context={}) {
 const host=node('div','','receipt-surface');host.append(node('p',context.name?context.name+' / PROJECT EVIDENCE':'SAVRA V2 / SOURCE ARCHIVE','eyebrow'),node('h1','Knowledge connections'),node('p',context.name?'Inspect this project’s saved artifacts, user-supplied sources and declared dependencies. Unrecorded evidence remains unknown.':'Inspect the restored Savra archive. These records are historical source evidence, not facts about your active project.'));
 const search=node('input');search.type='search';search.placeholder='Find an artifact';search.setAttribute('aria-label','Search Savra evidence');
 const graph=node('div','','receipt-knowledge-graph');graph.hidden=matchMedia('(max-width:819px)').matches;graph.setAttribute('aria-label','Savra evidence graph');
 const viewport=node('div','','receipt-viewport');viewport.tabIndex=0;viewport.setAttribute('aria-label','Evidence graph. Arrow keys pan; Tab visits source nodes.');
 const plane=node('div','','receipt-plane');plane.dataset.knowledgePlane='';
 const edges=document.createElementNS('http://www.w3.org/2000/svg','svg');edges.classList.add('receipt-edges');edges.setAttribute('aria-hidden','true');plane.append(edges);
 const center=node('strong',context.name||'SAVRA V2 · restored project','receipt-node');center.style.left='474px';center.style.top='24px';plane.append(center);
 const graphStatus=node('p','Lines show verified project membership, not inferred causal relationships.','receipt-status');graphStatus.setAttribute('role','status');
 const toolbar=node('div','','receipt-actions');let zoom=1;
 const zoomTo=value=>{zoom=value;plane.style.zoom=String(zoom);graphStatus.textContent=`Evidence graph zoom ${Math.round(zoom*100)}%. Lines show project membership.`;};
 const control=(id,label,handler)=>{const b=action(label,handler);b.id='knowledge-'+id;toolbar.append(b);};
 control('zoom-out','Zoom out',()=>zoomTo(Math.max(.4,zoom-.2)));control('zoom-in','Zoom in',()=>zoomTo(Math.min(2,zoom+.2)));
 control('fit','Fit',()=>{zoomTo(Math.min(1,viewport.clientWidth/1200));viewport.scrollTo(0,0);});
 control('reset','Reset view',()=>{zoomTo(1);viewport.scrollTo(0,0);});
 control('focus-selected','Focus selected',()=>{if(selected)host.querySelector(`[data-evidence-node="${selected.id}"]`)?.focus();else graphStatus.textContent='No evidence to select. Complete intake first.';});
 viewport.append(plane);graph.append(toolbar,viewport,graphStatus);
 viewport.addEventListener('keydown',event=>{if(event.target!==viewport)return;const delta={ArrowLeft:[-80,0],ArrowRight:[80,0],ArrowUp:[0,-80],ArrowDown:[0,80]}[event.key];if(delta){event.preventDefault();viewport.scrollBy(...delta);}});
 let drag=null;viewport.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);});
 viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}});
 for(const name of ['pointerup','pointercancel'])viewport.addEventListener(name,()=>drag=null);
 plane.style.height=(Math.ceil(receipt.artifacts.length/4)*205+230)+'px';
 const list=node('div','','receipt-evidence-list'); const inspector=node('aside','','receipt-inspector');inspector.dataset.evidenceInspector='';
 let selected=receipt.artifacts.find(a=>a.id==='plan')||receipt.artifacts[0];
 const show=artifact=>{if(!artifact)return;selected=artifact;inspector.replaceChildren(node('h2',artifact.path));fact(inspector,'Relationship',artifact.relationship||'Recorded artifact of Savra v2');fact(inspector,'Provenance',artifact.provenance||(artifact.available?'Verified repository file':'Unknown — missing repository evidence'));fact(inspector,'Availability',artifact.available?'Available':artifact.reason);if(artifact.available&&artifact.hash)fact(inspector,'SHA-256',artifact.hash);for(const el of host.querySelectorAll('[data-evidence-row],[data-evidence-node]'))el.setAttribute('aria-pressed',String((el.dataset.evidenceRow||el.dataset.evidenceNode)===artifact.id));};
 const open=action('Open selected evidence',()=>{if(!selected)return;show(selected);if(selected.available)inspector.append(node('pre',selected.content));else fact(inspector,'Recovery','Select an available artifact. No substitute evidence is invented.');inspector.tabIndex=-1;inspector.focus();},true);open.disabled=!selected;
 const toggle=action(graph.hidden?'Show connections':'Hide connections',()=>{graph.hidden=!graph.hidden;toggle.textContent=graph.hidden?'Show connections':'Hide connections';toggle.setAttribute('aria-expanded',String(!graph.hidden));});toggle.id='knowledge-show-connections';toggle.setAttribute('aria-expanded',String(!graph.hidden));open.id='knowledge-open-evidence';
 const controls=node('div','','receipt-actions');controls.append(open,toggle,search);host.append(controls);
 const layout=node('div','','receipt-phase-layout graph-layout');layout.append(graph,inspector);host.append(layout,list);
 for(const artifact of receipt.artifacts){const row=action(`${artifact.path} · ${artifact.available?'verified':'unknown'}`,()=>show(artifact));row.id='evidence-row-'+artifact.id;row.dataset.evidenceRow=artifact.id;list.append(row);
 const tile=action(`${artifact.id} — ${artifact.available?'verified':'unknown'}`,()=>show(artifact));tile.dataset.evidenceNode=artifact.id;tile.className='receipt-node';
 const index=receipt.artifacts.indexOf(artifact),x=(index%4)*290+24,y=Math.floor(index/4)*205+230;tile.style.left=x+'px';tile.style.top=y+'px';plane.append(tile);
 const edge=document.createElementNS(edges.namespaceURI,'path');edge.dataset.evidenceEdge=artifact.id;edge.setAttribute('d',`M589 164 C589 195,${x+115} 195,${x+115} ${y}`);edges.append(edge);}
 search.addEventListener('input',()=>{for(const artifact of receipt.artifacts){const hidden=!artifact.path.toLowerCase().includes(search.value.toLowerCase());host.querySelector(`[data-evidence-row="${artifact.id}"]`).hidden=hidden;host.querySelector(`[data-evidence-node="${artifact.id}"]`).hidden=hidden;host.querySelector(`[data-evidence-edge="${artifact.id}"]`).style.display=hidden?'none':'';}inspector.replaceChildren(node('p',`${[...list.children].filter(e=>!e.hidden).length} matching artifacts. Clear the search to see all evidence.`));});
 if(!selected)inspector.append(node('p','No saved project artifacts yet. Complete the intake to create evidence.'));show(selected);return host;
}

/** Mount after legacy initialization; preserved editors are disclosed only in Configure. */
export async function mountWorkflowViews() {
 decorateNavigation();
 const receipt=await loadWorkflowReceipt();
 for(const [id,title] of [['agents','Your six-role team'],['architecture','Understand the workflow'],['systems','Configure your agent team']]) {
  const root=document.getElementById(id); const legacy=node('div'); legacy.append(...root.childNodes);
  if(id==='systems'){ const d=disclosure('Advanced configuration: current local loadouts',legacy);root.append(d); }
  else {legacy.hidden=true;legacy.inert=true;root.append(legacy);}
  const surface=node('div','','receipt-surface'); surface.append(node('p','SAVRA V2 / DOCUMENTED WORKFLOW','eyebrow'),node('h1',title),node('p','One shared workflow. Inspect responsibilities and evidence before changing the configuration.'));
  const primary=action(id==='systems'?'Test in Playground':'Configure team',()=>{const projectId=document.body.dataset.projectId;location.hash='#/'+(projectId?'projects/'+encodeURIComponent(projectId)+'/':'')+(id==='systems'?'playground':'plan/configure');},true);primary.id=id+'-workflow-primary';surface.append(primary);
  const banner=node('div','','receipt-notice'); banner.append(node('strong','Historical Gate C: pending user review'),node('p','Repository artifacts are verified. Runtime routing is reconstructed. Original models, prompts and host settings are unknown.'));
  if(id==='architecture')surface.append(phaseGraph(receipt));surface.append(banner,workflowRows(receipt),evidence(receipt));root.prepend(surface);
 }
 const knowledge=document.getElementById('knowledge');const retained=node('div');retained.append(...knowledge.childNodes);knowledge.append(knowledgeConnections(receipt),disclosure('Local knowledge library and editor',retained));
 return receipt;
}
