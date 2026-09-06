# Validação da primeira versão — 06/09/2026

A retomada começou pela inspeção dos arquivos existentes, validação dos JSONs, sintaxe e imports, execução local e conferência do console. A interface existente abria, mas a integração das ações e o build estavam incompletos. A arquitetura modular, o conteúdo e a identidade visual foram preservados e essas etapas foram concluídas. Nenhum arquivo dos projetos antigos foi alterado nesta retomada.

## Automação

15 testes de comportamento e integridade passam em `npm test`. Abrangem:

- 338 IDs de questões únicos, 13 disciplinas, duas questões por conceito e referências existentes no mapa;
- mínimos de conteúdo: 50 Biologia, 84 Geometria plana com diagramas, 60 Energia/dinâmica/trabalho e 54 Geomorfologia;
- todos os formatos e respostas esperadas, alternativas distintas e explicações presentes;
- perfil, exportação, importação, recuperação de cópia anterior e rejeição de backups incompletos;
- XP, proteção contra repetição de recompensa, domínio, falso domínio, revisão e estatísticas;
- limites de domínio por confiança, variedade e dias, além de decaimento temporal;
- intervalos de memória, antecipação após chute e preservação da recompensa diária do cartão;
- sequência por dias de calendário, filtros, variações e prioridade de falso domínio;
- três vidas, prazo do Relâmpago e finalização sem duplicar registros;
- simulação de todo o banco (338 respostas) e reimportação do histórico completo.

O build passa pela análise sintática do JavaScript agrupado. Não há dependências externas de JavaScript para instalar.

## Testes no navegador

Executados no navegador do aplicativo, usando tanto o código modular quanto `dist/index.html` servido por HTTP:

| Fluxo | Resultado observado |
| --- | --- |
| Criar e editar perfil | Nome, objetivo e meta diária salvos |
| Acerto objetivo | Cinema: R$ 9.000, +15 XP, domínio inicial 22% |
| Erro com certeza | Horta: resposta 500, correta 450, falso domínio no Cofre |
| Recuperar conceito | Outra questão do conceito e dois acertos sem chute marcaram fraqueza superada |
| Ordenação | Cadeia de eutrofização ordenada pelas setas e corrigida como certa |
| Associação | Componentes do crescimento populacional associados e corrigidos |
| Resposta curta com chute | Empirismo aceito; domínio permaneceu baixo |
| Verdadeiro ou falso | Deriva genética corrigida com feedback |
| Flashcards | Mostrar resposta, Esqueci (10 min) e Lembrei (1 dia), revisão salva |
| Relâmpago | Cronômetro terminou automaticamente; um acerto virou recorde |
| Sobrevivência | Vidas 3 → 2 → 1 → 0; resultado 0/3 após erros deliberados |
| Estatísticas | 12 respostas: 8 acertos, 4 erros, 67%; 2 revisões e histórico de sessões coerentes |
| Pausa e carregamento | Número digitado, confiança e ordem parcial dos itens restaurados |
| Backup real | JSON exportado, reimportado pela interface e recarregado com 12 respostas e 78 XP |
| Busca e filtros | Arrhenius, tipos de questão, mapa por energia e referências curriculares |
| Favoritos | Explicação guardada e exibida na seção correta |
| Leituras | Nove obras; andamento “Estou lendo” persistiu ao recarregar |
| Treino do Dia | Meta de 10 questões aplicada; retomada na versão de distribuição |
| Celular | 390 × 844: home, menu, questões e mapa sem rolagem horizontal da página |
| Console | Nenhum erro ou aviso de aplicação observado nos fluxos testados |

Foram corrigidos: integração de menus e botões, build ausente, declaração inválida no layout de livros, perda de marcador de recompensa nas revisões, prioridade insuficiente de falso domínio, aceitação de backups estruturalmente incompletos, contraste de textos auxiliares e renderização visual de diagramas geométricos. A versão de distribuição agrupa o conteúdo e não carrega arquivos JavaScript externos.

## Limites desta validação

Os testes de dados não substituem revisão pedagógica independente de cada questão. A primeira versão foi exercitada no navegador disponível, incluindo largura de celular; aparelhos físicos e outros navegadores ainda precisam de uma rodada específica. A abertura direta por arquivo é oferecida pelo HTML autocontido, mas o fluxo automatizado foi validado por HTTP. O tempo exibido nas estatísticas corresponde às respostas enviadas e revisões avaliadas, sem contar toda a permanência na página.

IA, redação, Boss semanal, simulado completo, sincronização e materiais pessoais permanecem nas próximas etapas do plano. Não foram apresentados como implementados.
