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
const packagePath=path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round5-29-chatgpt.json');
const packageBytes=readFileSync(packagePath);
const pkg=JSON.parse(packageBytes.toString('utf8'));
const corrections=pkg.corrections;
const ids=Object.keys(corrections);
const byId=new Map(bank.questions.map(question=>[question.id,question]));
const blocked=JSON.parse(readFileSync(path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round3-56-chatgpt.json'),'utf8')).blocked_ids;
const excluded=pkg.blocked_or_unresolved_examples.map(item=>item.id);
const sampleId='fis-lic-l2-f2-c7-exercicios-complementares-q55';

function renderQuestion(id){
 return reviewScreen({bank,reviewFilter:'ai_audit',reviewSearch:id,reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',reviewAiLotFilter:'lot14'});
}

test('pacote Round 5 é o anexo íntegro com 29 IDs únicos do lote 14',()=>{
 assert.equal(createHash('sha256').update(packageBytes).digest('hex'),'dc60bb2e612c4161afe34da87be123d684bd5383fdf1877e294aec82ec90b075');
 assert.equal(ids.length,29);
 assert.equal(new Set(ids).size,29);
 assert.ok(ids.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(ids.every(id=>!blocked.includes(id)&&!excluded.includes(id)));
 for(const id of ids){
  assert.equal(typeof corrections[id].explanation,'string',id);
  assert.ok(corrections[id].explanation.trim().length>0,id);
  assert.ok(corrections[id].explanation.includes('\n'),id);
  assert.ok('expected_answer' in corrections[id],id);
 }
});

test('os demais campos dos 29 registros permanecem iguais ao início do Round 5',()=>{
 const records=ids.slice().sort().map(id=>{const question=structuredClone(byId.get(id));delete question.explanation;return question;});
 const digest=createHash('sha256').update(JSON.stringify(records)).digest('hex');
 assert.equal(digest,'f263972d7ead234766be11b6b008c4d2b6cd0600b407e220769bb6fde40a4b5f');
});

test('as 29 explicações são literais e continuam aguardando aprovação manual',()=>{
 for(const id of ids){
  const question=byId.get(id);
  assert.ok(question,'ID ausente no banco: '+id);
  assert.equal(question.explanation,corrections[id].explanation,id);
  assert.equal(aiAuditCompare(question,'lot14').after.explanation,corrections[id].explanation,id);
  assert.equal(aiAuditStatus(question),'awaiting',id);
 }
});

test('os 11 alertas e as duas conferências adicionais são preservados como metadados',()=>{
 const alerts=Object.entries(corrections).filter(([,entry])=>entry.pending_source_or_ocr_review);
 assert.equal(alerts.length,11);
 for(const [id,entry] of alerts)assert.equal(AI_AUDIT_META[id]?.pendingRelease,entry.pending_source_or_ocr_review,id);
 assert.equal(excluded.length,2);
 for(const pending of pkg.blocked_or_unresolved_examples){
  assert.equal(AI_AUDIT_META[pending.id]?.pendingRelease,pending.reason,pending.id);
  assert.equal(aiAuditStatus(byId.get(pending.id)),'awaiting',pending.id);
 }
});

test('as seis bloqueadas permanecem aguardando e fora da allowlist',()=>{
 assert.equal(blocked.length,6);
 assert.ok(blocked.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(blocked.every(id=>!ids.includes(id)));
 assert.ok(blocked.every(id=>aiAuditStatus(byId.get(id))==='awaiting'));
});

test('IA Auditoria exibe resolução atual, alerta de OCR e histórico recolhível',()=>{
 const html=renderQuestion(sampleId);
 const currentHeader=html.indexOf('Depois da correção — versão atual');
 const historyHeader=html.indexOf('Histórico da primeira implementação');
 assert.ok(currentHeader>=0);
 assert.ok(historyHeader>currentHeader);
 assert.ok(html.slice(currentHeader,historyHeader).includes('Os dois capacitores estão ligados em série'));
 assert.ok(html.includes('Conferir no PDF se a unidade de capacitância é µF: o OCR registra mF.'));
 assert.ok(html.includes('Pendência que impede a liberação ao estudante'));
 const css=readFileSync(path.join(root,'styles/app.css'),'utf8');
 assert.match(css,/\.ai-diff-cell\{[^}]*white-space:pre-wrap/);
 assert.match(css,/\.ai-explanation-text\{[^}]*white-space:pre-wrap/);
});
