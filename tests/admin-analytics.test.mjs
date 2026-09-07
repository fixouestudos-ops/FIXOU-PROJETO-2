import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker,{analyticsEventKey,adminOverviewReliable} from '../server/index.mjs';

const day=864e5;

function memoryDB({users=[],events=[],reports=[],suggestions=[],progress=null,duplicateEmail=null,authUser=null}){
 const captures={inserts:[],updates:[],upserts:[],deletes:[],audit:[]};
 const rows=users.map((u,i)=>({id:'u'+(i+1),name:'Aluno',email:'u'+(i+1)+'@example.com',role:'student',plan:'free',avatar_key:null,last_login_at:null,last_activity_at:null,created_at:Date.now(),...u}));
 const ev=events.map(e=>({user_id:e.user_id,event_type:e.event_type,metadata_json:JSON.stringify(e.metadata||{}),created_at:e.created_at}));
 const count=(t,uid)=>ev.filter(e=>e.event_type===t&&e.user_id===uid).length;
 const agg=rows.map(u=>({...u,questions:count('question_answered',u.id),sessions:count('study_session_started',u.id),correct:count('question_correct',u.id),incorrect:count('question_incorrect',u.id),skipped:count('question_skipped',u.id),flashcards:count('flashcard_reviewed',u.id)}));
 const db={prepare(sql){
  return {
   bind(){return this;},
   async first(){
    if(sql.includes('FROM auth_sessions s JOIN users'))return authUser||null;
    if(sql.includes('SELECT id FROM users WHERE email'))return duplicateEmail?{id:'dup'}:null;
    if(sql.includes('SELECT * FROM users WHERE email'))return duplicateEmail?null:rows[0]||null;
    if(sql.includes('FROM user_progress'))return progress;
    if(sql.includes('FROM password_reset_tokens'))return null;
    return null;
   },
   async run(){
    if(sql.includes('INSERT OR IGNORE INTO analytics_events'))captures.inserts.push({sql,kind:'event'});
    if(sql.includes('INSERT INTO admin_audit_logs'))captures.audit.push({sql});
    if(sql.includes('INSERT INTO auth_sessions'))captures.inserts.push({sql,kind:'session'});
    if(sql.includes('INSERT INTO users'))captures.inserts.push({sql,kind:'user'});
    if(sql.includes('INSERT INTO user_progress'))captures.upserts.push({sql});
    if(sql.includes('UPDATE '))captures.updates.push({sql});
    if(sql.includes('DELETE FROM'))captures.deletes.push({sql});
    return {success:true};
   },
   async all(){
    if(sql.includes('SUM(CASE WHEN e.event_type'))return {results:agg};
    if(sql.includes('FROM analytics_events'))return {results:ev};
    if(sql.includes('FROM question_reports'))return {results:reports};
    if(sql.includes('FROM suggestions'))return {results:suggestions};
    if(sql.includes('id,created_at,last_activity_at FROM users'))return {results:rows};
    return {results:[]};
   }
  };
 }};
 return {captures,db};
}
function assets(){
 const store=new Map();
 return {store,avatars:{
  async put(key,value){store.set(key,value);},
  async delete(key){store.delete(key);},
  async get(key){return store.get(key)?{body:store.get(key)}:null;}
 }};
}
const post=(path,headers,body,env)=>worker.fetch(new Request('https://fixou.test'+path,{method:'POST',headers,body:JSON.stringify(body)}),env);

