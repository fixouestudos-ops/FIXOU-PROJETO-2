import {escapeHTML} from './utils.js';
import {AI_AUDIT_BATCH} from './ai-audit-batch.js';
import {AI_AUDIT_BASELINE} from './ai-audit-baseline.js';
import {AI_AUDIT_LOTS} from './ai-audit-lots.js';

const IMAGE_CLASSIFICATIONS={
 no_image_required:{label:'Sem imagem',color:'#3cc88d'},
 image_required:{label:'Com imagem',color:'#e66a74'},
 needs_visual_review:{label:'Dúvida visual',color:'#f0b04e'},
 bad_image_association:{label:'Imagem incorreta',color:'#e66a74'}
};

const IMAGE_STATUSES={
 no_image_required:{label:'Sem imagem',color:'#3cc88d'},
 needs_visual_review:{label:'Pendente',color:'#f0b04e'},
 approved:{label:'Aprovada',color:'#3cc88d'},
 approved_manual:{label:'Aprovada (manual)',color:'#3cc88d'},
 bad_crop:{label:'Crop ruim',color:'#e66a74'},
 no_image_confirmed:{label:'Sem imagem confirmada',color:'#3cc88d'},
 bad_image_association:{label:'Imagem incorreta',color:'#e66a74'},
 needs_manual_crop:{label:'Precisa recorte',color:'#f0b04e'}
};

const CONTENT_STATUSES={
 pending:{label:'Pendente',color:'#f0b04e'},
 validated:{label:'Validado',color:'#3cc88d'},
 not_approved:{label:'Não aprovada',color:'#e66a74'},
 needs_content_review:{label:'Revisão de conteúdo',color:'#e66a74'}
};

const IMAGE_PENDENT_STATUSES=['needs_manual_crop','needs_visual_review','bad_crop','bad_image_association'];

export function hasImagePendency(q){
 if(!q)return false;
 return IMAGE_PENDENT_STATUSES.includes(q.imageStatus)||IMAGE_PENDENT_STATUSES.includes(q.imageClassification);
}

export function isBlockedForStudent(q){
 if(!q)return true;
 if(q.needsReview)return true;
 if(!AI_AUDIT_BATCH.ids.includes(q.id))return false;
 return q.contentStatus!=='validated'||hasImagePendency(q);
}

const SOURCE_BOOK_DRIVE={
 L1:'1QSvRDEnftpASkXpUKwDvGdJ2VBRLon2l',
 L2:'1zmb7INyQXBWENZBEOJ9t5mBlgw1upbXZ',
 L3:'1KJBD1Ip2zXqRWt1ieqfDkEoHsHtGyphM',
 L4:'1mudd-ye9UiCsTPW_Ihx3M_-l1bMDYn4t'
};

function driveUrl(volume,page){
 const id=SOURCE_BOOK_DRIVE[volume];
 if(!id)return null;
 return `https://drive.google.com/file/d/${id}/view`;
}

function filterQuestions(questions,filter){
 if(filter==='all')return questions;
 if(filter==='image_required')return questions.filter(q=>q.imageClassification==='image_required'||q.imageClassification==='needs_visual_review'||q.imageClassification==='bad_image_association');
 if(filter==='no_image_required')return questions.filter(q=>q.imageClassification==='no_image_required');
 if(filter==='needs_visual_review')return questions.filter(q=>q.imageClassification==='needs_visual_review');
 if(filter==='approved')return questions.filter(q=>q.contentStatus==='validated'||q.imageStatus==='approved'||q.imageStatus==='approved_manual'||q.imageStatus==='no_image_confirmed');
 if(filter==='needs_content_review')return questions.filter(q=>q.contentStatus!=='validated'&&q.contentStatus!=='not_approved');
 if(filter==='not_approved')return questions.filter(q=>q.contentStatus==='not_approved');
 return questions;
}

function searchQuestions(questions,search){
 if(!search)return questions;
 const s=search.toLowerCase();
 return questions.filter(q=>q.id.toLowerCase().includes(s)||(q.prompt||'').toLowerCase().includes(s)||(q.sourceBook||'').toLowerCase().includes(s)||String(q.sourcePage||'').includes(s)||String(q.questionNumber||'').includes(s));
}

function sourceLabel(q){
 if(q.sourceVolume&&q.sourcePage)return `${q.sourceVolume} · página ${q.sourcePage}${q.questionNumber?' · questão '+q.questionNumber:''}`;
 if(q.sourceBook&&q.sourcePage)return `${q.sourceBook} · página ${q.sourcePage}`;
 if(q.sourceReference)return q.sourceReference;
 return '';
}

