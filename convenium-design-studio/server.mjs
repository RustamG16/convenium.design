import http from 'node:http';
import { savraReceipt } from './receipts.mjs';
import { projectJourney } from './journey.mjs';
import { prepareFixture } from './fixture-output.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { plugins, tools, presets } from './skills.mjs';
import { addSource, allSkills, createSkill, initializeKnowledge, listKnowledge, updateSkill } from './knowledge.mjs';
import { buildPlan, listAgents, updateAgent } from './agents.mjs';
import { initializeEventStore, listEvents, publishEvent } from './events.mjs';
import { createProfileFromDoctrine, deleteProfile, getDesignDna, restoreProfile, updateProfile } from './design-dna.mjs';
import { agentTemplates, createSystem, createLoadout, deleteLoadout, deleteSystem, getOutputPreview, initializeSystems, listLoadouts, listSystems, recordSystemOutput, restoreLoadout, setActiveLoadout, setActiveSystem, updateLoadout, updateSystem } from './systems.mjs';
import { addAttachment, addMessage, chatDetail, createChat, createProject, createProposal, initializeWorkspace, listWorkspace, resolveProposal, unlinkAttachment } from './workspace.mjs';
import { resolveLoadoutContext } from './loadout-context.mjs';
import { clearRuns, getRun, initializeRunStore, keepVariant, listRuns, recordRun, restoreRuns } from './runs.mjs';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const apiKey = process.env.OPENAI_API_KEY || '';
// Models are configuration, not a constant. The three below are the values this workspace
// has always shipped and they stay the default, so nothing changes without APOLLO_MODELS set.
//
// What changes is the claim. "Live API ready" was shown whenever an API key existed, with no
// check that the key worked or that these model ids resolve - so a workspace whose models the
// account cannot reach still announced it was ready, and the failure only appeared after a
// person spent a run finding out. B6 measures that: a runtime claim must be backed by a
// verified capability.
const configuredModels = (process.env.APOLLO_MODELS || 'gpt-5.6-sol,gpt-5.6-terra,gpt-5.6-luna')
  .split(',').map(value => value.trim()).filter(Boolean);
const allowedModels = new Set(configuredModels);
const defaultModel = configuredModels[0] || 'gpt-5.6-terra';

// 'demo'            no key: nothing is sent anywhere, and the interface says so.
// 'live-unverified' a key is present but the models endpoint has not confirmed these ids.
// 'live'            a key is present and at least one configured model was confirmed.
let runtimeMode = apiKey ? 'live-unverified' : 'demo';
let runtimeDetail = apiKey
  ? 'API key present. Models not verified yet.'
  : 'No OPENAI_API_KEY. Planning is local and free; nothing is sent.';

async function verifyRuntime() {
  if (!apiKey) return;
  // One request, at boot, fenced. A probe that hangs must not delay the server.
  try {
    const probe = await fetch('https://api.openai.com/v1/models', {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!probe.ok) {
      runtimeMode = 'live-unverified';
      runtimeDetail = `Models endpoint returned ${probe.status}. Live runs may fail.`;
      return;
    }
    const body = await probe.json();
    const available = new Set((body.data || []).map(item => item.id));
    const reachable = configuredModels.filter(model => available.has(model));
    if (reachable.length) {
      runtimeMode = 'live';
      runtimeDetail = `${reachable.length} of ${configuredModels.length} configured models confirmed.`;
    } else {
      runtimeMode = 'live-unverified';
      runtimeDetail = `None of ${configuredModels.join(', ')} is available to this key. Set APOLLO_MODELS.`;
    }
  } catch (error) {
    runtimeMode = 'live-unverified';
    runtimeDetail = 'Could not reach the models endpoint: ' + (error.message || 'unknown error') + '.';
  }
}
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
const execFileAsync = promisify(execFile);

const json = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
};

