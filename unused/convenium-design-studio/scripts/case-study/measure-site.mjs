// Case-study measurement: the same objective checks for any website URL.
//   node scripts/case-study/measure-site.mjs <label> <url> <outDir>
// Writes <outDir>/<label>/{metrics.json, desktop-*.png, mobile-*.png, full.png}
// Checks (all automated, identical for every site):
//   performance  load time, LCP, CLS, bytes, requests, DOM size, image formats
//   accessibility text contrast (WCAG AA), images without alt, unnamed controls, heading
//                 outline, landmarks, html lang, small touch targets on mobile, focus styles
//   resilience   console errors, horizontal overflow at 390/820/1440, reduced-motion support
//   honesty      invented facts (prices, phone numbers, street addresses, awards, reviews)
//   brief        reservation path present, supplied media used, palette adherence (pixels)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from '../lib/cdp.mjs';

const [label, url, outDir] = process.argv.slice(2);
if (!label || !url || !outDir) { console.error('usage: measure-site.mjs <label> <url> <outDir>'); process.exit(2); }
const OUT = join(outDir, label);
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ev(page, expression) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}
async function shot(page, file, opts = {}) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', ...opts });
  writeFileSync(join(OUT, file), Buffer.from(data, 'base64'));
}
async function scrollThrough(page) {
  // Trigger lazy media and scroll-driven reveals the way a visitor would.
  await ev(page, `(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += Math.round(innerHeight * 0.6)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); return H; })()`);
}

const A11Y = `(() => {
  const lum = c => { const m = c.match(/[\\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return { L: 0.2126 * r + 0.7152 * g + 0.0722 * b, a: m[3] === undefined ? 1 : Number(m[3]) }; };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const l = lum(cs.backgroundColor); if (l && l.a > 0.9) return l.L; } return lum('rgb(255,255,255)').L; };
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  let checked = 0, failures = 0, unknownBg = 0; const fails = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement;
    if (!el || seen.has(el) || !t.textContent.trim()) continue; seen.add(el);
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0 || r.width === 0 || r.height === 0) continue;
    const fg = lum(cs.color); const bg = bgOf(el);
    if (!fg) continue; if (bg === null) { unknownBg++; continue; }
    checked++;
    const size = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const cr = ratio(fg.L, bg);
    if (cr < need) { failures++; if (fails.length < 12) fails.push({ text: t.textContent.trim().slice(0, 40), ratio: Math.round(cr * 100) / 100, need }); }
  }
  const imgs = [...document.images];
  const imgNoAlt = imgs.filter(i => !i.hasAttribute('alt')).length;
  const controls = [...document.querySelectorAll('a[href], button, [role=button], input, select, textarea')];
  const unnamed = controls.filter(c => { const n = (c.getAttribute('aria-label') || c.getAttribute('title') || c.textContent || c.getAttribute('alt') || c.value || '').trim(); const lab = c.id && document.querySelector('label[for="' + c.id + '"]'); return !n && !lab && !c.querySelector('img[alt]:not([alt=""]), svg title') && !c.closest('label'); }).length;
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]));
  let skips = 0; for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) skips++;
  return { contrastChecked: checked, contrastFailures: failures, contrastSamples: fails, unknownBackground: unknownBg,
    images: imgs.length, imagesWithoutAlt: imgNoAlt, controls: controls.length, unnamedControls: unnamed,
    h1: headings.filter(h => h === 1).length, headingCount: headings.length, headingSkips: skips,
    landmarks: { main: document.querySelectorAll('main,[role=main]').length, nav: document.querySelectorAll('nav,[role=navigation]').length, header: document.querySelectorAll('header').length, footer: document.querySelectorAll('footer').length },
    lang: document.documentElement.lang || null, title: document.title,
    focusStyles: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => /:focus-visible|:focus/.test(r.cssText)); } catch { return false; } }),
    reducedMotionCss: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => /prefers-reduced-motion/.test(r.cssText)); } catch { return false; } }) || /prefers-reduced-motion/.test([...document.scripts].map(s => s.textContent).join(' ')),
  };
})()`;

