import fs from 'node:fs';
import { execSync } from 'node:child_process';
const alvos = JSON.parse(fs.readFileSync('scripts/lote14-recuperadas-17.json', 'utf8'));
// baseline = HEAD (dc80695)
const antesRaw = execSync('git show HEAD:content/bank.json', { maxBuffer: 1024 * 1024 * 100 }).toString('utf8');
const depoisRaw = fs.readFileSync('content/bank.json', 'utf8');
const antes = JSON.parse(antesRaw);
const depois = JSON.parse(depoisRaw);
const aMap = new Map(antes.questions.map(q => [q.id, q]));
const dMap = new Map(depois.questions.map(q => [q.id, q]));
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
console.log('=== ESTRUTURA ===');
console.log('3513/3513:', antes.questions.length === 3513 && depois.questions.length === 3513);
if (antes.questions.length !== 3513 || depois.questions.length !== 3513) fail('contagem');
console.log('conceitos intactos:', JSON.stringify(antes.concepts) === JSON.stringify(depois.concepts));
console.log('metadados topo intactos:', JSON.stringify({ ...antes, questions: [] }) === JSON.stringify({ ...depois, questions: [] }));
const alterados = depois.questions.filter(q => JSON.stringify(q) !== JSON.stringify(aMap.get(q.id))).map(q => q.id);
const fora = alterados.filter(i => !alvos[i]);
console.log('alteradas:', alterados.length, '(esperado 17) | fora do escopo:', fora.length);
if (alterados.length !== 17) fail('contagem != 17');
if (fora.length) fail('fora: ' + fora.join(','));
console.log('\n=== SOMENTE explanation ===');
let campoErrado = 0;
for (const id of alterados) {
  const a = aMap.get(id), d = dMap.get(id);
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
    if (k === 'explanation') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(d[k])) { console.log('  ' + id + ' campo: ' + k); campoErrado++; }
  }
}
console.log('  campos extra:', campoErrado);
if (campoErrado) fail('campo extra');
console.log('\n=== CONTEUDO ===');
let probs = 0;
for (const [id, esperado] of Object.entries(alvos)) {
  const q = dMap.get(id);
  const p = [];
  if (q.explanation !== esperado) p.push('divergente');
  if (q.explanation.includes('**')) p.push('markdown');
  if (/Converta primeiro|coincide com o gabarito/.test(q.explanation)) p.push('generico');
  if (p.length) { console.log('  FALHA ' + id + ': ' + p.join(',')); probs++; }
}
console.log('  conferidas:', Object.keys(alvos).length - probs + '/' + Object.keys(alvos).length);
if (probs) fail('conteudo');
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
