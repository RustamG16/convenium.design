// Mobile measurement (mobile-app-shell §0/§6). node measure.mjs <url...> [--all]  — needs playwright (npm i -D playwright).
// Prints one JSON line per URL at 390x844; add --all for the full device matrix.
import { chromium } from 'playwright';
const args = process.argv.slice(2);
const all = args.includes('--all');
const urls = args.filter(a => !a.startsWith('--'));
const sizes = all ? [[320,568],[360,780],[375,667],[390,844],[430,932]] : [[390,844]];
const b = await chromium.launch();
for (const u of urls) for (const [w,h] of sizes) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  try {
    await p.goto(u, { waitUntil:'networkidle', timeout:45000 });
    for (let y=0;y<40;y++){ await p.evaluate(()=>window.scrollBy(0, innerHeight)); await p.waitForTimeout(100); }
    await p.waitForTimeout(800);
    const r = await p.evaluate(()=>{const d=document.documentElement;return{
      screens:+(d.scrollHeight/innerHeight).toFixed(1), overflowX:d.scrollWidth>innerWidth,
      under24:[...document.querySelectorAll('a,button,input,select,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<24||r.height<24)}).length,
      smallInputs:[...document.querySelectorAll('input,select,textarea')].filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).length,
      bottomBar:[...document.querySelectorAll('*')].some(e=>{const s=getComputedStyle(e);if(s.position!=='fixed')return false;const r=e.getBoundingClientRect();return r.bottom>=innerHeight-2&&r.height>=40&&r.height<=120&&r.width>=innerWidth*0.8}),
      bodyFont:parseFloat(getComputedStyle(document.body).fontSize)}});
    console.log(JSON.stringify({u,w,h,...r}));
  } catch(e){ console.log(JSON.stringify({u,w,h,error:e.message.slice(0,80)})); }
  await ctx.close();
}
await b.close();
