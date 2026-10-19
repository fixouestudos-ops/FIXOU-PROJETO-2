import {NAV} from './config.js';
import {sidebarIcon} from './sidebar-icons.js';
import {escapeHTML} from './utils.js';

const DESCRIPTIONS={train:'Quiz adaptativo e desafios de estudo',cards:'Cartas e revisão espaçada',errors:'Revise as questões que você errou',home:'Seu caminho de aprendizagem',stats:'Acompanhe seus pontos fortes e fracos',map:'Conteúdos para o vestibular',books:'Obras e textos para estudar',favorites:'Questões que você salvou',admin:'Gestão e métricas do FIXOU',review:'Revise e aprove o acervo'};
const LABELS=Object.fromEntries(NAV.map(([id,,label])=>[id,label]));
LABELS.admin='Painel do dono';
LABELS.review='Revisão de Questões';
export const NAV_GROUPS=[{id:'study',label:'Estudar',items:['train','cards','errors']},{id:'journey',label:'Acompanhar',items:['home','stats','map']},{id:'library',label:'Biblioteca',items:['books','favorites']},{id:'admin',label:'Admin',items:['admin','review'],adminOnly:true}];
export function groupOfRoute(route){const group=NAV_GROUPS.find(g=>g.items.includes(route));return group?group.id:null;}
export function renderTopnav({route,isLocked,isActive,badgeFor,admin}){
 return NAV_GROUPS.filter(group=>!group.adminOnly||admin).map(group=>{
  const groupActive=group.items.includes(route);
  const items=group.items.map(id=>{
   const locked=isLocked(id);
   const active=isActive(id)&&!locked;
   const badge=badgeFor(id)||'';
   const name=escapeHTML(LABELS[id]||id);
   const icon=`<span class="navIcon" aria-hidden="true">${sidebarIcon(id)}</span>`;
   const text=`<span class="navpop-text"><span class="navpop-name">${name}</span><span class="navpop-desc">${escapeHTML(DESCRIPTIONS[id]||'')}</span></span>`;
   if(locked)return `<button type="button" class="navitem navpop-item guest-locked" data-action="guest-lock" data-id="${id}" aria-label="${name} - requer conta">${icon}${text}<span class="nav-lock" aria-hidden="true">🔒</span>${badge}</button>`;
   return `<a href="#${id}" class="navitem navpop-item${active?' active':''}"${active?' aria-current="page"':''}>${icon}${text}${badge}</a>`;
  }).join('');
  return `<div class="navgroup${groupActive?' group-active':''}"><button type="button" class="navgroup-btn" data-action="nav-group" data-id="${group.id}" aria-expanded="false" aria-controls="navpop-${group.id}"><span class="navgroup-label">${escapeHTML(group.label)}</span><span class="navcaret" aria-hidden="true">▾</span></button><div class="navpop" id="navpop-${group.id}" role="group" aria-label="${escapeHTML(group.label)}">${items}</div></div>`;
 }).join('');
}
export function closeNavGroups(focusButton){
 document.querySelectorAll('.navgroup.open').forEach(group=>{
  group.classList.remove('open');
  const trigger=group.querySelector('.navgroup-btn');
  if(trigger)trigger.setAttribute('aria-expanded','false');
 });
 if(focusButton&&typeof focusButton.focus==='function')focusButton.focus();
}
export function toggleNavGroup(trigger){
 const group=trigger&&trigger.closest?trigger.closest('.navgroup'):null;
 if(!group)return;
 const willOpen=!group.classList.contains('open');
 closeNavGroups();
 if(willOpen){group.classList.add('open');trigger.setAttribute('aria-expanded','true');}
}
export function moveGroupFocus(group,key){
 const items=Array.from(group.querySelectorAll('.navpop-item'));
 if(!items.length)return;
 let index=items.indexOf(document.activeElement);
 if(key==='ArrowDown')index=index<0?0:(index+1)%items.length;
 else if(key==='ArrowUp')index=index<0?items.length-1:(index-1+items.length)%items.length;
 else if(key==='Home')index=0;
 else index=items.length-1;
 if(items[index]&&typeof items[index].focus==='function')items[index].focus();
}
