# Lote 14 — Revisão científica de explicações (explanation-only)

Branch: `review/ia-auditoria-explanations-only` (base `origin/main` = `8051f83`)
Escopo: somente campo `explanation` em 200 IDs do lote 14 (IA Auditoria). Nenhum outro campo, status, imagem, ID, metadado ou divergência foi alterado. Sem merge, sem deploy, sem aprovação automática.

## Resultado

| Etapa | IDs | Status |
|---|---|---|
| Rodada anterior (22 explicações, commit `5e7762e`) | 22 | Aplicadas e publicadas na branch |
| Correções adicionais do Owner (`fixou_lote14_correcoes_adicionais.json`, 135) | 135 | Aplicadas nesta rodada (todas substituíam template genérico) |
| Resoluções individuais (sem proposta, sem issue bloqueadora) | 7 | Deduzidas, conferidas e aplicadas |
| **Total resolvido** | **164/200** | |
| Pendências registradas (não editadas) | 36/200 | intactas no banco |

### 7 resoluções individuais

| ID | Assunto | Verificação |
|---|---|---|
| `…f1-c6-comp-q37` | Trajetórias por eliminação de t (5 itens) | y=2x², y=(2/3)x, parábola, x²+y²=9, x²/4+y²/9=1 — todos conferidos |
| `…f1-c6-prop-q12` | Vetores perpendiculares, \|a\|+\|b\|=17, \|a−b\|=13 | u²−17u+60=0 → 12 e 5; 12²+5²=13² ✓ |
| `…f1-c8-comp-q15` | Ímã+bloco (Cesgranrio) | N1=P1+F1, N2=F2−P2 → N1+N2=2F1 (P1=P2) ✓ |
| `…f1-c8-comp-q74` | Macaco na tira (Fuvest) | velocidade constante → alongamento constante; porção inferior sem carga sobe → C ✓ |
| `…f2-c6-prop-q6` | Bateria+resistor em paralelo (Uece) | dois ramos = circuito único → mesma corrente nos dois resistores ✓ |
| `…f3-c7-rev-q5` | Carotenos (Enem) | absorvem violeta/azul, refletem amarelo-alaranjado → A ✓ |
| `…f3-c9-comp-q2` | Conceitos UEPG (soma) | 01✓ 02✓ 04✗ (calor latente é na mudança de fase) 08✓ → 01+02+08=11 ✓ |

### 36 pendências por classe

| Classe | Qtd | Exemplos |
|---|---|---|
| `answer_mismatch` | 13 | gabarito de outra questão (bncc-em-foco), √2 vs 2 m/s, A vs C, "planos" vs convexo, 21 cm/1,25 mm/s |
| `missing_visual_evidence` | 16 | diagramas de circuito/polia/estroboscópico/semicilindro ausentes; cenários não reproduzíveis do OCR |
| `prompt_corrupt` | 6 | equações vetoriais, itens 04/16, massa da Terra, ESF de óculos — OCR ilegível |
| `source_not_verified` | 1 | `…f1-c7-comp-q13` (dependência tan²θ2) |

Detalhamento individual: `reports/physics-scientific-review/lote-14-revisao-assistida/pending-source.json` e `mismatches.json`.

## Invariantes verificados (QA `qa-final-lote14.mjs`, 0 pendências)

- Banco 3513 → 3513; conceitos e metadados de topo byte-idênticos.
- Exatamente 164 questões alteradas vs baseline (`bank.json.pre-lote14-exp`), todas dentro do lote 14.
- Campos alterados: exclusivamente `explanation` (comparação campo a campo de todas as questões alteradas).
- 164/164 explicações conferidas contra os alvos (22 + 135 + 7); zero residual de template genérico; zero markdown `**`.
- 36 pendentes byte-idênticas ao baseline; 3 divergências registradas (bncc-q1, comp-q36, comp-q33) intactas; gabaritos dos 164 preservados.

## Validações

- `npm run validate-bank` ✓ Bank valid · 3513 questions · 203 concepts
- `npm test` ✓ 328/328 (fail 0)
- `npm run build` ✓ hash `7136f1f3` (apenas regeneração de build local; sem deploy)

