/** Read-only validator for generated local fixtures. This is not a visual finish review. */
export function reviewFixture(output,plan,design) {
 const checks=[
  {name:'Output is explicitly labelled as a fixture',pass:output.content.mode==='deterministic-fixture'},
  {name:'Output binds the current plan',pass:output.content.planHash===plan.hash},
  {name:'Output binds the current design',pass:output.content.designHash===design.hash},
  {name:'Preview has no executable scripts or remote sources',pass:!/<script|\son\w+=|(?:src|href)=["']https?:/i.test(output.content.html)},
 ];
 return {checks,verdict:checks.every(c=>c.pass)?'PASS':'FAIL',authorId:'fixture-contract-validator',scope:'Automated fixture contract validation only; no visual quality review.'};
}
