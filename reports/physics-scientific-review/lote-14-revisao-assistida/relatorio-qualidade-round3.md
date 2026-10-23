# FIXOU — Auditoria de qualidade do lote 14 (rodada 3)

## Causa da resolução genérica na captura de tela

O componente `src/screens-review.js`, na comparação "Depois da correção", usa `AI_AUDIT_LOTS.lot14.patchById[q.id].after`: a versão original do lote 14. Esse histórico não incorpora necessariamente as atualizações posteriores do `content/bank.json`. A seção separada "Explicação" mostra `q.explanation` atual.

## Varredura dos 200 IDs do lote

- 200 IDs verificados quanto à existência e às versões registradas.
- 194 possuem resolução aplicada nas seis ondas anteriores (22 + 135 + 7 + 17 + 9 + 4).
- 6 estão bloqueados por falta de evidência visual/fonte ou corrupção de OCR.
- 187 de 200 comparações históricas ainda apresentam o texto genérico "Converta primeiro..." ou "coincide com o gabarito oficial".
- Nenhuma das 194 explicações atuais recuperadas dos pacotes inclui o modelo genérico.
- 102 de 194 explicações atuais têm menos de 350 caracteres, sendo 24 com menos de 225 caracteres. Essa métrica indica prioridade editorial, não erro matemático.
- 9 divergências científicas permanecem registradas na IA Auditoria para validação humana.

## Novas resoluções produzidas pelo ChatGPT

56 resoluções didáticas independentes foram redigidas para substituir explicações curtas ou superficiais. Estão no JSON anexo, com IDs completos e conteúdo final pronto para a implementação literal. Todas têm pelo menos 400 caracteres e não contêm marcadores Markdown literais.

A questão `fis-lic-l2-f1-c6-exercicios-complementares-q14` foi confrontada com a prova oficial ENEM 2020 Digital, caderno 7, questão 105, alternativa B: https://download.inep.gov.br/enem/provas_e_gabaritos/2020_PV_digital_D2_CD7.pdf

## Pendências e ressalvas

- As seis questões bloqueadas permanecem inalteradas.
- A potência de 500 W do motor em `fis-lic-l2-f2-c5-exercicios-complementares-q18` precisa de confirmação se corresponde à potência absorvida ou útil antes de uma correção definitiva.
- Problemas com Ω/V e sinais/radicais apagados por OCR devem continuar sinalizados; nenhum gabarito será alterado automaticamente.
- As 138 explicações previamente preenchidas que não aparecem nas 56 novas correções ainda precisam de conferência científica individual. A varredura automática das 200 não equivale à certificação de todos os 200 conteúdos.

## Alterações autorizadas ao OpenCode

1. Aplicar literalmente apenas os 56 campos `explanation` do arquivo JSON.
2. Corrigir o quadro "Depois da correção" da IA Auditoria para exibir a resolução ATUAL (`q.explanation`) na comparação; preservar o `patch.after` histórico com rótulo distinto e sem confundi-lo com a versão atual.
3. Manter quebras de parágrafo e escapar HTML, sem renderizar `**` literalmente nas explicações atuais.
4. Manter gabaritos, enunciados, alternativas, imagens, status e banco D1 inalterados.
5. Testar a visualização da questão q14 e de outras amostras dos 56; conferir texto exato do pacote.
6. Executar `validate-bank`, testes e build, commit/push em branch de revisão, sem merge, deploy nem aprovação automática.
