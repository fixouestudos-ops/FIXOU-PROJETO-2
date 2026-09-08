import {escapeHTML} from './utils.js';
const ABOUT_VIDEOS=[];
const ABOUT_CONTENT={
 hero:{
  headline:'Estudar não é apenas fazer questões.',
  subline:'É entender o que você realmente domina.',
  description:'O FIXOU organiza seus estudos, identifica seus pontos fortes e mostra onde você ainda precisa evoluir.'
 },
 whatIs:{
  title:'O que é o FIXOU',
  text:'O FIXOU é uma plataforma de estudos voltada para vestibulares como FUVEST, ENEM e Unicamp. Ele combina banco de questões, revisão inteligente, acompanhamento de desempenho e organização por tópicos para ajudar você a entender não apenas quantas questões acertou, mas o que realmente domina.'
 },
 whyExists:{
  title:'Por que o FIXOU existe',
  problems:[
   'Fazer muitas questões não significa necessariamente dominar o conteúdo.',
   'O aluno muitas vezes não sabe onde está errando.',
   'Erros são esquecidos em vez de revisados.',
   'Progresso fica difícil de visualizar.',
   'O conteúdo de vestibular é muito amplo.',
   'Falta clareza sobre o que estudar em seguida.'
  ],
  solution:'O FIXOU foi criado para resolver exatamente isso. Ele transforma seus acertos e erros em um mapa claro do seu domínio, mostrando exatamente onde investir seu tempo.'
 },
 howWorks:{
  title:'Como funciona',
  steps:[
   {icon:'◇',label:'Escolha o que estudar',desc:'Selecione a matéria, área e tópico que quer treinar.'},
   {icon:'▷',label:'Resolva questões',desc:'Enfrente questões de vestibulares reais organizadas por dificuldade.'},
   {icon:'◎',label:'Informe sua confiança',desc:'Diga se tem certeza, acha que sabe ou está chutando.'},
   {icon:'↗',label:'O FIXOU acompanha',desc:'Seu desempenho é registrado e analisado em cada tópico.'},
   {icon:'⊞',label:'Revise seus erros',desc:'Transforme cada erro em material de revisão e domínio.'},
   {icon:'☆',label:'Observe sua evolução',desc:'Acompanhe como seu desempenho muda ao longo do tempo.'}
  ]
 },
 mastery:{
  title:'Entendendo seu domínio',
  text:'O FIXOU não olha apenas se você acertou ou errou. Seu histórico, a dificuldade das questões e sua confiança na resposta ajudam a construir uma visão mais realista do seu domínio em cada tópico.',
  highlight:'Acertar uma questão é diferente de dominar um conteúdo. O FIXOU mostra essa diferença.'
 },
 tools:{
  title:'Conheça as ferramentas',
  items:[
   {icon:'◈',name:'Minha jornada',desc:'Acompanhe seu progresso e visualize o que já domina.'},
   {icon:'▷',name:'Treinar',desc:'Resolva questões organizadas por matéria, área e tópico.'},
   {icon:'▱',name:'Memorizar',desc:'Use revisões e flashcards para reforçar conteúdos importantes.'},
   {icon:'⊞',name:'Cofre dos erros',desc:'Guarde seus erros e transforme-os em material de revisão.'},
   {icon:'⌘',name:'Programa 2027',desc:'Veja o conteúdo do vestibular organizado de forma estruturada.'},
   {icon:'▤',name:'Leituras',desc:'Organize as obras e conteúdos de leitura.'},
   {icon:'↗',name:'Evolução',desc:'Acompanhe como seu desempenho muda ao longo do tempo.'},
   {icon:'☆',name:'Favoritos',desc:'Guarde questões e conteúdos importantes.'}
  ]
 },
 videos:{
  title:'Aprenda a usar o FIXOU',
  emptyText:'Vídeo em breve'
 },
 howToStart:{
  title:'Comece em poucos minutos',
  steps:['Crie sua conta gratuitamente','Escolha a matéria que quer estudar','Faça seu primeiro treino','Veja seu progresso aparecer na Jornada']
 },
 ctaFinal:{
  title:'Pronto para começar?',
  description:'Comece agora e descubra o que você realmente domina.'
 }
};
function videoCard(v){
 const thumb=v.thumbnail?`<img src="${escapeHTML(v.thumbnail)}" alt="" loading="lazy">`:'<div class="about-video-placeholder">🎬</div>';
 const duration=v.duration?`<span class="about-video-duration">${escapeHTML(v.duration)}</span>`:'';
 return `<article class="about-video-card" data-action="about-video" data-url="${escapeHTML(v.url||'')}">
  <div class="about-video-thumb">${thumb}${duration}</div>
  <div class="about-video-info"><h4>${escapeHTML(v.title)}</h4><p>${escapeHTML(v.description)}</p></div>
 </article>`;
}
function stepCard(step,i){
 return `<div class="about-step"><span class="about-step-icon">${step.icon}</span><span class="about-step-num">${i+1}</span><h4>${escapeHTML(step.label)}</h4><p>${escapeHTML(step.desc)}</p></div>`;
}
function toolCard(t){
 return `<div class="about-tool"><span class="about-tool-icon">${t.icon}</span><h4>${escapeHTML(t.name)}</h4><p>${escapeHTML(t.desc)}</p></div>`;
}
export function aboutScreen({account}){
 const logged=!!account;
 const hero=ABOUT_CONTENT.hero;
 const createBtn=logged?`<a href="#home" class="about-cta-primary">Começar a estudar</a>`:`<a href="#register" class="about-cta-primary" data-action="about-create">Criar conta grátis</a>`;
 const finalBtn=logged?`<a href="#home" class="about-cta-primary">Ir para Minha Jornada</a>`:`<a href="#register" class="about-cta-primary" data-action="about-create">Criar conta grátis</a>`;
 const finalBtn2=logged?'':`<a href="#login" class="about-cta-secondary">Entrar</a>`;
 const problems=ABOUT_CONTENT.whyExists.problems.map(p=>`<li>${escapeHTML(p)}</li>`).join('');
 const steps=ABOUT_CONTENT.howWorks.steps.map((s,i)=>stepCard(s,i)).join('');
 const tools=ABOUT_CONTENT.tools.items.map(t=>toolCard(t)).join('');
 const videos=ABOUT_VIDEOS.length?ABOUT_VIDEOS.map(v=>videoCard(v)).join(''):`<div class="about-video-empty">${ABOUT_CONTENT.videos.emptyText}</div>`;
 const startSteps=ABOUT_CONTENT.howToStart.steps.map((s,i)=>`<li><span class="about-start-num">${i+1}</span>${escapeHTML(s)}</li>`).join('');
 return `
<section class="about-page">
 <header class="about-hero">
  <h1>${escapeHTML(hero.headline)}<br><em>${escapeHTML(hero.subline)}</em></h1>
  <p>${escapeHTML(hero.description)}</p>
  <div class="about-hero-ctas">${createBtn}</div>
 </header>

 <section class="about-section about-what">
  <h2>${ABOUT_CONTENT.whatIs.title}</h2>
  <p>${escapeHTML(ABOUT_CONTENT.whatIs.text)}</p>
 </section>

 <section class="about-section about-why">
  <h2>${ABOUT_CONTENT.whyExists.title}</h2>
  <ul class="about-problems">${problems}</ul>
  <p class="about-why-solution">${escapeHTML(ABOUT_CONTENT.whyExists.solution)}</p>
 </section>

 <section class="about-section about-how">
  <h2>${ABOUT_CONTENT.howWorks.title}</h2>
  <div class="about-steps">${steps}</div>
 </section>

 <section class="about-section about-mastery">
  <h2>${ABOUT_CONTENT.mastery.title}</h2>
  <p>${escapeHTML(ABOUT_CONTENT.mastery.text)}</p>
  <p class="about-mastery-highlight">${escapeHTML(ABOUT_CONTENT.mastery.highlight)}</p>
 </section>

 <section class="about-section about-tools">
  <h2>${ABOUT_CONTENT.tools.title}</h2>
  <div class="about-tools-grid">${tools}</div>
 </section>

 <section class="about-section about-videos-section">
  <h2>${ABOUT_CONTENT.videos.title}</h2>
  <div class="about-videos-grid">${videos}</div>
 </section>

 <section class="about-section about-start">
  <h2>${ABOUT_CONTENT.howToStart.title}</h2>
  <ol class="about-start-steps">${startSteps}</ol>
 </section>

 <section class="about-section about-cta-final">
  <h2>${ABOUT_CONTENT.ctaFinal.title}</h2>
  <p>${escapeHTML(ABOUT_CONTENT.ctaFinal.description)}</p>
  <div class="about-cta-final-buttons">${finalBtn}${finalBtn2}</div>
 </section>
</section>`;
}
