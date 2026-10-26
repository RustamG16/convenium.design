// Northstar — the demonstration project shown in the journey-v2 mockups.
// Everything in here is labelled DEMO in the interface. Real Convenium.Design data (agents, skills,
// phases, gates, loadouts, budgets, runs, integrations) always comes from the server API.

export const PROJECTS = [
  { id: 'northstar', name: 'Northstar', kind: 'Brand & Website', stage: 'Discover', tone: 'green', tagline: 'AI agents for real operations' },
  { id: 'atlas', name: 'Atlas', kind: 'Campaign', stage: 'Build', tone: 'blue', tagline: 'Seasonal launch campaign' },
  { id: 'pebble', name: 'Pebble', kind: 'AI Workflow', stage: 'Complete', tone: 'grey', tagline: 'Automated content operations' },
];

export const GOALS = [
  { id: 'brand', icon: 'Target', title: 'A Brand', text: 'Identity, story, positioning' },
  { id: 'website', icon: 'AppWindow', title: 'A Website', text: 'Design, development, content' },
  { id: 'campaign', icon: 'ChartNoAxesColumn', title: 'A Campaign', text: 'Strategy, assets, launch' },
  { id: 'workflow', icon: 'UsersRound', title: 'An AI Workflow', text: 'Automate your creative work' },
  { id: 'other', icon: 'Plus', title: 'Something Else', text: 'Tell me in your own words' },
];

// The five display stages. Each collapses phases of the real 12-phase workflow.
export const STAGES = [
  { id: 'discover', n: '01', title: 'Discover', sub: 'Understand & align', icon: 'Target', text: 'Understand your business, goals, users and constraints.', phases: ['intake', 'evidence'], duration: '12 hours',
    checks: ['Intake analyzed', 'Requirements mapped', 'Success metrics defined'] },
  { id: 'direction', n: '02', title: 'Direction', sub: 'Strategy & scope', icon: 'FileText', text: 'Define the strategy, scope and operating model.', phases: ['direction', 'direction-critique'], gate: 'A', duration: '3 days',
    checks: ['Use cases prioritized', 'Agent strategy defined', 'Plan approved'] },
  { id: 'build-plan', n: '03', title: 'Build Plan', sub: 'Agents, tools, rollout', icon: 'CodeXml', text: 'Detailed build plan, agent design, tools and rollout.', phases: ['asset-manifest', 'design-system'], gate: 'B', duration: '1 week',
    checks: ['Agents designed', 'Tools and integrations mapped', 'Timeline and dependencies set'] },
  { id: 'configure', n: '04', title: 'Configure', sub: 'Agents, keys, environments', icon: 'Settings', text: 'Set up agents, tools, keys and environments.', phases: [], duration: '1–2 weeks',
    checks: ['Provision accounts', 'Configure agents', 'Run validation tests'] },
  { id: 'implement', n: '05', title: 'Implement', sub: 'Build, verify, deliver', icon: 'Rocket', text: 'Deploy to production and measure impact.', phases: ['build', 'author-qa', 'finish-review', 'repair', 'measure', 'gate-c'], gate: 'C', duration: '1–2 weeks',
    checks: ['Launch agents', 'Monitor and optimize', 'Track ROI'] },
];

