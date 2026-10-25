// Knowledge-base structure audit (read-only). Cross-checks every layer Convenium.Design reads:
//   library/registry (skills, slots, presets, tools, plugins), library/skills SKILL.md bodies,
//   library/agents frontmatter, library/doctrines, the generated studio knowledge tree,
//   convenium-design-studio/knowledge/index.json + agents.json, and data/workflows/savra-v2.json.
// Usage: node scripts/audit-knowledge.mjs [--json]   (exit 1 on any ERROR)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = resolve(STUDIO, '..');
const LIB = join(ROOT, 'library');
const findings = [];
const add = (level, area, msg) => findings.push({ level, area, msg });
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const frontmatter = text => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  let block = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      const v = kv[2].trim();
      if (/^[>|][-+]?$/.test(v)) { block = kv[1]; out[block] = ''; }
      else { block = null; out[kv[1]] = v.replace(/^["']|["']$/g, ''); }
    } else if (block && /^\s+\S/.test(line)) out[block] = `${out[block]} ${line.trim()}`.trim();
  }
  return out;
};
const listInline = v => (v || '').replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);

// 1. Registry ↔ SKILL.md bodies
const registry = json(join(LIB, 'registry', 'skills.registry.json'));
const ids = new Set(registry.map(s => s.id));
const PHASES = new Set(['always', 'diagnose', 'direct', 'prepare', 'build', 'verify', 'unrouted']);
if (ids.size !== registry.length) add('ERROR', 'registry', 'duplicate skill ids in skills.registry.json');
for (const s of registry) {
  for (const k of ['id', 'name', 'phase', 'group', 'description', 'category', 'hosts', 'status']) if (s[k] === undefined || s[k] === '') add('ERROR', 'registry', `${s.id}: missing field ${k}`);
  if (!PHASES.has(s.phase)) add('ERROR', 'registry', `${s.id}: unknown phase "${s.phase}"`);
  if ((s.phase !== 'unrouted') !== Boolean(s.enabled)) add('WARN', 'registry', `${s.id}: enabled=${s.enabled} disagrees with phase=${s.phase}`);
  const body = join(LIB, 'skills', s.category, s.id, 'SKILL.md');
  if (s.status === 'stub') { if (existsSync(body)) add('INFO', 'skills', `${s.id}: marked stub but has a body`); continue; }
  if (!existsSync(body)) { add('ERROR', 'skills', `${s.id}: no body at library/skills/${s.category}/${s.id}/SKILL.md`); continue; }
  const fm = frontmatter(readFileSync(body, 'utf8'));
  if (!fm) add('ERROR', 'skills', `${s.id}: SKILL.md has no frontmatter`);
  else {
    if (fm.name !== s.id) add('ERROR', 'skills', `${s.id}: frontmatter name "${fm.name}" ≠ registry id`);
    if (!fm.description || fm.description.length < 40) add(s.phase === 'unrouted' ? 'INFO' : 'WARN', 'skills', `${s.id}: frontmatter description is short (${(fm.description || '').length} chars) — weak routing signal`);
  }
  if (!s.runtimePrompt || s.runtimePrompt.length < 60) add(s.phase === 'unrouted' ? 'INFO' : 'ERROR', 'registry', `${s.id}: runtimePrompt ${s.runtimePrompt ? 'is short' : 'is empty'}${s.phase === 'unrouted' ? ' (dormant skill; only matters if it is ever routed)' : ' — the studio injects this into live runs'}`);
}
// Orphan skill folders
for (const cat of readdirSync(join(LIB, 'skills'))) {
  const dir = join(LIB, 'skills', cat);
  if (!statSync(dir).isDirectory()) continue;
  for (const id of readdirSync(dir)) if (statSync(join(dir, id)).isDirectory() && !ids.has(id)) add('ERROR', 'skills', `orphan folder library/skills/${cat}/${id} (not in registry)`);
}

