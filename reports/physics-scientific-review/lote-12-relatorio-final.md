# FIXOU — Relatório final do lote 12

- Questões auditadas: **150**
- IDs únicos: **150**
- Questões corrigidas: **144**
- Verificadas sem alteração: **6**
- Divergências fonte/gabarito documentadas: **5**
- Contagem do banco antes da validação: **3513 questões / 203 conceitos**
- Escopo: apenas IDs da allowlist; flags de moderação e metadados preservados.

## Divergências que permanecem sob revisão humana

- `fis-lic-l1-f3-c1-exercicios-complementares-q9` — The printed data yield 255 °A, while the official answer text extracted from the key is 45 °A.
- `fis-lic-l1-f1-c3-exercicios-complementares-q16` — The independent calculation from the extracted numerical data does not exactly match option C.
- `fis-lic-l1-f2-c1-exercicios-complementares-q9` — The extracted contact sequence yields 5Q/8, absent from the options, while the official key marks A.
- `fis-lic-l1-f3-c2-exercicios-complementares-q19` — The extracted coefficients yield about 0.408%, absent from the options, while the official key marks B.
- `fis-lic-l1-f3-c3-exercicios-complementares-q24` — The extracted sequence is internally ambiguous; the official key reports 80 °C.

## Validação, Git e produção

- Baseline Git: `b8abaddf5eb3ec5bc3819485ce3e081c7e90b04e` (`origin/main`).
- Branch: `review/fisica-lote-12-150`.
- `npm run validate-bank`: aprovado — 3.513 questões, 203 conceitos e 3 manifests.
- `npm test`: aprovado — 315 testes, 315 aprovados, 0 falhas.
- `npm run build`: aprovado — hash de bundle `5d4f8e17`.
- Controle de escopo: 150 IDs alterados, 0 fora da allowlist, 0 campos não autorizados e 0 flags de moderação alteradas.
- Commit, push, integração fast-forward, deploy e smoke test: executados na etapa de publicação posterior a este snapshot; os identificadores finais são registrados na entrega da tarefa.
