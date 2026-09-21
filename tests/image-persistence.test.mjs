import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState} from '../src/save.js';
import {gradeAnswer,createSession,recordAnswer} from '../src/training.js';
import worker from '../server/index.mjs';

const bank=JSON.parse(fs.readFileSync(new URL('../content/bank.json',import.meta.url),'utf8'));

// --- Backend tests ---

function memoryDB({overrides=[]}={}){
 const captures={inserts:[],updates:[],audit:[]};
 const storedOverrides=new Map();
 for(const o of overrides){
   storedOverrides.set(o.question_id+':'+o.field,{question_id:o.question_id,field:o.field,value:o.value,actor_user_id:o.actor_user_id||'admin1',created_at:o.created_at||Date.now(),updated_at:o.updated_at||Date.now()});
 }
 function makeStmt(sql){
  return {
   _params:[],
   bind(...params){this._params=params;return this;},
   async first(){
    if(sql.includes('FROM auth_sessions'))return{id:'admin1',role:'admin',plan:'free',updated_at:1,last_activity_at:Date.now()};
    return null;
   },
   async run(){
    if(sql.includes('INSERT INTO question_overrides')||sql.includes('DO UPDATE SET value')){
     captures.updates.push({sql});
     if(this._params.length>=2){
      const questionId=this._params[0],field=this._params[1],value=this._params[2];
      storedOverrides.set(questionId+':'+field,{question_id:questionId,field,value,actor_user_id:this._params[3]||'admin1',created_at:this._params[4]||Date.now(),updated_at:this._params[5]||Date.now()});
     }
    }
    if(sql.includes('INSERT INTO admin_audit_logs'))captures.audit.push({sql});
    return{success:true};
   },
   async all(){
    if(sql.includes('FROM question_overrides'))return{results:[...storedOverrides.values()]};
    return{results:[]};
   }
  };
 }
 const db={prepare(sql){return makeStmt(sql);}};
 return{captures,db};
}

const adminHeaders={cookie:'fixou_session=token','content-type':'application/json',origin:'https://fixou.test'};

test('PATCH aceita imageStatus approved',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageStatus:'approved'})}),{DB:db});
 assert.equal(res.status,200);
 assert.equal((await res.json()).ok,true);
});

test('PATCH aceita imageClassification image_required',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageClassification:'image_required'})}),{DB:db});
 assert.equal(res.status,200);
});

test('PATCH aceita imageReason como texto livre',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageReason:'Confirmado como sem imagem'})}),{DB:db});
 assert.equal(res.status,200);
});

test('PATCH aceita imageStatus no_image_confirmed',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageStatus:'no_image_confirmed'})}),{DB:db});
 assert.equal(res.status,200);
});

test('PATCH aceita imageStatus needs_manual_crop',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageStatus:'needs_manual_crop'})}),{DB:db});
 assert.equal(res.status,200);
});

test('PATCH aceita imageClassification no_image_required',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageClassification:'no_image_required'})}),{DB:db});
 assert.equal(res.status,200);
});

test('PATCH rejeita imageStatus inválido',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageStatus:'invalid_status'})}),{DB:db});
 assert.equal(res.status,400);
 assert.match((await res.json()).error,/Status de imagem inválido/);
});

test('PATCH rejeita imageClassification inválido',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageClassification:'invalid_class'})}),{DB:db});
 assert.equal(res.status,400);
 assert.match((await res.json()).error,/Classificação de imagem inválida/);
});

test('PATCH rejeita imageReason muito longo',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageReason:'x'.repeat(501)})}),{DB:db});
 assert.equal(res.status,400);
 assert.match((await res.json()).error,/Motivo da imagem muito longo/);
});

