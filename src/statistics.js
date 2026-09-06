import {DAY,todayKey,sum} from './utils.js';
import {masteryValue} from './mastery.js';
import {currentStreak} from './gamification.js';
export function studyStats(state,concepts,now=Date.now()){
 const total=state.history.length,correct=state.history.filter(h=>h.correct).length;const studied=concepts.filter(c=>state.concepts[c.id]);
 return {total,correct,wrong:total-correct,accuracy:total?Math.round(correct/total*100):0,seconds:sum(Object.values(state.activity).map(a=>a.seconds)),average:total?sum(state.history.map(h=>h.seconds))/total:0,streak:currentStreak(state.activity,now),reviews:sum(Object.values(state.activity).map(a=>a.reviews)),weak:studied.filter(c=>masteryValue(state.concepts[c.id],state.reviews[c.id],now)<60).length,studied:studied.length,mastery:studied.length?Math.round(sum(studied.map(c=>masteryValue(state.concepts[c.id],state.reviews[c.id],now)))/studied.length):0,falseConfidence:Object.values(state.errors).filter(e=>!e.resolved&&e.falseConfidence).length};
}
export function chartDays(state,count=7,now=Date.now()){const end=new Date(now);end.setHours(12,0,0,0);return Array.from({length:count},(_,i)=>{const day=new Date(end);day.setDate(end.getDate()-(count-1-i));const key=todayKey(day);return {key,label:day.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),short:day.getDate(),...(state.activity[key]||{answers:0,correct:0,reviews:0,seconds:0,xp:0})};});}