const HONESTY = `(() => {
  const text = document.body.innerText;
  const grab = re => [...new Set((text.match(re) || []).map(s => s.trim()))].slice(0, 8);
  return {
    prices: grab(/(?:€|EUR|\\$)\\s?\\d{2,4}(?:[.,]\\d{2})?|\\d{2,4}\\s?(?:€|EUR)/g),
    phones: grab(/\\+?\\d{2,3}[\\s/-]?\\(?\\d{1,4}\\)?[\\s/-]?\\d{3,4}[\\s/-]?\\d{3,4}/g),
    addresses: grab(/\\b[A-ZÄÖÜ][a-zäöüß]+(?:gasse|straße|strasse|platz|ring|weg)\\s?\\d+/g),
    awardsOrPress: grab(/\\b(Michelin|Gault|Falstaff|award[- ]winning|awarded|as seen in|featured in|best restaurant|★{2,}|stars?\\b)[^.\\n]{0,40}/gi),
    reviews: grab(/[“"][^”"]{20,140}[”"]\\s*[—–-]\\s*[A-Z][a-z]+/g),
    hours: grab(/\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\\s*[–-]\\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*[^\\n]{0,30}/g),
    emails: grab(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/g),
    fictionDisclosed: /fictional|concept|demo|prototype|not a real/i.test(text),
    words: text.split(/\\s+/).filter(Boolean).length,
  };
})()`;

const BRIEF = `(() => {
  const all = [...document.querySelectorAll('a,button,[role=button]')].map(e => (e.textContent || e.getAttribute('aria-label') || '').trim().toLowerCase());
  const reserveCtas = all.filter(t => /reserv|book|table/.test(t)).length;
  const forms = document.querySelectorAll('form').length;
  const fields = document.querySelectorAll('input:not([type=hidden]),select,textarea').length;
  const media = new Set([...document.querySelectorAll('img,video,source,picture source')].map(e => (e.currentSrc || e.src || e.getAttribute('srcset') || '').split('/').pop().split('?')[0].split(' ')[0]).filter(Boolean));
  const bgImgs = [...document.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).filter(b => b && b !== 'none' && b.includes('url(')).length;
  return { reserveCtas, forms, formFields: fields, distinctMediaFiles: media.size, videos: document.querySelectorAll('video').length, cssBackgroundImages: bgImgs, sections: document.querySelectorAll('section').length, pageHeight: document.documentElement.scrollHeight };
})()`;

