import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{passwordHash} from '../server/index.mjs';

let testCounter=0;

function statefulDB(user){
 const sessions=new Set();
 const loginFailures=new Map();
 const db={prepare(sql){
  const stmt={bound:[]};
  return {
   bind(...args){stmt.bound=stmt.bound.concat(args);return this;},
   async first(){
    if(sql.includes('FROM auth_sessions s JOIN users'))return sessions.has(stmt.bound[0])?user:null;
    if(sql.includes('SELECT * FROM users WHERE email')){
     const email=stmt.bound[0];
     if(user&&user.email===email)return user;
     return null;
    }
    if(sql.includes('SELECT id FROM users WHERE email')){
     const email=stmt.bound[0];
     if(user&&user.email===email)return {id:user.id};
     return null;
    }
    if(sql.includes('FROM password_reset_tokens'))return null;
    if(sql.includes('FROM user_progress'))return {state_json:user.progressJson,client_saved_at:1,server_revision:3,updated_at:1};
    if(sql.includes('FROM login_failures')){
     const key=stmt.bound[0];
     return loginFailures.get(key)||null;
    }
    return null;
   },
   async run(){
    if(sql.includes('INSERT INTO auth_sessions'))sessions.add(stmt.bound[2]);
    if(sql.includes('DELETE FROM auth_sessions')&&sql.includes('token_hash'))sessions.delete(stmt.bound[0]);
    if(sql.includes('INSERT INTO login_failures')||sql.includes('ON CONFLICT(email) DO UPDATE SET count')){
     const email=stmt.bound[0];
     const count=stmt.bound[1];
     const windowStart=stmt.bound[2];
     loginFailures.set(email,{email,count,window_start:windowStart});
    }
    if(sql.includes('UPDATE login_failures SET count=count+1')){
     const email=stmt.bound[0];
     const row=loginFailures.get(email);
     if(row)row.count++;
    }
    if(sql.includes('DELETE FROM login_failures')){
     const email=stmt.bound[0];
     loginFailures.delete(email);
    }
    return {success:true};
   },
   async all(){return {results:[]};}
  };
 }};
 return {db,sessions,loginFailures,activeSessions:()=>sessions.size};
}

function multiUserDB(users){
 const sessions=new Set();
 const loginFailures=new Map();
 const db={prepare(sql){
  const stmt={bound:[]};
  return {
   bind(...args){stmt.bound=stmt.bound.concat(args);return this;},
   async first(){
    if(sql.includes('FROM auth_sessions s JOIN users'))return sessions.has(stmt.bound[0])?users[0]:null;
    if(sql.includes('SELECT * FROM users WHERE email')){
     const email=stmt.bound[0];
     return users.find(u=>u.email===email)||null;
    }
    if(sql.includes('SELECT id FROM users WHERE email')){
     const email=stmt.bound[0];
     const found=users.find(u=>u.email===email);
     return found?{id:found.id}:null;
    }
    if(sql.includes('FROM password_reset_tokens'))return null;
    if(sql.includes('FROM user_progress'))return null;
    if(sql.includes('FROM login_failures')){
     const key=stmt.bound[0];
     return loginFailures.get(key)||null;
    }
    return null;
   },
   async run(){
    if(sql.includes('INSERT INTO auth_sessions'))sessions.add(stmt.bound[2]);
    if(sql.includes('DELETE FROM auth_sessions')&&sql.includes('token_hash'))sessions.delete(stmt.bound[0]);
    if(sql.includes('INSERT INTO login_failures')||sql.includes('ON CONFLICT(email) DO UPDATE SET count')){
     const email=stmt.bound[0];
     const count=stmt.bound[1];
     const windowStart=stmt.bound[2];
     loginFailures.set(email,{email,count,window_start:windowStart});
    }
    if(sql.includes('UPDATE login_failures SET count=count+1')){
     const email=stmt.bound[0];
     const row=loginFailures.get(email);
     if(row)row.count++;
    }
    if(sql.includes('DELETE FROM login_failures')){
     const email=stmt.bound[0];
     loginFailures.delete(email);
    }
    return {success:true};
   },
   async all(){return {results:[]};}
  };
 }};
 return {db,sessions,loginFailures,activeSessions:()=>sessions.size};
}

function testRequest(db,path,method,extraHeaders={},body,testIp){
 const allHeaders={...extraHeaders,'cf-connecting-ip':testIp||'test-'+testCounter};
 return worker.fetch(new Request('https://fixou.test'+path,{method,headers:allHeaders,...(body!==undefined?{body}:{})}),{DB:db});
}

const sessionToken=response=>{
 const cookie=response.headers.get('set-cookie')||'';
 const match=/fixou_session=([^;]+)/.exec(cookie);
 return {cookie,token:match[1]};
};

const jsonHeaders={origin:'https://fixou.test','content-type':'application/json'};

async function makeUser(suffix='1'){
 const salt='salt-'+suffix;
 return {id:'u-'+suffix,name:'Aluno '+suffix,email:`aluno${suffix}@example.com`,role:'student',plan:'free',avatar_key:null,created_at:1,last_login_at:1,last_activity_at:1,updated_at:1,password_salt:salt,password_hash:await passwordHash('senha123',salt),progressJson:JSON.stringify({version:1,answered:123})};
}

test('1. login correto funciona',async()=>{
 testCounter++;
 const user=await makeUser('1');
 const {db}=statefulDB(user);
 const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno1@example.com',password:'senha123'}));
 assert.equal(res.status,200);
 const body=await res.json();
 assert.equal(body.ok,true);
 assert.equal(body.user.email,'aluno1@example.com');
});

