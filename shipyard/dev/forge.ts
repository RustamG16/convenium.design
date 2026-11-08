/**
 * v2 Forge write-back (dev server only; owner decision 2026-11-08). The only path from the Shipyard UI
 * into `library/`, and a narrow one:
 *
 * - `POST /__shipyard/forge/preview` validates an operation, renders every target file in memory and
 *   returns a unified diff, the current hash of each target and a one-time token. Nothing is written.
 * - `POST /__shipyard/forge/apply` takes that token. It refuses when a target changed since the preview
 *   (hash), when a target has uncommitted edits in git (someone else — the owner, or Claude — is working
 *   on it), or when another library job is running (mutex). Then it writes the files, runs
 *   `project.py all` + `verify.py`, and on any failure restores the exact bytes (deleting files it
 *   created) and regenerates. It never commits: the result is a reviewable `git diff`.
 *
 * Writes are confined to an allow-list: library/agents/<slug>.md,
 * library/skills/<category>/<slug>/SKILL.md and library/registry/{skills.registry,crew}.json.
 * Delete asks for the id typed back and refuses while anything still references the item.
 */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { exclusive, json, pathsFrom, rebuild, run, sameOrigin } from './live';

const SLUG = /^[a-z][a-z0-9-]{1,47}$/;
const CONSOLE_PHASES = new Set(['always', 'diagnose', 'direct', 'prepare', 'build', 'verify']);
const CREW_SLUG = /^[a-z][a-z0-9-]{1,31}$/;
const MAX_BODY = 200_000;
const TOKEN_TTL_MS = 10 * 60_000;

export const agentInput = z.strictObject({
  id: z.string().regex(SLUG, 'a slug: a-z, 0-9 and -, starting with a letter'),
  description: z.string().trim().min(12, 'at least 12 characters').max(600),
  model: z.enum(['opus', 'sonnet', 'haiku', 'inherit']),
  access: z.enum(['read-only', 'write']),
  routes: z.array(z.string().regex(SLUG)).max(16),
  /** one of PHASES, or the agent's own phase word (for example `measurement`), kept as written */
  phase: z.string().regex(/^[a-z][a-z-]{1,23}$/, 'a phase word: a-z and -').nullable(),
  priority: z.number().int().min(0).max(99).nullable(),
  activateWhen: z.string().trim().max(400).default(''),
  /** markdown for a new agent's Contract section; ignored on update (the hand-written body is kept) */
  contract: z.string().max(6000).default(''),
  crew: z.strictObject({
    id: z.string().regex(CREW_SLUG),
    name: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(80),
    pigment: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    glyph: z.string().max(4).default(''),
    species: z.string().max(160).default(''),
    essence: z.string().max(400).default(''),
  }),
});
export type AgentInput = z.infer<typeof agentInput>;

export const skillInput = z.strictObject({
  id: z.string().regex(SLUG),
  category: z.string().regex(/^\d\d-[a-z0-9-]+$/),
  group: z.string().trim().min(1).max(40),
  description: z.string().trim().min(12).max(1200),
  /** markdown for a new SKILL.md body; ignored on update */
  body: z.string().max(20_000).default(''),
});
export type SkillInput = z.infer<typeof skillInput>;

export const forgeOp = z.union([
  z.strictObject({ kind: z.literal('agent'), op: z.enum(['create', 'update']), payload: agentInput }),
  z.strictObject({ kind: z.literal('skill'), op: z.enum(['create', 'update']), payload: skillInput }),
  z.strictObject({ kind: z.literal('agent'), op: z.literal('delete'), payload: z.strictObject({ id: z.string().regex(SLUG), confirm: z.string() }) }),
  z.strictObject({ kind: z.literal('skill'), op: z.literal('delete'), payload: z.strictObject({ id: z.string().regex(SLUG), confirm: z.string() }) }),
]);
export type ForgeOp = z.infer<typeof forgeOp>;

