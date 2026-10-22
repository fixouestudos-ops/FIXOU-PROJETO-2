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
