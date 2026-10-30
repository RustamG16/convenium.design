/**
 * File I/O for ships: import a `*.ship.json`, download text, and the dev-only save to
 * `shipyard/ships/<id>.ship.json`. The production build has no write path.
 */
import { describeIssues, shipSchema, type Ship } from '../domain/schema';

export type ParseShipResult = { ok: true; ship: Ship } | { ok: false; issues: string[] };

export function parseShipFile(text: string): ParseShipResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, issues: ['(root): not valid JSON'] };
  }
  const result = shipSchema.safeParse(raw);
  return result.success ? { ok: true, ship: result.data } : { ok: false, issues: describeIssues(result.error) };
}

export function serializeShip(ship: Ship): string {
  return `${JSON.stringify(ship, null, 2)}\n`;
}

export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type SaveResult = { ok: true; path: string } | { ok: false; reason: string };

/** Dev server only. In a production build the endpoint does not exist and this reports so. */
export async function saveToShips(ship: Ship): Promise<SaveResult> {
  if (!import.meta.env.DEV) return { ok: false, reason: 'Saving to shipyard/ships/ is available on the dev server only.' };
  try {
    const res = await fetch('/__shipyard/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ship),
    });
    const body = (await res.json()) as { ok?: boolean; path?: string; error?: string };
    return res.ok && body.ok && body.path ? { ok: true, path: body.path } : { ok: false, reason: body.error ?? `HTTP ${res.status}` };
  } catch {
    return { ok: false, reason: 'The dev server did not answer.' };
  }
}
