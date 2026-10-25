// Icons: Lucide (vendored, window.lucide) plus a small inline brand set the mockups use.

const BRAND = {
  claude: { color: '#D97757', svg: '<path fill="currentColor" d="M12 1.6 13.2 9l5.6-5-3.7 6.6 7.3-.8-6.8 3 6.2 4-7.2-1.6 2.6 7-4.6-5.8-.9 7.4-1.7-7.2L5 22.4l2.8-6.9L.8 17.2l6-4.2L0 10.3l7.3.6L3.4 4.3l5.8 4.8Z"/>' },
  github: { color: '#0B1111', svg: '<path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/>' },
  notion: { color: '#0B1111', svg: '<path fill="currentColor" d="M4.5 3.2 16.3 2.3c1.5-.1 1.8 0 2.7.7l3.7 2.6c.6.4.8.6.8 1.1v14.4c0 .9-.3 1.4-1.5 1.5L8.3 23.4c-.9 0-1.3-.1-1.8-.7L3.6 19c-.5-.7-.7-1.2-.7-1.8V4.6c0-.7.3-1.3 1.6-1.4Zm12 3.3L5.4 7.2c-.4 0-.5.2-.5.6v12.4c0 .5.2.6.6.6l13.2-.8c.5 0 .6-.3.6-.7V7.1c0-.4-.2-.6-.6-.6ZM8 9.3l2.6-.2 4.6 7.1V9.8l-1.3-.2v-.9l3.6-.2v.9l-1 .3v8.7l-1.6.6c-.5 0-.8-.1-1.2-.6l-4.2-6.6v6.2l1.4.3v.9l-3.7.2v-.9l.9-.3V10.4l-1.3-.1Z"/>' },
  slack: { color: null, svg: '<path fill="#E01E5A" d="M5 15.2a2.5 2.5 0 1 1-2.5-2.5H5Zm1.3 0a2.5 2.5 0 0 1 5 0v6.3a2.5 2.5 0 0 1-5 0Z"/><path fill="#36C5F0" d="M8.8 5a2.5 2.5 0 1 1 2.5-2.5V5Zm0 1.3a2.5 2.5 0 0 1 0 5H2.5a2.5 2.5 0 0 1 0-5Z"/><path fill="#2EB67D" d="M19 8.8a2.5 2.5 0 1 1 2.5 2.5H19Zm-1.3 0a2.5 2.5 0 0 1-5 0V2.5a2.5 2.5 0 0 1 5 0Z"/><path fill="#ECB22E" d="M15.2 19a2.5 2.5 0 1 1-2.5 2.5V19Zm0-1.3a2.5 2.5 0 0 1 0-5h6.3a2.5 2.5 0 0 1 0 5Z"/>' },
  vscode: { color: '#1E8AE6', svg: '<path fill="currentColor" d="M17.3 1 8.2 9.3 3.6 5.8 1.7 6.7v10.6l1.9.9 4.6-3.5 9.1 8.3 5-2.4V3.4ZM3.8 15V9l3 3Zm13.5 1.9L11.6 12l5.7-4.9Z"/>' },
  figma: { color: null, svg: '<path fill="#F24E1E" d="M8 2h4v6.7H8a3.35 3.35 0 0 1 0-6.7Z"/><path fill="#FF7262" d="M12 2h4a3.35 3.35 0 0 1 0 6.7h-4Z"/><path fill="#A259FF" d="M8 8.7h4v6.6H8a3.3 3.3 0 0 1 0-6.6Z"/><path fill="#1ABCFE" d="M12 12a3.3 3.3 0 1 1 6.7 0A3.3 3.3 0 0 1 12 12Z"/><path fill="#0ACF83" d="M8 15.3h4v3.4A3.35 3.35 0 1 1 8 15.3Z"/>' },
  vercel: { color: '#0B1111', svg: '<path fill="currentColor" d="M12 2 23 21H1Z"/>' },
  playwright: { color: null, svg: '<path fill="#2EAD33" d="M9 6.5c-3.4 1-5.8 3.4-6.6 6.8-.6 2.6.6 4.6 3 4.9 2.5.3 5.6-1.4 7.5-4.4L9 6.5Z"/><path fill="#E2574C" d="M14.3 5.2c3.5-.6 6.8.5 7.4 2.8.7 2.6-1.6 6.5-5.4 8.6-2.3 1.3-4.6 1.6-6.1.9l4.1-12.3Z"/><circle cx="16.2" cy="9.6" r="1.2" fill="#0B1111"/><circle cx="7.6" cy="12.2" r="1.1" fill="#0B1111"/>' },
  linear: { color: '#5E6AD2', svg: '<path fill="currentColor" d="M2.3 14.4 9.6 21.7A10 10 0 0 1 2.3 14.4ZM2 11.6 12.4 22a10 10 0 0 0 2.2-.4L2.4 9.4a10 10 0 0 0-.4 2.2Zm1.2-4.3L16.7 20.8a10 10 0 0 0 1.6-1L4.2 5.7a10 10 0 0 0-1 1.6ZM5.6 4.3A10 10 0 1 1 19.7 18.4Z"/>' },
  terminal: { color: '#0B1111', lucide: 'SquareTerminal' },
  chrome: { color: null, svg: '<circle cx="12" cy="12" r="10" fill="#4285F4"/><path fill="#EA4335" d="M12 2a10 10 0 0 1 8.7 5H12a5 5 0 0 0-4.6 3L4 5.6A10 10 0 0 1 12 2Z"/><path fill="#FBBC05" d="M20.7 7A10 10 0 0 1 12 22l4.3-7.5a5 5 0 0 0 .1-5Z"/><path fill="#34A853" d="M4 5.6 8.3 13a5 5 0 0 0 5.4 2.8L11.6 22A10 10 0 0 1 4 5.6Z"/><circle cx="12" cy="12" r="3.6" fill="#fff"/><circle cx="12" cy="12" r="2.8" fill="#4285F4"/>' },
};

