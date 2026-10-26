import {icon,roleIcons} from './icons.js';
const node=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
export function readRoleDraft(projectId,fallback={}){try{return JSON.parse(localStorage.getItem('apollo-role-draft-'+projectId))||fallback;}catch{return fallback;}}
export function roleConfiguration(receipt,project,committed={}){
 const host=node('section','','receipt-surface');host.dataset.roleConfiguration='';
 host.append(node('p',project.name+' / CURRENT LOCAL DRAFT','eyebrow'),node('h1','Configure your agent team'),node('p','Select a role to inspect its current budget, review requirements and skills. Draft changes reach Setup B; they do not approve execution.'));
 const layout=node('div','','receipt-phase-layout role-layout'),list=node('div','','receipt-evidence-list role-table'),inspector=node('aside','','receipt-inspector role-inspector');inspector.dataset.roleInspector='';
 let draft=readRoleDraft(project.id,committed),selected=receipt.workflow.roles[0].id;
 const status=node('p','Draft is local to this project.','receipt-status');status.setAttribute('role','status');
 const save=()=>{localStorage.setItem('apollo-role-draft-'+project.id,JSON.stringify(draft));status.textContent='Draft saved locally. Run a fresh Playground comparison before applying it.';};
 function select(id){selected=id;const role=receipt.workflow.roles.find(r=>r.id===id),settings={budget:4000,approval:false,enabled:true,...draft[id]};
  for(const row of list.children)row.setAttribute('aria-pressed',String(row.dataset.workflowRole===id));
  const heading=node('div','','role-inspector-heading');heading.append(icon(roleIcons[id]),node('h2',role.name));
  inspector.replaceChildren(node('p','Agent configuration','inspector-label'),heading,node('p',role.responsibility));
  const fact=(label,value)=>{inspector.append(node('strong',label),node('p',value));};
  fact('Model / environment','Local deterministic planner. Per-role model selection is unavailable: no role-specific provider execution is configured. Historical Savra model and host: unknown.');
  const budgetLabel=node('label','Budget weight (tokens)');const budget=node('input');budget.id='role-budget';budget.type='number';budget.min='500';budget.max='50000';budget.step='500';budget.value=settings.budget;budgetLabel.append(budget);inspector.append(budgetLabel,node('p','The total run budget is divided in proportion to these role weights. No tokens are spent in the local comparison.'));
  budget.addEventListener('change',()=>{const value=Number(budget.value);if(!Number.isInteger(value)||value<500||value>50000){status.textContent='Enter 500–50000 tokens.';budget.value=settings.budget;return;}draft={...draft,[id]:{...settings,...draft[id],budget:value}};save();});
  const check=(key,label,disabled=false)=>{const l=node('label',label),input=node('input');input.type='checkbox';input.id='role-'+key;input.checked=settings[key];input.disabled=disabled;l.prepend(input);inspector.append(l);input.addEventListener('change',()=>{draft={...draft,[id]:{...settings,...draft[id],[key]:input.checked}};save();});};
  check('enabled','Role enabled',!['media','analytics'].includes(role.activation));
  fact('Activation',['media','analytics'].includes(role.activation)?'Conditional: requires separately approved media or analytics scope. Enabling alone does not activate it.':'Required by the workflow; cannot be disabled.');
  check('approval','Request additional review before this role runs');
  fact('Permissions',role.readOnly?'Read-only evidence and review. Cannot edit or delegate.':'Bounded authorship after current artifact prerequisites and gates. Cannot delegate.');
  fact('Gate boundary','These settings cannot grant Gates A, B or C.');fact('Allowed skills',role.skills.join(' · '));fact('Provenance','Current settings reconstructed from this local draft; role contract '+role.provenance.status+'.');
 }
 const headers=node('div','','role-table-head');for(const text of ['Agent / role','Responsibility','Activation / skills'])headers.append(node('span',text));list.append(headers);
 for(const [index,role] of receipt.workflow.roles.entries()){
  const row=node('button','','quiet-action role-table-row');row.type='button';row.dataset.workflowRole=role.id;row.dataset.configureRole=role.id;row.id='configure-role-'+role.id;
  const identity=node('span','','role-identity');identity.append(node('span',String(index+1).padStart(2,'0'),'role-number'),icon(roleIcons[role.id]),node('strong',role.name));
  const purpose=node('span',role.responsibility,'role-purpose');purpose.dataset.roleResponsibility='';
  const metadata=node('span','','role-metadata');metadata.append(node('span',['media','analytics'].includes(role.activation)?'Conditional':'Required','role-state'),node('span',role.skills.slice(0,2).join(' · '),'role-skills'));
  row.append(identity,purpose,metadata);row.addEventListener('click',()=>select(role.id));list.append(row);
 }
 const primary=node('button','Test in Playground','primary-action');primary.type='button';primary.id='systems-workflow-primary';primary.dataset.primaryAction='';primary.addEventListener('click',()=>location.hash='#/projects/'+encodeURIComponent(project.id)+'/playground');
 const undo=node('button','Restore previous draft','quiet-action');undo.type='button';undo.id='role-undo';undo.hidden=true;let beforeReset=null;
 undo.addEventListener('click',()=>{if(!beforeReset)return;draft=beforeReset;beforeReset=null;save();select(selected);undo.hidden=true;status.textContent='Previous draft restored.';});
 const reset=node('button','Reset draft to applied plan','quiet-action');reset.type='button';reset.id='role-reset';reset.dataset.undo='';reset.addEventListener('click',()=>{beforeReset=structuredClone(draft);draft=structuredClone(committed);save();select(selected);undo.hidden=false;status.textContent='Draft reset to the applied plan. Undo is available.';});
 primary.prepend(icon('FlaskConical'));reset.prepend(icon('RotateCcw'));undo.prepend(icon('Undo2'));
 const actions=node('div','','role-actions');actions.append(primary,reset,undo);
 layout.append(list,inspector);host.append(actions,status,layout);select(selected);return host;
}