/** A file the operation touches: its repo-relative path and the full new text, or null to delete it. */
export interface Change {
  rel: string;
  next: string | null;
}

export class ForgeRefusal extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(problems.join('; '));
    this.problems = problems;
  }
}

const sha = (s: string | null) => (s === null ? 'absent' : createHash('sha256').update(s).digest('hex'));
const lf = (s: string) => s.replace(/\r\n/g, '\n');

interface Registry {
  id: string;
  name: string;
  phase: string;
  group: string;
  defaultOn: boolean;
  description: string;
  runtimePrompt: string;
  category: string;
  hosts: string[];
  status: string;
  enabled: boolean;
}
interface CrewMember {
  id: string;
  role: { title: string; agent: string };
  station: number;
  related?: string[];
  [k: string]: unknown;
}

/** Reads and renders against one repo root. Pure apart from reading files, so it unit-tests on a copy. */
export class Library {
  readonly repo: string;
  constructor(repo: string) {
    this.repo = repo;
  }
  abs(rel: string) {
    return resolve(this.repo, rel);
  }
  read(rel: string): string | null {
    const p = this.abs(rel);
    return existsSync(p) ? lf(readFileSync(p, 'utf8')) : null;
  }
  readJson<T>(rel: string): T {
    return JSON.parse(this.read(rel) ?? 'null') as T;
  }
  registry() {
    return this.readJson<Registry[]>('library/registry/skills.registry.json');
  }
  crewFile() {
    return this.readJson<{ version: number; note: string; crew: CrewMember[] }>('library/registry/crew.json');
  }
  workflows() {
    return this.readJson<{ ships: { id: string; skills?: string[]; stages: { crew?: string[] }[] }[] }>('library/registry/workflows.json');
  }
  agents(): string[] {
    return readdirSync(this.abs('library/agents'))
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.slice(0, -3));
  }
  categories(): string[] {
    const fam = this.readJson<{ families: { category: string }[] }>('library/registry/artifacts.json').families.map((f) => f.category);
    return readdirSync(this.abs('library/skills')).filter((c) => fam.includes(c));
  }
  external(): Set<string> {
    const e = this.readJson<{ plugin?: string[]; builtin?: string[] } | null>('library/registry/external-skills.json');
    return new Set([...(e?.plugin ?? []), ...(e?.builtin ?? [])]);
  }
}

/** Allow-list: the only paths the Forge may write. Anything else is a bug, refused before any write. */
export function allowed(rel: string): boolean {
  const p = rel.split(sep).join('/');
  return (
    /^library\/agents\/[a-z][a-z0-9-]{1,47}\.md$/.test(p) ||
    /^library\/skills\/\d\d-[a-z0-9-]+\/[a-z][a-z0-9-]{1,47}\/SKILL\.md$/.test(p) ||
    /^library\/registry\/(skills\.registry|crew)\.json$/.test(p)
  );
}

function frontmatterOf(md: string): { fm: string; body: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: md };
}

function setField(fm: string, key: string, value: string): string {
  const line = `${key}: ${value}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  return re.test(fm) ? fm.replace(re, line) : `${fm}\n${line}`;
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

function activationLines(a: AgentInput): string[] {
  const lines: string[] = [];
  if (a.phase) lines.push(`- **Phase:** \`${a.phase}\`  ·  **Priority:** ${a.priority ?? 50}`);
  if (a.activateWhen) lines.push(`- **Activate when:** ${oneLine(a.activateWhen)}`);
  return lines;
}

