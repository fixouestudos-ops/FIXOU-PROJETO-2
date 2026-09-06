# FUVEST Mastery

Aplicativo independente de estudo para o Vestibular FUVEST 2027. Primeira versão funcional, com conteúdo autoral e interface em português. Não é um produto oficial da FUVEST.

## Abrir e estudar

Abra `dist/index.html` em um navegador moderno. Essa versão já contém código, conteúdo e estilos, sem instalação. O arquivo `FUVEST-Mastery.html` entregue junto do projeto contém o mesmo aplicativo. A tipografia usa fontes do sistema quando as fontes online não estão disponíveis.

Para desenvolver, use Node.js 22 ou superior:

```sh
npm start
```

Abra http://127.0.0.1:4187. Não há dependências para instalar. `npm test` executa os testes de lógica; `npm run build` gera a versão de distribuição. O build atualiza `src/catalog.js` a partir dos três arquivos JSON de conteúdo. Não edite esse catálogo gerado diretamente.

## O que está funcionando

- Perfil, objetivo, meta diária, XP, níveis, dias consecutivos e conquistas.
- 338 questões originais distribuídas por 13 disciplinas e 169 conceitos, com duas situações diferentes por conceito.
- Trilhas ampliadas: 50 questões de Biologia nos focos pedidos; 84 de Geometria plana com diagramas visuais; 60 de Energia, dinâmica e trabalho; e 54 de Geomorfologia.
- Múltipla escolha, verdadeiro ou falso, resposta numérica, ordenação, associação e resposta curta.
- Confiança antes da resposta, explicações, domínio estimado por conceito e histórico.
- Treino do Dia, quiz adaptativo, filtros, Relâmpago de 60 segundos e Sobrevivência com três vidas.
- Cofre dos Erros, prioridade para falso domínio e recuperação com duas variações acertadas sem chutar.
- 50 flashcards, repetição espaçada, busca, favoritos, estatísticas semanais e mensais.
- Mapa do programa oficial completo e fichas das nove leituras obrigatórias de 2027.
- Salvamento automático local, retomada de quizzes, exportação e importação de backups.

## Seu progresso

O progresso fica **neste navegador, neste endereço**, usando a chave `fuvest-mastery:2027:v1`. Não há conta de estudante na nuvem nem sincronização entre dispositivos. Limpar os dados do navegador ou usar navegação anônima pode remover o progresso. O acesso privado do site, quando publicado, não sincroniza os estudos.

Use **Perfil → Exportar progresso** regularmente. Para mudar de computador, navegador ou endereço, exporte no antigo e importe no novo. A importação valida o arquivo e pede confirmação antes da substituição; mantém-se uma cópia local anterior para recuperação de corrupção. Se o navegador bloquear o armazenamento, uma mensagem orienta a exportar antes de sair.

Quizzes salvam cada resposta e também o rascunho da questão em andamento. No Relâmpago o prazo continua ao sair da aba; nos outros treinos você pode pausar. O andamento do cartão atual é temporário, mas todas as revisões já avaliadas ficam salvas.

## Critérios de aprendizagem

O domínio de 0 a 100 é uma **estimativa pedagógica**, não uma nota oficial, previsão de aprovação ou diagnóstico validado. Combina acertos, erros, confiança, dificuldade, tempo, desempenho recente, variedade e dias distintos. Uma única questão limita a estimativa a 35%; um único dia, a 55%; dois dias, a 80%. Chutes corretos não constroem domínio alto. Erros com certeza recebem maior prioridade nos momentos de recuperação.

A seleção adaptativa tenta distribuir 40% de fraquezas, 30% de revisões, 20% de conceitos novos e 10% de retenção, com substituição quando um grupo não tem questões disponíveis. Prioriza outra variação do conceito e evita repetir um enunciado na mesma sessão. O banco mantém duas variações autorais por conceito e agora inclui evolução biológica, especiação, ecologia, interações, biomas, geometria plana, energia, dinâmica, trabalho e geomorfologia. Os diagramas geométricos são desenhados no próprio aplicativo.

A agenda de memória é inspirada em repetição espaçada, com avaliações Esqueci, Difícil, Lembrei e Fácil: esquecimento retorna em 10 minutos; acertos consistentes aumentam os intervalos até 365 dias; chute correto retorna em até um dia. Praticar antes do vencimento não adia continuamente a revisão. XP de uma mesma questão correta não se repete no mesmo dia, e recompensas de cartões também têm limite diário.

Respostas curtas são corrigidas por respostas aceitas, com normalização de acentos e capitalização. **Não há avaliação por inteligência artificial nesta versão.**

## Conteúdo e fontes

O mapa guarda 533 ocorrências de objetos de conhecimento (502 textos distintos), quatro orientações de redação e referências às páginas e habilidades. Repetições entre competências são preservadas nos dados. A trilha Literatura é uma organização pedagógica de objetos de Língua Portuguesa.

O mapa cobre o programa; **as 338 questões cobrem uma seleção de 169 conceitos**, não todo o programa. A interface identifica objetos sem exercício. As fichas são sínteses autorais de estudo e não substituem a leitura integral dos livros.

- [Programa oficial FUVEST 2027](https://www.fuvest.br/wp-content/uploads/fuvest2027-programa-vestibular.pdf)
- [Guia de Provas FUVEST 2027](https://www.fuvest.br/wp-content/uploads/fuvest2027-guia-provas.pdf)

O guia consultado informa 80 questões e cinco horas na primeira fase de 2027. Regras de 2028 não foram usadas. Os arquivos de conteúdo guardam fontes e a identificação de questão original; o aplicativo não apresenta questões autorais como oficiais.

## Arquitetura

| Local | Responsabilidade |
| --- | --- |
| `content/` | Banco, conceitos, livros, programa e páginas extraídas |
| `src/controller.js` | Navegação, eventos e integração das telas |
| `src/screens*.js`, `src/session-view.js`, `src/components.js` | Interface |
| `src/training.js` | Seleção, sessões, correção e registro de respostas |
| `src/mastery.js`, `src/reviews.js` | Domínio e memória |
| `src/gamification.js`, `src/statistics.js` | XP, conquistas e evolução |
| `src/save.js` | Persistência, validação, importação e backup |
| `src/config.js` | Disciplinas, formatos, origem e regras de 2027 |
| `styles/app.css` | Identidade visual e responsividade |
| `scripts/` | Servidor e build sem bibliotecas externas |
| `tests/` | Testes automatizados de integridade e comportamento |

O código-fonte é modular. O único HTML de distribuição é gerado para facilitar a abertura e a hospedagem, sem transformar o código-fonte em um arquivo monolítico.

## Próximas etapas do plano original

Após esta primeira versão: ampliar o banco e a revisão pedagógica; avaliação conceitual por IA com serviço seguro; Boss semanal; simulado completo de 80 questões sem feedback durante a prova; editor e avaliação de redação; exercícios da segunda fase; importação de materiais pessoais e eventual sincronização de dados. Esses modos não são simulados por botões sem função nesta entrega.

Para hospedagem estática, publique o conteúdo de `dist/`. O aplicativo não necessita de servidor de API, chave de IA ou banco de dados remoto nesta etapa.
