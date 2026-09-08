import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{passwordHash,passwordMatches,avatarType,retentionValue,analyticsEventKey} from '../server/index.mjs';

test('senha usa hash derivado e valida sem armazenar texto puro',async()=>{
 const salt='salt-seguro-de-teste';
 const stored=await passwordHash('senha-muito-segura',salt,1000);
 assert.notEqual(stored,'senha-muito-segura');
 assert.match(stored,/^pbkdf2sha256\$1\$1000\$/);
 assert.equal(stored.split('$').pop().length,64);
 assert.equal(await passwordMatches('senha-muito-segura',salt,await passwordHash('senha-muito-segura',salt)),true);
 assert.equal(await passwordMatches('senha-errada',salt,await passwordHash('senha-muito-segura',salt)),false);
});

const fakeDB=user=>({prepare(){return {bind(){return this;},first:async()=>user,run:async()=>({success:true}),all:async()=>({results:[]})};}});
test('admin exige sessão e bloqueia role student no backend',async()=>{
 const anonymous=await worker.fetch(new Request('https://fixou.test/api/admin/overview'),{DB:fakeDB(null)});
 assert.equal(anonymous.status,401);
 const student={id:'u1',name:'Aluno',email:'a@b.com',role:'student',plan:'free',password_hash:'x',password_salt:'y',updated_at:1};
 const denied=await worker.fetch(new Request('https://fixou.test/api/admin/overview',{headers:{cookie:'fixou_session=token'}}),{DB:fakeDB(student)});
 assert.equal(denied.status,403);
 assert.equal((await denied.json()).error,'Acesso restrito ao painel administrativo.');
});

test('analytics rejeita tipo arbitrário mesmo para usuário autenticado',async()=>{
 const student={id:'u1',name:'Aluno',email:'a@b.com',role:'student',plan:'free',password_hash:'x',password_salt:'y',updated_at:1,last_activity_at:Date.now()};
 const response=await worker.fetch(new Request('https://fixou.test/api/events',{method:'POST',headers:{cookie:'fixou_session=token','content-type':'application/json'},body:JSON.stringify({eventType:'fabricar_metricas',metadata:{secret:'x'}})}),{DB:fakeDB(student)});
 assert.equal(response.status,400);
});

test('idempotência distingue questões da mesma sessão e repetições da mesma resposta',()=>{
 const first=analyticsEventKey('question_answered',{sessionId:'s1',questionId:'q1'});
 const retry=analyticsEventKey('question_answered',{sessionId:'s1',questionId:'q1'});
 const next=analyticsEventKey('question_answered',{sessionId:'s1',questionId:'q2'});
 assert.equal(first,retry);
 assert.notEqual(first,next);
 assert.equal(analyticsEventKey('study_session_started',{sessionId:'s1'}),'study_session_started:s1');
});

test('retenção D1, D7 e D30 usa coortes elegíveis e timestamps controlados',()=>{
 const day=864e5,reference=100*day;
 const users=[{id:'a',created_at:60*day},{id:'b',created_at:92*day},{id:'novo',created_at:99.5*day}];
 const events=[
  {user_id:'a',event_type:'question_answered',created_at:61.2*day},
  {user_id:'a',event_type:'question_answered',created_at:67.2*day},
  {user_id:'a',event_type:'flashcard_reviewed',created_at:90.2*day},
  {user_id:'b',event_type:'study_session_started',created_at:99.2*day}
 ];
 assert.deepEqual(retentionValue(users,events,1,reference),{retained:1,eligible:2,percent:50});
 assert.deepEqual(retentionValue(users,events,7,reference),{retained:2,eligible:2,percent:100});
 assert.deepEqual(retentionValue(users,events,30,reference),{retained:1,eligible:1,percent:100});
 assert.equal(retentionValue([{id:'x',created_at:99.5*day}],events,1,reference),null);
});

test('avatar exige MIME coerente com a assinatura do arquivo',()=>{
 assert.equal(avatarType(Uint8Array.from([255,216,255,1]).buffer,'image/jpeg'),'image/jpeg');
 assert.equal(avatarType(Uint8Array.from([137,80,78,71,13,10,26,10]).buffer,'image/png'),'image/png');
 assert.equal(avatarType(new TextEncoder().encode('RIFFxxxxWEBP').buffer,'image/webp'),'image/webp');
 assert.equal(avatarType(Uint8Array.from([137,80,78,71,13,10,26,10]).buffer,'image/jpeg'),null);
 assert.equal(avatarType(new TextEncoder().encode('<script>').buffer,'image/png'),null);
});
