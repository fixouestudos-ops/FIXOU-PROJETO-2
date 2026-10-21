import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {AI_AUDIT_BATCH} from '../src/ai-audit-batch.js';
import {AI_AUDIT_LOTS} from '../src/ai-audit-lots.js';
import {aiAuditCompare,aiAuditMembership,aiAuditScientificResult,aiAuditStatus,reviewScreen} from '../src/screens-review.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(readFileSync(path.join(root,'content/bank.json'),'utf8'));
const prodFixture=JSON.parse(readFileSync(path.join(root,'tests/fixtures/ai-audit-prod-states.json'),'utf8'));
const byId=new Map(bank.questions.map(question=>[question.id,question]));
const historical=new Set(AI_AUDIT_BATCH.historicalIds);
const lot12=new Set(AI_AUDIT_LOTS.lot12.ids);
const lot13=new Set(AI_AUDIT_LOTS.lot13.ids);
const overlap12=[...lot12].filter(id=>historical.has(id));

function render(extra={}){
 return reviewScreen({bank,reviewFilter:'ai_audit',reviewSearch:'',reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',reviewAiLotFilter:'all',...extra});
}
function rows(html){return (html.match(/data-action="ai-audit-open"/g)||[]).length;}

test('fila integrada preserva 275 históricos, associa 150 ao lote 12 e 200 ao lote 13',()=>{
 assert.equal(historical.size,275);
 assert.equal(lot12.size,150);
 assert.equal(lot13.size,200);
 assert.equal(AI_AUDIT_BATCH.historicalTotal,275);
});

test('união possui exatamente 619 IDs únicos e todos existem no banco',()=>{
 assert.equal(AI_AUDIT_BATCH.ids.length,619);
 assert.equal(new Set(AI_AUDIT_BATCH.ids).size,619);
 assert.equal(AI_AUDIT_BATCH.total,619);
 for(const id of AI_AUDIT_BATCH.ids)assert.ok(byId.has(id),'ID ausente no banco: '+id);
});

test('os lotes 12 e 13 não se sobrepõem e as seis sobreposições históricas permanecem únicas',()=>{
 assert.equal([...lot12].filter(id=>lot13.has(id)).length,0);
 assert.equal(overlap12.length,6);
 assert.ok(overlap12.every(id=>AI_AUDIT_LOTS.lot12.unchangedIds.includes(id)));
 for(const id of overlap12)assert.deepEqual(aiAuditMembership(id),['historical','lot12']);
});

test('144 correções do lote 12 e 200 do lote 13 ficam acessíveis para auditoria',()=>{
 assert.equal(AI_AUDIT_LOTS.lot12.correctedIds.length,144);
 assert.equal(AI_AUDIT_LOTS.lot13.correctedIds.length,200);
 assert.equal(Object.keys(AI_AUDIT_LOTS.lot12.patchById).length,144);
 assert.equal(Object.keys(AI_AUDIT_LOTS.lot13.patchById).length,200);
 assert.equal(new Set([...AI_AUDIT_LOTS.lot12.correctedIds,...AI_AUDIT_LOTS.lot13.correctedIds]).size,344);
});

test('comparações usam os valores before e after verdadeiros dos 344 patches',()=>{
 for(const key of ['lot12','lot13'])for(const [id,patch] of Object.entries(AI_AUDIT_LOTS[key].patchById)){
  const comparison=aiAuditCompare(byId.get(id),key);
  assert.equal(comparison.available,true,id);
  assert.equal(comparison.kind,'lot',id);
  assert.deepEqual(comparison.before,patch.before,id+' before');
  assert.deepEqual(comparison.after,patch.after,id+' after');
  assert.deepEqual(new Set(comparison.fields),new Set([...Object.keys(patch.before),...Object.keys(patch.after)]),id+' fields');
 }
});

test('questões verificadas sem alteração não ganham diferenças artificiais',()=>{
 assert.equal(AI_AUDIT_LOTS.lot12.unchangedIds.length,6);
 for(const id of AI_AUDIT_LOTS.lot12.unchangedIds){
  assert.equal(AI_AUDIT_LOTS.lot12.patchById[id],undefined);
  assert.equal(aiAuditScientificResult(id,'lot12'),'verificada_sem_alteracao');
 }
});

test('filtros de lote exibem 619, 275, 150 e 200 registros',()=>{
 assert.equal(rows(render()),619);
 assert.equal(rows(render({reviewAiLotFilter:'historical'})),275);
 assert.equal(rows(render({reviewAiLotFilter:'lot12'})),150);
 assert.equal(rows(render({reviewAiLotFilter:'lot13'})),200);
});

test('filtros por decisão continuam combináveis com o filtro de lote',()=>{
 const questions=bank.questions.map(question=>({...question}));
 const first=questions.find(question=>question.id===AI_AUDIT_LOTS.lot13.ids[0]);
 const second=questions.find(question=>question.id===AI_AUDIT_LOTS.lot13.ids[1]);
 first.contentStatus='validated'; second.contentStatus='not_approved';
 const input={questions};
 const base={bank:input,reviewFilter:'ai_audit',reviewSearch:'',reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiLotFilter:'lot13'};
 assert.equal(rows(reviewScreen({...base,reviewAiFilter:'approved'})),1);
 assert.equal(rows(reviewScreen({...base,reviewAiFilter:'rejected'})),1);
 assert.equal(rows(reviewScreen({...base,reviewAiFilter:'awaiting'})),198);
});

test('cinco divergências reais do lote 12 recebem destaque e lote 13 tem zero',()=>{
 assert.equal(AI_AUDIT_LOTS.lot12.divergenceIds.length,5);
 assert.equal(AI_AUDIT_LOTS.lot13.divergenceIds.length,0);
 for(const id of AI_AUDIT_LOTS.lot12.divergenceIds){
  const html=render({reviewAiLotFilter:'lot12',reviewSearch:id});
  assert.ok(html.includes('Divergência documentada'),id);
  assert.ok(html.includes(AI_AUDIT_LOTS.lot12.manifestById[id].divergence),id);
 }
});

test('lista e detalhe identificam lote, resultado científico, status e origem',()=>{
 const corrected=AI_AUDIT_LOTS.lot13.ids[0];
 const correctedHtml=render({reviewAiLotFilter:'lot13',reviewSearch:corrected});
 assert.ok(correctedHtml.includes('Lote 13'));
 assert.ok(correctedHtml.includes('Corrigida por IA'));
 assert.ok(correctedHtml.includes('Status da auditoria'));
 assert.ok(correctedHtml.includes('Origem:'));
 const unchanged=AI_AUDIT_LOTS.lot12.unchangedIds[0];
 assert.ok(render({reviewAiLotFilter:'lot12',reviewSearch:unchanged}).includes('Verificada sem alteração'));
});

test('decisões administrativas históricas permanecem limitadas aos 275 IDs originais',()=>{
 const decidedIds=new Set(prodFixture.rows.filter(row=>row.field==='contentStatus').map(row=>row.question_id));
 assert.equal(decidedIds.size,275);
 assert.ok([...decidedIds].every(id=>historical.has(id)));
 assert.equal([...lot13].filter(id=>decidedIds.has(id)).length,0);
 assert.equal([...lot12].filter(id=>decidedIds.has(id)).length,6);
});

test('nenhuma das 344 novas correções começa aprovada automaticamente',()=>{
 for(const id of [...AI_AUDIT_LOTS.lot12.correctedIds,...AI_AUDIT_LOTS.lot13.correctedIds])assert.equal(aiAuditStatus(byId.get(id)),'awaiting',id);
});

test('metadados versionados não alteram campos administrativos nem criam escrita em massa',()=>{
 const forbidden=new Set(['contentStatus','needsReview','reviewReasons','imageStatus','imageClassification','imageReason']);
 for(const key of ['lot12','lot13'])for(const patch of Object.values(AI_AUDIT_LOTS[key].patchById)){
  for(const field of [...Object.keys(patch.before),...Object.keys(patch.after)])assert.ok(!forbidden.has(field),`${key}/${patch.id}: ${field}`);
 }
 const controller=readFileSync(path.join(root,'src/controller.js'),'utf8');
 const filterCode=controller.slice(controller.indexOf("action==='ai-audit-lot-filter'"),controller.indexOf("action==='ai-audit-filter'"));
 assert.ok(!filterCode.includes('api('));
 assert.ok(!filterCode.includes('contentStatus'));
});
