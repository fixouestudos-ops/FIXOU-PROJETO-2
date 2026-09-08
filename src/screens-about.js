import {escapeHTML} from './utils.js';
const ABOUT_VIDEOS=[];
const ABOUT_CONTENT={
 hero:{
  headline:'Você não precisa estudar mais.',
  subline:'Precisa entender o que realmente domina.',
  description:'O FIXOU transforma questões, erros e desempenho em uma jornada clara de evolução para o vestibular.'
 },
 whatIs:{
  title:'O que é o FIXOU',
  text:'O FIXOU é uma plataforma de estudos que organiza questões, desempenho, revisões e conteúdo do vestibular em uma única jornada. Em vez de mostrar apenas quantas questões você acertou, ele ajuda você a entender quais conteúdos realmente domina e quais ainda precisam de atenção.'
 },
 problems:{
  title:'O problema',
  items:[
   'Resolver centenas de questões sem saber se evoluiu.',
   'Esquecer os próprios erros e nunca revisá-los.',
   'Não saber o que revisar nem por onde começar.',
   'Estudar assuntos que já domina enquanto outros ficam para trás.',
   'Dificuldade para visualizar progresso real.',
   'Excesso de conteúdo e falta de direção.'
  ]
 },
 howItWorks:{
  title:'Como o FIXOU resolve',
  steps:[
   {num:'01',label:'Escolha o que estudar',desc:'Selecione a matéria, área e tópico que quer treinar.'},
   {num:'02',label:'Resolva questões',desc:'Enfrente questões de vestibulares reais organizadas por dificuldade.'},
   {num:'03',label:'Informe sua confiança',desc:'Diga se tem certeza, acha que sabe ou está chutando.'},
   {num:'04',label:'O FIXOU acompanha',desc:'Seu desempenho é registrado e analisado em cada tópico.'},
   {num:'05',label:'Revise seus erros',desc:'Transforme cada erro em material de revisão e domínio.'},
   {num:'06',label:'Veja sua evolução',desc:'Acompanhe como seu desempenho muda ao longo do tempo.'}
  ]
 },
 mastery:{
  title:'Acertar é diferente de dominar',
  text:'O FIXOU não olha apenas se você acertou ou errou. Seu histórico, a dificuldade das questões e sua confiança na resposta ajudam a construir uma visão mais realista do seu domínio em cada tópico.',
  highlight:'Uma questão acertada por chute não vale o mesmo que uma respondida com segurança e entendimento.'
 },
 tools:{
  title:'Conheça as ferramentas',
  items:[
   {icon:'◈',name:'Minha jornada',desc:'Seu painel pessoal de evolução. Progresso, domínio e desempenho em um só lugar.'},
   {icon:'▷',name:'Treinar',desc:'Questões organizadas para você praticar com propósito.'},
   {icon:'▱',name:'Memorizar',desc:'Transforme conteúdo importante em revisão recorrente.'},
   {icon:'⊞',name:'Cofre dos erros',desc:'Seus erros deixam de ser esquecidos e passam a fazer parte da sua revisão.'},
   {icon:'⌘',name:'Programa 2027',desc:'Veja o conteúdo do vestibular organizado em matérias, áreas e tópicos.'},
   {icon:'▤',name:'Leituras',desc:'Organize as obras e conteúdos de leitura obrigatória.'},
   {icon:'↗',name:'Evolução',desc:'Veja como seu desempenho muda ao longo do tempo.'},
   {icon:'☆',name:'Favoritos',desc:'Guarde questões e conteúdos importantes para revisitar.'}
  ]
 },
 videos:{
  title:'Aprenda a usar o FIXOU',
  emptyText:'Vídeo em breve'
 },
 ctaFinal:{
  title:'Estude com direção. Evolua com clareza.',
  description:'Seu progresso começa quando você entende onde está.'
 }
};
function toolCard(t,i){
 return `<div class="ab-tool" data-delay="${i}"><span class="ab-tool-icon">${t.icon}</span><h4>${escapeHTML(t.name)}</h4><p>${escapeHTML(t.desc)}</p></div>`;
}
function stepCard(s,i){
 return `<div class="ab-step" data-delay="${i}"><span class="ab-step-num">${s.num}</span><h4>${escapeHTML(s.label)}</h4><p>${escapeHTML(s.desc)}</p></div>`;
}
function problemCard(p,i){
 return `<div class="ab-problem" data-delay="${i}"><span class="ab-problem-x">✕</span><p>${escapeHTML(p)}</p></div>`;
}
function videoCard(v){
 const thumb=v.thumbnail?`<img src="${escapeHTML(v.thumbnail)}" alt="" loading="lazy">`:'<div class="ab-video-ph">🎬</div>';
 const dur=v.duration?`<span class="ab-video-dur">${escapeHTML(v.duration)}</span>`:'';
 return `<article class="ab-video" data-action="about-video" data-url="${escapeHTML(v.url||'')}"><div class="ab-video-thumb">${thumb}${dur}</div><div class="ab-video-info"><h4>${escapeHTML(v.title)}</h4><p>${escapeHTML(v.description)}</p></div></article>`;
}
export function aboutScreen({account}){
 const logged=!!account;
 const hero=ABOUT_CONTENT.hero;
 const cta1=logged?`<a href="#home" class="ab-btn ab-btn-primary">Começar a estudar</a>`:`<a href="#register" class="ab-btn ab-btn-primary" data-action="about-create">Criar conta grátis</a>`;
 const cta2=`<a href="#${logged?'home':'login'}" class="ab-btn ab-btn-ghost" data-action="${logged?'about-start-study':'about-create'}">${logged?'Ver como funciona':'Ver como funciona'}</a>`;
 const finalBtn=logged?`<a href="#home" class="ab-btn ab-btn-primary">Ir para Minha Jornada</a>`:`<a href="#register" class="ab-btn ab-btn-primary" data-action="about-create">Criar conta grátis</a>`;
 const finalBtn2=logged?'':`<a href="#login" class="ab-btn ab-btn-ghost">Entrar</a>`;
 const problems=ABOUT_CONTENT.problems.items.map((p,i)=>problemCard(p,i)).join('');
 const steps=ABOUT_CONTENT.howItWorks.steps.map((s,i)=>stepCard(s,i)).join('');
 const tools=ABOUT_CONTENT.tools.items.map((t,i)=>toolCard(t,i)).join('');
 const videos=ABOUT_VIDEOS.length?ABOUT_VIDEOS.map(v=>videoCard(v)).join(''):`<div class="ab-video-empty">${ABOUT_CONTENT.videos.emptyText}</div>`;
 return `
<section class="ab-page">
 <div class="ab-bg-glow ab-bg-glow-1"></div>
 <div class="ab-bg-glow ab-bg-glow-2"></div>
 <div class="ab-bg-glow ab-bg-glow-3"></div>

 <header class="ab-hero">
  <div class="ab-hero-content">
   <h1 class="ab-hero-headline" data-reveal>${escapeHTML(hero.headline)}<br><span class="ab-hero-accent">${escapeHTML(hero.subline)}</span></h1>
   <p class="ab-hero-desc" data-reveal>${escapeHTML(hero.description)}</p>
   <div class="ab-hero-ctas" data-reveal>${cta1}${cta2}</div>
  </div>
  <div class="ab-hero-orb" aria-hidden="true"><div class="ab-orb-ring"></div><div class="ab-orb-ring ab-orb-ring-2"></div></div>
 </header>

 <section class="ab-section ab-what" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.whatIs.title}</h2>
   <p class="ab-what-text" data-reveal>${escapeHTML(ABOUT_CONTENT.whatIs.text)}</p>
  </div>
 </section>

 <section class="ab-section ab-problems" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.problems.title}</h2>
   <div class="ab-problems-grid">${problems}</div>
  </div>
 </section>

 <section class="ab-section ab-how" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.howItWorks.title}</h2>
   <div class="ab-steps-grid">${steps}</div>
  </div>
 </section>

 <section class="ab-section ab-mastery" data-section>
  <div class="ab-section-inner ab-mastery-inner">
   <h2 data-reveal>${ABOUT_CONTENT.mastery.title}</h2>
   <p data-reveal>${escapeHTML(ABOUT_CONTENT.mastery.text)}</p>
   <blockquote class="ab-mastery-quote" data-reveal>${escapeHTML(ABOUT_CONTENT.mastery.highlight)}</blockquote>
  </div>
 </section>

 <section class="ab-section ab-tools" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.tools.title}</h2>
   <div class="ab-tools-grid">${tools}</div>
  </div>
 </section>

 <section class="ab-section ab-videos-section" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.videos.title}</h2>
   <div class="ab-videos-grid">${videos}</div>
  </div>
 </section>

 <section class="ab-section ab-cta" data-section>
  <div class="ab-section-inner ab-cta-inner">
   <h2 data-reveal>${ABOUT_CONTENT.ctaFinal.title}</h2>
   <p data-reveal>${escapeHTML(ABOUT_CONTENT.ctaFinal.description)}</p>
   <div class="ab-cta-buttons" data-reveal>${finalBtn}${finalBtn2}</div>
  </div>
 </section>
</section>`;
}