function hasValidSource(q){
 return !!(q.sourceVolume&&q.sourcePage);
}

export function aiAuditStatus(q){
 if(q.contentStatus==='validated')return 'approved';
 if(q.contentStatus==='not_approved')return 'rejected';
 return 'awaiting';
}

export function aiAuditMembership(id){
 const memberships=[];
 if(AI_AUDIT_BATCH.historicalIds.includes(id))memberships.push('historical');
 if(AI_AUDIT_LOTS.lot12.ids.includes(id))memberships.push('lot12');
 if(AI_AUDIT_LOTS.lot13.ids.includes(id))memberships.push('lot13');
 return memberships;
}

export function aiAuditScientificResult(id,lotKey='all'){
 const keys=lotKey==='all'?['lot13','lot12']:lotKey==='historical'?[]:[lotKey];
 for(const key of keys){
  const manifest=AI_AUDIT_LOTS[key]?.manifestById[id];
  if(manifest)return manifest.divergence?'divergencia_documentada':manifest.result||'corrigida';
 }
 return 'historical';
}

export function aiAuditCompare(q,lotKey='all'){
 const keys=lotKey==='all'?['lot13','lot12']:lotKey==='historical'?[]:[lotKey];
 for(const key of keys){
  const lot=AI_AUDIT_LOTS[key],patch=lot?.patchById[q.id];
  if(!patch)continue;
  const fields=[...new Set([...Object.keys(patch.before||{}),...Object.keys(patch.after||{})])];
  return {available:true,kind:'lot',lot:lot.label,lotKey:key,commit:lot.commit,before:patch.before||{},after:patch.after||{},fields,changed:Object.fromEntries(fields.map(field=>[field,JSON.stringify(patch.before?.[field])!==JSON.stringify(patch.after?.[field])])),anyChanged:fields.length>0,justification:patch.justification||''};
 }
 const entry=AI_AUDIT_BASELINE[q.id];
 if(!entry)return {available:false};
 const before={prompt:entry.before.prompt||'',options:(entry.before.options||[]).slice(),answer:entry.before.answer,explanation:entry.before.explanation||''};
 const after={prompt:q.prompt||'',options:(q.options||[]).slice(),answer:q.answer,explanation:q.explanation||''};
 const changed={
  prompt:before.prompt!==after.prompt,
  options:JSON.stringify(before.options)!==JSON.stringify(after.options),
  answer:String(before.answer??'')!==String(after.answer??''),
  explanation:before.explanation!==after.explanation
 };
 return {available:true,kind:'historical',lot:entry.lot,lotKey:'historical',commit:entry.commit,before,after,fields:['prompt','options','answer','explanation'],changed,anyChanged:Object.values(changed).some(Boolean)};
}

function aiAnswerLabel(value,options){
 if(options&&options.length&&value!==''&&value!=null&&Number.isInteger(Number(value))&&options[Number(value)]!==undefined)return 'ABCDE'[Number(value)]+') '+options[Number(value)];
 return String(value==null?'?':value);
}