test('2. 20 logins corretos consecutivos no mesmo IP não bloqueiam',async()=>{
 testCounter++;
 const user=await makeUser('2');
 const {db}=statefulDB(user);
 for(let i=0;i<20;i++){
  const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno2@example.com',password:'senha123'}));
  assert.equal(res.status,200,`login ${i+1} deveria funcionar`);
 }
});

test('3. 100 usuários diferentes no mesmo IP conseguem autenticar',async()=>{
 testCounter++;
 const users=[];
 for(let i=0;i<100;i++){
  users.push(await makeUser(''+i));
 }
 const {db}=multiUserDB(users);
 for(let i=0;i<100;i++){
  const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:`aluno${i}@example.com`,password:'senha123'}));
  assert.equal(res.status,200,`aluno${i} deveria conseguir login`);
 }
});

test('4. falhas repetidas para mesmo email são limitadas',async()=>{
 testCounter++;
 const user=await makeUser('4');
 const {db,loginFailures}=statefulDB(user);
 for(let i=0;i<10;i++){
  const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno4@example.com',password:'senha errada'}));
  assert.equal(res.status,401,`falha ${i+1} deveria retornar 401`);
 }
 const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno4@example.com',password:'senha errada'}));
 assert.equal(res.status,429,`deveria bloquear após 10 falhas`);
 const body=await res.json();
 assert.match(body.error,/Muitas tentativas/);
});

test('5. login correto limpa/reduz falhas',async()=>{
 testCounter++;
 const user=await makeUser('5');
 const {db,loginFailures}=statefulDB(user);
 for(let i=0;i<9;i++){
  await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno5@example.com',password:'senha errada'}));
 }
 assert.ok(loginFailures.has('aluno5@example.com'),'deveria ter falhas registradas');
 const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno5@example.com',password:'senha123'}));
 assert.equal(res.status,200);
 assert.ok(!loginFailures.has('aluno5@example.com'),'falhas deveriam ser limpas após login correto');
});

test('6. outra conta no mesmo IP continua funcionando',async()=>{
 testCounter++;
 const user1={id:'u1',name:'User1',email:'user1@example.com',role:'student',plan:'free',avatar_key:null,created_at:1,last_login_at:1,last_activity_at:1,updated_at:1,password_salt:'s1',password_hash:await passwordHash('senha123','s1')};
 const user2={id:'u2',name:'User2',email:'user2@example.com',role:'student',plan:'free',avatar_key:null,created_at:1,last_login_at:1,last_activity_at:1,updated_at:1,password_salt:'s2',password_hash:await passwordHash('senha123','s2')};
 const {db}=multiUserDB([user1,user2]);
 for(let i=0;i<10;i++){
  await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'user1@example.com',password:'senha errada'}));
 }
 const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'user2@example.com',password:'senha123'}));
 assert.equal(res.status,200,'user2 deveria conseguir login mesmo com user1 com falhas');
});

test('7. ataque distribuído por vários emails é limitado pela proteção global',async()=>{
 testCounter++;
 const users=[];
 for(let i=0;i<101;i++){
  users.push({id:'v'+i,name:'V'+i,email:`victim${i}@example.com`,role:'student',plan:'free',avatar_key:null,created_at:1,last_login_at:1,last_activity_at:1,updated_at:1,password_salt:'s',password_hash:await passwordHash('senha123','s')});
 }
 const {db}=multiUserDB(users);
 for(let i=0;i<100;i++){
  await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:`victim${i}@example.com`,password:'senha errada'}));
 }
 const res=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'victim100@example.com',password:'senha errada'}));
 assert.equal(res.status,429,'deveria bloquear após 100 tentativas do mesmo IP');
});

test('8. respostas continuam não revelando existência da conta',async()=>{
 testCounter++;
 const user=await makeUser('8');
 const {db}=statefulDB(user);
 const res1=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'naoexiste@example.com',password:'senha123'}));
 assert.equal(res1.status,401);
 const body1=await res1.json();
 assert.equal(body1.error,'E-mail ou senha incorretos.');
 const res2=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno8@example.com',password:'errada'}));
 assert.equal(res2.status,401);
 const body2=await res2.json();
 assert.equal(body2.error,'E-mail ou senha incorretos.');
 assert.equal(body1.error,body2.error,'mensagens deveriam ser idênticas');
});

test('9. sessão continua funcionando',async()=>{
 testCounter++;
 const user=await makeUser('9');
 const {db}=statefulDB(user);
 const login=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno9@example.com',password:'senha123'}));
 assert.equal(login.status,200);
 const {token}=sessionToken(login);
 const session=await testRequest(db,'/api/auth/session','GET',{cookie:'fixou_session='+token});
 assert.equal(session.status,200);
 const body=await session.json();
 assert.equal(body.user.email,'aluno9@example.com');
 const progress=await testRequest(db,'/api/progress','GET',{cookie:'fixou_session='+token});
 assert.equal(progress.status,200);
 assert.equal((await progress.json()).progress.state.answered,123);
});

test('10. logout continua funcionando',async()=>{
 testCounter++;
 const user=await makeUser('10');
 const {db,activeSessions}=statefulDB(user);
 const login=await testRequest(db,'/api/auth/login','POST',jsonHeaders,JSON.stringify({email:'aluno10@example.com',password:'senha123'}));
 assert.equal(login.status,200);
 const {token}=sessionToken(login);
 assert.equal(activeSessions(),1);
 const logout=await testRequest(db,'/api/auth/logout','POST',{cookie:'fixou_session='+token,'content-type':'application/json','origin':'https://fixou.test'},JSON.stringify({}));
 assert.equal(logout.status,200);
 assert.equal(activeSessions(),0);
 const after=await testRequest(db,'/api/auth/session','GET',{cookie:'fixou_session='+token});
 assert.equal((await after.json()).user,null);
});
