import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = 'C:/Users/victo/Downloads/FIXOU_lote14_auditoria_chatgpt_pacote_9 (1).json';
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const alvos = new Map(pkg.corrections.map(c => [c.id, c]));
const bloqueados = pkg.still_blocked;
const divergencias = pkg.prior_recovered_discrepancies.map(d => d.id);
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
const gitShow = f => execSync('git show HEAD:' + f, { maxBuffer: 1024 * 1024 * 100 }).toString('utf8');
// ============ 1) content/bank.json ============
console.log('=== BANCO (baseline HEAD vs worktree) ===');
const antes = JSON.parse(gitShow('content/bank.json'));
const depois = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json'), 'utf8'));
const aMap = new Map(antes.questions.map(q => [q.id, q]));
const dMap = new Map(depois.questions.map(q => [q.id, q]));
if (antes.questions.length !== 3513 || depois.questions.length !== 3513) fail('contagem != 3513');
console.log('3513/3513:', antes.questions.length === 3513 && depois.questions.length === 3513);
if (JSON.stringify(antes.concepts) !== JSON.stringify(depois.concepts)) fail('conceitos alterados');
if (JSON.stringify({ ...antes, questions: [] }) !== JSON.stringify({ ...depois, questions: [] })) fail('metadados topo alterados');
const alterados = depois.questions.filter(q => JSON.stringify(q) !== JSON.stringify(aMap.get(q.id))).map(q => q.id);
const fora = alterados.filter(i => !alvos.has(i));
console.log('questoes alteradas:', alterados.length, '(esperado 9) | fora da allowlist:', fora.length);
if (alterados.length !== 9) fail('contagem != 9');
if (fora.length) fail('fora allowlist: ' + fora.join(','));
let campoErrado = 0, conteudoErrado = 0;
for (const id of alterados) {
  const a = aMap.get(id), d = dMap.get(id);
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
    if (k === 'explanation') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(d[k])) { console.log('  ' + id + ' campo extra: ' + k); campoErrado++; }
  }
  if (d.explanation !== alvos.get(id).explanation) { console.log('  ' + id + ' texto divergente do pacote'); conteudoErrado++; }
}
console.log('somente explanation:', campoErrado === 0 ? 'OK' : campoErrado + ' erros');
console.log('texto identico ao ChatGPT:', conteudoErrado === 0 ? '9/9' : (9 - conteudoErrado) + '/9');
if (campoErrado) fail('campos extras');
if (conteudoErrado) fail('conteudo divergente');
const naoTocadas = antes.questions.filter(q => JSON.stringify(dMap.get(q.id)) !== JSON.stringify(q));
console.log('demais 3504 byte-identicas:', naoTocadas.length === 9 ? 'OK (181 anteriores + 10 bloqueadas + divergencias preservadas)' : naoTocadas.length + ' alteradas inesperadas');
if (naoTocadas.length !== 9) fail('alteracoes extras no banco');
let bloqOk = 0;
for (const id of bloqueados) if (JSON.stringify(aMap.get(id)) === JSON.stringify(dMap.get(id))) bloqOk++;
console.log('10 still_blocked intactos:', bloqOk + '/10');
if (bloqOk !== 10) fail('still_blocked alterado');
let divOk = 0;
for (const id of divergencias) {
  const a = aMap.get(id), d = dMap.get(id);
  if (a && d && JSON.stringify(a.answer) === JSON.stringify(d.answer) && JSON.stringify(a.options) === JSON.stringify(d.options) && JSON.stringify(a.prompt) === JSON.stringify(d.prompt)) divOk++;
}
console.log('gabaritos/enunciados das 9 divergencias intactos:', divOk + '/9');
if (divOk !== 9) fail('divergencia alterada');
// ============ 2) lote-14-patches.json ============
console.log('\n=== PATCHES IA AUDITORIA (lote-14-patches.json) ===');
const pAntes = JSON.parse(gitShow('reports/physics-scientific-review/lote-14-patches.json'));
const pDepois = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-patches.json'), 'utf8'));
if (pAntes.length !== 200 || pDepois.length !== 200) fail('patches contagem != 200');
let pDiff = 0, pCampo = 0, pTexto = 0, pMeta = 0;
for (let i = 0; i < pAntes.length; i++) {
  const a = pAntes[i], d = pDepois[i];
  if (a.id !== d.id) fail('ordem/id mudou no patches');
  const igual = JSON.stringify(a) === JSON.stringify(d);
  if (igual) continue;
  pDiff++;
  if (!alvos.has(a.id)) { fail('patch alterado fora da allowlist: ' + a.id); continue; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
    if (JSON.stringify(a[k]) !== JSON.stringify(d[k]) && k !== 'after') { pCampo++; console.log('  ' + a.id + ' caminho extra: ' + k); }
  }
  for (const k of new Set([...Object.keys(a.after), ...Object.keys(d.after)])) {
    if (JSON.stringify(a.after[k]) !== JSON.stringify(d.after[k]) && k !== 'explanation') { pCampo++; console.log('  ' + a.id + ' after extra: ' + k); }
  }
  if (d.after.explanation !== alvos.get(a.id).explanation) pTexto++;
  if (JSON.stringify(a.before) !== JSON.stringify(d.before) || a.justification !== d.justification) pMeta++;
}
console.log('patches alterados:', pDiff, '(esperado 9) | campos fora de after.explanation:', pCampo, '| textos corretos:', 9 - pTexto, '| before/justification intactos:', pMeta === 0 ? 'OK' : pMeta + ' erros');
if (pDiff !== 9) fail('patches alterados != 9');
if (pCampo) fail('patches campo extra');
if (pTexto) fail('patches texto');
if (pMeta) fail('patches before/justification');
// ============ 3) src/ai-audit-lots.js (regenerado) ============
console.log('\n=== ai-audit-lots.js (regenerado) ===');
const lAntes = gitShow('src/ai-audit-lots.js');
const lDepois = fs.readFileSync(path.join(ROOT, 'src/ai-audit-lots.js'), 'utf8');
const parseLots = t => JSON.parse(t.slice(t.indexOf('=') + 1).replace(/;\s*$/, ''));
const lo = parseLots(lAntes), ln = parseLots(lDepois);
const mascara = o => { const c = JSON.parse(JSON.stringify(o)); for (const id of alvos.keys()) if (c.lot14.patchById[id]) c.lot14.patchById[id].after.explanation = '<MASCARADO>'; return JSON.stringify(c); };
const identico = mascara(lo) === mascara(ln);
console.log('somente as 9 explanation mudam (lot12/lot13/manifest/ids/status intactos):', identico ? 'OK' : 'DIVERGENCIA');
if (!identico) fail('lots.js com mudancas alem das 9');
const l14n = ln.lot14;
console.log('lot14: ids', l14n.ids.length, '| patches', Object.keys(l14n.patchById).length, '| correctedIds', l14n.correctedIds.length, '| divergenceIds', l14n.divergenceIds.length, '| unchangedIds', l14n.unchangedIds.length);
if (l14n.ids.length !== 200 || Object.keys(l14n.patchById).length !== 200 || l14n.correctedIds.length !== 200 || l14n.divergenceIds.length !== 0 || l14n.unchangedIds.length !== 0) fail('lot14 estrutura divergente');
// ============ 4) artefato do pacote ============
console.log('\n=== ARTEFATO DO PACOTE ===');
const orig = fs.readFileSync(PKG_PATH);
const copia = fs.readFileSync(path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida', 'pacote-9-chatgpt.json'));
console.log('copia byte-identica:', orig.equals(copia) ? 'OK' : 'DIVERGENTE');
if (!orig.equals(copia)) fail('artefato');
// ============ 5) render IA Auditoria ============
console.log('\n=== EXIBICAO NA ABA IA AUDITORIA ===');
const { reviewScreen, aiAuditCompare, aiAuditStatus } = await import(pathToFileURL(path.join(ROOT, 'src', 'screens-review.js')).href);
const bank = depois;
function render(id) {
  return reviewScreen({ bank, reviewFilter: 'ai_audit', reviewSearch: id, reviewIndex: 0, editingQuestion: null, editingFields: {}, reviewAiFilter: 'all', reviewAiLotFilter: 'lot14' });
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
let vis = 0, statusOk = 0, diffOk = 0, semAuto = 0;
for (const [id, c] of alvos) {
  const html = render(id);
  const mostra = html.includes(esc(c.explanation)) || html.includes(esc(c.explanation.slice(0, 120)));
  const q = dMap.get(id);
  const st = aiAuditStatus(q);
  const cmp = aiAuditCompare(q, 'lot14');
  const mudouExp = cmp.available && cmp.changed && cmp.changed.explanation === true;
  const semAprov = st === 'awaiting' && !html.includes('Aprovada pelo Owner');
  if (mostra && html.includes('Lote 14')) vis++;
  if (html.includes('Aguardando auditoria')) statusOk++;
  if (mudouExp) diffOk++;
  if (semAprov) semAuto++;
  if (!mostra) console.log('  nao exibida: ' + id);
  if (!mudouExp) console.log('  diff explanation nao marcado: ' + id);
}
console.log('9 visiveis no lote 14 com texto ChatGPT:', vis + '/9');
console.log('diff before/after de explanation marcado:', diffOk + '/9');
console.log('status aguardando auditoria:', statusOk + '/9');
console.log('sem aprovacao automatica:', semAuto + '/9');
if (vis !== 9) fail('exibicao');
if (diffOk !== 9) fail('diff');
if (statusOk < 9) fail('status');
if (semAuto !== 9) fail('auto-aprovacao');
// 10 bloqueados continuam na fila
let filaBloq = 0;
for (const id of bloqueados) {
  const html = render(id);
  if (html.includes('Lote 14') && html.includes('Aguardando auditoria')) filaBloq++;
}
console.log('10 bloqueados preservados na fila lote14:', filaBloq + '/10');
if (filaBloq !== 10) fail('bloqueados');
// ============ 6) arquivos alterados ============
console.log('\n=== ARQUIVOS ALTERADOS (git status) ===');
const st = execSync('git status --porcelain', { cwd: ROOT }).toString('utf8').split(/\r?\n/).filter(Boolean);
const esperadosMod = ['content/bank.json', 'src/ai-audit-lots.js', 'reports/physics-scientific-review/lote-14-patches.json'];
const novosEsperados = ['reports/physics-scientific-review/lote-14-revisao-assistida/pacote-9-chatgpt.json', 'scripts/validar-pacote9.mjs', 'scripts/aplicar-pacote9.mjs', 'scripts/qa-pacote9.mjs'];
let rastro = 0;
for (const linha of st) {
  const cod = linha.slice(0, 2), arq = linha.slice(3);
  const ehNovo = cod.includes('?');
  if (ehNovo) {
    if (novosEsperados.includes(arq)) rastro++;
    else console.log('  untracked legado (nao commitar): ' + arq);
  } else {
    if (!esperadosMod.includes(arq)) { console.log('  MODIFICADO inesperado: ' + linha); fail('arquivo rastreado alterado fora do esperado: ' + arq); }
  }
}
console.log('novos artefatos presentes:', rastro + '/' + novosEsperados.length, '| modificados rastreados:', esperadosMod.filter(f => st.some(l => l.slice(3) === f && !l.slice(0, 2).includes('?'))).length + '/' + esperadosMod.length);
if (rastro !== novosEsperados.length) fail('artefatos novos ausentes');
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
process.exit(fails ? 1 : 0);
