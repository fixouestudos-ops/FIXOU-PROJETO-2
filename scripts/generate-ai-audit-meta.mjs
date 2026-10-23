import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const pacote9 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-9-chatgpt.json');
const round2 = readJson('reports/physics-scientific-review/lote-14-revisao-assistida/pacote-round2-10-chatgpt.json');
const meta = {};
const set = (id, campos) => {
  if (!meta[id]) meta[id] = {};
  for (const [k, v] of Object.entries(campos)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && !v.length) continue;
    meta[id][k] = v;
  }
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
const source = '// Gerado por scripts/generate-ai-audit-meta.mjs a partir dos artefatos dos pacotes do ChatGPT (pacote-9-chatgpt.json, pacote-round2-10-chatgpt.json).\nexport const AI_AUDIT_META=' + JSON.stringify(meta) + ';\n';
fs.writeFileSync(path.join(root, 'src', 'ai-audit-meta.js'), source, 'utf8');
const ids = Object.keys(meta);
console.log('AI_AUDIT_META:', ids.length, 'IDs | com bloqueio:', ids.filter(i => meta[i].blockedReason).length, '| com fonte/link:', ids.filter(i => (meta[i].sourceUrls || []).length).length);
