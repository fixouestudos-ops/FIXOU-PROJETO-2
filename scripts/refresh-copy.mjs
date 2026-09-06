import fs from 'node:fs';
const replacements=[
 ['src/screens.js','100 questões iniciais · 50 conceitos','${bank.questions.length} questões · ${bank.concepts.length} conceitos'],
 ['src/screens-profile.js','As 100 questões e 50 flashcards são uma amostra inicial; não cobrem sozinhos todos os assuntos do vestibular.','O banco atual tem ${bank.questions.length} questões e ${bank.concepts.length} conceitos; ele cobre uma seleção pedagógica ampla, sem substituir a leitura integral do edital.'],
 ['src/screens-profile.js','<strong>${stats.studied}<small>/50</small>','<strong>${stats.studied}<small>/${bank.concepts.length}</small>'],
 ['src/screens-library.js','O banco de 100 questões ainda não tem um exercício específico para ele.','O banco atual ainda não tem um exercício específico para ele.']
];
for(const [file,from,to] of replacements){const p=fs.readFileSync(file,'utf8');if(!p.includes(from)) continue;fs.writeFileSync(file,p.replaceAll(from,to));}
console.log('Textos dinâmicos atualizados.');
