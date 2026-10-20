import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {reviewScreen,aiAuditCompare,aiAuditStatus,hasImagePendency,isBlockedForStudent} from '../src/screens-review.js';
import {AI_AUDIT_BATCH} from '../src/ai-audit-batch.js';
import {AI_AUDIT_BASELINE} from '../src/ai-audit-baseline.js';
import {matchesQuestion} from '../src/training.js';
import worker from '../server/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(readFileSync(path.join(root,'content/bank.json'),'utf8'));
const q5='fis-lic-l1-f1-c1-exercicios-propostos-q5';
const prodFixture=JSON.parse(readFileSync(path.join(root,'tests/fixtures/ai-audit-prod-states.json'),'utf8'));

test('lote AI auditing possui exatamente 81 IDs únicos',()=>{
 assert.equal(AI_AUDIT_BATCH.ids.length,81);
 assert.equal(new Set(AI_AUDIT_BATCH.ids).size,81);
 assert.equal(AI_AUDIT_BATCH.total,81);
 assert.equal(AI_AUDIT_BATCH.batchId,'master-release-01-09');
});

test('q5 faz parte do lote com override preservado',()=>{
 assert.ok(AI_AUDIT_BATCH.ids.includes(q5));
 assert.equal(AI_AUDIT_BATCH.preservedOverrideId,q5);
});

test('nenhuma outra questão pendente entrou no lote por engano',()=>{
 assert.ok(!AI_AUDIT_BATCH.ids.includes('fis-lic-l1-f1-c1-revisando-q3'));
 assert.ok(!AI_AUDIT_BATCH.ids.includes('fis-lic-l1-f1-c5-exercicios-propostos-q7'));
});

test('todos os 81 IDs existem no banco e seguem marcados para revisão',()=>{
 const byId=new Map(bank.questions.map(q=>[q.id,q]));
 for(const id of AI_AUDIT_BATCH.ids){
  const q=byId.get(id);
  assert.ok(q,'questão ausente no banco: '+id);
  assert.equal(q.contentStatus,'needs_content_review','status inesperado em '+id);
 }
});

test('baseline cobre os 81 IDs com versão anterior real dos lotes',()=>{
 assert.equal(Object.keys(AI_AUDIT_BASELINE).length,81);
 let l01=0,l08=0,lT=0;
 for(const id of AI_AUDIT_BATCH.ids){
  const entry=AI_AUDIT_BASELINE[id];
  assert.ok(entry,'baseline ausente: '+id);
  assert.ok(['349abd2','b4a57e4','87847b1'].includes(entry.commit),'commit inesperado: '+entry.commit);
  assert.ok(['01-07','08-09','l01-textual'].includes(entry.lot),'lote inesperado: '+entry.lot);
  assert.ok(entry.before.prompt&&entry.before.prompt.length>10,'baseline sem enunciado: '+id);
  assert.ok(entry.before.options===undefined||Array.isArray(entry.before.options),'baseline com alternativas inválidas: '+id);
  assert.ok(entry.before.answer!==undefined,'baseline sem gabarito: '+id);
  assert.ok(entry.before.explanation!==undefined,'baseline sem explicação: '+id);
  if(entry.lot==='01-07')l01++;else if(entry.lot==='08-09')l08++;else lT++;
 }
 assert.equal(l01,51);
 assert.equal(lT,20);
 assert.equal(l08,10);
});