export function icon(name, cls = '') {
  const L = window.lucide;
  const node = L && (L[name] || L.Circle);
  if (!node) return document.createElement('span');
  const svg = L.createElement(node, { 'aria-hidden': 'true', focusable: 'false' });
  svg.setAttribute('class', `i ${cls}`.trim());
  return svg;
}

export function brand(name, cls = '') {
  const def = BRAND[name];
  if (!def) return icon('Circle', cls);
  if (def.lucide) return icon(def.lucide, cls);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18'); svg.setAttribute('height', '18');
  svg.setAttribute('class', `i brandmark ${cls}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  if (def.color) svg.style.color = def.color;
  svg.innerHTML = def.svg; // static trusted brand marks
  return svg;
}

// Tools named in the mockups → which brand mark draws them.
export const TOOL_BRANDS = {
  'Claude Code': 'claude', 'Claude 4': 'claude', GitHub: 'github', Notion: 'notion', Slack: 'slack',
  'VS Code': 'vscode', 'Figma MCP': 'figma', Figma: 'figma', Vercel: 'vercel', Playwright: 'playwright',
  Linear: 'linear', Terminal: 'terminal', Chrome: 'chrome',
};

export function toolMark(label, cls = '') {
  const key = TOOL_BRANDS[label];
  return key ? brand(key, cls) : icon('Wrench', cls);
}

// Agent identities. Oracle is Convenium.Design's front door; the other six are the real workflow roles.
export const AGENT_ICONS = {
  oracle: 'Database',
  'design-director': 'Users',
  'visual-analyst': 'Eye',
  'asset-producer': 'Box',
  'design-engineer': 'CodeXml',
  'independent-critic': 'Shield',
  'analytics-specialist': 'ChartNoAxesCombined',
};

export const NAV_ICONS = {
  home: 'House', projects: 'Folder', plan: 'CalendarDays', playground: 'FlaskConical', results: 'ChartNoAxesColumnIncreasing',
  knowledge: 'BookOpen', system: 'Database', agents: 'UsersRound', settings: 'Settings',
};
