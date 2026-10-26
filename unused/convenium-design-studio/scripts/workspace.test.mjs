import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from '../public/legacy/modules/router.js';
test('Work URLs identify chats separately from runs and reject malformed IDs', () => {
  const route = resolveRoute('#/projects/p/work/c'); assert.equal(route.chatId, 'c'); assert.equal(route.runId, null);
  assert.equal(resolveRoute('#/projects/p/work/%E0').unavailable, true);
});
test('workspace projection refuses cross-project conversation and handles empty or stale selection', async () => {
  const { selectWorkspaceState } = await import('../public/legacy/modules/workspace.js');
  const snapshot = { projects: [{id:'p',chats:[{id:'c',name:'One'}]}, {id:'q',chats:[{id:'d',name:'Two'}]}], activeProjectId:'p', activeChatId:'c', detail:{chat:{id:'c'},messages:[{id:'message'}],attachments:[]} };
  assert.equal(selectWorkspaceState(snapshot, resolveRoute('#/projects/q/work/d')).messages.length, 0);
  assert.equal(selectWorkspaceState(snapshot, resolveRoute('#/projects/q/work/c')).status, 'unavailable');
  assert.equal(selectWorkspaceState(snapshot, resolveRoute('#/projects/p/work/c')).messages.length, 1);
  assert.equal(selectWorkspaceState({projects:[]}, resolveRoute('#/work')).status, 'empty');
  assert.equal(selectWorkspaceState({projects:[{id:'p',chats:[]}]}, resolveRoute('#/projects/p/work')).chat, null);
});
