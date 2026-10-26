// Totem-guided tutorials. Pure data (no DOM) so the Playwright recorder can read it too.
// Each step: route to open, element to spotlight ([data-tour] selector or null for centred),
// what the totem says, which pose it takes, and where the card sits.

export const POSES = {
  wave: '/media/apollo/totem-base.webp',
  right: '/media/apollo/totem-point-right.webp',
  left: '/media/apollo/totem-point-left.webp',
  think: '/media/apollo/totem-think.webp',
  cheer: '/media/apollo/totem-celebrate.webp',
};

export const TOURS = [
  {
    id: 'welcome', title: 'Welcome to Convenium.Design', icon: 'Sparkles', minutes: 2,
    summary: 'Meet the totem, the rail, Oracle and the screen that always tells you what to do next.',
    steps: [
      { route: '#/home', target: null, pose: 'wave', title: 'Hi, I’m the Convenium.Design Totem.', text: 'I’ll show you how Convenium.Design turns an idea into a finished, verified result with a team of AI agents. You stay in control at every gate.' },
      { route: '#/home', target: '.rail .nav', pose: 'left', place: 'right', title: 'The rail never moves', text: 'Nine destinations, always in the same order. Home, Projects, Plan, Playground and Results are the everyday trip; Knowledge, System and Agents explain how the work happens. Alt+1…9 jumps straight there.' },
      { route: '#/home', target: '[data-tour="active-project"]', pose: 'think', place: 'bottom', title: 'Where you are', text: 'The active project, its current stage and progress through the five stages: Discover, Direction, Build Plan, Configure and Implement.' },
      { route: '#/home', target: '[data-tour="goals"]', pose: 'right', place: 'top', title: 'Start with a goal', text: 'Pick what you want to build. Oracle will ask only the questions that matter for that kind of project.' },
      { route: '#/home', target: '[data-tour="next-action"]', pose: 'left', place: 'top', title: 'Your next action', text: 'This card always shows the single next thing Convenium.Design needs from you — an answer, an approval or a review. When in doubt, look here.' },
      { route: '#/home', target: '#oracle-dock', pose: 'think', place: 'top', title: 'Oracle is always here', text: 'Ask anything, on any screen. The chips show what Oracle can see — the project, the screen, your selection. Remove a chip to keep it out of the conversation. Press “/” to jump into it.' },
      { route: '#/journey', target: '[data-tour="journey-steps"]', pose: 'right', place: 'top', title: 'The whole trip, at a glance', text: 'Eleven steps from goal to delivery. Each shows the agent responsible and the decision that is yours. Click any step to go there.' },
      { route: '#/tutorials', target: null, pose: 'cheer', title: 'That’s the map!', text: 'Pick the next tutorial whenever you like. You can always reopen this guide from “Tutorials & guide” at the bottom of the rail.' },
    ],
  },
  {
    id: 'first-project', title: 'Your first project', icon: 'MessageSquare', minutes: 3,
    summary: 'Answer Oracle’s intake, read the brief it writes, tune the Design DNA and approve.',
    steps: [
      { route: '#/projects/northstar/intake', target: null, pose: 'wave', title: 'Guided intake', text: 'Oracle asks one question at a time and explains why. Nothing you say here starts any work — it only shapes the brief.' },
      { route: '#/projects/northstar/intake', target: '[data-tour="intake-options"]', pose: 'right', place: 'top', title: 'Choose an answer', text: 'Click the card that fits. Add detail in the text box below if you want — it goes into the brief word for word.', action: 'Pick any card', demo: '[data-option]' },
      { route: '#/projects/northstar/intake', target: '[data-tour="intake-confirm"]', pose: 'left', place: 'top', title: 'Confirm and continue', text: 'Confirming records the answer and moves to the next question. Back and Edit let you change anything later.' },
      { route: '#/projects/northstar/intake', target: '[data-tour="intake-summary"]', pose: 'left', place: 'left', title: 'Your running summary', text: 'Confirmed answers on top, remaining decisions below. Oracle never asks the same thing twice.' },
      { route: '#/projects/northstar/brief', target: '[data-tour="brief-rows"]', pose: 'right', place: 'right', title: 'The brief Oracle wrote', text: 'Outcome, audience, scope, constraints, risk — each with its source. Click Edit on any row to correct it; editing resets later approvals so nothing goes stale.' },
      { route: '#/projects/northstar/brief', target: '[data-tour="design-dna"]', pose: 'left', place: 'left', title: 'Design DNA', text: 'Drag the sliders to tell Convenium.Design how expressive, energetic or bold the result should be. Every agent reads this before it works.' },
      { route: '#/projects/northstar/brief', target: '[data-tour="brief-approve"]', pose: 'cheer', place: 'bottom', title: 'Approve to create the plan', text: 'When the brief reads right, approve it. Convenium.Design generates the master plan — still nothing is built.' },
    ],
  },
  {
    id: 'plan-configure', title: 'Plan & customize your agents', icon: 'SlidersHorizontal', minutes: 3,
    summary: 'Read the master plan, then swap skills and guardrails for any agent — safely, in a draft.',
    steps: [
      { route: '#/plan', target: '[data-tour="plan-stages"]', pose: 'right', place: 'right', title: 'Five stages, real phases', text: 'Each stage maps to phases of Convenium.Design’s locked 12-phase workflow. Green is done or approved, amber needs your review, grey is locked behind a gate.' },
      { route: '#/plan', target: '[data-tour="plan-inspector"]', pose: 'left', place: 'left', title: 'Who does the work', text: 'Click a stage to see its owning agent, the skills it carries under the active loadout, its inputs, deliverables and the gate that protects it.' },
      { route: '#/plan/configure', target: '[data-tour="cfg-table"]', pose: 'right', place: 'top', title: 'Your agent team', text: 'Oracle plus six specialists. Click a row to configure it. Rows marked Draft have unsaved changes.' },
      { route: '#/plan/configure', target: '[data-tour="cfg-skills"]', pose: 'left', place: 'left', title: 'Swap skills like gear', text: 'Each agent owns loadout slots — Craft, Motion, Verify and more. Pick a different skill and the plan changes before a single token is spent.' },
      { route: '#/plan/configure', target: '[data-tour="cfg-test"]', pose: 'think', place: 'bottom', title: 'Test before you trust', text: 'Your edits are a draft; production is unchanged. Send the draft to Playground to compare it with the active setup.' },
      { route: '#/plan/configure', target: '[data-tour="cfg-save"]', pose: 'cheer', place: 'bottom', title: 'Save to plan', text: 'When you’re happy, save. The draft becomes the active configuration and agent guardrails are written for real.' },
    ],
  },
  {
    id: 'playground', title: 'Compare in Playground', icon: 'FlaskConical', minutes: 2,
    summary: 'Run Setup A against Setup B and see exactly which agents and skills change.',
    steps: [
      { route: '#/playground', target: '[data-tour="setup-a"]', pose: 'right', place: 'right', title: 'Setup A — what runs today', text: 'The active loadout: agent, skills, model, tools and estimates.' },
      { route: '#/playground', target: '[data-tour="setup-b"]', pose: 'left', place: 'left', title: 'Setup B — your draft', text: 'The configuration you edited. It lives in a sandbox and cannot touch the plan.' },
      { route: '#/playground', target: '[data-tour="pg-run"]', pose: 'think', place: 'bottom', title: 'Run test', text: 'Convenium.Design’s planner routes the same brief through both setups and checks the workflow contract: same version, six roles, build still gated, author and critic sequential.' },
      { route: '#/playground', target: '[data-tour="what-changed"]', pose: 'right', place: 'top', title: 'What changed and why', text: 'After a run, every role whose skills or budget differ is listed here — added skills, dropped skills, budget moves.' },
      { route: '#/playground', target: '[data-tour="pg-apply"]', pose: 'cheer', place: 'bottom', title: 'Apply to plan', text: 'Happy with B? Apply it. You will always be asked to confirm first.' },
    ],
  },
  {
    id: 'run-results', title: 'Run, review & approve', icon: 'Play', minutes: 2,
    summary: 'Watch a run move through its tasks, approve at the gate and accept the result.',
    steps: [
      { route: '#/work/0248', target: '[data-tour="run-timeline"]', pose: 'right', place: 'right', title: 'Execution timeline', text: 'Six tasks, each owned by an agent, each producing files you can open. Blue is running, amber waits for you.' },
      { route: '#/work/0248', target: '[data-tour="run-preview"]', pose: 'left', place: 'left', title: 'Live preview', text: 'The output as it is being built.' },
      { route: '#/work/0248', target: '[data-tour="run-approve"]', pose: 'think', place: 'bottom', title: 'You hold the controls', text: 'Approve & Continue moves the run past a gate. Pause stops at the next safe point; Cancel Safely keeps finished evidence and deploys nothing.' },
      { route: '#/results/0248', target: '[data-tour="result-preview"]', pose: 'right', place: 'right', title: 'Results', text: 'Preview desktop and mobile. Evidence, changes, QA and agent logs are one tab away.' },
      { route: '#/results/0248', target: '[data-tour="result-qa"]', pose: 'left', place: 'left', title: 'Quality & verification', text: 'Accessibility, performance, browser QA and an independent critic score — with limitations listed honestly.' },
      { route: '#/results/0248', target: '[data-tour="result-approve"]', pose: 'cheer', place: 'bottom', title: 'Gate C is yours', text: 'Execution, verification and your acceptance are separate. Only your approval closes Gate C.' },
    ],
  },
  {
    id: 'brain', title: 'Knowledge & the Convenium.Design brain', icon: 'Brain', minutes: 2,
    summary: 'Explore the knowledge graph, the execution graph and the neural map of agents and skills.',
    steps: [
      { route: '#/knowledge', target: '[data-tour="knowledge-graph"]', pose: 'right', place: 'top', title: 'Knowledge graph', text: 'Every fact has a source and a typed relationship: defines, informs, aligns, enables, conflicts. Click a node to open its evidence. Switch the collection to see the live skill library.' },
      { route: '#/system/0248', target: '[data-tour="system-graph"]', pose: 'left', place: 'top', title: 'Execution graph', text: 'The run as a pipeline: Oracle → Director → Analyst & Producer → Engineer → Critic → Results, with each agent’s tools around it. Drag to pan, use + and − to zoom, click an agent to inspect it.' },
      { route: '#/system/0248?tab=architecture', target: '[data-tour="system-neural"]', pose: 'think', place: 'top', title: 'Neural architecture', text: 'One stage at a time: the core, the agents that own the stage, and the skills they carry. Use the arrows to walk through the stages.' },
      { route: '#/agents', target: '[data-tour="agents-brain"]', pose: 'right', place: 'top', title: 'One brain', text: 'All agents around the core, with the skills each carries. Grey counts are dormant skills waiting for the right project. Switch to Neural to see swappable alternatives.' },
      { route: '#/agents', target: '[data-tour="agent-slots"]', pose: 'cheer', place: 'left', title: 'Make it yours', text: 'Swap any slot skill or guardrail right here. It goes to your draft — test it in Playground, then save. That’s Convenium.Design. Go build something great!' },
    ],
  },
];

export const tourById = id => TOURS.find(t => t.id === id);