const readJson = async request => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 500_000) throw new Error('Request body exceeds 500 KB.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const outputText = response => response.output_text || response.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text || 'No text output returned.';

// The loadout's context goes AHEAD of the capabilities, because it constrains them. A
// capability that would otherwise reach for a decorative gradient must meet the avoid-list
// before it meets its own runtimePrompt, not after.
async function composeInstructions(selectedIds, context = '') {
  const inventory = await allSkills();
  const selected = selectedIds.map(id => inventory.find(skill => skill.id === id)).filter(skill => skill?.enabled);
  return [
    'You are running one controlled Convenium.Design experiment. Answer the user prompt directly.',
    'Treat the activated capabilities below as one coordinated instruction set, not separate personas.',
    'Do not claim to have inspected files, browsers, analytics, or references unless the prompt includes that evidence.',
    'If a capability is irrelevant, keep it dormant rather than forcing it into the answer.',
    ...(context ? [context] : []),
    ...selected.map(skill => `CAPABILITY — ${skill.name}: ${skill.runtimePrompt}`)
  ].join('\n\n');
}

async function requestOpenAI({ input, instructions, model, reasoning = 'low', maxOutputTokens = 4000 }) {
  const apiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, instructions, input, reasoning: { effort: reasoning }, max_output_tokens: maxOutputTokens, store: false })
  });
  const body = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(body.error?.message || `OpenAI request failed with ${apiResponse.status}.`);
  return { id: body.id, text: outputText(body), usage: { inputTokens: body.usage?.input_tokens || 0, outputTokens: body.usage?.output_tokens || 0, totalTokens: body.usage?.total_tokens || 0 } };
}

async function runLive({ prompt, variant, model, reasoning, maxOutputTokens }) {
  const started = performance.now();
  const enabledTools = variant.tools?.includes('web_search') ? [{ type: 'web_search' }] : [];
  const apiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, instructions: await composeInstructions(variant.skills, variant.context), input: prompt, reasoning: { effort: reasoning }, max_output_tokens: maxOutputTokens, tools: enabledTools, store: false })
  });
  const body = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(body.error?.message || `OpenAI request failed with ${apiResponse.status}.`);
  return { id: body.id, mode: 'live', text: outputText(body), latencyMs: Math.round(performance.now() - started), usage: { inputTokens: body.usage?.input_tokens || 0, outputTokens: body.usage?.output_tokens || 0, totalTokens: body.usage?.total_tokens || 0 } };
}

async function runDemo({ prompt, variant }) {
  const started = performance.now();
  const inventory = await allSkills();
  const selected = variant.skills.map(id => inventory.find(skill => skill.id === id)).filter(Boolean);
  await new Promise(resolve => setTimeout(resolve, 180 + selected.length * 22));
  const phaseMix = [...new Set(selected.map(skill => skill.phase))].join(' → ');
  return {
    id: `demo_${crypto.randomUUID()}`,
    mode: 'demo',
    // Demo mode reports the resolved context too. If it did not, the one mode a person
    // can run for free would be the one mode that cannot show them what their brief and
    // taste profile changed - which is the whole point of comparing two loadouts.
    text: ['DEMO MODE — no model request was made.', '', `Prompt focus: ${prompt.slice(0, 220)}${prompt.length > 220 ? '…' : ''}`, '', `Activated route: ${phaseMix || 'none'}`, `Capabilities: ${selected.map(skill => skill.name).join(', ') || 'No skills selected'}`, '', variant.context ? `Loadout context sent ahead of every capability:
${variant.context}` : 'No brief and no Design DNA attached: this loadout adds no context of its own.', '', selected.some(skill => skill.id === 'ux-evidence-audit') ? 'This route begins with evidence and separates observations from inferences.' : 'No dedicated evidence audit is active.', selected.some(skill => skill.id === 'concept-studio') ? 'It produces three structurally distinct directions before implementation.' : 'It answers without a formal three-concept phase.', selected.some(skill => skill.id === 'visual-qa') ? 'A bounded desktop/mobile verification pass is included.' : 'Release verification is not included.'].join('\n'),
    latencyMs: Math.round(performance.now() - started),
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  };
}

