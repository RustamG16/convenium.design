import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { knowledgeDir } from './paths.mjs';

import { workflow, workflowPlan } from './workflow.mjs';

const settingsPath = join(knowledgeDir, 'agents.json');

export const agentDefinitions = workflow.roles.map((role, index) => ({ ...role, description: role.responsibility, budget: 4000, approval: !role.readOnly, priority: 10-index, triggers: [role.activation, 'project'], phase: role.activation }));

async function settings() {
  try { return JSON.parse(await readFile(settingsPath, 'utf8')); } catch { return {}; }
}

export async function listAgents() {
  const saved = await settings();
  return agentDefinitions.map(agent => ({ ...agent, enabled: saved[agent.id]?.enabled ?? true, budget: saved[agent.id]?.budget ?? agent.budget, approval: saved[agent.id]?.approval ?? agent.approval }));
}

export async function updateAgent(id, input) {
  if (!agentDefinitions.some(agent => agent.id === id)) throw new Error('Agent not found.');
  const saved = await settings();
  saved[id] = {
    ...(saved[id] || {}),
    ...('enabled' in input ? { enabled: Boolean(input.enabled) } : {}),
    ...('approval' in input ? { approval: Boolean(input.approval) } : {}),
    ...('budget' in input ? { budget: Math.min(50_000, Math.max(500, Number(input.budget) || 1000)) } : {})
  };
  await mkdir(knowledgeDir, {recursive:true});
  await writeFile(settingsPath, `${JSON.stringify(saved, null, 2)}\n`, 'utf8');
  return (await listAgents()).find(agent => agent.id === id);
}

// An agent's skills are its base inventory with the loadout's answers substituted in for
// the slots that agent owns. This is the whole point of the slot model: swapping Craft from
// apple-design to awwwards-web-design produces a different build from the same brief, and
// the difference is visible in the plan before a single token is spent.
function loadoutSkills(agent, loadout, slots, prompt) {
  if (!loadout) return agent.skills;
  const owned = slots.filter(slot => slot.owner === agent.id);
  if (!owned.length) return agent.skills;

  const displaced = new Set(owned.flatMap(slot => slot.candidates.map(candidate => candidate.skill)));
  const selected = agent.skills.filter(skill => !displaced.has(skill));

  for (const slot of owned) {
    const choice = loadout.slots?.[slot.id] || slot.default;
    if (!selected.includes(choice)) selected.push(choice);
    // Motion is the one slot with a conditional tail: gsap-core plus whatever the prompt
    // actually asks for, rather than every GSAP skill on every run.
    if (slot.id === 'motion' && choice === 'gsap-core') {
      if (/timeline|sequence|choreograph/.test(prompt)) selected.push('gsap-timeline');
      if (/scroll|parallax|pin/.test(prompt)) selected.push('gsap-scrolltrigger');
      if (/react|next/.test(prompt)) selected.push('gsap-react');
      if (/vue|nuxt|svelte/.test(prompt)) selected.push('gsap-frameworks');
      if (/draggable|splittext|flip|plugin/.test(prompt)) selected.push('gsap-plugins');
    }
  }

  for (const skill of loadout.advancedSkills || []) {
    if (!selected.includes(skill)) selected.push(skill);
  }
  return [...new Set(selected)];
}

export async function buildPlan(prompt, totalBudget = 30_000, options = {}) {
  const { getActiveLoadout, listLoadouts } = await import('./systems.mjs');
  const { slots } = await listLoadouts();
  const loadout = options.loadout || (options.loadoutId ? (await listLoadouts()).loadouts.find(l => l.id === options.loadoutId) : await getActiveLoadout());
  const plan = workflowPlan(prompt, totalBudget, options);
  const roleSettings=Object.fromEntries(workflow.roles.map(role=>[role.id,{budget:4000,approval:false,enabled:true}]));
  for(const [id,settings] of Object.entries(options.roleSettings||{})){
    const role=workflow.roles.find(r=>r.id===id);if(!role)throw new Error('Unknown workflow role.');
    if(!settings||Object.keys(settings).some(key=>!['budget','approval','enabled'].includes(key)))throw new Error('Unsupported role setting.');
    if('budget' in settings&&(!Number.isInteger(settings.budget)||settings.budget<500||settings.budget>50000))throw new Error('Role budget must be 500–50000 tokens.');
    if('approval' in settings&&typeof settings.approval!=='boolean'||'enabled' in settings&&typeof settings.enabled!=='boolean')throw new Error('Role switches must be boolean.');
    if(settings.enabled===false&&!['media','analytics'].includes(role.activation))throw new Error('Required roles cannot be disabled.');
    Object.assign(roleSettings[id],settings);
  }
  const weight=plan.steps.reduce((sum,step)=>sum+roleSettings[step.id].budget,0);
  for(const step of plan.steps){step.budget=Math.floor(plan.requestedBudget*roleSettings[step.id].budget/weight);if(!roleSettings[step.id].enabled){step.status='blocked';step.blockedReasons.push('Role disabled in the current draft');}}
  plan.allocatedBudget=plan.steps.reduce((sum,step)=>sum+step.budget,0);plan.roleSettings=roleSettings;
  const owners = workflow.configurationSlots;
  const currentSlots = slots.map(slot => ({...slot, owner:owners[slot.id]}));
  for (const step of plan.steps) {
    step.skills = loadoutSkills(step, loadout, currentSlots, String(prompt).toLowerCase());
    step.approval = Boolean(step.gate || loadout?.budget?.approvals?.[step.id]||roleSettings[step.id].approval);
  }
  const { resolveLoadoutContext } = await import('./loadout-context.mjs');
  const { context, profile } = await resolveLoadoutContext(loadout);
  const choices = currentSlots.map(slot => `${slot.id}: ${loadout?.slots?.[slot.id] || slot.default} (${slot.owner})`).join('\n');
  plan.context = [context, `Current configuration (reconstructed, not historical Savra settings):\n${choices}\nUse these capabilities only in their owner's active phase. Dormant roles stay dormant; configuration never grants approval.`].filter(Boolean).join('\n\n');
  plan.loadout = loadout ? {id:loadout.id,name:loadout.name,slots:loadout.slots,designDna:loadout.designDna,roleSettings} : null;
  plan.designDna = profile ? {profileId:profile.profileId,displayName:profile.displayName} : null;
  return plan;
}

