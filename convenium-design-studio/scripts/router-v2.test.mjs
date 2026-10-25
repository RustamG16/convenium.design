// Journey-v2 router: fixed rail order, deep links, rail ownership and legacy redirects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RAIL, resolve } from '../public/js/router.js';

test('the rail has the nine destinations in the canonical order', () => {
  assert.deepEqual(RAIL.map(r => r.label), ['Home', 'Projects', 'Plan', 'Playground', 'Results', 'Knowledge', 'System', 'Agents', 'Settings']);
});

test('every rail destination resolves to a view it owns', () => {
  for (const item of RAIL) {
    const route = resolve(item.href);
    assert.ok(route.view && route.view !== 'unavailable', item.href);
    assert.equal(route.rail, item.id, `${item.href} highlights ${item.id}`);
  }
});

test('an empty hash opens Home', () => {
  assert.equal(resolve('').view, 'home');
  assert.equal(resolve('#/').view, 'home');
});

test('project-scoped steps keep Projects highlighted, as in the mockups', () => {
  assert.equal(resolve('#/projects/northstar/intake').rail, 'projects');
  assert.equal(resolve('#/projects/northstar/brief').rail, 'projects');
  assert.equal(resolve('#/work/0248').rail, 'projects');
  assert.equal(resolve('#/projects/northstar/brief').params.tab, 'brief');
});

test('Configure belongs to Plan; the journey and tutorials belong to Home', () => {
  const cfg = resolve('#/plan/configure');
  assert.equal(cfg.view, 'configure'); assert.equal(cfg.rail, 'plan');
  assert.equal(resolve('#/journey').rail, 'home');
  assert.equal(resolve('#/tutorials').rail, 'home');
});

test('breadcrumbs read Projects / Northstar / view', () => {
  assert.deepEqual(resolve('#/plan').crumbs.map(c => c[0]), ['Projects', 'Northstar', 'Plan']);
  assert.deepEqual(resolve('#/results/0248').crumbs.map(c => c[0]), ['Projects', 'Northstar', 'Results', 'Run 0248']);
});

test('query parameters reach the view (System tabs)', () => {
  const r = resolve('#/system/0248?tab=architecture');
  assert.equal(r.view, 'system'); assert.equal(r.params.tab, 'architecture'); assert.equal(r.params.run, '0248');
});

test('legacy and chat-first links redirect instead of breaking', () => {
  assert.equal(resolve('#work').redirect, '#/work/0248');
  assert.equal(resolve('#systems').redirect, '#/plan/configure');
  assert.equal(resolve('#architecture').redirect, '#/system/0248');
  assert.equal(resolve('#/new').redirect, '#/home');
  assert.equal(resolve('#/chats/abc').redirect, '#/home');
});

test('unknown paths are reported as unavailable, not silently re-routed', () => {
  const r = resolve('#/nope/nothing');
  assert.equal(r.view, 'unavailable'); assert.equal(r.rail, null);
});