async function handleCompare(request, response) {
  try {
    const body = await readJson(request);
    const prompt = String(body.prompt || '').trim();
    const variants = Array.isArray(body.variants) ? body.variants.slice(0, 3) : [];
    const model = allowedModels.has(body.model) ? body.model : defaultModel;
    const reasoning = ['none', 'low', 'medium', 'high'].includes(body.reasoning) ? body.reasoning : 'low';
    const maxOutputTokens = Math.min(20_000, Math.max(200, Number(body.maxOutputTokens) || 1000));
    const inventory = await allSkills();
    if (prompt.length < 3 || prompt.length > 20_000) return json(response, 400, { error: 'Prompt must contain 3–20,000 characters.' });
    if (variants.length < 2) return json(response, 400, { error: 'Choose at least two variants.' });
    // The loadout is resolved HERE, from its id, not trusted from the client. Comparing two
    // loadouts meant comparing two flat skill lists the browser had derived; the brief, the
    // taste profile, the budget and the approvals never left the page.
    const { loadouts } = await listLoadouts();
    const normalized = await Promise.all(variants.map(async (variant, index) => {
      const loadout = loadouts.find(item => item.id === variant.loadoutId) || null;
      const { context } = await resolveLoadoutContext(loadout);
      return {
        name: String(variant.name || `Variant ${index + 1}`).slice(0, 60),
        loadoutId: loadout?.id || null,
        loadoutName: loadout?.name || null,
        context,
        skills: [...new Set((variant.skills || []).filter(id => inventory.some(skill => skill.id === id && skill.enabled)))],
        tools: [...new Set((variant.tools || []).filter(id => tools.some(tool => tool.id === id && tool.usable)))]
      };
    }));
    const runner = apiKey && body.mode !== 'demo' ? runLive : runDemo;
    const settled = await Promise.allSettled(normalized.map(variant => runner({ prompt, variant, model, reasoning, maxOutputTokens })));
    const results = settled.map((item, index) => item.status === 'fulfilled' ? { variant: normalized[index], ...item.value } : { variant: normalized[index], mode: apiKey ? 'live' : 'demo', error: item.reason?.message || 'Run failed.' });
    // Kept server-side, with a snapshot of each loadout as it ran. The result of the product's
    // headline workflow used to live in one localStorage key on one browser.
    const { slots } = await listLoadouts();
    const stored = await recordRun({
      runId: crypto.randomUUID(),
      source: 'browser',
      mode: apiKey && body.mode !== 'demo' ? 'live' : 'demo',
      model, reasoning, prompt, results,
    }, { loadouts, slots });
    json(response, 200, { runId: stored.runId, createdAt: stored.createdAt, model, reasoning, prompt, results });
  } catch (error) { json(response, 400, { error: error.message || 'Invalid request.' }); }
}

