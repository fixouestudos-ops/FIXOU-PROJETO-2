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
const packagePath=path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round6-26-chatgpt.json');
const packageBytes=readFileSync(packagePath);
const pkg=JSON.parse(packageBytes.toString('utf8'));
const round7=JSON.parse(readFileSync(path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round7-19-chatgpt.json'),'utf8'));
const corrections=pkg.corrections;
const ids=Object.keys(corrections);
const byId=new Map(bank.questions.map(question=>[question.id,question]));
const blocked=JSON.parse(readFileSync(path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round3-56-chatgpt.json'),'utf8')).blocked_ids;
const excluded=pkg.not_authorized_to_change.map(item=>item.id);
const sampleId='fis-lic-l2-f2-c5-exercicios-complementares-q23';

function renderQuestion(id){
 return reviewScreen({bank,reviewFilter:'ai_audit',reviewSearch:id,reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',reviewAiLotFilter:'lot14'});
}

test('pacote Round 6 é o anexo íntegro com 26 IDs únicos do lote 14',()=>{
 assert.equal(createHash('sha256').update(packageBytes).digest('hex'),'950d833573a8dcfddf80a4d1743fa5caa0a52427f47bc7de7f1a16cb28a6f270');
 assert.equal(ids.length,26);
 assert.equal(new Set(ids).size,26);
 assert.ok(ids.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(ids.every(id=>!blocked.includes(id)&&!excluded.includes(id)));
 for(const id of ids){
  assert.equal(typeof corrections[id].explanation,'string',id);
  assert.ok(corrections[id].explanation.trim().length>0,id);
  assert.ok(corrections[id].explanation.includes('\n'),id);
  assert.ok('expected_answer' in corrections[id],id);
 }
});

test('os demais campos dos 26 registros permanecem iguais ao início do Round 6',()=>{
 const records=ids.slice().sort().map(id=>{const question=structuredClone(byId.get(id));delete question.explanation;return question;});
 const digest=createHash('sha256').update(JSON.stringify(records)).digest('hex');
 assert.equal(digest,'69871e6dd6513f844acd84bf87e3f6c4e59939abb3592c66630e3565481404f7');
});

test('as 26 explicações são literais e continuam aguardando aprovação manual',()=>{
 for(const id of ids){
  const question=byId.get(id);
  const expected=round7.corrections[id]?.explanation??corrections[id].explanation;
  assert.ok(question,'ID ausente no banco: '+id);
  assert.equal(question.explanation,expected,id);
  assert.equal(aiAuditCompare(question,'lot14').after.explanation,expected,id);
  assert.equal(aiAuditStatus(question),'awaiting',id);
 }
});

test('os quatro registros não autorizados permanecem fora da allowlist e com alerta visível',()=>{
 assert.equal(excluded.length,4);
 assert.equal(new Set(excluded).size,4);
 for(const pending of pkg.not_authorized_to_change){
  assert.ok(AI_AUDIT_LOTS.lot14.ids.includes(pending.id),pending.id);
  assert.ok(!ids.includes(pending.id),pending.id);
  assert.ok([AI_AUDIT_META[pending.id]?.pendingRelease,AI_AUDIT_META[pending.id]?.additionalPendingRelease].includes(pending.reason),pending.id);
  assert.equal(aiAuditStatus(byId.get(pending.id)),'awaiting',pending.id);
  assert.ok(renderQuestion(pending.id).includes(pending.reason),pending.id);
 }
});

test('as seis bloqueadas permanecem aguardando e fora da allowlist',()=>{
 assert.equal(pkg.blockers_unchanged,6);
 assert.equal(blocked.length,6);
 assert.ok(blocked.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(blocked.every(id=>!ids.includes(id)));
 assert.ok(blocked.every(id=>aiAuditStatus(byId.get(id))==='awaiting'));
});

test('IA Auditoria exibe resolução atual com parágrafos e histórico recolhível',()=>{
 const html=renderQuestion(sampleId);
 const currentHeader=html.indexOf('Depois da correção — versão atual');
 const historyHeader=html.indexOf('Histórico da primeira implementação');
 assert.ok(currentHeader>=0);
 assert.ok(historyHeader>currentHeader);
 assert.ok(html.slice(currentHeader,historyHeader).includes('O objetivo é escolher, entre lâmpadas ligadas à mesma tensão'));
 const css=readFileSync(path.join(root,'styles/app.css'),'utf8');
 assert.match(css,/\.ai-diff-cell\{[^}]*white-space:pre-wrap/);
 assert.match(css,/\.ai-explanation-text\{[^}]*white-space:pre-wrap/);
});
