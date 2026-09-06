import {DAY,clamp} from './utils.js';
export function scheduleReview(previous,rating,now=Date.now()){
 const p=previous||{interval:0,ease:2.5,repetitions:0,lapses:0};let interval,ease=p.ease,repetitions=p.repetitions;
 if(rating==='forgot'){interval=10/1440;ease=clamp(ease-.2,1.3,3);repetitions=0;}
 else if(rating==='hard'){interval=Math.max(1,Math.min(365,p.interval*1.2));ease=clamp(ease-.15,1.3,3);repetitions++;}
 else if(rating==='good'){interval=p.repetitions===0?1:p.repetitions===1?3:Math.max(3,p.interval*ease);repetitions++;}
 else if(rating==='easy'){interval=p.repetitions===0?4:Math.max(4,p.interval*(ease+.3));ease=clamp(ease+.1,1.3,3);repetitions++;}
 else throw new Error('Avaliação de revisão inválida.');
 interval=Math.min(365,interval);return {...p,interval,ease,repetitions,lapses:p.lapses+(rating==='forgot'?1:0),lastAt:now,dueAt:now+Math.round(interval*DAY),lastRating:rating};
}
export function reviewFromAnswer(previous,correct,confidence,now=Date.now()){
 if(!correct)return scheduleReview(previous,'forgot',now);
 // An uncertain success requires a near review, even after a long interval.
 if(confidence==='guess'){const next=scheduleReview(previous,'hard',now);next.interval=Math.min(next.interval,1);next.dueAt=Math.min(previous?.dueAt>now?previous.dueAt:Infinity,now+DAY);return next;}
 // Practice before a due date must not continually postpone the planned review.
 if(previous&&previous.dueAt>now)return previous;
 return scheduleReview(previous,confidence==='guess'?'hard':'good',now);
}
export const isDue = (state,id,now=Date.now()) => !!state.reviews[id]&&state.reviews[id].dueAt<=now;
export function dueConcepts(state,concepts,now=Date.now()){const priority=id=>Object.values(state.errors).some(e=>e.conceptId===id&&!e.resolved&&e.falseConfidence)?1:0;return concepts.filter(c=>isDue(state,c.id,now)).sort((a,b)=>priority(b.id)-priority(a.id)||state.reviews[a.id].dueAt-state.reviews[b.id].dueAt);}
