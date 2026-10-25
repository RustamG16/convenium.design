// Minimal zero-dependency Chrome DevTools Protocol client.
// Node 24 ships a global WebSocket, so this needs no package.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const CHROME_HINTS = [
  process.env.CONVENIUM_DESIGN_CHROME,
  join(homedir(), '.cache/puppeteer/chrome-headless-shell'),
  join(homedir(), '.cache/puppeteer/chrome'),
  join(process.env.LOCALAPPDATA || '', 'ms-playwright'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

function newestChild(dir) {
  if (!existsSync(dir)) return null;
  const kids = readdirSync(dir).sort();
  return kids.length ? join(dir, kids[kids.length - 1]) : null;
}

/** Locate a Chrome or chrome-headless-shell executable without downloading anything. */
export function findChrome() {
  for (const hint of CHROME_HINTS) {
    if (hint.endsWith('.exe') && existsSync(hint)) return hint;
    if (!existsSync(hint)) continue;
    // puppeteer cache layout: <cache>/<channel>/<platform-version>/<dirname>/<binary>
    const version = newestChild(hint);
    if (!version) continue;
    for (const leaf of readdirSync(version)) {
      const inner = join(version, leaf);
      for (const bin of ['chrome-headless-shell.exe', 'chrome.exe', 'headless_shell.exe']) {
        const candidate = join(inner, bin);
        if (existsSync(candidate)) return candidate;
      }
    }
    // ms-playwright layout: <root>/chromium_headless_shell-XXXX/chrome-win/headless_shell.exe
    for (const bin of ['chrome-win/headless_shell.exe', 'chrome-win/chrome.exe']) {
      const candidate = join(version, bin);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

class Session {
  constructor(client, sessionId) { this.client = client; this.sessionId = sessionId; }
  send(method, params) { return this.client.send(method, params, this.sessionId); }
  on(event, fn) { return this.client.on(event, fn, this.sessionId); }
  once(event) {
    return new Promise(resolve => {
      const off = this.on(event, payload => { off(); resolve(payload); });
    });
  }
}

export class Browser {
  constructor(proc, ws, userDataDir) {
    this.proc = proc; this.ws = ws; this.userDataDir = userDataDir;
    this.nextId = 1; this.pending = new Map(); this.listeners = new Map();
    ws.addEventListener('message', ev => this.#dispatch(JSON.parse(ev.data)));
  }

  #dispatch(msg) {
    if (msg.id != null) {
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`));
      else entry.resolve(msg.result);
      return;
    }
    const key = `${msg.sessionId || ''}::${msg.method}`;
    for (const fn of this.listeners.get(key) || []) fn(msg.params);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(event, fn, sessionId) {
    const key = `${sessionId || ''}::${event}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(fn);
    return () => this.listeners.get(key).delete(fn);
  }

  async newPage() {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const session = new Session(this, sessionId);
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('Log.enable');
    return session;
  }

  async close() {
    try { this.ws.close(); } catch {}
    try { this.proc.kill(); } catch {}
    await new Promise(r => setTimeout(r, 120));
    try { rmSync(this.userDataDir, { recursive: true, force: true }); } catch {}
  }
}

export async function launch({ chromePath = findChrome() } = {}) {
  if (!chromePath) throw new Error('No Chrome binary found. Set CONVENIUM_DESIGN_CHROME to one.');
  const userDataDir = mkdtempSync(join(tmpdir(), 'convenium-design-ui-metrics-'));
  const args = [
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--disable-extensions', '--disable-background-networking',
    '--disable-features=Translate,BackForwardCache',
    '--force-color-profile=srgb', '--font-render-hinting=none',
    'about:blank',
  ];
  if (!/headless[-_]shell/i.test(chromePath)) args.unshift('--headless=new');
  const proc = spawn(chromePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not report a DevTools endpoint in 20s')), 20000);
    proc.stderr.on('data', chunk => {
      buffer += chunk.toString();
      const match = buffer.match(/ws:\/\/[^\s]+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    proc.on('exit', code => { clearTimeout(timer); reject(new Error(`Chrome exited early (${code})`)); });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true });
  });
  return new Browser(proc, ws, userDataDir);
}
