import { access, cp, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skills as builtinSkills } from './skills.mjs';
import { knowledgeDir, knowledgeSeedDir, isScratchData } from './paths.mjs';

const studioRoot = fileURLToPath(new URL('./', import.meta.url));
const knowledgeRoot = knowledgeDir;
const indexPath = join(knowledgeRoot, 'index.json');

const emptyIndex = () => ({ version: 1, customSkills: [], overrides: {}, sources: {} });
const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
const cleanText = (value, max = 4000) => String(value || '').trim().slice(0, max);
const safeCategory = value => cleanText(value, 50) || 'Custom';
const folderFor = (category, id) => join(knowledgeRoot, 'skills', slug(category) || 'custom', slug(id));
const insideKnowledge = path => {
  const rel = relative(resolve(knowledgeRoot), resolve(path));
  return rel && !rel.startsWith('..') && !rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`);
};

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function loadIndex() {
  try {
    return { ...emptyIndex(), ...JSON.parse(await readFile(indexPath, 'utf8')) };
  } catch {
    return emptyIndex();
  }
}

async function saveIndex(index) {
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
}

function skillReadme(skill) {
  return `# ${skill.name}\n\n- Category: ${skill.group}\n- Phase: ${skill.phase}\n- Skill ID: ${skill.id}\n\n${skill.description}\n\n## Runtime instructions\n\n${skill.runtimePrompt}\n`;
}

async function ensureSkillFolder(skill) {
  const folder = folderFor(skill.group, skill.id);
  if (!insideKnowledge(folder)) throw new Error('Unsafe knowledge folder path.');
  await mkdir(join(folder, 'sources'), { recursive: true });
  const readme = join(folder, 'README.md');
  if (!(await exists(readme))) await writeFile(readme, skillReadme(skill), 'utf8');
  return folder;
}

function mergeSkill(skill, index, builtin) {
  const override = index.overrides[skill.id] || {};
  const merged = { ...skill, ...override, builtin };
  merged.group = safeCategory(merged.group);
  merged.enabled = override.enabled ?? skill.enabled ?? true;
  merged.sources = index.sources[skill.id] || [];
  merged.sourceCount = merged.sources.length;
  merged.folder = relative(studioRoot, folderFor(merged.group, merged.id)).replaceAll('\\', '/');
  return merged;
}

export async function initializeKnowledge() {
  // Under the scratch override, seed from the repo's tree once so reads work and writes land
  // in the throwaway directory.
  if (isScratchData && !(await exists(knowledgeRoot))) {
    await cp(knowledgeSeedDir, knowledgeRoot, { recursive: true });
  }
  await mkdir(join(knowledgeRoot, 'skills'), { recursive: true });
  const index = await loadIndex();
  await Promise.all(builtinSkills.map(skill => ensureSkillFolder(mergeSkill(skill, index, true))));
  await Promise.all(index.customSkills.map(skill => ensureSkillFolder(mergeSkill(skill, index, false))));
  if (!(await exists(indexPath))) await saveIndex(index);
}

export async function listKnowledge() {
  const index = await loadIndex();
  const merged = [
    ...builtinSkills.map(skill => mergeSkill(skill, index, true)),
    ...index.customSkills.map(skill => mergeSkill(skill, index, false))
  ];
  const categories = [...new Set(merged.map(skill => skill.group))].sort((a, b) => a.localeCompare(b));
  return { root: knowledgeRoot.replaceAll('\\', '/'), categories, skills: merged };
}

export async function allSkills() {
  return (await listKnowledge()).skills;
}

export async function createSkill(input) {
  const index = await loadIndex();
  const name = cleanText(input.name, 80);
  const id = slug(input.id || name);
  if (name.length < 2 || id.length < 2) throw new Error('Skill name must contain at least two letters.');
  const known = [...builtinSkills, ...index.customSkills];
  if (known.some(skill => skill.id === id)) throw new Error(`Skill ID "${id}" already exists.`);
  const skill = {
    id,
    name,
    phase: ['always', 'diagnose', 'direct', 'prepare', 'build', 'verify'].includes(input.phase) ? input.phase : 'prepare',
    group: safeCategory(input.category),
    defaultOn: Boolean(input.defaultOn),
    enabled: true,
    description: cleanText(input.description, 500) || 'Custom Convenium.Design capability.',
    runtimePrompt: cleanText(input.runtimePrompt, 4000) || `Apply the ${name} capability only when the approved plan requires it.`
  };
  index.customSkills.push(skill);
  await saveIndex(index);
  await ensureSkillFolder(skill);
  return mergeSkill(skill, index, false);
}

export async function updateSkill(id, input) {
  const index = await loadIndex();
  const builtin = builtinSkills.find(skill => skill.id === id);
  const custom = index.customSkills.find(skill => skill.id === id);
  const current = custom || builtin;
  if (!current) throw new Error('Skill not found.');
  const before = mergeSkill(current, index, Boolean(builtin));
  const allowed = {};
  if ('name' in input) allowed.name = cleanText(input.name, 80) || before.name;
  if ('category' in input) allowed.group = safeCategory(input.category);
  if ('phase' in input && ['always', 'diagnose', 'direct', 'prepare', 'build', 'verify'].includes(input.phase)) allowed.phase = input.phase;
  if ('description' in input) allowed.description = cleanText(input.description, 500);
  if ('runtimePrompt' in input) allowed.runtimePrompt = cleanText(input.runtimePrompt, 4000);
  if ('enabled' in input) allowed.enabled = Boolean(input.enabled);
  if (custom) Object.assign(custom, allowed);
  else index.overrides[id] = { ...(index.overrides[id] || {}), ...allowed };
  const after = mergeSkill(custom || builtin, index, Boolean(builtin));
  const oldFolder = folderFor(before.group, id);
  const newFolder = folderFor(after.group, id);
  if (oldFolder !== newFolder && insideKnowledge(oldFolder) && insideKnowledge(newFolder) && await exists(oldFolder) && !(await exists(newFolder))) {
    await mkdir(dirname(newFolder), { recursive: true });
    await rename(oldFolder, newFolder);
  }
  await saveIndex(index);
  await ensureSkillFolder(after);
  await writeFile(join(newFolder, 'README.md'), skillReadme(after), 'utf8');
  return after;
}

export async function addSource(id, input) {
  const index = await loadIndex();
  const all = [...builtinSkills, ...index.customSkills];
  const base = all.find(skill => skill.id === id);
  if (!base) throw new Error('Skill not found.');
  const skill = mergeSkill(base, index, builtinSkills.some(item => item.id === id));
  const title = cleanText(input.title, 100);
  const content = cleanText(input.content, 20_000);
  if (title.length < 2 || content.length < 2) throw new Error('Source title and content are required.');
  const type = input.type === 'url' ? 'url' : 'note';
  const source = { id: crypto.randomUUID(), title, type, createdAt: new Date().toISOString() };
  const filename = `${Date.now()}-${slug(title) || 'source'}.md`;
  const folder = folderFor(skill.group, id);
  await mkdir(join(folder, 'sources'), { recursive: true });
  await writeFile(join(folder, 'sources', filename), `# ${title}\n\n- Type: ${type}\n- Added: ${source.createdAt}\n\n${content}\n`, 'utf8');
  source.file = relative(studioRoot, join(folder, 'sources', filename)).replaceAll('\\', '/');
  index.sources[id] = [...(index.sources[id] || []), source];
  await saveIndex(index);
  return source;
}

