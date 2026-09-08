import {escapeHTML} from './utils.js';
const ABOUT_VIDEOS=[];
const ABOUT_CONTENT={
 hero:{
  headline:'Você não precisa estudar mais.',
  subline:'Precisa entender o que realmente domina.',
  description:'O FIXOU transforma questões, erros e desempenho em uma jornada clara de evolução para o vestibular.'
 },
 origin:{
  title:'Feito de estudantes para estudantes',
  text:'O FIXOU nasceu como um projeto-piloto feito de estudantes para estudantes. A ideia surgiu de uma dificuldade que muita gente conhece bem: estudar bastante, resolver várias questões e, mesmo assim, nem sempre conseguir enxergar com clareza o que já está dominado, onde ainda existem dificuldades e o que realmente precisa ser revisado.'
 },
 whyExists:{
  title:'Por que o FIXOU existe',
  text:'O nosso objetivo é ir além de ser apenas um banco de questões. O diferencial do FIXOU é acompanhar a sua evolução ao longo dos estudos, identificando seus pontos fortes e pontos que ainda precisam de atenção, para ajudar você a estudar de forma mais direcionada e entender melhor o próprio desempenho.'
 },
 differential:{
  title:'O que torna o FIXOU diferente',
  highlight:'O FIXOU não quer apenas mostrar quantas questões você acertou. Ele acompanha sua evolução para ajudar a identificar seus pontos fortes, pontos fracos e o que precisa ser revisado.',
  text:'Mais do que mostrar quantas questões você acertou, queremos ajudar você a entender como está aprendendo. Porque estudar com mais clareza também é saber onde você está, onde precisa melhorar e qual é o próximo passo.'
 },
 pilot:{
  title:'Ainda somos um projeto-piloto',
  text:'Como este ainda é um projeto novo e está em constante desenvolvimento, algumas coisas podem não funcionar perfeitamente desde o início. Mesmo com todo o cuidado na revisão do conteúdo, é possível que alguma questão apresente erro de digitação, imagem incorreta, alternativa incompleta ou alguma outra inconsistência.',
  note:'Isso não nos desanima — nos motiva a melhorar cada vez mais. Estamos construindo e melhorando continuamente, ouvindo os estudantes e transformando os problemas encontrados durante os estudos em melhorias reais na plataforma.'
 },
 report:{
  title:'Encontrou um erro?',
  text:'Se isso acontecer, pedimos um pouco de paciência — e, principalmente, a sua ajuda. Em cada questão, você poderá reportar um problema para que possamos revisar e corrigir o conteúdo o mais rápido possível.',
  cta:'Use a opção "Reportar problema" na própria questão.'
 },
 support:{
  title:'Ajude a construir o FIXOU',
  text:'Também queremos construir o FIXOU junto com quem realmente usa a plataforma. Se encontrar algum erro, tiver dificuldade para utilizar alguma função, perceber algo que poderia melhorar ou simplesmente quiser mandar uma sugestão, você poderá entrar em contato com o nosso suporte.',
  cta:'Encontre um problema na plataforma ou quer enviar uma sugestão? Entre em contato com o nosso suporte.'
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

 <section class="ab-section ab-origin" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.origin.title}</h2>
   <p class="ab-section-text" data-reveal>${escapeHTML(ABOUT_CONTENT.origin.text)}</p>
  </div>
 </section>

 <section class="ab-section ab-why" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.whyExists.title}</h2>
   <p class="ab-section-text" data-reveal>${escapeHTML(ABOUT_CONTENT.whyExists.text)}</p>
  </div>
 </section>

 <section class="ab-section ab-differential" data-section>
  <div class="ab-section-inner ab-differential-inner">
   <h2 data-reveal>${ABOUT_CONTENT.differential.title}</h2>
   <blockquote class="ab-highlight-quote" data-reveal>${escapeHTML(ABOUT_CONTENT.differential.highlight)}</blockquote>
   <p class="ab-section-text" data-reveal>${escapeHTML(ABOUT_CONTENT.differential.text)}</p>
  </div>
 </section>

 <section class="ab-section ab-pilot" data-section>
  <div class="ab-section-inner">
   <h2 data-reveal>${ABOUT_CONTENT.pilot.title}</h2>
   <p class="ab-section-text" data-reveal>${escapeHTML(ABOUT_CONTENT.pilot.text)}</p>
   <p class="ab-note-text" data-reveal>${escapeHTML(ABOUT_CONTENT.pilot.note)}</p>
  </div>
 </section>

 <section class="ab-section ab-report" data-section>
  <div class="ab-section-inner ab-report-inner">
   <h2 data-reveal>${ABOUT_CONTENT.report.title}</h2>
   <p class="ab-section-text" data-reveal>${escapeHTML(ABOUT_CONTENT.report.text)}</p>
   <div class="ab-report-cta" data-reveal><span class="ab-report-icon">⚠</span><span>${escapeHTML(ABOUT_CONTENT.report.cta)}</span></div>
  </div>
 </section>

 <section class="ab-section ab-support" data-section>
  <div class="ab-section-inner ab-support-inner">
   <h2 data-reveal>${ABOUT_CONTENT.support.title}</h2>
   <p class="ab-section-text" data-reveal>${escapeHTML(ABOUT_CONTENT.support.text)}</p>
   <div class="ab-support-cta" data-reveal><a class="ab-btn ab-btn-ghost" href="mailto:fixouestudos@gmail.com?subject=Suporte%20FIXOU">Entrar em contato com o suporte</a></div>
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