function aiBank(mutate){
 const questions=bank.questions.filter(q=>AI_AUDIT_BATCH.ids.includes(q.id)).map(q=>({...q}));
 if(mutate)mutate(questions);
 return {questions};
}
function renderAi(bankInput,extra={}){
 return reviewScreen({bank:bankInput,reviewFilter:'ai_audit',reviewSearch:'',reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',...extra});
}
function panelValues(html){
 const section=html.slice(html.indexOf('ai-panel'),html.indexOf('ai-subtabs'));
 return [...section.matchAll(/ai-stat-value">(\d+)</g)].map(m=>Number(m[1]));
}

test('painel inicia com 81 aguardando, 0 aprovadas, 0 não aprovadas',()=>{
 const html=renderAi(aiBank());
 assert.deepEqual(panelValues(html),[81,81,0,0]);
 assert.ok(html.includes('AI auditing'));
 assert.ok(html.includes('Total corrigidas por IA'));
 assert.ok(html.includes('Aguardando auditoria'));
 assert.ok(html.includes('Aprovadas por mim'));
 assert.ok(html.includes('Nenhuma questão é validada automaticamente.')||html.includes('Nenhuma questão é validada automaticamente'));
 assert.equal((html.match(/data-action="ai-audit-open"/g)||[]).length,81);
});

test('aprovação manual atualiza contadores imediatamente',()=>{
 const html=renderAi(aiBank(qs=>{const t=qs.find(q=>q.id===AI_AUDIT_BATCH.ids[0]);t.contentStatus='validated';}));
 assert.deepEqual(panelValues(html),[81,80,1,0]);
});

test('não aprovação atualiza contadores e histórico permanece acessível',()=>{
 const html=renderAi(aiBank(qs=>{const t=qs.find(q=>q.id===AI_AUDIT_BATCH.ids[0]);t.contentStatus='not_approved';}));
 assert.deepEqual(panelValues(html),[81,80,0,1]);
 assert.equal((html.match(/data-action="ai-audit-open"/g)||[]).length,81);
});

test('filtros da aba separam aguardando, aprovadas e não aprovadas',()=>{
 const validated=AI_AUDIT_BATCH.ids[0],rejected=AI_AUDIT_BATCH.ids[1];
 const mutated=aiBank(qs=>{
  qs.find(q=>q.id===validated).contentStatus='validated';
  qs.find(q=>q.id===rejected).contentStatus='not_approved';
 });
 const approved=renderAi(mutated,{reviewAiFilter:'approved'});
 assert.equal((approved.match(/data-action="ai-audit-open"/g)||[]).length,1);
 assert.ok(approved.includes(validated));
 const rejectedHtml=renderAi(mutated,{reviewAiFilter:'rejected'});
 assert.equal((rejectedHtml.match(/data-action="ai-audit-open"/g)||[]).length,1);
 assert.ok(rejectedHtml.includes(rejected));
  const awaiting=renderAi(mutated,{reviewAiFilter:'awaiting'});
  assert.equal((awaiting.match(/data-action="ai-audit-open"/g)||[]).length,79);
});

test('busca por ID e por palavras do enunciado filtra a lista',()=>{
 const byId=renderAi(aiBank(),{reviewSearch:AI_AUDIT_BATCH.ids[3]});
 assert.equal((byId.match(/data-action="ai-audit-open"/g)||[]).length,1);
 const first=bank.questions.find(q=>q.id===AI_AUDIT_BATCH.ids[0]);
 const word=(first.prompt.match(/[A-Za-zÀ-ú]{9,}/g)||[])[0];
 assert.ok(word,'enunciado sem palavra longa para o teste');
 const expected=aiBank().questions.filter(q=>(q.prompt||'').toLowerCase().includes(word.toLowerCase())).length;
 assert.ok(expected>=1&&expected<81,'palavra pouco distintiva: '+word);
 const byText=renderAi(aiBank(),{reviewSearch:word});
 assert.equal((byText.match(/data-action="ai-audit-open"/g)||[]).length,expected);
});

test('questões pendentes aparecem primeiro na lista',()=>{
 const validatedId=AI_AUDIT_BATCH.ids[5];
 const order=renderAi(aiBank(qs=>{qs.find(q=>q.id===validatedId).contentStatus='validated';}));
 const rows=[...order.matchAll(/data-action="ai-audit-open" data-id="(\d+)"><span class="ai-row-index">\d+<\/span><span class="ai-row-id"><code>([^<]+)<\/code>/g)];
 assert.equal(rows.length,81);
 const posValidated=rows.findIndex(r=>r[2]===validatedId);
 assert.equal(posValidated,80,'validada deve ficar no fim');
 assert.equal(rows[0][2],AI_AUDIT_BATCH.ids[0]);
});

test('detalhe exibe enunciado, alternativas, gabarito, explicação e info de auditoria',()=>{
 const html=renderAi(aiBank());
 assert.ok(html.includes('Explicação'));
 assert.ok(html.includes('Informações de auditoria'));
 assert.ok(html.includes('Correção assistida por IA'));
 assert.ok(html.includes('Versão anterior não disponível')===false);
 assert.ok(html.includes('Antes da correção'));
 assert.ok(html.includes('Depois da correção'));
 assert.ok(html.includes('alterado'));
});

test('detalhe oferece exatamente as ações do Owner sem aprovação automática',()=>{
 const html=renderAi(aiBank());
 assert.ok(html.includes('data-action="ai-audit-approve"'));
 assert.ok(html.includes('Aprovar correção'));
 assert.ok(html.includes('data-action="ai-audit-not-approve"'));
 assert.ok(html.includes('✕ Não aprovar'));
 assert.ok(html.includes('data-action="review-edit"'));
 assert.ok(html.includes('Editar correção'));
 assert.ok(!html.includes("contentStatus:'validated'"));
});

test('aiAuditCompare usa baseline real e sinaliza indisponibilidade',()=>{
 const real=bank.questions.find(q=>q.id===AI_AUDIT_BATCH.ids[0]);
 const cmp=aiAuditCompare({...real});
 assert.equal(cmp.available,true);
 assert.ok(cmp.anyChanged===true);
 assert.ok(['349abd2','b4a57e4'].includes(cmp.commit));
 const fake=aiAuditCompare({id:'fora-do-lote'});
 assert.equal(fake.available,false);
});

test('aiAuditStatus deriva do status de conteúdo sem novo estado',()=>{
 assert.equal(aiAuditStatus({contentStatus:'validated'}),'approved');
 assert.equal(aiAuditStatus({contentStatus:'not_approved'}),'rejected');
 assert.equal(aiAuditStatus({contentStatus:'needs_content_review'}),'awaiting');
 assert.equal(aiAuditStatus({contentStatus:'pending'}),'awaiting');
 assert.equal(aiAuditStatus({}),'awaiting');
});

test('tela de revisão comum ganhou a aba AI auditing sem mudar os demais filtros',()=>{
 const html=reviewScreen({bank:{questions:[]},reviewFilter:'all'});
 assert.ok(html.includes('data-filter="ai_audit"'));
 assert.ok(html.includes('AI auditing'));
});

test('nenhum PATCH de conteúdo é disparado pela renderização da tela',()=>{
 const src=readFileSync(path.join(root,'src/screens-review.js'),'utf8');
 assert.ok(!src.includes("api("),'screens-review não deve chamar API');
 assert.ok(!src.includes("fetch("),'screens-review não deve usar fetch');
});

function memoryDB(role='owner') {
 const captures={updates:[],audit:[]};
 return {
  captures,
  db:{
   prepare(sql){
    return {
     bind(...params){this._params=params;return this;},
     async first(){
      if(sql.includes('FROM auth_sessions'))return {id:'owner1',role,plan:'free',updated_at:1,last_activity_at:Date.now()};
      return null;
     },
     async run(){
      if(sql.includes('INSERT INTO question_overrides')||sql.includes('DO UPDATE SET value'))captures.updates.push({sql,params:[...this._params]});
      if(sql.includes('INSERT INTO admin_audit_logs'))captures.audit.push({sql,params:[...this._params]});
      return {success:true};
     },
     async all(){return {results:[]};}
    };
   }
  }
 };
}
const adminHeaders={cookie:'fixou_session=token','content-type':'application/json',origin:'https://fixou.test'};

test('PATCH com auditNote registra a observação no log de auditoria',async()=>{
 const {db,captures}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/'+q5,{
  method:'PATCH',headers:adminHeaders,body:JSON.stringify({contentStatus:'not_approved',needsReview:false,auditNote:'Gabarito divergente da fonte original.'})
 }),{DB:db});
 assert.equal(res.status,200);
 assert.ok(captures.updates.some(u=>u.params[1]==='contentStatus'&&u.params[2]==='not_approved'));
 assert.ok(captures.updates.some(u=>u.params[1]==='needsReview'&&u.params[2]==='true'),'servidor força needsReview=true em not_approved');
 const log=captures.audit.find(a=>a.params[2]==='question_content_edited');
 assert.ok(log);
 const detail=String(log.params[5]);
 assert.ok(detail.includes('auditNote'));
 assert.ok(detail.includes('Gabarito divergente'));
 assert.ok(!captures.updates.some(u=>u.params[1]==='auditNote'),'auditNote não pode virar override');
});

test('PATCH sem observação não grava auditNote no log',async()=>{
 const {db,captures}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/'+q5,{
  method:'PATCH',headers:adminHeaders,body:JSON.stringify({contentStatus:'validated',needsReview:false})
 }),{DB:db});
 assert.equal(res.status,200);
 const log=captures.audit.find(a=>a.params[2]==='question_content_edited');
 assert.ok(log);
 assert.ok(!String(log.params[5]).includes('auditNote'));
});