// Oracle's eight intake questions (screen 02).
export const INTAKE = [
  { id: 'building', q: 'What are you building?', why: 'The kind of project decides which agents and skills Convenium.Design activates first.',
    options: [
      { id: 'brand-site', icon: 'Globe', title: 'Brand & Website', text: 'A brand and website that work together.' },
      { id: 'website', icon: 'AppWindow', title: 'Website only', text: 'A new site or a redesign of an existing one.' },
      { id: 'campaign', icon: 'Megaphone', title: 'Campaign', text: 'A launch with assets across channels.' },
      { id: 'product', icon: 'LayoutDashboard', title: 'Product UI', text: 'An application or dashboard interface.' },
      { id: 'workflow', icon: 'Workflow', title: 'AI Workflow', text: 'An automated creative operation.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'Something not listed here.' },
    ], summary: 'A brand and website for Northstar.' },
  { id: 'goal', q: 'What is the primary goal?', why: 'The goal becomes the success measure every agent is checked against.',
    options: [
      { id: 'adoption', icon: 'TrendingUp', title: 'Adoption', text: 'Increase customer adoption and market awareness.' },
      { id: 'conversion', icon: 'MousePointerClick', title: 'Conversion', text: 'Turn more visitors into customers.' },
      { id: 'credibility', icon: 'BadgeCheck', title: 'Credibility', text: 'Look established and trustworthy.' },
      { id: 'launch', icon: 'Rocket', title: 'Launch', text: 'Ship something new by a fixed date.' },
      { id: 'efficiency', icon: 'Gauge', title: 'Efficiency', text: 'Do the same work with less effort.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'A different goal (not listed here).' },
    ], summary: 'Increase customer adoption and market awareness.' },
  { id: 'audience', q: 'Who must this experience persuade first?', sub: 'Choose the primary audience that needs to say "yes" for this to succeed.',
    why: 'Knowing the primary audience helps Oracle tailor the strategy, messaging and agent design to the people who need to be convinced first — increasing the chance of real-world impact.',
    options: [
      { id: 'customers', icon: 'UsersRound', title: 'End Customers', text: 'The people who will use this experience directly.' },
      { id: 'leadership', icon: 'Building2', title: 'Internal Leadership', text: 'Executives or business leaders who fund and approve this work.' },
      { id: 'partners', icon: 'Users', title: 'Partners', text: 'External partners, resellers or strategic allies.' },
      { id: 'regulators', icon: 'Megaphone', title: 'Regulators', text: 'Government or industry regulators who must approve or comply.' },
      { id: 'teams', icon: 'User', title: 'Internal Teams', text: 'Employees or functional teams who will operate or deliver it.' },
      { id: 'other', icon: 'CircleEllipsis', title: 'Other', text: 'A different audience (not listed here).' },
    ], summary: 'End customers.' },
  { id: 'success', q: 'What does success look like?', why: 'A measurable outcome lets the Independent Critic score the result instead of guessing.',
    options: [
      { id: 'signups', icon: 'UserPlus', title: 'More sign-ups', text: 'Measurable adoption within 90 days.' },
      { id: 'pipeline', icon: 'ChartNoAxesCombined', title: 'Sales pipeline', text: 'Qualified demand for the sales team.' },
      { id: 'awareness', icon: 'Radio', title: 'Awareness', text: 'Reach and recognition in the market.' },
      { id: 'retention', icon: 'Repeat', title: 'Retention', text: 'Existing users stay and expand.' },
      { id: 'quality', icon: 'Award', title: 'Quality bar', text: 'An award-level finished craft.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'Describe your own measure.' },
    ], summary: 'Measurable adoption and business impact within 90 days.' },
  { id: 'constraints', q: 'What are the key constraints?', why: 'Constraints decide what Convenium.Design is allowed to propose; they are recorded in the brief.',
    options: [
      { id: 'timeline', icon: 'CalendarClock', title: 'Tight timeline', text: 'A fixed date we cannot move.' },
      { id: 'infra', icon: 'Server', title: 'Existing infrastructure', text: 'Must fit the current stack.' },
      { id: 'compliance', icon: 'ShieldCheck', title: 'Security & compliance', text: 'Reviews and policies apply.' },
      { id: 'budget', icon: 'Wallet', title: 'Lean budget', text: 'Spend must stay small.' },
      { id: 'team', icon: 'UsersRound', title: 'Small team', text: 'Few people to operate it.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'Something else limits us.' },
    ], summary: 'Q3 timeline, existing infrastructure, security and compliance, lean team.' },
  { id: 'timeline', q: 'What is the timeline?', why: 'The timeline sets the depth of each stage and when gates must be reviewed.',
    options: [
      { id: '2w', icon: 'Zap', title: '2 weeks', text: 'A focused sprint.' },
      { id: '6w', icon: 'Timer', title: '6 weeks', text: 'A complete first release.' },
      { id: '8w', icon: 'CalendarDays', title: '~8 weeks', text: 'Brand, site and rollout.' },
      { id: 'q', icon: 'CalendarRange', title: 'This quarter', text: 'Before the quarter closes.' },
      { id: 'flex', icon: 'Infinity', title: 'Flexible', text: 'Quality over speed.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'A different schedule.' },
    ], summary: '~8 weeks across five stages.' },
  { id: 'resources', q: 'What resources are available?', why: 'Asset availability and rights determine what Convenium.Design may safely use.',
    options: [
      { id: 'brand', icon: 'Palette', title: 'Brand guidelines', text: 'Logo, colours and typography exist.' },
      { id: 'content', icon: 'FileText', title: 'Content', text: 'Copy and product documentation.' },
      { id: 'media', icon: 'Image', title: 'Photography', text: 'Owned imagery with usage rights.' },
      { id: 'research', icon: 'Microscope', title: 'Research', text: 'Customer interviews and insights.' },
      { id: 'none', icon: 'CircleDashed', title: 'Nothing yet', text: 'Start from a blank page.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'Describe what exists.' },
    ], summary: 'Logo, visual references, research notes, user insights, technical docs.' },
  { id: 'anything', q: 'Is there anything else I should know?', why: 'Anything said here is added to the brief as context for every agent.',
    options: [
      { id: 'competitors', icon: 'Swords', title: 'Competitors', text: 'Others position similarly.' },
      { id: 'risk', icon: 'TriangleAlert', title: 'Known risks', text: 'Things that worry us.' },
      { id: 'taste', icon: 'Sparkles', title: 'Taste', text: 'Styles we love or avoid.' },
      { id: 'stakeholders', icon: 'Network', title: 'Stakeholders', text: 'People who must sign off.' },
      { id: 'nothing', icon: 'Check', title: 'Nothing else', text: 'The brief is complete.' },
      { id: 'other', icon: 'Ellipsis', title: 'Other', text: 'Add your own note.' },
    ], summary: 'Similar positioning from established tools.' },
];

// Screen 03 brief rows.
export const BRIEF = [
  { id: 'outcome', icon: 'Target', label: 'Outcome', hint: 'What success looks like', value: 'Launch Northstar with measurable adoption and business impact within 90 days.', source: 'Oracle intake' },
  { id: 'audience', icon: 'UsersRound', label: 'Audience', hint: "Who it's for", value: 'Operations leaders, product teams, and early design partners at enterprise customers.', source: 'Stakeholder input' },
  { id: 'action', icon: 'MousePointer2', label: 'Primary action', hint: 'What we want them to do', value: 'Use Northstar to plan, build and run AI agents for real work.', source: 'Oracle analysis' },
  { id: 'scope', icon: 'Box', label: 'Scope', hint: "What's in / out", value: 'In scope: web application, core agent workflows, initial integrations, internal beta.\nOut of scope: mobile app, marketplace, billing.', source: 'Product strategy' },
  { id: 'constraints', icon: 'Shield', label: 'Constraints', hint: 'What we must work within', value: 'Q3 timeline, existing infrastructure, security and compliance requirements, lean team.', source: 'Technical review' },
  { id: 'references', icon: 'FileText', label: 'References', hint: 'Key inputs and inspiration', value: 'Oracle intake, competitive analysis, customer interviews, existing brand guidelines.', source: 'Attached files' },
  { id: 'assets', icon: 'Image', label: 'Assets', hint: 'What we already have', value: 'Logo, visual references, research notes, user insights, technical docs.', source: 'Project library' },
  { id: 'risk', icon: 'TriangleAlert', label: 'Risk tolerance', hint: 'How bold we can be', value: 'Moderate. Willing to explore new interaction patterns, within brand and reliability guardrails.', source: 'Leadership input' },
];

export const DNA = [
  { id: 'editorial', left: 'Editorial', right: 'Expressive', value: 70, tone: 'green', source: 'Brand workshop' },
  { id: 'calm', left: 'Calm', right: 'Energetic', value: 66, tone: 'blue', source: 'User research' },
  { id: 'minimal', left: 'Minimal', right: 'Rich', value: 25, tone: 'green', label: 'Minimal', source: 'Design team' },
  { id: 'safe', left: 'Safe', right: 'Bold', value: 46, tone: 'amber', label: 'Balanced', source: 'Leadership input' },
  { id: 'motion', left: 'Motion tolerance', right: 'High', value: 58, tone: 'green', label: 'Moderate', source: 'Accessibility review' },
  { id: 'decision', left: 'Decision style', right: 'Intuitive', value: 52, tone: 'blue', label: 'Data-informed', source: 'Product strategy' },
];
export const DNA_TAGS = ['Production-ready', 'Enterprise', 'Human-centered', 'Modular', 'Scalable', 'Trusted'];

// Screen 07/08 run fixture.
export const RUN = {
  id: '0248',
  started: '3 Sep 2026, 20:14',
  elapsed: '1h 27m 16s',
  tasks: [
    { n: '01', title: 'Analyze requirements', text: 'Parse intake, map goals and constraints.', status: 'done', time: '12m 14s', files: ['requirements.md', 'analysis.json'], agent: 'oracle' },
    { n: '02', title: 'Design direction', text: 'Define strategy and site structure.', status: 'done', time: '18m 03s', files: ['strategy.md', 'sitemap.json'], agent: 'design-director' },
    { n: '03', title: 'Generate assets', text: 'Create visuals, copy and components.', status: 'done', time: '24m 37s', files: ['hero.png', 'components.zip'], agent: 'asset-producer' },
    { n: '04', title: 'Implement', text: 'Build and integrate the website.', status: 'running', time: '12m 22s', files: ['src/', 'build.log'], agent: 'design-engineer' },
    { n: '05', title: 'Validation & review', text: 'Test, QA and prepare for approval.', status: 'waiting', time: '—', files: ['test-report.md', 'preview.url'], agent: 'independent-critic' },
    { n: '06', title: 'Deploy', text: 'Publish to production.', status: 'pending', time: '—', files: ['deploy-plan.md', '—'], agent: 'oracle' },
  ],
  evidence: [
    { name: 'src/app/page.tsx', size: '3.4 MB', ago: '4m ago' },
    { name: 'build.log', size: '1.2 MB', ago: '8m ago' },
    { name: 'preview.png', size: '890 KB', ago: '9m ago' },
  ],
  logs: [['21:11', 'Installing dependencies...'], ['21:12', 'Next.js build started'], ['21:14', 'Compiling pages (12/12)...'], ['21:14', 'Preview server running at localhost:3000']],
  tokens: { used: 42360, total: 100000 },
  permissions: ['Read project files', 'Write to feature branch', 'Run tests', 'Deploy to preview (staging only)'],
};

export const QA = [
  { icon: 'Accessibility', label: 'Accessibility (WCAG 2.1 AA)', score: 96, verdict: 'PASS', tone: 'green' },
  { icon: 'Gauge', label: 'Performance (Lighthouse)', score: 98, verdict: 'PASS', tone: 'green' },
  { icon: 'Globe', label: 'Browser QA', note: '(Chrome, Safari, Firefox, Edge)', verdict: 'PASS', tone: 'green' },
  { icon: 'ShieldCheck', label: 'Independent critic score', score: 93, verdict: 'PASS WITH NOTES', tone: 'amber' },
  { icon: 'TriangleAlert', label: 'Limitations', note: '2 noted', verdict: 'VIEW', tone: 'amber' },
];

// Screen 09 knowledge graph.
export const KNOWLEDGE = {
  nodes: [
    { id: 'northstar', type: 'Project', title: 'Northstar', icon: 'Folder', text: 'Brand, product and go-to-market for AI creative tools.', x: 50, y: 50, tone: 'green', hub: true },
    { id: 'brief', type: 'Document', title: 'Project Brief', icon: 'FileText', text: 'Defines goals, scope and success criteria.', x: 50, y: 13, tone: 'green' },
    { id: 'audience', type: 'Concept', title: 'Target Audience', icon: 'UsersRound', text: 'Creative professionals and small teams.', x: 16, y: 31 },
    { id: 'dna', type: 'Concept', title: 'Design DNA', icon: 'Diamond', text: 'Visual language, principles, tone.', x: 84, y: 31 },
    { id: 'skills', type: 'Capability', title: 'Skills', icon: 'Settings', text: 'Strategy, design, engineering, marketing.', x: 16, y: 74 },
    { id: 'artifacts', type: 'Collection', title: 'Artifacts', icon: 'Database', text: 'Plans, designs, code, research.', x: 50, y: 87 },
    { id: 'competitor', type: 'Risk', title: 'Competitor Overlap', icon: 'TriangleAlert', text: 'Similar positioning from established tools.', x: 84, y: 74, tone: 'coral' },
  ],
  edges: [
    { from: 'brief', to: 'northstar', type: 'defines' },
    { from: 'audience', to: 'northstar', type: 'informs' },
    { from: 'dna', to: 'northstar', type: 'aligns' },
    { from: 'skills', to: 'northstar', type: 'enables' },
    { from: 'northstar', to: 'artifacts', type: 'produces' },
    { from: 'northstar', to: 'competitor', type: 'conflicts' },
  ],
  evidence: [['northstar-brief.pdf', '3 days ago'], ['strategy-notes.md', '5 days ago'], ['kickoff-recording.mp4', '1 week ago']],
};

export const PLAYGROUND = {
  a: { name: 'Editorial Precision', sub: 'Clear. Structured. Trusted.', agent: 'design-director', model: 'Claude 4 (Sonnet)', tools: 'Notion, Web Search, Figma MCP', time: '6m 12s', cost: '$0.18', confidence: 78, result: 'Well-structured strategy with clear messaging and positioning' },
  b: { name: 'Expressive Motion', sub: 'Fast. Visual. Interactive.', agent: 'design-engineer', model: 'Claude Code (Sonnet 4)', tools: 'VS Code, GitHub, Figma MCP, Playwright', time: '2m 41s', cost: '$0.32', confidence: 64, result: 'Interactive UI prototype with real components and motion' },
  changes: [
    { icon: 'UsersRound', label: 'Agent', text: 'Switched from Planning to Execution specialist for faster build output.' },
    { icon: 'Settings', label: 'Skills', text: 'Replaced strategy skills with UI development and implementation.' },
    { icon: 'Sparkles', label: 'Model', text: 'Claude 4 → Claude Code for hands-on implementation.' },
    { icon: 'Wrench', label: 'Tools', text: 'Swapped Notion/Web for VS Code, GitHub and design tooling.' },
    { icon: 'Clock', label: 'Time', text: 'Optimized for speed with a more direct workflow.' },
    { icon: 'Database', label: 'Cost', text: 'Slightly higher due to code generation and additional tool calls.' },
    { icon: 'ChartNoAxesColumn', label: 'Confidence', text: 'Lower confidence (newer approach) but higher speed.' },
    { icon: 'FileText', label: 'Expected result', text: 'Working, interactive prototype instead of a strategy document.' },
  ],
  score: [['Quality', 8.5, 7.8], ['Clarity', 9.1, 7.2], ['Speed', 5.2, 9.3], ['Cost', 9.0, 6.1], ['Evidence', 8.0, 7.5]],
};

// Per-agent presentation copy for the configure table (screen 05).
export const AGENT_COPY = {
  oracle: { responsibility: 'Strategic intake & run configuration', activation: 'Project created or updated', effect: 'Clear goals, context and constraints', permissions: 'Full access', model: 'Claude 4', tools: ['Intake', 'Analysis'] },
  'design-director': { responsibility: 'Plan, decompose & delegate', activation: 'After intake (or on plan change)', effect: 'Clear direction & agent strategy', permissions: 'Project data · Create sub-tasks', model: 'Claude 4', tools: ['Strategy', 'Planning'] },
  'visual-analyst': { responsibility: 'Reference analysis & style extraction', activation: 'When visual assets or references exist', effect: 'Style guidance & visual context', permissions: 'Read project files · Web search', model: 'Claude 4 Vision', tools: ['Vision', 'Image Search'] },
  'asset-producer': { responsibility: 'Generate assets & iterations', activation: 'When assets are requested', effect: 'Production-ready creative assets', permissions: 'Create files · Write to project', model: 'Claude 4', tools: ['Image Gen', 'Video Gen'] },
  'design-engineer': { responsibility: 'Implement, integrate & package', activation: 'After assets approved (or on build request)', effect: 'Working product & deployable package', permissions: 'Read/write code · Access integrations', model: 'Claude 4', tools: ['Code Tools', 'API Keys'] },
  'independent-critic': { responsibility: 'Review, test & validate', activation: 'Before delivery (or on major changes)', effect: 'Quality assurance & risk mitigation', permissions: 'Read all outputs · Block on issues', model: 'Claude 4', tools: ['Eval Tools', 'Linter'] },
  'analytics-specialist': { responsibility: 'Measurement plan & event contract', activation: 'Only with consent, a baseline and a measurable goal', effect: 'Evidence the result moved the goal', permissions: 'Read outputs · Propose events', model: 'Claude 4', tools: ['Analytics', 'Events'] },
};

export const JOURNEY = [
  { band: 0, n: 1, icon: 'Target', title: 'Goal', text: 'Tell Convenium.Design what you want to achieve.', agent: 'Oracle', role: 'Strategic Advisor', decision: 'Confirm goal and proceed.', tone: 'green', href: '#/home' },
  { band: 0, n: 2, icon: 'MessageSquare', title: 'Questions', text: 'Convenium.Design asks a few questions to understand better.', agent: 'Oracle', role: 'Requirements Analyst', decision: 'Answer questions.', tone: 'green', href: '#/projects/northstar/intake' },
  { band: 0, n: 3, icon: 'Fingerprint', title: 'Design DNA', text: 'Applies your brand, audience and creative principles.', agent: 'Design Director', role: 'Brand & Strategy', decision: 'Review and confirm.', tone: 'green', href: '#/projects/northstar/brief' },
  { band: 1, n: 4, icon: 'FileText', title: 'Brief', text: 'Creates a clear creative brief with objectives, scope and inputs.', agent: 'Design Director', role: 'Brief Specialist', decision: 'Review brief and edit if needed.', tone: 'blue', href: '#/projects/northstar/brief' },
  { band: 1, n: 5, icon: 'CalendarDays', title: 'Plan', text: 'Turns the brief into a step-by-step plan with agents, tools and timeline.', agent: 'Design Director', role: 'Planning Agent', decision: 'Review plan and approve.', tone: 'blue', href: '#/plan' },
  { band: 1, n: 6, icon: 'SlidersHorizontal', title: 'Configure', text: 'Sets up agents, tools, keys and environments.', agent: 'System', role: 'Setup Agent', decision: 'Confirm configuration.', tone: 'blue', href: '#/plan/configure' },
  { band: 2, n: 7, icon: 'FlaskConical', title: 'Test', text: 'Runs a validation to check quality, safety and fit for purpose.', agent: 'Independent Critic', role: 'QA Agent', decision: 'Review results and approve.', tone: 'amber', href: '#/playground' },
  { band: 2, n: 8, icon: 'CircleCheck', title: 'Approve', text: 'You give final approval to start the build.', agent: 'Oracle', role: 'Approval Manager', decision: 'Approve to build.', tone: 'amber', href: '#/playground' },
  { band: 3, n: 9, icon: 'Hammer', title: 'Build', text: 'Agents create, produce and assemble the final outputs.', agent: 'Design Engineer', role: 'Build Agent', decision: 'Monitor progress.', tone: 'blue', href: '#/work/0248' },
  { band: 3, n: 10, icon: 'FileCheck', title: 'Review', text: 'You review the completed work and provide feedback.', agent: 'Independent Critic', role: 'Review Agent', decision: 'Approve, request changes or iterate.', tone: 'blue', href: '#/results/0248' },
  { band: 3, n: 11, icon: 'Upload', title: 'Continue', text: 'Deploy, measure impact and plan what\'s next together.', agent: 'Oracle', role: 'Growth Advisor', decision: 'Choose next step or new goal.', tone: 'green', href: '#/results/0248' },
];
export const BANDS = [['Explore & define', 'green'], ['Plan & prepare', 'blue'], ['Execute & validate', 'amber'], ['Deliver & continue', 'green']];
