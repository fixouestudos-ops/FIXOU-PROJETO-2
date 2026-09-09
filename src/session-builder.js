import {SUBJECTS,PHYSICS_AREA_ORDER} from './config.js';

// Somente disciplinas com questões publicáveis aparecem no construtor.
export const SESSION_QUANTITIES=[5,10,20,30,50,'all'];
export const IMAGE_FILTERS=['all','image_required','no_image_required'];

export function sessionSubjects(bank){
 return SUBJECTS.filter(s=>bank.questions.some(q=>q.discipline===s.id&&!q.needsReview));
}
export function sessionTopicKeys(bank,subjects=sessionSubjects(bank).map(s=>s.id)){
 const allowed=new Set(subjects),activeConcepts=new Set(bank.questions.filter(q=>!q.needsReview).map(q=>q.conceptId));
 const rank=key=>{const [discipline,topic]=key.split('|');return discipline==='fisica'?PHYSICS_AREA_ORDER.indexOf(topic):-1;};
 return [...new Set(bank.concepts.filter(c=>allowed.has(c.discipline)&&activeConcepts.has(c.id)).map(c=>`${c.discipline}|${c.topic}`))].sort((a,b)=>a.startsWith('fisica|')&&b.startsWith('fisica|')?rank(a)-rank(b):a.localeCompare(b,'pt-BR'));
}
export function defaultSessionBuilder(bank){
 const subjects=sessionSubjects(bank).map(s=>s.id);
 return {subjects,topics:sessionTopicKeys(bank,subjects),difficulties:[1,2,3,4],quantity:20,imageFilter:'all'};
}
export function cleanSessionBuilder(bank,builder){
 const available=new Set(sessionSubjects(bank).map(s=>s.id));
 const subjects=[...(builder?.subjects||[])].filter(id=>available.has(id));
 const topics=new Set(sessionTopicKeys(bank,subjects));
 const selectedTopics=[...(builder?.topics||[])].filter(key=>topics.has(key));
 const difficulties=[...(builder?.difficulties||[])].map(Number).filter(n=>n>=1&&n<=4).filter((n,i,a)=>a.indexOf(n)===i).sort((a,b)=>a-b);
 const quantity=SESSION_QUANTITIES.includes(builder?.quantity)?builder.quantity:20;
 const imageFilter=IMAGE_FILTERS.includes(builder?.imageFilter)?builder.imageFilter:'all';
 return {subjects,topics:selectedTopics,difficulties,quantity,imageFilter};
}
export function builderFilters(builder){
 return {disciplines:[...builder.subjects],topics:[...builder.topics],difficulties:[...builder.difficulties],quantity:builder.quantity,imageFilter:builder.imageFilter||'all'};
}
export function topicLabel(key){return String(key).split('|').slice(1).join('|');}
export function subjectIdFromTopic(key){return String(key).split('|')[0];}
