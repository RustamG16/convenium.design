const QUESTIONS = Object.freeze([
  { id: 'outcome', prompt: 'What outcome should this project create?', purpose: null },
  { id: 'audience', prompt: 'Who needs this outcome most?', purpose: null },
  { id: 'constraints', prompt: 'What must remain unchanged?', purpose: 'This can change what Convenium.Design is allowed to propose, so it will be recorded in the brief.' },
  { id: 'references', prompt: 'What should define the visual or product direction?', purpose: 'References affect the proposed direction but never authorize copying.' },
  { id: 'assets', prompt: 'Which source assets and usage rights are available?', purpose: 'Asset availability and rights determine what Convenium.Design may safely use.' },
]);

const normalized = value => String(value || '').trim();

export function classifyProject(goal) {
  const value = normalized(goal).toLowerCase();
  const dictionaries = [
    ['website', ['website', 'landing page', 'web page', 'redesign']],
    ['application', ['application', 'dashboard', 'app', 'software']],
    ['brand', ['brand', 'identity', 'logo']],
    ['content', ['article', 'presentation', 'video', 'campaign']],
  ];
  let best = { kind: 'general', signals: [] };
  for (const [kind, words] of dictionaries) {
    const signals = words.filter(word => value.includes(word));
    if (signals.length > best.signals.length) best = { kind, signals };
  }
  return { ...best, confidence: best.signals.length >= 2 ? 'high' : best.signals.length ? 'medium' : 'low' };
}

export function buildOracleContext({ project, route, selection, dismissed = [] } = {}) {
  const hidden = new Set(dismissed);
  const tokens = [];
  if (project) tokens.push({ id: `project:${project.id}`, kind: 'project', label: project.name, removable: false });
  if (route) tokens.push({ id: `page:${route.id}`, kind: 'page', label: route.trail?.join(' / ') || route.id, removable: false });
  if (selection && !hidden.has(`selection:${selection.id}`)) tokens.push({ id: `selection:${selection.id}`, kind: 'selection', label: selection.label, removable: true });
  return { tokens, dismissed: [...hidden] };
}

export function removeOracleToken(context, tokenId) {
  const token = context.tokens.find(item => item.id === tokenId);
  if (!token?.removable) return context;
  return { tokens: context.tokens.filter(item => item.id !== tokenId), dismissed: [...new Set([...(context.dismissed || []), tokenId])] };
}

export function setOracleMode(state, requested, capabilities = {}) {
  if (requested === 'voice' && !capabilities.voiceAvailable) return { inputMode: 'text', notice: 'Voice input is unavailable. Continue with text.' };
  return { inputMode: requested === 'voice' ? 'voice' : 'text', notice: null };
}

function currentQuestion(answers) { return QUESTIONS.find(question => !Object.hasOwn(answers, question.id)) || null; }
function finish(goal, classification, answers) {
  return {
    goal: answers.outcome,
    audience: answers.audience,
    constraints: answers.constraints,
    references: answers.references,
    assets: answers.assets,
    sourceRequest: goal,
    classification,
  };
}

export function createOracleIntake(goal) {
  const sourceGoal = normalized(goal);
  if (!sourceGoal) throw new Error('A project goal is required.');
  return { status: 'question', goal: sourceGoal, classification: classifyProject(sourceGoal), answers: {}, current: QUESTIONS[0], inputMode: 'text' };
}

export function answerOracleQuestion(intake, questionId, value) {
  if (intake.status !== 'question' || Object.hasOwn(intake.answers, questionId)) throw new Error('That question was already answered.');
  if (intake.current?.id !== questionId) throw new Error('Answer the current question before continuing.');
  const answer = normalized(value);
  if (!answer) throw new Error('An answer is required.');
  const answers = { ...intake.answers, [questionId]: answer };
  const current = currentQuestion(answers);
  if (current) return { ...intake, answers, current };
  return {
    ...intake,
    status: 'review',
    answers,
    current: null,
    brief: finish(intake.goal, intake.classification, answers),
    designDna: { direction: 'evidence-led', density: 'operational', media: answers.assets.toLowerCase().includes('no ') ? 'no-approved-media' : 'supplied-assets', motion: 'feedback-only' },
    choiceCards: [
      { id: 'review-brief', label: 'Review brief' },
      { id: 'revise-answer', label: 'Revise an answer' },
      { id: 'cancel-intake', label: 'Cancel intake' },
    ],
  };
}

export function createBriefProposal(intake, projectId) {
  if (intake.status !== 'review') throw new Error('Complete the intake before creating a proposal.');
  return {
    title: 'Save the reviewed project brief',
    summary: 'Save this brief and Design DNA snapshot as reviewable project artifacts. Implementation will not start.',
    affected: ['Project brief', 'Design DNA snapshot'],
    operation: {
      type: 'artifact.save',
      artifact: { id: `brief-${projectId}`, projectId, kind: 'brief', content: { brief: intake.brief, designDna: intake.designDna } },
    },
  };
}