// 2. Slots, presets
const slotFile = json(join(LIB, 'registry', 'slots.json'));
const AGENTS = new Set(readdirSync(join(LIB, 'agents')).filter(f => f.endsWith('.md') && !/^readme\.md$/i.test(f)).map(f => f.replace(/\.md$/, '')));
for (const slot of slotFile.slots) {
  const cands = slot.candidates.map(c => c.skill);
  if (!cands.includes(slot.default)) add('ERROR', 'slots', `${slot.id}: default ${slot.default} is not a candidate`);
  for (const c of slot.candidates) {
    if (!ids.has(c.skill)) add('WARN', 'slots', `${slot.id}: candidate ${c.skill} is not in the registry (external/plugin skill)`);
    if (!c.changes) add('WARN', 'slots', `${slot.id}: candidate ${c.skill} has no "changes" explanation`);
  }
  if (slot.runtimeOwner && !AGENTS.has(slot.runtimeOwner)) add('ERROR', 'slots', `${slot.id}: runtimeOwner ${slot.runtimeOwner} is not an agent`);
}
for (const p of json(join(LIB, 'registry', 'presets.json'))) for (const sk of p.skills) if (!ids.has(sk)) add('ERROR', 'presets', `${p.id}: skill ${sk} not in registry`);

// 3. Agents frontmatter → skills
const external = existsSync(join(LIB, 'registry', 'external-skills.json')) ? json(join(LIB, 'registry', 'external-skills.json')) : {};
const externalIds = new Set([...(external.plugin || []), ...(external.builtin || [])].map(x => typeof x === 'string' ? x : x.id));
const agentSkills = {};
for (const a of AGENTS) {
  const fm = frontmatter(readFileSync(join(LIB, 'agents', `${a}.md`), 'utf8'));
  if (!fm) { add('ERROR', 'agents', `${a}: no frontmatter`); continue; }
  if (fm.name !== a) add('ERROR', 'agents', `${a}: frontmatter name ${fm.name}`);
  agentSkills[a] = listInline(fm.skills);
  for (const sk of agentSkills[a]) if (!ids.has(sk) && !externalIds.has(sk)) add('ERROR', 'agents', `${a}: skill ${sk} is neither registered nor a known external skill`);
}

// 4. Studio workflow (the runtime's view) vs library agents
const wf = json(join(STUDIO, 'data', 'workflows', 'savra-v2.json'));
const roleIds = new Set(wf.roles.map(r => r.id));
for (const r of wf.roles) {
  if (!AGENTS.has(r.id)) add('ERROR', 'workflow', `role ${r.id} has no library agent`);
  for (const sk of r.skills) if (!ids.has(sk)) add('ERROR', 'workflow', `role ${r.id}: skill ${sk} not in registry`);
  const lib = new Set(agentSkills[r.id] || []);
  const missing = r.skills.filter(s => !lib.has(s));
  if (missing.length) add('WARN', 'workflow', `role ${r.id} uses ${missing.join(', ')} which its library agent file does not list`);
}
const artifactIds = new Set(wf.artifacts.map(a => a.id));
for (const p of wf.phases) {
  if (!roleIds.has(p.owner)) add('ERROR', 'workflow', `phase ${p.id}: owner ${p.owner} is not a role`);
  for (const io of [...p.inputs, ...p.outputs]) if (!artifactIds.has(io)) add('ERROR', 'workflow', `phase ${p.id}: artifact ${io} undefined`);
}
for (const [slot, owner] of Object.entries(wf.configurationSlots)) {
  if (!roleIds.has(owner)) add('ERROR', 'workflow', `configurationSlots.${slot} → ${owner} is not a role`);
  const libSlot = slotFile.slots.find(s => s.id === slot);
  if (!libSlot) add('ERROR', 'workflow', `configurationSlots.${slot} missing from slots.json`);
  else if (libSlot.runtimeOwner && libSlot.runtimeOwner !== owner) add('WARN', 'workflow', `slot ${slot}: workflow owner ${owner} ≠ slots.json runtimeOwner ${libSlot.runtimeOwner}`);
}
const produced = new Set(wf.phases.flatMap(p => p.outputs));
for (const a of wf.artifacts) if (!produced.has(a.id)) add('WARN', 'workflow', `artifact ${a.id} (${a.path}) is declared but no phase produces it`);

