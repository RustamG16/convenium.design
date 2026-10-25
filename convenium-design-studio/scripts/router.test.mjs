import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, resolveRoute, routeHref } from '../public/legacy/modules/router.js';
import { selectShellState } from '../public/legacy/modules/store.js';

test('global routes have the contracted order and one owner', () => {
  assert.deepEqual(ROUTES.map(route => route.label), ['Chat', 'Constructor', 'Files & Results', 'Knowledge', 'Agents', 'Settings']);
  for (const route of ROUTES) assert.equal(resolveRoute(`#/${route.id}`).owner, route.id);
});
test('project deep links retain chat and run identities separately and nested ownership', () => {
  const configured = resolveRoute('#/projects/north%20star/plan/configure');
  assert.equal(configured.projectId, 'north star');
  assert.equal(configured.owner, 'constructor');
  assert.equal(configured.root, 'constructor');
  assert.deepEqual(configured.trail, ['Projects', 'north star', 'Constructor']);
  const work = resolveRoute('#/projects/p1/chats/chat-24');
  assert.equal(work.owner, 'chat');
  assert.equal(work.chatId, 'chat-24');
  assert.equal(resolveRoute('#/projects/p1/results/run-24').artifactId, 'run-24');
  assert.equal(work.root, 'chat');
});
test('all historical routes redirect without dropping their working surface', () => {
  for (const [alias, root, owner] of [['work', 'chat', 'chat']]) {
    const route = resolveRoute(`#${alias}`, { projectId: 'p1' });
    assert.equal(route.root, root);
    assert.equal(route.owner, owner);
    assert.notEqual(route.path, alias);
    assert.equal(resolveRoute('#/' + route.path).root, root);
  }
});
test('invalid paths, malformed encoding and unsupported nested views recover explicitly', () => {
  for (const hash of ['#/nonsense', '#/projects/%E0%A4%A/work', '#/projects/p1/invented', '#/home/extra']) {
    assert.equal(resolveRoute(hash).unavailable, true);
  }
  assert.equal(resolveRoute('').owner, 'chat');
  assert.equal(routeHref('constructor', null, 'a/b'), '#/projects/a%2Fb/constructor');
});
test('projection never fabricates a stage, project, or verified live capability', () => {
  const route = resolveRoute('#/new');
  assert.equal(selectShellState({}, route).status, 'loading');
  const ready = { status: 'ready', projects: [{ id: 'p1', name: 'Northstar' }], activeProjectId: 'p1', config: { mode: 'live-unverified' } };
  assert.equal(selectShellState(ready, route).environment, 'unverified');
  assert.equal(selectShellState(ready, route).stage, 'Unknown');
  assert.equal(selectShellState({ ...ready, config: { hasApiKey: true } }, route).environment, 'unknown');
  assert.equal(selectShellState({ ...ready, projects: [] }, route).status, 'empty');
  assert.equal(selectShellState(ready, resolveRoute('#/projects/missing/work')).status, 'unavailable');
  assert.equal(selectShellState({ ...ready, online: false }, route).status, 'offline');
  assert.equal(selectShellState({ ...ready, status: 'unavailable' }, route).status, 'unavailable');
});