## Notas editoriais

- Explicações sem markdown (o app renderiza com `escapeHTML` em `<p>`; `**` apareceria literal).
- `…f1-c6-prop-q11` classificada como `prompt_corrupt`: a equação "c 25 3b 2a 2 3x" não permite dedução inequívoca de x.
- `…f1-c8-comp-q33` mantida pendente: 12,5 m/s² = 150/12 sugere cenário de A isolado ausente do OCR; não aplicado por precaução.
- Lotes 12/13 usaram templates genéricos em explanation (fora do escopo desta tarefa; registrado como próxima etapa potencial).

## Etapa 2 — Investigação das 36 pendências (base `dc80695`)

Cada uma das 36 pendências foi analisada individualmente (enunciado, gabarito, figura/OCR). Resultado: **17 recuperadas** (explanation aplicada, resolução completa conferida) e **19 bloqueadas** (evidência insuficiente). Arquivos: `checkpoint-36.json`, `correcoes-propostas-36.json`, `pendentes-36-dump.json`.

### 17 recuperadas (explanation-only)

| ID | Assunto | Observação |
|---|---|---|
| `…f1-c6-bncc-q1` | Lançamento oblíquo 25 m/s, itens a–i | Answer de aviação ignorado; resolução independente (T=4 s, H=20 m, A=60 m…) |
| `…f1-c6-bncc-q2` | Bola de mesa 0,8 m / 2,4 m | v=6 m/s (confere com resolução embutida no prompt) |
| `…f1-c6-comp-q36` | x=t+3, y=5−t | \|v\|=√2 m/s; gabarito "2" = √2 sem o símbolo (proposto) |
| `…f1-c6-comp-q48` | Velocidade relativa 60° | Apenas A verdadeira; gabarito C proposto → 0 |
| `…f1-c6-prop-q40` | Circular UFMS | C por eliminação; \|vmed\|=8sen67,5°/3≈2,46 cm/s |
| `…f1-c7-comp-q13` | Alturas máximas complementares | H1/H2=tg²u1 → D; gabarito C proposto → 3 |
| `…f1-c7-comp-q18` | Ângulo de visada da bomba | tg u=√(gH/2)/v (derivação completa; answer ilegível no OCR) |
| `…f1-c7-comp-q31` | Projétil e prédio 45 m | t=1 s (subida) e 9 s (descida); gabarito 9 s = descida |
| `…f1-c8-comp-q16` | Aceleração da Terra | M=10²⁴ kg (OCR "10⁻⁴" corrompido); a=10⁻²¹ m/s² |
| `…f1-c8-comp-q55` | Fuvest A/B/C | aA=0, aB=aC=g/2 ✓ gabarito |
| `…f1-c8-comp-q72` | Fuvest mola/vagões | a2=(F1−M1a1)/M2 ✓ gabarito (texto da alt. A pendente de OCR) |
| `…f3-c7-rev-q1` | Eclipses FCMCSP | Lua nova 14/10 → cheia 28/10; gabarito 17 proposto → 1 |
| `…f3-c8-bncc-q1` | Refração sem desvio | Incidência perpendicular (i=0→r=0) |
| `…f3-c8-bncc-q2` | Índices nA/nB | nA=2, nB=1,5, nA/B=4/3 |
| `…f3-c8-prop-q37` | Garagem/espelho convexo | Campo visual amplo; answer de côncavo proposto para substituição |
| `…f3-c8-prop-q42` | UEMG espelhos | Convexos e côncavos (D); gabarito A proposto → 3 |
| `…f3-c8-prop-q47` | Distortion estreito/largo | Convexo estreita; côncavo perto amplia |

### 19 bloqueadas (evidência faltante — ver `correcoes-propostas-36.json`)

- **Imagem necessária (13):** estroboscópicas q17; diagramas I–IV q3; cenário item c q33; polia/elevador q52 (gabarito ilegível); Atwood q56; topologias f2 (q12, q16, q4rev, q6rev, q23); penumbra/sombra (q7, q8); semicilindro q4.
- **OCR a reconstruir (3):** itens 04/16 UEM q9; equação vetorial q11; ESF da receita bncc q3.
- **Gabarito de outra questão / mesclagem (3):** fragmentos BNCC c7 (q1, q2); UEPG mesclada q7.

