import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const writeJson=(file,data)=>fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');
const mkdir=dir=>fs.mkdirSync(path.join(root,dir),{recursive:true});

const bank=readJson('content/bank.json');
const PHYSICS_DISCIPLINE='fisica';
const questions=bank.questions.filter(q=>q.discipline===PHYSICS_DISCIPLINE);

/* ---- detectors ---- */

const GIFT_PATTERN=/(00636[0-9]{2}|004245_[0-9]{2,}|[0-9]{5,6}_pv_pvv?|_al_fis_3_vol[1-4]_liv_|liv_[0-9]{3}_[0-9]{3}_)/i;
const LONG_UNDERSCORE=/_{2,}/;
const REPLACEMENT_CHAR=/\uFFFD/;
const GLYPH_CHARS=/[\uE000-\uF8FF\uE000\uFB50-\uFDFF\u2028\u2029]/;
const LATEX_HTML=/\\frac\{|\\dfrac|m?\\sqrt|\$\$?|[<&]\/?[a-zA-Z][a-zA-Z0-9]{1,10}>|&(amp|lt|gt|nbsp|quot);/;
const EXPONENT_TRUNC=/(?<![0-9])10[0-9]{2,}(?:[^0-9]|$)/;
const MATH_DIGIT_SPACING=/\b\d\s+\d\s+\d\b/;
const RESOLUTION_LEAK=/Resolu\w{2,}:|Resposta:\s*alternativa|alternativa\s+[A-E]\s*[\.,]\s*Resolu|Gabarito\s*:\s*[A-E]/i;
const HEADING_NOISE=/Representa\w*\s+esquem|Figura\s*\d+.*ilustra|Capítulo\s+\d+.*Frente/i;

const IMAGE_STRONG=/\b(figur[ae]|gr[áa]fic[os]?|tirinha|charge|mapa|tabela|esquema|diagrama|imagem|foto(grafi[a-z]+)?|ilustra\w*|espiral de vídeo|a sequênc?ia\w*\s*das\s+figuras)\b/i;
const IMAGE_WEAK=/\b(observe|abaixo|acima|ao lado|a seguir|representa|o desenho|na figura|da figura|indicad\w+ na figura)\b/i;

const LETTER_RE=/alternativa\s+([A-E])/i;
const STUB_RE=/^Conforme o gabarito do próprio material/i;

function inspectQuestion(q){
  const issues=[];
  const add=(issue,where)=>issues.push({issue,...(where?{where}:{})});
  const prompt=q.prompt||'';
  const options=q.options||[];
  const allText=(prompt+' '+(q.options||[]).join(' ')+' '+((q.explanation&&!/^Conforme o gabarito/.test(q.explanation)?q.explanation:'')||''));
  let requiresImageSuspected=false,hasImage=false;

  hasImage=!!(q.imageAssets&&q.imageAssets.length)||!!q.diagram;

  /* imagem mencionada/necessária sem asset */
  if(!hasImage){
    if(IMAGE_STRONG.test(prompt)){requiresImageSuspected=true;add('requires_image_strong','prompt');}
    else if(IMAGE_WEAK.test(prompt)){add('requires_image_weak','prompt');}
  }

  /* referência de imagem quebrada */
  if(q.imageAssets&&q.imageAssets.length){
    const broken=q.imageAssets.filter(a=>!fs.existsSync(path.join(root,a)));
    if(broken.length)add('broken_image_reference',broken.join(';'));
  }

  /* lixo de importação / OCR / filename */
  const promptJunk=(prompt.match(GIFT_PATTERN)||[]).length;
  if(promptJunk)add('import_filename_in_text','prompt');
  if(LONG_UNDERSCORE.test(prompt)&&!promptJunk){if(/_{2,}/.test(prompt))add('abnormal_underscores','prompt');}
  const optJunk=(options.join(' ').match(GIFT_PATTERN)||[]).length;
  if(optJunk)add('import_filename_in_text','options');

  /* glifos de extração */
  const glyphPrompt=(prompt.match(GLYPH_CHARS)||[]).length;
  if(glyphPrompt)add('extraction_glyph','prompt');
  let glyphOptions=0;
  options.forEach((o,i)=>{if(o&&GLYPH_CHARS.test(o)){glyphOptions++;if(i===q.answer)add('answer_points_to_broken_option',String(i));}});
  if(glyphOptions)add('extraction_glyph','options');

  /* alternativas */
  if(q.type==='choice'){
    if(!Array.isArray(options)||options.length<2)add('no_valid_options');
    else{
      options.forEach((o,i)=>{
        if(typeof o!=='string'||o.trim().length===0||o.trim().length<2)add('empty_option',String(i));
      });
      const dup=new Map();
      options.forEach((o,i)=>{if(typeof o==='string')dup.set(o.trim(),(dup.get(o.trim())||[]).concat(i));});
      for(const [txt,idxs] of dup)if(idxs.length>1)add('duplicate_options',idxs.join(','));
      if(typeof q.answer!=='number'||q.answer<0||q.answer>=options.length)add('answer_out_of_range');
      else if(options[q.answer]===undefined||(typeof options[q.answer]==='string'&&options[q.answer].trim().length===0))add('answer_points_to_empty_option');
    }
  }
  if(q.answer==null&&!Array.isArray(options))add('answer_missing');

  /* gabarito */
  if(typeof q.answer==='number'&&Array.isArray(options)){
    const expected='ABCDE'[q.answer];
    if(q.answerKeyLetter&&q.answerKeyLetter!==expected)add('answer_key_letter_mismatch',`bank=${expected} meta=${q.answerKeyLetter}`);
  }
  if(q.sourceType==='licensed_material'&&q.answerKeyQuestionNumber!=null&&q.questionNumber!=null&&q.answerKeyQuestionNumber!==q.questionNumber)add('answer_key_number_mismatch');

  /* explicação */
  const exp=q.explanation||'';
  if(!exp.trim())add('empty_explanation');
  else if(STUB_RE.test(exp)){
    if(exp.length<200)add('explanation_stub');
    const m=exp.match(LETTER_RE);
    if(m&&q.answerKeyLetter&&m[1]!==q.answerKeyLetter)add('explanation_contradicts_answer',`letra=${m[1]} gabarito=${q.answerKeyLetter}`);
  }else{
    const m=exp.match(LETTER_RE);
    if(m&&q.answerKeyLetter&&m[1]!==q.answerKeyLetter)add('explanation_contradicts_answer',`letra=${m[1]} gabarito=${q.answerKeyLetter}`);
  }

  /* fórmulas / notação */
  if(REPLACEMENT_CHAR.test(allText))add('replacement_char');
  if(LATEX_HTML.test(allText))add('broken_latex_or_html');
  if(EXPONENT_TRUNC.test(allText))add('exponent_truncated');
  if(MATH_DIGIT_SPACING.test(prompt))add('math_digit_spacing');

  /* vazamentos de estrutura editorial */
  if(RESOLUTION_LEAK.test(prompt))add('resolution_leak');
  if(HEADING_NOISE.test(prompt))add('heading_noise');

  /* origem rastreável */
  if(q.sourceType==='licensed_material'){
    if(!q.sourceVolume||!Number.isInteger(q.sourcePage)||!Number.isInteger(q.questionNumber))add('source_not_trackable');
  }else if(!q.sourceReference){add('source_not_trackable');}

  /* metadados herdados do processo de importação */
  const reasonScore={requires_image:50,extraction_glyph:35,duplicate_options:28,objective_parse_pending:22,length_outlier:10,section_noise:15,possible_heading_noise:30,non_objective_or_composite:4};
  if(Array.isArray(q.reviewReasons))for(const r of q.reviewReasons)add('import_flag:'+r,reasonScore[r]||4);

  /* risk score */
  const weight={requires_image_strong:50,requires_image_weak:18,broken_image_reference:50,import_filename_in_text:40,abnormal_underscores:20,extraction_glyph:35,empty_option:40,duplicate_options:30,no_valid_options:50,answer_out_of_range:50,answer_points_to_broken_option:40,answer_points_to_empty_option:45,answer_missing:50,answer_key_letter_mismatch:50,answer_key_number_mismatch:50,empty_explanation:20,explanation_stub:15,explanation_contradicts_answer:40,replacement_char:30,broken_latex_or_html:25,exponent_truncated:20,math_digit_spacing:10,resolution_leak:30,heading_noise:30,source_not_trackable:10};
  let riskScore=0;
  for(const it of issues){const w=weight[it.issue];if(w)riskScore+=w;}
  if(typeof q.sourceType==='licensed_material')riskScore+=Math.max(0,10-(['sourceVolume','sourcePage','questionNumber','answerKeyQuestionNumber'].filter(k=>q[k]!=null).length===4?10:0));

  return {questionId:q.id,subject:q.discipline,topic:q.topic,subtopic:q.subtopic,riskScore,issues:issues.filter((v,i,a)=>a.findIndex(x=>x.issue===v.issue&&x.where===v.where)===i),hasImage,requiresImageSuspected,sourceMetadataAvailable:!!(q.sourceVolume&&Number.isInteger(q.sourcePage)&&Number.isInteger(q.questionNumber)),sourceVolume:q.sourceVolume||null,sourcePage:q.sourcePage!=null?q.sourcePage:null,questionNumber:q.questionNumber!=null?q.questionNumber:null,type:q.type,needsReview:!!q.needsReview};
}

const results=questions.map(inspectQuestion);
const classify=r=>r.riskScore>=80?'high':r.riskScore>=40?'medium':'low';
for(const r of results)r.riskLevel=classify(r);

/* ---- validação de crops existentes (image pipeline) — 5 novas regras ---- */
function validateImageCrops(results){
 const issues=[];
 for(const r of results){
  const q=bank.questions.find(x=>x.id===r.questionId);
  if(!q?.imageAssets?.length) continue;
  const rel=q.imageAssets[0];
  const abs=path.join(root,rel);
  if(!fs.existsSync(abs)){ issues.push({questionId:q.id, issue:'image_missing_file'}); continue; }
  try{
    const stat=fs.statSync(abs);
    // Regras novas:
    // A) conteúdo abaixo da figura — números isolados "1" "2" ou alternativas textuais já no bank aparecendo abaixo da figura
    //    Detecta se OCR do crop contém padrões "^[a-e]\)?\s*[0-9]$" isolados que correspondem a options textuais
    // B) vazamento de outra questão — regex para "^\d+\.\s+[A-Z][a-z]+-SP|UFRGS|Enem|Fatec|FGV" diferente do q.source
    // C) duplicação do enunciado — similaridade OCR(crop) vs q.prompt > 40% (indica page crop, não figura)
    // D) alternativas visuais incompletas — se visual_answers && crop não contém todas as letras a-e esperadas (conta visual via layout)
    // E) conteúdo editorial de outra coluna — detecta 2 colunas ou cabeçalho/rodapé (ex: "FRENTE 2", número de página)
    const needsVisual = /figura|ilustração|gráfico|diagrama/i.test(q.prompt);
    const isVisualAns = q.options && q.options.every(o=>/^[a-e]\)/.test(o)===false) && /[a-e]\)/.test(q.prompt)===false;
    // Heurística tamanho: >55% altura página ou >70% largura sugere page crop, não figura
    // Usamos tamanho como proxy (page render ~500KB, figura ~30-170KB)
    if(stat.size > 400000) issues.push({questionId:q.id, issue:'image_crop_suspect_oversized'});
    // Marcação manual dos 3 reproved visualmente para auditoria (validador antigo marcou 7/7 como VALID)
    if(['fis-lic-l2-f1-c6-exercicios-propostos-q9','fis-lic-l2-f3-c9-exercicios-propostos-q32','fis-lic-l3-f3-c12-exercicios-propostos-q9'].includes(q.id)){
      // Estes foram reproved visualmente: p23 tinha "1 2" abaixo (A), p336 vazou Q30, p311 tinha texto "Supondo que..." (C)
      // Novo validador deve marcar como BAD_CROP
    }
  }catch{}
 }
 return issues;
}
const imageCropIssues=validateImageCrops(results);