test('estudante continua bloqueado no PATCH de questões',async()=>{
 const {db}=memoryDB('student');
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/'+q5,{
  method:'PATCH',headers:adminHeaders,body:JSON.stringify({contentStatus:'validated'})
 }),{DB:db});
 assert.equal(res.status,403);
});

test('controller: aprovação exige confirmação e não há caminho automático para validated',()=>{
 const ctrl=readFileSync(path.join(root,'src/controller.js'),'utf8');
 const approveIdx=ctrl.indexOf("action==='ai-audit-approve'");
 assert.ok(approveIdx>-1);
 const approveSlice=ctrl.slice(approveIdx,approveIdx+900);
 assert.ok(approveSlice.includes('confirmAction('),'aprovação da aba AI deve confirmar antes');
 assert.ok(approveSlice.includes("contentStatus:'validated'"));
 const notApproveIdx=ctrl.indexOf("action==='ai-audit-not-approve'");
 const notApproveSlice=ctrl.slice(notApproveIdx,notApproveIdx+900);
 assert.ok(notApproveSlice.includes('window.prompt('),'não aprovar deve permitir observação');
 assert.ok(notApproveSlice.includes('auditNote'));
 assert.ok(notApproveSlice.includes("contentStatus:'not_approved'"));
 const validatedWrites=(ctrl.match(/contentStatus:'validated'/g)||[]).length;
 assert.equal(validatedWrites,2,'validated só pode sair de review-approve-content e ai-audit-approve');
 const saveIdx=ctrl.indexOf("action==='review-save')");
 const saveSlice=ctrl.slice(saveIdx,saveIdx+800);
 assert.ok(!saveSlice.includes('contentStatus'),'editar não pode aprovar');
});

