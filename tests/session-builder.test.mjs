import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState} from '../src/save.js';
import {matchesQuestion} from '../src/training.js';
import {defaultSessionBuilder,cleanSessionBuilder,builderFilters,sessionTopicKeys} from '../src/session-builder.js';
const bank=JSON.parse(fs.readFileSync(new URL('../content/bank.json',import.meta.url),'utf8'));
const concepts=Object.fromEntries(bank.concepts.map(c=>[c.id,c]));
test('sessão personalizada começa apenas com disciplinas que possuem questões publicáveis',()=>{
 const b=defaultSessionBuilder(bank);assert.deepEqual(b.subjects,['fisica']);assert.ok(b.topics.length>0);assert.deepEqual(b.difficulties,[1,2,3,4]);assert.equal(b.quantity,20);
});
test('sessão personalizada remove assuntos de disciplinas desmarcadas e preserva opções válidas',()=>{
 const all=defaultSessionBuilder(bank),only=cleanSessionBuilder(bank,{...all,subjects:['fisica'],topics:all.topics.filter(k=>k.startsWith('fisica|')),difficulties:[2,4],quantity:50});assert.deepEqual(only.subjects,['fisica']);assert.ok(only.topics.every(key=>key.startsWith('fisica|')));assert.deepEqual(only.difficulties,[2,4]);assert.equal(only.quantity,50);assert.deepEqual(builderFilters(only).disciplines,['fisica']);
});
test('matchesQuestion aceita múltiplas disciplinas, assuntos e dificuldades',()=>{
 const q=bank.questions.find(x=>x.difficulty===2),c=concepts[q.conceptId],f={disciplines:[c.discipline],topics:[`${c.discipline}|${c.topic}`],difficulties:[2]};assert.equal(matchesQuestion(q,c,f,createState()),true);assert.equal(matchesQuestion(q,c,{...f,disciplines:['geografia']},createState()),false);assert.equal(matchesQuestion(q,c,{...f,difficulties:[4]},createState()),false);assert.ok(sessionTopicKeys(bank,['fisica']).every(k=>k.startsWith('fisica|')));
});
