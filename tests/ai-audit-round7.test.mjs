import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {AI_AUDIT_LOTS} from '../src/ai-audit-lots.js';
import {AI_AUDIT_META} from '../src/ai-audit-meta.js';
import {aiAuditCompare,aiAuditStatus,reviewScreen} from '../src/screens-review.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(readFileSync(path.join(root,'content/bank.json'),'utf8'));
const packagePath=path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round7-19-chatgpt.json');
const packageBytes=readFileSync(packagePath);
const pkg=JSON.parse(packageBytes.toString('utf8'));
const corrections=pkg.corrections;
const ids=Object.keys(corrections);
const byId=new Map(bank.questions.map(question=>[question.id,question]));
const blocked=JSON.parse(readFileSync(path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round3-56-chatgpt.json'),'utf8')).blocked_ids;
const excluded=pkg.not_authorized_to_change.map(item=>item.id);
const sampleId='fis-lic-l2-f1-c7-exercicios-propostos-q34';

function renderQuestion(id){
 return reviewScreen({bank,reviewFilter:'ai_audit',reviewSearch:id,reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',reviewAiLotFilter:'lot14'});
}

function pendingReasons(id){
 const meta=AI_AUDIT_META[id]||{};
 return [meta.pendingRelease,meta.additionalPendingRelease,...(meta.additionalPendingReleases||[])].filter(Boolean);
}

test('pacote Round 7 é o anexo íntegro com 19 IDs únicos do lote 14',()=>{
 assert.equal(createHash('sha256').update(packageBytes).digest('hex'),'062865564a8543c784a1f1d82984fa196e9e44cfd5333413af5b04a145a4ae16');
 assert.equal(ids.length,19);
 assert.equal(new Set(ids).size,19);
 assert.ok(ids.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(ids.every(id=>!blocked.includes(id)&&!excluded.includes(id)));
 for(const id of ids){
  assert.equal(typeof corrections[id].explanation,'string',id);
  assert.ok(corrections[id].explanation.trim().length>0,id);
  assert.ok(corrections[id].explanation.includes('\n'),id);
  assert.ok('expected_answer' in corrections[id],id);
 }
});

test('os demais campos dos 19 registros permanecem iguais ao início do Round 7',()=>{
 const records=ids.slice().sort().map(id=>{const question=structuredClone(byId.get(id));delete question.explanation;return question;});
 const digest=createHash('sha256').update(JSON.stringify(records)).digest('hex');
 assert.equal(digest,'007d69f1862fed2d4af0ac70d27c316bb2bc076ea6c8ec2c4d07a358b5bbac57');
});

test('as 19 explicações são literais e continuam aguardando aprovação manual',()=>{
 for(const id of ids){
  const question=byId.get(id);
  assert.ok(question,'ID ausente no banco: '+id);
  assert.equal(question.explanation,corrections[id].explanation,id);
  assert.equal(aiAuditCompare(question,'lot14').after.explanation,corrections[id].explanation,id);
  assert.equal(aiAuditStatus(question),'awaiting',id);
 }
});

test('os cinco registros não autorizados permanecem fora da allowlist e com alerta visível',()=>{
 assert.equal(excluded.length,5);
 assert.equal(new Set(excluded).size,5);
 for(const pending of pkg.not_authorized_to_change){
  assert.ok(AI_AUDIT_LOTS.lot14.ids.includes(pending.id),pending.id);
  assert.ok(!ids.includes(pending.id),pending.id);
  assert.ok(pendingReasons(pending.id).includes(pending.reason),pending.id);
  assert.equal(aiAuditStatus(byId.get(pending.id)),'awaiting',pending.id);
  assert.ok(renderQuestion(pending.id).includes(pending.reason),pending.id);
 }
});

test('alertas anteriores de q81 e q20 e as seis bloqueadas foram preservados',()=>{
 for(const id of ['fis-lic-l2-f1-c8-exercicios-complementares-q81','fis-lic-l2-f2-c7-exercicios-complementares-q20']){
  assert.ok(pendingReasons(id).length>0,id);
  assert.equal(aiAuditStatus(byId.get(id)),'awaiting',id);
 }
 assert.equal(blocked.length,6);
 assert.ok(blocked.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(blocked.every(id=>!ids.includes(id)));
 assert.ok(blocked.every(id=>aiAuditStatus(byId.get(id))==='awaiting'));
});

test('banco preserva 3.513 questões e 203 conceitos',()=>{
 assert.equal(bank.questions.length,3513);
 assert.equal(bank.concepts.length,203);
});

test('IA Auditoria exibe resolução atual com parágrafos e histórico recolhível',()=>{
 const html=renderQuestion(sampleId);
 const currentHeader=html.indexOf('Depois da correção — versão atual');
 const historyHeader=html.indexOf('Histórico da primeira implementação');
 assert.ok(currentHeader>=0);
 assert.ok(historyHeader>currentHeader);
 assert.ok(html.slice(currentHeader,historyHeader).includes('O enunciado informa que os dois corpos percorrem o mesmo deslocamento horizontal'));
 const css=readFileSync(path.join(root,'styles/app.css'),'utf8');
 assert.match(css,/\.ai-diff-cell\{[^}]*white-space:pre-wrap/);
 assert.match(css,/\.ai-explanation-text\{[^}]*white-space:pre-wrap/);
});
