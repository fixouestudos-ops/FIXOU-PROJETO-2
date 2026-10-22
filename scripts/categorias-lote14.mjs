import fs from 'node:fs';
const bank=JSON.parse(fs.readFileSync('content/bank.json','utf8'));
const m=new Map(bank.questions.map(q=>[q.id,q]));
const alvos=JSON.parse(fs.readFileSync('scripts/lote14-explicacoes.json','utf8'));
const VEST=['Fuvest','Unicamp','Unesp','UNESP','Uerj','UERJ','ITA','IME','ENEM','Mackenzie','UECE','Uece','UFMG','UFSC','UFRJ','UFG','UEPG','Acafe','ACAFE','PUC','Fuvest/ETE'];
for(const id of Object.keys(alvos)){
 const q=m.get(id);
 const t=(q.prompt||'')+' '+(q.source||'');
 const v=VEST.find(x=>t.includes(x));
 if(!v)console.log('SEM VESTIBULAR:',id,'| prompt inicio:',q.prompt.slice(0,60));
}
console.log('\n--- checar prompts com indicios de imagem (texto de diagrama) ---');
const manifest=JSON.parse(fs.readFileSync('reports/physics-scientific-review/lote-14-manifest.json','utf8'));
const suspeitos=[];
for(const x of manifest){
 const q=m.get(x.id);
 if(!q)continue;
 const p=q.prompt||'';
 // heuristicas: "Sem atrito", "Plano inclinado", sequencias de letras isoladas
 if(/Sem atrito|Plano inclinado|figura|diagrama/i.test(p)||/\b[A-Z]\s+[A-Z]\s+[A-Z]\b/.test(p)){
  suspeitos.push(x.id+' | '+p.slice(0,90).replace(/\n/g,' '));
 }
}
console.log('suspeitos de depender de imagem:',suspeitos.length);
suspeitos.slice(0,12).forEach(s=>console.log('  '+s));
console.log('\n--- coverage baixo (OCR) ---');
const cat=JSON.parse(fs.readFileSync('scripts/lote14-categorias.json','utf8'));
cat.ocrList.forEach(s=>console.log('  '+s));
