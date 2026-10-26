import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dataFile, dataDir } from './paths.mjs';

const workspacePath = dataFile('workspace.json');
const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${crypto.randomUUID()}`;

const seed = () => {
  const projectId = 'wko-launch';
  const chatId = 'wko-launch-planning';
  return {
    version: 1,
    projects: [{ id: projectId, name: 'WKO launch narrative', archived: false, createdAt: now(), updatedAt: now() }],
    chats: [{ id: chatId, projectId, name: 'Launch planning', createdAt: now(), updatedAt: now() }],
    messages: [{ id: 'welcome', chatId, role: 'assistant', text: 'What are you preparing for the WKO conversation? I can keep the brief, references, and system choices together here.', createdAt: now() }],
    attachments: [],
    proposals: []
  };
};

async function load() {
  try { return JSON.parse(await readFile(workspacePath, 'utf8')); }
  catch { const value = seed(); await save(value); return value; }
}
async function save(value) {
  await mkdir(dataDir, { recursive: true });
  const temporary = `${workspacePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, workspacePath);
}
function publicWorkspace(store) {
  return {
    projects: store.projects.filter(project => !project.archived).map(project => ({
      ...project,
      chats: store.chats.filter(chat => chat.projectId === project.id).map(chat => ({
        ...chat,
        messageCount: store.messages.filter(message => message.chatId === chat.id).length,
        attachmentCount: store.attachments.filter(attachment => attachment.chatId === chat.id).length
      }))
    })),
    proposals: store.proposals.filter(proposal => proposal.status === 'pending').map(({ operation, ...proposal }) => proposal)
  };
}
export async function initializeWorkspace() { await load(); }
export async function listWorkspace() { return publicWorkspace(await load()); }
export async function createProject(input = {}) {
  const store = await load(); const project = { id: id('project'), name: String(input.name || 'Untitled project').trim().slice(0, 100) || 'Untitled project', archived: false, createdAt: now(), updatedAt: now() };
  const chat = { id: id('chat'), projectId: project.id, name: 'New chat', createdAt: now(), updatedAt: now() };
  store.projects.unshift(project); store.chats.unshift(chat); store.messages.push({ id: id('message'), chatId: chat.id, role: 'assistant', text: 'This project is local. Describe the outcome you want, or attach explicitly authorized context.', createdAt: now() }); await save(store);
  return { project, chat };
}
export async function createChat(projectId, input = {}) {
  const store = await load(); if (!store.projects.some(project => project.id === projectId && !project.archived)) throw new Error('Project not found.');
  const count = store.chats.filter(chat => chat.projectId === projectId).length + 1;
  const chat = { id: id('chat'), projectId, name: String(input.name || `Chat ${count}`).trim().slice(0, 100) || `Chat ${count}`, createdAt: now(), updatedAt: now() };
  store.chats.unshift(chat); await save(store); return chat;
}
export async function chatDetail(chatId) {
  const store = await load(); const chat = store.chats.find(item => item.id === chatId); if (!chat) throw new Error('Chat not found.');
  return { chat, messages: store.messages.filter(message => message.chatId === chatId), attachments: store.attachments.filter(attachment => attachment.chatId === chatId) };
}
export async function addMessage(chatId, input) {
  const store = await load(); const chat = store.chats.find(item => item.id === chatId); if (!chat) throw new Error('Chat not found.');
  const text = String(input.text || '').trim(); if (!text || text.length > 12000) throw new Error('A message between 1 and 12,000 characters is required.');
  const message = { id: id('message'), chatId, role: input.role === 'assistant' ? 'assistant' : 'user', text, createdAt: now() };
  store.messages.push(message); chat.updatedAt = now(); await save(store); return message;
}
export async function addAttachment(chatId, input) {
  const store = await load(); if (!store.chats.some(chat => chat.id === chatId)) throw new Error('Chat not found.');
  const name = String(input.name || '').trim().slice(0, 240); if (!name) throw new Error('Attachment name is required.');
  const attachment = { id: id('attachment'), chatId, name, size: Math.max(0, Number(input.size) || 0), type: String(input.type || 'unknown').slice(0, 120), scope: 'explicit-browser-selection', status: 'linked', createdAt: now() };
  store.attachments.push(attachment); await save(store); return attachment;
}
export async function unlinkAttachment(chatId, attachmentId) {
  const store = await load(); const attachment = store.attachments.find(item => item.id === attachmentId && item.chatId === chatId); if (!attachment) throw new Error('Attachment not found.'); attachment.status = 'unlinked'; attachment.unlinkedAt = now(); await save(store); return attachment;
}
export async function createProposal(input = {}) {
  const store = await load(); const proposal = { id: id('proposal'), title: String(input.title || 'Proposed change').slice(0, 160), summary: String(input.summary || '').slice(0, 800), affected: Array.isArray(input.affected) ? input.affected.slice(0, 20) : [], operation: input.operation || null, status: 'pending', createdAt: now() }; store.proposals.unshift(proposal); await save(store); return { ...proposal, operation: undefined };
}
export async function resolveProposal(proposalId, approved) {
  const store = await load(); const proposal = store.proposals.find(item => item.id === proposalId); if (!proposal || proposal.status !== 'pending') throw new Error('Pending proposal not found.'); proposal.status = approved ? 'approved' : 'cancelled'; proposal.resolvedAt = now(); await save(store); return { ...proposal, operation: undefined };
}