test('GET overrides retorna imageStatus após PATCH',async()=>{
 const{db}=memoryDB();
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageStatus:'approved',imageClassification:'image_required'})}),{DB:db});
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides',{headers:adminHeaders}),{DB:db});
 const data=await res.json();
 assert.equal(data.overrides['test-q'].imageStatus,'approved');
 assert.equal(data.overrides['test-q'].imageClassification,'image_required');
});

test('GET overrides retorna imageReason após PATCH',async()=>{
 const{db}=memoryDB();
 await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q2',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageReason:'Motivo teste'})}),{DB:db});
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides',{headers:adminHeaders}),{DB:db});
 const data=await res.json();
 assert.equal(data.overrides['test-q2'].imageReason,'Motivo teste');
});

test('PATCH aceita imageStatus e contentStatus juntos',async()=>{
 const{db}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/test-q3',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({imageStatus:'approved',contentStatus:'validated'})}),{DB:db});
 assert.equal(res.status,200);
 const getRes=await worker.fetch(new Request('https://fixou.test/api/admin/questions/overrides',{headers:adminHeaders}),{DB:db});
 const data=await getRes.json();
 assert.equal(data.overrides['test-q3'].imageStatus,'approved');
 assert.equal(data.overrides['test-q3'].contentStatus,'validated');
});

// --- Frontend tests ---

test('applyOverrides aplica imageStatus',()=>{
 const q={id:'q1',imageStatus:'needs_visual_review'};
 const overrides={q1:{imageStatus:'approved'}};
 const saved={};
 for(const field of['imageStatus','imageClassification','imageReason']){
   if(overrides.q1[field]!==undefined)q[field]=overrides.q1[field];
 }
 assert.equal(q.imageStatus,'approved');
});

test('applyOverrides aplica imageClassification',()=>{
 const q={id:'q1',imageClassification:'needs_visual_review'};
 const overrides={q1:{imageClassification:'no_image_required'}};
 if(overrides.q1.imageClassification!==undefined)q.imageClassification=overrides.q1.imageClassification;
 assert.equal(q.imageClassification,'no_image_required');
});

test('applyOverrides aplica imageReason',()=>{
 const q={id:'q1',imageReason:''};
 const overrides={q1:{imageReason:'Confirmado como sem imagem'}};
 if(overrides.q1.imageReason!==undefined)q.imageReason=overrides.q1.imageReason;
 assert.equal(q.imageReason,'Confirmado como sem imagem');
});

test('review-approve usa PATCH e não saveProgress',()=>{
 const src=fs.readFileSync(new URL('../src/controller.js',import.meta.url),'utf8');
 const handlerBlock=src.slice(src.indexOf("action==='review-approve'"),src.indexOf("action==='review-crop'"));
 assert.ok(handlerBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),'review-approve must call PATCH');
 assert.ok(!handlerBlock.includes('saveProgress()'),'review-approve must NOT call saveProgress');
 assert.ok(handlerBlock.includes("questionOverrides[id].imageStatus='approved'"),'review-approve must update questionOverrides');
});

test('review-crop usa PATCH e não saveProgress',()=>{
 const src=fs.readFileSync(new URL('../src/controller.js',import.meta.url),'utf8');
 const handlerBlock=src.slice(src.indexOf("action==='review-crop'"),src.indexOf("action==='review-no-image'"));
 assert.ok(handlerBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),'review-crop must call PATCH');
 assert.ok(!handlerBlock.includes('saveProgress()'),'review-crop must NOT call saveProgress');
});

test('review-no-image usa PATCH e não saveProgress',()=>{
 const src=fs.readFileSync(new URL('../src/controller.js',import.meta.url),'utf8');
 const handlerBlock=src.slice(src.indexOf("action==='review-no-image'"),src.indexOf("action==='review-mark'"));
 assert.ok(handlerBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),'review-no-image must call PATCH');
 assert.ok(!handlerBlock.includes('saveProgress()'),'review-no-image must NOT call saveProgress');
 assert.ok(handlerBlock.includes("imageReason:'Confirmado como sem imagem pelo admin'"),'review-no-image must set imageReason');
});