function aiAuditSections(q,lotFilter='all'){
 const cmp=aiAuditCompare(q,lotFilter);
 const memberships=aiAuditMembership(q.id);
 const revisionKeys=lotFilter==='all'?['lot13','lot12']:lotFilter==='historical'?[]:[lotFilter];
 const revisionKey=revisionKeys.find(key=>AI_AUDIT_LOTS[key]?.manifestById[q.id]);
 const manifest=revisionKey?AI_AUDIT_LOTS[revisionKey].manifestById[q.id]:null;
 const result=aiAuditScientificResult(q.id,lotFilter);
 const resultLabels={corrigida:'Corrigida por IA',verificada_sem_alteracao:'Verificada sem alteração',divergencia_documentada:'Divergência documentada',historical:'Revisão histórica'};
 const status=aiAuditStatus(q);
 const statusLabel=status==='approved'?'Aprovada pelo Owner':status==='rejected'?'Não aprovada pelo Owner':'Aguardando auditoria';
 let compare;
 if(cmp.available){
  const row=(label,beforeHtml,afterHtml,changed)=>`<div class="ai-diff-row${changed?' changed':''}"><div class="ai-diff-label">${label}${changed?' <span class="ai-diff-flag">alterado</span>':''}</div><div class="ai-diff-cols"><div class="ai-diff-cell">${beforeHtml}</div><div class="ai-diff-cell">${afterHtml}</div></div></div>`;
  const labels={prompt:'Enunciado',options:'Alternativas',answer:'Gabarito',answerKeyLetter:'Letra do gabarito',answerKeyText:'Texto do gabarito',explanation:'Explicação',type:'Tipo',sourcePage:'Página da fonte',sourceVolume:'Volume da fonte',sourceFront:'Frente da fonte',sourceChapter:'Capítulo da fonte',sourceSection:'Seção da fonte'};
  const value=(field,input,options)=>{
   if(input===undefined||input===null||input==='')return '—';
   if(field==='options')return (input||[]).map((o,i)=>'ABCDE'[i]+') '+escapeHTML(String(o))).join('<br>')||'—';
   if(field==='answer')return escapeHTML(aiAnswerLabel(input,options));
   if(Array.isArray(input)||typeof input==='object')return escapeHTML(JSON.stringify(input));
   return escapeHTML(String(input));
  };
  const fields=cmp.kind==='lot'?cmp.fields.filter(field=>cmp.changed[field]):cmp.fields;
  compare=`<div class="ai-section ai-compare"><h4>Comparação da correção <span class="ai-compare-meta">${escapeHTML(cmp.lot)} · commit ${escapeHTML(cmp.commit)}</span></h4>
  <div class="ai-diff-head"><span>Antes da correção</span><span>Depois da correção</span></div>
  ${fields.map(field=>row(labels[field]||field,value(field,cmp.before[field],cmp.before.options),value(field,cmp.after[field],cmp.after.options),cmp.changed[field])).join('')}
  ${cmp.justification?`<p class="ai-note"><strong>Justificativa:</strong> ${escapeHTML(cmp.justification)}</p>`:''}
  </div>`;
 }else{
  compare=result==='verificada_sem_alteracao'?'<div class="ai-section ai-compare"><h4>Comparação da revisão</h4><p class="ai-note">Verificada sem alteração: este lote não criou diferenças artificiais. A comparação histórica anterior continua preservada no filtro “Lotes históricos”.</p></div>':'<div class="ai-section ai-compare"><h4>Comparação da correção</h4><p class="ai-note">Versão anterior não disponível</p></div>';
 }
 const explanation=q.explanation?`<div class="ai-section"><h4>Explicação</h4><div class="ai-explanation-text">${escapeHTML(q.explanation)}</div></div>`:'<div class="ai-section"><h4>Explicação</h4><p class="ai-note">Sem explicação registrada.</p></div>';
 const lotLabels={historical:'Lotes históricos',lot12:'Lote 12',lot13:'Lote 13'};
 const origin=manifest?`PV Física ${escapeHTML(manifest.sourceVolume||'?')} · Frente ${escapeHTML(manifest.sourceFront??'?')} · Capítulo ${escapeHTML(manifest.sourceChapter??'?')} · ${escapeHTML(manifest.sourceSection||'?')} · p. ${escapeHTML(manifest.sourcePage??'?')} · questão ${escapeHTML(manifest.questionNumber??'?')}`:'Histórico de auditoria preservado';
 const divergence=manifest?.divergence?`<div class="ai-section ai-divergence"><h4>⚠ Divergência documentada</h4><p>${escapeHTML(manifest.divergence)}</p><p class="ai-note">Requer conferência humana; o gabarito não foi alterado para ocultar a divergência.</p></div>`:'';
 const info=`<div class="ai-section ai-audit-info"><h4>Informações de auditoria</h4><div class="ai-audit-meta">
  <span><strong>ID:</strong> <code>${escapeHTML(q.id)}</code></span>
  <span><strong>Status da auditoria:</strong> ${statusLabel}</span>
  <span><strong>Lotes:</strong> ${memberships.map(key=>escapeHTML(lotLabels[key])).join(' · ')}</span>
  <span><strong>Resultado científico:</strong> ${escapeHTML(resultLabels[result]||'Divergência documentada')}</span>
  <span><strong>Origem:</strong> ${origin}</span>
  <span><strong>Pendências de imagem:</strong> ${escapeHTML(q.imageStatus||'sem registro')}</span>
  <span><strong>needsReview:</strong> ${q.needsReview===true?'sim':'não'}</span>
 </div><p class="ai-note">Parte da fila versionada com ${AI_AUDIT_BATCH.total} IDs únicos. Aprovação somente manual pelo Owner; a liberação para estudantes respeita imageStatus e demais bloqueios existentes.</p></div>`;
 return explanation+info+divergence+compare;
}

