import { describeIssues } from '../domain/schema';
import { withBase } from '../lib/baseUrl';
import { kbSchema, type KnowledgeBase } from './schema';

export class KbError extends Error {
  readonly issues: string[];
  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'KbError';
    this.issues = issues;
  }
}

/** Validate an already-parsed knowledge base. Throws KbError with one line per problem. */
export function parseKb(raw: unknown): KnowledgeBase {
  const result = kbSchema.safeParse(raw);
  if (!result.success) {
    throw new KbError('The knowledge base is malformed. Rebuild it with `python library/tools/project.py shipyard`.', describeIssues(result.error));
  }
  return result.data;
}

/** Fetch the generated knowledge base from the app's own files and validate it. */
export async function loadKb(signal?: AbortSignal): Promise<KnowledgeBase> {
  let res: Response;
  try {
    res = await fetch(withBase('data/knowledge-base.json'), { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new KbError('The knowledge base could not be loaded (network).');
  }
  if (!res.ok) throw new KbError(`The knowledge base could not be loaded (HTTP ${res.status}).`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new KbError('The knowledge base is not valid JSON.');
  }
  return parseKb(json);
}
