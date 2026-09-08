import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,passwordMatches} from '../server/index.mjs';

const LIMIT=100000;

async function deriveBitsCalls(fn){
 const calls=[],target=crypto.subtle;
 let original=null;
 try{
  original=target.deriveBits;
  Object.defineProperty(target,'deriveBits',{value:function(opts,key,length){calls.push(opts.iterations);return original.call(this,opts,key,length);},configurable:true});
 }catch{}
 try{await fn();}finally{if(original)try{Object.defineProperty(target,'deriveBits',{value:original,configurable:true});}catch{}}
 return calls;
}

test('padrão de hash solicita no máximo 100000 iterações (limite do Cloudflare Workers)',async()=>{
 const calls=await deriveBitsCalls(async()=>{
  const salt='salt';
  const stored=await passwordHash('senha-valida');
  assert.equal(await passwordMatches('senha-valida',salt,stored),true);
  assert.equal(await passwordMatches('senha-errada',salt,stored),false);
 });
 assert.ok(calls.length>=3,'espera pelo menos hash+renomeador de comparações derivando chaves');
 for(const iterations of calls)assert.ok(iterations<=LIMIT,`PBKDF2 solicitou ${iterations} iterações (acima de ${LIMIT})`);
});

test('formato armazenado versiona algoritmo, versão, iterações, salt e hash',async()=>{
 const stored=await passwordHash('senha-valida','salt-exemplo');
 const parts=stored.split('$');
 assert.equal(parts.length,5);
 assert.equal(parts[0],'pbkdf2sha256');
 assert.equal(parts[1],'1');
 assert.ok(Number(parts[2])<=LIMIT,'iterações do formato excedem o limite');
 assert.equal(parts[3],'salt-exemplo');
 assert.match(parts[4],/^[0-9a-f]{64}$/);
});

test('valor centralizado permanece igual ao gravado e ao usado na verificação',async()=>{
 const salt='memesalt';
 const stored=await passwordHash('senha-valida',salt);
 assert.ok(Number(stored.split('$')[2])<=LIMIT);
 assert.equal(await passwordMatches('senha-valida',salt,stored),true);
});

test('formato antigo sem envelope continua sendo lido com o salt da coluna',async()=>{
 const salt='colunasalt';
 const full=await passwordHash('senha-valida',salt,LIMIT);
 const legacy=full.split('$').pop();
 assert.equal(await passwordMatches('senha-valida',salt,legacy),true);
 assert.equal(await passwordMatches('senha-errada',salt,legacy),false);
});

test('envelope com iterações acima do limite é recusado sem disparar PBKDF2',async()=>{
 const calls=await deriveBitsCalls(async()=>{
  const legacy=await passwordMatches('qualquer','salt','pbkdf2sha256$1$210000$salt$'+'a'.repeat(64));
  assert.equal(legacy,false);
 });
 for(const iterations of calls)assert.ok(iterations<=LIMIT,`PBKDF2 foi solicitado com ${iterations} iterações`);
});