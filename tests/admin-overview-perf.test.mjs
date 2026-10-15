import test from 'node:test';
import assert from 'node:assert/strict';
import {adminOverviewReliable} from '../server/index.mjs';

const day=864e5;

function largeDB({userCount=836,eventCount=34000}={}){
 const now=Date.now();
 const users=[];
 for(let i=0;i<userCount;i++){
  users.push({id:'u'+i,created_at:now-(30+Math.random()*60)*day,last_activity_at:now-Math.random()*30*day});
 }
 const eventTypes=['question_answered','question_correct','question_incorrect','question_skipped','study_session_started','study_session_completed','flashcard_reviewed','topic_viewed','topic_mastery_updated'];
 const events=[];
 for(let i=0;i<eventCount;i++){
  const uid='u'+Math.floor(Math.random()*userCount);
  const type=eventTypes[Math.floor(Math.random()*eventTypes.length)];
  const t=now-Math.random()*60*day;
  const meta=type==='study_session_completed'?{seconds:Math.floor(Math.random()*3600)}:(type==='topic_mastery_updated'?{score:Math.floor(Math.random()*100)}:{});
  events.push({user_id:uid,event_type:type,metadata_json:JSON.stringify(meta),created_at:t});
 }
 const db={prepare(sql){
  return {
   bind(){return this;},
   async first(){return null;},
   async run(){return {success:true};},
   async all(){
    if(sql.includes('SUM(CASE WHEN e.event_type')){
     const agg=users.map(u=>{
      const uEvents=events.filter(e=>e.user_id===u.id);
      return {...u,
       questions:uEvents.filter(e=>e.event_type==='question_answered').length,
       sessions:uEvents.filter(e=>e.event_type==='study_session_started').length,
       correct:uEvents.filter(e=>e.event_type==='question_correct').length,
       incorrect:uEvents.filter(e=>e.event_type==='question_incorrect').length,
       skipped:uEvents.filter(e=>e.event_type==='question_skipped').length,
       flashcards:uEvents.filter(e=>e.event_type==='flashcard_reviewed').length,
      };
     }).slice(0,100);
     return {results:agg};
    }
    if(sql.includes('FROM analytics_events')){
     const bound=arguments&&arguments[0]!=null?arguments[0]:null;
     const filtered=bound!=null?events.filter(e=>e.created_at>=bound):events;
     return {results:filtered};
    }
    if(sql.includes('FROM users'))return {results:users};
    if(sql.includes('FROM question_reports'))return {results:[]};
    if(sql.includes('FROM suggestions'))return {results:[]};
    return {results:[]};
   }
  };
 }};
 return {db,users,events};
}

test('adminOverviewReliable completes in <5s with 836 users and 34k events',async()=>{
 const {db,users,events}=largeDB({userCount:836,eventCount:34000});
 const start=performance.now();
 const data=await adminOverviewReliable({DB:db},30);
 const elapsed=performance.now()-start;
 console.log(`adminOverviewReliable completed in ${elapsed.toFixed(0)}ms with ${users.length} users and ${events.length} events`);
 assert.ok(elapsed<5000,`Took ${elapsed.toFixed(0)}ms, expected <5000ms`);
 assert.equal(data.period,30);
 assert.ok(data.metrics);
 assert.ok(data.funnel);
 assert.ok(data.series);
 assert.ok(data.retention);
 assert.ok(typeof data.metrics.dau==='number');
 assert.ok(typeof data.metrics.wau==='number');
 assert.ok(typeof data.metrics.mau==='number');
 assert.ok(Array.isArray(data.series));
 assert.ok(data.series.length===30);
 assert.ok(Array.isArray(data.funnel));
 assert.ok(data.funnel.length===7);
});

test('adminOverviewReliable completes in <5s with 7-day period',async()=>{
 const {db,users,events}=largeDB({userCount:836,eventCount:34000});
 const start=performance.now();
 const data=await adminOverviewReliable({DB:db},7);
 const elapsed=performance.now()-start;
 console.log(`adminOverviewReliable(7d) completed in ${elapsed.toFixed(0)}ms`);
 assert.ok(elapsed<5000,`Took ${elapsed.toFixed(0)}ms, expected <5000ms`);
 assert.equal(data.period,7);
 assert.ok(data.series.length===7);
});

test('adminOverviewReliable returns correct retention structure',async()=>{
 const {db}=largeDB({userCount:50,eventCount:500});
 const data=await adminOverviewReliable({DB:db},30);
 assert.ok(data.retention.d1);
 assert.ok(data.retention.d7);
 assert.ok(data.retention.d30);
 assert.ok(typeof data.retention.d1.retained==='number');
 assert.ok(typeof data.retention.d1.eligible==='number');
 assert.ok(typeof data.retention.d1.percent==='number');
});

test('adminOverviewReliable returns correct funnel structure',async()=>{
 const {db}=largeDB({userCount:50,eventCount:500});
 const data=await adminOverviewReliable({DB:db},30);
 const labels=data.funnel.map(f=>f.label);
 assert.deepEqual(labels,['Conta criada','Iniciou primeiro treino','Respondeu primeira questão','Respondeu 10+ questões','Concluiu primeira sessão','Retornou ao FIXOU','Retornou em até 7 dias']);
 data.funnel.forEach(f=>{
  assert.ok(typeof f.value==='number');
  assert.ok(typeof f.fromStart==='number');
  assert.ok(typeof f.conversion==='number');
 });
});