function reviewQuestionCard(q,index,total,editingQuestion,editingFields={},aiAudit=false,aiAuditLotFilter='all'){
 const ic=IMAGE_CLASSIFICATIONS[q.imageClassification]||IMAGE_CLASSIFICATIONS.no_image_required;
 const is=IMAGE_STATUSES[q.imageStatus]||IMAGE_STATUSES.no_image_required;
 const cs=CONTENT_STATUSES[q.contentStatus]||CONTENT_STATUSES.pending;
 const hasImage=q.imageAssets&&q.imageAssets.length>0;
 const hasDiagram=!!q.diagram;
 const isEditing=editingQuestion===q.id;
 const promptText=isEditing?(editingFields.prompt||''):(q.prompt||'');
 const promptPreview=!isEditing&&q.prompt&&q.prompt.length>300?q.prompt.slice(0,300)+'…':q.prompt||'';
 const optionsHtml=(q.options||[]).map((o,i)=>`<div class="review-option${i===q.answer?' correct':''}"><span class="review-option-letter">${'ABCDE'[i]}</span><span>${escapeHTML(o)}</span></div>`).join('');
 const src=sourceLabel(q);
 const validSource=hasValidSource(q);
 const isNoImage=q.imageClassification==='no_image_required';
 const isImageReq=q.imageClassification==='image_required'||q.imageClassification==='needs_visual_review'||q.imageClassification==='bad_image_association';
 const isReview=q.imageClassification==='needs_visual_review';
 const hasOptions=q.options&&q.options.length>0;
 const currentAnswer=isEditing?(editingFields.answer||''):(q.answer!=null?String(q.answer):'?');
 const answerLabel=hasOptions&&currentAnswer!=='?'&&currentAnswer!==''?('ABCDE'[Number(currentAnswer)]||currentAnswer):currentAnswer;

 let promptSection='';
 if(isEditing){
  promptSection=`<div class="review-card-prompt-edit"><label class="review-edit-label">Enunciado</label><textarea class="review-edit-textarea" data-action="review-edit-prompt" rows="12">${escapeHTML(promptText)}</textarea></div>`;
 }else{
  promptSection=`<div class="review-card-prompt">${escapeHTML(promptPreview)}</div>`;
 }

 let answerSection='';
 if(isEditing){
  if(hasOptions){
   const radioHtml=(q.options||[]).map((o,i)=>{
    const letter='ABCDE'[i];
    const checked=String(i)===currentAnswer||letter===currentAnswer.toUpperCase()?'checked':'';
    return `<label class="review-edit-radio"><input type="radio" name="review-answer-${q.id}" value="${i}" data-action="review-edit-answer" ${checked}> ${letter}) ${escapeHTML(o)}</label>`;
   }).join('');
   answerSection=`<div class="review-card-answer-edit"><label class="review-edit-label">Gabarito</label><div class="review-edit-options">${radioHtml}</div></div>`;
  }else{
   answerSection=`<div class="review-card-answer-edit"><label class="review-edit-label">Gabarito</label><input class="review-edit-input" type="text" data-action="review-edit-answer" value="${escapeHTML(currentAnswer)}" placeholder="Ex: 250 s"></div>`;
  }
 }else{
  answerSection=`<div class="review-card-answer"><strong>Gabarito:</strong> ${hasOptions?(answerLabel):escapeHTML(currentAnswer)}</div>`;
 }

 let actions='';
  const pdfUrl=validSource?driveUrl(q.sourceVolume,q.sourcePage):null;
  if(isEditing){
  actions=`
   <button class="review-btn review-btn-save" data-action="review-save" data-id="${escapeHTML(q.id)}">Salvar alterações</button>
   <button class="review-btn review-btn-save-next" data-action="review-save-next" data-id="${escapeHTML(q.id)}">Salvar e próxima →</button>
   <button class="review-btn review-btn-cancel" data-action="review-cancel-edit" data-id="${escapeHTML(q.id)}">Cancelar</button>`;
 }else if(isNoImage){
  actions=`
   <button class="review-btn review-btn-edit" data-action="review-edit" data-id="${escapeHTML(q.id)}">Editar conteúdo</button>
   <button class="review-btn review-btn-confirm" data-action="review-confirm-no-image" data-id="${escapeHTML(q.id)}">Confirmar sem imagem</button>
   <button class="review-btn review-btn-mark-image" data-action="review-mark-needs-image" data-id="${escapeHTML(q.id)}">Esta questão precisa de imagem</button>
   ${pdfUrl?`<a class="review-btn review-btn-pdf" href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Abrir PDF original ↗</a>`:'<button class="review-btn review-btn-pdf disabled" disabled>Fonte não localizada</button>'}
   ${validSource?`<button class="review-btn review-btn-copy" data-action="review-copy-page" data-page="${q.sourcePage}">Copiar página</button>`:''}
   <button class="review-btn review-btn-mark" data-action="review-mark" data-id="${escapeHTML(q.id)}">Marcar para revisão</button>
   <button class="review-btn review-btn-copy" data-action="review-copy-id" data-id="${escapeHTML(q.id)}">Copiar ID</button>`;
 }else if(isImageReq){
  actions=`
   <button class="review-btn review-btn-edit" data-action="review-edit" data-id="${escapeHTML(q.id)}">Editar conteúdo</button>
   <button class="review-btn review-btn-approve" data-action="review-approve" data-id="${escapeHTML(q.id)}">Aprovar imagem</button>
   <button class="review-btn review-btn-crop" data-action="review-crop" data-id="${escapeHTML(q.id)}">Preciso recortar</button>
   <button class="review-btn review-btn-no-image" data-action="review-no-image" data-id="${escapeHTML(q.id)}">Não precisa de imagem</button>
   ${pdfUrl?`<a class="review-btn review-btn-pdf" href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Abrir PDF original ↗</a>`:'<button class="review-btn review-btn-pdf disabled" disabled>Fonte não localizada</button>'}
   ${validSource?`<button class="review-btn review-btn-copy" data-action="review-copy-page" data-page="${q.sourcePage}">Copiar página</button>`:''}
   <button class="review-btn review-btn-copy" data-action="review-copy-id" data-id="${escapeHTML(q.id)}">Copiar ID</button>
   <button class="review-btn review-btn-codex" data-action="review-copy-codex" data-id="${escapeHTML(q.id)}">Copiar comando Codex</button>`;
 }else{
  actions=`
   <button class="review-btn review-btn-edit" data-action="review-edit" data-id="${escapeHTML(q.id)}">Editar conteúdo</button>
   <button class="review-btn review-btn-mark" data-action="review-mark" data-id="${escapeHTML(q.id)}">Marcar para revisão</button>
   ${pdfUrl?`<a class="review-btn review-btn-pdf" href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Abrir PDF original ↗</a>`:'<button class="review-btn review-btn-pdf disabled" disabled>Fonte não localizada</button>'}
   ${validSource?`<button class="review-btn review-btn-copy" data-action="review-copy-page" data-page="${q.sourcePage}">Copiar página</button>`:''}
   <button class="review-btn review-btn-copy" data-action="review-copy-id" data-id="${escapeHTML(q.id)}">Copiar ID</button>`;
 }

 if(aiAudit&&!isEditing)actions=actions.split('Editar conteúdo').join('Editar correção');
  const approveContentBtn=!isEditing&&q.contentStatus!=='not_approved'?`<button class="review-btn review-btn-approve-content" data-action="${aiAudit?'ai-audit-approve':'review-approve-content'}" data-id="${escapeHTML(q.id)}">${aiAudit?'Aprovar correção':'✓ Aprovar conteúdo'}</button>`:'';
  const notApprovedBtn=!isEditing&&q.contentStatus!=='not_approved'&&q.contentStatus!=='validated'?`<button class="review-btn review-btn-not-approved" data-action="${aiAudit?'ai-audit-not-approve':'review-not-approve'}" data-id="${escapeHTML(q.id)}">✕ Não aprovar</button>`:'';
 const revertBtn=!isEditing&&q.contentStatus==='not_approved'?`<button class="review-btn review-btn-revert" data-action="review-revert-not-approved" data-id="${escapeHTML(q.id)}">Reverter para pendente</button>`:'';

 return `<div class="review-card${isEditing?' review-card-editing':''}" data-question-id="${escapeHTML(q.id)}">
  <div class="review-card-header">
   <span class="review-badge" style="background:${ic.color}20;color:${ic.color}">${ic.label}</span>
   <span class="review-badge" style="background:${is.color}20;color:${is.color}">${is.label}</span>
   <span class="review-badge" style="background:${cs.color}20;color:${cs.color}">${cs.label}</span>
   ${aiAudit?'<span class="review-badge ai-lot-badge">Correção assistida por IA</span>':''}
   <span class="review-counter">${index+1} / ${total}</span>
  </div>
   <div class="review-card-approval-status">
    <span class="review-approval-item">Conteúdo: ${q.contentStatus==='validated'?'<span style="color:#3cc88d">✓ Validado</span>':q.contentStatus==='not_approved'?'<span style="color:#e66a74">✕ Não aprovada</span>':'<span style="color:#f0b04e">Pendente</span>'}</span>
    <span class="review-approval-item">Imagem: ${q.imageStatus==='approved'||q.imageStatus==='approved_manual'||q.imageStatus==='no_image_confirmed'?'<span style="color:#3cc88d">✓ Aprovada</span>':'<span style="color:#f0b04e">Pendente</span>'}</span>
   </div>
  <div class="review-card-meta">
   <span><strong>ID:</strong> <code>${escapeHTML(q.id)}</code></span>
   <span><strong>Disciplina:</strong> ${escapeHTML(q.discipline)}</span>
   <span><strong>Área:</strong> ${escapeHTML(q.topic)}</span>
   <span><strong>Tópico:</strong> ${escapeHTML(q.subtopic)}</span>
   ${src?`<span><strong>Fonte:</strong> ${escapeHTML(src)}</span>`:''}
  </div>
  <div class="review-card-reason"><strong>Motivo:</strong> ${escapeHTML(q.imageReason||'—')}</div>
  ${promptSection}
  <div class="review-card-options">${optionsHtml}</div>
  ${answerSection}
  ${hasImage?`<div class="review-card-image"><img src="${escapeHTML(q.imageAssets[0])}" alt="Imagem da questão" loading="lazy"></div>`:''}
   ${hasDiagram?`<div class="review-card-diagram"><span class="review-badge" style="background:#78b4e520;color:#78b4e5">Diagrama SVG</span></div>`:''}
   ${aiAudit?aiAuditSections(q,aiAuditLotFilter):''}
    <div class="review-card-actions">${actions}${approveContentBtn}${notApprovedBtn}${revertBtn}</div>
 </div>`;
}

