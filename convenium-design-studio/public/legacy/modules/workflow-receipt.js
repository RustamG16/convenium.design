export function projectWorkflow(receipt) {
  if (!receipt?.workflow) throw new Error('Workflow receipt unavailable.');
  return receipt.workflow.roles.map(role => ({ ...role, phases: receipt.workflow.phases.filter(p => p.owner === role.id), artifacts: receipt.artifacts.filter(a => receipt.workflow.phases.some(p => p.owner === role.id && [...p.inputs, ...p.outputs].includes(a.id))) }));
}
