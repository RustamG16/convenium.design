import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFixture} from '../fixture-output.mjs';
const fixture=design=>({projects:[{id:'p',name:'Example'}],approvals:[{projectId:'p',gate:'B',status:'approved'}],artifacts:[{kind:'plan',projectId:'p',hash:'plan'},{kind:'design',projectId:'p',hash:'design',content:design},{kind:'brief',projectId:'p',hash:'brief',content:{brief:{goal:'<script>unsafe</script>'}}}]});
const design={typeScaleRem:[1,1.5,2,3],spacingRem:[.5,1,2],colors:{background:'#ffffff',text:'#112233'},motionMs:160,reducedMotionMs:1};
test('fixture applies the approved numeric design and escapes brief text',()=>{
 const output=prepareFixture(fixture(design),'p').operations.find(o=>o.type==='attempt.record').attempt.outputs[0];
 assert.match(output.content.html,/background:#ffffff/);
 assert.match(output.content.html,/color:#112233/);
 assert.match(output.content.html,/font-size:3rem/);
 assert.ok(!output.content.html.includes('<script>'));
 assert.ok(output.content.html.includes('&lt;script&gt;'));
});
test('fixture rejects malformed or executable numeric design values',()=>{
 for(const value of [{...design,colors:{background:'red;}</style><script>',text:'#111111'}},{...design,typeScaleRem:[-1,NaN]},{...design,spacingRem:['calc(1px)']}])assert.throws(()=>prepareFixture(fixture(value),'p'),/design/i);
});
