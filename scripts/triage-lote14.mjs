import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const DEST=path.join(ROOT,'reports','physics-scientific-review','lote-14-revisao-assistida');
fs.mkdirSync(DEST,{recursive:true});
const bank=JSON.parse(fs.readFileSync(path.join(ROOT,'content/bank.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'reports','physics-scientific-review','lote-14-manifest.json'),'utf8'));
const patches=JSON.parse(fs.readFileSync(path.join(ROOT,'reports','physics-scientific-review','lote-14-patches.json'),'utf8'));
const props=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts','fixou_lote14_correcoes_adicionais.json'),'utf8'));
const allq=new Map(bank.questions.map(q=>[q.id,q]));
const pp=new Map(patches.map(p=>[p.id,p]));
// 22 ja aplicados no commit 5e7762e
const JA_APLICADOS=['fis-lic-l2-f1-c6-exercicios-complementares-q43','fis-lic-l2-f1-c6-exercicios-propostos-q37','fis-lic-l2-f1-c6-exercicios-propostos-q38','fis-lic-l2-f1-c6-exercicios-propostos-q44','fis-lic-l2-f1-c7-exercicios-complementares-q30','fis-lic-l2-f1-c7-exercicios-propostos-q17','fis-lic-l2-f1-c7-exercicios-propostos-q25','fis-lic-l2-f1-c8-exercicios-complementares-q12','fis-lic-l2-f1-c8-exercicios-complementares-q19','fis-lic-l2-f1-c8-exercicios-complementares-q22','fis-lic-l2-f1-c8-exercicios-complementares-q24','fis-lic-l2-f1-c8-exercicios-complementares-q42','fis-lic-l2-f1-c8-exercicios-propostos-q1','fis-lic-l2-f1-c8-exercicios-propostos-q14','fis-lic-l2-f1-c8-exercicios-propostos-q19','fis-lic-l2-f1-c8-exercicios-propostos-q21','fis-lic-l2-f1-c8-exercicios-propostos-q25','fis-lic-l2-f1-c8-exercicios-propostos-q27','fis-lic-l2-f1-c8-revisando-q15','fis-lic-l2-f2-c5-exercicios-propostos-q10','fis-lic-l2-f2-c5-exercicios-propostos-q20','fis-lic-l2-f3-c9-exercicios-complementares-q9'];
const jaSet=new Set(JA_APLICADOS);
if(manifest.length!==200)throw new Error('manifesto != 200');
if(new Set(manifest.map(x=>x.id)).size!==200)throw new Error('ids duplicados no manifesto');
for(const x of manifest){if(!allq.has(x.id))throw new Error('id ausente no banco: '+x.id);if(!pp.has(x.id))throw new Error('patch ausente: '+x.id);}
console.log('validacao: 200 ids unicos, todos no banco e com patch');
// verificar estado dos 22 ja aplicados
let jaOk=0,jaQuebrado=0;
for(const id of JA_APLICADOS){
 const q=allq.get(id);
 if(q.explanation.includes('Converta primeiro')||q.explanation.includes('coincide com o gabarito')){console.log('ALERTA 22 revertido/generico: '+id);jaQuebrado++;}
 else jaOk++;
}
console.log('22 ja aplicados: intactos='+jaOk+' | revertidos='+jaQuebrado);
// classificar
const corrections=props.corrections||{};
const issues=props.issues||{};
const examRe=/^(ENEM|FUVEST|UNICAMP|UNESP|VUNESP|UERJ|UEM|UFMS|ITA|IME|MACKENZIE|PUC|UFPR|UEL|UFMG|UFV|UFG|UFSC|UFRJ|UFRGS|UFBA|UFPE|UECE|UNB|FATEC|FGV|ACAFE|UEPG|UPE|UFSM|UFAL|UFRN|UFSCAR|IF|UDESC|ETEC|UTFPR|FAMEMA|FAMERP|CEFET|EFOMM|UFAM|UNIFOR|FCM|UFTM|UEFS|CPS|FICSAE|Fuvest\/ETE)/i;
const records=[];
const classes={resolved_reviewed:[],unchanged_correct:[],missing_visual_evidence:[],prompt_corrupt:[],answer_mismatch:[],non_vestibular:[],source_not_verified:[],pending_review:[]};
for(const entry of manifest){
 const q=allq.get(entry.id);
 const risks=[];
 const prompt=(q.prompt||'').trim();
 const examMarker=examRe.test(prompt);
 if(!examMarker)risks.push('verify_vestibular_origin');
 if(q.imageClassification==='needs_visual_review')risks.push('needs_visual_review');
 if(!(q.imageAssets||[]).length&&risks.includes('needs_visual_review'))risks.push('no_image_attached');
 if(q.needsReview)risks.push('needs_review_flag');
 const issue=issues[entry.id];
 if(issue)risks.push('documented_mismatch_or_missing_data');
 const prop=corrections[entry.id];
 const isJa=jaSet.has(entry.id);
 // classe preliminar por risco
 let classe;
 if(isJa)classe='resolved_reviewed';
 else if(issue&&/incompat|bloquear|mismatch|outra quest|troca|contrad|não concluir|nao concluir|ileg|corrompid|ausente|depende|sem dimens|sem dado/i.test(issue))classe='blocked_issue';
 else if(risks.includes('needs_visual_review')&&risks.includes('no_image_attached'))classe='missing_visual_evidence';
 else if(prop)classe='candidate_correction';
 else classe='pending_review';
 records.push({id:q.id,subtopic:q.subtopic||'indefinido',source:q.source,sourceVolume:q.sourceVolume,sourcePage:q.sourcePage,examMarker,type:q.type,prompt:q.prompt,options:q.options,answer:q.answer,answerKeyText:q.answerKeyText,explanation_current:q.explanation,contentStatus:q.contentStatus,imageClassification:q.imageClassification,needsReview:q.needsReview,officialIds:q.officialIds,risks,proposed_explanation:prop||null,documented_issue:issue||null,already_applied:isJa,prelim_class:classe});
}
const counts={};
for(const r of records)counts[r.prelim_class]=(counts[r.prelim_class]||0)+1;
console.log('\nclasses preliminares:');
for(const [k,v] of Object.entries(counts).sort((a,b)=>b[1]-a[1]))console.log('  '+k+': '+v);
// interseccao: propostas que nao estao entre os 22
const propIds=Object.keys(corrections);
const foraDos22=propIds.filter(id=>!jaSet.has(id));
console.log('\npropostas no JSON:',propIds.length,'| ja aplicadas (22):',propIds.filter(id=>jaSet.has(id)).length,'| novas para verificar:',foraDos22.length);
const issuesIds=Object.keys(issues);
console.log('issues documentadas:',issuesIds.length);
fs.writeFileSync(path.join(DEST,'triage.json'),JSON.stringify({total:200,already_applied:JA_APLICADOS.length,proposals_total:propIds.length,proposals_new:foraDos22.length,issues_count:issuesIds.length,class_counts:counts,generated_at:new Date().toISOString()},null,2),'utf8');
fs.writeFileSync(path.join(DEST,'manifest-full.json'),JSON.stringify(records,null,2),'utf8');
console.log('\ngravado: '+DEST+'\\triage.json e manifest-full.json');
// gerar pacotes por subtopic, max 12, apenas os que precisam de acao (nao ja aplicados)
const porSub={};
for(const r of records){
 if(r.already_applied)continue;
 (porSub[r.subtopic]=porSub[r.subtopic]||[]).push(r);
}
let pacote=0;
const pacoteIndex=[];
for(const [sub,items] of Object.entries(porSub)){
 items.sort((a,b)=>a.id.localeCompare(b.id));
 for(let i=0;i<items.length;i+=12){
  pacote++;
  const fatia=items.slice(i,i+12);
  const fn=path.join(DEST,'packet-'+String(pacote).padStart(2,'0')+'.jsonl');
  fs.writeFileSync(fn,fatia.map(x=>JSON.stringify(x)).join('\n')+'\n','utf8');
  pacoteIndex.push({pacote,subtopic:sub,count:fatia.length,ids:fatia.map(x=>x.id)});
 }
}
fs.writeFileSync(path.join(DEST,'packets-index.json'),JSON.stringify(pacoteIndex,null,2),'utf8');
console.log('pacotes gerados: '+pacote+' (max 12 IDs cada), em '+DEST);
console.log('total de IDs para processar (fora dos 22): '+records.filter(r=>!r.already_applied).length);