export function renderAgentMd(a: AgentInput, existing: string | null): string {
  const fields: [string, string][] = [
    ['name', a.id],
    ['description', oneLine(a.description)],
    ['model', a.model],
    ['access', a.access],
    ['routes', `[${a.routes.join(', ')}]`],
  ];
  if (existing) {
    // Update: change the frontmatter fields and the activation lines; keep every hand-written line else.
    const { fm, body } = frontmatterOf(existing);
    let next = fm;
    for (const [k, v] of fields) next = setField(next, k, v);
    let b = body.replace(/^- \*\*Phase:\*\*.*\n?/m, '').replace(/^- \*\*Activate when:\*\*.*\n?/m, '');
    const act = activationLines(a);
    if (act.length) b = /^## Activation\n\n?/m.test(b) ? b.replace(/^## Activation\n\n?/m, `## Activation\n\n${act.join('\n')}\n`) : `\n## Activation\n\n${act.join('\n')}\n${b}`;
    return `---\n${next}\n---\n${b}`;
  }
  const act = activationLines(a);
  return [
    '---',
    ...fields.map(([k, v]) => `${k}: ${v}`),
    '---',
    '',
    '## Activation',
    '',
    ...(act.length ? act : ['- **Activate when:** the run plan names this agent.']),
    '',
    'Routing is the director\'s decision, not a keyword match.',
    '',
    '## Contract',
    '',
    a.contract.trim() || '- Input packet: what the director hands over.\n- Output: what this agent returns, and where.',
    '',
    `<!-- Created in the Shipyard Forge. Review this file before committing it. -->`,
    '',
  ].join('\n');
}

