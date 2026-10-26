import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { dataFile } from './paths.mjs';

const eventsPath = dataFile('events.jsonl');
const allowedHosts = new Set(['convenium-design', 'codex', 'cursor', 'claude']);
const allowedKinds = new Set([
  'host.connected',
  'plan.created',
  'run.started',
  'run.progress',
  'tool.called',
  'artifact.created',
  'run.completed',
  'run.failed',
  'note'
]);
const sensitiveKey = /(authorization|cookie|password|secret|session|api[-_]?key|access[-_]?token|refresh[-_]?token|bearer)/i;
const sensitiveText = /(bearer\s+[a-z0-9._~+\/-]{12,}|\bsk-[a-z0-9_-]{16,}|\beyJ[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}\.[a-z0-9_-]{8,})/i;

export async function initializeEventStore() {
  await mkdir(dirname(eventsPath), { recursive: true });
}

function cleanText(value, max, label) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > max) throw new Error(`${label} exceeds ${max.toLocaleString()} characters.`);
  if (sensitiveText.test(text)) throw new Error(`${label} appears to contain a credential. Convenium.Design events cannot store credentials or session tokens.`);
  return text;
}

function assertNoSensitiveFields(value, path = 'data', depth = 0) {
  if (depth > 12) throw new Error('Event data is nested too deeply.');
  for (const [key, item] of Object.entries(value || {})) {
    if (sensitiveKey.test(key)) throw new Error(`Event field ${path}.${key} is not allowed because it may contain credentials.`);
    if (typeof item === 'string' && sensitiveText.test(item)) throw new Error(`Event field ${path}.${key} appears to contain a credential.`);
    if (item && typeof item === 'object') assertNoSensitiveFields(item, `${path}.${key}`, depth + 1);
  }
}

export async function publishEvent(input = {}) {
  await initializeEventStore();
  const host = String(input.host || 'convenium-design').toLowerCase();
  const kind = String(input.kind || 'note').toLowerCase();
  if (!allowedHosts.has(host)) throw new Error('Host must be convenium-design, codex, cursor, or claude.');
  if (!allowedKinds.has(kind)) throw new Error(`Unsupported event kind: ${kind}.`);
  const data = input.data && typeof input.data === 'object' && !Array.isArray(input.data) ? input.data : {};
  assertNoSensitiveFields(data);
  const serializedData = JSON.stringify(data);
  if (Buffer.byteLength(serializedData, 'utf8') > 50_000) throw new Error('Event data exceeds 50 KB. Publish an artifact path instead.');
  const event = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    host,
    kind,
    summary: cleanText(input.summary, 2_000, 'Summary'),
    ...(input.runId ? { runId: cleanText(input.runId, 160, 'Run ID') } : {}),
    data
  };
  await appendFile(eventsPath, `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}

export async function listEvents({ limit = 100, after } = {}) {
  await initializeEventStore();
  let raw = '';
  try { raw = await readFile(eventsPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const parsed = raw.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
  const filtered = after ? parsed.filter(event => event.createdAt > after) : parsed;
  return filtered.slice(-Math.min(500, Math.max(1, Number(limit) || 100))).reverse();
}

export const eventStorePath = eventsPath;
