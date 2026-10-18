import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,validateState} from '../src/save.js';
import {cardsScreen} from '../src/screens.js';
import {settingsScreen} from '../src/screens-settings.js';
import {aboutScreen} from '../src/screens-about.js';

const concept={id:'fisica-cinematica-mru',discipline:'fisica',topic:'Mecânica',subtopic:'MRU',summary:'Movimento com velocidade constante.',officialIds:[],flashcard:{front:'Como reconhecer MRU?',back:'A velocidade permanece constante.'}};
const bank={concepts:[concept],questions:[]};

test('os três temas aparecem nas configurações e o tema escolhido sobrevive à validação',()=>{
 const state=createState();
 state.settings.theme='rest';
 const validated=validateState(state);
 assert.equal(validated.settings.theme,'rest');
 const html=settingsScreen({state:validated,account:{name:'Estudante',email:'e@x.test'},loggingOut:false});
 for(const theme of ['nebula','light','rest'])assert.match(html,new RegExp(`data-id="${theme}"`));
 assert.match(html,/themeCard[^>]+data-id="rest"[^>]+aria-pressed="true"/);
});

test('Quem Somos oferece os seis balões e ferramentas que apontam para rotas reais',()=>{
 const html=aboutScreen({account:{name:'Estudante'}});
 for(const phrase of ['errei','bora','quase!','agora entendi','dominei!','revisar amanhã'])assert.ok(html.includes(phrase));
 for(const title of ['Feito de estudantes para estudantes','Por que o FIXOU existe','O que torna o FIXOU diferente','Ainda somos um projeto-piloto','Encontrou um erro?','Ajude a construir o FIXOU','Conheça as ferramentas','Aprenda a usar o FIXOU'])assert.ok(html.includes(title));
 for(const note of ['a gente também já passou por isso','o estudo faz mais sentido com direção','descubra o que já fixou','ainda crescendo!','ops!','bora juntos'])assert.ok(html.includes(`<div class="handnote">${note}</div>`));
 for(const route of ['home','train','cards','errors','map','books','stats','favorites'])assert.ok(html.includes(`data-id="${route}"`));
 assert.ok(!html.includes('aboutStarRegion'));
 assert.ok(!html.includes('editorialIndex'));
 assert.ok(!html.includes('— O FIXOU'));
});

test('Memorizar expõe as duas classificações do protótipo e cartão 3D acessível',()=>{
 const state=createState();
 const html=cardsScreen({state,bank,cardFilters:{},flash:{ids:[concept.id],currentId:concept.id,index:0,revealed:true}});
 assert.match(html,/flashCard flash-card-3d flipped/);
 assert.match(html,/aria-label="Ocultar resposta"/);
 for(const rating of ['forgot','good'])assert.ok(html.includes(`data-id="${rating}"`));
 assert.ok(html.includes('← Rever')&&html.includes('Sei →'));
});