export function renderSkillMd(s: SkillInput): string {
  return [
    '---',
    `name: ${s.id}`,
    `description: ${oneLine(s.description)}`,
    '---',
    '',
    `# ${s.id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
    '',
    s.body.trim() || 'What this skill does, when to use it, and the steps it follows.',
    '',
    `<!-- Created in the Shipyard Forge. Review this file before committing it. -->`,
    '',
  ].join('\n');
}

const stringify = (o: unknown) => `${JSON.stringify(o, null, 2)}\n`;

/** Turn one operation into file changes, or refuse with every problem named. Writes nothing. */
export function plan(lib: Library, op: ForgeOp): Change[] {
  const problems: string[] = [];
  const reg = lib.registry();
  const crew = lib.crewFile();
  const agents = lib.agents();
  const regIds = new Set(reg.map((r) => r.id));
  const external = lib.external();

  if (op.kind === 'agent' && op.op !== 'delete') {
    const a = op.payload;
    const exists = agents.includes(a.id);
    if (op.op === 'create' && exists) problems.push(`agent ${a.id} already exists`);
    if (op.op === 'update' && !exists) problems.push(`agent ${a.id} does not exist`);
    for (const r of a.routes) if (!regIds.has(r) && !external.has(r)) problems.push(`route ${r} is not a registry skill`);
    for (const r of a.routes) {
      const rec = reg.find((x) => x.id === r);
      if (rec && (rec.status === 'stub' || !['claude', 'codex'].every((h) => rec.hosts.includes(h)))) problems.push(`route ${r} is not projected to both claude and codex`);
    }
    const member = crew.crew.find((m) => m.role.agent === a.id);
    if (op.op === 'create' && crew.crew.some((m) => m.id === a.crew.id)) problems.push(`crew id ${a.crew.id} is taken`);
    if (problems.length) throw new ForgeRefusal(problems);
    const rel = `library/agents/${a.id}.md`;
    const changes: Change[] = [{ rel, next: renderAgentMd(a, op.op === 'update' ? lib.read(rel) : null) }];
    const nextCrew = structuredClone(crew);
    if (op.op === 'create') {
      const station = Math.max(0, ...crew.crew.map((m) => m.station)) + 1;
      nextCrew.crew.push({
        id: a.crew.id,
        name: a.crew.name,
        glyph: a.crew.glyph,
        species: a.crew.species,
        essence: a.crew.essence,
        role: { title: a.crew.title, agent: a.id },
        station,
        // the crew card's phase is the 2D console's own field and takes only a pipeline phase
        phase: a.phase && CONSOLE_PHASES.has(a.phase) ? a.phase : 'always',
        strengths: [],
        blindSpots: [],
        motivations: [],
        growthPaths: [],
        related: [],
        analogy: '',
        plainMeaning: `${a.id} is ${a.access}${a.model === 'inherit' ? '' : ` and runs at ${a.model}`}: ${oneLine(a.description)}`,
        pigment: a.crew.pigment.toUpperCase(),
        working: '',
      });
    } else if (member) {
      const m = nextCrew.crew.find((x) => x.role.agent === a.id)!;
      m.name = a.crew.name;
      m.role = { ...m.role, title: a.crew.title };
      m.pigment = a.crew.pigment.toUpperCase();
      if (a.crew.glyph) m.glyph = a.crew.glyph;
      if (a.crew.species) m.species = a.crew.species;
      if (a.crew.essence) m.essence = a.crew.essence;
    }
    const crewText = stringify(nextCrew);
    if (crewText !== lib.read('library/registry/crew.json')) changes.push({ rel: 'library/registry/crew.json', next: crewText });
    return changes;
  }

  if (op.kind === 'skill' && op.op !== 'delete') {
    const s = op.payload;
    const exists = regIds.has(s.id);
    if (op.op === 'create' && exists) problems.push(`skill ${s.id} already exists`);
    if (op.op === 'update' && !exists) problems.push(`skill ${s.id} does not exist`);
    if (!lib.categories().includes(s.category)) problems.push(`category ${s.category} has no artifact family (artifacts.json)`);
    const rec = reg.find((r) => r.id === s.id);
    if (op.op === 'update' && rec && rec.category !== s.category) problems.push('moving a skill to another category is not supported here; move its folder by hand');
    if (problems.length) throw new ForgeRefusal(problems);
    const nextReg = op.op === 'create'
      ? [...reg, { id: s.id, name: s.id, phase: 'unrouted', group: s.group, defaultOn: false, description: oneLine(s.description), runtimePrompt: '', category: s.category, hosts: ['claude', 'codex', 'studio'], status: 'active', enabled: false }]
      : reg.map((r) => (r.id === s.id ? { ...r, group: s.group, description: oneLine(s.description) } : r));
    const changes: Change[] = [{ rel: 'library/registry/skills.registry.json', next: stringify(nextReg) }];
    const mdRel = `library/skills/${s.category}/${s.id}/SKILL.md`;
    if (op.op === 'create') changes.push({ rel: mdRel, next: renderSkillMd(s) });
    else {
      const md = lib.read(mdRel);
      if (md) {
        const { fm, body } = frontmatterOf(md);
        changes.push({ rel: mdRel, next: `---\n${setField(fm, 'description', oneLine(s.description))}\n---\n${body}` });
      }
    }
    return changes;
  }

  // delete
  const { id, confirm } = op.payload;
  if (confirm !== id) throw new ForgeRefusal([`type ${id} to confirm the delete`]);
  if (op.kind === 'agent') {
    if (!agents.includes(id)) throw new ForgeRefusal([`agent ${id} does not exist`]);
    const member = crew.crew.find((m) => m.role.agent === id);
    const usedIn = lib.workflows().ships.filter((w) => w.stages.some((st) => member && st.crew?.includes(member.id))).map((w) => w.id);
    if (usedIn.length) throw new ForgeRefusal([`agent ${id} crews workflow(s) ${usedIn.join(', ')}; take them off those stages first`]);
    const related = crew.crew.filter((m) => member && m.related?.includes(member.id)).map((m) => m.id);
    if (related.length) throw new ForgeRefusal([`crew ${related.join(', ')} list ${member!.id} as related`]);
    const nextCrew = { ...crew, crew: crew.crew.filter((m) => m.role.agent !== id) };
    return [
      { rel: `library/agents/${id}.md`, next: null },
      { rel: 'library/registry/crew.json', next: stringify(nextCrew) },
    ];
  }
  const rec = reg.find((r) => r.id === id);
  if (!rec) throw new ForgeRefusal([`skill ${id} does not exist`]);
  const routedBy = agents.filter((a) => (lib.read(`library/agents/${a}.md`) ?? '').match(new RegExp(`^routes:.*\\b${id}\\b`, 'm')));
  const inWorkflows = lib.workflows().ships.filter((w) => w.skills?.includes(id)).map((w) => w.id);
  const refs = [...routedBy.map((a) => `agent ${a}`), ...inWorkflows.map((w) => `workflow ${w}`)];
  if (refs.length) throw new ForgeRefusal([`skill ${id} is still referenced by ${refs.join(', ')}`]);
  return [
    { rel: 'library/registry/skills.registry.json', next: stringify(reg.filter((r) => r.id !== id)) },
    { rel: `library/skills/${rec.category}/${id}/SKILL.md`, next: null },
  ];
}

/** A unified diff of the planned changes, from `git diff --no-index` on temp copies (no new dependency). */
export async function diffOf(lib: Library, changes: Change[]): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'shipyard-forge-'));
  try {
    let out = '';
    for (const [i, c] of changes.entries()) {
      const a = join(dir, `${i}-a`);
      const b = join(dir, `${i}-b`);
      writeFileSync(a, lib.read(c.rel) ?? '', 'utf8');
      writeFileSync(b, c.next ?? '', 'utf8');
      const r = await run('git', ['diff', '--no-index', '--no-color', '-U3', a, b], dir, 30_000);
      // drop git's header (and any warning it printed) up to the first hunk; name the real file instead
      const lines = r.out.replace(/\r\n/g, '\n').split('\n');
      const first = lines.findIndex((l) => l.startsWith('@@'));
      const body = first < 0 ? '' : lines.slice(first).join('\n');
      const head = lib.read(c.rel) === null ? 'new file' : c.next === null ? 'deleted' : 'modified';
      out += `--- ${c.rel} (${head})\n+++ ${c.rel}\n${body}\n`;
    }
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Paths with uncommitted edits: the Forge refuses to write over someone's work in progress. */
export async function dirty(repo: string, rels: string[]): Promise<string[]> {
  const r = await run('git', ['status', '--porcelain', '--', ...rels], repo, 30_000);
  return r.out
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => l.slice(3).trim());
}

interface Pending {
  op: ForgeOp;
  changes: Change[];
  hashes: Record<string, string>;
  at: number;
}

export interface ApplyResult {
  ok: boolean;
  rolledBack: boolean;
  stat: string;
  project: string;
  verify: string | null;
}

/** Write, regenerate, verify; on failure restore the exact bytes and regenerate again. */
export async function applyChanges(lib: Library, changes: Change[]): Promise<ApplyResult> {
  const before = new Map(changes.map((c) => [c.rel, lib.read(c.rel)]));
  const write = (rel: string, text: string | null) => {
    const p = lib.abs(rel);
    if (text === null) {
      rmSync(p, { force: true });
      // a deleted SKILL.md leaves an empty folder: remove it, or verify.py reports a folder with no SKILL.md
      const folder = dirname(p);
      if (/[\\/]library[\\/]skills[\\/]/.test(folder) && existsSync(folder) && readdirSync(folder).length === 0) rmSync(folder, { recursive: true, force: true });
      return;
    }
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text, 'utf8');
  };
  for (const c of changes) write(c.rel, c.next);
  const r = await rebuild(lib.repo);
  if (r.ok) {
    const stat = await run('git', ['diff', '--stat', '--', 'library'], lib.repo, 30_000);
    const created = changes.filter((c) => before.get(c.rel) === null).map((c) => `new: ${c.rel}`);
    return { ok: true, rolledBack: false, stat: [stat.out.trim(), ...created].filter(Boolean).join('\n'), project: r.project.out, verify: r.verify?.out ?? null };
  }
  for (const [rel, text] of before) write(rel, text);
  await rebuild(lib.repo);
  return { ok: false, rolledBack: true, stat: '', project: r.project.out, verify: r.verify?.out ?? null };
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw new ForgeRefusal(['request too large']);
    chunks.push(c as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ForgeRefusal(['not valid JSON']);
  }
}

export function shipyardForge(shipyardRoot: string): Plugin {
  const { repo } = pathsFrom(shipyardRoot);
  const lib = new Library(repo);
  const pending = new Map<string, Pending>();
  /** hash of what the Forge itself last wrote per file: an uncommitted file it wrote is its own, not someone's work in progress */
  const ours = new Map<string, string>();
  const othersEdits = async (rels: string[]) => (await dirty(repo, rels)).filter((f) => ours.get(f) !== sha(lib.read(f)));

  return {
    name: 'shipyard-forge',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shipyard/forge/catalog', (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'GET only' });
        return json(res, 200, { ok: true, categories: lib.categories() });
      });
      server.middlewares.use('/__shipyard/forge/preview', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        try {
          const parsed = forgeOp.safeParse(await readJsonBody(req));
          if (!parsed.success) return json(res, 400, { ok: false, problems: parsed.error.issues.map((i) => `${i.path.join('.') || 'request'}: ${i.message}`) });
          const changes = plan(lib, parsed.data);
          const bad = changes.filter((c) => !allowed(c.rel)).map((c) => c.rel);
          if (bad.length) return json(res, 400, { ok: false, problems: bad.map((b) => `${b} is outside the Forge allow-list`) });
          const token = randomUUID();
          const now = Date.now();
          for (const [t, p] of pending) if (now - p.at > TOKEN_TTL_MS) pending.delete(t);
          pending.set(token, { op: parsed.data, changes, hashes: Object.fromEntries(changes.map((c) => [c.rel, sha(lib.read(c.rel))])), at: now });
          const busyFiles = await othersEdits(changes.map((c) => c.rel));
          return json(res, 200, { ok: true, token, files: changes.map((c) => ({ path: c.rel, action: lib.read(c.rel) === null ? 'create' : c.next === null ? 'delete' : 'modify' })), diff: await diffOf(lib, changes), dirty: busyFiles });
        } catch (e) {
          if (e instanceof ForgeRefusal) return json(res, 400, { ok: false, problems: e.problems });
          return json(res, 500, { ok: false, problems: [String(e)] });
        }
      });
      server.middlewares.use('/__shipyard/forge/apply', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'cross-origin request refused' });
        let token: string;
        try {
          token = String(((await readJsonBody(req)) as { token?: unknown })?.token ?? '');
        } catch (e) {
          return json(res, 400, { ok: false, problems: e instanceof ForgeRefusal ? e.problems : [String(e)] });
        }
        const p = pending.get(token);
        if (!p) return json(res, 400, { ok: false, problems: ['this preview has expired or was already applied; preview again'] });
        pending.delete(token);
        const changed = p.changes.filter((c) => sha(lib.read(c.rel)) !== p.hashes[c.rel]).map((c) => c.rel);
        if (changed.length) return json(res, 409, { ok: false, problems: changed.map((c) => `${c} changed since the preview; preview again`) });
        const busyFiles = await othersEdits(p.changes.map((c) => c.rel));
        if (busyFiles.length) return json(res, 409, { ok: false, problems: busyFiles.map((f) => `${f} has uncommitted edits; commit or discard them first`) });
        const r = await exclusive('forge apply', () => applyChanges(lib, p.changes));
        if (!r.ok) return json(res, 409, { ok: false, problems: [`busy: ${r.busy}`] });
        if (r.value.ok) for (const c of p.changes) ours.set(c.rel, sha(lib.read(c.rel)));
        return json(res, r.value.ok ? 200 : 422, { ...r.value, project: r.value.project.slice(-6000), verify: r.value.verify?.slice(-6000) ?? null });
      });
    },
  };
}

/** For tests: the repo-relative form of an absolute path. */
export const relTo = (repo: string, abs: string) => relative(repo, abs).split(sep).join('/');
