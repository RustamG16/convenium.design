import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from '../public/legacy/modules/router.js';

test('resolves standalone and project chat-first routes', () => {
  assert.equal(resolveRoute('#/new').root, 'chat');
  assert.equal(resolveRoute('#/chats/chat-1').chatId, 'chat-1');
  assert.deepEqual(resolveRoute('#/projects/p-1/chats/chat-1'), {
    path: 'projects/p-1/chats/chat-1', owner: 'chat', root: 'chat', projectId: 'p-1', chatId: 'chat-1', artifactId: null,
    trail: ['Projects', 'p-1', 'Chat'], unavailable: false
  });
});

test('maps legacy destinations to the chat-first workspace', () => {
  assert.equal(resolveRoute('#/projects/p-1/plan/configure').root, 'constructor');
  assert.equal(resolveRoute('#/projects/p-1/results/run-7').root, 'files');
  assert.equal(resolveRoute('#/work', { projectId: 'p-1' }).root, 'chat');
});