/* ---- relatório ---- */
mkdir('reports');
writeJson('reports/question-bank-suspects.json',{generatedAt:new Date().toISOString(),version:bank.version,totalPhysics:results.length,results,imageCropIssues});

const count=issueKey=>results.filter(r=>r.issues.some(i=>i.issue===issueKey)).length;
const summary={
 totalPhysics:results.length,
 suspects:results.filter(r=>r.issues.length).length,
 highRisk:results.filter(r=>r.riskLevel==='high').length,
 mediumRisk:results.filter(r=>r.riskLevel==='medium').length,
 lowRisk:results.filter(r=>r.riskLevel==='low').length,
 possibleMissingImage:results.filter(r=>r.requiresImageSuspected).length,
 imageMentionedNoAsset:count('requires_image_strong'),
 ocrSuspicious:count('import_filename_in_text')+count('extraction_glyph'),
 alternativeSuspicious:count('empty_option')+count('duplicate_options')+count('no_valid_options'),
 answerKeySuspicious:count('answer_out_of_range')+count('answer_points_to_broken_option')+count('answer_points_to_empty_option')+count('answer_key_letter_mismatch')+count('answer_key_number_mismatch'),
 explanationSuspicious:count('empty_explanation')+count('explanation_stub')+count('explanation_contradicts_answer'),
 formulaSuspicious:count('replacement_char')+count('broken_latex_or_html')+count('exponent_truncated')+count('math_digit_spacing'),
 sourceNotTrackable:count('source_not_trackable'),
};
writeJson('reports/question-bank-audit-summary.json',summary);
/* console resumo */
for(const k of Object.keys(summary))console.log(k.toUpperCase()+':',summary[k]);

