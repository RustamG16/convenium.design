/**
 * v2 Forge client: talks to the dev-server Forge (dev/forge.ts). The deployed build has no such
 * endpoints, and `FORGE_AVAILABLE` is false there, so the page only ever explains itself.
 */
export const FORGE_AVAILABLE = import.meta.env.DEV;

export const MODELS = ['opus', 'sonnet', 'haiku', 'inherit'] as const;
export const PHASES = ['always', 'diagnose', 'direct', 'prepare', 'build', 'verify'] as const;

export interface AgentPayload {
  id: string;
  description: string;
  model: (typeof MODELS)[number];
  access: 'read-only' | 'write';
  routes: string[];
  /** one of PHASES or the agent's own phase word (kept as written) */
  phase: string | null;
  priority: number | null;
  activateWhen: string;
  contract: string;
  crew: { id: string; name: string; title: string; pigment: string; glyph: string; species: string; essence: string };
}

export interface SkillPayload {
  id: string;
  category: string;
  group: string;
  description: string;
  body: string;
}

export type ForgeRequest =
  | { kind: 'agent'; op: 'create' | 'update'; payload: AgentPayload }
  | { kind: 'skill'; op: 'create' | 'update'; payload: SkillPayload }
  | { kind: 'agent' | 'skill'; op: 'delete'; payload: { id: string; confirm: string } };

export interface Preview {
  token: string;
  files: { path: string; action: 'create' | 'modify' | 'delete' }[];
  diff: string;
  /** targets with someone else's uncommitted edits: apply will refuse them */
  dirty: string[];
}

export interface ApplyOutcome {
  ok: boolean;
  rolledBack: boolean;
  stat: string;
  project: string;
  verify: string | null;
}

export class ForgeProblem extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(problems.join('; '));
    this.problems = problems;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new ForgeProblem(['the dev server did not answer; is `npm run dev` running?']);
  }
  const data = (await res.json().catch(() => null)) as (T & { ok?: boolean; problems?: string[]; error?: string }) | null;
  if (!data) throw new ForgeProblem([`the dev server answered HTTP ${res.status} with no body`]);
  if (res.status === 422) return data; // apply ran and was rolled back: the outcome carries the logs
  if (!res.ok || data.ok === false) throw new ForgeProblem(data.problems ?? [data.error ?? `HTTP ${res.status}`]);
  return data;
}

export const preview = (req: ForgeRequest) => post<Preview>('/__shipyard/forge/preview', req);
export const apply = (token: string) => post<ApplyOutcome>('/__shipyard/forge/apply', { token });

export async function categories(): Promise<string[]> {
  const res = await fetch('/__shipyard/forge/catalog', { cache: 'no-store' });
  if (!res.ok) throw new ForgeProblem([`HTTP ${res.status}`]);
  return ((await res.json()) as { categories: string[] }).categories;
}
