import {DAY,todayKey,normalize,seedHash,uid,clamp} from './utils.js';
import {masteryValue,updateMastery,conceptWeakness} from './mastery.js';
import {isDue,reviewFromAnswer} from './reviews.js';
import {answerXP,addActivity,unlockAchievements} from './gamification.js';
export function matchesQuestion(q,c,filters,state,now=Date.now()){
 const f=filters||{};
 if(q.needsReview)return false;
 if(f.disciplines?.length&&!f.disciplines.includes(c.discipline))return false;
 if(f.topics?.length&&!f.topics.includes(`${c.discipline}|${c.topic}`))return false;
 if(f.difficulties?.length&&!f.difficulties.includes(Number(q.difficulty)))return false;
 if(f.discipline&&c.discipline!==f.discipline)return false;if(f.topic&&c.topic!==f.topic)return false;if(f.subtopic&&c.id!==f.subtopic)return false;if(f.difficulty&&q.difficulty!==Number(f.difficulty))return false;if(f.type&&q.type!==f.type)return false;
 if(f.status==='new'&&state.history.some(h=>h.questionId===q.id))return false;if(f.status==='wrong'&&!Object.values(state.errors).some(e=>e.conceptId===c.id&&!e.resolved))return false;if(f.status==='due'&&!isDue(state,c.id,now))return false;if(f.status==='favorites'&&!state.favorites.includes('q:'+q.id))return false;
 if(f.search&&!normalize([q.prompt,q.explanation,c.topic,c.subtopic,...(q.tags||[])].join(' ')).includes(normalize(f.search)))return false;return true;
}
export function questionPool(q,state,now){const c=state.concepts[q.conceptId];if(c&&(masteryValue(c,state.reviews[q.conceptId],now)<60||Object.values(state.errors).some(e=>e.conceptId===q.conceptId&&!e.resolved)))return 'weak';if(isDue(state,q.conceptId,now))return 'due';if(!c)return 'new';if(masteryValue(c,state.reviews[q.conceptId],now)>=80)return 'retention';return 'practice';}
export function pickNextQuestion(state,bank,session,now=Date.now()){
 const conceptsById=Object.fromEntries(bank.concepts.map(c=>[c.id,c]));const used=new Set(session.items);let available=bank.questions.filter(q=>!used.has(q.id)&&matchesQuestion(q,conceptsById[q.conceptId],session.filters,state,now));
 if(session.mode==='weak')available=available.filter(q=>Object.values(state.errors).some(e=>e.conceptId===q.conceptId&&!e.resolved));
 if(session.mode==='lightning')available=available.filter(q=>q.estimatedSeconds<=75&&['choice','boolean','numeric','text'].includes(q.type));
 if(!available.length)return null;
 const pattern=['weak','due','weak','new','due','weak','new','retention','weak','due'];const desired=pattern[session.answered.length%10];
 const eligible=available.filter(q=>desired==='due'?isDue(state,q.conceptId,now):questionPool(q,state,now)===desired);if(eligible.length&&['daily','adaptive'].includes(session.mode))available=eligible;
 // Within weakness slots, address confident misconceptions before ordinary gaps.
 if(session.mode==='weak'||['daily','adaptive'].includes(session.mode)&&desired==='weak'){
  const priority=available.filter(q=>Object.values(state.errors).some(e=>e.conceptId===q.conceptId&&!e.resolved&&e.falseConfidence));
  if(priority.length)available=priority;
 }
 const recent=state.history.slice(-4),recentCorrect=recent.filter(h=>h.correct).length;const target=recent.length>=3?(recentCorrect>=3?3:recentCorrect<=1?1:2):2;
 const lastConcept=session.answered.at(-1)?.conceptId;
 const rank=q=>{const history=state.history.filter(h=>h.questionId===q.id),last=history.at(-1);const lastConceptAttempt=state.history.filter(h=>h.conceptId===q.conceptId).at(-1);return (q.conceptId===lastConcept?70:0)+(lastConceptAttempt?.questionId===q.id?65:0)+(last&&now-last.at<DAY?40:0)+history.length*8+Math.abs(q.difficulty-target)*5-(conceptWeakness(state,q.conceptId,now)/20)+(seedHash(todayKey(now)+q.id)%100)/100;};
 available.sort((a,b)=>rank(a)-rank(b));return available[0];
}
export function createSession(state,bank,mode='adaptive',filters={},now=Date.now()){
 const limit=mode==='daily'?state.settings.dailyCount:mode==='practice'?10:mode==='weak'?12:mode==='survival'||mode==='lightning'?bank.questions.length:20;
 return {id:uid(),mode,filters,limit,lives:3,score:0,combo:0,bestCombo:0,startedAt:now,endsAt:mode==='lightning'?now+60000:null,items:[],answered:[],currentId:null,questionAt:null,feedback:null,phase:'question',finished:false};
}
export function gradeAnswer(q,value){
 if(q.type==='numeric'){const normalized=String(value).trim().replace(',','.');if(!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized))return false;return Math.abs(Number(normalized)-q.answer)<=Math.max(q.tolerance||0.0001,Math.abs(q.answer)*.00001);}
 if(q.type==='text')return [q.answer,...(q.acceptedAnswers||[])].some(a=>normalize(value)===normalize(a));
 if(q.type==='order'||q.type==='match')return Array.isArray(value)&&value.length===q.answer.length&&value.every((v,i)=>Number(v)===q.answer[i]);
 return Number.isInteger(value)&&value===q.answer;
}
export function recordAnswer(state,bank,session,q,answer,confidence,seconds,now=Date.now()){
 if(q.needsReview)return null;
 if(!['sure','think','guess'].includes(confidence))throw new Error('Informe sua confiança.');
 if(session.finished||session.feedback||session.answered.some(h=>h.questionId===q.id))return null;
 if(session.endsAt&&now>=session.endsAt)return null;
 const concept=bank.concepts.find(c=>c.id===q.conceptId),correct=gradeAnswer(q,answer),due=isDue(state,concept.id,now);
 const repeated=state.history.some(h=>h.questionId===q.id&&h.correct&&todayKey(h.at)===todayKey(now));
 const combo=correct?session.combo+1:0,xp=answerXP(state,q,correct,due,combo,now);
 const attempt={id:uid(),questionId:q.id,conceptId:concept.id,discipline:concept.discipline,topic:concept.topic,subtopic:concept.subtopic,answer,correctAnswer:q.answer,correct,confidence,seconds:clamp(seconds,0,1800),difficulty:q.difficulty,at:now,xp,mode:session.mode};
 state.history.push(attempt);state.xp+=xp;
 state.concepts[concept.id]=updateMastery(state.concepts[concept.id],q,correct,confidence,seconds,now,repeated,state.reviews[concept.id]);
 state.reviews[concept.id]=reviewFromAnswer(state.reviews[concept.id],correct,confidence,now);
 if(!correct){const prior=state.errors[q.id];state.errors[q.id]={questionId:q.id,conceptId:concept.id,discipline:concept.discipline,topic:concept.topic,subtopic:concept.subtopic,answer,correctAnswer:q.answer,firstAt:prior?.firstAt||now,lastAt:now,count:(prior?.count||0)+1,confidence,falseConfidence:confidence==='sure'||!!(prior?.falseConfidence&&!prior.resolved),explanation:q.explanation,resolved:false};}
 if(correct&&state.concepts[concept.id].recoveryIds.length>=2)for(const error of Object.values(state.errors)){if(error.conceptId===concept.id)error.resolved=true;}
 addActivity(state,'answers',attempt.seconds,now,correct,xp);session.combo=combo;session.bestCombo=Math.max(session.bestCombo,combo);session.score+=correct?1:0;if(!correct&&session.mode==='survival')session.lives--;session.answered.push(attempt);session.feedback=attempt;session.phase='feedback';unlockAchievements(state,now);return attempt;
}
export function finishSession(state,session,now=Date.now()){
 if(session.finished)return;session.finished=true;session.finishedAt=now;session.phase='result';
 const seconds=session.answered.reduce((s,h)=>s+h.seconds,0);state.sessions.push({id:session.id,mode:session.mode,startedAt:session.startedAt,finishedAt:now,total:session.answered.length,correct:session.score,bestCombo:session.bestCombo,seconds,xp:session.answered.reduce((s,h)=>s+h.xp,0)});
 if(['lightning','survival'].includes(session.mode))state.records[session.mode]=Math.max(state.records[session.mode],session.score);state.activeSession=null;
}
export function dailyCounts(state,bank,now=Date.now()){
 const pools={weak:0,due:0,new:0,retention:0,practice:0};for(const c of bank.concepts){const related=bank.questions.find(q=>q.conceptId===c.id);if(related)pools[questionPool(related,state,now)]++;}return pools;
}
