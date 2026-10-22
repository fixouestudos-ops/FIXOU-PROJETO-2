import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
// backup imediatamente antes das 135 (apos as 22)
const antes135 = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json.pre-l14-135'), 'utf8'));
const depois = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json'), 'utf8'));
const records = JSON.parse(fs.readFileSync(path.join(DEST, 'manifest-full.json'), 'utf8'));
const alvos = {};
for (const r of records) if (!r.already_applied && r.proposed_explanation) alvos[r.id] = r.proposed_explanation;
const aMap = new Map(antes135.questions.map(q => [q.id, q]));
const dMap = new Map(depois.questions.map(q => [q.id, q]));
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
console.log('=== ESTRUTURA ===');
console.log('questoes antes/depois:', antes135.questions.length, '/', depois.questions.length);
if (antes135.questions.length !== depois.questions.length || depois.questions.length !== 3513) fail('contagem mudou');
console.log('conceitos intactos:', JSON.stringify(antes135.concepts) === JSON.stringify(depois.concepts));
console.log('metadados topo intactos:', JSON.stringify({ ...antes135, questions: [] }) === JSON.stringify({ ...depois, questions: [] }));
const alterados = depois.questions.filter(q => JSON.stringify(q) !== JSON.stringify(aMap.get(q.id))).map(q => q.id);
console.log('questoes alteradas:', alterados.length, '(esperado 135) | fora do escopo:', alterados.filter(i => !alvos[i]).length);
if (alterados.length !== 135) fail('contagem != 135');
if (alterados.some(i => !alvos[i])) fail('fora do escopo');
console.log('\n=== SOMENTE explanation ===');
let campoErrado = 0;
for (const id of alterados) {
  const a = aMap.get(id), d = dMap.get(id);
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
    if (k === 'explanation') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(d[k])) { console.log('  ' + id + ' campo extra: ' + k); campoErrado++; }
  }
}
console.log('  campos nao-explanation alterados:', campoErrado);
if (campoErrado) fail('campo extra');
console.log('\n=== CONTEUDO ===');
let probsExp = 0;
for (const [id, esperado] of Object.entries(alvos)) {
  const q = dMap.get(id);
  const probs = [];
  if (q.explanation !== esperado) probs.push('divergente do alvo');
  if (q.explanation.includes('**')) probs.push('markdown');
  if (/Converta primeiro|coincide com o gabarito/.test(q.explanation)) probs.push('generico residual');
  if (probs.length) { console.log('  FALHA ' + id + ': ' + probs.join(', ')); probsExp++; }
}
console.log('  conferidas:', Object.keys(alvos).length - probsExp + '/' + Object.keys(alvos).length);
if (probsExp) fail('conteudo');
// 22 anteriores intactos
const JA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'lote14-explicacoes.json'), 'utf8'));
let ja22Ok = 0;
for (const [id, exp] of Object.entries(JA)) {
  if (dMap.get(id).explanation === exp) ja22Ok++; else fail('22 revertido: ' + id);
}
console.log('\n22 anteriores intactos:', ja22Ok + '/22');
// divergencias nao tocadas
for (const id of ['fis-lic-l2-f1-c6-bncc-em-foco-q1', 'fis-lic-l2-f1-c6-exercicios-complementares-q36', 'fis-lic-l2-f1-c8-exercicios-complementares-q33']) {
  const igual = JSON.stringify(aMap.get(id)) === JSON.stringify(dMap.get(id));
  console.log('divergencia ' + (igual ? 'intacta ' : 'TOCADA  ') + id);
  if (!igual) fail('divergencia alterada');
}
// gabaritos preservados
let gabOk = 0;
for (const id of Object.keys(alvos)) {
  if (aMap.get(id).answer === dMap.get(id).answer && aMap.get(id).answerKeyText === dMap.get(id).answerKeyText) gabOk++;
  else fail('gabarito alterado: ' + id);
}
console.log('gabaritos preservados:', gabOk + '/' + Object.keys(alvos).length);
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
