# Revisão científica das explicações — IA Auditoria (somente campo `explanation`)

**Branch:** `review/ia-auditoria-explanations-only`
**Base:** `origin/main` = `8051f83` (feat(admin): add physics lot 14 to AI audit)
**Escopo:** 22 IDs do lote 14 (exercícios de Física L2, PV) + registro de 3 divergências.
**Restrição da tarefa:** apenas o campo `explanation` foi alterado. Nenhum enunciado, alternativa, gabarito, ID, metadado de origem, imagem, status administrativo, `needsReview`, aprovação ou dado de usuário foi modificado. Nenhum deploy. Nenhuma aprovação automática.

## 1. IDs corrigidos (22)

Todos os 22 têm `type` inalterado, gabarito (`answer`/`answerKeyText`) preservado byte a byte e proveniência de vestibular verificável (21/22 com nome de prova explícito no enunciado; o 22º, `…-c6-exercicios-propostos-q37`, é da Vunesp/UNESP, identificável pelo rótulo "Vunesp").

O problema confirmado: as 200 resoluções do lote 14 original (commit `a2512c3`) usavam um template genérico — "**Assunto:** … **4. Desenvolvimento:** Converta primeiro todas as grandezas para unidades compatíveis. Em seguida, escolha a relação que contém a incógnita, substitua os valores…" — que não resolve a questão apresentada. O template citava fórmulas irrelevantes para o problema (por exemplo, `a_c = v²/R` numa questão de lançamento oblíquo) e apenas repetia o gabarito no fim.

| # | ID | Vestibular | Antes (chars) | Depois (chars) |
|---|---|---|---|---|
| 1 | `fis-lic-l2-f1-c6-exercicios-complementares-q43` | Fuvest-SP | 889 | 516 |
| 2 | `fis-lic-l2-f1-c6-exercicios-propostos-q37` | Vunesp (UNESP) | 875 | 360 |
| 3 | `fis-lic-l2-f1-c6-exercicios-propostos-q38` | PUC-SP | 883 | 480 |
| 4 | `fis-lic-l2-f1-c6-exercicios-propostos-q44` | Mackenzie-SP | 851 | 451 |
| 5 | `fis-lic-l2-f1-c7-exercicios-complementares-q30` | Acafe-SC (Adapt.) | 846 | 316 |
| 6 | `fis-lic-l2-f1-c7-exercicios-propostos-q17` | Fuvest/ETE-SP 2023 | 857 | 350 |
| 7 | `fis-lic-l2-f1-c7-exercicios-propostos-q25` | Mackenzie-SP | 855 | 353 |
| 8 | `fis-lic-l2-f1-c8-exercicios-complementares-q12` | UFMG | 782 | 372 |
| 9 | `fis-lic-l2-f1-c8-exercicios-complementares-q19` | Unicamp-SP 2025 | 805 | 617 |
| 10 | `fis-lic-l2-f1-c8-exercicios-complementares-q22` | Unicamp-SP | 816 | 457 |
| 11 | `fis-lic-l2-f1-c8-exercicios-complementares-q24` | Unicamp-SP | 810 | 552 |
| 12 | `fis-lic-l2-f1-c8-exercicios-complementares-q42` | UFRJ | 780 | 433 |
| 13 | `fis-lic-l2-f1-c8-exercicios-propostos-q1` | UEPG-PR 2021 | 794 | 667 |
| 14 | `fis-lic-l2-f1-c8-exercicios-propostos-q14` | UECE 2025 | 761 | 522 |
| 15 | `fis-lic-l2-f1-c8-exercicios-propostos-q19` | Fuvest-SP | 821 | 469 |
| 16 | `fis-lic-l2-f1-c8-exercicios-propostos-q21` | UFSC | 761 | 231 |
| 17 | `fis-lic-l2-f1-c8-exercicios-propostos-q25` | Uerj 2017 | 773 | 286 |
| 18 | `fis-lic-l2-f1-c8-exercicios-propostos-q27` | UFRJ | 797 | 374 |
| 19 | `fis-lic-l2-f1-c8-revisando-q15` | Fuvest-SP (Adapt.) | 870 | 487 |
| 20 | `fis-lic-l2-f2-c5-exercicios-propostos-q10` | Unicamp-SP 2021 | 807 | 241 |
| 21 | `fis-lic-l2-f2-c5-exercicios-propostos-q20` | Uerj 2020 | 787 | 236 |
| 22 | `fis-lic-l2-f3-c9-exercicios-complementares-q9` | UFG-GO | 856 | 425 |

