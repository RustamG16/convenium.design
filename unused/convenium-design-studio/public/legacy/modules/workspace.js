export function selectWorkspaceState(snapshot, route = {}) {
  const projects = snapshot.projects || [];
  const projectId = route.projectId || snapshot.activeProjectId;
  const project = projects.find(p => p.id === projectId) || (!projectId ? projects[0] : null) || null;
  const chats = project?.chats || [];
  const chatId = route.chatId || (project?.id === snapshot.activeProjectId ? snapshot.activeChatId : null);
  const chat = chats.find(c => c.id === chatId) || (!chatId ? chats[0] : null) || null;
  const unavailable = Boolean(route.unavailable || (projectId && !project) || (chatId && !chat));
  const detailMatches = chat && snapshot.activeProjectId === project?.id && snapshot.activeChatId === chat.id;
  const detail = detailMatches ? snapshot.detail : null;
  return { project, projects, chat, chats, messages: detail?.messages || [], attachments: detail?.attachments || [], status: unavailable ? 'unavailable' : !project || !chat ? 'empty' : !detail ? 'loading' : 'ready', recovery: unavailable ? 'Choose a conversation in this project.' : !chat ? 'Start a conversation.' : null };
}

/** One overlay owner; native dialog focus handling plus explicit focus restoration. */
export function createWorkspaceSurfaces({ closeOracle }) {
  let active = null; let opener = null;
  function close(restore = true) {
    if (!active) return;
    active.classList.remove('workspace-overlay'); active.removeAttribute('aria-modal'); active.removeAttribute('role');
    active = null; document.body.classList.remove('workspace-overlay-open');
    if (restore) opener?.focus();
  }
  function open(element, trigger) {
    document.dispatchEvent(new CustomEvent('apollo:surface-open',{detail:{owner:'workspace'}}));
    close(false); closeOracle(); active = element; opener = trigger;
    element.classList.add('workspace-overlay'); element.setAttribute('role','dialog'); element.setAttribute('aria-modal','true');
    document.body.classList.add('workspace-overlay-open'); element.querySelector('button,select,input,a[href]')?.focus();
  }
  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const items = [...active.querySelectorAll('button:not([disabled]),select,input,a[href],textarea')].filter(e => e.getBoundingClientRect().width);
      const at = items.indexOf(document.activeElement);
      if (event.shiftKey && at <= 0) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && (at < 0 || at === items.length-1)) { event.preventDefault(); items[0]?.focus(); }
    }
  });
  document.addEventListener('apollo:surface-open',event=>{if(event.detail.owner!=='workspace')close(false);});
  return { open, close };
}
