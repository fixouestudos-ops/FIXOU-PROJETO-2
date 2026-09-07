import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('HTML empacotado inicializa e protege o conteúdo sem sessão',async()=>{
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'bundle inline não encontrado');
 const classes={add(){},remove(){},toggle(){}};
 const app={innerHTML:''},modal={innerHTML:'',open:false,showModal(){this.open=true;},close(){this.open=false;}},toast={textContent:'',classList:classes};
 const document={documentElement:{dataset:{},style:{setProperty(){}},classList:classes},querySelector(selector){return selector==='#app'?app:selector==='#modal'?modal:selector==='#toast'?toast:null;},addEventListener(){}};
 const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
 const window={matchMedia:()=>({matches:false}),addEventListener(){},scrollTo(){}};
 const context={document,window,location:{hash:'#train'},history:{replaceState(){}},localStorage,console,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,JSON,Intl,URL,Blob,FormData,fetch:()=>Promise.resolve({ok:true,json:async()=>({ok:true,user:null})}),crypto:globalThis.crypto,structuredClone};
 vm.runInNewContext(script,context,{filename:'dist/index.html'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(app.innerHTML,/Entre no FIXOU/);
 assert.match(app.innerHTML,/id="login-form"/);
});
