#!/usr/bin/env node
// Screenshots every view at a real desktop viewport, through the same headless Chrome the
// metrics harness drives. The browser pane is not a reliable judge of a 1440px layout; this
// is, and it costs one command.
//
// It also writes a CONTACT SHEET: all eight views tiled into one image. That is the artifact
// the previous program never had. Eight separate PNGs let each view look defensible on its
// own; one sheet is where incoherence between views becomes impossible to miss. The loop was
// blind to composition because it only ever read computed values - see V0 in the plan.
//
//   node scripts/ui-shots.mjs [--width 1440] [--height 900] [--out metrics/shots]
//   node scripts/ui-shots.mjs --label before      tags the sheet, so before/after survive
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, findChrome } from './lib/cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VIEWS = ['work', 'architecture', 'systems', 'playground', 'agents', 'knowledge', 'oracle', 'runs'];

const arg = (name, fallback) => {
  const index = process.argv.indexOf('--' + name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const width = Number(arg('width', 1440));
const height = Number(arg('height', 900));
const label = arg('label', '');
const outDir = resolve(ROOT, arg('out', join('metrics', 'shots')));

async function startServer() {
  const port = 4800 + Math.floor(Math.random() * 190);
  const proc = spawn(process.execPath, [join(ROOT, 'server.mjs')], {
    cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = 'http://127.0.0.1:' + port;
  const deadline = Date.now() + 20000;
  for (;;) {
    if (Date.now() > deadline) { proc.kill(); throw new Error('server did not start'); }
    try { if ((await fetch(base + '/', { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  return { proc, base };
}

// The sheet is composed by Chrome itself rather than by an image library: the eight captures
// go into one data-URI page as <img> tiles and that page is screenshotted. No new dependency,
// and the tiles are laid out by the same engine that rendered them.
const TILE = 460;
const GAP = 20;
const PAD = 24;
const CAPTION = 24;

function contactSheetHtml(shots, tileHeight) {
  const cells = shots.map(shot => `
    <figure>
      <figcaption>${shot.view}</figcaption>
      <img src="data:image/png;base64,${shot.data}" alt="${shot.view}">
    </figure>`).join('');
  return `<!doctype html><meta charset="utf-8"><style>
    :root { color-scheme: light }
    body { margin:0; padding:${PAD}px; background:#e9e9ec; font:600 13px/1.4 ui-sans-serif,system-ui,sans-serif; color:#16161a }
    .grid { display:grid; grid-template-columns:repeat(4,${TILE}px); gap:${GAP}px }
    figure { margin:0 }
    figcaption { height:${CAPTION}px; display:flex; align-items:center; letter-spacing:.04em; text-transform:uppercase }
    img { display:block; width:${TILE}px; height:${tileHeight}px; border:1px solid #b9b9c0 }
    h1 { grid-column:1/-1; margin:0 0 4px; font-size:15px }
  </style><body><div class="grid">
    <h1>Convenium.Design Studio &middot; ${width}&times;${height}${label ? ' &middot; ' + label : ''} &middot; ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</h1>
    ${cells}
  </div></body>`;
}

async function main() {
  if (!findChrome()) {
    console.error('ui-shots: no Chrome binary found. Set CONVENIUM_DESIGN_CHROME to a chrome.exe path.');
    return;
  }
  const { proc: server, base } = await startServer();
  const browser = await launch();
  mkdirSync(outDir, { recursive: true });
  const shots = [];
  try {
    const page = await browser.newPage();
    await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    const loaded = page.once('Page.loadEventFired');
    await page.send('Page.navigate', { url: base + '/#/work' });
    await loaded;
    await new Promise(r => setTimeout(r, 1200));

    for (const view of VIEWS) {
      await page.send('Runtime.evaluate', { expression: "location.hash = '/" + view + "'" });
      await new Promise(r => setTimeout(r, 700));
      const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const file = join(outDir, `${view}-${width}x${height}.png`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      shots.push({ view, data });
      console.log('wrote', file);
    }

    const tileHeight = Math.round(TILE * (height / width));
    const sheetWidth = PAD * 2 + TILE * 4 + GAP * 3;
    const sheetHeight = PAD * 2 + 26 + (CAPTION + tileHeight + GAP) * 2;
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: sheetWidth, height: sheetHeight, deviceScaleFactor: 1, mobile: false,
    });
    const sheetLoaded = page.once('Page.loadEventFired');
    await page.send('Page.navigate', { url: 'about:blank' });
    await sheetLoaded;
    await page.send('Runtime.evaluate', {
      expression: 'document.open(); document.write(' + JSON.stringify(contactSheetHtml(shots, tileHeight)) + '); document.close(); true',
    });
    await new Promise(r => setTimeout(r, 900));
    const sheet = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const sheetFile = join(outDir, label ? `contact-sheet-${label}.png` : 'contact-sheet.png');
    writeFileSync(sheetFile, Buffer.from(sheet.data, 'base64'));
    console.log('wrote', sheetFile, `(${sheetWidth}x${sheetHeight})`);
  } finally {
    await browser.close();
    server.kill();
  }
}

// Never fail a build over a screenshot. This step is evidence, not a gate; the gates are
// ui-metrics and ui-behaviour.
main().catch(error => { console.error('ui-shots: skipped -', error.message); });
