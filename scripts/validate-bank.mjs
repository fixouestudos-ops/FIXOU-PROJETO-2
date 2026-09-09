import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const bank=readJson('content/bank.json'),curriculum=readJson('content/curriculum.json'),manifest=readJson('content/question-batches/manifest.json');
const fail=message=>{throw new Error(message);};
if(!Array.isArray(bank.concepts)||!Array.isArray(bank.questions))fail('Banco precisa ter concepts e questions.');
const concepts=new Map(bank.concepts.map(c=>[c.id,c]));
if(concepts.size!==bank.concepts.length)fail('IDs de conceitos duplicados.');
const ids=new Set();
for(const q of bank.questions){
  if(!q.id||ids.has(q.id))fail('ID de questão duplicado ou vazio: '+q.id); ids.add(q.id);
  for(const key of ['conceptId','discipline','topic','subtopic','source','prompt','explanation'])if(typeof q[key]!=='string'||q[key].trim().length<1)fail(`Campo ${key} inválido em ${q.id}.`);
  if(!Number.isInteger(q.year)||q.year<1900||!Number.isInteger(q.difficulty)||q.difficulty<1||q.difficulty>4)fail('Metadados inválidos em '+q.id);
  if(q.needsReview!==undefined&&typeof q.needsReview!=='boolean')fail('needsReview inválido em '+q.id);
  if(q.sourceType!==undefined&&!['licensed_material','fixou_original'].includes(q.sourceType))fail('sourceType inválido em '+q.id);
  const c=concepts.get(q.conceptId);if(!c)fail('Conceito ausente em '+q.id);if(c.discipline!==q.discipline||c.topic!==q.topic||c.subtopic!==q.subtopic)fail('Hierarquia divergente em '+q.id);
  if(!Array.isArray(q.officialIds)||q.officialIds.length===0||q.officialIds.some(id=>!curriculum.objects.some(o=>o.id===id)))fail('Referência curricular inválida em '+q.id);
  if(q.type==='choice'&&(!Array.isArray(q.options)||q.options.length<2||(!q.needsReview&&new Set(q.options).size!==q.options.length)||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length))fail('Alternativas inválidas em '+q.id);
  if(q.sourceType==='licensed_material'){
    if(!Number.isInteger(q.questionNumber)||q.questionNumber<1||q.answerKeyQuestionNumber!==q.questionNumber)fail('Vínculo questão-gabarito inválido em '+q.id);
    if(q.type==='choice'){
      const expected='ABCDE'[q.answer];if(q.answerKeyLetter!==expected)fail('Alternativa divergente do gabarito em '+q.id);
    }else if(typeof q.answerKeyText!=='string'||q.answerKeyText.trim().length<1)fail('Resposta textual ausente em '+q.id);
  }
  if(q.imageAssets!==undefined&&(!Array.isArray(q.imageAssets)||q.imageAssets.some(asset=>typeof asset!=='string'||asset.includes('..')||!fs.existsSync(path.join(root,asset)))))fail('Asset de imagem inválido em '+q.id);
  if(q.imageClassification!==undefined&&!['no_image_required','image_required','needs_visual_review','bad_image_association'].includes(q.imageClassification))fail('imageClassification inválido em '+q.id);
  if(q.imageStatus!==undefined&&!['no_image_required','needs_visual_review','approved','approved_manual','bad_crop','no_image_confirmed','bad_image_association','needs_manual_crop'].includes(q.imageStatus))fail('imageStatus inválido em '+q.id);
  if(q.contentStatus!==undefined&&!['pending','validated','needs_content_review'].includes(q.contentStatus))fail('contentStatus inválido em '+q.id);
}
if(bank.questions.filter(q=>q.discipline==='biologia').length!==0)fail('As questões de Biologia foram removidas do banco.');
const physicsAreas=['Mecânica','Cinemática','Eletromagnetismo','Óptica','Termologia','Física Moderna','Ondulatória','Gravitação'];
const physicsQuestions=bank.questions.filter(q=>q.discipline==='fisica');
if(bank.questions.length!==3334)fail('O total do banco precisa ser 3334 questões.');
if(physicsQuestions.length!==3334)fail('O total de Física precisa ser 3334 questões.');
if(physicsQuestions.some(q=>!physicsAreas.includes(q.topic)||/Física L[1-4]|Frente [1-3]|Capítulo \d/i.test(q.topic+' '+q.subtopic)))fail('Taxonomia editorial exposta em Física.');
if(new Set(physicsQuestions.map(q=>q.topic)).size!==physicsAreas.length||physicsAreas.some(area=>!physicsQuestions.some(q=>q.topic===area)))fail('As oito áreas de Física precisam estar presentes.');
for(const c of bank.concepts){if(!Array.isArray(c.officialIds)||c.officialIds.some(id=>!curriculum.objects.some(o=>o.id===id)))fail('Referência curricular inválida no conceito '+c.id);}
if(manifest.deduplicationKey!=='id'||!Array.isArray(manifest.batches)||manifest.batches.length<1)fail('Manifesto de lotes inválido.');
console.log(`Bank valid · ${bank.questions.length} questions · ${bank.concepts.length} concepts · ${manifest.batches.length} batch manifest`);