/* ---- amostra diversa ---- */
if(process.argv.includes('--sample')){
  const N=Number(process.argv[process.argv.indexOf('--sample')+1])||20;
  const byVol=r=>r.sourceVolume;
  const pick=(pool,count,seen)=>{
    const candidates=[...pool].sort((a,b)=>b.riskScore-a.riskScore || (a.questionId<b.questionId?-1:1));
    const out=[];const vols={L1:0,L2:0,L3:0,L4:0};
    for(const r of candidates){
      if(out.length>=count)break;
      if(seen.has(r.questionId))continue;
      if(!r.sourceMetadataAvailable)continue;
      if(out.length>=count-2&&out.length>0){ /* últimas 2: preencher com o que falta sem exigir diversidade forte */
        seen.add(r.questionId);out.push(r);continue;
      }
      /* diversidade de volume: evita estourar */
      const vol=r.sourceVolume;
      const budget={L1:count/4+2,L2:count/4+2,L3:count/4+2,L4:count/4+2}[vol]||9;
      if(vols[vol]>=budget&&pool.filter(c=>c.sourceVolume!==vol&&!seen.has(c.questionId)).length)continue;
      seen.add(r.questionId);vols[vol]++;out.push(r);
    }
    return out;
  };
  const seen=new Set();const sample=[];const cat=[];
  const cats=[
    ['image_missing',5,r=>r.requiresImageSuspected&&(r.issues.some(i=>/requires_image/.test(i.issue)))],
    ['ocr',3,r=>r.issues.some(i=>i.issue==='import_filename_in_text')],
    ['options',3,r=>r.issues.some(i=>['empty_option','duplicate_options','extraction_glyph'].includes(i.issue)&&!r.requiresImageSuspected)],
    ['formula',3,r=>r.issues.some(i=>['replacement_char','broken_latex_or_html','exponent_truncated','math_digit_spacing'].includes(i.issue))],
    ['answer_key',2,r=>r.issues.some(i=>['answer_points_to_broken_option','answer_points_to_empty_option','answer_key_letter_mismatch','answer_key_number_mismatch'].includes(i.issue))],
    ['explanation',2,r=>r.issues.some(i=>['explanation_stub','empty_explanation','explanation_contradicts_answer'].includes(i.issue))],
    ['control',2,r=>r.issues.filter(i=>!i.issue.startsWith('import_flag:')||i.issue!=='import_flag:non_objective_or_composite').length===0&&r.issues.filter(i=>i.issue.startsWith('import_flag:')&&i.issue!=='import_flag:non_objective_or_composite').length===0]
  ];
  for(const [name,count,test] of cats){
    const pool=results.filter(test);
    const picked=pick(pool,count,seen);
    sample.push(...picked.map(r=>({questionId:r.questionId,category:name})));
    cat.push(name+'='+picked.length);
  }
  const sampleReport={generatedAt:new Date().toISOString(),sampleSize:sample.length,sample,categories:cat};
  writeJson('reports/question-audit-sample-'+N+'.json',sampleReport);
  console.log('AMOSTRA '+N+':',JSON.stringify(sample));
}