### Origem (regra de verificação)

Todas as 36 são do livro **PV Física – L2 (2025)**. As atribuicoes de vestibular nos enunciados **nao foram comprovadas** (sem provas oficiais no repositorio). A autenticidade de origem permanece **nao verificada** para as 36 — registrado em `correcoes-propostas-36.json` → `meta.origem_global`.

### Validações da etapa 2

- QA `qa-17.mjs`: 17/17 conferidas, somente `explanation`, 0 pendências (baseline = `dc80695` via `git show`).
- `validate-bank` ✓ · `npm test` 328/328 ✓ · `build` hash `3b5753ed` ✓.

**Saldo do lote 14:** 181/200 com resolução científica aplicada (164 anteriores + 17); 19 permanecem bloqueadas por evidência insuficiente. O lote **nao esta cientificamente concluido**: as 19 bloqueadas e a verificacao de origem continuam pendentes de fonte oficial.

## Etapa 3 — Pacote 9 do ChatGPT (execução literal)

**Pacote:** `FIXOU_lote14_auditoria_chatgpt_pacote_9.json` (cópia integral: `pacote-9-chatgpt.json`, mesmo diretório deste relatório). Editor: ChatGPT Victor Elias. Executor: OpenCode (sem autoria científica). Branch inicial: `18979b5`.

### 9 correções aplicadas (somente campo explanation)

