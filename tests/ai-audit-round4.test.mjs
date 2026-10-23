import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {AI_AUDIT_LOTS} from '../src/ai-audit-lots.js';
import {aiAuditCompare,aiAuditStatus,reviewScreen} from '../src/screens-review.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(readFileSync(path.join(root,'content/bank.json'),'utf8'));
const packagePath=path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round4-14-chatgpt.json');
const packageBytes=readFileSync(packagePath);
const pkg=JSON.parse(packageBytes.toString('utf8'));
const corrections=pkg.corrections;
const ids=Object.keys(corrections);
const byId=new Map(bank.questions.map(question=>[question.id,question]));
const blocked=JSON.parse(readFileSync(path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round3-56-chatgpt.json'),'utf8')).blocked_ids;
const sampleId='fis-lic-l2-f1-c6-exercicios-propostos-q39';

function renderQuestion(id){
 return reviewScreen({bank,reviewFilter:'ai_audit',reviewSearch:id,reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',reviewAiLotFilter:'lot14'});
}

test('pacote Round 4 é o anexo íntegro com 14 IDs únicos do lote 14',()=>{
 assert.equal(createHash('sha256').update(packageBytes).digest('hex'),'d585c3b438aedc68a496e9e1151cd368189686e6bbeb32870615c386f2a50e01');
 assert.equal(ids.length,14);
 assert.equal(new Set(ids).size,14);
 assert.ok(ids.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(ids.every(id=>!blocked.includes(id)));
 for(const id of ids){
  assert.equal(typeof corrections[id].explanation,'string',id);
  assert.ok(corrections[id].explanation.trim().length>0,id);
  assert.ok('expected_answer' in corrections[id],id);
 }
});

test('somente explanation mudou em relação ao banco anterior ao Round 4',()=>{
 const normalized=structuredClone(bank);
 for(const question of normalized.questions)if(ids.includes(question.id))question.explanation='__ROUND4_EXPLANATION__';
 const digest=createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
 assert.equal(digest,'8c5f9d3fbd35d50b89a2c0a7814e7197d9bcf7aed781c699fbee8c12b1e0f756');
});

test('as 14 explicações são literais e continuam aguardando aprovação manual',()=>{
 for(const id of ids){
  const question=byId.get(id);
  assert.ok(question,'ID ausente no banco: '+id);
  assert.equal(question.explanation,corrections[id].explanation,id);
  assert.equal(aiAuditCompare(question,'lot14').after.explanation,corrections[id].explanation,id);
  assert.equal(aiAuditStatus(question),'awaiting',id);
 }
});

test('as seis bloqueadas e as outras 180 questões do lote permanecem presentes',()=>{
 assert.equal(blocked.length,6);
 assert.ok(blocked.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(blocked.every(id=>aiAuditStatus(byId.get(id))==='awaiting'));
 const remaining=AI_AUDIT_LOTS.lot14.ids.filter(id=>!ids.includes(id)&&!blocked.includes(id));
 assert.equal(remaining.length,180);
 assert.ok(remaining.every(id=>typeof byId.get(id)?.explanation==='string'&&byId.get(id).explanation.trim().length>0));
});

test('IA Auditoria mostra a versão atual com parágrafos e mantém o histórico separado',()=>{
 const question=byId.get(sampleId);
 const current=corrections[sampleId].explanation;
 const comparison=aiAuditCompare(question,'lot14');
 assert.equal(comparison.after.explanation,current);
 assert.equal(comparison.historicalAfter.explanation,AI_AUDIT_LOTS.lot14.patchById[sampleId].after.explanation);
 assert.notEqual(comparison.after.explanation,comparison.historicalAfter.explanation);
 const html=renderQuestion(sampleId);
 const currentHeader=html.indexOf('Depois da correção — versão atual');
 const historyHeader=html.indexOf('Histórico da primeira implementação');
 assert.ok(currentHeader>=0);
 assert.ok(historyHeader>currentHeader);
 assert.ok(html.slice(currentHeader,historyHeader).includes('A questão compara duas situações diferentes'));
 assert.ok(!html.slice(currentHeader,historyHeader).includes('Converta primeiro todas as grandezas'));
 assert.ok(html.slice(historyHeader).includes('Converta primeiro todas as grandezas'));
 const css=readFileSync(path.join(root,'styles/app.css'),'utf8');
 assert.match(css,/\.ai-diff-cell\{[^}]*white-space:pre-wrap/);
 assert.match(css,/\.ai-explanation-text\{[^}]*white-space:pre-wrap/);
});