test('migração mantém índice único de idempotência para eventos',()=>{
 const sql=fs.readFileSync(new URL('../drizzle/0000_accounts_analytics.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS idx_events_user_key ON analytics_events\(user_id,event_key\) WHERE event_key IS NOT NULL/);
});

test('evento duplicado da mesma resposta é gravado com a mesma chave e rejeita tipo arbitrário',async()=>{
 const started=Date.now();
 const {db,captures}=memoryDB({users:[{id:'u1',last_activity_at:started}],authUser:{id:'u1',role:'student',plan:'free',updated_at:1,last_activity_at:started}});
 const headers={cookie:'fixou_session=token','content-type':'application/json',origin:'https://fixou.test'};
 const a=await post('/api/events',headers,{eventType:'question_answered',metadata:{sessionId:'s1',questionId:'q1'}},{DB:db});
 const b=await post('/api/events',headers,{eventType:'question_answered',metadata:{sessionId:'s1',questionId:'q1'}},{DB:db});
 const bad=await post('/api/events',headers,{eventType:'fabricar_metricas',metadata:{}},{DB:db});
 const badMeta=await post('/api/events',headers,{eventType:'question_correct',metadata:{sessionId:'s1',questionId:'q1',rating:'x'.repeat(2000)}},{DB:db});
 assert.equal(a.status,202);assert.equal(b.status,202);assert.equal(bad.status,400);assert.equal(badMeta.status,400);
 assert.equal(captures.inserts.filter(x=>x.kind==='event').length,2);
});

test('chave de evento distingue sessões e questões; topic_viewed não acumula funil',()=>{
 assert.equal(analyticsEventKey('question_correct',{sessionId:'s',questionId:'q'}),'question_correct:s:q');
 assert.notEqual(analyticsEventKey('question_answered',{sessionId:'s',questionId:'q'}),analyticsEventKey('question_answered',{sessionId:'s',questionId:'q2'}));
 assert.equal(analyticsEventKey('topic_viewed',{topicId:'t'}),null);
 assert.equal(analyticsEventKey('study_session_completed',{sessionId:'s'}),'study_session_completed:s');
});

test('funil de ativação usa usuários únicos em cada etapa',async()=>{
 const t0=50*day;
 const scenario=['u1','u2','u3','u4','u5','u6','u7','u8'].map(id=>({id,created_at:t0}));
 const events=[
  {user_id:'u2',event_type:'study_session_started',created_at:t0+3600e3},
  {user_id:'u3',event_type:'question_answered',created_at:t0+3600e3},
  {user_id:'u4',event_type:'study_session_started',created_at:t0+600e3},
  {user_id:'u5',event_type:'study_session_started',created_at:t0},
  {user_id:'u5',event_type:'study_session_completed',created_at:t0+5400e3,metadata:{seconds:120}},
  {user_id:'u6',event_type:'flashcard_reviewed',created_at:t0+3600e3},
  {user_id:'u7',event_type:'flashcard_reviewed',created_at:t0+3600e3},
  {user_id:'u7',event_type:'flashcard_reviewed',created_at:t0+day+60e3},
  {user_id:'u7',event_type:'flashcard_reviewed',created_at:t0+2*day+3600e3},
  {user_id:'u7',event_type:'topic_mastery_updated',created_at:t0+7200e3,metadata:{score:85}},
  {user_id:'u8',event_type:'question_answered',created_at:t0+3600e3},
  {user_id:'u8',event_type:'question_answered',created_at:t0+day+3600e3}
 ];
 for(let k=0;k<12;k++)events.push({user_id:'u4',event_type:'question_answered',created_at:t0+600e3+k*60e3});
 const {db}=memoryDB({users:scenario,events});
 const data=await adminOverviewReliable({DB:db},30);
 assert.equal(data.counts.users,8);
 assert.deepEqual([...data.funnel.map(x=>x.label)],
  ['Conta criada','Iniciou primeiro treino','Respondeu primeira questão','Respondeu 10+ questões','Concluiu primeira sessão','Retornou ao FIXOU','Retornou em até 7 dias']);
 assert.deepEqual([...data.funnel.map(x=>x.value)],[8,3,3,1,1,2,2]);
 assert.deepEqual([...data.studyFunnel.map(x=>x.value)],[8,3,1,2,1,1,1,1]);
});

test('retenção D1, D7 e D30 é calculada com coortes elegíveis',async()=>{
 const t0=50*day;
 const users=[{id:'u1',created_at:t0},{id:'u2',created_at:t0},{id:'u3',created_at:t0}];
 const events=[
  {user_id:'u1',event_type:'question_answered',created_at:t0+day+60e3},
  {user_id:'u2',event_type:'flashcard_reviewed',created_at:t0+2*day+60e3},
  {user_id:'u3',event_type:'question_answered',created_at:t0+90e3}
 ];
 const {db}=memoryDB({users,events});
 const data=await adminOverviewReliable({DB:db},30);
 assert.equal(data.retention.d1.retained,1);
 assert.equal(data.retention.d7.retained,2);
 assert.equal(data.retention.d30.retained,2);
 assert.equal(data.retention.d1.eligible,3);
});

test('DAU, WAU e MAU não mudam com o filtro visual do período',async()=>{
 const now=Date.now();
 const users=['a','b','c','d'].map(id=>({id,created_at:now-60*day}));
 const events=[
  {user_id:'a',event_type:'question_answered',created_at:now-2*3600e3},
  {user_id:'b',event_type:'question_answered',created_at:now-10*day},
  {user_id:'c',event_type:'question_answered',created_at:now-20*day},
  {user_id:'d',event_type:'question_answered',created_at:now-40*day}
 ];
 const {db}=memoryDB({users,events});
 const s7=await adminOverviewReliable({DB:db},7),s90=await adminOverviewReliable({DB:db},90);
 assert.deepEqual([s7.metrics.dau,s7.metrics.wau,s7.metrics.mau],[1,1,3]);
 assert.deepEqual([s90.metrics.dau,s90.metrics.wau,s90.metrics.mau],[1,1,3]);
 assert.equal(s7.metrics.accuracy,0);
 assert.equal(s7.metrics.sessionCompletionRate,0);
});

test('progresso rejeita tamanho grande, conflito de revisão e aceita salvamento',async()=>{
 const started=Date.now();
 const user={id:'u1',role:'student',plan:'free',updated_at:1,last_activity_at:started};
 const {db}=memoryDB({authUser:user,progress:{server_revision:3}});
 const headers={cookie:'fixou_session=token','content-type':'application/json',origin:'https://fixou.test'};
 const put=body=>worker.fetch(new Request('https://fixou.test/api/progress',{method:'PUT',headers,body:JSON.stringify(body)}),{DB:db});
 const tooBig=await put({state:{version:1,pad:'x'.repeat(1600000)},clientSavedAt:started,baseRevision:3});
 assert.equal(tooBig.status,413);
 assert.equal((await tooBig.json()).code,'progress_too_large');
 const conflict=await put({state:{version:1,history:[]},clientSavedAt:started,baseRevision:2});
 assert.equal(conflict.status,409);
 assert.equal((await conflict.json()).code,'progress_conflict');
 const ok=await put({state:{version:1,history:[]},clientSavedAt:started,baseRevision:3});
 assert.equal(ok.status,200);
 assert.equal((await ok.json()).revision,4);
});

test('avatar valida assinatura, substitui, remove e respeita limite',async()=>{
 const started=Date.now();
 const png=Uint8Array.from([137,80,78,71,13,10,26,10]).buffer;
 const user={id:'u1',role:'student',plan:'free',updated_at:1,last_activity_at:null};
 const {db}=memoryDB({authUser:user});
 const av=assets();
 const env={DB:db,AVATARS:av.avatars};
 const putHeaders={'content-type':'image/png','content-length':String(png.byteLength),origin:'https://fixou.test',cookie:'fixou_session=token'};
 const up=await worker.fetch(new Request('https://fixou.test/api/avatar',{method:'PUT',headers:putHeaders,body:png}),env);
 assert.equal(up.status,200);
 assert.equal(av.store.size,1);
 const savedKey=[...av.store.keys()][0];
 assert.match(savedKey,/^avatars\/u1\//);
 user.avatar_key=savedKey;
 user.avatar_type='image/png';
 const wrong=await worker.fetch(new Request('https://fixou.test/api/avatar',{method:'PUT',headers:{'content-type':'image/png','content-length':'4',origin:'https://fixou.test',cookie:'fixou_session=token'},body:Uint8Array.from([1,2,3,4]).buffer}),env);
 assert.equal(wrong.status,415);
 const del=await worker.fetch(new Request('https://fixou.test/api/avatar',{method:'DELETE',headers:{origin:'https://fixou.test',cookie:'fixou_session=token'},body:'{}'}),env);
 assert.equal(del.status,200);
 assert.equal(av.store.size,0);
});