| ID | Resultado esperado | review_status | Origem declarada | Fonte |
|---|---|---|---|---|
| `f1-c6-exercicios-complementares-q9` | 03 (01+02) | source_verified | UEM, Vestibular de Verão 2017, Prova 1, questão 26 | [fonte](https://www.vestibular.uem.br/provas/ve17/P1G1.pdf) |
| `f3-c7-exercicios-propostos-q7` | 31 (01+02+04+08+16) | source_verified | UEPG, Vestibular de Outono (prova aplicada em março de 2022), grupo 5, questão 38 | [fonte](https://cps.uepg.br/vestibular/documentos/2021/outono/provas/Grupo_5.pdf) |
| `f1-c8-exercicios-complementares-q52` | T=(M+m)(g+a)/2; N=(m−M)(g+a)/2 | conditional_figure | Exercício de elevador e operador; procedência UFSC não comprovada | — |
| `f1-c8-exercicios-propostos-q56` | 2,5 kg (considerando g=10 m/s²) | source_located | UERJ, Vestibular Estadual 2008, 2º Exame Discursivo, Física, questão 6 | [fonte](https://sistema.vestibular.uerj.br/portal_vestibular_uerj/arquivos/arquivos2008/2008ed_fis.pdf) |
| `f2-c6-exercicios-propostos-q12` | A — 4 kΩ | source_verified | PUC-Rio, Vestibular de Inverno 2017, Grupo 2, questão 8 | [fonte](https://www.puc-rio.br/vestibular/repositorio/provas/2017-2/download/provas/VEST2017-2_PUCRioProva_G2_20170709.pdf) |
| `f2-c6-exercicios-propostos-q16` | D — L1, L2 e L3 | source_verified | UEA, SIS-I, Prova de Acompanhamento I de 2024, questão 52 | [fonte](https://souvetor.com/wp-content/uploads/2025/05/UEA-PROVA-SIS-I-2024.pdf) |
| `f2-c6-revisando-q4` | A — 40 Ω | source_reproduced | FAMEMA, vestibular 2023 (prova realizada novembro de 2022), questão 40 | [fonte](https://www.curso-objetivo.br/vestibular/resolucao-comentada/famema/2023/famema2023.pdf) |
| `f2-c6-revisando-q6` | B — somente L1 e L2 | source_reproduced | CPS/ETEC, Vestibulinho 2019/1, questão 32 | [fonte](https://app.estuda.com/questoes/?id=1350853) |
| `f3-c9-exercicios-complementares-q4` | A — n=1,2 | source_reproduced | UNESP, Vestibular 2021, segunda fase, questão 53 | [fonte](https://www.curso-objetivo.br/vestibular/resolucao-comentada/unesp/2021/2fase/UNESP2021_2fase_prova.pdf) |

- **Inserção literal:** texto de `explanation` copiado byte a byte do pacote para `content/bank.json` (9 IDs) e para `after.explanation` de `reports/physics-scientific-review/lote-14-patches.json` (fonte do diff exibido no painel); `src/ai-audit-lots.js` regenerado por `scripts/generate-ai-audit-lots.mjs`. Nenhum outro campo alterado.
- **Exibição na IA Auditoria (lote 14):** 9/9 localizadas pelo ID, com enunciado e gabarito atuais, texto integral da resolução do ChatGPT no diff before/after, classificação de imagem e controles manuais de aprovação. Render verificado: 9/9 visíveis, diff de explanation marcado, status “Aguardando auditoria” em 9/9, 0 aprovações automáticas, 10 bloqueadas preservadas na fila.
- **Limitação registrada (seção 4 do pacote):** o painel não possui campos de exibição para `source_url`, `review_status`, `origin`, `answer_expected` e `pending_before_student_release`. Esses metadados ficam no artefato `pacote-9-chatgpt.json` commitado neste relatório (fluxo de propostas compatível com a arquitetura). Nenhuma aprovação fictícia foi criada e nada foi escrito diretamente no D1.
- **Pendências de liberação (as 9):** todas mantêm `pending_before_student_release` — figuras a restaurar (q52, q56, q12, q16, q4rev, q6rev, q4-c9, q7-propostos), mescla de OCR a remover (q7-propostos UEPG), OCR do enunciado (q9 UEM) e política editorial CPS/ETEC (q6-revisando). A liberação ao aluno segue bloqueada para as 9.

### Divergências de gabarito (seção 5 do pacote — nenhum gabarito alterado)

9 divergências registradas (texto integral do ChatGPT em `pacote-9-chatgpt.json` → `prior_recovered_discrepancies`). Destaques obrigatórios:

- `fis-lic-l2-f1-c6-exercicios-complementares-q36`: resultado √2 m/s (gabarito atual 2 m/s).
- `fis-lic-l2-f1-c6-exercicios-complementares-q48`: alternativa A (gabarito atual C).
- `fis-lic-l2-f1-c7-exercicios-complementares-q13`: alternativa D (gabarito atual C).
- `fis-lic-l2-f3-c7-revisando-q1`: alternativa B (gabarito atual A).
- `fis-lic-l2-f3-c8-exercicios-propostos-q42`: alternativa D (gabarito atual A).

Demais: `f1-c6-bncc-q1` (gabarito de aviação), `f1-c6-bncc-q2` (outra questão), `f1-c8-comp-q16` (massa 10⁻⁴ kg impossível), `f1-c7-comp-q31` (t=1 s/9 s sem posição do prédio). Todas exigem aprovação em etapa separada antes de qualquer atualização de gabarito.

**Limitação sinalizada:** o painel já suporta o bloco “⚠ Divergência documentada” via campo `manifest.divergence` (`src/screens-review.js`), porém o teste `tests/ai-audit-lots-12-13.test.mjs` (linhas 97–106) fixa `lot14.divergenceIds.length === 0` e usa `lot14.ids[0]` — que é um dos IDs divergentes — para asserir rótulo “Corrigida por IA”. Registrar as divergências no painel exige atualizar esse teste junto; alteração de teste não autorizada neste pacote, portanto as divergências ficam neste relatório e no artefato do pacote. Não há bloqueio técnico restante além dessa autorização.

### 10 questões que continuam bloqueadas (preservadas)

`f1-c6-comp-q17`, `f1-c6-prop-q3`, `f1-c8-comp-q33`, `f2-c7-comp-q23`, `f3-c7-comp-q7`, `f3-c7-comp-q8`, `f1-c6-prop-q11`, `f3-c9-bncc-q3`, `f3-c7-bncc-q1`, `f3-c7-bncc-q2` — byte-idênticas ao baseline; sem novas resoluções; bloqueios de figura/enunciado/fonte mantidos.

Notas do pacote mantidas como proposta de metadados (sem edição no banco): UEM origem correta “Vestibular de Verão 2017” (cadastro atual 2018); UEPG com duas questões mescladas no prompt (parte óptica resolvida, texto não liberável); UEA/PUC-Rio/UNESP/FAMEMA aguardando figuras; CPS/ETEC aguardando política editorial do Vestibulinho.

### Validações da etapa 3

- QA `scripts/qa-pacote9.mjs` (baseline `18979b5` via `git show`): **0 pendências** — banco 9/9 somente `explanation` idêntica ao pacote; 3504 demais byte-idênticas (181 anteriores + 10 bloqueadas + divergências intactas); patches 9/9 apenas `after.explanation`; `ai-audit-lots.js` com somente as 9 strings mudas (lot12/lot13/manifest/ids intactos); artefato byte-idêntico; painel 9/9 + sem auto-aprovação.
- `validate-bank` ✓ (3513 questões · 203 conceitos) · `npm test` **328/328** ✓ · `npm run build` ✓ hash **`75432fad`**.

**Saldo do lote 14:** 190/200 com resolução aplicada (181 + 9 do pacote ChatGPT); 10 permanecem bloqueadas. O lote **não está cientificamente concluído** (regra de segurança do pacote: não declarar conclusão com esta evidência limitada). Aprovação de gabaritos divergentes e liberação das 9 dependem de etapa separada do Owner/ChatGPT.

## Etapa 4 — Pacote round2 (4 resoluções + 6 bloqueios + interface + teste de divergências)

**Pacote:** `FIXOU_lote14_pendencias10_ChatGPT_2026-10-22.json` (artefato: `pacote-round2-10-chatgpt.json`). Editor: ChatGPT. Executor: OpenCode. Branch inicial: `6a1d11a`.

### 4 correções aplicadas (somente explanation, literal)

| ID | Resultado esperado | Alerta de imagem | Situação da fonte |
|---|---|---|---|
| `f1-c6-exercicios-complementares-q17` | E (apenas afirmações I e III) | figuras A, B, C ainda precisam ser anexadas no cadastro | atribuída à PUC-Minas; gabarito corroborado por material didático, prova oficial não localizada |
| `f1-c6-exercicios-propostos-q3` | B (diagramas II e IV) | anexar diagramas I–IV ao cadastro antes de publicar | atribuída à UFPB 2007; diagramas recuperados em material de estudo, prova oficial não localizada |
| `f1-c8-exercicios-complementares-q33` | a) 7,5 m/s²; b) 60 N; c) 12,5 m/s² | figura da prova/material precisa ser vinculada ao cadastro | PUC-Rio 1999 identificada em material Fundação Cecierj; esquema recuperado |
| `f2-c7-exercicios-complementares-q23` | 5 V | vincular circuito original ao cadastro | UFPE 2007, 2ª etapa de Física; enunciado, valores e justificativa localizados em prova com solução |

- Inserção literal em `content/bank.json` + `after.explanation` em `lote-14-patches.json` + regeneração de `ai-audit-lots.js`. QA: 4/4 texto idêntico ao pacote, somente `explanation`, 3509 restantes byte-idênticas (190 anteriores + 6 bloqueadas + divergências intactas).
- Exibição na IA Auditoria: 4/4 visíveis no lote 14 com resolução, meta do pacote, alerta de imagem, link da fonte e status “Aguardando auditoria”; 0 aprovações automáticas.

### 6 bloqueios preservados (pendências documentadas na IA Auditoria)

- `f3-c7-exercicios-complementares-q7` (not_ready_source_and_visual): Problema autoral do livro, sem vestibular atribuído; falta extensão da fonte luminosa no cadastro e a figura; gabarito indica penumbra total de 1 m, mas não se deve fabricar dimensões a partir do resultado.
- `f3-c7-exercicios-complementares-q8` (not_ready_source_and_visual): Problema autoral do livro, sem vestibular atribuído; figura e largura da fonte luminosa são imprescindíveis; gabarito indica sombra de 75 cm, mas os dados textuais não bastam para derivação independente.
- `f1-c6-exercicios-propostos-q11` (not_ready_corrupt_prompt): A, B, C e equação vetorial estão corrompidos pelo OCR, sem transcrição inequívoca; enunciado não tem vestibular comprovado; não se deve inferir os sinais pelo gabarito.
- `f3-c9-bncc-em-foco-q3` (not_ready_missing_data): Valores de ESF/vergência da receita não foram preservados, e o enunciado contém fragmentos de páginas não relacionadas. O resultado qualitativo (lente divergente para vergência negativa) não comprova a receita original. Não há vestibular atribuído.
- `f3-c7-bncc-em-foco-q1` (not_a_complete_question): Enunciado é orientação procedimental de traçado de imagens, não uma pergunta completa; gabarito fala de fontes coloridas de outra questão. Não possui origem de vestibular demonstrada.
- `f3-c7-bncc-em-foco-q2` (not_a_complete_question): Enunciado é orientação procedimental de traçado de raios, sem objeto/espelho/posição; gabarito discute teoria da chama nos olhos, de outra questão. Não possui origem de vestibular demonstrada.

- Byte-idênticas ao baseline `dc80695`; sem resoluções novas; seção “Dados do pacote científico” exibe o motivo do bloqueio no painel; nenhuma aprovada ou liberada (todas “Aguardando auditoria”).

### Cobertura

- 194/200 resoluções aplicadas = 164 (etapa 1) + 17 (etapa 2) + 9 (etapa 3) + 4 (etapa 4); 6 bloqueadas = resto das 36 pendências originais (verificado por conjunto em `qa-round2.mjs`). Cobertura, **não** aprovação científica.

### Interface da IA Auditoria (seção 3 — melhoria autorizada)

- Novo módulo gerado `src/ai-audit-meta.js` (19 IDs) a partir dos artefatos dos dois pacotes; render em `src/screens-review.js` (seção condicional “Dados do pacote científico”).
- Exibidos apenas campos existentes: resultado calculado pelo ChatGPT, classificação da revisão, origem declarada, situação da fonte, links da prova/documento (somente http/https), alerta de imagem obrigatória, pendência de liberação e motivo de bloqueio. Nenhum metadado ausente é exibido; nota do painel registra que são dados do pacote sujeitos a conferência manual e que não configuram aprovação/liberação automática.
- Resolução anterior/proposta (diff before/after), gabarito atual, divergências documentadas e aprovação manual já existentes permanecem inalterados; lógica de aprovação intocada.

### Divergências no lote 14 (seção 4 — atualização pontual autorizada)

- `reports/physics-scientific-review/lote-14-manifest.json`: campo `divergence` preenchido nas 9 questões com divergência documentada no pacote 9 (somente onde era `null`; registros originais preservados). Nenhum gabarito/enunciado alterado.
- `src/ai-audit-lots.js` regenerado (derived `divergenceIds` = 9).
- `tests/ai-audit-lots-12-13.test.mjs`: teste de divergências **ampliado** (mantidas as verificações de lot12=5 e lot13=0; adicionadas: lista exata das 9 do lote 14, rótulo `divergencia_documentada` via `aiAuditScientificResult` e render do bloco com texto escapado + nota “gabarito não foi alterado”); ajuste pontual em “lista e detalhe…” para escolher um ID não divergente (`ids.find(...)`) mantendo a asserção de rótulo. Nenhuma cobertura removida.

### Validações da etapa 4

- `scripts/validar-round2.mjs`: 0 pendências (estrutura/IDs/banco/lote14).
- `scripts/qa-round2.mjs`: 0 pendências (banco/patches/manifest/lots/meta/render/arquivos).
- `validate-bank` ✓ · `npm test` ✓ · `npm run build` ✓ (hash registrado no commit).

**Saldo do lote 14:** 194/200 com resolução aplicada; 6 bloqueadas documentadas. Lote **não** declarado cientificamente concluído; aprovação segue 100% manual.