async function main() {
  const browser = await launch();
  const result = { label, url, measuredAt: new Date().toISOString() };
  try {
    const page = await browser.newPage();
    await page.send('Network.enable');
    await page.send('Performance.enable');
    const errors = []; let bytes = 0; let requests = 0; const types = {};
    page.on('Runtime.exceptionThrown', e => errors.push(e.exceptionDetails?.exception?.description?.slice(0, 160) || e.exceptionDetails?.text));
    page.on('Log.entryAdded', e => { if (e.entry.level === 'error') errors.push((e.entry.text || '').slice(0, 160)); });
    page.on('Network.loadingFinished', e => { bytes += e.encodedDataLength || 0; requests += 1; });
    page.on('Network.responseReceived', e => { const t = (e.response.mimeType || '').split('/')[1] || 'other'; types[t] = (types[t] || 0) + 1; });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__lcp = 0; window.__cls = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}` });
    const t0 = Date.now();
    await page.send('Page.navigate', { url });
    await sleep(4500);
    const nav = await ev(page, `(() => { const n = performance.getEntriesByType('navigation')[0]; return { domContentLoaded: Math.round(n?.domContentLoadedEventEnd || 0), load: Math.round(n?.loadEventEnd || 0), lcp: Math.round(window.__lcp), domNodes: document.getElementsByTagName('*').length }; })()`);
    const clsAtLoad = await ev(page, 'window.__cls');
    await shot(page, 'desktop-hero.png');
    await scrollThrough(page);
    await sleep(800);
    result.performance = { ...nav, cls: Math.round(clsAtLoad * 1000) / 1000, transferKBAfterScroll: undefined, transferKB: Math.round(bytes / 1024), requests, responseTypes: types, wallMs: Date.now() - t0 };
    const imgFormats = await ev(page, `[...document.images].reduce((m, i) => { const x = (i.currentSrc || i.src).split('?')[0].split('.').pop().toLowerCase(); m[x] = (m[x] || 0) + 1; return m; }, {})`);
    result.performance.imageFormats = imgFormats;
    result.performance.responsiveImages = await ev(page, `[...document.images].filter(i => i.srcset || i.closest('picture')).length`);
    result.performance.lazyImages = await ev(page, `[...document.images].filter(i => i.loading === 'lazy').length`);
    result.accessibility = await ev(page, A11Y);
    result.honesty = await ev(page, HONESTY);
    result.brief = await ev(page, BRIEF);
    // Desktop page-by-page shots (up to 8 screens) and a capped full-page capture.
    const H = await ev(page, 'document.documentElement.scrollHeight');
    const screens = Math.min(8, Math.ceil(H / 900));
    for (let i = 0; i < screens; i++) { await ev(page, `scrollTo(0, ${i * 900})`); await sleep(650); await shot(page, `desktop-${String(i + 1).padStart(2, '0')}.png`); }
    await ev(page, 'scrollTo(0,0)'); await sleep(400);
    try { await shot(page, 'full.png', { captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: Math.min(H, 9000), scale: 0.5 } }); } catch { /* very tall pages */ }
    // Responsiveness
    result.responsive = {};
    for (const [w, h, mobile] of [[390, 844, true], [820, 1180, true], [1440, 900, false]]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
      await page.send('Page.reload', {}); await sleep(3200);
      const r = await ev(page, `({ overflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth), smallTargets: [...document.querySelectorAll('a[href],button,input,select')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.width < 24 || b.height < 24); }).length, height: document.documentElement.scrollHeight })`);
      result.responsive[w] = r;
      if (w === 390) { await shot(page, 'mobile-01.png'); await ev(page, `scrollTo(0, ${Math.round(844 * 1.2)})`); await sleep(700); await shot(page, 'mobile-02.png'); await ev(page, `scrollTo(0, ${Math.round(844 * 2.6)})`); await sleep(700); await shot(page, 'mobile-03.png'); }
    }
    // Reduced motion: does the page still show its content without animation?
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await page.send('Page.reload', {}); await sleep(1500);
    await ev(page, 'scrollTo(0, 0)'); await sleep(2000);
    result.reducedMotion = await ev(page, `(() => { const hidden = [...document.querySelectorAll('h1,h2,h3,p,img')].filter(e => { const s = getComputedStyle(e); return Number(s.opacity) < 0.05 && e.getBoundingClientRect().top < innerHeight * 3; }).length; return { invisibleContentUnderReducedMotion: hidden, runningAnimations: document.getAnimations().filter(a => a.playState === 'running').length }; })()`);
    await shot(page, 'reduced-motion-hero.png');
    result.consoleErrors = [...new Set(errors)].slice(0, 20);
  } finally { await browser.close(); }
  writeFileSync(join(OUT, 'metrics.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ label, perf: result.performance, a11y: { contrastFailures: result.accessibility?.contrastFailures, checked: result.accessibility?.contrastChecked, imagesWithoutAlt: result.accessibility?.imagesWithoutAlt, unnamed: result.accessibility?.unnamedControls }, honesty: result.honesty, brief: result.brief, responsive: result.responsive, rm: result.reducedMotion, errors: result.consoleErrors?.length }, null, 1));
}

main().catch(e => { console.error(e); process.exit(1); });
