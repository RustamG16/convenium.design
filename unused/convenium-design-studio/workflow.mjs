import { readFileSync } from 'node:fs';
import { validateState } from './state.mjs';
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
export const workflow = freeze(JSON.parse(readFileSync(new URL('./data/workflows/savra-v2.json', import.meta.url), 'utf8')));
export function workflowPlan(prompt, budget, options = {}) {
  const requestedBudget = Math.min(300000, Math.max(1000, Number(budget) || 30000));
  const active = phase => phase.activation === 'media' ? options.mediaWork === true : phase.activation === 'analytics' ? options.analyticsScope === true && Boolean(options.measurableGoal) : phase.activation === 'repair' ? Number(options.repairCycles) > 0 : true;
  let approved = new Set();
  const available = new Map();
  if (options.canonicalState && options.projectId) {
    validateState(options.canonicalState);
    approved = new Set(options.canonicalState.approvals.filter(a => a.projectId === options.projectId && a.status === 'approved').map(a => a.gate));
    for(const artifact of options.canonicalState.artifacts.filter(a=>a.projectId===options.projectId)) available.set(artifact.kind==='evidence'?artifact.content.workflowArtifact:artifact.kind,artifact);
    for(const review of options.canonicalState.reviews.filter(r=>r.projectId===options.projectId&&r.status==='complete'&&r.verdict==='PASS')) {
      const output=options.canonicalState.artifacts.find(a=>a.id===review.artifactId&&a.hash===review.artifactHash);
      if(output)available.set(review.kind==='qa'?'qa':'review',review);
    }
  }
  const selected = workflow.phases.filter(active);
  const allocation = Math.floor(requestedBudget / selected.length);
  const steps = selected.map(phase => {
    const role = workflow.roles.find(r => r.id === phase.owner);
    const requiredInputs=phase.inputs.filter(id=>id!=='assets'||options.mediaWork===true);
    const missingInputs=requiredInputs.filter(id=>!available.has(id));
    const blockedReasons=[...(missingInputs.length?['Missing artifacts: '+missingInputs.join(', ')]:[]),...(phase.gate&&!approved.has(phase.gate)?['Current Gate '+phase.gate+' approval required']:[]),...(phase.id==='repair'&&options.repairCycles>=workflow.policy.maxRepairCycles?['Two repair cycles exhausted']:[])];
    return { id: role.id, name: role.name, description: role.responsibility, phase: phase.id, reason: `${phase.id}: ${role.responsibility}`, skills: role.skills.filter(s => s !== 'ux-evidence-audit' || options.existingPage).filter(s => s !== 'gsap-react' || options.framework === 'react'), inputs: phase.inputs, missingInputs, blockedReasons, inputEvidence:requiredInputs.filter(id=>available.has(id)).map(id=>({artifact:id,record:available.get(id)})), outputs: phase.outputs, gate: phase.gate, provenance: phase.provenance, readOnly: role.readOnly, canDelegate: false, approval: Boolean(phase.gate), status: blockedReasons.length ? 'blocked' : 'ready', budget: allocation, mcp: [], plugins: [], instructions: 'Return this phase to the Design Director. Do not delegate. Do not run concurrently with an author or critic.' };
  });
  return { system: { id: 'savra-v2-system', name: 'Savra v2 workflow', locked: true }, workflow, prompt: String(prompt || '').trim(), requestedBudget, allocatedBudget: allocation * steps.length, concurrency: 1, maxReadOnlyWorkers: 2, steps, dormant: workflow.roles.filter(r => !steps.some(s => s.id === r.id)).map(r => r.name), orchestrator: { name: 'Design Director', skill: 'olympus-design-director' }, limitations: workflow.limitations };
}
