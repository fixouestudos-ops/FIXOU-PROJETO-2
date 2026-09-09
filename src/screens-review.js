import {escapeHTML} from './utils.js';

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
 needs_content_review:{label:'Revisão de conteúdo',color:'#e66a74'}
};

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
 if(filter==='approved')return questions.filter(q=>q.imageStatus==='approved'||q.imageStatus==='approved_manual'||q.imageStatus==='no_image_confirmed');
 if(filter==='needs_content_review')return questions.filter(q=>q.contentStatus!=='validated');
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

function reviewQuestionCard(q,index,total,editingQuestion,editingFields={}){
 const ic=IMAGE_CLASSIFICATIONS[q.imageClassification]||IMAGE_CLASSIFICATIONS.no_image_required;
 const is=IMAGE_STATUSES[q.imageStatus]||IMAGE_STATUSES.no_image_required;
 const cs=CONTENT_STATUSES[q.contentStatus]||CONTENT_STATUSES.pending;
 const hasImage=q.imageAssets&&q.imageAssets.length>0;
 const hasDiagram=!!q.diagram;
 const isEditing=editingQuestion===q.id;
 const promptText=isEditing?(editingFields.prompt||''):(q.prompt||'');
 const promptPreview=!isEditing&&q.prompt&&q.prompt.length>300?q.prompt.slice(0,300)+'…':q.prompt||'';
 const optionsHtml=(q.options||[]).map((o,i)=>`<div class="review-option${i===q.answer?' correct':''}"><span class="review-option-letter">${' ABCDE'[i]}</span><span>${escapeHTML(o)}</span></div>`).join('');
 const src=sourceLabel(q);
 const validSource=hasValidSource(q);
 const isNoImage=q.imageClassification==='no_image_required';
 const isImageReq=q.imageClassification==='image_required'||q.imageClassification==='needs_visual_review'||q.imageClassification==='bad_image_association';
 const isReview=q.imageClassification==='needs_visual_review';
 const hasOptions=q.options&&q.options.length>0;
 const currentAnswer=isEditing?(editingFields.answer||''):(q.answer!=null?String(q.answer):'?');
 const answerLabel=hasOptions&&currentAnswer!=='?'&&currentAnswer!==''?(' ABCDE'[Number(currentAnswer)]||currentAnswer):currentAnswer;

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
    const letter=' ABCDE'[i];
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

 const approveContentBtn=!isEditing?`<button class="review-btn review-btn-approve-content" data-action="review-approve-content" data-id="${escapeHTML(q.id)}">✓ Aprovar conteúdo</button>`:'';

 return `<div class="review-card${isEditing?' review-card-editing':''}" data-question-id="${escapeHTML(q.id)}">
  <div class="review-card-header">
   <span class="review-badge" style="background:${ic.color}20;color:${ic.color}">${ic.label}</span>
   <span class="review-badge" style="background:${is.color}20;color:${is.color}">${is.label}</span>
   <span class="review-badge" style="background:${cs.color}20;color:${cs.color}">${cs.label}</span>
   <span class="review-counter">${index+1} / ${total}</span>
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
  <div class="review-card-actions">${actions}${approveContentBtn}</div>
 </div>`;
}

export function reviewScreen({bank,reviewFilter='all',reviewSearch='',reviewIndex=0,editingQuestion=null,editingFields={}}){
 const questions=bank.questions;
 const filtered=filterQuestions(questions,reviewFilter);
 const searched=searchQuestions(filtered,reviewSearch);

 const safeIndex=Math.min(reviewIndex,Math.max(0,searched.length-1));
 const current=searched[safeIndex];

 const counts={
  all:filterQuestions(questions,'all').length,
  image_required:filterQuestions(questions,'image_required').length,
  no_image_required:filterQuestions(questions,'no_image_required').length,
  needs_visual_review:filterQuestions(questions,'needs_visual_review').length,
  approved:filterQuestions(questions,'approved').length,
  needs_content_review:filterQuestions(questions,'needs_content_review').length
 };

 const filterButtons=[
  {key:'all',label:'Todas',count:counts.all},
  {key:'image_required',label:'Com imagem',count:counts.image_required},
  {key:'no_image_required',label:'Sem imagem',count:counts.no_image_required},
  {key:'needs_visual_review',label:'Dúvida visual',count:counts.needs_visual_review},
  {key:'approved',label:'Aprovadas',count:counts.approved},
  {key:'needs_content_review',label:'Conteúdo pendente',count:counts.needs_content_review}
 ];

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
 </div>`;
}
