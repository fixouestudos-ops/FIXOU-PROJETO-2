import fs from 'node:fs';
const bank=JSON.parse(fs.readFileSync('content/bank.json','utf8'));
const m=new Map(bank.questions.map(q=>[q.id,q]));
const alvos=[
'fis-lic-l2-f1-c6-exercicios-complementares-q43',
'fis-lic-l2-f1-c6-exercicios-propostos-q37',
'fis-lic-l2-f1-c6-exercicios-propostos-q38',
'fis-lic-l2-f1-c6-exercicios-propostos-q44',
'fis-lic-l2-f1-c7-exercicios-complementares-q30',
'fis-lic-l2-f1-c7-exercicios-propostos-q17',
'fis-lic-l2-f1-c7-exercicios-propostos-q25',
'fis-lic-l2-f1-c8-exercicios-complementares-q12',
'fis-lic-l2-f1-c8-exercicios-complementares-q19',
'fis-lic-l2-f1-c8-exercicios-complementares-q22',
'fis-lic-l2-f1-c8-exercicios-complementares-q24',
'fis-lic-l2-f1-c8-exercicios-complementares-q42',
'fis-lic-l2-f1-c8-exercicios-propostos-q1',
'fis-lic-l2-f1-c8-exercicios-propostos-q14',
'fis-lic-l2-f1-c8-exercicios-propostos-q19',
'fis-lic-l2-f1-c8-exercicios-propostos-q21',
'fis-lic-l2-f1-c8-exercicios-propostos-q25',
'fis-lic-l2-f1-c8-exercicios-propostos-q27',
'fis-lic-l2-f1-c8-revisando-q15',
'fis-lic-l2-f2-c5-exercicios-propostos-q10',
'fis-lic-l2-f2-c5-exercicios-propostos-q20',
'fis-lic-l2-f3-c9-exercicios-complementares-q9',
];
const diverg=['fis-lic-l2-f1-c6-bncc-em-foco-q1','fis-lic-l2-f1-c6-exercicios-complementares-q36','fis-lic-l2-f1-c8-exercicios-complementares-q33'];
const out=[];
for(const id of alvos){
 const q=m.get(id);
 if(!q){console.log('AUSENTE: '+id);continue;}
 out.push({id,type:q.type,sourceType:q.sourceType,officialIds:q.officialIds,contentStatus:q.contentStatus,needsReview:q.needsReview,reviewReasons:q.reviewReasons,answer:q.answer,answerKeyText:q.answerKeyText,prompt:q.prompt,options:q.options,explanation:q.explanation,year:q.year,source:q.source,sourceReference:q.sourceReference});
}
fs.writeFileSync('scripts/lote14-estado-atual.json',JSON.stringify(out,null,2),'utf8');
console.log('extraidos '+out.length+'/'+alvos.length+' IDs para scripts/lote14-estado-atual.json');
const divergOut=[];
for(const id of diverg){
 const q=m.get(id);
 if(!q){console.log('AUSENTE (diverg): '+id);continue;}
 divergOut.push({id,type:q.type,answer:q.answer,answerKeyText:q.answerKeyText,prompt:q.prompt,explanation:q.explanation,officialIds:q.officialIds});
}
fs.writeFileSync('scripts/lote14-divergencias.json',JSON.stringify(divergOut,null,2),'utf8');
console.log('extraidos '+divergOut.length+'/'+diverg.length+' divergencias');