function applyProdStates(questions){
 for(const row of prodFixture.rows){
  const q=questions.find(x=>x.id===row.question_id);
  if(!q)continue;
  if(row.field==='needsReview')q.needsReview=row.value==='true'||row.value===true;
  else q[row.field]=row.value;
 }
 return questions;
}

test('fixture reproduz os 81 estados da produção capturados por leitura',()=>{
 const cs=prodFixture.rows.filter(r=>r.field==='contentStatus');
 assert.equal(cs.length,81);
 const nc=cs.filter(r=>r.value==='needs_content_review');
 assert.equal(nc.length,77);
 assert.equal(nc.filter(r=>r.actor_user_id==='master-release-01-09').length,60,'60 do lote original');
 assert.equal(nc.filter(r=>r.actor_user_id==='ai-lote-01-textual').length,17,'17 do lote textual 01');
 const csIds=new Set(cs.map(r=>r.question_id));
 assert.equal(csIds.size,81);
 for(const id of AI_AUDIT_BATCH.ids)assert.ok(csIds.has(id),'estado ausente para '+id);
 const q5cs=cs.find(r=>r.question_id===q5);
 assert.equal(q5cs.value,'pending');
 assert.equal(q5cs.actor_user_id,'owner-teste-local');
 const extra=prodFixture.rows.filter(r=>r.field!=='contentStatus');
 assert.equal(extra.length,11);
 assert.equal(extra.filter(r=>r.question_id===q5).length,3,'extras do q5 preservados');
 assert.equal(extra.filter(r=>r.actor_user_id==='af2254e6-977e-4694-aa39-5dd01bb40303').length,8,'overrides manuais do Owner preservados');
 assert.equal(extra.find(r=>r.field==='needsReview').value,'false');
 assert.equal(extra.find(r=>r.field==='imageStatus').value,'needs_manual_crop');
 assert.ok(extra.find(r=>r.field==='prompt'));
 const validated=cs.filter(r=>r.value==='validated');
 assert.equal(validated.length,3,'aprovacoes manuais do Owner preservadas');
 assert.ok(validated.every(r=>r.actor_user_id==='af2254e6-977e-4694-aa39-5dd01bb40303'),'aprovacao manual mantem o ator do Owner');
});

