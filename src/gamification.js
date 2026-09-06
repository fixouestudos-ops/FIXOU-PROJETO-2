import {todayKey,dateNumber} from './utils.js';
export function profileLevel(xp){let level=1,base=0,needed=100;while(xp>=base+needed){base+=needed;level++;needed=100+40*(level-1);}return {level,base,needed,current:xp-base,percent:Math.min(100,Math.round((xp-base)/needed*100))};}
export function currentStreak(activity,now=Date.now()){
 const days=Object.keys(activity).filter(k=>activity[k].answers+activity[k].reviews>0).sort().reverse();if(!days.length)return 0;
 let expected=dateNumber(todayKey(now)),streak=0;if(expected-dateNumber(days[0])>1)return 0;expected=dateNumber(days[0]);for(const day of days){if(dateNumber(day)!==expected)break;streak++;expected--; }return streak;
}
export function addActivity(state,kind,seconds,now=Date.now(),correct=false,xp=0){const day=todayKey(now);const a=state.activity[day]||{answers:0,correct:0,seconds:0,reviews:0,xp:0};a[kind]++;a.seconds+=Math.max(0,Math.min(1800,seconds));a.correct+=correct?1:0;a.xp+=xp;state.activity[day]=a;}
export function answerXP(state,question,correct,wasDue,streak,now=Date.now()){
 if(!correct||state.history.some(h=>h.questionId===question.id&&h.correct&&todayKey(h.at)===todayKey(now)))return 0;
 return [0,5,10,15,25][question.difficulty]+(wasDue?3:0)+(streak>0&&streak%5===0?5:0);
}
export const ACHIEVEMENTS=[{id:'first',name:'Primeiro passo',description:'Responda sua primeira questão.',symbol:'↗'},{id:'hundred',name:'Mente em movimento',description:'Responda 100 questões.',symbol:'100'},{id:'thousand',name:'Longa jornada',description:'Responda 1.000 questões.',symbol:'1k'},{id:'week',name:'Uma semana de constância',description:'Estude por 7 dias seguidos.',symbol:'7'},{id:'month',name:'Um hábito seu',description:'Estude por 30 dias seguidos.',symbol:'30'},{id:'math100',name:'Raciocínio afiado',description:'Responda 100 questões de Matemática.',symbol:'ƒ'},{id:'recovered',name:'Virada de chave',description:'Supere uma fraqueza em duas variações.',symbol:'◇'},{id:'hard10',name:'Além do básico',description:'Acerte 10 questões difíceis seguidas.',symbol:'✦'},{id:'review10',name:'Memória em dia',description:'Faça 10 revisões de flashcards.',symbol:'▱'}];
export function unlockAchievements(state,now=Date.now()){
 const n=state.history.length,streak=currentStreak(state.activity,now);const rules={first:n>=1,hundred:n>=100,thousand:n>=1000,week:streak>=7,month:streak>=30,math100:state.history.filter(h=>h.discipline==='matematica').length>=100,recovered:Object.values(state.errors).some(e=>e.resolved),hard10:n>=10&&state.history.slice(-10).every(h=>h.correct&&h.difficulty>=3),review10:Object.values(state.activity).reduce((s,a)=>s+a.reviews,0)>=10};const fresh=Object.keys(rules).filter(k=>rules[k]&&!state.achievements.includes(k));state.achievements.push(...fresh);return fresh;
}
