/** The test briefs dry and live trials sail against (fixtures/briefs/*.json), validated once at load. */
import { briefSchema, type Brief } from './trial';

const files = import.meta.glob<{ default: unknown }>('../../fixtures/briefs/*.json', { eager: true });

export const BRIEFS: Brief[] = Object.entries(files)
  .map(([path, mod]) => {
    const r = briefSchema.safeParse(mod.default);
    if (!r.success) throw new Error(`${path}: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    return r.data;
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const briefById = (id: string): Brief | undefined => BRIEFS.find((b) => b.id === id);
