# Contexto do projeto FIXOU

## Objetivo e arquitetura

O FIXOU é um aplicativo independente de preparação para a FUVEST 2027. O frontend usa JavaScript modular sem framework e scripts/build.mjs gera dist/index.html. O Worker server/index.mjs entrega o aplicativo e implementa a API. O conteúdo educacional fica em content/.

O backend foi preparado para D1 no binding DB e object storage no binding AVATARS. A migration canônica é drizzle/0000_accounts_analytics.sql; db/schema.ts documenta as tabelas.

## Contas e segurança

Cadastro e login usam e-mail e senha. Senhas recebem PBKDF2-SHA-256 com salt aleatório e 210 mil iterações. Sessões usam tokens aleatórios guardados somente como hash no banco e cookie HttpOnly, Secure e SameSite Strict. Roles: student, admin e owner; plano inicial: free.

O primeiro owner é criado por POST /api/admin/bootstrap, somente quando ainda não existe owner e OWNER_BOOTSTRAP_SECRET coincide com o ambiente. Endpoints /api/admin verificam sessão e role no backend. Segredos não ficam no repositório.

## Progresso, perfil e avatar

src/save.js mantém cache local, valida backups e preserva preferências. Após login, o estado crítico também é salvo em user_progress. A primeira sincronização migra o estado local quando ele é mais novo. server_revision detecta alterações concorrentes e recusa sobrescrita silenciosa com HTTP 409; o cliente, ao receber o conflito, busca o estado remoto, adota-o se for mais novo e refaz o envio uma única vez. O limite sincronizado é 1,5 MB (abaixo do teto da célula do banco).

Avatares JPG, PNG e WEBP de até 5 MB têm MIME e assinatura validados no backend. O objeto usa chave aleatória em AVATARS, e users guarda apenas a referência. Substituir ou remover exclui o objeto anterior. Sem foto, a interface mostra iniciais.

## Aprendizagem e conteúdo

src/training.js cria sessões e registra respostas. src/reviews.js trata revisão espaçada. src/mastery.js é a única fonte da fórmula de domínio; itens needsReview não entram no treino nem alteram domínio. src/screens-library.js contém Programa 2027, Cofre, favoritos e leituras.

O banco atual tem 3.384 questões e 228 conceitos. Física possui 3.334 questões preservadas; 552 estão ativas e 2.782 aguardam revisão. Biologia mantém 50 questões.

## Analytics e admin

Eventos autenticados são gravados em analytics_events. Tipos aceitos formam lista fechada; metadata é reduzido e limitado. Chaves idempotentes impedem repetição de eventos críticos.

Usuário ativo significa atividade real de estudo ou navegação relevante. DAU, WAU e MAU usam janelas próprias de 24 horas, 7 dias e 30 dias. Presença usa last_activity_at e heartbeat de cinco minutos somente com a página visível.

Retenção usa coortes elegíveis: D1 mede retorno no dia seguinte; D7 mede retorno entre os dias 1 e 7; D30 mede retorno entre os dias 1 e 30. Coortes jovens mostram que ainda não há dados suficientes.

O painel mostra dados reais, séries diárias (ativos e novos; questões com respondidas, corretas, incorretas e puladas), funis por usuários únicos, usuários com modal de detalhes por usuário, relatos agrupados e sugestões. Mudanças de status geram admin_audit_logs. A lista visual é limitada, mas as métricas globais usam o banco completo.

## Pastas

- content: questões, currículo, livros, licenças e lotes.
- src: aplicação e telas.
- server: API e Worker.
- drizzle e db: migrations e contrato do schema.
- styles: Design System e responsividade.
- scripts: build, validação e importadores.
- tests: regressão, conteúdo, servidor e contas.
- dist: saída gerada.

## Executar e testar

Use Node.js 22 ou superior. Execute npm run build, npm test e npm start. O servidor local abre em http://127.0.0.1:4187. Contas persistentes exigem runtime com bindings equivalentes a D1 e R2.

## Pendências conhecidas

- Não existe Tutor com IA, pagamento ou plano Pro funcional.
- Fotos não recebem recorte nem remoção de EXIF; object-fit cover mantém a apresentação.
- O estado educacional continua como JSON versionado; normalização será necessária em grande escala.
- Bindings, migrations e deploy da hospedagem pertencem a outra etapa.
