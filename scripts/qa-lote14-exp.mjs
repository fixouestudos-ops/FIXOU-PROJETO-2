import fs from 'node:fs';
const antes=JSON.parse(fs.readFileSync('content/bank.json.pre-lote14-exp','utf8'));
const depois=JSON.parse(fs.readFileSync('content/bank.json','utf8'));
const alvos=JSON.parse(fs.readFileSync('scripts/lote14-explicacoes.json','utf8'));
const aMap=new Map(antes.questions.map(q=>[q.id,q]));
const dMap=new Map(depois.questions.map(q=>[q.id,q]));
let fails=0;
const fail=m=>{fails++;console.log('  FALHA: '+m);};
console.log('=== ESTRUTURA ===');
console.log('questoes antes/depois:',antes.questions.length,'/',depois.questions.length);
if(antes.questions.length!==depois.questions.length||depois.questions.length!==3513)fail('contagem de questoes mudou');
console.log('conceitos intactos:',JSON.stringify(antes.concepts)===JSON.stringify(depois.concepts));
console.log('metadados de topo intactos:',JSON.stringify({...antes,questions:[]})===JSON.stringify({...depois,questions:[]}));
const alterados=depois.questions.filter(q=>JSON.stringify(q)!==JSON.stringify(aMap.get(q.id))).map(q=>q.id);
console.log('questoes alteradas:',alterados.length,'(esperado 22) | fora do escopo:',alterados.filter(i=>!alvos[i]).length);
if(alterados.length!==22)fail('numero de questoes alteradas != 22');
if(alterados.some(i=>!alvos[i]))fail('questao fora do escopo alterada: '+alterados.filter(i=>!alvos[i]));
console.log('\n=== SOMENTE explanation ALTERADO ===');
let campoErrado=0;
for(const id of alterados){
 const a=aMap.get(id),d=dMap.get(id);
 for(const k of new Set([...Object.keys(a),...Object.keys(d)])){
  if(k==='explanation')continue;
  if(JSON.stringify(a[k])!==JSON.stringify(d[k])){console.log('  '+id+' campo extra alterado: '+k);campoErrado++;}
 }
 // campos presentes em um e ausente no outro
 for(const k of Object.keys(a))if(!(k in d)){console.log('  '+id+' campo removido: '+k);campoErrado++;}
 for(const k of Object.keys(d))if(!(k in a)){console.log('  '+id+' campo adicionado: '+k);campoErrado++;}
}
console.log('  campos nao-explanation alterados:',campoErrado);
if(campoErrado)fail('campo fora de explanation alterado');
console.log('\n=== CONTEUDO DA NOVA EXPLICACAO ===');
let probsExp=0;
for(const [id,esperado] of Object.entries(alvos)){
 const q=dMap.get(id);
 const probs=[];
 if(q.explanation!==esperado)probs.push('explanation divergente do alvo');
 if(q.explanation.includes('**'))probs.push('markdown ** residual');
 if(!q.explanation.trim())probs.push('vazio');
 if(q.explanation.length<100)probs.push('suspeitamente curta ('+q.explanation.length+')');
 if(q.explanation.includes('Converta primeiro'))probs.push('template generico antigo residual');
 if(q.explanation.includes('coincide com o gabarito'))probs.push('frase generica antiga');
 if(probs.length){console.log('  FALHA '+id+': '+probs.join(', '));probsExp++;}
}
console.log('  explicacoes conferidas:',Object.keys(alvos).length-probsExp+'/'+Object.keys(alvos).length);
if(probsExp)fail('problemas nas explicacoes');
console.log('\n=== DIVERGENCIAS NAO TOCADAS ===');
const divIds=['fis-lic-l2-f1-c6-bncc-em-foco-q1','fis-lic-l2-f1-c6-exercicios-complementares-q36','fis-lic-l2-f1-c8-exercicios-complementares-q33'];
for(const id of divIds){
 const igual=JSON.stringify(aMap.get(id))===JSON.stringify(dMap.get(id));
 console.log('  '+(igual?'intacto ':'TOCADO  ')+id);
 if(!igual)fail('divergencia foi alterada: '+id);
}
console.log('\n=== COERENCIA CIENTIFICA (recalculo independente) ===');
const near=(a,b)=>Math.abs(a-b)<1e-6;
const chk=[
 // q43: enunciado manda adotar pi = 3 ("Note e adote: p 5 3")
 ['q43 vT (pi=3)',3,2*3*0.25*2],
 ['q43 a (pi=3)',4.5,(2*3*0.25)**2*2],
 ['q43 U',5,Math.hypot(4,3)],
 ['q43 theta ~37',37,Math.round(Math.atan2(3,4)*180/Math.PI)],
 ['q37 t',8,40/5],
 ['q37 x',96,0.5*3*64],
 ['q37 y',128,0.5*4*64],
 ['q38 v',10,1*10],
 ['q38 ac',1,100/100],
 ['q44 v',250*Math.PI,2*Math.PI*(6000*Math.cos(Math.PI/3))/24],
 ['q30 v',70,Math.hypot(80*Math.cos(Math.PI/6),40-10*5)],
 ['q17 vx',50,300/6],
 ['q25 h',45,30**2/20],
 ['q12 T',600,60*10],
 ['q12 mLua',400,600/1.5],
 ['q19 dx',12,6*2],
 ['q19 g',0.0125,0.05/4],
 ['q22 Fa',1e6,1e5*10],
 ['q22 Fb',2.5e5,1e5*(100**2/(2*2000))],
 ['q24 v',40,Math.sqrt(2*10*80)],
 ['q24 F',40500,50*(40/0.05+10)],
 ['q24 razao',10,(40/0.05)/80],
 ['q42 Fa',5250,500*10.5],
 ['q42 Fb',15250,10000+5250],
 ['q1 soma',6,2+4],
 ['q14 somenteI',1,1],
 ['q19 nObj',12,Math.ceil(5.80/0.5)],
 ['q19 tensao12',6.0,12*0.5],
 ['q21 a',4,1/(1/5+1/20)],
 ['q25t T',32000,16000*2],
 ['q27 ds',125,25**2/(2*2.5)],
 ['q27 F',2000,800*2.5],
 ['q15 a',7.5,10*0.6/0.8],
 ['q15 Trep',50,5*10],
 ['q15 Tac',62.5,50/0.8],
 ['q10 i',0.6,60/100],
 ['q20 R',1e4,0.07/7e-6],
 ['q9 dt',1.5e-5,3e5*0.015/3e8],
];
let fis=0;
for(const [rot,esp,calc] of chk){if(!near(esp,calc)){console.log('  FALHA '+rot+': esperado '+esp+' calculado '+calc);fis++;}}
console.log('  verificacoes numericas: '+(chk.length-fis)+'/'+chk.length+' conferem');
if(fis)fail('inconsistencia numerica');
// gabaritos inalterados
let gabOk=0;
for(const id of Object.keys(alvos)){
 const a=aMap.get(id),d=dMap.get(id);
 if(a.answer===d.answer&&a.answerKeyText===d.answerKeyText)gabOk++;
 else fail('gabarito alterado: '+id);
}
console.log('  gabaritos preservados:',gabOk+'/'+Object.keys(alvos).length);
console.log('\n=== RESULTADO: '+(fails?fails+' pendencia(s)':'0 pendencias')+' ===');
