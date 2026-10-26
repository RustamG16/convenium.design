// Hash router. Pure parsing (testable in Node) plus a small browser binding.

export const RAIL = [
  { id: 'home', label: 'Home', href: '#/home' },
  { id: 'projects', label: 'Projects', href: '#/projects' },
  { id: 'plan', label: 'Plan', href: '#/plan' },
  { id: 'playground', label: 'Playground', href: '#/playground' },
  { id: 'results', label: 'Results', href: '#/results/0248' },
  { id: 'knowledge', label: 'Knowledge', href: '#/knowledge' },
  { id: 'system', label: 'System', href: '#/system/0248' },
  { id: 'agents', label: 'Agents', href: '#/agents' },
  { id: 'settings', label: 'Settings', href: '#/settings' },
];

const LEGACY = {
  '#work': '#/work/0248', '#systems': '#/plan/configure', '#architecture': '#/system/0248', '#runs': '#/results/0248',
  '#oracle': '#/projects/northstar/intake', '#playground': '#/playground', '#agents': '#/agents', '#knowledge': '#/knowledge',
  '#/new': '#/home', '#/intake': '#/projects/northstar/intake', '#/brief': '#/projects/northstar/brief', '#/system': '#/system/0248',
  '#/results': '#/results/0248', '#/work': '#/work/0248', '#/configure': '#/plan/configure', '#/results/history': '#/results/0248',
};

const PROJECT_NAMES = { northstar: 'Northstar', atlas: 'Atlas', pebble: 'Pebble' };
const pname = id => PROJECT_NAMES[id] || id;

export function resolve(rawHash = '') {
  let hash = rawHash || '#/home';
  if (hash === '#' || hash === '#/') hash = '#/home';
  const [pathPart, queryPart = ''] = hash.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  if (LEGACY[pathPart]) return { redirect: LEGACY[pathPart] + (queryPart ? `?${queryPart}` : '') };
  if (pathPart.startsWith('#/chats/')) return { redirect: '#/home' };
  const parts = pathPart.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [root, a, b] = parts;
  const route = (view, rail, crumbs, params = {}) => ({ view, rail, crumbs, params: { ...params, query }, path: pathPart });
  const project = 'Northstar';
  switch (root) {
    case 'home': return route('home', 'home', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Home']]);
    case 'journey': return route('journey', 'home', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Experience']]);
    case 'tutorials': return route('tutorials', 'home', [['Convenium.Design', '#/home'], ['Tutorials']]);
    case 'projects': {
      if (!a) return route('projects', 'projects', [['Projects']]);
      if (b === 'intake') return route('intake', 'projects', [['Projects', '#/projects'], [pname(a), `#/projects/${a}`], ['Intake']], { project: a });
      const tab = ['overview', 'brief', 'research', 'files', 'activity'].includes(b) ? b : 'overview';
      return route('project', 'projects', [['Projects', '#/projects'], [pname(a), `#/projects/${a}`], [tab === 'overview' ? 'Overview' : tab[0].toUpperCase() + tab.slice(1)]], { project: a, tab });
    }
    case 'plan': {
      if (a === 'configure' || a === 'agents') return route('configure', 'plan', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Plan', '#/plan'], ['Configure']], { tab: 'agents' });
      const tab = ['resources', 'risks', 'settings'].includes(a) ? a : 'plan';
      return route('plan', 'plan', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Plan']], { tab });
    }
    case 'playground': return route('playground', 'playground', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Playground']]);
    case 'work': return route('work', 'projects', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Work'], [`Run ${a || '0248'}`]], { run: a || '0248' });
    case 'results': return route('results', 'results', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Results'], [`Run ${a || '0248'}`]], { run: a || '0248' });
    case 'knowledge': return route('knowledge', 'knowledge', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['Knowledge', '#/knowledge'], [a === 'list' ? 'List' : 'Connections']], { mode: a === 'list' ? 'list' : 'graph' });
    case 'system': return route('system', 'system', [['Projects', '#/projects'], [project, '#/projects/northstar'], ['System'], [`Run ${a || '0248'}`]], { run: a || '0248', tab: query.tab || 'pipeline' });
    case 'agents': return route('agents', 'agents', a ? [['Agents', '#/agents'], [a]] : [['Agents']], { agent: a || null });
    case 'settings': return route('settings', 'settings', [['Settings']]);
    default: return { view: 'unavailable', rail: null, crumbs: [['Unavailable']], params: { query }, path: pathPart };
  }
}

export function createRouter(onRoute) {
  const handle = () => {
    const r = resolve(location.hash);
    if (r.redirect) { history.replaceState(null, '', r.redirect); return handle(); }
    onRoute(r);
  };
  window.addEventListener('hashchange', handle);
  return { start: handle, go: hash => { if (location.hash === hash) handle(); else location.hash = hash; } };
}
