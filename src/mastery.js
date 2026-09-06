import {DAY,clamp,todayKey} from './utils.js';
export function masteryValue(record,review,now=Date.now()){
 if(!record)return 0;
 const days=Math.max(0,(now-record.lastAt)/DAY);const retention=Math.exp(-days/Math.max(21,(review?.interval||1)*3));
 return Math.round(clamp(record.score*retention,0,100));
}
export function updateMastery(previous,question,correct,confidence,seconds,now=Date.now(),repeated=false,review=null){
 const p=previous||{score:0,attempts:0,correct:0,consecutiveErrors:0,consecutiveCorrect:0,lastAt:now,questionIds:[],days:[],recent:[],recoveryIds:[]};
 const ids=[...new Set([...p.questionIds,question.id])],days=[...new Set([...p.days,todayKey(now)])];
 const speed=seconds<1?.3:seconds>question.estimatedSeconds*2?.8:1;
 const recent=[...(p.recent||[]),correct?1:0].slice(-8);
 const consecutiveErrors=correct?0:p.consecutiveErrors+1;
 const gain=correct?(confidence==='guess'?3:confidence==='think'?10:16)+question.difficulty*2:0;
 const penalty=correct?0:(confidence==='sure'?17:confidence==='think'?11:7)+Math.min(9,consecutiveErrors*2);
 const cap=ids.length<2?35:days.length<2?55:days.length<3?80:100;
 const recencyBase=masteryValue(p,review,now);
 let score=clamp(recencyBase+(correct?(repeated?0:gain*speed*(.65+.35*recent.reduce((a,b)=>a+b,0)/recent.length)):-penalty),0,cap);
 if(correct&&confidence==='guess')score=Math.max(recencyBase,Math.min(35,score));
 return {score,attempts:p.attempts+1,correct:p.correct+(correct?1:0),consecutiveErrors,consecutiveCorrect:correct?p.consecutiveCorrect+1:0,lastAt:now,questionIds:ids,days,recent,recoveryIds:correct&&confidence!=='guess'?[...new Set([...(p.recoveryIds||[]),question.id])]:[],lastConfidence:confidence,lastCorrect:correct};
}
export const conceptWeakness = (state,id,now=Date.now()) => {const c=state.concepts[id];if(!c)return 0;const m=masteryValue(c,state.reviews[id],now);const falseDomain=Object.values(state.errors).some(e=>e.conceptId===id&&!e.resolved&&e.falseConfidence);return (falseDomain?150:0)+(100-m)+Math.min(30,c.consecutiveErrors*10);};
export function officialMastery(state,concepts,objects,now=Date.now()){
 const unique=objects.filter(o=>o.kind==='object'&&o.id===o.canonicalId);if(!unique.length)return 0;
 let total=0;for(const o of unique){const related=concepts.filter(c=>c.officialIds.includes(o.id));if(related.length)total+=Math.min(...related.map(c=>masteryValue(state.concepts[c.id],state.reviews[c.id],now)));}
 return Math.round(total/unique.length);
}
