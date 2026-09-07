import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bankPath=path.join(root,'content','bank.json');
const batchPath=path.join(root,'content','question-batches','physics-licensed-all-volumes.json');
const manifestPath=path.join(root,'content','question-batches','manifest.json');
const bank=JSON.parse(fs.readFileSync(bankPath,'utf8'));
const batch=JSON.parse(fs.readFileSync(batchPath,'utf8'));
const expected=batch.report.totals.questions;
const existing=bank.questions.filter(q=>q.contentTrack==='physics-licensed-complete');

if(existing.length){
  const oldConceptIds=new Set(existing.map(q=>q.conceptId));
  bank.questions=bank.questions.filter(q=>q.contentTrack!=='physics-licensed-complete');
  bank.concepts=bank.concepts.filter(c=>!oldConceptIds.has(c.id));
}

const conceptIds=new Set(bank.concepts.map(c=>c.id));
const questionIds=new Set(bank.questions.map(q=>q.id));
for(const concept of batch.concepts){if(conceptIds.has(concept.id))throw new Error('Conceito duplicado: '+concept.id);conceptIds.add(concept.id);}
for(const q of batch.questions){if(questionIds.has(q.id))throw new Error('Questão duplicada: '+q.id);questionIds.add(q.id);}

bank.concepts.push(...batch.concepts);
bank.questions.push(...batch.questions);
bank.version+=1;
bank.migration={...bank.migration,lastCompletedBatch:'physics-licensed-all-volumes',lastCompletedAt:'2026-09-07',licensedQuestionsImported:expected,licensedQuestionsActive:batch.report.totals.active,licensedQuestionsNeedsReview:batch.report.totals.needsReview,licensedQuestionsParsePending:batch.report.totals.parsePending};
fs.writeFileSync(bankPath,JSON.stringify(bank,null,2)+'\n');

const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const entry={id:'physics-licensed-all-volumes',file:'physics-licensed-all-volumes.json',status:'active_with_review_queue',questionCount:expected,activeQuestionCount:batch.report.totals.active,needsReviewCount:batch.report.totals.needsReview,answerEntryCount:batch.report.totals.answerEntries,parsePendingCount:batch.report.totals.parsePending,scope:'Física L1, L2, L3 e L4 · questões objetivas e discursivas licenciadas com vínculo ao gabarito'};
const batchIndex=manifest.batches.findIndex(item=>item.id===entry.id);
if(batchIndex>=0)manifest.batches[batchIndex]=entry;else manifest.batches.push(entry);
manifest.plannedTracks=manifest.plannedTracks.filter(id=>id!=='physics-licensed-all-volumes');
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Importado physics-licensed-all-volumes · ${expected} questões · ${batch.report.totals.active} ativas · ${batch.report.totals.needsReview} needsReview`);
