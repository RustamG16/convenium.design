// Playwright tutorial recorder.
// Plays every totem tour on a scratch copy of the data, exactly as a user would (clicking
// "Next" in the guide card), and writes a step-by-step guide per tour:
//   public/tutorials/<tour>/NN.png      screenshot of each step
//   public/tutorials/<tour>/tour.webm   video of the whole walkthrough
//   public/tutorials/<tour>/index.html  instructions page with the totem
//   public/tutorials/index.html         index of all tours
// Usage:  npm run tutorials            (all tours)
//         npm run tutorials -- welcome (one tour)
import { mkdirSync, rmSync, readdirSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { ROOT, startServer } from './lib/harness.mjs';

const OUT = join(ROOT, 'public', 'tutorials');
const { TOURS, POSES } = await import(pathToFileURL(join(ROOT, 'public', 'js', 'tours-data.js')).href);
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const VIEW = { width: 1440, height: 900 };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const freshSession = JSON.stringify({ projectId: 'northstar', goal: null, intake: { answers: {}, notes: {} }, briefApproved: false, planApproved: false, configApplied: false, configDraft: null, run: { status: 'idle', task: 0 }, resultApproved: false, tours: { _dismissed: true } });

async function launchBrowser() {
  try { return await chromium.launch(); }
  catch (error) {
    if (process.env.APOLLO_CHROME) return chromium.launch({ executablePath: process.env.APOLLO_CHROME });
    try { return await chromium.launch({ channel: 'chrome' }); } catch { throw error; }
  }
}

function tourPage(tour, steps) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tour.title)} — Convenium.Design tutorial</title>
<link rel="stylesheet" href="../../css/tokens.css"><link rel="stylesheet" href="../guide.css"></head><body>
<header class="g-head"><a href="../index.html" class="g-back">← All tutorials</a><img src="${POSES.wave}" alt="Convenium.Design Totem"><div><p class="g-eyebrow">// Convenium.Design tutorial · ${steps.length} steps · ~${tour.minutes} min</p><h1>${esc(tour.title)}</h1><p class="g-sum">${esc(tour.summary)}</p>
<p class="g-try"><a href="/?tour=${tour.id}">▶ Play this tutorial live in Convenium.Design</a></p></div></header>
<main>
<section class="g-video"><video src="tour.webm" controls muted playsinline preload="metadata"></video><p>Recorded automatically with Playwright on a scratch copy of the data.</p></section>
<ol class="g-steps">${steps.map((s, i) => `<li><div class="g-text"><span class="g-n">${String(i + 1).padStart(2, '0')}</span><img class="g-pose" src="${POSES[s.pose] || POSES.wave}" alt=""><div><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>${s.action ? `<p class="g-do">→ ${esc(s.action)}</p>` : ''}<p class="g-route">Screen: <code>${esc(s.route || '')}</code></p></div></div><img class="g-shot" src="${s.file}" alt="Step ${i + 1}: ${esc(s.title)}" loading="lazy"></li>`).join('\n')}</ol>
</main></body></html>`;
}

const GUIDE_CSS = `body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-mono);font-size:15px}
a{color:var(--blue)}main{max-width:1180px;margin:0 auto;padding:0 24px 64px}
.g-head{max-width:1180px;margin:0 auto;padding:28px 24px;display:grid;grid-template-columns:auto 150px 1fr;gap:24px;align-items:center}
.g-head img{width:150px;height:150px;object-fit:contain}.g-back{align-self:start;font-size:13px}
.g-eyebrow{color:var(--green);letter-spacing:.16em;text-transform:uppercase;font-size:12px;margin:0}
h1{font-weight:800;text-transform:uppercase;font-size:40px;margin:6px 0}.g-sum{font-family:var(--font-sans);color:var(--ink-2);margin:0}
.g-try{margin:12px 0 0}.g-video{background:#fff;border:1px solid var(--line);padding:12px;margin-bottom:28px}.g-video video{width:100%;display:block;background:#000}
.g-video p{font-size:12px;color:var(--muted);margin:8px 0 0}
.g-steps{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:28px}
.g-steps li{background:#fff;border:1px solid var(--line);padding:18px}
.g-text{display:grid;grid-template-columns:auto 72px 1fr;gap:14px;align-items:start;margin-bottom:14px}
.g-n{font-weight:800;font-size:22px;color:var(--green)}.g-pose{width:72px;height:72px;object-fit:contain}
h2{font-size:18px;text-transform:uppercase;margin:4px 0 6px}.g-text p{font-family:var(--font-sans);margin:0 0 6px;color:var(--ink-2);line-height:1.5}
.g-do{color:var(--blue)!important;font-weight:600}.g-route{font-size:12px;color:var(--muted)!important}
.g-shot{width:100%;display:block;border:1px solid var(--line)}
.g-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}
.g-card{background:#fff;border:1px solid var(--line);padding:16px;text-decoration:none;color:inherit;display:block}
.g-card img{width:100%;border:1px solid var(--line);margin-top:10px}.g-card h2{font-size:16px}
@media(max-width:700px){.g-head{grid-template-columns:1fr}.g-head img{width:100px;height:100px}h1{font-size:28px}}`;

async function recordTour(browser, base, tour) {
  const dir = join(OUT, tour.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ viewport: VIEW, recordVideo: { dir, size: VIEW } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/?notour#/home`);
  await page.evaluate(s => { localStorage.setItem('apollo.v2.session', s); sessionStorage.clear(); }, freshSession);
  await page.goto(`${base}/?notour#/home`);
  await page.waitForFunction(() => window.apolloTour && document.getElementById('page-title'));
  await page.waitForTimeout(600);
  await page.evaluate(id => window.apolloTour.start(id), tour.id);
  const steps = [];
  for (let i = 0; i < tour.steps.length; i += 1) {
    const step = tour.steps[i];
    await page.waitForSelector(`.tour-card[data-step="${i}"]`, { timeout: 15000 });
    await page.waitForTimeout(900);
    if (step.demo) {
      // Show the instructed action being done, then keep the guide on screen.
      await page.evaluate(sel => document.querySelector(sel)?.click(), step.demo);
      await page.waitForTimeout(700);
      await page.evaluate(() => window.apolloTour.start(window.apolloTour.state.id, window.apolloTour.state.step));
      await page.waitForSelector(`.tour-card[data-step="${i}"]`, { timeout: 15000 });
      await page.waitForTimeout(700);
    }
    const file = `${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: join(dir, file) });
    steps.push({ ...step, file });
    console.log(`  ${tour.id} ${i + 1}/${tour.steps.length}  ${step.title}`);
    await page.click('.tour-card .tour-next');
  }
  await page.waitForTimeout(800);
  const video = page.video();
  await context.close();
  const recorded = video ? await video.path() : null;
  if (recorded && existsSync(recorded)) renameSync(recorded, join(dir, 'tour.webm'));
  for (const f of readdirSync(dir)) if (f.endsWith('.webm') && f !== 'tour.webm') rmSync(join(dir, f));
  writeFileSync(join(dir, 'index.html'), tourPage(tour, steps));
  if (errors.length) console.log(`  ! page errors in ${tour.id}: ${errors.join(' | ')}`);
  return { tour, steps, errors };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'guide.css'), GUIDE_CSS);
  const { proc, base } = await startServer({ scratchData: true });
  const browser = await launchBrowser();
  const results = [];
  try {
    for (const tour of TOURS.filter(t => !only.length || only.includes(t.id))) {
      console.log(`Recording "${tour.title}"`);
      results.push(await recordTour(browser, base, tour));
    }
  } finally { await browser.close(); proc.kill(); }
  const all = TOURS.filter(t => existsSync(join(OUT, t.id, 'index.html')));
  writeFileSync(join(OUT, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Convenium.Design tutorials</title><link rel="stylesheet" href="../css/tokens.css"><link rel="stylesheet" href="guide.css"></head><body>
<header class="g-head"><a href="/#/tutorials" class="g-back">← Convenium.Design</a><img src="${POSES.wave}" alt="Convenium.Design Totem"><div><p class="g-eyebrow">// Recorded walkthroughs</p><h1>Learn Convenium.Design</h1><p class="g-sum">Each guide was played automatically with Playwright: video, screenshots and the totem’s instructions for every step.</p></div></header>
<main><div class="g-grid">${all.map(t => `<a class="g-card" href="${t.id}/index.html"><p class="g-eyebrow">${t.steps.length} steps · ~${t.minutes} min</p><h2>${esc(t.title)}</h2><p>${esc(t.summary)}</p><img src="${t.id}/01.png" alt="" loading="lazy"></a>`).join('')}</div></main></body></html>`);
  const failed = results.filter(r => r.errors.length);
  console.log(`\nWrote ${results.length} tutorial(s) to ${OUT}`);
  if (failed.length) process.exit(1);
}

main().catch(error => { console.error(error); process.exit(1); });
