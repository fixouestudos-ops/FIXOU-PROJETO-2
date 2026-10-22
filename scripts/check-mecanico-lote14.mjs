import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const DEST=path.join(ROOT,'reports','physics-scientific-review','lote-14-revisao-assistida');
const records=JSON.parse(fs.readFileSync(path.join(DEST,'manifest-full.json'),'utf8'));
const GEN=/Converta primeiro|coincide com o gabarito|escolha a rela[çc][ãa]o que cont[êe]m a inc[óo]gnita|confira a dimens[ãa]o f[íi]sica/;
function tokensNum(s){return [...String(s).matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>Number(m[0].replace(',','.'))).filter(n=>!isNaN(n)&&n!==0&&Math.abs(n)<1e9);}
function contemNum(exp,n){
 const cands=[n.toString(),n.toFixed(2),n.toFixed(1),n.toFixed(3)].map(x=>x.replace('.',',')).concat([n.toString()]);
 return cands.some(c=>exp.includes(c));
}
function letraGabarito(r){
 if(r.type!=='choice'||typeof r.answer!=='number')return null;
 return 'ABCDE'[r.answer];
}
const resultados=[];
for(const r of records){
 if(r.already_applied)continue;
 const prop=r.proposed_explanation,issue=r.documented_issue;
 const bloqueadora=issue&&/incompat|bloquear|mismatch|outra quest|troca de quest|contrad|nao concluir|não concluir|ileg[íi]vel|corrompid|ausente|depende|sem dimens|sem dado|não é poss|nao e poss/i.test(issue);
 if(!prop){resultados.push({id:r.id,status:'sem_proposta',motivo:issue?'issue_documentada':'sem correcao',classe:r.prelim_class});continue;}
 const probs=[];
 if(GEN.test(prop))probs.push('template_generico');
 if(prop.includes('**'))probs.push('markdown_residual');
 const palavras=prop.split(/\s+/).length;
 if(palavras<15)probs.push('curta_demais('+palavras+')');
 const nums=tokensNum(r.answer);
 const faltando=nums.filter(n=>!contemNum(prop,n));
 if(faltando.length>Math.max(1,Math.ceil(nums.length*0.5)))probs.push('gabarito_ausente:'+faltando.slice(0,4).join(','));
 // letra da alternativa
 const letra=letraGabarito(r);
 if(letra&&!prop.toUpperCase().includes('ALTERNATIVA '+letra)&&!prop.toUpperCase().includes('ALTERNATIVA '+letra+',')){
  // nao e erro automatico, apenas observacao se a opcao tiver texto
  const op=r.options&&r.options[r.answer];
  if(op&&!prop.includes(String(op).slice(0,20)))probs.push('letra_'+letra+'_nao_mencionada');
 }
 let status=bloqueadora?'bloqueada_issue':probs.length?'probs':'pronta';
 resultados.push({id:r.id,status,palavras,letra,probs,issue:issue?issue.slice(0,100):null,classe:r.prelim_class});
}
const contagem={};
for(const x of resultados)contagem[x.status]=(contagem[x.status]||0)+1;
console.log('=== refinamento ===');
for(const [k,v] of Object.entries(contagem).sort((a,b)=>b[1]-a[1]))console.log('  '+k+': '+v);
console.log('\nprobs restantes:');
for(const x of resultados.filter(y=>y.status==='probs'))console.log('  '+x.id+' | '+x.probs.join(' | '));
console.log('\nsem_proposta (43 para resolver individualmente):');
for(const x of resultados.filter(y=>y.status==='sem_proposta'))console.log('  '+x.id+' | '+x.motivo+' | classe='+x.classe);
fs.writeFileSync(path.join(DEST,'mecanica-check.json'),JSON.stringify(resultados,null,2),'utf8');
