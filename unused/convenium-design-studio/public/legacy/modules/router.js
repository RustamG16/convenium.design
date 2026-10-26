export const ROUTES = Object.freeze([
  ['chat', 'Chat', 'chat'], ['constructor', 'Constructor', 'constructor'], ['files', 'Files & Results', 'files'],
  ['knowledge', 'Knowledge', 'knowledge'], ['agents', 'Agents', 'agents'], ['settings', 'Settings', 'settings']
].map(([id, label, root]) => Object.freeze({ id, label, root })));
const unavailable = (path, projectId = null) => ({ path, owner: 'recovery', root: 'route-unavailable', projectId, chatId: null, artifactId: null, trail: ['Unavailable view'], unavailable: true });
export function routeHref(view, id, projectId) {
  if (view === 'new') return '#/new';
  if (view === 'chat') return projectId ? `#/projects/${encodeURIComponent(projectId)}/chats/${encodeURIComponent(id)}` : `#/chats/${encodeURIComponent(id)}`;
  return projectId ? `#/projects/${encodeURIComponent(projectId)}/${view}${id ? `/${encodeURIComponent(id)}` : ''}` : `#/${view}${id ? `/${encodeURIComponent(id)}` : ''}`;
}
export function resolveRoute(hash = '', context = {}) {
  let path = String(hash).replace(/^#\/?/, '').replace(/\/$/, '') || 'new';
  const legacyGlobal = { home: 'new', plan: 'constructor', configure: 'constructor', system: 'constructor', results: 'files', outputs: 'files', oracle: 'new' };
  if (Object.hasOwn(legacyGlobal, path)) path = context.projectId ? `projects/${context.projectId}/${legacyGlobal[path]}` : legacyGlobal[path];
  if (path === 'projects') path = context.projectId ? `projects/${context.projectId}` : 'new';
  const legacy = path.match(/^projects\/([^/]+)\/(plan|configure|system)(?:\/.*)?$/); if (legacy) path = `projects/${legacy[1]}/constructor`;
  const legacyFiles = path.match(/^projects\/([^/]+)\/(results|outputs)(?:\/([^/]+))?$/); if (legacyFiles) path = `projects/${legacyFiles[1]}/files${legacyFiles[3] ? `/${legacyFiles[3]}` : ''}`;
  if (path === 'work') path = context.projectId ? `projects/${context.projectId}/chats/${context.chatId || 'new'}` : 'new';
  let pieces; try { pieces = path.split('/').map(decodeURIComponent); } catch { return unavailable(path); }
  if (pieces[0] === 'new') return { path, owner: 'chat', root: 'chat', projectId: null, chatId: null, artifactId: null, trail: ['New chat'], unavailable: false };
  if (pieces[0] === 'chats' && pieces.length === 2) return { path, owner: 'chat', root: 'chat', projectId: null, chatId: pieces[1], artifactId: null, trail: ['Chats', pieces[1]], unavailable: false };
  if (pieces[0] !== 'projects' || !pieces[1]) return ROUTES.some(r => r.id === pieces[0]) && pieces.length === 1 ? { path, owner: pieces[0], root: pieces[0], projectId: null, chatId: null, artifactId: null, trail: [ROUTES.find(r => r.id === pieces[0]).label], unavailable: false } : unavailable(path);
  const projectId = pieces[1]; const view = pieces[2] || 'chat';
  if (view === 'chats' && pieces[3] && pieces.length === 4) return { path, owner: 'chat', root: 'chat', projectId, chatId: pieces[3], artifactId: null, trail: ['Projects', projectId, 'Chat'], unavailable: false };
  if (view === 'constructor' && pieces.length === 3) return { path, owner: 'constructor', root: 'constructor', projectId, chatId: null, artifactId: null, trail: ['Projects', projectId, 'Constructor'], unavailable: false };
  if (view === 'files' && pieces.length <= 4) return { path, owner: 'files', root: 'files', projectId, chatId: null, artifactId: pieces[3] || null, trail: ['Projects', projectId, 'Files & Results'], unavailable: false };
  if (view === 'chat' && pieces.length === 3) return { path, owner: 'chat', root: 'chat', projectId, chatId: null, artifactId: null, trail: ['Projects', projectId, 'Chat'], unavailable: false };
  return unavailable(path, projectId);
}
export function createRouter({ context, render }) {
  let current = null; const focusByRoute = new Map(); document.addEventListener('focusin', event => { if (current && event.target.closest('.view')) focusByRoute.set(current.path, event.target); });
  function navigate(target, { replace = false, focus = true, fromHistory = false } = {}) { const route = resolveRoute(target, context()); const changed = current?.path !== route.path; current = route; if (location.hash !== `#/${route.path}`) history[replace || fromHistory ? 'replaceState' : 'pushState'](null, '', `#/${route.path}`); document.querySelectorAll('.view').forEach(section => { const visible = section.id === route.root; section.classList.toggle('is-active', visible); section.hidden = !visible; section.inert = !visible; }); document.querySelectorAll('[data-global-route]').forEach(link => { const active = link.dataset.globalRoute === route.owner; link.classList.toggle('is-active', active); active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current'); }); document.title = `${route.trail.join(' / ')} · Convenium.Design Studio`; render(route); if (changed) document.querySelector('main')?.scrollTo(0, 0); if (focus) { const remembered = fromHistory && focusByRoute.get(route.path); const heading = document.querySelector('.view.is-active h1'); const destination = remembered?.isConnected ? remembered : heading; if (destination) { if (destination === heading) destination.tabIndex = -1; destination.focus({ preventScroll: true }); } } return route; }
  const restore = () => navigate(location.hash, { fromHistory: true }); window.addEventListener('hashchange', restore); window.addEventListener('popstate', restore); return { navigate, current: () => current, refresh: () => current && render(current) };
}