async function legacyBuildPlan(prompt, totalBudget = 30000, options = {}) {
  const normalized = String(prompt || '').toLowerCase();
  const { getActiveSystem, getActiveLoadout, listLoadouts } = await import('./systems.mjs');
  const system = await getActiveSystem();
  const { slots } = await listLoadouts();
  // A named loadout can be passed in so Playground can plan two of them side by side
  // without changing which one is active.
  const loadout = options.loadout
    || (options.loadoutId
      ? (await listLoadouts()).loadouts.find(item => item.id === options.loadoutId)
      : null)
    || await getActiveLoadout();
  const approvals = loadout?.budget?.approvals || {};
  const agents = system.agents.map(agent => ({
    ...agent,
    approval: typeof approvals[agent.id] === 'boolean' ? approvals[agent.id] : agent.approval
  }));
  const matches = trigger => new RegExp(`(^|[^a-z0-9])${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`, 'i').test(normalized);
  const matched = agents
    .filter(agent => agent.enabled && agent.triggers.some(matches))
    .sort((a, b) => b.priority - a.priority);
  const requestedBudget = Math.min(300_000, Math.max(1000, Number(totalBudget) || loadout?.budget?.totalTokens || 30_000));
  const desiredBudget = matched.reduce((sum, agent) => sum + agent.budget, 0);
  const scale = desiredBudget > requestedBudget ? requestedBudget / desiredBudget : 1;
  const steps = matched.map(agent => ({ id: agent.id, name: agent.name, description: agent.description, phase: agent.phase, reason: agent.activation, skills: loadoutSkills(agent, loadout, slots, normalized), mcp: agent.mcp || [], plugins: agent.plugins || [], instructions: agent.instructions || '', budget: Math.max(500, Math.floor(agent.budget * scale / 100) * 100), approval: agent.approval, status: agent.approval ? 'approval-required' : 'ready' }));
  while (steps.reduce((sum, step) => sum + step.budget, 0) > requestedBudget && steps.some(step => step.budget > 500)) {
    const largest = steps.filter(step => step.budget > 500).sort((a, b) => b.budget - a.budget)[0];
    largest.budget -= 100;
  }
  // The context the loadout contributes, resolved once and carried on the plan so the caller
  // sends it and the UI can show it. A plan that does not carry it is a plan that cannot be
  // checked against what was actually sent.
  const { resolveLoadoutContext } = await import('./loadout-context.mjs');
  const { context, profile } = await resolveLoadoutContext(loadout);

  return {
    system: { id: system.id, name: system.name, instructions: system.instructions, locked: true },
    loadout: loadout
      ? { id: loadout.id, name: loadout.name, slots: loadout.slots, designDna: loadout.designDna }
      : null,
    context,
    designDna: profile ? { profileId: profile.profileId, displayName: profile.displayName, avoidCount: (profile.avoidList || []).length } : null,
    orchestrator: { name: 'Convenium.Design Orchestrator', skill: 'olympus-design-director', role: 'Plans, invokes only matched specialists, integrates the answer, and prevents nested delegation.' },
    prompt: String(prompt || '').trim(),
    requestedBudget,
    allocatedBudget: steps.reduce((sum, step) => sum + step.budget, 0),
    concurrency: 2,
    steps,
    dormant: agents.filter(agent => !steps.some(step => step.id === agent.id)).map(agent => agent.name)
  };
}