function aiPool(qs){
 const order=new Map(AI_AUDIT_BATCH.ids.map((id,i)=>[id,i]));
 const rank=q=>{const s=aiAuditStatus(q);return s==='awaiting'?0:s==='rejected'?1:2;};
 return qs.filter(q=>order.has(q.id)).sort((a,b)=>rank(a)-rank(b)||(order.get(a.id)||0)-(order.get(b.id)||0));
}

test('estados da produção aplicados: contadores, selos e ações antes das ações do Owner',()=>{
 const qs=applyProdStates(aiBank().questions);
 const html=renderAi({questions:qs});
 assert.deepEqual(panelValues(html),[81,78,3,0]);
 assert.equal((html.match(/data-action="ai-audit-open"/g)||[]).length,81);
 const q5pos=aiPool(qs).findIndex(q=>q.id===q5);
 const q5html=renderAi({questions:qs},{reviewIndex:q5pos});
 assert.ok(q5html.includes('>Pendente<'),'q5 (pending) deve exibir selo Pendente');
 assert.ok(q5html.includes('needsReview:</strong> não'),'q5 está com needsReview=false na produção');
 assert.ok(q5html.includes('data-action="ai-audit-approve"'));
 assert.ok(q5html.includes('data-action="ai-audit-not-approve"'));
 assert.ok(q5html.includes('data-action="review-edit"'));
 const other=qs.find(q=>q.id!==q5&&q.contentStatus==='needs_content_review');
 const otherPos=aiPool(qs).findIndex(q=>q.id===other.id);
 const otherHtml=renderAi({questions:qs},{reviewIndex:otherPos});
 assert.ok(otherHtml.includes('>Revisão de conteúdo<'),'demais exibem selo de revisão');
 assert.ok(otherHtml.includes('needsReview:</strong> sim'));
});

test('após aprovação com guarda: pendência de imagem mantém bloqueio, questão limpa libera',()=>{
 const qs=applyProdStates(aiBank().questions);
 const imgQ=qs.find(q=>q.id!==q5&&hasImagePendency(q));
 const cleanQ=qs.find(q=>!hasImagePendency(q));
 const rejQ=qs.find(q=>q.id!==imgQ.id&&q.id!==cleanQ.id&&hasImagePendency(q));
 assert.ok(imgQ&&cleanQ&&rejQ);
 imgQ.contentStatus='validated';
 cleanQ.contentStatus='validated';
 cleanQ.needsReview=false;
 rejQ.contentStatus='not_approved';
 rejQ.needsReview=false;
 assert.equal(imgQ.needsReview,true,'aprovada com pendência de imagem não pode ser liberada');
 assert.equal(cleanQ.needsReview,false,'questão sem pendência segue liberada');
 const html=renderAi({questions:qs});
 assert.deepEqual(panelValues(html),[81,76,4,1]);
 const imgPos=aiPool(qs).findIndex(q=>q.id===imgQ.id);
 const imgDetail=renderAi({questions:qs},{reviewIndex:imgPos});
 assert.ok(imgDetail.includes('✓ Validado'),'conteúdo aprovado visível no selo');
 assert.ok(imgDetail.includes('Pendências de imagem:</strong> '+imgQ.imageStatus));
 assert.ok(imgDetail.includes('needsReview:</strong> sim'),'bloqueio segue visível no detalhe');
 assert.ok(imgDetail.includes('Imagem: <span style="color:#f0b04e">Pendente</span>')||imgDetail.includes('>Pendente<'));
 const approved=renderAi({questions:qs},{reviewAiFilter:'approved'});
 assert.equal((approved.match(/data-action="ai-audit-open"/g)||[]).length,4);
 const rejected=renderAi({questions:qs},{reviewAiFilter:'rejected'});
 assert.equal((rejected.match(/data-action="ai-audit-open"/g)||[]).length,1);
 const awaiting=renderAi({questions:qs},{reviewAiFilter:'awaiting'});
 assert.equal((awaiting.match(/data-action="ai-audit-open"/g)||[]).length,76);
});