export function reviewScreen({bank,reviewFilter='all',reviewSearch='',reviewIndex=0,editingQuestion=null,editingFields={},reviewAiFilter='all',reviewAiLotFilter='all'}){
 const questions=bank.questions;

 const counts={
  all:filterQuestions(questions,'all').length,
  image_required:filterQuestions(questions,'image_required').length,
  no_image_required:filterQuestions(questions,'no_image_required').length,
  needs_visual_review:filterQuestions(questions,'needs_visual_review').length,
  approved:filterQuestions(questions,'approved').length,
  needs_content_review:filterQuestions(questions,'needs_content_review').length,
  not_approved:filterQuestions(questions,'not_approved').length
 };

 const filterButtons=[
  {key:'all',label:'Todas',count:counts.all},
  {key:'image_required',label:'Com imagem',count:counts.image_required},
  {key:'no_image_required',label:'Sem imagem',count:counts.no_image_required},
  {key:'needs_visual_review',label:'Dúvida visual',count:counts.needs_visual_review},
  {key:'approved',label:'Aprovadas',count:counts.approved},
  {key:'needs_content_review',label:'Conteúdo pendente',count:counts.needs_content_review},
  {key:'not_approved',label:'Não aprovadas',count:counts.not_approved},
  {key:'ai_audit',label:'AI auditing',count:AI_AUDIT_BATCH.ids.length}
 ];

 if(reviewFilter==='ai_audit')return aiAuditView({bank,filterButtons,reviewAiFilter,reviewAiLotFilter,reviewSearch,reviewIndex,editingQuestion,editingFields});

 const filtered=filterQuestions(questions,reviewFilter);
 const searched=searchQuestions(filtered,reviewSearch);

 const safeIndex=Math.min(reviewIndex,Math.max(0,searched.length-1));
 const current=searched[safeIndex];

 return `<div class="admin-head"><div><div class="eyebrow">ADMIN · REVISÃO DE QUESTÕES</div><h1>Auditoria do Banco</h1><p>${counts.all} questões de Física classificadas automaticamente.</p></div></div>
 <div class="review-filters">
  <div class="review-filter-tabs">${filterButtons.map(f=>`<button class="review-tab${reviewFilter===f.key?' active':''}" data-action="review-filter" data-filter="${f.key}">${f.label} <span class="review-tab-count">${f.count}</span></button>`).join('')}</div>
  <div class="review-search"><input type="text" placeholder="Buscar por ID, livro, página, enunciado…" value="${escapeHTML(reviewSearch)}" data-action="review-search-input"></div>
 </div>
 <div class="review-nav">
  <button class="review-nav-btn" data-action="review-prev" ${safeIndex<=0?'disabled':''}>← Anterior</button>
  <span class="review-nav-info">${searched.length>0?`${safeIndex+1} de ${searched.length}`:'Nenhuma questão encontrada'}</span>
  <button class="review-nav-btn" data-action="review-next" ${safeIndex>=searched.length-1?'disabled':''}>Próxima →</button>
 </div>
 ${current?reviewQuestionCard(current,safeIndex,searched.length,editingQuestion,editingFields):'<div class="review-empty">Nenhuma questão encontrada para este filtro.</div>'}
 <div class="review-stats">
  <div class="review-stat"><span class="review-stat-label">Total</span><span class="review-stat-value">${counts.all}</span></div>
  <div class="review-stat"><span class="review-stat-label">Com imagem</span><span class="review-stat-value" style="color:#e66a74">${counts.image_required}</span></div>
  <div class="review-stat"><span class="review-stat-label">Sem imagem</span><span class="review-stat-value" style="color:#3cc88d">${counts.no_image_required}</span></div>
  <div class="review-stat"><span class="review-stat-label">Dúvida visual</span><span class="review-stat-value" style="color:#f0b04e">${counts.needs_visual_review}</span></div>
  <div class="review-stat"><span class="review-stat-label">Aprovadas</span><span class="review-stat-value" style="color:#3cc88d">${counts.approved}</span></div>
   <div class="review-stat"><span class="review-stat-label">Conteúdo pendente</span><span class="review-stat-value" style="color:#f0b04e">${counts.needs_content_review}</span></div>
   <div class="review-stat"><span class="review-stat-label">Não aprovadas</span><span class="review-stat-value" style="color:#e66a74">${counts.not_approved}</span></div>
  </div>`;
}

