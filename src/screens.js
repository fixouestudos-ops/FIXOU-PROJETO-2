import {SUBJECTS,QUESTION_TYPES,DIFFICULTIES,PHYSICS_AREA_ORDER} from './config.js';
import {escapeHTML,sum,formatNumber,normalize,relativeDue,formatDate} from './utils.js';
import {studyStats,chartDays} from './statistics.js';
import {profileLevel} from './gamification.js';
import {isDue,dueConcepts} from './reviews.js';
import {masteryValue,conceptWeakness} from './mastery.js';
import {matchesQuestion,dailyCounts} from './training.js';
import {titleBlock,bar,subjectTile,subjectById,subjectMastery,conceptLine,empty,button,questionCard,favorite,sourceTrail} from './components.js';
import {sessionSubjects,sessionTopicKeys,topicLabel,subjectIdFromTopic,builderFilters,SESSION_QUANTITIES,STUDY_PRESETS,applyStudyPreset} from './session-builder.js';
import {isBlockedForStudent} from './screens-review.js';
export function homeScreen({state,bank,curriculum}){
 const stats=studyStats(state,bank.concepts),level=profileLevel(state.xp),counts=dailyCounts(state,bank),due=dueConcepts(state,bank.concepts).length;
 const mastery=Math.round(sum(bank.concepts.map(c=>masteryValue(state.concepts[c.id],state.reviews[c.id])))/bank.concepts.length);
 const name=state.profile?.name?.split(' ')[0],weak=bank.concepts.filter(c=>state.concepts[c.id]).sort((a,b)=>conceptWeakness(state,b.id)-conceptWeakness(state,a.id)).slice(0,3);
 return `${titleBlock('SEU PRÓXIMO CAPÍTULO',name?`Bom ter você aqui, ${escapeHTML(name)}`:'Todo avanço começa aqui','Transforme o que você estuda em conhecimento que fica.',`<span class="pill">FUVEST 2027</span>`)}
 ${state.activeSession&&!state.activeSession.finished?`<div class="resume-banner"><span>Seu último treino está salvo.</span>${button('Continuar de onde parei →','resume','','text-button')}</div>`:''}
 <section class="hero-grid"><article class="today-card"><div class="eyebrow">TREINO DE HOJE <span class="live-tag">FEITO PARA VOCÊ</span></div><h2>Uma boa sessão.<br>Um passo mais perto.</h2><p>${stats.total?'Seu treino combina dúvidas, revisões e novos conceitos. Vamos continuar?':'Comece pelos fundamentos. Seu treino se ajusta conforme você aprende.'}</p><div class="session-chips"><span>▱ ${due} revisões pendentes</span><span>◇ ${stats.weak} pontos a fortalecer</span></div><button class="primary light" data-action="start" data-id="daily">Começar meu treino <span>→</span></button><div class="orbit" aria-hidden="true"><span>${String(level.level).padStart(2,'0')}<small>SEU NÍVEL<br>DE DEDICAÇÃO</small></span></div></article><article class="focus-card"><div class="eyebrow">DOMÍNIO DO BANCO INICIAL</div><div class="mastery-ring" style="--value:${mastery}"><div><strong>${mastery}<span>%</span></strong><small>${stats.studied} de ${bank.concepts.length} conceitos estudados</small></div></div><p>Acertos, confiança e retenção.<br>Seu nível de perfil é independente.</p><div class="card-foot"><span>Questões disponíveis</span><strong>${bank.questions.filter(q=>!isBlockedForStudent(q)).length}</strong></div></article></section>
 <section class="quick-stats"><div><span>Nível de dedicação</span><strong>${level.level}<small> ${formatNumber(state.xp)} XP</small></strong>${bar(level.percent,'XP para o próximo nível')}</div><div><span>Questões respondidas</span><strong>${stats.total}<small> ${stats.total?stats.accuracy+'% de acertos':'Sua jornada começa agora'}</small></strong></div><div><span>Novos conceitos</span><strong>${counts.new}<small> no banco inicial</small></strong></div><div><span>Próxima sessão</span><strong>${state.settings.dailyCount}<small> questões · pausas livres</small></strong></div></section>
 <div class="section-title"><h2>Escolha como avançar</h2><span>Aprender. Recordar. Consolidar.</span></div><section class="mode-grid"><a class="mode-card" href="#train"><span class="mode-icon purple">▷</span><div><h3>Quiz adaptativo</h3><p>Seu próximo desafio, na medida.</p></div><span>↗</span></a><a class="mode-card" href="#cards"><span class="mode-icon mint">▱</span><div><h3>Memorização</h3><p>Recorde antes de esquecer.</p></div><span>↗</span></a><a class="mode-card" href="#errors"><span class="mode-icon peach">⊞</span><div><h3>Cofre dos erros</h3><p>Encontre a raiz de cada dúvida.</p></div><span>↗</span></a></section>
 <div class="section-title"><h2>Seu universo de conhecimento</h2><a href="#map">Explorar o programa →</a></div><section class="subject-grid">${SUBJECTS.filter(s=>bank.questions.some(q=>q.discipline===s.id&&!isBlockedForStudent(q))).map(s=>subjectTile(state,bank,s)).join('')}</section>
 <section class="bottom-grid"><article class="panel"><div class="section-title"><h2>Pequenos passos, todos os dias</h2><a href="#stats">Minha evolução →</a></div>${activityChart(state,7)}<p class="meta">Questões e revisões por dia. Uma sessão curta também conta.</p></article><article class="panel"><div class="section-title"><h2>Seu próximo foco</h2></div>${weak.length?weak.map(c=>conceptLine(state,c)).join(''):'<p class="soft-copy">Responda às primeiras questões para identificar o que merece mais atenção.</p><a class="text-button" href="#train">Encontrar meu ponto de partida →</a>'}</article></section>`;
}
export function activityChart(state,count=7){const days=chartDays(state,count),max=Math.max(5,...days.map(d=>d.answers+d.reviews));return `<div class="activity-chart ${count>7?'monthly':''}" role="img" aria-label="Atividade dos últimos ${count} dias: ${days.map(d=>`${d.key}: ${d.answers} questões, ${d.reviews} revisões`).join('; ')}">${days.map(d=>`<div class="chart-column"><div class="chart-track"><span title="${d.key}: ${d.answers} questões e ${d.reviews} revisões" style="height:${(d.answers+d.reviews)/max*100}%"><i>${d.answers+d.reviews||''}</i></span></div><small>${count>7?d.short:d.label}</small></div>`).join('')}</div>`;}
export function filterControls(bank,filters,prefix='filter'){
 const selected=(key,v)=>String(filters[key]||'')===String(v)?'selected':'';
 const activeConceptIds=new Set(bank.questions.filter(q=>!isBlockedForStudent(q)).map(q=>q.conceptId));
 const activeSubjects=SUBJECTS.filter(s=>bank.questions.some(q=>q.discipline===s.id&&!isBlockedForStudent(q)));
 const topics=[...new Set(bank.concepts.filter(c=>activeConceptIds.has(c.id)&&(!filters.discipline||c.discipline===filters.discipline)).map(c=>c.topic))].sort((a,b)=>filters.discipline==='fisica'?PHYSICS_AREA_ORDER.indexOf(a)-PHYSICS_AREA_ORDER.indexOf(b):a.localeCompare(b,'pt-BR'));
 const concepts=bank.concepts.filter(c=>activeConceptIds.has(c.id)&&(!filters.discipline||c.discipline===filters.discipline)&&(!filters.topic||c.topic===filters.topic));
 const select=(key,label,options)=>`<label>${label}<select data-filter="${key}" data-prefix="${prefix}" id="${prefix}-${key}"><option value="">Todos</option>${options.map(([v,t])=>`<option value="${escapeHTML(v)}" ${selected(key,v)}>${escapeHTML(t)}</option>`).join('')}</select></label>`;
 return `<div class="filter-grid">${select('discipline','Disciplina',activeSubjects.map(s=>[s.id,s.name]))}${select('topic','Assunto',topics.map(t=>[t,t]))}${select('subtopic','Subassunto',concepts.map(c=>[c.id,c.subtopic]))}${select('difficulty','Dificuldade',[1,2,3,4].map(d=>[d,DIFFICULTIES[d]]))}${select('type','Tipo',Object.entries(QUESTION_TYPES))}${select('status','Seu histórico',[['wrong','Pontos fracos'],['new','Nunca vistas'],['due','Revisões vencidas'],['favorites','Favoritas']])}</div>`;
}
export function sessionBuilderControls(bank,builder){
  const subjects=sessionSubjects(bank),selectedSubjects=new Set(builder?.subjects||[]),selectedTopics=new Set(builder?.topics||[]),selectedDifficulties=new Set((builder?.difficulties||[]).map(Number));
  const topicsBySubject=subjects.map(s=>({subject:s,topics:sessionTopicKeys(bank,[s.id]).map(key=>({key,label:topicLabel(key)}))}));
  const subjectChecks=subjects.map(s=>`<label class="builder-check"><input type="checkbox" data-session-subject="${s.id}" ${selectedSubjects.has(s.id)?'checked':''}><span class="subject-symbol" style="--subject-color:${s.color}">${escapeHTML(s.icon)}</span><span><strong>${escapeHTML(s.name)}</strong><small>${bank.questions.filter(q=>!isBlockedForStudent(q)&&bank.concepts.find(c=>c.id===q.conceptId)?.discipline===s.id).length} questões</small></span></label>`).join('');
  const topicChecks=topicsBySubject.map(({subject,topics})=>`<details class="builder-topic-group" ${selectedSubjects.has(subject.id)?'open':''}><summary><span class="subject-symbol" style="--subject-color:${subject.color}">${escapeHTML(subject.icon)}</span><strong>${escapeHTML(subject.name)}</strong><small>${topics.length} assuntos</small></summary><div class="builder-topic-list">${topics.map(t=>`<label class="builder-topic"><input type="checkbox" data-session-topic="${escapeHTML(encodeURIComponent(t.key))}" ${selectedTopics.has(t.key)?'checked':''}><span>${escapeHTML(t.label)}</span></label>`).join('')}</div></details>`).join('');
  const difficultyChecks=[[1,'Fácil'],[2,'Média'],[3,'Difícil'],[4,'Muito difícil']].map(([n,label])=>`<label class="builder-pill"><input type="checkbox" data-session-difficulty="${n}" ${selectedDifficulties.has(n)?'checked':''}><span>${label}</span></label>`).join('');
  const qty=SESSION_QUANTITIES.map(v=>`<option value="${v}" ${String(builder?.quantity??20)===String(v)?'selected':''}>${v==='all'?'Todas disponíveis':`${v} questões`}</option>`).join('');
  const imageFilterOptions=[['all','Todas'],['image_required','Somente com imagem'],['no_image_required','Somente sem imagem']].map(([v,t])=>`<option value="${v}" ${(builder?.imageFilter||'all')===v?'selected':''}>${t}</option>`).join('');
  return `<section class="session-builder panel"><div class="builder-heading"><div><span class="eyebrow">SESSÃO PERSONALIZADA</span><h2>Monte sua sessão de estudos</h2><p>Combine disciplinas, assuntos, dificuldade e quantidade antes de começar.</p></div><span class="builder-step">1 · 2 · 3</span></div><div class="builder-block"><div class="builder-label-row"><strong>Disciplinas</strong><span><button class="text-button" data-action="session-select-all-subjects">Selecionar todas</button><button class="text-button" data-action="session-clear-subjects">Limpar</button></span></div><div class="builder-subject-grid">${subjectChecks}</div></div><div class="builder-block"><div class="builder-label-row"><strong>Assuntos</strong><span><button class="text-button" data-action="session-select-all-topics">Selecionar todos</button><button class="text-button" data-action="session-clear-topics">Limpar</button></span></div><div class="builder-topic-groups">${topicChecks}</div></div><div class="builder-options"><label><strong>Dificuldade</strong><div class="builder-pills">${difficultyChecks}</div></label><label><strong>Quantidade</strong><select data-session-quantity>${qty}</select></label><label><strong>Tipo de questão</strong><select data-session-image-filter>${imageFilterOptions}</select></label></div><div class="builder-footer"><div><strong data-builder-summary>Escolha os filtros para ver o resumo.</strong><span class="meta">A seleção de assuntos é atualizada conforme as disciplinas.</span></div><button class="primary" data-action="start-session">Começar sessão →</button></div></section>`;
}
function studyChip(text,on,action,value,small=''){
  return `<button type="button" class="study-ch${on?' on':''}" data-action="${action}" data-id="${escapeHTML(String(value))}" aria-pressed="${on}">${on?'✓ ':''}${escapeHTML(text)}${small?` <small>${escapeHTML(small)}</small>`:''}</button>`;
}
function studyModeIcon(kind){
  if(kind==='adaptive')return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>`;
  if(kind==='lightning')return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L5 14h6l-1 8 8-12h-6z"/></svg>`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"/></svg>`;
}
export function studySearchResults(bank,term){
  const needle=normalize(term||'');
  if(!needle)return `<div class="study-q-empty">Digite um termo para pesquisar o banco. Ex.: cinemática, metáfora, Ohm.</div>`;
  const conceptById=Object.fromEntries(bank.concepts.map(c=>[c.id,c]));
  const list=bank.questions.filter(q=>{
    if(isBlockedForStudent(q))return false;
    const c=conceptById[q.conceptId];
    return normalize([q.prompt,q.explanation,c?.topic,c?.subtopic,...(q.tags||[])].join(' ')).includes(needle);
  });
  if(!list.length)return `<div class="study-q-empty">Nenhuma questão liberada corresponde a essa busca.</div>`;
  return list.slice(0,8).map(q=>{
    const c=conceptById[q.conceptId],s=subjectById(c?.discipline);
    return `<button type="button" class="study-q-result" data-action="question" data-id="${escapeHTML(q.id)}"><small>${escapeHTML(s.name)} · ${escapeHTML(c?.subtopic||c?.topic||'')} · ${escapeHTML(DIFFICULTIES[q.difficulty]||'')}</small><b>${escapeHTML(q.prompt.slice(0,160))}${q.prompt.length>160?'…':''}</b><span class="study-result-meta"><span>Resolver ↗</span></span></button>`;
  }).join('')+(list.length>8?`<p class="study-q-more">Mostrando 8 de ${formatNumber(list.length)}. Refine a busca para ver menos resultados.</p>`:'');
}
export function trainScreen({state,bank,filters,sessionBuilder,studySearch}){
  const conceptById=Object.fromEntries(bank.concepts.map(c=>[c.id,c]));
  const catalogTotal=bank.questions.length;
  const availableQuestions=bank.questions.filter(q=>!isBlockedForStudent(q));
  const availableTotal=availableQuestions.length;
  const subjects=sessionSubjects(bank);
  const selectedSubjects=new Set(sessionBuilder?.subjects||[]);
  const selectedTopics=new Set(sessionBuilder?.topics||[]);
  const selectedDifficulties=new Set((sessionBuilder?.difficulties||[]).map(Number));
  const quantity=sessionBuilder?.quantity??20;
  const customFilters=builderFilters(sessionBuilder||{subjects:[],topics:[],difficulties:[],quantity:20,imageFilter:'all'});
  const customMatches=bank.questions.filter(q=>matchesQuestion(q,conceptById[q.conceptId],customFilters,state));
  const actualQty=quantity==='all'?customMatches.length:Math.min(Number(quantity),customMatches.length);
  const estimatedMin=Math.max(1,Math.round(actualQty*1.5));
  const allTopicKeys=sessionTopicKeys(bank,subjects.map(s=>s.id));
  const visibleTopicKeys=sessionTopicKeys(bank,[...selectedSubjects]);
  const selectedTopicCount=visibleTopicKeys.filter(key=>selectedTopics.has(key)).length;
  const subjectCountLabel=selectedSubjects.size||0;
  const disciplinesLine=subjects.map(s=>s.name).join(' e ')||'Catálogo';
  const toastHtml=studySearch&&studySearch.message?`<div class="study-toast" role="status">${escapeHTML(studySearch.message)}</div>`:'';
  const subjectChips=subjects.map(s=>{
    const count=availableQuestions.filter(q=>conceptById[q.conceptId]?.discipline===s.id).length;
    return studyChip(s.name,selectedSubjects.has(s.id),'study-subject',s.id,formatNumber(count));
  }).join('');
  const topicChips=visibleTopicKeys.length?visibleTopicKeys.map(key=>{
    const count=availableQuestions.filter(q=>{const c=conceptById[q.conceptId];return c&&`${c.discipline}|${c.topic}`===key;}).length;
    return studyChip(topicLabel(key),selectedTopics.has(key),'study-topic',key,formatNumber(count));
  }).join(''):`<span class="study-section-sub">Selecione uma disciplina para ver os assuntos.</span>`;
  const difficultyChips=[[1,'Fácil'],[2,'Média'],[3,'Difícil'],[4,'Muito difícil']].map(([n,label])=>studyChip(label,selectedDifficulties.has(n),'study-difficulty',n)).join('');
  const qtyChips=SESSION_QUANTITIES.map(v=>`<button type="button" class="${String(quantity)===String(v)?'on':''}" data-action="study-qty" data-id="${v}" aria-pressed="${String(quantity)===String(v)}">${v==='all'?'Todas':v}</button>`).join('');
  const imageFilterOptions=[['all','Todas'],['image_required','Somente com imagem'],['no_image_required','Somente sem imagem']].map(([v,t])=>`<option value="${v}" ${(sessionBuilder?.imageFilter||'all')===v?'selected':''}>${t}</option>`).join('');
  const presetButtons=Object.entries(STUDY_PRESETS).map(([id,p])=>`<button type="button" class="study-pr" data-action="study-preset" data-id="${id}"><span class="study-picon" aria-hidden="true">${p.symbol}</span><span><b>${escapeHTML(p.name)}</b><small>${escapeHTML(p.detail)}</small></span><span aria-hidden="true">→</span></button>`).join('');
  return `<section class="study-page" aria-labelledby="study-title">
  <div class="study-eb">Todas as questões do FIXOU</div>
  <h1 id="study-title">Banco de questões<span class="study-dot">.</span></h1>
  <p class="study-mut">Monte o treino do seu jeito ou comece por um atalho. Estudar com intenção faz a diferença.</p>
  ${toastHtml}
  <div class="study-core">
    <div class="study-core-left">
      <div class="study-eb">Seu banco de questões</div>
      <div class="study-num">${formatNumber(catalogTotal)}</div>
      <p class="study-mut study-core-sub">questões · ${escapeHTML(disciplinesLine)}</p>
      <p class="study-mini-note">${availableTotal===catalogTotal?`Total do catálogo publicado. ${formatNumber(availableTotal)} prontas para estudar.`:`${formatNumber(catalogTotal)} no catálogo · ${formatNumber(availableTotal)} liberadas para estudantes. Itens em revisão ficam fora do treino.`}</p>
      <div class="study-btns">
        <button type="button" class="study-go" data-action="study-scroll" data-id="builder">Montar meu treino →</button>
        <button type="button" class="study-ol" data-action="study-quick">Treino rápido · 10 questões</button>
      </div>
    </div>
    <div class="study-core-right">
      <div class="study-eb study-presets-eb">Atalhos para hoje</div>
      ${presetButtons}
    </div>
  </div>
  <div class="study-lbl study-modes-lbl">Outros jeitos de treinar <span class="study-caption">Escolha seu ritmo</span></div>
  <div class="study-g3">
    <button type="button" class="study-mc" data-action="start" data-id="adaptive"><span class="study-ic study-ic-a" aria-hidden="true">${studyModeIcon('adaptive')}</span><span><b>Quiz adaptativo</b><small>Dificuldade e seleção se ajustam ao seu desempenho.</small><span class="study-mc-foot">Uma questão de cada vez ↗</span></span></button>
    <button type="button" class="study-mc" data-action="start" data-id="lightning"><span class="study-ic" aria-hidden="true">${studyModeIcon('lightning')}</span><span><b>Relâmpago</b><small>60 segundos para pensar rápido.</small><span class="study-mc-foot">Desafio contra o tempo ↗</span></span></button>
    <button type="button" class="study-mc" data-action="start" data-id="survival"><span class="study-ic study-ic-g" aria-hidden="true">${studyModeIcon('survival')}</span><span><b>Sobrevivência</b><small>Três vidas. Até onde seu raciocínio vai?</small><span class="study-mc-foot">Errou? Perde uma vida ↗</span></span></button>
  </div>
  <section class="study-builder" id="study-builder" aria-labelledby="study-builder-title">
    <div class="study-eb">Configure sua sessão</div>
    <h2 id="study-builder-title">Monte seu treino<span class="study-dot">.</span></h2>
    <p class="study-mut">Combine disciplinas, assuntos, dificuldade e quantidade. O resumo acompanha cada escolha.</p>
    <div class="study-cols">
      <section class="study-box study-filters" aria-label="Filtros de treino">
        <div class="study-lbl">Disciplina</div>
        <div class="study-chs">${subjectChips||'<span class="study-section-sub">Nenhuma disciplina disponível.</span>'}</div>
        <div class="study-lbl">Assuntos <span class="study-lbl-actions"><button type="button" data-action="study-topics-all">Selecionar todos</button><button type="button" data-action="study-topics-none">Limpar</button></span></div>
        <div class="study-chs">${topicChips}</div>
        <div class="study-lbl">Dificuldade</div>
        <div class="study-chs">${difficultyChips}</div>
        <div class="study-lbl">Quantidade</div>
        <div class="study-sg" role="group" aria-label="Quantidade de questões">${qtyChips}</div>
        <div class="study-lbl">Tipo de questão</div>
        <select class="study-select" aria-label="Tipo de questão" data-session-image-filter>${imageFilterOptions}</select>
        <p class="study-fit-note">Os filtros usam o catálogo real. Questões bloqueadas para revisão nunca entram na seleção.</p>
      </section>
      <aside class="study-box study-sum" aria-label="Resumo do seu treino">
        <div class="study-eb">Seu treino</div>
        <div class="study-sn">${actualQty}</div>
        <p class="study-mut study-sum-sub">questões elegíveis nesta seleção</p>
        <div class="study-row"><span>Disciplinas</span><b>${subjectCountLabel} de ${subjects.length}</b></div>
        <div class="study-row"><span>Assuntos</span><b>${selectedTopicCount} de ${allTopicKeys.length}</b></div>
        <div class="study-row"><span>Níveis</span><b>${selectedDifficulties.size} de 4</b></div>
        <div class="study-row"><span>Tempo estimado</span><b>~${estimatedMin} min</b></div>
        <div class="study-row"><span>Elegíveis agora</span><b>${formatNumber(customMatches.length)}</b></div>
        <div class="study-sum-cta"><button type="button" class="study-go study-go-full" data-action="start-session" ${!customMatches.length?'disabled':''}>Começar a estudar →</button></div>
        ${!customMatches.length?`<p class="study-fit-note">Selecione outra combinação de filtros para continuar.</p>`:Number(quantity)!=='all'&&customMatches.length<Number(quantity)?`<p class="study-fit-note">Você pediu ${quantity} questões; há ${customMatches.length} elegíveis. A sessão usará as disponíveis.</p>`:`<p class="study-fit-note">Você pode ajustar os filtros antes de começar.</p>`}
      </aside>
    </div>
  </section>
  <section class="study-explore" aria-labelledby="study-explore-title">
    <div class="study-explore-head">
      <div>
        <div class="study-eb">Questões na prática</div>
        <h3 id="study-explore-title">Explorar questões</h3>
      </div>
      <span class="study-pillmeta">${formatNumber(availableTotal)} liberadas</span>
    </div>
    <p class="study-section-sub">Pesquise e abra uma questão para resolver com feedback real do FIXOU.</p>
    <label class="study-caption" for="explore-input">Buscar questão</label>
    <input id="explore-input" class="study-search" placeholder="Ex.: movimento, metáfora, óptica..." autocomplete="off" value="${escapeHTML(studySearch?.term||'')}" data-action="study-search-input">
    <div class="study-results" id="explore-results">${studySearchResults(bank,studySearch?.term||'')}</div>
  </section>
</section>`;
}
export function cardsScreen({state,bank,cardFilters,flash}){
 if(flash){const c=conceptByIdLocal(bank,flash.currentId);if(!c?.flashcard)return empty('Revisão concluída','Sua agenda foi atualizada.','cards-home','Ver meus cartões');const reveal=flash.revealed;return `<section class="studyArea approved-memory" aria-labelledby="memoryTitle"><div class="studyTop"><div class="studyEyebrow"><span class="studyEyebrowDot"></span> FIXOU · REVISÃO ATIVA</div><button class="studyBack" data-action="cards-home">Encerrar revisão</button></div><h1 id="memoryTitle" class="studyHeading">Memorizar<span class="studyHeadingAccent"> de verdade.</span></h1><p class="studyLead">Clique para virar a carta. Arraste para a direita se já sabe e para a esquerda se precisa rever. No celular, basta deslizar o dedo.</p><div class="memorySessionBar"><span>Carta ${flash.index+1} de ${flash.ids.length}</span><span>Revisão espaçada ativa</span></div><div class="memoryProgressTrack"><span style="width:${flash.index/flash.ids.length*100}%"></span></div><div class="flashArena flash-arena"><span class="swipeLabel swipeLeft swipe-rever">↶ rever</span><span class="swipeLabel swipeRight swipe-sei">sei ✓</span><button type="button" class="flashCard flash-card-3d ${reveal?'flipped':''}" data-action="flip-card" aria-pressed="${reveal}" aria-label="${reveal?'Ocultar resposta':'Virar carta de memória'}"><span class="flashInner"><span class="flashFace flashFront"><span class="flashType">${subjectById(c.discipline).name} · ${escapeHTML(c.subtopic)}</span><span class="flashText">${escapeHTML(c.flashcard.front)}</span><span class="flashInstruction">Toque para virar ↻</span></span><span class="flashFace flashBack"><span class="flashType">RESPOSTA</span><span class="flashText">${escapeHTML(c.flashcard.back)}</span><span class="flashInstruction">Como foi sua lembrança?</span></span></span></button></div><div class="memoryActions"><button class="reviewAction" data-action="rate-card" data-id="forgot" ${reveal?'':'disabled'}>← Rever</button><button class="knowAction" data-action="rate-card" data-id="good" ${reveal?'':'disabled'}>Sei →</button></div><div class="memoryKeyboardTip">Teclado: <kbd>←</kbd> Rever &nbsp; <kbd>→</kbd> Sei &nbsp; <kbd>Espaço</kbd> Virar</div><p class="studyFootnote">A agenda e os intervalos usam a repetição espaçada real do FIXOU.</p></section>`;}
 const cardConcepts=bank.concepts.filter(c=>c.flashcard&&!c.flashcard.needsReview);const due=dueConcepts(state,cardConcepts),cards=cardConcepts.filter(c=>{const status=cardFilters.status;return (!cardFilters.discipline||c.discipline===cardFilters.discipline)&&(!cardFilters.topic||c.topic===cardFilters.topic)&&(!status||status==='new'&&!state.reviews[c.id]||status==='due'&&isDue(state,c.id)||status==='favorites'&&state.favorites.includes('c:'+c.id));});
 return `${titleBlock('MEMÓRIA DE LONGO PRAZO','Recordar é aprender de novo','Vire, avalie sua lembrança e deixe a próxima revisão com o aplicativo.')}
 <section class="review-banner"><div><span class="eyebrow">SUA AGENDA</span><h2>${due.length?`${due.length} cartões esperam por você`:'Revisões em dia'}</h2><p>${due.length?'Uma retomada agora ajuda o conteúdo a permanecer.':'Você pode conhecer novos cartões ou praticar livremente.'}</p></div><button class="primary" data-action="start-cards" data-id="due" ${due.length?'':'disabled'}>Revisar pendentes →</button></section>
 <div class="section-title"><h2>Seus ${cardConcepts.length} flashcards</h2><button class="text-button" data-action="start-cards" data-id="selection" ${cards.length?'':'disabled'}>Revisar seleção →</button></div><div class="inline-filters"><label>Disciplina<select data-card-filter="discipline"><option value="">Todas as disciplinas</option>${SUBJECTS.map(s=>`<option value="${s.id}" ${cardFilters.discipline===s.id?'selected':''}>${s.name}</option>`).join('')}</select></label><label>Assunto<select data-card-filter="topic"><option value="">Todos os assuntos</option>${[...new Set(cardConcepts.filter(c=>!cardFilters.discipline||c.discipline===cardFilters.discipline).map(c=>c.topic))].sort((a,b)=>a.localeCompare(b,'pt-BR')).map(t=>`<option value="${escapeHTML(t)}" ${cardFilters.topic===t?'selected':''}>${escapeHTML(t)}</option>`).join('')}</select></label><label>Cartões<select data-card-filter="status"><option value="">Todos os cartões</option>${[['due','Revisões vencidas'],['new','Nunca estudados'],['favorites','Favoritos']].map(([v,t])=>`<option value="${v}" ${cardFilters.status===v?'selected':''}>${t}</option>`).join('')}</select></label></div><div class="flash-grid">${cards.map(c=>`<article class="flash-preview"><div class="row"><span class="tag">${subjectById(c.discipline).name}</span>${favorite(state,'c',c.id)}</div><h3>${escapeHTML(c.flashcard.front)}</h3><div class="row"><span class="meta">${state.reviews[c.id]?relativeDue(state.reviews[c.id].dueAt):'Novo cartão'}</span>${button('Revisar →','card',c.id,'text-button')}</div></article>`).join('')||empty('Sem cartões neste filtro','Escolha outra disciplina ou situação de revisão.')}</div>`;
}
export const conceptByIdLocal = (bank,id) => bank.concepts.find(c=>c.id===id);
