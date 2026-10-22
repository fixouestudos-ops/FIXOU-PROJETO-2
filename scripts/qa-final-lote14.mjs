import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const DEST = path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida');
const antes = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json.pre-lote14-exp'), 'utf8'));
const depois = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json'), 'utf8'));
const records = JSON.parse(fs.readFileSync(path.join(DEST, 'manifest-full.json'), 'utf8'));
const JA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'lote14-explicacoes.json'), 'utf8'));
const EXP135 = JSON.parse(fs.readFileSync(path.join(DEST, 'aplicacao-135.json'), 'utf8'));
const INDIV = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'lote14-resolucoes-individuais.json'), 'utf8'));
const alvos = { ...JA };
for (const r of records) if (!r.already_applied && r.proposed_explanation) alvos[r.id] = r.proposed_explanation;
Object.assign(alvos, INDIV);
console.log('alvos totais (22+135+7):', Object.keys(alvos).length);
const aMap = new Map(antes.questions.map(q => [q.id, q]));
const dMap = new Map(depois.questions.map(q => [q.id, q]));
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
console.log('=== ESTRUTURA ===');
if (depois.questions.length !== 3513 || antes.questions.length !== 3513) fail('contagem');
console.log('3513/3513 ok:', depois.questions.length === 3513);
console.log('conceitos intactos:', JSON.stringify(antes.concepts) === JSON.stringify(depois.concepts));
console.log('metadados topo intactos:', JSON.stringify({ ...antes, questions: [] }) === JSON.stringify({ ...depois, questions: [] }));
const alterados = depois.questions.filter(q => JSON.stringify(q) !== JSON.stringify(aMap.get(q.id))).map(q => q.id);
const fora = alterados.filter(i => !alvos[i]);
console.log('questoes alteradas vs baseline:', alterados.length, '(esperado 164) | fora do escopo:', fora.length);
if (alterados.length !== 164) fail('contagem alteradas != 164');
if (fora.length) fail('fora do escopo: ' + fora.slice(0, 3).join(','));
console.log('\n=== SOMENTE explanation ===');
let campoErrado = 0;
for (const id of alterados) {
  const a = aMap.get(id), d = dMap.get(id);
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
    if (k === 'explanation') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(d[k])) { console.log('  ' + id + ' campo: ' + k); campoErrado++; }
  }
}
console.log('  campos extra alterados:', campoErrado);
if (campoErrado) fail('campo extra');
console.log('\n=== CONTEUDO DOS 164 ===');
let probsExp = 0;
for (const [id, esperado] of Object.entries(alvos)) {
  const q = dMap.get(id);
  const probs = [];
  if (q.explanation !== esperado) probs.push('divergente');
  if (q.explanation.includes('**')) probs.push('markdown');
  if (/Converta primeiro|coincide com o gabarito/.test(q.explanation)) probs.push('generico');
  if (probs.length) { console.log('  FALHA ' + id + ': ' + probs.join(',')); probsExp++; }
}
console.log('  conferidas:', Object.keys(alvos).length - probsExp + '/' + Object.keys(alvos).length);
if (probsExp) fail('conteudo');
console.log('\n=== PENDENTES (36 nao tocados) ===');
const pendentes = records.filter(r => !alvos[r.id]).map(r => r.id);
let pendIntactos = 0;
for (const id of pendentes) {
  if (JSON.stringify(aMap.get(id)) === JSON.stringify(dMap.get(id))) pendIntactos++;
  else fail('pendente alterado: ' + id);
}
console.log('  pendentes intactos:', pendIntactos + '/' + pendentes.length);
console.log('\n=== DIVERGENCIAS REGISTRADAS ===');
for (const id of ['fis-lic-l2-f1-c6-bncc-em-foco-q1', 'fis-lic-l2-f1-c6-exercicios-complementares-q36', 'fis-lic-l2-f1-c8-exercicios-complementares-q33']) {
  const intacta = JSON.stringify(aMap.get(id)) === JSON.stringify(dMap.get(id));
  console.log('  ' + (intacta ? 'intacta' : 'TOCADA') + ' ' + id);
  if (!intacta) fail('divergencia alterada');
}
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
