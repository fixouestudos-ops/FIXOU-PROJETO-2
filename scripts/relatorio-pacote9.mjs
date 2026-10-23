import fs from 'node:fs';
const PKG = 'C:/Users/victo/Downloads/FIXOU_lote14_auditoria_chatgpt_pacote_9 (1).json';
const REL = 'reports/physics-scientific-review/lote-14-revisao-explanations.md';
const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
const rows = pkg.corrections.map(c =>
  '| `' + c.id.replace('fis-lic-l2-', '') + '` | ' + String(c.answer_expected).replace(/\|/g, '/') + ' | ' + c.review_status + ' | ' + String(c.origin || '').replace(/\|/g, '/') + ' | ' + (c.source_url ? '[fonte](' + c.source_url + ')' : '—') + ' |');
const texto = [
'',
'## Etapa 3 — Pacote 9 do ChatGPT (execução literal)',
'',
'**Pacote:** `FIXOU_lote14_auditoria_chatgpt_pacote_9.json` (cópia integral: `pacote-9-chatgpt.json`, mesmo diretório deste relatório). Editor: ChatGPT Victor Elias. Executor: OpenCode (sem autoria científica). Branch inicial: `18979b5`.',
'',
'### 9 correções aplicadas (somente campo explanation)',
'',
'| ID | Resultado esperado | review_status | Origem declarada | Fonte |',
'|---|---|---|---|---|',
...rows,
'',
'- **Inserção literal:** texto de `explanation` copiado byte a byte do pacote para `content/bank.json` (9 IDs) e para `after.explanation` de `reports/physics-scientific-review/lote-14-patches.json` (fonte do diff exibido no painel); `src/ai-audit-lots.js` regenerado por `scripts/generate-ai-audit-lots.mjs`. Nenhum outro campo alterado.',
'- **Exibição na IA Auditoria (lote 14):** 9/9 localizadas pelo ID, com enunciado e gabarito atuais, texto integral da resolução do ChatGPT no diff before/after, classificação de imagem e controles manuais de aprovação. Render verificado: 9/9 visíveis, diff de explanation marcado, status “Aguardando auditoria” em 9/9, 0 aprovações automáticas, 10 bloqueadas preservadas na fila.',
'- **Limitação registrada (seção 4 do pacote):** o painel não possui campos de exibição para `source_url`, `review_status`, `origin`, `answer_expected` e `pending_before_student_release`. Esses metadados ficam no artefato `pacote-9-chatgpt.json` commitado neste relatório (fluxo de propostas compatível com a arquitetura). Nenhuma aprovação fictícia foi criada e nada foi escrito diretamente no D1.',
'- **Pendências de liberação (as 9):** todas mantêm `pending_before_student_release` — figuras a restaurar (q52, q56, q12, q16, q4rev, q6rev, q4-c9, q7-propostos), mescla de OCR a remover (q7-propostos UEPG), OCR do enunciado (q9 UEM) e política editorial CPS/ETEC (q6-revisando). A liberação ao aluno segue bloqueada para as 9.',
'',
'### Divergências de gabarito (seção 5 do pacote — nenhum gabarito alterado)',
'',
'9 divergências registradas (texto integral do ChatGPT em `pacote-9-chatgpt.json` → `prior_recovered_discrepancies`). Destaques obrigatórios:',
'',
'- `fis-lic-l2-f1-c6-exercicios-complementares-q36`: resultado √2 m/s (gabarito atual 2 m/s).',
'- `fis-lic-l2-f1-c6-exercicios-complementares-q48`: alternativa A (gabarito atual C).',
'- `fis-lic-l2-f1-c7-exercicios-complementares-q13`: alternativa D (gabarito atual C).',
'- `fis-lic-l2-f3-c7-revisando-q1`: alternativa B (gabarito atual A).',
'- `fis-lic-l2-f3-c8-exercicios-propostos-q42`: alternativa D (gabarito atual A).',
'',
'Demais: `f1-c6-bncc-q1` (gabarito de aviação), `f1-c6-bncc-q2` (outra questão), `f1-c8-comp-q16` (massa 10⁻⁴ kg impossível), `f1-c7-comp-q31` (t=1 s/9 s sem posição do prédio). Todas exigem aprovação em etapa separada antes de qualquer atualização de gabarito.',
'',
'**Limitação sinalizada:** o painel já suporta o bloco “⚠ Divergência documentada” via campo `manifest.divergence` (`src/screens-review.js`), porém o teste `tests/ai-audit-lots-12-13.test.mjs` (linhas 97–106) fixa `lot14.divergenceIds.length === 0` e usa `lot14.ids[0]` — que é um dos IDs divergentes — para asserir rótulo “Corrigida por IA”. Registrar as divergências no painel exige atualizar esse teste junto; alteração de teste não autorizada neste pacote, portanto as divergências ficam neste relatório e no artefato do pacote. Não há bloqueio técnico restante além dessa autorização.',
'',
'### 10 questões que continuam bloqueadas (preservadas)',
'',
'`f1-c6-comp-q17`, `f1-c6-prop-q3`, `f1-c8-comp-q33`, `f2-c7-comp-q23`, `f3-c7-comp-q7`, `f3-c7-comp-q8`, `f1-c6-prop-q11`, `f3-c9-bncc-q3`, `f3-c7-bncc-q1`, `f3-c7-bncc-q2` — byte-idênticas ao baseline; sem novas resoluções; bloqueios de figura/enunciado/fonte mantidos.',
'',
'Notas do pacote mantidas como proposta de metadados (sem edição no banco): UEM origem correta “Vestibular de Verão 2017” (cadastro atual 2018); UEPG com duas questões mescladas no prompt (parte óptica resolvida, texto não liberável); UEA/PUC-Rio/UNESP/FAMEMA aguardando figuras; CPS/ETEC aguardando política editorial do Vestibulinho.',
'',
'### Validações da etapa 3',
'',
'- QA `scripts/qa-pacote9.mjs` (baseline `18979b5` via `git show`): **0 pendências** — banco 9/9 somente `explanation` idêntica ao pacote; 3504 demais byte-idênticas (181 anteriores + 10 bloqueadas + divergências intactas); patches 9/9 apenas `after.explanation`; `ai-audit-lots.js` com somente as 9 strings mudas (lot12/lot13/manifest/ids intactos); artefato byte-idêntico; painel 9/9 + sem auto-aprovação.',
'- `validate-bank` ✓ (3513 questões · 203 conceitos) · `npm test` **328/328** ✓ · `npm run build` ✓ hash **`75432fad`**.',
'',
'**Saldo do lote 14:** 190/200 com resolução aplicada (181 + 9 do pacote ChatGPT); 10 permanecem bloqueadas. O lote **não está cientificamente concluído** (regra de segurança do pacote: não declarar conclusão com esta evidência limitada). Aprovação de gabaritos divergentes e liberação das 9 dependem de etapa separada do Owner/ChatGPT.',
''
].join('\n');
fs.appendFileSync(REL, texto, 'utf8');
console.log('relatorio atualizado: +', texto.split('\n').length, 'linhas');
