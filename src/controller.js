import {BANK,CURRICULUM,BOOKS} from './catalog.js';
import {NAV,SUBJECTS,MODE_NAMES} from './config.js';
import {escapeHTML,normalize,formatNumber,formatTime,todayKey,uid,clamp,relativeDue} from './utils.js';
import {createState,loadState,persistState,exportState,importState,SAVE_KEY} from './save.js';
import {scheduleReview,dueConcepts,isDue} from './reviews.js';
import {masteryValue} from './mastery.js';
import {profileLevel,currentStreak,addActivity,unlockAchievements} from './gamification.js';
import {createSession,pickNextQuestion,recordAnswer,finishSession,matchesQuestion} from './training.js';
import {subjectById,conceptById,questionById,bar,button,sourceTrail,favorite} from './components.js';
import {homeScreen,trainScreen,cardsScreen} from './screens.js';
import {errorsScreen,mapScreen,booksScreen,favoritesScreen,searchScreen} from './screens-library.js';
import {statsScreen,profileScreen} from './screens-profile.js';
import {sessionScreen,canSubmitDraft,draftAnswer} from './session-view.js';

const loaded=loadState();
let state=loaded.state,storageBlocked=!!loaded.blocked;
let session=state.activeSession,flash=null,lastTick=Date.now(),toastTimeout,afterProfile=null,afterConfirm=null,pendingImport=null;
const ui={route:'home',filters:{},cardFilters:{},errorFilter:'active',mapSearch:'',mapDiscipline:'',searchTerm:'',chartCount:7,bookId:null,sidebarOpen:false};
const appElement=document.querySelector('#app'),modalElement=document.querySelector('#modal');
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),4500);}
function saveProgress(){if(storageBlocked)return false;try{persistState(state);return true;}catch(error){storageBlocked=true;toast('Não foi possível salvar. Exporte seu progresso pelo Perfil antes de fechar.');return false;}}
function context(){return {...ui,state,bank:BANK,curriculum:CURRICULUM,books:BOOKS,session,flash,storageBlocked};}
function readRoute(){const parts=location.hash.slice(1).split('/');ui.route=['home','train','cards','errors','map','books','stats','favorites','profile','search','quiz'].includes(parts[0])?parts[0]:'home';ui.bookId=parts[1]||null;}
function go(route){if(location.hash==='#'+route){readRoute();render();window.scrollTo(0,0);}else location.hash=route;}
function render(){
 const level=profileLevel(state.xp),name=state.profile?.name||'Seu perfil',navRoute=ui.route==='quiz'?'train':ui.route;
 const views={home:homeScreen,train:trainScreen,cards:cardsScreen,errors:errorsScreen,map:mapScreen,books:booksScreen,stats:statsScreen,favorites:favoritesScreen,profile:profileScreen,search:searchScreen,quiz:sessionScreen};
 const title=ui.route==='profile'?'Seu perfil':ui.route==='search'?'Pesquisa':ui.route==='quiz'?'Em estudo':NAV.find(n=>n[0]===ui.route)?.[2]||'Minha jornada';
 appElement.innerHTML=`<button class="nav-backdrop ${ui.sidebarOpen?'visible':''}" data-action="menu" aria-label="Fechar menu"></button><aside class="sidebar ${ui.sidebarOpen?'open':''}"><a class="brand" href="#home"><span class="brand-mark">M</span><span>FUVEST<strong>mastery<span class="brand-dot">.</span></strong></span></a><span class="nav-label">SEU ESPAÇO DE ESTUDO</span><nav aria-label="Navegação principal">${NAV.map(([id,i,t])=>`<a href="#${id}" class="nav-item ${id===navRoute?'active':''}" ${id===navRoute?'aria-current="page"':''}><span aria-hidden="true">${i}</span>${t}${id==='errors'&&Object.values(state.errors).some(e=>!e.resolved)?'<i class="nav-badge"></i>':''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="exam-label"><span class="status-dot"></span> VESTIBULAR 2027</div><p>Um pouco hoje.<br>Mais clareza amanhã.</p><a class="profile-link" href="#profile"><span class="avatar">${escapeHTML(state.profile?.name?.[0]?.toUpperCase()||'M')}</span><span>${escapeHTML(name)}<small>Nível ${level.level} · ${formatNumber(state.xp)} XP</small></span><span>↗</span></a></div></aside><div class="workspace"><header class="topbar"><button class="menu-toggle" data-action="menu" aria-label="Abrir menu" aria-expanded="${ui.sidebarOpen}">☰</button><span class="breadcrumb">Seu aprendizado <span>/</span> ${title}</span><button class="search-top" data-action="search" aria-label="Buscar um conceito">⌕ <span>Buscar um conceito</span><kbd>/</kbd></button><a class="streak-chip" href="#stats">♨ ${currentStreak(state.activity)} ${currentStreak(state.activity)===1?'dia':'dias'}</a></header>${storageBlocked?'<div class="storage-alert">Seu progresso precisa de atenção. <a href="#profile">Abra o Perfil para exportar ou recuperar seus dados →</a></div>':''}<main id="main" tabindex="-1">${views[ui.route](context())}</main><footer>FUVEST Mastery · Estudo independente, conteúdo autoral. <a href="#profile">Fontes e progresso</a></footer></div>`;
 document.title=`${title} · FUVEST Mastery`;
}
function openModal(html){modalElement.innerHTML=html;if(!modalElement.open)modalElement.showModal();}
function closeModal(){modalElement.close();afterConfirm=null;}
function ensureProfile(action){if(state.profile?.name){action();return;}afterProfile=action;openModal(`<button class="modal-close icon-button" data-action="close-modal" aria-label="Fechar">×</button><span class="brand-mark">M</span><div class="eyebrow modal-eyebrow">SUA JORNADA COMEÇA AQUI</div><h2 id="modal-title">Como podemos chamar você?</h2><p>Vamos guardar sua evolução e preparar seu primeiro treino.</p><form id="onboarding-form" class="form-stack"><label>Seu nome<input name="name" required maxlength="40" autocomplete="given-name" placeholder="Digite seu nome" autofocus></label><label>Seu objetivo <span class="meta">(opcional)</span><input name="goal" maxlength="100" placeholder="Ex.: Medicina na USP"></label><button class="primary" type="submit">Começar minha jornada →</button><p class="note">Seu progresso é salvo neste navegador. Você pode exportar um backup a qualquer momento no Perfil.</p></form>`);}
function confirmAction(title,text,action,label='Continuar'){afterConfirm=action;openModal(`<h2 id="modal-title">${title}</h2><p class="modal-copy">${text}</p><div class="modal-actions">${button('Voltar','close-modal')}${button(label,'confirm-modal','','primary')}</div>`);}
function launch(mode='adaptive',filters={},questionId=null){ensureProfile(()=>{
 const start=()=>{session=createSession(state,BANK,mode,{...filters});const matching=BANK.questions.filter(q=>matchesQuestion(q,conceptById(BANK,q.conceptId),filters,state));session.limit=Math.min(session.limit,matching.length);if(questionId)session.limit=1;state.activeSession=session;if(mode==='daily')state.daily={date:todayKey(),sessionId:session.id,items:[],completed:false};advance(questionId);go('quiz');};
 if(state.activeSession&&!state.activeSession.finished){confirmAction('Você tem um treino em andamento','As respostas já enviadas estão salvas. Você pode encerrar essa sessão para começar outra.',()=>{finishSession(state,state.activeSession);start();},'Encerrar e começar outro');}else start();
 });}
function advance(forcedId=null){
 if(!session)return;
 if(session.finished){render();return;}
 if(session.answered.length>=session.limit||session.lives<=0||session.endsAt&&Date.now()>=session.endsAt){complete();return;}
 const q=forcedId?questionById(BANK,forcedId):pickNextQuestion(state,BANK,session);
 if(!q){complete();return;}
 session.currentId=q.id;session.items.push(q.id);session.questionAt=Date.now();session.questionSeconds=0;session.feedback=null;session.phase='question';session.draft={answer:null,text:'',confidence:null,order:q.type==='order'?q.options.map((_,i)=>i):[],match:q.type==='match'?q.matchLeft.map(()=>-1):[]};
 if(session.mode==='daily'&&state.daily?.sessionId===session.id)state.daily.items.push(q.id);
 state.activeSession=session;lastTick=Date.now();saveProgress();if(ui.route==='quiz'){render();window.scrollTo(0,0);}
}
function complete(){if(!session||session.finished)return;finishSession(state,session);if(state.daily?.sessionId===session.id)state.daily.completed=true;saveProgress();render();if(ui.route==='quiz')window.scrollTo(0,0);}
function submitAnswer(){if(!session||session.finished||session.feedback)return;const q=questionById(BANK,session.currentId);if(!canSubmitDraft(q,session.draft)){toast('Escolha uma resposta e indique sua confiança.');return;}if(session.endsAt&&Date.now()>=session.endsAt){complete();return;}
 const attempt=recordAnswer(state,BANK,session,q,draftAnswer(q,session.draft),session.draft.confidence,session.questionSeconds||0);
 if(!attempt)return;saveProgress();render();document.querySelector('.feedback')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function updateDraft(){saveProgress();const q=questionById(BANK,session.currentId),submit=document.querySelector('[data-action="submit-answer"]');if(submit)submit.disabled=!canSubmitDraft(q,session.draft);}
function startCards(kind,id){ensureProfile(()=>{let concepts=kind==='one'?BANK.concepts.filter(c=>c.id===id):kind==='due'?dueConcepts(state,BANK.concepts):BANK.concepts.filter(c=>(!ui.cardFilters.discipline||c.discipline===ui.cardFilters.discipline)&&(!ui.cardFilters.status||ui.cardFilters.status==='new'&&!state.reviews[c.id]||ui.cardFilters.status==='due'&&isDue(state,c.id)||ui.cardFilters.status==='favorites'&&state.favorites.includes('c:'+c.id)));
 if(!concepts.length){toast('Nenhum cartão nesta seleção.');return;}flash={ids:concepts.map(c=>c.id),currentId:concepts[0].id,index:0,revealed:false,seconds:0};go('cards');});}
function rateCard(rating){if(!flash?.revealed)return;const id=flash.currentId,previous=state.reviews[id],now=Date.now(),due=!previous||isDue(state,id,now);
 if(due||rating==='forgot')state.reviews[id]=scheduleReview(previous,rating,now);
 let xp=0;if(due&&rating!=='forgot'&&(!previous?.flashRewardAt||todayKey(previous.flashRewardAt)!==todayKey(now))){xp=3;state.xp+=xp;state.reviews[id].flashRewardAt=now;}
 else if(previous?.flashRewardAt&&state.reviews[id])state.reviews[id].flashRewardAt=previous.flashRewardAt;
 if(rating==='forgot'&&state.concepts[id]){state.concepts[id].score=Math.max(0,masteryValue(state.concepts[id],previous,now)-8);state.concepts[id].lastAt=now;}
 addActivity(state,'reviews',flash.seconds,now,false,xp);unlockAchievements(state);saveProgress();toast(`Revisão salva · ${relativeDue(state.reviews[id].dueAt)}${xp?' · +3 XP':''}`);
 flash.index++;if(flash.index>=flash.ids.length){flash=null;render();return;}flash.currentId=flash.ids[flash.index];flash.revealed=false;flash.seconds=0;render();}
function downloadText(name,text,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showConcept(id){const c=conceptById(BANK,id);if(!c)return;const score=masteryValue(state.concepts[id],state.reviews[id]);openModal(`<button class="modal-close icon-button" data-action="close-modal" aria-label="Fechar">×</button><div class="eyebrow">${subjectById(c.discipline).name}</div><h2 id="modal-title">${escapeHTML(c.subtopic)}</h2><p class="modal-copy">${escapeHTML(c.summary)}</p><div class="row"><span>Domínio estimado</span><strong>${score}%</strong></div>${bar(score)}<div class="modal-actions">${button('Praticar conceito →','variation',id,'primary')}${button('Revisar cartão','card',id)}${favorite(state,'c',id)}</div>${sourceTrail(c,CURRICULUM)}`);}
function handleAction(action,id,element){
 if(action==='menu'){ui.sidebarOpen=!ui.sidebarOpen;render();return;}
 if(action==='close-modal'){closeModal();afterProfile=null;return;}
 if(action==='confirm-modal'){const fn=afterConfirm;closeModal();fn?.();return;}
 if(action==='start'){launch(id,id==='practice'?ui.filters:{});return;}
 if(action==='resume'){session=state.activeSession;if(session){if(session.endsAt&&Date.now()>=session.endsAt)complete();go('quiz');}return;}
 if(action==='pause-session'){if(session?.mode==='lightning'){confirmAction('Encerrar o Relâmpago?','O cronômetro não pausa neste modo. Seu resultado será registrado agora.',()=>{complete();go('home');},'Encerrar desafio');}else{saveProgress();go('home');toast('Treino pausado e salvo.');}return;}
 if(action==='finish-session'){complete();return;}
 if(action==='select-answer'&&session&&!session.feedback){session.draft.answer=Number(id);updateDraft();render();return;}
 if(action==='confidence'&&session&&!session.feedback){session.draft.confidence=id;updateDraft();render();return;}
 if(action==='submit-answer'){submitAnswer();return;}
 if(action==='next-question'){advance();return;}
 if(action==='order-up'||action==='order-down'){if(session?.feedback)return;const a=session.draft.order,i=Number(id),j=i+(action==='order-up'?-1:1);if(j>=0&&j<a.length){[a[i],a[j]]=[a[j],a[i]];updateDraft();render();}return;}
 if(action==='favorite'){const i=state.favorites.indexOf(id);if(i<0)state.favorites.push(id);else state.favorites.splice(i,1);saveProgress();const kind=id.split(':')[0],noun=kind==='q'?'questão':kind==='c'?'flashcard':'explicação';element.classList.toggle('is-favorite',i<0);element.textContent=i<0?'★':'☆';element.setAttribute('aria-pressed',i<0?'true':'false');element.setAttribute('aria-label',(i<0?'Remover dos favoritos ':'Favoritar ')+noun);if(ui.route==='favorites')render();return;}
 if(action==='question'){const q=questionById(BANK,id);if(q)launch('practice',{subtopic:q.conceptId},id);return;}
 if(action==='variation'){closeModal();launch('practice',{subtopic:id});return;}
 if(action==='subject'){ui.filters={discipline:id};go('train');return;}
 if(action==='concept'){showConcept(id);return;}
 if(action==='clear-filters'){ui.filters={};render();return;}
 if(action==='search'){go('search');setTimeout(()=>document.querySelector('#global-search')?.focus(),0);return;}
 if(action==='search-map'){ui.mapSearch=id;ui.mapDiscipline='';go('map');return;}
 if(action==='go-train'){go('train');return;}
 if(action==='go-home'){go('home');return;}
 if(action==='go-errors'){go('errors');return;}
 if(action==='cards-home'){flash=null;go('cards');return;}
 if(action==='start-cards'){startCards(id);return;}
 if(action==='card'){closeModal();startCards('one',id);return;}
 if(action==='reveal-card'){if(flash){flash.revealed=true;render();}return;}
 if(action==='rate-card'){rateCard(id);return;}
 if(action==='chart-period'){ui.chartCount=Number(id)===30?30:7;render();return;}
 if(action==='favorite-training'){ui.filters={status:'favorites'};launch('practice',ui.filters);return;}
 if(action==='export'){downloadText('fuvest-mastery-backup-'+todayKey()+'.json',exportState(state));toast('Backup exportado. Guarde este arquivo.');return;}
 if(action==='download-curriculum'){downloadText('fuvest-2027-mapa-curricular.json',JSON.stringify(CURRICULUM,null,2));return;}
 if(action==='recover-save'){confirmAction('Começar um novo perfil local?','Exporte o progresso desta sessão antes de continuar. O arquivo local anterior será substituído.',()=>{storageBlocked=false;saveProgress();render();},'Continuar e salvar');return;}
}
document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(!el||el.disabled)return;event.preventDefault();try{handleAction(el.dataset.action,el.dataset.id,el);}catch(error){console.error(error);toast('Não conseguimos concluir esta ação. Seu progresso já salvo foi mantido.');}});
document.addEventListener('input',event=>{if(event.target.id==='written-answer'&&session&&!session.feedback){session.draft.text=event.target.value;updateDraft();}});
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.dataset.filter){const key=el.dataset.filter;ui.filters[key]=el.value;if(key==='discipline'){ui.filters.topic='';ui.filters.subtopic='';}if(key==='topic')ui.filters.subtopic='';render();}
 else if(el.dataset.cardFilter){ui.cardFilters[el.dataset.cardFilter]=el.value;render();}
 else if(el.dataset.match!==undefined&&session&&!session.feedback){session.draft.match[Number(el.dataset.match)]=el.value===''?-1:Number(el.value);updateDraft();}
 else if(el.id==='error-filter'){ui.errorFilter=el.value;render();}
 else if(el.id==='map-discipline'){ui.mapDiscipline=el.value;render();}
 else if(el.id==='book-status'){state.books[el.dataset.book]=el.value;saveProgress();toast('Andamento da leitura salvo.');}
 else if(el.id==='import-file'&&el.files[0]){const file=el.files[0];if(file.size>15000000){toast('Arquivo muito grande. Escolha um backup de até 15 MB.');return;}file.text().then(raw=>{try{pendingImport=importState(raw);confirmAction('Importar este progresso?',`${escapeHTML(pendingImport.profile?.name||'Perfil sem nome')} · ${pendingImport.history.length} respostas · ${pendingImport.xp} XP. Seu progresso local será substituído pelo backup.`,()=>{state=pendingImport;session=state.activeSession;flash=null;storageBlocked=false;saveProgress();render();toast('Progresso importado com sucesso.');},'Importar backup');}catch(error){toast(error.message);el.value='';}}).catch(()=>toast('Não foi possível ler o arquivo.'));}
});
document.addEventListener('submit',event=>{
 const form=event.target;if(!['profile-form','onboarding-form','map-search-form','global-search-form'].includes(form.id))return;event.preventDefault();const data=new FormData(form);
 if(form.id==='profile-form'||form.id==='onboarding-form'){const name=String(data.get('name')||'').trim();if(!name){toast('Digite seu nome para continuar.');return;}state.profile={...state.profile,name:name.slice(0,40),goal:String(data.get('goal')||'').trim().slice(0,100),createdAt:state.profile?.createdAt||Date.now()};if(data.has('dailyCount'))state.settings.dailyCount=Number(data.get('dailyCount'));saveProgress();if(form.id==='onboarding-form'){const next=afterProfile;afterProfile=null;closeModal();render();next?.();}else{render();toast('Perfil salvo.');}}
 if(form.id==='map-search-form'){ui.mapSearch=String(data.get('query')||'');render();}
 if(form.id==='global-search-form'){ui.searchTerm=String(data.get('query')||'');render();}
});
document.addEventListener('keydown',event=>{const editing=/INPUT|TEXTAREA|SELECT/.test(event.target.tagName);if(event.key==='/'&&!editing&&!modalElement.open){event.preventDefault();go('search');setTimeout(()=>document.querySelector('#global-search')?.focus(),0);}if(event.key==='Enter'&&event.target.id==='written-answer'){event.preventDefault();submitAnswer();}if(event.key==='Escape'&&ui.sidebarOpen){ui.sidebarOpen=false;render();}});
window.addEventListener('hashchange',()=>{readRoute();ui.sidebarOpen=false;render();window.scrollTo(0,0);});
window.addEventListener('pagehide',()=>saveProgress());
document.addEventListener('visibilitychange',()=>{lastTick=Date.now();if(document.hidden)saveProgress();});
window.addEventListener('storage',event=>{if(event.key!==SAVE_KEY)return;const latest=loadState();if(!latest.blocked){state=latest.state;session=state.activeSession;render();toast('Progresso atualizado por outra aba.');}});
setInterval(()=>{const now=Date.now(),dt=clamp((now-lastTick)/1000,0,2);lastTick=now;if(session&&!session.finished){if(session.endsAt&&now>=session.endsAt){complete();if(ui.route!=='quiz')toast('Relâmpago concluído. Seu recorde foi salvo.');return;}const clock=document.querySelector('#lightning-clock');if(clock)clock.textContent=formatTime((session.endsAt-now)/1000);if(ui.route==='quiz'&&!document.hidden&&!modalElement.open&&!session.feedback){session.questionSeconds=(session.questionSeconds||0)+dt;const timer=document.querySelector('#question-time');if(timer)timer.textContent=formatTime(session.questionSeconds)+' pensando';if(Math.floor(session.questionSeconds)%5===0)saveProgress();}}if(flash&&ui.route==='cards'&&!document.hidden&&!modalElement.open)flash.seconds+=dt;},1000);
readRoute();if(session?.endsAt&&Date.now()>=session.endsAt)finishSession(state,session);render();if(loaded.warning)toast(loaded.warning);
