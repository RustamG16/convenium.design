// Design DNA — the taste profile that persists across projects.
//
// The library has shipped a complete taste-profile system since 2026-08-28: a JSON schema,
// four doctrines with a profile.json each, and two interview skills. `library/design-dna/`
// held one `.gitkeep`, and nothing in the product could create, show or attach a profile.
// This module is the missing half.
//
// The schema's own load-bearing clause is that `avoidList` unions and is never overridden by
// a doctrine default. It is therefore the most consequential field and, until now, the least
// visible one; the interface treats it as first-class alongside preferences.
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { profileDir } from './paths.mjs';

const doctrineRoot = fileURLToPath(new URL('../library/doctrines/', import.meta.url));
const profileRoot = profileDir;
const schemaPath = fileURLToPath(new URL('../library/schemas/taste-profile.schema.json', import.meta.url));

const now = () => new Date().toISOString();
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);

// The doctrine's own one-paragraph statement of what it is, read from design.md rather than
// restated here — one source of truth per fact.
function summarise(markdown) {
  const body = markdown.split('\n').slice(1).join('\n').trim();
  const paragraph = body.split(/\n\s*\n/)[0] || '';
  return paragraph.replace(/\s+/g, ' ').trim().slice(0, 400);
}

export async function listDoctrines() {
  let entries = [];
  try { entries = await readdir(doctrineRoot, { withFileTypes: true }); } catch { return []; }
  const doctrines = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const profile = JSON.parse(await readFile(join(doctrineRoot, entry.name, 'profile.json'), 'utf8'));
      let summary = '';
      try { summary = summarise(await readFile(join(doctrineRoot, entry.name, 'design.md'), 'utf8')); } catch {}
      doctrines.push({
        id: entry.name,
        name: profile.displayName || entry.name,
        summary,
        explicitPreferences: profile.explicitPreferences || {},
        avoidList: profile.avoidList || []
      });
    } catch { /* a doctrine without a readable profile is not offered */ }
  }
  return doctrines.sort((a, b) => a.id.localeCompare(b.id));
}

export async function listProfiles() {
  let entries = [];
  try { entries = await readdir(profileRoot, { withFileTypes: true }); } catch { return []; }
  const profiles = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try { profiles.push(JSON.parse(await readFile(join(profileRoot, entry.name), 'utf8'))); }
    catch { /* skip an unreadable profile rather than failing the whole list */ }
  }
  return profiles.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function getDesignDna() {
  let schemaVersion = 1;
  try { schemaVersion = JSON.parse(await readFile(schemaPath, 'utf8')).properties?.schemaVersion?.const ?? 1; } catch {}
  return {
    doctrines: await listDoctrines(),
    profiles: await listProfiles(),
    schemaVersion,
    // The two interview skills are agent-host skills, not server features. Saying so, and
    // saying what each costs, is more honest than a button that cannot do anything.
    interviews: [
      {
        id: 'convenium-design-style-picker',
        name: 'Style picker',
        cost: 'fast',
        description: 'Pre-fills from a doctrine, then asks only what the doctrine leaves open.'
      },
      {
        id: 'convenium-design-taste-interview',
        name: 'Taste interview',
        cost: 'deep',
        description: 'Builds a bespoke profile with no doctrine anchor. The slowest and the most specific.'
      }
    ]
  };
}

// Attaching a doctrine writes a real, schema-valid profile rather than storing a pointer:
// the profile is the thing that persists across projects, and a doctrine may change.
export async function createProfileFromDoctrine(doctrineId, displayName) {
  const doctrine = (await listDoctrines()).find(item => item.id === doctrineId);
  if (!doctrine) throw new Error('Doctrine not found.');
  const name = String(displayName || `${doctrine.name} profile`).trim().slice(0, 100);
  const stamp = now();
  const profile = {
    schemaVersion: 1,
    profileId: `${slug(name) || 'profile'}-${Math.random().toString(36).slice(2, 8)}`,
    displayName: name,
    createdAt: stamp,
    updatedAt: stamp,
    source: 'style-pick',
    doctrine: doctrineId,
    explicitPreferences: structuredClone(doctrine.explicitPreferences),
    avoidList: [...doctrine.avoidList],
    references: [],
    confidence: { overall: 0.8, byField: Object.fromEntries(Object.keys(doctrine.explicitPreferences).map(key => [key, 0.8])) },
    provenance: [{ field: 'all', source: `doctrine-default:${doctrineId}`, at: stamp }]
  };
  await mkdir(profileRoot, { recursive: true });
  await writeFile(join(profileRoot, `${profile.profileId}.json`), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  return profile;
}

export async function updateProfile(profileId, input = {}) {
  const profiles = await listProfiles();
  const current = profiles.find(item => item.profileId === profileId);
  if (!current) throw new Error('Profile not found.');
  const next = {
    ...current,
    displayName: String(input.displayName ?? current.displayName).trim().slice(0, 100) || current.displayName,
    // avoidList unions and is never overridden. The schema says so; this enforces it.
    avoidList: [...new Set([...(current.avoidList || []), ...(Array.isArray(input.addToAvoidList) ? input.addToAvoidList : [])]
      .map(entry => String(entry).trim().slice(0, 160)).filter(Boolean))].slice(0, 60),
    updatedAt: now()
  };
  await writeFile(join(profileRoot, `${next.profileId}.json`), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export async function deleteProfile(profileId) {
  const profiles = await listProfiles();
  const removed = profiles.find(item => item.profileId === profileId);
  if (!removed) throw new Error('Profile not found.');
  await unlink(join(profileRoot, `${profileId}.json`));
  return { removed };
}

export async function restoreProfile(profile) {
  if (!profile?.profileId) throw new Error('Nothing to restore.');
  await mkdir(profileRoot, { recursive: true });
  await writeFile(join(profileRoot, `${profile.profileId}.json`), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  return profile;
}