async function handleOracle(request, response, planOnly = false) {
  try {
    const body = await readJson(request);
    const prompt = String(body.prompt || '').trim();
    if (prompt.length < 3 || prompt.length > 30_000) return json(response, 400, { error: 'Prompt must contain 3–30,000 characters.' });
    const budget = Math.min(300_000, Math.max(1000, Number(body.budget) || 30_000));
    const canonicalState=body.projectId?await (await projectJourney(body.projectId)).read():null;
    const configuration=canonicalState?.artifacts.findLast(a=>a.kind==='plan')?.content?.configuration;
    const plan = await buildPlan(prompt, budget, {loadoutId:configuration?.id||body.loadoutId,roleSettings:configuration?.roleSettings,projectId:body.projectId,canonicalState});
    await publishEvent({ host: 'apollo', kind: 'plan.created', summary: `Oracle created a ${plan.steps.length}-specialist plan.`, data: { systemId: plan.system.id, systemName: plan.system.name, specialists: plan.steps.map(step => step.name), requestedBudget: plan.requestedBudget, allocatedBudget: plan.allocatedBudget, phase: 'plan', agent: 'Convenium.Design Orchestrator', tokens: 0 } });
    if (planOnly) return json(response, 200, { mode: 'plan', plan });
    const approved = new Set(Array.isArray(body.approvedAgentIds) ? body.approvedAgentIds : []);
    const executable = plan.steps.filter(step => step.status !== 'blocked' && (!step.approval || approved.has(step.id)));
    const waiting = plan.steps.filter(step => !executable.includes(step));
    const runId = crypto.randomUUID();
    await publishEvent({ host: 'apollo', kind: 'run.started', runId, summary: `${apiKey && body.mode !== 'demo' ? 'Live' : 'Demo'} Oracle run started.`, data: { systemId: plan.system.id, systemName: plan.system.name, specialists: executable.map(step => step.name), waiting: waiting.map(step => step.name), phase: 'plan', agent: 'Convenium.Design Orchestrator', tokens: 0 } });
    if (!apiKey || body.mode === 'demo') {
      const route = executable.length ? executable.map(step => `${step.name} [${step.skills.join(', ')}]`).join('\n') : 'No specialist matched this request.';
      const contextNote = plan.context
        ? `\nLoadout context sent ahead of every capability:\n${plan.context}\n`
        : '\nNo brief and no Design DNA attached: this loadout adds no context of its own.\n';
      const answer = `DEMO MODE — Convenium.Design planned the request but made no model calls.\n\nActivated specialists:\n${route}\n${contextNote}\n${waiting.length ? `Waiting for approval: ${waiting.map(step => step.name).join(', ')}\n\n` : ''}Open this workspace in a supported host or configure OPENAI_API_KEY for live execution.`;
      for (const step of executable) await publishEvent({ host: 'apollo', kind: 'run.progress', runId, summary: `${step.name} simulated in demo mode.`, data: { systemId: plan.system.id, phase: step.phase, agent: step.name, tokens: 0, status: 'simulated' } });
      const output = await recordSystemOutput(plan.system.id, { name: `Oracle · ${prompt.slice(0, 72)}`, type: 'Oracle run', status: 'Demo', runId, summary: 'Planned route preview; no model tokens were consumed.', content: answer });
      await publishEvent({ host: 'apollo', kind: 'run.completed', runId, summary: 'Demo Oracle run completed without model usage.', data: { systemId: plan.system.id, outputId: output.id, phase: 'synthesize', agent: 'Convenium.Design Orchestrator', tokens: 0 } });
      return json(response, 200, { runId, mode: 'demo', plan, waiting, output, trace: executable.map(step => ({ agent: step.name, phase:step.phase, status: 'simulated', budget: step.budget, skills: step.skills })), answer });
    }
    const model = allowedModels.has(body.model) ? body.model : defaultModel;
    const loadoutContext = plan.context || '';
    const specialistResults = [];
    for (let index = 0; index < executable.length; index += plan.concurrency) {
      const batch = executable.slice(index, index + plan.concurrency);
      const settled = await Promise.allSettled(batch.map(async step => {
        const inventory = [`Skills: ${step.skills.join(', ') || 'none'}`, `MCP/tools requested: ${step.mcp.join(', ') || 'none'}`, `Plugins requested: ${step.plugins.join(', ') || 'none'}`].join('\n');
        const result = await requestOpenAI({ input: prompt, instructions: `${await composeInstructions(step.skills, loadoutContext)}\n\nSYSTEM ORCHESTRATOR RULES\n${plan.system.instructions}\n\nSYSTEM AGENT INSTRUCTIONS\n${step.instructions}\n\nINVENTORY\n${inventory}\n\nYou are the bounded ${step.name}. Return findings for the Convenium.Design orchestrator; do not delegate.`, model, maxOutputTokens: Math.min(8000, step.budget) });
        return { step, result };
      }));
      for (let offset = 0; offset < settled.length; offset += 1) {
        const item = settled[offset];
        const packet = item.status === 'fulfilled' ? item.value : { step: batch[offset], error: item.reason?.message || 'Specialist failed.' };
        specialistResults.push(packet);
        await publishEvent({ host: 'apollo', kind: packet.error ? 'run.failed' : 'run.progress', runId, summary: packet.error ? `${packet.step.name} failed.` : `${packet.step.name} completed its phase.`, data: { systemId: plan.system.id, phase: packet.step.phase, agent: packet.step.name, tokens: packet.result?.usage.totalTokens || 0, status: packet.error ? 'failed' : 'completed' } });
      }
    }
    const packets = specialistResults.map(item => `## ${item.step.name}\n${item.error || item.result.text}`).join('\n\n');
    const synthesis = await requestOpenAI({ input: `USER REQUEST\n${prompt}\n\nSPECIALIST PACKETS\n${packets || 'No specialist was required.'}`, instructions: `You are Convenium.Design Orchestrator. ${plan.system.instructions}\n${loadoutContext}\nProduce one direct, coherent answer. Use only relevant specialist evidence, expose material uncertainties and approvals, and do not claim tools were used beyond the packets.`, model, maxOutputTokens: Math.min(10_000, Math.max(1000, budget - plan.allocatedBudget)) });
    const usage = specialistResults.reduce((sum, item) => sum + (item.result?.usage.totalTokens || 0), synthesis.usage.totalTokens);
    const output = await recordSystemOutput(plan.system.id, { name: `Oracle · ${prompt.slice(0, 72)}`, type: 'Oracle run', status: 'Complete', runId, summary: synthesis.text.slice(0, 500), content: synthesis.text });
    await publishEvent({ host: 'apollo', kind: 'run.completed', runId, summary: 'Live Oracle run completed.', data: { systemId: plan.system.id, outputId: output.id, phase: 'synthesize', agent: 'Convenium.Design Orchestrator', tokens: synthesis.usage.totalTokens, totalRunTokens: usage, specialists: specialistResults.length } });
    json(response, 200, { runId, mode: 'live', plan, waiting, output, answer: synthesis.text, usage, trace: specialistResults.map(item => ({ agent: item.step.name, status: item.error ? 'failed' : 'completed', budget: item.step.budget, skills: item.step.skills, tokens: item.result?.usage.totalTokens || 0, error: item.error })) });
  } catch (error) { json(response, 400, { error: error.message || 'Oracle request failed.' }); }
}

