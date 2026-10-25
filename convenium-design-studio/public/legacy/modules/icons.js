export const roleIcons={'design-director':'Compass','visual-analyst':'Eye','asset-producer':'Box','design-engineer':'CodeXml','independent-critic':'ShieldCheck','analytics-specialist':'ChartNoAxesCombined'};
export function icon(name){
 const svg=window.lucide.createElement(window.lucide[name]||window.lucide.Circle,{width:20,height:20,'stroke-width':1.65,'aria-hidden':'true',focusable:'false'});
 svg.classList.add('ui-icon');return svg;
}
export function decorateNavigation(){
 const names={home:'House',projects:'Folder',plan:'CalendarRange',playground:'FlaskConical',results:'ChartNoAxesCombined',knowledge:'BookOpen',system:'Database',agents:'Network',settings:'Settings'};
 for(const link of document.querySelectorAll('[data-global-route]')){
  if(link.querySelector('svg'))continue;
  const label=document.createElement('span');label.className='nav-label';
  const text=[...link.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);label.textContent=text?.textContent||'';text?.remove();link.prepend(icon(names[link.dataset.globalRoute]),label);
 }
}
