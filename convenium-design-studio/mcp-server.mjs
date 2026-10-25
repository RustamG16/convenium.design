import readline from 'node:readline';
import { buildPlan } from './agents.mjs';
import { allSkills, initializeKnowledge } from './knowledge.mjs';
import { initializeEventStore, listEvents, publishEvent } from './events.mjs';
import { getActiveSystem, initializeSystems, recordSystemOutput } from './systems.mjs';

const tools = [
  {
    name: 'convenium_design_get_context',
    description: 'Get Convenium.Design\'s enabled skill inventory and specialist-agent configuration.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'convenium_design_create_plan',
    description: 'Create Convenium.Design\'s deterministic specialist plan without calling a model or consuming tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', minLength: 3, maxLength: 30000 },
        budget: { type: 'integer', minimum: 1000, maximum: 300000, default: 30000 }
      },
      required: ['prompt'],
      additionalProperties: false
    }
  },
  {
    name: 'convenium_design_publish_event',
    description: 'Explicitly publish a plan, run, tool, artifact, or status event to Oracle. A run.completed or artifact.created event may include data.systemId and data.output to attach its output to that saved system. Never publish credentials or private conversation history.',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', enum: ['convenium-design', 'codex', 'cursor', 'claude'] },
        kind: { type: 'string', enum: ['host.connected', 'plan.created', 'run.started', 'run.progress', 'tool.called', 'artifact.created', 'run.completed', 'run.failed', 'note'] },
        summary: { type: 'string', minLength: 1, maxLength: 2000 },
        runId: { type: 'string', maxLength: 160 },
        data: { type: 'object' }
      },
      required: ['host', 'kind', 'summary'],
      additionalProperties: false
    }
  },
  {
    name: 'convenium_design_save_output',
    description: 'Attach a completed run or artifact preview to a saved Convenium.Design system output library.',
    inputSchema: {
      type: 'object',
      properties: {
        systemId: { type: 'string', minLength: 1, maxLength: 100 },
        name: { type: 'string', minLength: 1, maxLength: 120 },
        type: { type: 'string', maxLength: 80 },
        status: { type: 'string', maxLength: 80 },
        runId: { type: 'string', maxLength: 160 },
        summary: { type: 'string', maxLength: 1000 },
        content: { type: 'string', maxLength: 30000 },
        previewPath: { type: 'string', maxLength: 1000 }
      },
      required: ['systemId', 'name'],
      additionalProperties: false
    }
  },
  {
    name: 'convenium_design_list_events',
    description: 'List recent explicit cross-host Convenium.Design events. This does not expose private host conversations.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 500, default: 50 }, after: { type: 'string', description: 'Optional ISO timestamp.' } },
      additionalProperties: false
    }
  }
];

function result(value) {
  const text = JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text }], structuredContent: value };
}

async function callTool(name, args = {}) {
  if (name === 'convenium_design_get_context') {
    const [skills, system] = await Promise.all([allSkills(), getActiveSystem()]);
    return result({ system, skills: skills.filter(skill => skill.enabled), agents: system.agents, constraints: { totalBudgetCeiling: 300000, concurrency: 2, nestedDelegation: false } });
  }
  if (name === 'convenium_design_create_plan') {
    const prompt = String(args.prompt || '').trim();
    if (prompt.length < 3 || prompt.length > 30000) throw new Error('Prompt must contain 3–30,000 characters.');
    const plan = await buildPlan(prompt, args.budget);
    await publishEvent({ host: 'convenium-design', kind: 'plan.created', summary: `Created a ${plan.steps.length}-specialist plan.`, data: { requestedBudget: plan.requestedBudget, allocatedBudget: plan.allocatedBudget, specialists: plan.steps.map(step => step.name) } });
    return result(plan);
  }
  if (name === 'convenium_design_publish_event') {
    const event = await publishEvent(args);
    if (args.data?.systemId && args.data?.output && ['artifact.created', 'run.completed'].includes(args.kind)) {
      const output = await recordSystemOutput(args.data.systemId, { ...args.data.output, runId: args.data.output.runId || args.runId });
      return result({ ...event, outputId: output.id });
    }
    return result(event);
  }
  if (name === 'convenium_design_save_output') {
    const { systemId, ...output } = args;
    return result(await recordSystemOutput(systemId, output));
  }
  if (name === 'convenium_design_list_events') return result({ events: await listEvents(args) });
  throw new Error(`Unknown tool: ${name}.`);
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(message) {
  if (!message || message.jsonrpc !== '2.0') return;
  if (message.method === 'notifications/initialized' || message.method === 'notifications/cancelled') return;
  if (message.method === 'initialize') {
    return send({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'convenium-design-studio', version: '0.2.0' }, instructions: 'Use Convenium.Design for explicit plans, skill context, artifacts, and run events. Do not publish secrets, credentials, browser/session tokens, or private conversation history. Keep irrelevant specialists dormant and never delegate from a specialist.' } });
  }
  if (message.method === 'ping') return send({ jsonrpc: '2.0', id: message.id, result: {} });
  if (message.method === 'tools/list') return send({ jsonrpc: '2.0', id: message.id, result: { tools } });
  if (message.method === 'tools/call') {
    try { return send({ jsonrpc: '2.0', id: message.id, result: await callTool(message.params?.name, message.params?.arguments) }); }
    catch (error) { return send({ jsonrpc: '2.0', id: message.id, result: { isError: true, content: [{ type: 'text', text: error.message || 'Convenium.Design tool failed.' }] } }); }
  }
  if ('id' in message) send({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } });
}

await Promise.all([initializeKnowledge(), initializeEventStore(), initializeSystems()]);
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
input.on('line', line => {
  let message;
  try { message = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  handle(message).catch(error => process.stderr.write(`Convenium.Design MCP error: ${error.message}\n`));
});
