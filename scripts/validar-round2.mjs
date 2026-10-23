import fs from 'node:fs';
const PKG_PATH = 'C:/Users/victo/Downloads/FIXOU_lote14_pendencias10_ChatGPT_2026-10-22.json';
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
console.log('=== ESTRUTURA ROUND2 ===');
console.log('project:', pkg.project, '| lot:', pkg.lot, '| version:', pkg.version, '| git_ref:', pkg.git_ref);
if (pkg.project !== 'FIXOU' || pkg.lot !== 14) fail('project/lot');
if (pkg.git_ref !== 'review/ia-auditoria-explanations-only') fail('git_ref');
if (pkg.count_total !== 10 || pkg.count_explanation_proposals !== 4 || pkg.count_blocked !== 6) fail('contagens declaradas');
if (!Array.isArray(pkg.corrections) || pkg.corrections.length !== 4) fail('corrections != 4');
if (!Array.isArray(pkg.blocked) || pkg.blocked.length !== 6) fail('blocked != 6');
console.log('corrections:', pkg.corrections.length, '| blocked:', pkg.blocked.length);
console.log('\n=== CAMPOS DAS 4 CORRECOES ===');
const esperados = ['fis-lic-l2-f1-c6-exercicios-complementares-q17', 'fis-lic-l2-f1-c6-exercicios-propostos-q3', 'fis-lic-l2-f1-c8-exercicios-complementares-q33', 'fis-lic-l2-f2-c7-exercicios-complementares-q23'];
for (const c of pkg.corrections) {
  const f = [];
  if (!c.id) f.push('id');
  if (!c.explanation || c.explanation.length < 50) f.push('explanation');
  if (c.answer_expected === undefined) f.push('answer_expected');
  if (c.source_status === undefined) f.push('source_status');
  if (c.visual_status === undefined) f.push('visual_status');
  if (!Array.isArray(c.source_urls)) f.push('source_urls');
  if (!c.decision) f.push('decision');
  if (f.length) fail(c.id + ' campos: ' + f.join(','));
}
const ids = pkg.corrections.map(c => c.id);
console.log('ids corretos (match exato):', esperados.every(e => ids.includes(e)) && ids.every(i => esperados.includes(i)) ? '4/4' : 'DIVERGENTE');
if (!esperados.every(e => ids.includes(e)) || !ids.every(i => esperados.includes(i))) fail('ids');
console.log('\n=== BANCO E LOTE 14 ===');
const bank = JSON.parse(fs.readFileSync('content/bank.json', 'utf8'));
const bMap = new Map(bank.questions.map(q => [q.id, q]));
const { AI_AUDIT_LOTS } = await import('../src/ai-audit-lots.js');
const l14 = AI_AUDIT_LOTS.lot14.ids;
for (const id of ids) {
  if (!bMap.has(id)) fail('ausente no banco: ' + id);
  if (!l14.includes(id)) fail('ausente no lote14: ' + id);
}
console.log('4 correcoes no banco + lote14:', ids.filter(i => bMap.has(i) && l14.includes(i)).length + '/4');
console.log('\n=== 6 BLOQUEADOS ===');
for (const b of pkg.blocked) {
  const f = [];
  if (!b.id) f.push('id');
  if (!b.reason || b.reason.length < 20) f.push('reason');
  if (!b.status) f.push('status');
  if (!bMap.has(b.id)) f.push('fora do banco');
  if (!l14.includes(b.id)) f.push('fora do lote14');
  if (ids.includes(b.id)) f.push('tambem em corrections');
  if (f.length) fail(b.id + ': ' + f.join(','));
}
console.log('6 bloqueados completos, no banco+lote14, sem sobreposicao:', pkg.blocked.filter(b => b.reason && b.status && bMap.has(b.id) && l14.includes(b.id) && !ids.includes(b.id)).length + '/6');
console.log('\n=== CONSTRAINTS ===');
console.log('modify_fields_if_needed:', JSON.stringify(pkg.constraints.modify_fields_if_needed));
console.log('no_auto_approve:', pkg.constraints.no_auto_approve, '| no_merge:', pkg.constraints.no_merge, '| no_deploy:', pkg.constraints.no_deploy);
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
process.exit(fails ? 1 : 0);