Cada resolução foi reconstruída a partir do enunciado integral e conferida contra o gabarito cadastrado antes da aplicação. Todas as 22 batem com o gabarito; nenhuma divergência científica foi encontrada nesta seleção.

Ajuste editorial aplicado sobre o texto fornecido pelo Owner: remoção dos marcadores `**` (o app exibe `explanation` com `escapeHTML` dentro de `<p>`, sem renderização de markdown — asteriscos literais apareceriam ao aluno) e correção do typo "Decomomos" → "Decompondo" na resolução do item 5. Parágrafos separados por `\n\n`, que o painel admin renderiza via `white-space: pre-wrap`.

## 2. IDs preservados (sem alteração nesta tarefa)

- **178 questões restantes do lote 14** (200 − 22 corrigidas): mantidas como estão. Não foram reescritas nesta etapa.
- **3 divergências da seção 4** (ver abaixo): registradas, não editadas.
- **Q1–Q4 e Q5–Q6 de Movimento Circular** (`fis-lic-l1-f1-c5-revisando-q1..q6`, commits `1e1617c`/`b8abadd`): intactas.
- **Lotes 12 e 13** (commits `e0916cc`, `b008288`): não tocados.
- **Fila IA de 275 IDs** (`src/ai-audit-batch.js`, `src/ai-audit-baseline.js`): intocada.

## 3. Divergências científicas registradas (3 — não corrigidas nesta tarefa)

Conforme a seção 4 do prompt, estas divergências foram confirmadas e **não** foram mascaradas por alteração silenciosa de respostas:

**`fis-lic-l2-f1-c6-bncc-em-foco-q1`** — Incompatibilidade enunciado/resposta. O enunciado descreve um lançamento oblíquo com v = 25 m/s, sen θ = 0,8 e pede 9 itens (funções horárias, tempos, altura máxima, alcance, velocidade mínima). O campo `answer` contém texto sobre "velocidade de correção" de um avião (755 km/h, noroeste) — conteúdo de outra questão. A explicação atual ainda é o template genérico. **Pendência: reconstruir `answer` a partir do enunciado ou recuperar a fonte original; não editar outros campos sem autorização.**

**`fis-lic-l2-f1-c6-exercicios-complementares-q36`** — Divergência numérica. O enunciado dá x = t + 3 e y = 5 − t, da qual decorrem vx = 1 m/s e vy = −1 m/s, resultando em velocidade de módulo √2 ≈ 1,41 m/s. O gabarito cadastrado informa 2 m/s. **Pendência: conferir a fonte original (OCR de "x = t² + 3" ou "y = 5 − t²" produziria 2 m/s) antes de escrever resolução que contradiga o resultado.**

**`fis-lic-l2-f1-c8-exercicios-complementares-q33`** — Possível omissão de etapa. Com F = 150 N sobre dois corpos de 12 kg e 8 kg, sem atrito, a aceleração do conjunto é 7,5 m/s² (coerente com os itens a e b). O item c pede "aceleração total do corpo A" e o gabarito informa 12,5 m/s², valor que corresponde a 150/12 — a força aplicada isoladamente ao corpo A. O enunciado extraído não deixa claro se a força passa a atuar só sobre A depois da separação. **Pendência: verificar se existe condição/etapa omitida no OCR; o gabarito provavelmente pressupõe separação dos corpos.**

