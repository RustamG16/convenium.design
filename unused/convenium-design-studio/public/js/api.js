// Thin client for the existing Convenium.Design Studio server API. No new endpoints are required.

async function request(method, path, body) {
  const init = { method, headers: {} };
  if (body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body); }
  const response = await fetch(path, init);
  let data = null;
  try { data = await response.json(); } catch { /* empty body */ }
  if (!response.ok) throw new Error(data?.error || `${method} ${path} failed (${response.status})`);
  return data;
}

export const api = {
  get: path => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  del: path => request('DELETE', path),

  config: () => request('GET', '/api/config'),
  health: () => request('GET', '/api/health'),
  agents: () => request('GET', '/api/agents'),
  updateAgent: (id, body) => request('PATCH', `/api/agents/${encodeURIComponent(id)}`, body),
  loadouts: () => request('GET', '/api/loadouts'),
  createLoadout: body => request('POST', '/api/loadouts', body),
  updateLoadout: (id, body) => request('PATCH', `/api/loadouts/${encodeURIComponent(id)}`, body),
  activateLoadout: id => request('PATCH', '/api/loadouts/active', { id }),
  knowledge: () => request('GET', '/api/knowledge'),
  workspace: () => request('GET', '/api/workspace'),
  runs: () => request('GET', '/api/runs?limit=50'),
  events: () => request('GET', '/api/events'),
  integrations: () => request('GET', '/api/integrations'),
  designDna: () => request('GET', '/api/design-dna'),
  plan: (prompt, loadoutId) => request('POST', '/api/oracle/plan', { prompt, loadoutId }),
  chat: (prompt, loadoutId) => request('POST', '/api/oracle/chat', { prompt, loadoutId }),
  compare: body => request('POST', '/api/workflow/compare', body),
};
