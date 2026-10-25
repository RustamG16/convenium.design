import {hashValue} from './state.mjs';
import {reviewFixture} from './fixture-review.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function prepareFixture(state,projectId) {
 if(!state.approvals.some(a=>a.projectId===projectId&&a.gate==='B'&&a.status==='approved'))throw new Error('Approve the current plan and design before execution.');
 const latest=kind=>state.artifacts.findLast(a=>a.projectId===projectId&&a.kind===kind);
 const plan=latest('plan'),design=latest('design'),brief=latest('brief');
 const tokens=design?.content;
 const scale=value=>Array.isArray(value)&&value.length>=2&&value.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=64);
 if(!tokens||!scale(tokens.typeScaleRem)||!scale(tokens.spacingRem)||!['background','text'].every(key=>/^#[0-9a-f]{6}$/i.test(tokens.colors?.[key]||'')))throw new Error('The design must contain positive numeric type and spacing scales and six-digit hex colors.');
 const project=state.projects.find(p=>p.id===projectId);const runId=`fixture-${crypto.randomUUID()}`;
 const body=Object.entries(brief.content.brief).filter(([,v])=>typeof v==='string').map(([name,value])=>`<section><h2>${escape(name)}</h2><p>${escape(value)}</p></section>`).join('');
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(project.name)} — local fixture</title><style>body{margin:${tokens.spacingRem.at(-1)}rem auto;padding:${tokens.spacingRem[0]}rem;max-width:60rem;font:${tokens.typeScaleRem[0]}rem/1.6 system-ui;background:${tokens.colors.background};color:${tokens.colors.text}}h1{font-size:${tokens.typeScaleRem.at(-1)}rem}h2{font-size:${tokens.typeScaleRem[1]}rem}section{border-top:1px solid currentColor;padding-block:${tokens.spacingRem[1]}rem}p,h1,h2{overflow-wrap:anywhere}</style><main><p>LOCAL FIXTURE — NOT A PRODUCTION WEBSITE</p><h1>${escape(project.name)}</h1>${body}</main></html>`;
 const content={mode:'deterministic-fixture',title:project.name,html,planHash:plan.hash,designHash:design.hash,provenance:[`brief:${brief.hash}`,`plan:${plan.hash}`,`design:${design.hash}`],limitations:['A deterministic brief specimen, not an AI-built website.','QA checks the fixture contract only. Visual quality, performance and production readiness require separate review.']};
 const output={id:`output-${runId}`,projectId,kind:'output',content};const hash=hashValue({projectId,kind:'output',content});
 const qa={verdict:html.includes('<main>')&&html.includes('<h1>')?'PASS':'FAIL',evidence:['fixture-output.mjs: semantic main and heading assertions executed'],authorId:'fixture-builder'};
 const independent=reviewFixture(output,plan,design);
 const review=(kind,result)=>({type:'record.put',collection:'reviews',record:{id:`${kind}-${runId}`,projectId,artifactId:output.id,artifactHash:hash,kind,status:'complete',verdict:result.verdict,authorId:result.authorId,evidence:result.evidence||result.checks.map(c=>`${c.pass?'PASS':'FAIL'}: ${c.name}`),scope:'Automated fixture contract only'}});
 return {runId,mode:'deterministic-fixture',checks:independent.checks,operations:[{type:'run.create',run:{id:runId,projectId,status:'draft',mode:'demo',source:'deterministic-fixture'}},{type:'run.transition',runId,status:'running'},{type:'attempt.record',attempt:{id:`attempt-${runId}`,runId,status:'complete',outputs:[output]}},review('qa',qa),review('independent',independent),{type:'run.transition',runId,status:'complete'}]};
}