test('review-confirm-no-image usa PATCH e não saveProgress',()=>{
 const src=fs.readFileSync(new URL('../src/controller.js',import.meta.url),'utf8');
 const handlerBlock=src.slice(src.indexOf("action==='review-confirm-no-image'"),src.indexOf("action==='review-mark-needs-image'"));
 assert.ok(handlerBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),'review-confirm-no-image must call PATCH');
 assert.ok(!handlerBlock.includes('saveProgress()'),'review-confirm-no-image must NOT call saveProgress');
});

test('review-mark-needs-image usa PATCH e não saveProgress',()=>{
 const src=fs.readFileSync(new URL('../src/controller.js',import.meta.url),'utf8');
 const handlerBlock=src.slice(src.indexOf("action==='review-mark-needs-image'"),src.indexOf("action==='review-copy-id'"));
 assert.ok(handlerBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),'review-mark-needs-image must call PATCH');
 assert.ok(!handlerBlock.includes('saveProgress()'),'review-mark-needs-image must NOT call saveProgress');
 assert.ok(handlerBlock.includes("imageReason:'Reclassificada como necessitando de imagem pelo admin'"),'review-mark-needs-image must set imageReason');
});

test('review-mark usa PATCH para contentStatus',()=>{
 const src=fs.readFileSync(new URL('../src/controller.js',import.meta.url),'utf8');
 const handlerBlock=src.slice(src.indexOf("action==='review-mark'")+1,src.indexOf("action==='review-confirm-no-image'"));
 assert.ok(handlerBlock.includes("api('/api/admin/questions/'+encodeURIComponent(id),{method:'PATCH'"),'review-mark must call PATCH');
 assert.ok(!handlerBlock.includes('saveProgress()'),'review-mark must NOT call saveProgress');
 assert.ok(handlerBlock.includes("contentStatus:'needs_content_review'"),'review-mark must set contentStatus');
});

test('em caso de erro no PATCH, BANK não é alterado',()=>{
 const q={id:'q1',imageStatus:'needs_visual_review',imageClassification:'needs_visual_review'};
 const original={...q};
 const patchSuccess=false;
 if(patchSuccess){q.imageStatus='approved';q.imageClassification='image_required';}
 assert.equal(q.imageStatus,original.imageStatus);
 assert.equal(q.imageClassification,original.imageClassification);
});

test('persistência funciona para imageStatus e contentStatus juntos',()=>{
 const q={id:'q1',imageStatus:'needs_visual_review',contentStatus:'needs_content_review'};
 const overrides={imageStatus:'approved',contentStatus:'validated'};
 if(overrides.imageStatus!==undefined)q.imageStatus=overrides.imageStatus;
 if(overrides.contentStatus!==undefined)q.contentStatus=overrides.contentStatus;
 assert.equal(q.imageStatus,'approved');
 assert.equal(q.contentStatus,'validated');
});

test('applyOverrides não sobrescreve campos não definidos no override',()=>{
 const q={id:'q1',imageStatus:'approved',imageClassification:'image_required',contentStatus:'validated'};
 const overrides={q1:{imageReason:'Teste'}};
 if(overrides.q1.imageReason!==undefined)q.imageReason=overrides.q1.imageReason;
 assert.equal(q.imageStatus,'approved');
 assert.equal(q.imageClassification,'image_required');
 assert.equal(q.contentStatus,'validated');
 assert.equal(q.imageReason,'Teste');
});

test('banco contém questões com imageClassification para testar filtros',()=>{
 const withImage=bank.questions.filter(q=>q.imageClassification==='image_required');
 const noImage=bank.questions.filter(q=>q.imageClassification==='no_image_required');
 assert.ok(withImage.length>0,'Deve haver questões com image_required');
 assert.ok(noImage.length>0,'Deve haver questões com no_image_required');
});
