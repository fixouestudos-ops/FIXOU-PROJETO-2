import {SUBJECTS,PHYSICS_AREA_ORDER} from './config.js';
import {isBlockedForStudent} from './screens-review.js';

// Somente disciplinas com questões publicáveis aparecem no construtor.
export const SESSION_QUANTITIES=[5,10,20,30,50,'all'];
export const IMAGE_FILTERS=['all','image_required','no_image_required'];

export function sessionSubjects(bank){
 return SUBJECTS.filter(s=>bank.questions.some(q=>q.discipline===s.id&&!isBlockedForStudent(q)));
}
export function sessionTopicKeys(bank,subjects=sessionSubjects(bank).map(s=>s.id)){
 const allowed=new Set(subjects),activeConcepts=new Set(bank.questions.filter(q=>!isBlockedForStudent(q)).map(q=>q.conceptId));
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

// Atalhos da aba Estudar (Original+). Não iniciam sessão; só preenchem o montador.
export const STUDY_PRESETS={
 warmup:{name:'Aquecimento',detail:'Sessão curta com questões fáceis e médias de todos os assuntos',symbol:'☀'},
 hard:{name:'Foco no difícil',detail:'Dificuldades maiores para treinar onde dói',symbol:'↗'},
 mechanics:{name:'Mecânica e cinemática',detail:'Os conteúdos mais cobrados da Física',symbol:'◎'}
};
export function applyStudyPreset(bank,id){
 const subjects=sessionSubjects(bank).map(s=>s.id);
 const topics=sessionTopicKeys(bank,subjects);
 if(id==='warmup')return cleanSessionBuilder(bank,{subjects,topics,difficulties:[1,2],quantity:10,imageFilter:'all'});
 if(id==='hard')return cleanSessionBuilder(bank,{subjects,topics,difficulties:[3,4],quantity:20,imageFilter:'all'});
 if(id==='mechanics'){
  const physics=subjects.includes('fisica')?['fisica']:[];
  const focus=PHYSICS_AREA_ORDER.filter(area=>['Mecânica','Cinemática'].includes(area));
  const mechTopics=physics.length?sessionTopicKeys(bank,physics).filter(key=>focus.includes(topicLabel(key))):[];
  return cleanSessionBuilder(bank,{subjects:physics,topics:mechTopics,difficulties:[1,2,3,4],quantity:20,imageFilter:'all'});
 }
 return defaultSessionBuilder(bank);
}