// 5. Doctrines
for (const d of readdirSync(join(LIB, 'doctrines'))) {
  const dir = join(LIB, 'doctrines', d);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of ['design.md', 'profile.json']) if (!existsSync(join(dir, f))) add('ERROR', 'doctrines', `${d}: missing ${f}`);
  try { const p = json(join(dir, 'profile.json')); if (!p.doctrine && !p.id) add('WARN', 'doctrines', `${d}: profile.json has no doctrine id`); } catch (e) { add('ERROR', 'doctrines', `${d}: profile.json invalid (${e.message})`); }
  const design = existsSync(join(dir, 'design.md')) ? readFileSync(join(dir, 'design.md'), 'utf8') : '';
  if (!/display-max/i.test(design)) add('WARN', 'doctrines', `${d}: design.md has no --display-max (run.json checks against it)`);
}

// 6. Studio knowledge tree + index + agent overrides
const kdir = join(STUDIO, 'knowledge');
const index = json(join(kdir, 'index.json'));
for (const [skill, sources] of Object.entries(index.sources || {})) {
  if (!ids.has(skill) && !(index.customSkills || []).some(c => c.id === skill)) add('ERROR', 'knowledge', `index.sources has unknown skill ${skill}`);
  for (const s of sources) if (s.file && !existsSync(join(STUDIO, s.file))) add('ERROR', 'knowledge', `${skill}: source file missing ${s.file}`);
}
for (const id of Object.keys(index.overrides || {})) if (!ids.has(id)) add('WARN', 'knowledge', `override for unknown skill ${id}`);
const slug = v => String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let folders = 0;
for (const s of registry.filter(x => (x.hosts || []).includes('studio'))) {
  const f = join(kdir, 'skills', slug(s.group), s.id);
  if (existsSync(f)) folders += 1; else add('WARN', 'knowledge', `${s.id}: no studio knowledge folder at knowledge/skills/${slug(s.group)}/${s.id} (created on server start)`);
}
const overrides = json(join(kdir, 'agents.json'));
for (const [id, v] of Object.entries(overrides)) {
  if (!roleIds.has(id)) add('ERROR', 'knowledge', `agents.json overrides unknown agent ${id}`);
  if (v.budget !== undefined && (v.budget < 500 || v.budget > 50000)) add('ERROR', 'knowledge', `agents.json ${id}.budget ${v.budget} outside 500–50000`);
  if (v.budget !== undefined && v.budget % 500 !== 0) add('WARN', 'knowledge', `agents.json ${id}.budget ${v.budget} is not a multiple of 500 — likely a test artefact (the UI steps by 500)`);
}

// 7. Routing digest agrees with the registry
const digest = readFileSync(join(LIB, 'registry', 'ROUTING-DIGEST.md'), 'utf8');
for (const s of registry.filter(x => x.phase !== 'unrouted')) if (!digest.includes(s.id)) add('ERROR', 'routing', `${s.id} is routed (phase ${s.phase}) but absent from ROUTING-DIGEST.md`);
for (const s of registry.filter(x => x.phase === 'unrouted')) if (new RegExp(`\\b${s.id}\\b`).test(digest.split('UNROUTED')[0] || digest) && !digest.includes('unrouted')) add('WARN', 'routing', `${s.id} is unrouted but appears in the digest`);

const counts = findings.reduce((m, f) => ({ ...m, [f.level]: (m[f.level] || 0) + 1 }), {});
const summary = { skills: registry.length, routed: registry.filter(s => s.phase !== 'unrouted').length, agents: AGENTS.size, roles: roleIds.size, phases: wf.phases.length, slots: slotFile.slots.length, doctrines: readdirSync(join(LIB, 'doctrines')).length, studioFolders: folders, ...counts };
if (process.argv.includes('--json')) console.log(JSON.stringify({ summary, findings }, null, 2));
else {
  console.log('Knowledge-base audit', JSON.stringify(summary));
  for (const level of ['ERROR', 'WARN', 'INFO']) for (const f of findings.filter(x => x.level === level)) console.log(`${level.padEnd(5)} [${f.area}] ${f.msg}`);
  if (!findings.length) console.log('No findings.');
}
process.exit(counts.ERROR ? 1 : 0);
