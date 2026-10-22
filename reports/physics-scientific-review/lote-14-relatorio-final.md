# FIXOU — Relatório final do lote 14

## Escopo

- Base inicial: `e354299450eb10f1813d6cd497897fe0f591759a`.
- Commit de conteúdo: `a2512c3`.
- Seleção fechada: 200 questões existentes de Física L2.
- Tipos: 126 objetivas e 74 discursivas.
- Distribuição: 60 de Cinemática, 41 de Mecânica, 62 de Eletromagnetismo e 37 de Óptica.
- Correspondência média com a página oficial: 96,77%; menor correspondência: 84,10%.
- Repetições com os lotes históricos, 12 ou 13: zero.

## Revisão científica e editorial

- 200 questões analisadas e corrigidas.
- 200 gabaritos conferidos no Gabarito L2.
- 0 mudanças semânticas de gabarito; os 200 resultados armazenados coincidiram com a fonte oficial.
- 200 resoluções substituídas por explicações didáticas estruturadas em assunto, dados, princípio, relações, desenvolvimento, conferência e resposta.
- 59 enunciados e 10 conjuntos de alternativas receberam normalização conservadora de caracteres privados/OCR.
- 58 respostas discursivas e respectivas chaves textuais receberam apenas normalização editorial; o valor científico foi preservado.
- 0 questões substituídas depois do fechamento da lista.
- 0 divergências científicas pendentes.

## Integridade

- Quantidade do banco antes/depois: 3.513 / 3.513.
- Conceitos antes/depois: 203 / 203.
- IDs criados, removidos ou alterados: zero.
- Questões fora do lote modificadas: zero.
- Imagens e referências de imagem modificadas: zero.
- Campos administrativos (`contentStatus`, `needsReview`, classificação/status/motivo de imagem): preservados.
- D1, migrations, bindings, usuários e progresso: não alterados.

## IA Auditoria

- Mecanismo: manifesto e patches versionados em `reports/physics-scientific-review/`, consolidados por `scripts/generate-ai-audit-lots.mjs` em `src/ai-audit-lots.js` e unidos por `src/ai-audit-batch.js`.
- Registros do lote 14: 200.
- Estado inicial: Corrigida por IA — Aguardando auditoria.
- Aprovações automáticas: zero.
- Conteúdo anterior e posterior disponível para comparação: 200/200.
- Total único após integração: 819 registros (275 históricos, 150 do lote 12, 200 do lote 13 e 200 do lote 14).

## Artefatos

- `lote-14-manifest.json`: IDs, fonte, evidência do gabarito, correspondência de página e campos alterados.
- `lote-14-patches.json`: valores anteriores e posteriores para comparação na Auditoria IA.
- `lote-14-revisao-detalhada.md`: tabela completa e evidência individual das 200 questões.

## Validação local

- `npm run validate-bank`: aprovado — 3.513 questões, 203 conceitos.
- `npm test`: aprovado — 328 testes, zero falhas.
- Testes específicos da Auditoria IA: 13 aprovados.
- `npm run build`: aprovado.
- Build: HTML 157,7 KB; JavaScript externo 9,39 MB; hash `4f74e908`.

O SHA final, push, integração em `main`, ID do deploy e smoke tests de produção são preenchidos no relatório de entrega após a publicação.
