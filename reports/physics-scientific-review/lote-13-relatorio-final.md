# FIXOU — Relatório final da revisão científica do lote 13

## Estado recuperado

- Branch de trabalho: `review/fisica-lote-13-200`.
- SHA inicial: `bd5ffd8d80464df53ab492ebdeb464f65e36ac05`.
- Ao retomar, os 200 IDs já estavam pré-selecionados, mas nenhuma questão possuía o conjunto completo de evidências exigido para ser considerada cientificamente concluída.
- O banco ainda não continha alterações do lote 13.
- Os arquivos temporários de extração e seleção foram preservados durante a retomada para permitir a reconstrução do checkpoint.

## Resultado do lote

- Questões concluídas antes da retomada: **0**.
- Questões concluídas após a retomada: **200**.
- Total auditado: **200 IDs únicos**.
- Questões corrigidas: **200**.
- Questões verificadas sem alteração: **0**.
- Questões reconstruídas diretamente da posição correta no material: **20**.
- Questões objetivas: **111**.
- Questões discursivas ou de resposta textual: **89**.
- Divergências pendentes dentro do lote final: **0**.
- Dependências de imagem no lote final: **0**.

Cada item do lote possui no relatório detalhado a identificação da fonte, o enunciado conferido, o princípio físico usado, o resultado independente, o gabarito oficial, os campos efetivamente alterados e o resultado da auditoria. O manifesto mantém a evidência estruturada, e o arquivo de patches registra somente diferenças reais em relação ao banco inicial.

## Candidatas recusadas e substituídas

Cinco candidatas não foram incluídas entre as 200 concluídas porque não puderam ser validadas com segurança. Elas não receberam alterações no banco e foram substituídas por questões elegíveis:

1. `fis-lic-l1-f3-c6-exercicios-complementares-q14`: conflito entre o resultado da soma e o gabarito oficial.
2. `fis-lic-l1-f1-c5-exercicios-complementares-q29`: conflito na soma da questão sobre cadeira de rodas.
3. `fis-lic-l1-f3-c6-exercicios-propostos-q8`: resolução independente apontou alternativa D, enquanto o gabarito oficial indica B.
4. `fis-lic-l1-f3-c6-exercicios-complementares-q34`: cálculo da OTEC apontou aproximadamente 40 MW, alternativa A, enquanto o gabarito indica E e a fonte extraída apresenta apenas A–D.
5. `fis-lic-l1-f3-c2-exercicios-propostos-q28`: extração da fonte estava contaminada e não permitia reconstrução segura.

## Integridade e escopo

- Banco final: **3.513 questões** e **203 conceitos**.
- Exatamente 200 IDs do banco foram alterados.
- Não houve sobreposição com o lote 12.
- Nenhum ID foi renomeado ou duplicado.
- Nenhuma questão fora da allowlist foi alterada.
- Nenhum campo de moderação, `contentStatus`, `needsReview`, `reviewReasons`, aprovação do Owner ou dado de imagem foi alterado.
- Os campos modificados ficaram limitados a `prompt`, `options`, `type`, `answer`, `answerKeyLetter`, `answerKeyText`, `explanation` e, nas reconstruções justificadas, `sourcePage`.
- Nenhuma questão do lote final depende de imagem para ser respondida.
- Não restaram glifos privados de OCR ou caracteres de controle nos enunciados e alternativas auditados.
- Todas as alternativas, índices e letras de resposta estão coerentes no banco final.

## Validação executada

- `npm run validate-bank`: aprovado — 3.513 questões, 203 conceitos e 3 manifestos de lote.
- `npm test`: aprovado — 315 testes, 0 falhas, 0 ignorados.
- `npm run build`: aprovado — HTML de 157,5 KB, bundle JavaScript de 8,12 MB, hash `912d4447`.
- `git diff --check`: aprovado, sem erros de whitespace; somente aviso de normalização LF/CRLF em arquivo gerado.

## Arquivos do lote

- `content/bank.json`: correções das 200 questões.
- `reports/physics-scientific-review/lote-13-manifest.json`: manifesto estruturado com exatamente 200 IDs.
- `reports/physics-scientific-review/lote-13-patches.json`: diferenças efetivas por questão.
- `reports/physics-scientific-review/lote-13-revisao-detalhada.md`: auditoria individual das 200 questões.
- `reports/physics-scientific-review/lote-13-relatorio-final.md`: este relatório consolidado.
- `src/catalog.js` e `dist/`: artefatos regenerados pelo build oficial do projeto.

## Publicação

O commit, o push, a integração por fast-forward e o deploy são executados depois do fechamento deste relatório. O SHA remoto e o identificador da implantação Cloudflare são registrados no retorno operacional da tarefa, pois só existem após a criação do commit e a confirmação do provedor.
