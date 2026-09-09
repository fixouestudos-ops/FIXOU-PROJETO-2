import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker,{passwordHash} from '../server/index.mjs';

function statefulDB(user){
 const sessions=new Set();
 const captures={deletedSessionRuns:0};
 const db={prepare(sql){
  const stmt={bound:[]};
  return {
   bind(...args){stmt.bound=stmt.bound.concat(args);return this;},
   async first(){
    if(sql.includes('FROM auth_sessions s JOIN users'))return sessions.has(stmt.bound[0])?user:null;
    if(sql.includes('SELECT id FROM users WHERE email'))return user;
    if(sql.includes('SELECT * FROM users WHERE email'))return user;
    if(sql.includes('FROM password_reset_tokens'))return null;
    if(sql.includes('FROM user_progress'))return {state_json:user.progressJson,client_saved_at:1,server_revision:3,updated_at:1};
    return null;
   },
   async run(){
    if(sql.includes('INSERT INTO auth_sessions'))sessions.add(stmt.bound[2]);
    if(sql.includes('DELETE FROM auth_sessions')&&sql.includes('token_hash')){sessions.delete(stmt.bound[0]);captures.deletedSessionRuns++;}
    return {success:true};
   },
   async all(){return {results:[]};}
  };
 }};
 return {db,captures,activeSessions:()=>sessions.size};
}
const request=(db,path,method,headers={},body)=>worker.fetch(new Request('https://fixou.test'+path,{method,headers,...(body!==undefined?{body}:{})}),{DB:db});
const sessionToken=response=>{
 const cookie=response.headers.get('set-cookie')||'';
 const match=/fixou_session=([^;]+)/.exec(cookie);
 assert.ok(match,'set-cookie com fixou_session presente');
 return {cookie,token:match[1]};
};

test('logout real: login → encerra sessão no backend → token antigo inválido → re-login preservando progresso',async()=>{
 const salt='salt-de-teste';
 const user={id:'u1',name:'Aluno',email:'aluno@example.com',role:'student',plan:'free',avatar_key:null,created_at:1,last_login_at:1,last_activity_at:1,updated_at:1,password_salt:salt,password_hash:await passwordHash('senha123',salt),progressJson:JSON.stringify({version:1,answered:123})};
 const {db,captures,activeSessions}=statefulDB(user);
 const loginHeaders={origin:'https://fixou.test','content-type':'application/json'};

 // 1) login gera sessão válida
 const login=await request(db,'/api/auth/login','POST',loginHeaders,JSON.stringify({email:'aluno@example.com',password:'senha123'}));
 assert.equal(login.status,200);
 const {token}=sessionToken(login);

 // 2) sessão autenticada responde e progresso existe
 const me=await request(db,'/api/auth/session','GET',{cookie:'fixou_session='+token});
 assert.equal(me.status,200);
 assert.equal((await me.json()).user.email,'aluno@example.com');
 const progress=await request(db,'/api/progress','GET',{cookie:'fixou_session='+token});
 assert.equal(progress.status,200);
 assert.equal((await progress.json()).progress.state.answered,123);

 // 3) logout invalida a sessão no backend e limpa o cookie
 const out=await request(db,'/api/auth/logout','POST',{cookie:'fixou_session='+token,'content-type':'application/json','origin':'https://fixou.test'},JSON.stringify({}));
 assert.equal(out.status,200);
 assert.deepEqual(await out.json(),{ok:true});
 assert.match(out.headers.get('set-cookie')||'',/Max-Age=0/);
 assert.equal(captures.deletedSessionRuns,1);
 assert.equal(activeSessions(),0);

 // 4) token antigo não funciona mais e áreas protegidas devolvem 401
 const after=await request(db,'/api/auth/session','GET',{cookie:'fixou_session='+token});
 assert.equal((await after.json()).user,null);
 const denied=await request(db,'/api/progress','GET',{cookie:'fixou_session='+token});
 assert.equal(denied.status,401);

 // 5) login novamente funciona e o progresso continua salvo
 const login2=await request(db,'/api/auth/login','POST',loginHeaders,JSON.stringify({email:'aluno@example.com',password:'senha123'}));
 assert.equal(login2.status,200);
 const {token:token2}=sessionToken(login2);
 assert.notEqual(token2,token);
 const progress2=await request(db,'/api/progress','GET',{cookie:'fixou_session='+token2});
 assert.equal(progress2.status,200);
 assert.equal((await progress2.json()).progress.state.answered,123);
});

test('owner perde acesso ao painel administrativo após o logout',async()=>{
 const salt='salt-dono';
 const owner={id:'o1',name:'Dono',email:'dono@example.com',role:'owner',plan:'pro',avatar_key:null,created_at:1,last_login_at:1,last_activity_at:1,updated_at:1,password_salt:salt,password_hash:await passwordHash('senha123',salt)};
 const {db}=statefulDB(owner);
 const loginHeaders={origin:'https://fixou.test','content-type':'application/json'};

 const login=await request(db,'/api/auth/login','POST',loginHeaders,JSON.stringify({email:'dono@example.com',password:'senha123'}));
 assert.equal(login.status,200);
 const {token}=sessionToken(login);
 const authHeaders={cookie:'fixou_session='+token};

 const overview=await request(db,'/api/admin/overview','GET',authHeaders);
 assert.equal(overview.status,200);

 await request(db,'/api/auth/logout','POST',{...authHeaders,'content-type':'application/json','origin':'https://fixou.test'},JSON.stringify({}));

 const after=await request(db,'/api/admin/overview','GET',authHeaders);
 assert.equal(after.status,401);

 const relogin=await request(db,'/api/auth/login','POST',loginHeaders,JSON.stringify({email:'dono@example.com',password:'senha123'}));
 assert.equal(relogin.status,200);
 const {token:token2}=sessionToken(relogin);
 const again=await request(db,'/api/admin/overview','GET',{cookie:'fixou_session='+token2});
 assert.equal(again.status,200);
});

test('bundle traz menu de conta na sidebar e Sair nas Configurações',()=>{
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const scriptTag=html.match(/<script src="assets\/([^"]+)"><\/script>/);
 assert.ok(scriptTag,'script tag com src não encontrado');
 const js=fs.readFileSync(new URL('../dist/assets/'+scriptTag[1],import.meta.url),'utf8');
 assert.match(js,/data-action="profile-settings"/);
 assert.match(js,/nav-logout/);
 assert.match(js,/data-action="logout"/);
 assert.match(js,/Sair da conta/);
 assert.match(js,/performLogout/);
 assert.match(js,/\/api\/auth\/logout/);
 assert.match(js,/Saindo…/);
});