/** Read-only client projection. This module does not approve, infer, or persist production state. */
export function selectShellState(snapshot, route) {
  const projects = snapshot.projects || [];
  const projectId = route.projectId || snapshot.activeProjectId;
  const project = projects.find(item => item.id === projectId) || (!projectId ? projects[0] : null);
  const mode = snapshot.config?.mode;
  const environment = mode === 'live-unverified' ? 'unverified' : ['local', 'demo', 'live', 'unverified', 'unavailable', 'unknown'].includes(mode) ? mode : 'unknown';
  const status = snapshot.online === false ? 'offline' : snapshot.status === 'unavailable' || route.unavailable || (snapshot.status === 'ready' && route.projectId && !project) ? 'unavailable' : snapshot.status !== 'ready' ? 'loading' : !projects.length ? 'empty' : 'ready';
  const stage = typeof project?.stage === 'string' && project.stage.trim() ? project.stage : 'Unknown';
  return { status, project, projects, stage, environment: snapshot.status === 'unavailable' ? 'unavailable' : environment,
    nextAction: status === 'loading' ? 'Wait for local records' : status === 'offline' ? 'Reconnect to the local server' : status === 'unavailable' ? 'Review connection or choose a project' : project?.nextAction || (project ? 'Describe or confirm the project goal' : 'Choose or create a project'),
    oracle: snapshot.status === 'ready' && snapshot.online !== false ? 'Available' : 'Unavailable',
    error: snapshot.error || null,
  };
}
