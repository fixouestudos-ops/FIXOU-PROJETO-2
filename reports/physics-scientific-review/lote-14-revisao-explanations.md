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
