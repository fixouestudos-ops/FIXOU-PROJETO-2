export const SAVE_KEY = 'fixou:2027:v1';
export const LEGACY_SAVE_KEY = 'fuvest-mastery:2027:v1';
export const SETTINGS_DEFAULTS={dailyCount:20,dailyCustom:20,theme:'system',fontScale:1,highContrast:false,reduceMotion:false,primaryExam:'FUVEST',dailyMinutes:30,autoExplanation:false,shuffleOptions:false,showDifficulty:true,showExam:true,soundCorrect:false,soundWrong:false};
export const createState = () => ({version:1,profile:null,xp:0,history:[],concepts:{},reviews:{},errors:{},favorites:[],activity:{},records:{lightning:0,survival:0},sessions:[],activeSession:null,daily:null,books:{},achievements:[],settings:{...SETTINGS_DEFAULTS},savedAt:null});
export function validateState(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==1)throw new Error('Este arquivo não é um backup compatível do FUVEST Mastery.');
 const raw=JSON.stringify(input);if(raw.length>15000000)throw new Error('O backup é muito grande.');
 if(/"(?:__proto__|prototype|constructor)"\s*:/.test(raw))throw new Error('O backup contém campos inválidos.');
 const base=createState();
 for(const key of ['history','favorites','sessions','achievements'])if(!Array.isArray(input[key]))throw new Error(`Campo inválido: ${key}.`);
 for(const key of ['concepts','reviews','errors','activity','records','books','settings'])if(!input[key]||typeof input[key]!=='object'||Array.isArray(input[key]))throw new Error(`Campo inválido: ${key}.`);
 if(!Number.isFinite(input.xp)||input.xp<0||input.xp>1e9)throw new Error('XP inválido.');
 if(input.profile!==null&&(!input.profile||typeof input.profile.name!=='string'||input.profile.name.length>60))throw new Error('Perfil inválido.');
 const isTime=x=>Number.isFinite(x)&&x>=0&&x<9e15;
 const count=x=>Number.isSafeInteger(x)&&x>=0;
 const strings=x=>Array.isArray(x)&&x.every(v=>typeof v==='string');
 const attempt=h=>h&&typeof h.id==='string'&&typeof h.questionId==='string'&&typeof h.conceptId==='string'&&typeof h.discipline==='string'&&typeof h.correct==='boolean'&&isTime(h.at)&&Number.isFinite(h.seconds)&&h.seconds>=0&&['sure','think','guess'].includes(h.confidence)&&count(h.xp)&&[1,2,3,4].includes(h.difficulty);
 for(const h of input.history){if(!h||typeof h.questionId!=='string'||typeof h.conceptId!=='string'||typeof h.correct!=='boolean'||!isTime(h.at)||!Number.isFinite(h.seconds)||h.seconds<0||!['sure','think','guess'].includes(h.confidence))throw new Error('Histórico de respostas inválido.');}
 if(input.history.some(h=>!attempt(h)))throw new Error('Histórico incompleto.');
 for(const c of Object.values(input.concepts)){if(!c||!Number.isFinite(c.score)||c.score<0||c.score>100||!isTime(c.lastAt)||!strings(c.questionIds)||!strings(c.days)||!strings(c.recoveryIds)||!Array.isArray(c.recent)||c.recent.some(v=>v!==0&&v!==1)||!['attempts','correct','consecutiveErrors','consecutiveCorrect'].every(k=>count(c[k])))throw new Error('Dados de domínio inválidos.');}
 for(const r of Object.values(input.reviews)){if(!r||!isTime(r.dueAt)||!isTime(r.lastAt)||!Number.isFinite(r.interval)||r.interval<0||r.interval>365||!Number.isFinite(r.ease)||r.ease<1.3||r.ease>3||!count(r.repetitions)||!count(r.lapses)||r.flashRewardAt!==undefined&&!isTime(r.flashRewardAt))throw new Error('Agenda de revisão inválida.');}
 for(const e of Object.values(input.errors)){if(!e||typeof e.questionId!=='string'||typeof e.conceptId!=='string'||!isTime(e.lastAt)||!Number.isFinite(e.count))throw new Error('Cofre dos erros inválido.');}
 for(const [key,a] of Object.entries(input.activity)){if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!a||!Number.isFinite(a.answers)||!Number.isFinite(a.seconds)||!Number.isFinite(a.reviews))throw new Error('Calendário inválido.');}
 if(input.favorites.some(x=>typeof x!=='string')||input.achievements.some(x=>typeof x!=='string'))throw new Error('Favoritos ou conquistas inválidos.');
 if(!count(input.records.lightning)||!count(input.records.survival))throw new Error('Recordes inválidos.');
 for(const a of Object.values(input.activity))if(!['answers','correct','reviews','xp'].every(k=>count(a[k]))||a.seconds<0)throw new Error('Calendário incompleto.');
 for(const s of input.sessions)if(!s||typeof s.id!=='string'||typeof s.mode!=='string'||!isTime(s.startedAt)||!isTime(s.finishedAt)||!['total','correct','bestCombo','xp'].every(k=>count(s[k]))||!Number.isFinite(s.seconds)||s.seconds<0)throw new Error('Histórico de sessões inválido.');
 if(!Number.isInteger(input.settings.dailyCount)||input.settings.dailyCount<5||input.settings.dailyCount>200)throw new Error('Meta diária inválida.');
 if(input.activeSession!==null&&input.activeSession!==undefined){const s=input.activeSession;
  if(!s||typeof s.id!=='string'||!['daily','adaptive','weak','practice','lightning','survival','boss'].includes(s.mode)||!Array.isArray(s.answered)||s.answered.some(h=>!attempt(h))||!strings(s.items)||!isTime(s.startedAt)||!count(s.lives)||s.lives>3||!count(s.limit)||!['score','combo','bestCombo'].every(k=>count(s[k]))||!['question','feedback'].includes(s.phase)||s.finished!==false||typeof s.currentId!=='string'||!s.items.includes(s.currentId)||!s.filters||typeof s.filters!=='object'||Array.isArray(s.filters)||Object.values(s.filters).some(v=>!['string','number'].includes(typeof v))||s.endsAt!==null&&!isTime(s.endsAt))throw new Error('Sessão salva inválida.');
  const d=s.draft;if(!d||typeof d.text!=='string'||!Array.isArray(d.order)||!Array.isArray(d.match)||d.order.some(v=>!count(v))||d.match.some(v=>!Number.isInteger(v)||v< -1)||d.answer!==null&&!count(d.answer)||d.confidence!==null&&!['sure','think','guess'].includes(d.confidence)||!Number.isFinite(s.questionSeconds)||s.questionSeconds<0||s.phase==='feedback'&&(!attempt(s.feedback)||s.feedback.questionId!==s.currentId))throw new Error('Resposta em andamento inválida.');
 }
 return {...base,...input,settings:{...SETTINGS_DEFAULTS,...input.settings}};
}
export function loadState(storage=globalThis.localStorage){
 try{const raw=storage.getItem(SAVE_KEY)||storage.getItem(LEGACY_SAVE_KEY);if(!raw)return {state:createState(),warning:null};return {state:validateState(JSON.parse(raw)),warning:storage.getItem(SAVE_KEY)?null:'Migramos seu progresso local para o FIXOU.'};}
 catch(error){try{const backup=storage.getItem(SAVE_KEY+':backup');if(backup)return {state:validateState(JSON.parse(backup)),warning:'Recuperamos a cópia anterior do seu progresso.'};}catch{}return {state:createState(),warning:'Não foi possível carregar o progresso. O arquivo anterior foi preservado; importe um backup pelo Perfil.',blocked:true};}
}
export function persistState(state,storage=globalThis.localStorage){
 state.savedAt=Date.now();const serialized=JSON.stringify(state);
 const previous=storage.getItem(SAVE_KEY);if(previous){try{validateState(JSON.parse(previous));storage.setItem(SAVE_KEY+':backup',previous);}catch{}}
 storage.setItem(SAVE_KEY,serialized);return true;
}
export function exportState(state){return JSON.stringify({app:'FIXOU',legacyApp:'FUVEST Mastery',exportedAt:new Date().toISOString(),state},null,2);}
export function importState(raw){let json;try{json=JSON.parse(raw);}catch{throw new Error('Arquivo JSON inválido.');}if(!['FIXOU','FUVEST Mastery'].includes(json.app))throw new Error('Escolha um backup exportado pelo FIXOU.');return validateState(json.state);}