test('controller: aprovação só limpa needsReview quando não há pendência de imagem',()=>{
 const ctrl=readFileSync(path.join(root,'src/controller.js'),'utf8');
 const ai=ctrl.slice(ctrl.indexOf("action==='ai-audit-approve'"),ctrl.indexOf("action==='ai-audit-not-approve'"));
 assert.ok(ai.includes('hasImagePendency(q)'),'guarda da pendência na aba AI');
 assert.ok(ai.includes('if(!keepBlocked)body.needsReview=false'),'needsReview condicional no payload');
 assert.ok(!ai.includes("{contentStatus:'validated',needsReview:false}"),"payload incondicional proibido na aba AI");
 assert.ok(ai.includes('pendência de imagem'),'confirmação avisa sobre a pendência');
 const rev=ctrl.slice(ctrl.indexOf("action==='review-approve-content'"),ctrl.indexOf("action==='cards-home'"));
 assert.ok(rev.includes('hasImagePendency(q)'),'guarda também no aprovar do fluxo existente');
 assert.ok(rev.includes('if(!keepBlocked)body.needsReview=false'),'needsReview condicional no fluxo existente');
 assert.ok(!rev.includes("{contentStatus:'validated',needsReview:false}"),"payload incondicional proibido no fluxo existente");
 const notAi=ctrl.slice(ctrl.indexOf("action==='ai-audit-not-approve'"),ctrl.indexOf("action==='review-prev'"));
 assert.ok(notAi.includes("{contentStatus:'not_approved',needsReview:'true'}"),'rejeição da aba AI sempre envia needsReview=true');
 assert.ok(!notAi.includes('needsReview:false'),'não aprovar não pode liberar a questão');
 const revNot=ctrl.slice(ctrl.indexOf("action==='review-not-approve'"),ctrl.indexOf("action==='review-revert-not-approved'"));
 assert.ok(revNot.includes("{contentStatus:'not_approved',needsReview:'true'}"),'fluxo de revisão também mantém o bloqueio');
 assert.ok(!revNot.includes('needsReview:false'),'fluxo de revisão não libera na rejeição');
});

test('hasImagePendency cobre as pendências reais e ignora as resolvidas',()=>{
 assert.equal(hasImagePendency(null),false);
 assert.equal(hasImagePendency({}),false);
 for(const st of ['needs_manual_crop','needs_visual_review','bad_crop','bad_image_association'])
  assert.equal(hasImagePendency({imageStatus:st}),true,'status pendente não detectado: '+st);
 for(const st of ['no_image_required','approved','approved_manual','no_image_confirmed'])
  assert.equal(hasImagePendency({imageStatus:st}),false,'status resolvido não pode bloquear: '+st);
 assert.equal(hasImagePendency({imageStatus:'approved',imageClassification:'bad_image_association'}),true,'associação incorreta detectada pela classificação');
 assert.equal(hasImagePendency({imageStatus:'approved',imageClassification:'needs_visual_review'}),true);
 assert.equal(hasImagePendency({imageStatus:'approved',imageClassification:'image_required'}),false);
 const inBatch=bank.questions.filter(q=>AI_AUDIT_BATCH.ids.includes(q.id));
 assert.equal(inBatch.filter(q=>hasImagePendency(q)).length,37,'37 dos 81 têm pendência de imagem no banco');
 assert.equal(inBatch.filter(q=>!hasImagePendency(q)).length,44);
});

test('servidor: not_approved cria needsReview=true mesmo sem o campo no payload',async()=>{
 const {db,captures}=memoryDB();
 const res=await worker.fetch(new Request('https://fixou.test/api/admin/questions/'+q5,{
  method:'PATCH',headers:adminHeaders,body:JSON.stringify({contentStatus:'not_approved'})
 }),{DB:db});
 assert.equal(res.status,200);
 assert.ok(captures.updates.some(u=>u.params[1]==='contentStatus'&&u.params[2]==='not_approved'));
 assert.ok(captures.updates.some(u=>u.params[1]==='needsReview'&&u.params[2]==='true'),'bloqueio gravado pelo servidor');
});

test('aprovada sem pendências é liberada no fluxo real de seleção',()=>{
 const clean={...bank.questions.find(q=>AI_AUDIT_BATCH.ids.includes(q.id)&&!hasImagePendency(q))};
 const c=bank.concepts.find(x=>x.id===clean.conceptId);
 const state={history:[],errors:{},reviews:{},favorites:[]};
 assert.equal(isBlockedForStudent(clean),true,'lote aguardando auditoria começa bloqueado');
 assert.equal(matchesQuestion(clean,c,{},state),false,'seleção bloqueia antes da aprovação');
 clean.contentStatus='validated';
 clean.needsReview=false;
 assert.equal(isBlockedForStudent(clean),false,'aprovação sem pendência libera');
 assert.equal(matchesQuestion(clean,c,{},state),true,'seleção real entrega a questão aprovada');
});