async function detectCommand(command) {
  try { const { stdout } = await execFileAsync('where.exe', [command], { timeout: 2500, windowsHide: true }); return stdout.trim().split(/\r?\n/)[0] || null; } catch { return null; }
}

async function commandStatus(commands) {
  for (const command of commands) {
    const path = await detectCommand(command);
    if (!path) continue;
    try {
      const { stdout, stderr } = await execFileAsync(path, ['--version'], { timeout: 3500, windowsHide: true });
      return { command, path, runnable: true, version: `${stdout || stderr}`.trim().split(/\r?\n/)[0] || null };
    } catch (error) {
      return { command, path, runnable: false, version: null, error: error.code === 'EACCES' ? 'access-denied' : 'launch-failed' };
    }
  }
  return { command: commands[0], path: null, runnable: false, version: null, error: 'not-found' };
}

async function integrations() {
  const [codex, cursor, claude] = await Promise.all([commandStatus(['codex']), commandStatus(['cursor-agent', 'agent']), commandStatus(['claude'])]);
  return [
    { id: 'openai-api', name: 'OpenAI API', detected: Boolean(apiKey), mode: runtimeMode === 'live' ? 'ready' : runtimeMode === 'live-unverified' ? 'unverified' : 'configuration-required', detail: runtimeDetail + (apiKey ? ' Requests are not stored by Convenium.Design.' : ' API usage is billed separately from ChatGPT subscriptions.') },
    { id: 'codex-host', host: 'codex', name: 'Codex', detected: Boolean(codex.path), runnable: codex.runnable, mcpConfigured: true, mode: codex.runnable ? 'mcp-configured-cli-ready' : codex.path ? 'mcp-configured-host-only' : 'mcp-ready-host-missing', path: codex.path, version: codex.version, detail: codex.runnable ? 'Project MCP config is present and the CLI is runnable. Restart Codex in this folder, then use /mcp to verify Convenium.Design.' : 'Project MCP config is present. The desktop-bundled executable was detected but is not callable as a standalone CLI from this server process.' },
    { id: 'cursor-cli', host: 'cursor', name: 'Cursor', detected: Boolean(cursor.path), runnable: cursor.runnable, mcpConfigured: true, mode: cursor.runnable ? 'mcp-configured-cli-ready' : 'mcp-ready-cli-missing', path: cursor.path, version: cursor.version, detail: cursor.runnable ? 'Project .cursor/mcp.json is present and Cursor Agent CLI is runnable.' : 'Project .cursor/mcp.json is present. Cursor IDE can use it even when Cursor Agent CLI is not installed.' },
    { id: 'claude-cli', host: 'claude', name: 'Claude Code', detected: Boolean(claude.path), runnable: claude.runnable, mcpConfigured: true, mode: claude.runnable ? 'mcp-configured-cli-ready' : 'mcp-ready-cli-missing', path: claude.path, version: claude.version, detail: claude.runnable ? 'Project .mcp.json is present and Claude Code CLI is runnable.' : 'Project .mcp.json is present. Claude Code will request trust before using a project MCP server.' }
  ];
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  // The legacy interface is kept reachable at /legacy/ while the journey-v2 UI replaces it.
  const requested = url.pathname === '/' ? 'index.html' : url.pathname === '/legacy' || url.pathname === '/legacy/' ? 'legacy/index.html' : decodeURIComponent(url.pathname.slice(1));
  const resolved = normalize(join(root, requested));
  if (!resolved.startsWith(normalize(root))) return json(response, 403, { error: 'Forbidden.' });
  try {
    const info = await stat(resolved);
    if (!info.isFile()) throw new Error('Not a file');
    const data = await readFile(resolved);
    response.writeHead(200, { 'content-type': mime[extname(resolved)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    response.end(data);
  } catch { json(response, 404, { error: 'Not found.' }); }
}

await Promise.all([initializeKnowledge(), initializeEventStore(), initializeSystems(), initializeWorkspace(), initializeRunStore()]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  // /legacy/api/* is the same API, so the retained legacy UI and its test suite keep working.
  const path = url.pathname.startsWith('/legacy/api/') ? url.pathname.slice('/legacy'.length) : url.pathname;
  try {
    if (request.method === 'GET' && path === '/api/config') return json(response, 200, { mode: runtimeMode, modeDetail: runtimeDetail, models: [...allowedModels], skills: await allSkills(), tools, plugins, presets });
    if (request.method === 'GET' && path === '/api/systems/savra-v2-system/receipt') {
      try { return json(response, 200, await savraReceipt(url.searchParams.get('artifact'))); }
      catch (error) { return json(response, 400, { error: error.message }); }
    }
    if (request.method === 'GET' && path === '/api/workspace') return json(response, 200, await listWorkspace());
    if (request.method === 'POST' && path === '/api/workflow/compare') {
      const input=await readJson(request);const loadouts=await listLoadouts();
      if(![input.a,input.b].every(id=>loadouts.loadouts.some(l=>l.id===id)))throw new Error('Choose two available loadouts.');
      const started=performance.now();
      const [a,b]=await Promise.all([buildPlan(input.prompt,30000,{loadoutId:input.a,roleSettings:input.rolesA}),buildPlan(input.prompt,30000,{loadoutId:input.b,roleSettings:input.rolesB})]);
      const checks=[{name:'Same workflow version',pass:a.workflow.id===b.workflow.id&&a.workflow.version===b.workflow.version},{name:'Six functional roles',pass:a.workflow.roles.length===6&&b.workflow.roles.length===6},{name:'Build stays gated',pass:[a,b].every(p=>p.steps.find(s=>s.phase==='build').status==='blocked')},{name:'Sequential author and critic',pass:[a,b].every(p=>p.concurrency===1)}];
      return json(response,200,{mode:'deterministic',productionApplied:false,a,b,checks,elapsedMs:Math.round(performance.now()-started),limitations:['Routing and approval contract checks only. Visual quality, model output quality and provider cost are not measured.']});
    }
    const journeyMatch=path.match(/^\/api\/projects\/([a-z0-9-]+)\/journey$/);
    const fixtureMatch=path.match(/^\/api\/projects\/([a-z0-9-]+)\/journey\/fixture$/);
    if(fixtureMatch && request.method==='POST') {
      const writer=await projectJourney(fixtureMatch[1]);return json(response,200,prepareFixture(await writer.read(),fixtureMatch[1]));
    }
    if(journeyMatch && ['GET','POST'].includes(request.method)) {
      const writer=await projectJourney(journeyMatch[1]);
      return json(response,200,request.method==='GET'?await writer.read():await writer.dispatch(await readJson(request)));
    }
    if (request.method === 'POST' && path === '/api/projects') return json(response, 201, await createProject(await readJson(request)));
    const projectChatMatch = path.match(/^\/api\/projects\/([a-z0-9-]+)\/chats$/);
    if (request.method === 'POST' && projectChatMatch) return json(response, 201, await createChat(projectChatMatch[1], await readJson(request)));
    const chatMatch = path.match(/^\/api\/chats\/([a-z0-9-]+)$/);
    if (request.method === 'GET' && chatMatch) return json(response, 200, await chatDetail(chatMatch[1]));
    const messageMatch = path.match(/^\/api\/chats\/([a-z0-9-]+)\/messages$/);
    if (request.method === 'POST' && messageMatch) return json(response, 201, await addMessage(messageMatch[1], await readJson(request)));
    const attachmentMatch = path.match(/^\/api\/chats\/([a-z0-9-]+)\/attachments$/);
    if (request.method === 'POST' && attachmentMatch) return json(response, 201, await addAttachment(attachmentMatch[1], await readJson(request)));
    const unlinkMatch = path.match(/^\/api\/chats\/([a-z0-9-]+)\/attachments\/([a-z0-9-]+)$/);
    if (request.method === 'DELETE' && unlinkMatch) return json(response, 200, await unlinkAttachment(unlinkMatch[1], unlinkMatch[2]));
    if (request.method === 'POST' && path === '/api/proposals') return json(response, 201, await createProposal(await readJson(request)));
    const proposalMatch = path.match(/^\/api\/proposals\/([a-z0-9-]+)$/);
    if (request.method === 'PATCH' && proposalMatch) { const input = await readJson(request); return json(response, 200, await resolveProposal(proposalMatch[1], input.approved === true)); }
    if (request.method === 'GET' && path === '/api/knowledge') return json(response, 200, await listKnowledge());
    if (request.method === 'POST' && path === '/api/knowledge/skills') return json(response, 201, await createSkill(await readJson(request)));
    const skillMatch = path.match(/^\/api\/knowledge\/skills\/([a-z0-9-]+)$/);
    if (request.method === 'PATCH' && skillMatch) return json(response, 200, await updateSkill(skillMatch[1], await readJson(request)));
    const sourceMatch = path.match(/^\/api\/knowledge\/skills\/([a-z0-9-]+)\/sources$/);
    if (request.method === 'POST' && sourceMatch) return json(response, 201, await addSource(sourceMatch[1], await readJson(request)));
    if (request.method === 'GET' && path === '/api/agents') return json(response, 200, { agents: await listAgents() });
    const agentMatch = path.match(/^\/api\/agents\/([a-z0-9-]+)$/);
    if (request.method === 'PATCH' && agentMatch) return json(response, 200, await updateAgent(agentMatch[1], await readJson(request)));
    if (request.method === 'GET' && path === '/api/systems') return json(response, 200, { ...(await listSystems()), templates: agentTemplates(), inventory: { skills: await allSkills(), mcp: tools, plugins } });
    if (request.method === 'POST' && path === '/api/systems') return json(response, 201, await createSystem(await readJson(request)));
    if (request.method === 'PATCH' && path === '/api/systems/active') return json(response, 200, await setActiveSystem((await readJson(request)).id));
    const systemMatch = path.match(/^\/api\/systems\/([a-z0-9-]+)$/);
    if (request.method === 'PATCH' && systemMatch) return json(response, 200, await updateSystem(systemMatch[1], await readJson(request)));
    if (request.method === 'DELETE' && systemMatch) return json(response, 200, await deleteSystem(systemMatch[1]));
    // Design DNA: the taste profile that persists across projects. Writes into
    // library/design-dna/, which is where the schema and the two interview skills expect it.
    if (request.method === 'GET' && path === '/api/design-dna') return json(response, 200, await getDesignDna());
    if (request.method === 'POST' && path === '/api/design-dna') {
      const body = await readJson(request);
      return json(response, 201, await createProfileFromDoctrine(body.doctrine, body.displayName));
    }
    if (request.method === 'POST' && path === '/api/design-dna/restore') {
      return json(response, 200, await restoreProfile((await readJson(request)).profile));
    }
    const profileMatch = path.match(/^\/api\/design-dna\/([a-z0-9-]+)$/);
    if (request.method === 'PATCH' && profileMatch) return json(response, 200, await updateProfile(profileMatch[1], await readJson(request)));
    if (request.method === 'DELETE' && profileMatch) return json(response, 200, await deleteProfile(profileMatch[1]));

    // Loadouts: the open half of the model. The pipeline above them is locked.
    if (request.method === 'GET' && path === '/api/loadouts') return json(response, 200, await listLoadouts());
    if (request.method === 'POST' && path === '/api/loadouts') return json(response, 201, await createLoadout(await readJson(request)));
    if (request.method === 'PATCH' && path === '/api/loadouts/active') return json(response, 200, await setActiveLoadout((await readJson(request)).id));
    // Undo for the one destructive action in the model: the delete response carries the
    // removed record and its index, and this puts it back where it was.
    if (request.method === 'POST' && path === '/api/loadouts/restore') {
      const body = await readJson(request);
      return json(response, 200, await restoreLoadout(body.loadout, body.restoreIndex));
    }
    const loadoutMatch = path.match(/^\/api\/loadouts\/([a-z0-9-]+)$/);
    if (request.method === 'PATCH' && loadoutMatch) return json(response, 200, await updateLoadout(loadoutMatch[1], await readJson(request)));
    if (request.method === 'DELETE' && loadoutMatch) return json(response, 200, await deleteLoadout(loadoutMatch[1]));
    const outputMatch = path.match(/^\/api\/systems\/([a-z0-9-]+)\/outputs$/);
    if (request.method === 'POST' && outputMatch) return json(response, 201, await recordSystemOutput(outputMatch[1], await readJson(request)));
    const previewMatch = path.match(/^\/api\/systems\/([a-z0-9-]+)\/outputs\/([a-z0-9-]+)\/preview$/);
    if (request.method === 'GET' && previewMatch) {
      const preview = await getOutputPreview(previewMatch[1], previewMatch[2]);
      response.writeHead(200, { 'content-type': preview.mime, 'cache-control': 'no-cache' });
      response.end(await readFile(preview.path));
      return;
    }
    if (request.method === 'POST' && path === '/api/oracle/plan') return handleOracle(request, response, true);
    if (request.method === 'POST' && path === '/api/oracle/chat') return handleOracle(request, response, false);
    if (request.method === 'GET' && path === '/api/events') return json(response, 200, { events: await listEvents({ limit: url.searchParams.get('limit') || 100, after: url.searchParams.get('after') || undefined }) });
    if (request.method === 'POST' && path === '/api/events') {
      const input = await readJson(request);
      const event = await publishEvent(input);
      if (input.data?.systemId && input.data?.output && ['artifact.created', 'run.completed'].includes(input.kind)) {
        const output = await recordSystemOutput(input.data.systemId, { ...input.data.output, runId: input.data.output.runId || input.runId });
        event.outputId = output.id;
      }
      return json(response, 201, event);
    }
    if (request.method === 'GET' && path === '/api/integrations') return json(response, 200, { integrations: await integrations(), recommendation: 'Use Convenium.Design as a shared MCP/workspace control plane. Let each host keep its own supported subscription login; share explicit plans, artifacts, and traces—not private session tokens.' });
    if (request.method === 'POST' && path === '/api/compare') return handleCompare(request, response);
    // Runs. A comparison is evidence, and evidence that does not survive a reload is not
    // evidence. Local history is clearable, and clearing it is undoable like every other
    // destructive action in the product.
    if (request.method === 'GET' && path === '/api/runs') return json(response, 200, { runs: await listRuns({ limit: url.searchParams.get('limit') || 50 }) });
    if (request.method === 'DELETE' && path === '/api/runs') return json(response, 200, { removed: await clearRuns() });
    if (request.method === 'POST' && path === '/api/runs/restore') return json(response, 200, { restored: await restoreRuns((await readJson(request)).runs) });
    const runMatch = path.match(/^\/api\/runs\/([A-Za-z0-9-]+)$/);
    if (request.method === 'GET' && runMatch) {
      const run = await getRun(runMatch[1]);
      return run ? json(response, 200, run) : json(response, 404, { error: 'Run not found.' });
    }
    const keepMatch = path.match(/^\/api\/runs\/([A-Za-z0-9-]+)\/keep$/);
    if (request.method === 'POST' && keepMatch) {
      const input = await readJson(request);
      const kept = await keepVariant(keepMatch[1], input.variant);
      // Keeping a setup activates the loadout that produced it. Before this, "Keep this
      // setup" wrote a vestigial client store and told you to open a screen that no longer
      // existed - the last step of the headline workflow committed nothing.
      const chosen = kept.results.find(result => result.name === kept.keptVariant);
      if (chosen?.loadout?.id) {
        try { await setActiveLoadout(chosen.loadout.id); } catch { /* the run is kept even if the loadout has since been deleted */ }
      }
      return json(response, 200, { run: kept, activatedLoadoutId: chosen?.loadout?.id || null });
    }
    if (request.method === 'GET' && path === '/api/health') {
      const inventory = await allSkills();
      return json(response, 200, { ok: true, mode: runtimeMode, modeDetail: runtimeDetail, models: [...allowedModels], knowledge: true, skillCount: inventory.length, enabledSkillCount: inventory.filter(skill => skill.enabled).length, oracle: true });
    }
    if (request.method === 'GET') return serveStatic(request, response);
    json(response, 405, { error: 'Method not allowed.' });
  } catch (error) { json(response, 400, { error: error.message || 'Request failed.' }); }
});

server.listen(port, '127.0.0.1', async () => {
  console.log(`Convenium.Design Studio running at http://127.0.0.1:${port}`);
  console.log(`${runtimeMode}: ${runtimeDetail}`);
  // After listen, so a slow or unreachable models endpoint never delays startup. The mode
  // narrows from live-unverified to live only if the probe actually confirms something.
  await verifyRuntime();
  if (apiKey) console.log(`${runtimeMode}: ${runtimeDetail}`);
});
