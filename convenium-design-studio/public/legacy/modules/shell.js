import { ROUTES, createRouter, routeHref } from './router.js';
import { selectShellState } from './store.js';

const $ = selector => document.querySelector(selector);
const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
function link(label, href, primary = false) { const node = text('a', label, primary ? 'primary-action' : 'quiet-action'); node.href = href; if (primary) node.dataset.primaryAction = ''; return node; }

/** The shell owns navigation and projection only. Feature mutations stay with legacy services. */
export function createShell({ snapshot, renderLegacy, selectProject, openOracle, createProject, updateOracleContext, renderJourney }) {
  let status = 'loading'; let error = null; let drawerOpen = false;
  const mobile = matchMedia('(max-width: 819px)');
  const read = () => ({ ...snapshot(), status, error, online: navigator.onLine });
  const router = createRouter({ context: () => ({ projectId: snapshot().activeProjectId }), render: route => {
    const model = selectShellState(read(), route);
    if (status === 'ready' && model.status !== 'unavailable') {
      if (route.projectId && (route.projectId !== snapshot().activeProjectId || (route.chatId && route.chatId !== snapshot().activeChatId))) selectProject(route.projectId, route.chatId).catch(fail);
      // The chat-first router owns canonical names while the retained renderer
      // remains a compatibility projection until each surface is migrated.
      renderLegacy({ chat: 'work', constructor: 'systems', files: 'runs' }[route.root] || route.root);
    }
    renderProjection(route);
  } });

  function renderProjection(route = router.current()) {
    if (!route) return;
    const data = read(); const model = selectShellState(data, route);
    document.body.dataset.shellState = model.status;
    const projectName = model.project?.name || (route.projectId ? 'Project unavailable' : 'No project');
    document.body.dataset.projectId=model.project?.id||'';
    for(const anchor of document.querySelectorAll('[data-global-route]')){const id=anchor.dataset.globalRoute;anchor.href=routeHref(id,['home','plan','playground','results','knowledge','system'].includes(id)?model.project?.id:null);}
    const displayTrail=route.chatId?['Work',model.project?.chats?.find(chat=>chat.id===route.chatId)?.name||'Conversation unavailable']:route.trail;
    const trail = $('#route-trail');
    trail.replaceChildren(link('Projects', '#/projects'), text('span', '/'));
    trail.append(model.project ? link(projectName, routeHref('overview', model.project.id)) : text('span', projectName), text('span', '/'), text('span', displayTrail.join(' / ')));
    $('#shell-stage').textContent = model.stage;
    $('#shell-next-action').textContent = model.nextAction;
    $('#shell-environment').textContent = model.environment;
    $('#shell-environment').dataset.environment = model.environment;
    $('#shell-oracle-status').textContent = `Oracle · ${model.oracle.toLowerCase()}`;
    $('#shell-oracle-context').textContent = `${projectName} / ${displayTrail.join(' / ')}`;
    $('#toggle-oracle').disabled = model.oracle !== 'Available';
    const messages = { loading: 'Loading local workspace…', offline: 'Offline. Showing the last loaded records; reconnect before continuing.', unavailable: model.error || 'This project or view is unavailable. Choose Projects to continue.', empty: 'No projects yet. Describe a goal or create your first project.', ready: '' };
    $('#shell-status').hidden = model.status === 'ready';
    $('#shell-status-message').textContent = messages[model.status];
    $('#shell-retry').hidden = !['unavailable', 'offline'].includes(model.status) || route.unavailable || (route.projectId && !model.project && status === 'ready');
    // Never expose stale project controls for a missing deep-link target.
    const root = document.getElementById(route.root);
    if (root) {
      root.inert = model.status === 'loading' || (model.status === 'unavailable' && route.root !== 'route-unavailable');
      root.setAttribute('aria-busy', String(model.status === 'loading'));
      if (status === 'ready' && route.projectId && !model.project) {
        root.hidden = true; root.classList.remove('is-active');
        const fallback = $('#route-unavailable'); fallback.hidden = false; fallback.inert = false; fallback.classList.add('is-active');
      }
    }
    const home = $('#home-summary');
    const card = text('div', '', 'empty-state'); card.dataset.emptyState = '';
    card.append(text('strong', model.project?.name || 'Start with a goal.'), text('p', model.project ? `Current stage: ${model.stage}. ${model.nextAction}.` : 'Oracle can help you describe the outcome and identify what is needed next.'));
    const goal = link('Describe a goal', routeHref('intake', model.project?.id), true); card.append(goal);
    if (model.project) card.append(link('Continue project work', routeHref('work', model.project.id)));
    home.replaceChildren(card);
    const projects = $('#shell-project-list');
    projects.replaceChildren(...model.projects.map(project => {
      const row = text('article', '', 'shell-project-row');
      row.append(text('strong', project.name), text('span', project.stage || 'Stage unknown'), link('Open project', routeHref('overview', project.id)));
      return row;
    }));
    const create = text('button', model.projects.length ? 'Create project' : 'Create your first project', 'primary-action');
    create.type = 'button'; create.id = 'shell-create-project'; create.dataset.primaryAction = ''; create.disabled = status !== 'ready'||!navigator.onLine;create.title=navigator.onLine?'Create a local project':'Reconnect before creating a project';
    create.addEventListener('click', () => { router.navigate(routeHref('work', model.project?.id)); createProject(); });
    if (!model.projects.length) { const empty = text('div', '', 'empty-state'); empty.dataset.emptyState = ''; empty.append(text('strong', 'No projects yet.'), text('p', 'Create a project to keep its conversations and references together.'), create); projects.append(empty); } else projects.append(create);
    $('#shell-settings').replaceChildren(...[
      ['Environment', model.environment], ['Models', data.config?.models?.join(', ') || 'Unknown'],
      ['Provider verification', data.config?.modeDetail || 'Unknown'], ['Settings changes', 'Unavailable in this view'],
    ].flatMap(([key, value]) => [text('dt', key), text('dd', value)]));
    $('#shell-results-summary').textContent = `${data.runs?.length || 0} locally loaded run records. History is available below; QA and approval evidence are not inferred from a completed run.`;
    $('#project-detail-title').textContent = `${projectName} / ${route.trail.join(' / ')}`;
    $('#project-detail-work').href = routeHref('work', model.project?.id);
    $('#project-view-links').replaceChildren(...['overview', 'intake', 'brief', 'references', 'work', 'outputs', 'activity'].map(view => {
      const item = link(view[0].toUpperCase() + view.slice(1), routeHref(view, model.project?.id));
      if (route.trail[0].toLowerCase() === view) item.setAttribute('aria-current', 'page');
      return item;
    }));
    $('#oracle-context-name').textContent = route.trail.join(' / ');
    updateOracleContext?.({ project: model.project, route });
    if(status==='ready' && !['unavailable','offline'].includes(model.status))renderJourney?.(route,model.project);
  }

  function setDrawer(open, restoreFocus = true) {
    if(open && mobile.matches)document.dispatchEvent(new CustomEvent('apollo:surface-open',{detail:{owner:'navigation'}}));
    drawerOpen = open && mobile.matches;
    document.body.classList.toggle('shell-drawer-open', drawerOpen);
    $('#toggle-navigation').setAttribute('aria-expanded', String(drawerOpen));
    $('#close-navigation').hidden = !drawerOpen;
    $('#global-rail').inert = mobile.matches && !drawerOpen;
    $('#main-content').inert = drawerOpen;
    $('.shell-oracle-launcher').inert = drawerOpen;
    if (drawerOpen) $('#global-navigation [aria-current="page"]')?.focus();
    else if (restoreFocus) $('#toggle-navigation').focus();
  }
  function fail(reason) { status = 'unavailable'; error = reason?.message || 'The local workspace is unavailable.'; renderProjection(); }
  $('#toggle-navigation').addEventListener('click', () => setDrawer(!drawerOpen));
  document.addEventListener('apollo:surface-open',event=>{if(event.detail.owner!=='navigation' && drawerOpen)setDrawer(false,false);});
  $('#close-navigation').addEventListener('click', () => setDrawer(false));
  $('#shell-retry').addEventListener('click', () => location.reload());
  $('.shell-skip').addEventListener('click', event => {
    event.preventDefault();
    if (drawerOpen) setDrawer(false, false);
    $('#main-content').focus({ preventScroll: true });
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#/"]');
    if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); if (drawerOpen) setDrawer(false, false); router.navigate(anchor.getAttribute('href'));
  });
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && drawerOpen) { event.preventDefault(); setDrawer(false); return; }
    if (event.key === 'Escape' && $('#oracle-dock').getAttribute('aria-hidden') === 'false') { event.preventDefault(); openOracle(false); return; }
    if (drawerOpen && event.key === 'Tab') {
      const items = [...$('#global-rail').querySelectorAll('a[href], button:not([disabled])')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || !$('#global-rail').contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !$('#global-rail').contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && /^[1-9]$/.test(event.key) && !event.target.closest('input, textarea, select, [contenteditable="true"]')) {
      event.preventDefault(); if (drawerOpen) setDrawer(false, false); const id=ROUTES[Number(event.key)-1].id;router.navigate(document.querySelector(`[data-global-route="${id}"]`).getAttribute('href'));
    }
  });
  mobile.addEventListener('change', () => setDrawer(false, false));
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--shell-drawer-top', `${Math.ceil($('.shell-context').getBoundingClientRect().height)}px`);
  }).observe($('.shell-context'));
  window.addEventListener('online', () => renderProjection());
  window.addEventListener('offline', () => renderProjection());
  setDrawer(false, false);
  router.navigate(location.hash, { replace: true, focus: false });
  return {
    navigate: (target, options) => router.navigate(target.startsWith('#') ? target : '#/' + target, options),
    refresh: renderProjection,
    ready() { status = 'ready'; error = null; router.navigate(location.hash, { replace: true, focus: false }); },
    fail,
    current: router.current,
  };
}