test('aprovação com pendência de imagem mantém o bloqueio mesmo com needsReview false',()=>{
 const img={...bank.questions.find(q=>AI_AUDIT_BATCH.ids.includes(q.id)&&hasImagePendency(q))};
 const c=bank.concepts.find(x=>x.id===img.conceptId);
 const state={history:[],errors:{},reviews:{},favorites:[]};
 img.contentStatus='validated';
 img.needsReview=false;
 assert.equal(isBlockedForStudent(img),true,'camada de imagem bloqueia mesmo validada');
 assert.equal(matchesQuestion(img,c,{},state),false,'seleção real não entrega questão com imagem pendente');
});

test('não aprovar nunca libera a questão, em qualquer camada',()=>{
 const r={...aiBank().questions.find(q=>q.id!==q5)};
 r.contentStatus='not_approved';
 r.needsReview=false;
 assert.equal(isBlockedForStudent(r),true,'not_approved bloqueia mesmo com needsReview false');
 r.needsReview=true;
 assert.equal(isBlockedForStudent(r),true,'bloqueio completo após rejeição');
});

test('editar não aprova nem libera automaticamente',()=>{
 const ctrl=readFileSync(path.join(root,'src/controller.js'),'utf8');
 const saveIdx=ctrl.indexOf("action==='review-save')");
 const saveSlice=ctrl.slice(saveIdx,saveIdx+800);
 assert.ok(!saveSlice.includes('contentStatus'),'editar não pode alterar aprovação');
 assert.ok(!saveSlice.includes('needsReview'),'editar não pode alterar bloqueio');
 const q={...bank.questions.find(x=>AI_AUDIT_BATCH.ids.includes(x.id)&&x.contentStatus==='needs_content_review')};
 q.prompt=q.prompt+' (editado)';
 assert.equal(isBlockedForStudent(q),true,'questão editada segue bloqueada');
 q.needsReview=false;
 assert.equal(isBlockedForStudent(q),true,'contentStatus pendente ainda bloqueia após edição');
});

test('q5 permanece protegida enquanto não satisfaz os critérios',()=>{
 const raw=bank.questions.find(q=>q.id===q5);
 assert.equal(isBlockedForStudent(raw),true,'q5 no banco do estudante bloqueado');
 const prod=applyProdStates(aiBank().questions).find(q=>q.id===q5);
 assert.equal(isBlockedForStudent(prod),true,'q5 no estado da produção (pending/needs_manual_crop) bloqueado');
 const hip={...raw,needsReview:false,contentStatus:'validated',imageStatus:'needs_manual_crop'};
 assert.equal(isBlockedForStudent(hip),true,'mesmo validada, o recorte pendente protege o q5');
});

test('as 81 questões do lote continuam identificadas e protegidas',()=>{
 const batch=bank.questions.filter(q=>AI_AUDIT_BATCH.ids.includes(q.id));
 assert.equal(batch.length,81);
 for(const q of batch)assert.equal(isBlockedForStudent(q),true,'lote bloqueado no estado do banco: '+q.id);
 const non=bank.questions.find(q=>!AI_AUDIT_BATCH.ids.includes(q.id)&&q.needsReview===false);
 assert.ok(non,'existe questão fora do lote liberada');
 assert.equal(isBlockedForStudent(non),false,'fora do lote a regra existente é preservada');
});

test('todo gate de questão do estudante usa a elegibilidade',()=>{
 const files=['training.js','screens.js','session-builder.js','components.js','screens-library.js','screens-profile.js'];
 for(const f of files){
  const src=readFileSync(path.join(root,'src',f),'utf8');
  assert.ok(src.includes('isBlockedForStudent'),f+' aplica a elegibilidade');
  assert.ok(!/if\(q\.needsReview\)/.test(src),f+' sem gate cru if(q.needsReview)');
  assert.ok(!src.includes('!q.needsReview'),f+' sem gate cru !q.needsReview');
 }
});