function aiAuditView({bank,filterButtons,reviewAiFilter='all',reviewAiLotFilter='all',reviewSearch='',reviewIndex=0,editingQuestion=null,editingFields={}}){
 const order=new Map(AI_AUDIT_BATCH.ids.map((id,i)=>[id,i]));
 const aiQuestions=bank.questions.filter(q=>order.has(q.id));
 const rank=q=>{const s=aiAuditStatus(q);return s==='awaiting'?0:s==='rejected'?1:2;};
 aiQuestions.sort((a,b)=>rank(a)-rank(b)||(order.get(a.id)||0)-(order.get(b.id)||0));
 const lotIncludes=q=>reviewAiLotFilter==='all'||aiAuditMembership(q.id).includes(reviewAiLotFilter);
 const lotQuestions=aiQuestions.filter(lotIncludes);
 const counts={
  all:lotQuestions.length,
  awaiting:lotQuestions.filter(q=>aiAuditStatus(q)==='awaiting').length,
  approved:lotQuestions.filter(q=>aiAuditStatus(q)==='approved').length,
  rejected:lotQuestions.filter(q=>aiAuditStatus(q)==='rejected').length
 };
 const lotTabs=[
  {key:'all',label:'Todos',count:AI_AUDIT_BATCH.ids.length},
  {key:'historical',label:'Lotes históricos',count:AI_AUDIT_BATCH.historicalIds.length},
  {key:'lot12',label:'Lote 12',count:AI_AUDIT_LOTS.lot12.ids.length},
  {key:'lot13',label:'Lote 13',count:AI_AUDIT_LOTS.lot13.ids.length}
 ];
 const subTabs=[
  {key:'all',label:'Todas',count:counts.all},
  {key:'awaiting',label:'Aguardando auditoria',count:counts.awaiting},
  {key:'approved',label:'Aprovadas',count:counts.approved},
  {key:'rejected',label:'Não aprovadas',count:counts.rejected}
 ];
 const pool=reviewAiFilter==='all'?lotQuestions:lotQuestions.filter(q=>aiAuditStatus(q)===reviewAiFilter);
 const searched=searchQuestions(pool,reviewSearch);
 const safeIndex=Math.min(reviewIndex,Math.max(0,searched.length-1));
 const current=searched[safeIndex];
 const statusColor={awaiting:'#f0b04e',approved:'#3cc88d',rejected:'#e66a74'};
 const statusLabel={awaiting:'Aguardando',approved:'Aprovada',rejected:'Não aprovada'};
 const resultLabel={corrigida:'Corrigida por IA',verificada_sem_alteracao:'Verificada sem alteração',divergencia_documentada:'Divergência documentada',historical:'Revisão histórica'};
 const lotShort={historical:'Histórico',lot12:'Lote 12',lot13:'Lote 13'};
 const listHtml=searched.length?searched.map((q,i)=>{const st=aiAuditStatus(q),memberships=aiAuditMembership(q.id),result=aiAuditScientificResult(q.id,reviewAiLotFilter);return `<button class="ai-row${i===safeIndex?' active':''}" type="button" data-action="ai-audit-open" data-id="${i}"><span class="ai-row-index">${i+1}</span><span class="ai-row-id"><code>${escapeHTML(q.id)}</code></span><span class="ai-row-meta">${memberships.map(key=>lotShort[key]).join(' · ')} · ${escapeHTML(resultLabel[result]||'Divergência documentada')}</span><span class="review-badge" style="background:${statusColor[st]}20;color:${statusColor[st]}">${statusLabel[st]}</span></button>`;}).join(''):'<div class="review-empty">Nenhuma questão encontrada para este filtro.</div>';
 return `<div class="admin-head"><div><div class="eyebrow">ADMIN · REVISÃO DE QUESTÕES · AI AUDITING</div><h1>AI auditing</h1><p>${AI_AUDIT_BATCH.ids.length} registros únicos: ${AI_AUDIT_BATCH.historicalIds.length} históricos, ${AI_AUDIT_LOTS.lot12.ids.length} do lote 12 e ${AI_AUDIT_LOTS.lot13.ids.length} do lote 13. Aprovação exclusivamente manual.</p></div></div>
 <div class="review-filters">
  <div class="review-filter-tabs">${filterButtons.map(f=>`<button class="review-tab${f.key==='ai_audit'?' active':''}" data-action="review-filter" data-filter="${f.key}">${f.label} <span class="review-tab-count">${f.count}</span></button>`).join('')}</div>
  <div class="review-search"><input type="text" placeholder="Buscar por ID ou palavras do enunciado…" value="${escapeHTML(reviewSearch)}" data-action="review-search-input"></div>
 </div>
 <div class="ai-panel">
  <div class="ai-panel-grid">
   <div class="ai-stat"><span class="ai-stat-label">Total no filtro de lote</span><span class="ai-stat-value">${counts.all}</span></div>
   <div class="ai-stat ai-stat-awaiting"><span class="ai-stat-label">Aguardando auditoria</span><span class="ai-stat-value">${counts.awaiting}</span></div>
   <div class="ai-stat ai-stat-approved"><span class="ai-stat-label">Aprovadas por mim</span><span class="ai-stat-value">${counts.approved}</span></div>
   <div class="ai-stat ai-stat-rejected"><span class="ai-stat-label">Não aprovadas</span><span class="ai-stat-value">${counts.rejected}</span></div>
  </div>
  <p class="ai-note">A IA corrige. O Owner audita. O Owner aprova. Nenhuma questão é validada automaticamente.</p>
 </div>
 <div class="ai-subtabs ai-lot-tabs" aria-label="Filtrar por lote">${lotTabs.map(s=>`<button class="review-tab${reviewAiLotFilter===s.key?' active':''}" data-action="ai-audit-lot-filter" data-filter="${s.key}">${s.label} <span class="review-tab-count">${s.count}</span></button>`).join('')}</div>
 <div class="ai-subtabs">${subTabs.map(s=>`<button class="review-tab${reviewAiFilter===s.key?' active':''}" data-action="ai-audit-filter" data-filter="${s.key}">${s.label} <span class="review-tab-count">${s.count}</span></button>`).join('')}</div>
 <div class="ai-list">${listHtml}</div>
 <div class="review-nav">
  <button class="review-nav-btn" data-action="review-prev" ${safeIndex<=0?'disabled':''}>← Anterior</button>
  <span class="review-nav-info">${searched.length>0?`${safeIndex+1} de ${searched.length}`:'Nenhuma questão encontrada'}</span>
  <button class="review-nav-btn" data-action="review-next" ${safeIndex>=searched.length-1?'disabled':''}>Próxima →</button>
 </div>
 ${current?reviewQuestionCard(current,safeIndex,searched.length,editingQuestion,editingFields,true,reviewAiLotFilter):'<div class="review-empty">Selecione uma questão da lista.</div>'}`;
}
