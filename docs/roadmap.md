# Roadmap de Desenvolvimento - TrackFeed

Acompanhamento do progresso do projeto.

## Sprint 1: Fundação & Planejamento [CONCLUÍDO]
- [x] Definição da Arquitetura e Stack.
- [x] Criação da documentação técnica (`/docs`).
- [x] Inicialização do projeto Next.js.
- [x] Configuração do Prisma e SQLite.
- [x] Modelagem inicial do Banco de Dados.

## Sprint 2: Autenticação & Preferências [CONCLUÍDO]
- [x] Implementação de Registro e Login (Segurança BCrypt).
- [x] Criação da UI de seleção de categorias.
- [x] Endpoints para salvar e recuperar preferências.

## Sprint 3: Integração & Feed [CONCLUÍDO]
- [x] Implementação do Service Multi-API (NewsAPI + GNews).
- [x] Criação do Feed Personalizado com Smart Cache.
- [x] UI de Cards de Notícias e Layout Editorial.
- [x] Tratamento de erros e loading states.

## Sprint 4: Funcionalidades Extras & Busca [CONCLUÍDO]
- [x] Barra de busca inteligente.
- [x] Sistema de Favoritos e Histórico de Leitura (Aba Lidos).
- [x] Paginação de Favoritos (15 por página).

## Sprint 5: Polimento & Setup Inicial [CONCLUÍDO]
- [x] Sistema de Perfil (Avatar, Nome, Senha, Logout).
- [x] Cérebro de Especialista para categorização Regex.
- [x] Correção de Caching de Idiomas.

## Sprint 6: A Grande Atualização (Inteligência & Purismo) [CONCLUÍDO]
- [x] Implementação de "Confiança na API" (Filtro Purista de 100% de relevância).
- [x] Integração do Google Gemini (1.5 Flash) para classificação de notícias em lote.
- [x] Delay de UX (3 Segundos) com SkeletonGrid para transição suave de categorias.
- [x] Motor de Backup Triplo (NewsAPI -> GNews -> Banco de Dados) com garantia de 6 notícias.
- [x] Atualização completa da documentação arquitetural.

**Status Final**: 100% Concluído. Projeto operando com IA Semântica e alta disponibilidade.
