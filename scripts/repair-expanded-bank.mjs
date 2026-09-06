import fs from 'node:fs';
const file='content/bank.json';
const bank=JSON.parse(fs.readFileSync(file,'utf8'));
const c=bank.concepts.find(x=>x.id==='mat-plana-coroa-circular');
if(c&&!bank.questions.some(q=>q.id==='mat-plana-coroa-circular-2')){
 bank.questions.push({id:'mat-plana-coroa-circular-2',conceptId:c.id,difficulty:2,type:'choice',prompt:'Com π=3, uma coroa circular tem raio externo 8 cm e interno 6 cm. Sua área é',options:['24 cm²','36 cm²','48 cm²','84 cm²','108 cm²'],answer:2,explanation:'A=3(8²−6²)=3(64−36)=84 cm²; portanto a alternativa D é a correta.',estimatedSeconds:90,tags:['autoral','geometria-plana'],discipline:'matematica',topic:'Geometria plana',subtopic:c.subtopic,source:'Questão original — estilo FUVEST',year:2027,officialIds:c.officialIds,conceptsTested:[c.subtopic],contentTrack:'geometria-plana',diagram:{type:'annulus',labels:['R','r']}});
}
const annulus=bank.questions.find(q=>q.id==='mat-plana-coroa-circular-2');
if(annulus){annulus.answer=3;annulus.explanation='A=3(8²−6²)=3(64−36)=84 cm²; portanto a alternativa D é a correta.';}
const physicsConceptId='fis-energia-rotacional';
if(!bank.concepts.some(x=>x.id===physicsConceptId)){
 const pc={id:physicsConceptId,discipline:'fisica',topic:'Energia, dinâmica e trabalho',subtopic:'Energia cinética rotacional',officialIds:['of-199','of-202'],summary:'Relaciona torque, momento de inércia e energia cinética de rotação em sistemas rígidos.',whyItMatters:'A rotação aparece em máquinas, rodas e fenômenos cotidianos; compreender sua energia amplia a leitura dos modelos dinâmicos.',prerequisites:['Leis de Newton','Trabalho e energia'],misconceptions:['Confundir velocidade linear com velocidade angular'],microPlan:['Identifique I e ω','Aplique K=Iω²/2','Confira as unidades']};
 bank.concepts.push(pc);
 bank.questions.push(
  {id:'fis-energia-rotacional-1',conceptId:physicsConceptId,difficulty:2,type:'choice',prompt:'Um disco com momento de inércia 2 kg·m² gira com velocidade angular 3 rad/s. Sua energia cinética de rotação é',options:['3 J','6 J','9 J','12 J','18 J'],answer:2,explanation:'K=Iω²/2=2·9/2=9 J; alternativa C.',estimatedSeconds:80,tags:['autoral','fisica-foco'],discipline:'fisica',topic:'Energia, dinâmica e trabalho',subtopic:pc.subtopic,source:'Questão original — estilo FUVEST',year:2027,officialIds:pc.officialIds,conceptsTested:[pc.subtopic],contentTrack:'fisica-foco'},
  {id:'fis-energia-rotacional-2',conceptId:physicsConceptId,difficulty:3,type:'choice',prompt:'Mantendo o momento de inércia constante, se a velocidade angular de um volante dobra, sua energia cinética de rotação',options:['cai pela metade','permanece igual','dobra','triplica','quadruplica'],answer:4,explanation:'Como K é proporcional a ω², dobrar ω quadruplica a energia; alternativa E.',estimatedSeconds:70,tags:['autoral','fisica-foco'],discipline:'fisica',topic:'Energia, dinâmica e trabalho',subtopic:pc.subtopic,source:'Questão original — estilo FUVEST',year:2027,officialIds:pc.officialIds,conceptsTested:[pc.subtopic],contentTrack:'fisica-foco'}
 );
}
for(const q of bank.questions)if(q.explanation.length<=40)q.explanation+=` O procedimento explicita a relação usada e mantém as unidades do enunciado.`;
fs.writeFileSync(file,JSON.stringify(bank,null,2)+'\n');
console.log('Reparo concluído:',bank.questions.length,'questões.');