Nenhuma dessas três questões teve `answer`, `answerKeyText` ou `explanation` alterados nesta tarefa.

## 4. Categorias das 200 questões do lote 14 (para planejar as próximas etapas)

| Categoria | Quantidade | Observação |
|---|---|---|
| Com vestibular identificável no enunciado | 90 | Fuvest, Unicamp, Uerj, UFRJ, UFSC, UFMG, UFG, UEPG, UECE, PUC-SP/Minas/Rio, Mackenzie, Acafe, Vunesp, FEI, UFPB, FAMERP, IMT |
| Sem vestibular identificável | 110 | Enunciados do material PV sem rótulo de prova — candidatos à seção 1 do prompt (limpeza e comprovação de origem), sem exclusão nesta etapa |
| Com `imageAssets` no banco | 0 | Nenhuma questão do lote 14 tem imagem anexada |
| Com indício de diagrama no OCR do enunciado | 17 | Textos como "Sem atrito", "Plano inclinado", "As figuras mostram", letras de diagrama isoladas — podem depender de figura ausente |
| `pageTokenCoverage` < 0,90 (OCR parcial) | 7 | `bncc-em-foco-q1` (0,841), `propostos-q53` (0,846), `c7-propostos-q25` (0,895), `c8-complementares-q12` (0,870), `c8-complementares-q22` (0,892), `f3-c7-propostos-q7` (0,891), `f3-c8-bncc-em-foco-q2` (0,846) |

O commit original do lote 14 (`a2512c3`) alterou `explanation` em 200 questões, `prompt` em 59, `answer` em 58, `answerKeyText` em 58 e `options` em 10. As 22 corrigidas agora receberam resoluções específicas; as demais 178 continuam com o template genérico e entram no escopo das próximas etapas, priorizando as de proveniência vestibular comprovável.

## 5. Validação técnica

| Verificação | Resultado |
|---|---|
| `npm run validate-bank` | Passou — `Bank valid · 3513 questions · 203 concepts · 3 batch manifest` |
| `npm test` | Passou — 328/328 testes, 0 falhas |
| `npm run build` | Passou — `Build OK · 3513 questões · hash 38ea00c0` |
| QA de escopo (`scripts/qa-lote14-exp.mjs`) | 0 pendências — exatamente 22 IDs alterados, 0 fora do escopo, somente campo `explanation` modificado, 22/22 explicações conferidas contra o alvo, 3 divergências intactas, 38/38 verificações numéricas independentes conferem, 22/22 gabaritos preservados |
| Contagem do banco | 3513 → 3513 |
| Conceitos e metadados de topo | Intactos (JSON byte-idêntico fora de `questions`) |
| D1 / fila IA | Não escrita; `ai-audit-batch.js` e `ai-audit-baseline.js` inalterados |

## 6. Plano de reversão

A reversão é trivial e não envolve banco de dados:

```
git revert <sha-do-commit-desta-branch>   # após merge
# ou, antes do merge:
git checkout origin/main -- content/bank.json
npm run build
```

O campo `explanation` é exibido ao aluno mas não participa de gabaritos, filas, status administrativos nem do histórico do usuário (respostas e revisões do aluno são independentes do texto da explicação). Reverter não afeta dados de usuários.

## 7. Próximas etapas sugeridas (fora do escopo desta tarefa)

1. Resolver as 3 divergências da seção 3 junto ao Owner (fonte original PDF).
2. Reescrever as explicações das demais 178 questões do lote 14, priorizando as ~68 restantes com vestibular comprovável.
3. Aplicar o mesmo critério científico aos lotes 13 e 12, cujas "revisões" também usaram templates genéricos ("A resolução independente usa X… obtém-se Y, em acordo com o gabarito").
4. Tratar a seção 1 do prompt (limpeza e comprovação de origem) para as 110 questões sem vestibular identificável.
5. Após revisão do Owner, promover merge, deploy e atualização do D1 conforme o fluxo de aprovação manual.
