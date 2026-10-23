import fs from 'node:fs';
import { execSync } from 'node:child_process';
const PKG_PATH = 'C:/Users/victo/Downloads/FIXOU_lote14_auditoria_chatgpt_pacote_9 (1).json';
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
console.log('=== ESTRUTURA DO PACOTE ===');
console.log('schemaVersion:', pkg.schemaVersion, '| project:', pkg.project, '| lot:', pkg.lot, '| branch:', pkg.branch);
if (pkg.schemaVersion !== 1) fail('schemaVersion');
if (pkg.project !== 'FIXOU' || pkg.lot !== 14) fail('project/lot');
if (pkg.branch !== 'review/ia-auditoria-explanations-only') fail('branch');
if (!Array.isArray(pkg.corrections) || pkg.corrections.length !== 9) fail('corrections != 9');
if (!Array.isArray(pkg.still_blocked) || pkg.still_blocked.length !== 10) fail('still_blocked != 10');
if (!Array.isArray(pkg.prior_recovered_discrepancies) || pkg.prior_recovered_discrepancies.length !== 9) fail('discrepancies != 9');
console.log('corrections:', pkg.corrections.length, '| still_blocked:', pkg.still_blocked.length, '| discrepancies:', pkg.prior_recovered_discrepancies.length);
console.log('\n=== CAMPOS DE CADA CORRECAO ===');
const ids = pkg.corrections.map(c => c.id);
if (new Set(ids).size !== 9) fail('IDs duplicados');
for (const c of pkg.corrections) {
  const campos = [];
  if (!c.id) campos.push('id');
  if (!c.explanation || c.explanation.length < 50) campos.push('explanation');
  if (c.answer_expected === undefined) campos.push('answer_expected');
  if (!c.review_status) campos.push('review_status');
  if (c.origin === undefined) campos.push('origin');
  if (c.source_url === undefined) campos.push('source_url');
  if (c.pending_before_student_release === undefined) campos.push('pending');
  if (campos.length) fail(c.id + ' campos ausentes: ' + campos.join(','));
}
console.log('  9/9 com todos os campos' + (fails ? '' : ' OK'));
console.log('\n=== PRESENCIA NO BANCO E NO LOTE 14 ===');
const bank = JSON.parse(fs.readFileSync('content/bank.json', 'utf8'));
const bMap = new Map(bank.questions.map(q => [q.id, q]));
const lotsSrc = fs.readFileSync('src/ai-audit-lots.js', 'utf8');
const inLot14 = id => lotsSrc.includes('"' + id + "'");
for (const id of ids) {
  if (!bMap.has(id)) fail('ausente no banco: ' + id);
  if (!inLot14(id)) fail('ausente no lote 14 (ai-audit-lots): ' + id);
}
for (const id of pkg.still_blocked) {
  if (!bMap.has(id)) fail('still_blocked ausente no banco: ' + id);
  if (ids.includes(id)) fail('ID em corrections E still_blocked: ' + id);
}
console.log('  9 correcoes no banco+lote14: ' + ids.filter(i => bMap.has(i) && inLot14(i)).length + '/9');
console.log('  10 still_blocked no banco, sem sobreposicao: ' + pkg.still_blocked.filter(i => bMap.has(i) && !ids.includes(i)).length + '/10');
// discrepancias pertencem ao lote?
console.log('\n=== DIVERGENCIAS (APENAS REGISTRO) ===');
for (const d of pkg.prior_recovered_discrepancies) {
  if (!bMap.has(d.id)) fail('discrepancy id ausente no banco: ' + d.id);
}
console.log('  9/9 ids de divergencia existem no banco; nenhum campo sera alterado por elas');
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
