import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bankPath=path.join(root,'content','bank.json');
const batchPath=path.join(root,'content','question-batches','physics-licensed-all-volumes.json');
const areaOrder=['Mecânica','Cinemática','Eletromagnetismo','Óptica','Termologia','Física Moderna','Ondulatória','Gravitação'];
const chapterMap={
 'L1-1-1':['Cinemática','Fundamentos da Cinemática'],
 'L1-1-2':['Cinemática','Movimento uniforme'],
 'L1-1-3':['Cinemática','Movimento uniformemente variado'],
 'L1-1-4':['Cinemática','Análise gráfica do movimento'],
 'L1-1-5':['Cinemática','Movimento circular'],
 'L1-2-1':['Eletromagnetismo','Eletrostática'],
 'L1-2-2':['Eletromagnetismo','Força elétrica'],
 'L1-2-3':['Eletromagnetismo','Trabalho da força elétrica e potencial'],
 'L1-2-4':['Eletromagnetismo','Campo elétrico'],
 'L1-3-1':['Termologia','Termometria'],
 'L1-3-2':['Termologia','Dilatação térmica'],
 'L1-3-3':['Termologia','Calorimetria'],
 'L1-3-4':['Termologia','Mudanças de estado físico'],
 'L1-3-5':['Termologia','Transferência de calor'],
 'L1-3-6':['Termologia','Gases e Termodinâmica'],
 'L2-1-6':['Cinemática','Cinemática vetorial'],
 'L2-1-7':['Cinemática','Lançamento oblíquo'],
 'L2-1-8':['Mecânica','Dinâmica'],
 'L2-2-5':['Eletromagnetismo','Corrente elétrica'],
 'L2-2-6':['Eletromagnetismo','Associação de resistores'],
 'L2-2-7':['Eletromagnetismo','Circuitos elétricos'],
 'L2-3-7':['Óptica','Óptica geométrica'],
 'L2-3-8':['Óptica','Reflexão da luz'],
 'L2-3-9':['Óptica','Refração da luz'],
 'L3-1-9':['Mecânica','Força de atrito'],
 'L3-1-10':['Mecânica','Trabalho, energia e potência'],
 'L3-2-8':['Eletromagnetismo','Magnetismo e indução eletromagnética'],
 'L3-2-9':['Eletromagnetismo','Força magnética'],
 'L3-2-10':['Gravitação','Gravitação universal'],
 'L3-3-10':['Óptica','Óptica da visão e instrumentos ópticos'],
 'L3-3-11':['Cinemática','Movimentos oscilatórios'],
 'L3-3-12':['Ondulatória','Fundamentos da Ondulatória'],
 'L4-1-11':['Mecânica','Impulso, quantidade de movimento e colisões'],
 'L4-2-11':['Mecânica','Estática'],
 'L4-2-12':['Mecânica','Hidrostática'],
 'L4-2-13':['Física Moderna','Física Moderna'],
 'L4-3-13':['Ondulatória','Ondas periódicas'],
 'L4-3-14':['Ondulatória','Interferência de ondas'],
 'L4-3-15':['Ondulatória','Acústica']
};

function destination(item){
 const key=item.sourceVolume&&item.sourceFront&&item.sourceChapter?`${item.sourceVolume}-${item.sourceFront}-${item.sourceChapter}`:null;
 if(key&&chapterMap[key])return chapterMap[key];
 if(item.topic==='Eletrostática'||item.topic==='Eletricidade')return ['Eletromagnetismo',item.subtopic];
 if(item.topic==='Energia, dinâmica e trabalho'){
  if(/gravita/i.test(item.subtopic))return ['Gravitação',item.subtopic];
  return ['Mecânica',item.subtopic];
 }
 if(areaOrder.includes(item.topic))return [item.topic,item.subtopic];
 return null;
}

function migrate(data){
 const concepts=new Map(data.concepts.filter(c=>c.discipline==='fisica').map(c=>[c.id,c]));
 for(const concept of concepts.values()){
  const sample=data.questions.find(q=>q.conceptId===concept.id);
  const target=destination(sample||concept);
  if(target)[concept.topic,concept.subtopic]=target;
 }
 for(const q of data.questions.filter(q=>q.discipline==='fisica')){
  const concept=concepts.get(q.conceptId);
  if(!concept)throw new Error(`Conceito ausente: ${q.conceptId}`);
  q.topic=concept.topic;q.subtopic=concept.subtopic;
 }
 return data;
}

const bank=migrate(JSON.parse(fs.readFileSync(bankPath,'utf8')));
const before=bank.questions.filter(q=>q.discipline==='fisica').length;
const unresolved=bank.concepts.filter(c=>c.discipline==='fisica'&&!areaOrder.includes(c.topic));
if(unresolved.length)throw new Error('Conceitos sem destino: '+unresolved.map(c=>`${c.id}:${c.topic}`).join(', '));
const after=bank.questions.filter(q=>q.discipline==='fisica').length;
if(before!==after)throw new Error(`Total de Física mudou: ${before} -> ${after}`);
bank.migration={...bank.migration,physicsTaxonomy:'fixou-physics-v1',physicsTaxonomyMigratedAt:'2026-09-07',physicsQuestionCount:after};
fs.writeFileSync(bankPath,JSON.stringify(bank,null,2)+'\n');

const batch=migrate(JSON.parse(fs.readFileSync(batchPath,'utf8')));
fs.writeFileSync(batchPath,JSON.stringify(batch,null,2)+'\n');

const totals=Object.fromEntries(areaOrder.map(area=>[area,{topics:new Set(),questions:0,active:0}]));
for(const q of bank.questions.filter(q=>q.discipline==='fisica')){const t=totals[q.topic];t.topics.add(q.subtopic);t.questions++;if(!q.needsReview)t.active++;}
console.log(JSON.stringify(Object.fromEntries(areaOrder.map(area=>[area,{topics:totals[area].topics.size,questions:totals[area].questions,active:totals[area].active}])),null,2));
console.log(`Física preservada · ${before} -> ${after} questões · ${new Set(bank.questions.filter(q=>q.discipline==='fisica').map(q=>q.id)).size} IDs únicos`);
