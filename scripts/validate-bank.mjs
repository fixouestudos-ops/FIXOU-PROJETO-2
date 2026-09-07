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
}
if(bank.questions.filter(q=>q.discipline==='biologia').length!==50)fail('As 50 questões de Biologia precisam permanecer preservadas.');
for(const c of bank.concepts){if(!Array.isArray(c.officialIds)||c.officialIds.some(id=>!curriculum.objects.some(o=>o.id===id)))fail('Referência curricular inválida no conceito '+c.id);}
if(manifest.deduplicationKey!=='id'||!Array.isArray(manifest.batches)||manifest.batches.length<1)fail('Manifesto de lotes inválido.');
console.log(`Bank valid · ${bank.questions.length} questions · ${bank.concepts.length} concepts · ${manifest.batches.length} batch manifest`);
