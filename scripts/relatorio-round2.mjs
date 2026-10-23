import fs from 'node:fs';
const PKG2 = 'C:/Users/victo/Downloads/FIXOU_lote14_pendencias10_ChatGPT_2026-10-22.json';
const REL = 'reports/physics-scientific-review/lote-14-revisao-explanations.md';
const pkg2 = JSON.parse(fs.readFileSync(PKG2, 'utf8'));
const rows = pkg2.corrections.map(c =>
  '| `' + c.id.replace('fis-lic-l2-', '') + '` | ' + String(c.answer_expected).replace(/\|/g, '/') + ' | ' + String(c.visual_status).replace(/\|/g, '/') + ' | ' + String(c.source_status).replace(/\|/g, '/') + ' |');
const bloq = pkg2.blocked.map(b => '- `' + b.id.replace('fis-lic-l2-', '') + '` (' + b.status + '): ' + b.reason);
const texto = [
'',
'## Etapa 4 — Pacote round2 (4 resoluções + 6 bloqueios + interface + teste de divergências)',
'',
'**Pacote:** `FIXOU_lote14_pendencias10_ChatGPT_2026-10-22.json` (artefato: `pacote-round2-10-chatgpt.json`). Editor: ChatGPT. Executor: OpenCode. Branch inicial: `6a1d11a`.',
'',
'### 4 correções aplicadas (somente explanation, literal)',
'',
'| ID | Resultado esperado | Alerta de imagem | Situação da fonte |',
'|---|---|---|---|',
...rows,
'',
'- Inserção literal em `content/bank.json` + `after.explanation` em `lote-14-patches.json` + regeneração de `ai-audit-lots.js`. QA: 4/4 texto idêntico ao pacote, somente `explanation`, 3509 restantes byte-idênticas (190 anteriores + 6 bloqueadas + divergências intactas).',
'- Exibição na IA Auditoria: 4/4 visíveis no lote 14 com resolução, meta do pacote, alerta de imagem, link da fonte e status “Aguardando auditoria”; 0 aprovações automáticas.',
'',
'### 6 bloqueios preservados (pendências documentadas na IA Auditoria)',
'',
...bloq,
'',
'- Byte-idênticas ao baseline `dc80695`; sem resoluções novas; seção “Dados do pacote científico” exibe o motivo do bloqueio no painel; nenhuma aprovada ou liberada (todas “Aguardando auditoria”).',
'',
'### Cobertura',
'',
'- 194/200 resoluções aplicadas = 164 (etapa 1) + 17 (etapa 2) + 9 (etapa 3) + 4 (etapa 4); 6 bloqueadas = resto das 36 pendências originais (verificado por conjunto em `qa-round2.mjs`). Cobertura, **não** aprovação científica.',
'',
'### Interface da IA Auditoria (seção 3 — melhoria autorizada)',
'',
'- Novo módulo gerado `src/ai-audit-meta.js` (19 IDs) a partir dos artefatos dos dois pacotes; render em `src/screens-review.js` (seção condicional “Dados do pacote científico”).',
'- Exibidos apenas campos existentes: resultado calculado pelo ChatGPT, classificação da revisão, origem declarada, situação da fonte, links da prova/documento (somente http/https), alerta de imagem obrigatória, pendência de liberação e motivo de bloqueio. Nenhum metadado ausente é exibido; nota do painel registra que são dados do pacote sujeitos a conferência manual e que não configuram aprovação/liberação automática.',
'- Resolução anterior/proposta (diff before/after), gabarito atual, divergências documentadas e aprovação manual já existentes permanecem inalterados; lógica de aprovação intocada.',
'',
'### Divergências no lote 14 (seção 4 — atualização pontual autorizada)',
'',
'- `reports/physics-scientific-review/lote-14-manifest.json`: campo `divergence` preenchido nas 9 questões com divergência documentada no pacote 9 (somente onde era `null`; registros originais preservados). Nenhum gabarito/enunciado alterado.',
'- `src/ai-audit-lots.js` regenerado (derived `divergenceIds` = 9).',
'- `tests/ai-audit-lots-12-13.test.mjs`: teste de divergências **ampliado** (mantidas as verificações de lot12=5 e lot13=0; adicionadas: lista exata das 9 do lote 14, rótulo `divergencia_documentada` via `aiAuditScientificResult` e render do bloco com texto escapado + nota “gabarito não foi alterado”); ajuste pontual em “lista e detalhe…” para escolher um ID não divergente (`ids.find(...)`) mantendo a asserção de rótulo. Nenhuma cobertura removida.',
'',
'### Validações da etapa 4',
'',
'- `scripts/validar-round2.mjs`: 0 pendências (estrutura/IDs/banco/lote14).',
'- `scripts/qa-round2.mjs`: 0 pendências (banco/patches/manifest/lots/meta/render/arquivos).',
'- `validate-bank` ✓ · `npm test` ✓ · `npm run build` ✓ (hash registrado no commit).',
'',
'**Saldo do lote 14:** 194/200 com resolução aplicada; 6 bloqueadas documentadas. Lote **não** declarado cientificamente concluído; aprovação segue 100% manual.',
''
].join('\n');
fs.appendFileSync(REL, texto, 'utf8');
console.log('relatorio atualizado: +', texto.split('\n').length, 'linhas');
