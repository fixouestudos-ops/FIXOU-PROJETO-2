import {SUBJECTS} from './config.js';

// The first release of the session builder intentionally exposes the subjects
// with the richest question coverage. The rest of the bank remains available
// through the existing quick filters and curriculum screens.
export const SESSION_DISCIPLINES=['matematica','fisica','quimica','biologia','historia','geografia'];
export const SESSION_QUANTITIES=[5,10,20,30,50,'all'];

export function sessionSubjects(bank){
 return SESSION_DISCIPLINES.map(id=>SUBJECTS.find(s=>s.id===id)).filter(Boolean).filter(s=>bank.concepts.some(c=>c.discipline===s.id));
}
export function sessionTopicKeys(bank,subjects=SESSION_DISCIPLINES){
 const allowed=new Set(subjects);return [...new Set(bank.concepts.filter(c=>allowed.has(c.discipline)).map(c=>`${c.discipline}|${c.topic}`))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
export function defaultSessionBuilder(bank){
 const subjects=sessionSubjects(bank).map(s=>s.id);
 return {subjects,topics:sessionTopicKeys(bank,subjects),difficulties:[1,2,3,4],quantity:20};
}
export function cleanSessionBuilder(bank,builder){
 const available=new Set(sessionSubjects(bank).map(s=>s.id));
 const subjects=[...(builder?.subjects||[])].filter(id=>available.has(id));
 const topics=new Set(sessionTopicKeys(bank,subjects));
 const selectedTopics=[...(builder?.topics||[])].filter(key=>topics.has(key));
 const difficulties=[...(builder?.difficulties||[])].map(Number).filter(n=>n>=1&&n<=4).filter((n,i,a)=>a.indexOf(n)===i).sort((a,b)=>a-b);
 const quantity=SESSION_QUANTITIES.includes(builder?.quantity)?builder.quantity:20;
 return {subjects,topics:selectedTopics,difficulties,quantity};
}
export function builderFilters(builder){
 return {disciplines:[...builder.subjects],topics:[...builder.topics],difficulties:[...builder.difficulties],quantity:builder.quantity};
}
export function topicLabel(key){return String(key).split('|').slice(1).join('|');}
export function subjectIdFromTopic(key){return String(key).split('|')[0];}
