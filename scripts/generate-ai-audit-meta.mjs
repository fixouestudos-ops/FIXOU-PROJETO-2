import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const pacote9 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-9-chatgpt.json');
const round2 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round2-10-chatgpt.json');
const round5 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round5-29-chatgpt.json');
const round6 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round6-26-chatgpt.json');
const round7 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round7-19-chatgpt.json');
const meta = {};
const set = (id, campos) => {
  if (!meta[id]) meta[id] = {};
  for (const [k, v] of Object.entries(campos)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && !v.length) continue;
    meta[id][k] = v;
  }
};
const addPendingRelease = (id, reason) => {
  if (!reason) return;
  const entry = meta[id] || (meta[id] = {});
  const additional = Array.isArray(entry.additionalPendingReleases) ? entry.additionalPendingReleases : [];
  const existing = [entry.pendingRelease, entry.additionalPendingRelease, ...additional].filter(Boolean);
  if (existing.includes(reason)) return;
  if (!entry.pendingRelease) entry.pendingRelease = reason;
  else if (!entry.additionalPendingRelease) entry.additionalPendingRelease = reason;
  else entry.additionalPendingReleases = [...additional, reason];
};
// Pacote 1 (9 correcoes): metadados exibidos no painel
for (const c of pacote9.corrections) {
  set(c.id, {
    answerExpected: c.answer_expected,
    reviewStatus: c.review_status,
    origin: c.origin,
    sourceUrls: [c.source_url].filter(u => typeof u === 'string' && /^https?:\/\//.test(u)),
    pendingRelease: c.pending_before_student_release
  });
}
// Pacote 2 (4 correcoes round2)
for (const c of round2.corrections) {
  set(c.id, {
    answerExpected: c.answer_expected,
    sourceStatus: c.source_status,
    visualStatus: c.visual_status,
    sourceUrls: Array.isArray(c.source_urls) ? c.source_urls.filter(u => typeof u === 'string' && /^https?:\/\//.test(u)) : [],
    decision: c.decision
  });
}
// Pacote 2 (6 bloqueados): pendencias documentadas
for (const b of round2.blocked) {
  set(b.id, {
    blockedReason: b.reason,
    blockedStatus: b.status,
    decision: round2.decision
  });
}
// Round 5: alertas de OCR/fonte fornecidos pelo ChatGPT, sem alterar o banco.
for (const [id, correction] of Object.entries(round5.corrections)) {
  set(id, { pendingRelease: correction.pending_source_or_ocr_review });
}
// Dois registros adicionais dependem de conferência da fonte e permanecem sem mudança de conteúdo.
for (const pending of round5.blocked_or_unresolved_examples || []) {
  set(pending.id, { pendingRelease: pending.reason });
}
// Round 6: quatro registros não autorizados permanecem sem mudança e com alerta visível.
for (const pending of round6.not_authorized_to_change || []) {
  addPendingRelease(pending.id, pending.reason);
}
// Round 7: novas pendências documentais/científicas, sem alteração dos cinco registros.
for (const pending of round7.not_authorized_to_change || []) {
  addPendingRelease(pending.id, pending.reason);
}
const source = '// Gerado por scripts/generate-ai-audit-meta.mjs a partir dos artefatos dos pacotes do ChatGPT (pacote-9-chatgpt.json, pacote-round2-10-chatgpt.json, pacote-round5-29-chatgpt.json, pacote-round6-26-chatgpt.json, pacote-round7-19-chatgpt.json).\nexport const AI_AUDIT_META=' + JSON.stringify(meta) + ';\n';
fs.writeFileSync(path.join(root, 'src', 'ai-audit-meta.js'), source, 'utf8');
const ids = Object.keys(meta);
console.log('AI_AUDIT_META:', ids.length, 'IDs | com bloqueio:', ids.filter(i => meta[i].blockedReason).length, '| com fonte/link:', ids.filter(i => (meta[i].sourceUrls || []).length).length);
