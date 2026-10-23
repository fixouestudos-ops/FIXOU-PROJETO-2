import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG2 = 'C:/Users/victo/Downloads/FIXOU_lote14_pendencias10_ChatGPT_2026-10-22.json';
const pkg2 = JSON.parse(fs.readFileSync(PKG2, 'utf8'));
const pkg1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida', 'pacote-9-chatgpt.json'), 'utf8'));
const alvos = new Map(pkg2.corrections.map(c => [c.id, c]));
const bloqueados = pkg2.blocked.map(b => b.id);
let fails = 0;
const fail = m => { fails++; console.log('  FALHA: ' + m); };
const gitShow = (f, ref = 'HEAD') => execSync('git show ' + ref + ':' + f, { maxBuffer: 1024 * 1024 * 100 }).toString('utf8');
// ===== 1) BANCO =====
console.log('=== BANCO (HEAD 6a1d11a vs worktree) ===');
const antes = JSON.parse(gitShow('content/bank.json'));
const depois = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'bank.json'), 'utf8'));
const aMap = new Map(antes.questions.map(q => [q.id, q]));
const dMap = new Map(depois.questions.map(q => [q.id, q]));
if (antes.questions.length !== 3513 || depois.questions.length !== 3513) fail('contagem != 3513');
console.log('3513/3513:', antes.questions.length === 3513 && depois.questions.length === 3513);
if (JSON.stringify(antes.concepts) !== JSON.stringify(depois.concepts)) fail('conceitos');
if (JSON.stringify({ ...antes, questions: [] }) !== JSON.stringify({ ...depois, questions: [] })) fail('metadados topo');
const alterados = depois.questions.filter(q => JSON.stringify(q) !== JSON.stringify(aMap.get(q.id))).map(q => q.id);
const fora = alterados.filter(i => !alvos.has(i));
console.log('alteradas:', alterados.length, '(esperado 4) | fora da allowlist:', fora.length);
if (alterados.length !== 4) fail('contagem != 4');
if (fora.length) fail('fora allowlist: ' + fora.join(','));
let campo = 0, texto = 0;
for (const id of alterados) {
  const a = aMap.get(id), d = dMap.get(id);
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) {
    if (k === 'explanation') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(d[k])) { console.log('  ' + id + ' campo extra: ' + k); campo++; }
  }
  if (d.explanation !== alvos.get(id).explanation) { console.log('  ' + id + ' texto divergente'); texto++; }
}
console.log('somente explanation:', campo === 0 ? 'OK' : campo + ' erros', '| texto identico ChatGPT:', (4 - texto) + '/4');
if (campo) fail('campo extra');
if (texto) fail('texto');
const intactas = antes.questions.filter(q => JSON.stringify(dMap.get(q.id)) !== JSON.stringify(q));
console.log('demais 3509 byte-identicas (190 anteriores + 6 bloqueadas + divergencias):', intactas.length === 4 ? 'OK' : intactas.length + ' mudancas extras');
if (intactas.length !== 4) fail('alteracoes extras');
// ===== 2) COBERTURA 194/200 =====
console.log('\n=== COBERTURA (conjunto das 36 pendencias originais) ===');
const pend = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-revisao-assistida', 'pending-source.json'), 'utf8'));
const R = (Array.isArray(pend) ? pend : (pend.entries || pend.pending || pend.items || Object.values(pend))).map(e => e.id || e);
const bloqueadosSet = new Set(bloqueados);
const naoBloq = R.filter(id => !bloqueadosSet.has(id));
console.log('pendencias originais:', R.length, '| bloqueadas:', bloqueados.filter(id => R.includes(id)).length + '/6', '| resolvidas:', naoBloq.length, '(esperado 30)');
if (R.length !== 36) fail('R != 36');
if (bloqueados.filter(id => R.includes(id)).length !== 6) fail('bloqueadas fora de R');
if (naoBloq.length !== 30) fail('resolvidas != 30');
const etapa2 = pkg1 ? 17 : 0, etapa3 = 9, etapa4 = 4;
console.log('aritmetica: 164 (etapa1 @dc80695) +', etapa2 + '+' + etapa3 + '+' + etapa4, '=', 164 + etapa2 + etapa3 + etapa4, '=> 194/200 (6 bloqueadas)');
if (164 + etapa2 + etapa3 + etapa4 !== 194) fail('aritmetica 194');
// baseline do dc80695: as 30 resolvidas mudaram; as 6 bloqueadas nao mudaram desde entao
const base = JSON.parse(gitShow('content/bank.json', 'dc80695'));
const bMap = new Map(base.questions.map(q => [q.id, q]));
let resOk = 0, bloqOk2 = 0;
for (const id of naoBloq) if (dMap.get(id).explanation !== bMap.get(id).explanation) resOk++;
for (const id of bloqueados) if (JSON.stringify(dMap.get(id)) === JSON.stringify(bMap.get(id))) bloqOk2++;
console.log('30 resolvidas com explanation != baseline dc80695:', resOk + '/30');
console.log('6 bloqueadas identicas ao baseline dc80695:', bloqOk2 + '/6');
if (resOk !== 30) fail('resolvidas');
if (bloqOk2 !== 6) fail('bloqueadas alteradas');
// ===== 3) PATCHES =====
console.log('\n=== PATCHES ===');
const pA = JSON.parse(gitShow('reports/physics-scientific-review/lote-14-patches.json'));
const pD = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-patches.json'), 'utf8'));
let pDiff = 0, pCampo = 0, pTexto = 0;
for (let i = 0; i < pA.length; i++) {
  const a = pA[i], d = pD[i];
  if (JSON.stringify(a) === JSON.stringify(d)) continue;
  pDiff++;
  if (!alvos.has(a.id)) { fail('patch fora allowlist: ' + a.id); continue; }
  for (const k of new Set([...Object.keys(a.after), ...Object.keys(d.after)])) if (JSON.stringify(a.after[k]) !== JSON.stringify(d.after[k]) && k !== 'explanation') pCampo++;
  if (JSON.stringify(a.before) !== JSON.stringify(d.before) || a.justification !== d.justification) pCampo++;
  if (d.after.explanation !== alvos.get(a.id).explanation) pTexto++;
}
console.log('patches alterados:', pDiff, '(esperado 4) | campos extras:', pCampo, '| textos:', (4 - pTexto) + '/4');
if (pDiff !== 4 || pCampo || pTexto) fail('patches');
// ===== 4) MANIFEST (divergencias) =====
console.log('\n=== MANIFEST (divergencias documentadas) ===');
const mAntes = JSON.parse(gitShow('reports/physics-scientific-review/lote-14-manifest.json'));
const mDepois = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'physics-scientific-review', 'lote-14-manifest.json'), 'utf8'));
const divEsperadas = new Map(pkg1.prior_recovered_discrepancies.map(d => [d.id, d.issue]));
let mDiff = 0, mCampo = 0, mTexto = 0;
for (let i = 0; i < mAntes.length; i++) {
  const a = mAntes[i], d = mDepois[i];
  if (JSON.stringify(a) === JSON.stringify(d)) continue;
  mDiff++;
  if (a.id !== d.id) { fail('manifest ordem'); continue; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(d)])) if (JSON.stringify(a[k]) !== JSON.stringify(d[k]) && k !== 'divergence') { mCampo++; console.log('  ' + a.id + ' campo extra: ' + k); }
  if (!divEsperadas.has(a.id) || a.divergence !== null) { mTexto++; console.log('  ' + a.id + ' divergence inesperada/previa: ' + JSON.stringify(a.divergence).slice(0, 60)); }
  if (d.divergence !== divEsperadas.get(a.id)) { mTexto++; console.log('  ' + a.id + ' texto divergente'); }
}
const divCount = mDepois.filter(e => e.divergence).length;
console.log('manifest alterados:', mDiff, '(esperado 9) | campos extras:', mCampo, '| textos corretos:', (9 - mTexto) + '/9 | divergence total:', divCount);
if (mDiff !== 9 || mCampo || mTexto || divCount !== 9) fail('manifest');
// ===== 5) ai-audit-lots.js =====
console.log('\n=== ai-audit-lots.js ===');
const parseLots = t => JSON.parse(t.slice(t.indexOf('=') + 1).replace(/;\s*$/, ''));
const lo = parseLots(gitShow('src/ai-audit-lots.js'));
const ln = parseLots(fs.readFileSync(path.join(ROOT, 'src/ai-audit-lots.js'), 'utf8'));
const mascara = o => {
  const c = JSON.parse(JSON.stringify(o));
  for (const id of alvos.keys()) if (c.lot14.patchById[id]) c.lot14.patchById[id].after.explanation = '<M>';
  for (const id of divEsperadas.keys()) if (c.lot14.manifestById[id]) c.lot14.manifestById[id].divergence = '<M>';
  c.lot14.divergenceIds = Object.entries(c.lot14.manifestById).filter(([, m]) => m.divergence).map(([id]) => id).sort();
  return JSON.stringify(c);
};
const lotsOk = mascara(lo) === mascara(ln);
console.log('somente as 4 explanations + 9 divergences + divergenceIds mudam:', lotsOk ? 'OK' : 'DIVERGENCIA');
if (!lotsOk) fail('lots.js');
console.log('lot14: ids', ln.lot14.ids.length, '| patches', Object.keys(ln.lot14.patchById).length, '| correctedIds', ln.lot14.correctedIds.length, '| divergenceIds', ln.lot14.divergenceIds.length);
if (ln.lot14.ids.length !== 200 || Object.keys(ln.lot14.patchById).length !== 200 || ln.lot14.correctedIds.length !== 200 || ln.lot14.divergenceIds.length !== 9) fail('lot14 estrutura');
// ===== 6) ai-audit-meta.js =====
console.log('\n=== ai-audit-meta.js ===');
const { AI_AUDIT_META } = await import(pathToFileURL(path.join(ROOT, 'src', 'ai-audit-meta.js')).href);
const metaIds = Object.keys(AI_AUDIT_META);
const esperadosMeta = [...alvos.keys(), ...bloqueados, ...pkg1.corrections.map(c => c.id)];
const faltaMeta = esperadosMeta.filter(id => !AI_AUDIT_META[id]);
const extraMeta = metaIds.filter(id => !esperadosMeta.includes(id));
console.log('IDs com meta:', metaIds.length, '(esperado 19) | faltando:', faltaMeta.length, '| extras:', extraMeta.length);
if (metaIds.length !== 19 || faltaMeta.length || extraMeta.length) fail('meta ids');
let metaCampos = 0;
for (const c of pkg2.corrections) {
  const m = AI_AUDIT_META[c.id];
  if (m.answerExpected !== c.answer_expected) { fail(c.id + ' answerExpected'); metaCampos++; }
  if (m.sourceStatus !== c.source_status) { fail(c.id + ' sourceStatus'); metaCampos++; }
  if (m.visualStatus !== c.visual_status) { fail(c.id + ' visualStatus'); metaCampos++; }
  if (JSON.stringify(m.sourceUrls) !== JSON.stringify(c.source_urls.filter(u => /^https?:\/\//.test(u)))) { fail(c.id + ' sourceUrls'); metaCampos++; }
}
for (const b of pkg2.blocked) {
  const m = AI_AUDIT_META[b.id];
  if (m.blockedReason !== b.reason || m.blockedStatus !== b.status) { fail(b.id + ' blocked'); metaCampos++; }
}
console.log('meta conteudo batendo com os pacotes:', metaCampos === 0 ? 'OK' : metaCampos + ' erros');
if (metaCampos) fail('meta conteudo');
// ===== 7) RENDER IA AUDITORIA =====
console.log('\n=== RENDER IA AUDITORIA ===');
const { reviewScreen, aiAuditStatus } = await import(pathToFileURL(path.join(ROOT, 'src', 'screens-review.js')).href);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function render(id) {
  return reviewScreen({ bank: depois, reviewFilter: 'ai_audit', reviewSearch: id, reviewIndex: 0, editingQuestion: null, editingFields: {}, reviewAiFilter: 'all', reviewAiLotFilter: 'lot14' });
}
let vExp = 0, vMeta = 0, vStatus = 0, vSemAprov = 0, vAlerta = 0, vLink = 0;
for (const c of pkg2.corrections) {
  const html = render(c.id);
  const q = dMap.get(c.id);
  if (html.includes(esc(c.explanation.slice(0, 120)))) vExp++;
  if (html.includes('Dados do pacote científico') && html.includes(esc(c.answer_expected))) vMeta++;
  if (html.includes('Aguardando auditoria')) vStatus++;
  if (aiAuditStatus(q) === 'awaiting' && !html.includes('Aprovada pelo Owner')) vSemAprov++;
  if (html.includes('Alerta de imagem obrigatória') && html.includes(esc(c.visual_status.slice(0, 80)))) vAlerta++;
  if (c.source_urls.some(u => html.includes(esc(u)))) vLink++;
}
console.log('4 novas: explicacao visivel', vExp + '/4 | meta com resultado', vMeta + '/4 | aguardando', vStatus + '/4 | sem auto-aprov', vSemAprov + '/4 | alerta imagem', vAlerta + '/4 | link fonte', vLink + '/4');
if (vExp !== 4 || vMeta !== 4 || vStatus !== 4 || vSemAprov !== 4 || vAlerta !== 4 || vLink !== 4) fail('render novas 4');
let bMeta = 0, bStatus = 0, bSemAprov = 0;
for (const b of pkg2.blocked) {
  const html = render(b.id);
  if (html.includes('Questão bloqueada — pendência documentada') && html.includes(esc(b.reason.slice(0, 80)))) bMeta++;
  if (html.includes('Aguardando auditoria')) bStatus++;
  if (aiAuditStatus(dMap.get(b.id)) === 'awaiting' && !html.includes('Aprovada pelo Owner')) bSemAprov++;
}
console.log('6 bloqueadas: pendencia documentada', bMeta + '/6 | aguardando', bStatus + '/6 | sem auto-aprov', bSemAprov + '/6');
if (bMeta !== 6 || bStatus !== 6 || bSemAprov !== 6) fail('render bloqueadas');
let dHtml = 0;
for (const id of divEsperadas.keys()) {
  const html = render(id);
  if (html.includes('Divergência documentada') && html.includes(esc(divEsperadas.get(id)))) dHtml++;
}
console.log('9 divergencias exibidas no painel:', dHtml + '/9');
if (dHtml !== 9) fail('render divergencias');
const candidato = ln.lot14.ids.find(id => !AI_AUDIT_META[id] && !divEsperadas.has(id));
const semMeta = !render(candidato).includes('Dados do pacote científico');
console.log('questao sem metadados nao exibe secao falsa:', semMeta ? 'OK' : 'EXPOSED');
if (!semMeta) fail('meta falsa');
// ===== 8) ARQUIVOS =====
console.log('\n=== ARQUIVOS ALTERADOS ===');
const st = execSync('git status --porcelain', { cwd: ROOT }).toString('utf8').split(/\r?\n/).filter(Boolean);
const esperadosMod = ['content/bank.json', 'src/ai-audit-lots.js', 'src/screens-review.js', 'reports/physics-scientific-review/lote-14-patches.json', 'reports/physics-scientific-review/lote-14-manifest.json', 'tests/ai-audit-lots-12-13.test.mjs', 'scripts/build.mjs', 'src/catalog.js', 'dist/index.html', 'dist/server/index.js', 'reports/physics-scientific-review/lote-14-revisao-explanations.md'];
const novosEsperados = ['src/ai-audit-meta.js', 'reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round2-10-chatgpt.json', 'scripts/validar-round2.mjs', 'scripts/aplicar-round2.mjs', 'scripts/generate-ai-audit-meta.mjs', 'scripts/qa-round2.mjs', 'scripts/relatorio-round2.mjs', 'dist/assets/app.b40c7cc2.js'];
let mods = 0, novos = 0;
for (const linha of st) {
  const cod = linha.slice(0, 2), arq = linha.slice(3);
  if (cod.includes('?')) { if (novosEsperados.includes(arq)) novos++; }
  else if (esperadosMod.includes(arq)) mods++;
  else { console.log('  MODIFICADO inesperado: ' + linha); fail('arquivo: ' + arq); }
}
console.log('modificados esperados:', mods + '/' + esperadosMod.length, '| novos esperados:', novos + '/' + novosEsperados.length);
if (mods !== esperadosMod.length) fail('modificados');
if (novos !== novosEsperados.length) fail('novos');
console.log('\n=== RESULTADO: ' + (fails ? fails + ' pendencia(s)' : '0 pendencias') + ' ===');
process.exit(fails ? 1 : 0);
