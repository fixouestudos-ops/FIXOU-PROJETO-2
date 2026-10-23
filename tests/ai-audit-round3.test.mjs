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
const packagePath=path.join(root,'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round3-56-chatgpt.json');
const packageBytes=readFileSync(packagePath);
const pkg=JSON.parse(packageBytes.toString('utf8'));
const corrections=pkg.corrections;
const ids=Object.keys(corrections);
const byId=new Map(bank.questions.map(question=>[question.id,question]));
const q14Id='fis-lic-l2-f1-c6-exercicios-complementares-q14';

function renderQuestion(id){
 return reviewScreen({bank,reviewFilter:'ai_audit',reviewSearch:id,reviewIndex:0,editingQuestion:null,editingFields:{},reviewAiFilter:'all',reviewAiLotFilter:'lot14'});
}

test('pacote científico round 3 é o anexo íntegro com 56 IDs únicos',()=>{
 assert.equal(createHash('sha256').update(packageBytes).digest('hex'),'d1fde831dfa7b948e042f4526243e847b4883082b0250a8ef04704f0cd875fd8');
 assert.equal(ids.length,56);
 assert.equal(new Set(ids).size,56);
 assert.ok(ids.every(id=>AI_AUDIT_LOTS.lot14.ids.includes(id)));
 assert.ok(ids.every(id=>typeof corrections[id]==='string'&&corrections[id].trim().length>0));
 assert.ok(ids.every(id=>!corrections[id].includes('**')));
});

test('as 56 explicações do banco são literais e continuam aguardando aprovação manual',()=>{
 for(const id of ids){
  const question=byId.get(id);
  assert.ok(question,'ID ausente no banco: '+id);
  assert.equal(question.explanation,corrections[id],id);
  assert.equal(aiAuditStatus(question),'awaiting',id);
 }
});

test('q14 mostra a resolução atual didática, mantém o patch histórico e preserva gabarito e status',()=>{
 const question=byId.get(q14Id);
 const current=corrections[q14Id];
 const comparison=aiAuditCompare(question,'lot14');
 assert.equal(question.answer,1);
 assert.equal(question.answerKeyLetter,'B');
 assert.equal(question.contentStatus,'pending');
 assert.equal(question.needsReview,false);
 assert.equal(comparison.after.explanation,current);
 assert.equal(comparison.historicalAfter.explanation,AI_AUDIT_LOTS.lot14.patchById[q14Id].after.explanation);
 assert.notEqual(comparison.after.explanation,comparison.historicalAfter.explanation);
 assert.match(current,/velocímetro informa/);
 assert.match(current,/rapidez/);
 assert.match(current,/vetor velocidade/);
 assert.match(current,/aceleração.*centrípeta/s);
 assert.match(current,/aceleração tangencial é nula/);
 assert.match(current,/alternativa B/);
});

test('interface identifica a versão atual, preserva parágrafos e isola o texto genérico no histórico',()=>{
 const html=renderQuestion(q14Id);
 const currentHeader=html.indexOf('Depois da correção — versão atual');
 const historyHeader=html.indexOf('Histórico da primeira implementação');
 assert.ok(currentHeader>=0);
 assert.ok(historyHeader>currentHeader);
 assert.ok(html.slice(currentHeader,historyHeader).includes('O detalhe mais importante é perceber o que o velocímetro informa'));
 assert.ok(!html.slice(currentHeader,historyHeader).includes('Converta primeiro todas as grandezas'));
 assert.ok(html.slice(historyHeader).includes('Converta primeiro todas as grandezas'));
 assert.ok(!html.includes('**Assunto:**'));
 const css=readFileSync(path.join(root,'styles/app.css'),'utf8');
 assert.match(css,/\.ai-diff-cell\{[^}]*white-space:pre-wrap/);
 assert.match(css,/\.ai-explanation-text\{[^}]*white-space:pre-wrap/);
});
