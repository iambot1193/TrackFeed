# Architectural Decision Records (ADR)

Este documento registra as decisões técnicas tomadas durante o desenvolvimento do TrackFeed.

## ADR 01: Escolha da Stack (Next.js + Prisma)
- **Contexto**: Necessidade de desenvolver uma aplicação Full-stack com autenticação, banco de dados e integração de API externa em 7 dias.
- **Decisão**: Utilizar **Next.js (App Router)** com **TypeScript** e **Prisma ORM**.
- **Motivo**: O Next.js permite gerenciar o frontend e o backend no mesmo repositório de forma eficiente. O Prisma facilita a manipulação do banco de dados com segurança de tipos.

## ADR 02: Banco de Dados (PostgreSQL via Supabase)
- **Contexto**: Rapidez no setup inicial e necessidade de um banco escalável para produção.
- **Decisão**: Utilizar **PostgreSQL (Supabase)** desde o ambiente de desenvolvimento, com conexão gerenciada via Prisma ORM e variável `DATABASE_URL`.
- **Motivo**: A migração de SQLite para PostgreSQL foi concluída durante a Sprint 7. O Supabase oferece infraestrutura gratuita, pooler nativo (pgbouncer) e painel de administração visual — eliminando a necessidade de SQLite local.

## ADR 03: Estilização (Tailwind CSS + Shadcn/UI)
- **Contexto**: Necessidade de uma interface profissional e responsiva com foco em UX.
- **Decisão**: **Tailwind CSS** para estilos utilitários e **Shadcn/UI** para componentes de interface.
- **Motivo**: Permite criar uma interface "premium" rapidamente com componentes acessíveis e customizáveis.

## ADR 04: Segurança da API Key
- **Contexto**: O desafio proíbe a exposição de chaves de API no frontend.
- **Decisão**: Toda integração com a NewsAPI será feita através de **Server Actions** ou **API Routes** do Next.js.
- **Motivo**: Garante que a chave da API permaneça apenas no servidor, protegida em variáveis de ambiente.

## ADR 05: Organização Modular
- **Decisão**: Uso de arquitetura baseada em **Features** no frontend e separação de **Services** no backend.
- **Motivo**: Melhora a legibilidade do código e separa a lógica de negócio (consumo de API) da lógica de apresentação.

## ADR 06: Alta Disponibilidade Híbrida (Motor de Notícias)
- **Contexto**: A NewsAPI possui limite estrito de paginação na camada gratuita (max: pág 5).
- **Decisão**: Implementar fluxo de fallback em 3 camadas: `NewsAPI (Titular)` -> `GNews (Reserva)` -> `Prisma DB (Cofre)`.
- **Motivo**: Garante que a aplicação nunca apresentará uma tela vazia por limite de cota de terceiros.

## ADR 07: Categorização Semântica com Inteligência Artificial
- **Contexto**: O sistema de palavras-chave (`string.includes`) gera falsos negativos em manchetes abstratas.
- **Decisão**: Integrar dois modelos **Google Gemini** para tarefas distintas:
  - **`gemini-2.0-flash`**: Classificação semântica em lote de notícias (função `categorizeBatchWithAI` em `src/lib/news.ts`).
  - **`gemini-1.5-flash`**: Resumo de notícias individuais sob demanda (função `summarizeArticle`).
- **Motivo**: Custo virtualmente nulo para alta precisão, garantindo um feed "Descobrir" perfeitamente taggeado com cores. A classificação roda uma única vez e é persistida no banco.

## ADR 08: Confiança na API e Regras Puristas
- **Contexto**: O usuário exigiu total fidelidade ao selecionar tags específicas, abolindo a visualização de categorias cruzadas (fillers).
- **Decisão**: Implementar lógica de *Confiança Direta*, forçando as notícias a herdarem a tag pesquisada e impedindo que o front-end tente completar lacunas com assuntos não solicitados.
- **Motivo**: Priorizar a intenção do usuário acima do preenchimento estético da tela.
