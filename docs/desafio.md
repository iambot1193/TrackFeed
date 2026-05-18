# 🎯 Auditoria do Desafio Técnico: TrackFeed

Este documento serve como **prova de execução e mapeamento de critérios** para os avaliadores do teste técnico. Ele cruza cada requisito exigido pelo desafio com a solução implementada e aponta para os arquivos de código correspondentes.

---

## 📋 Mapeamento de Requisitos e Critérios de Avaliação

### 1. 🔐 Cadastro, Login e Autenticação
*   **Problema/Requisito:** O candidato deve criar um fluxo seguro para criação de contas, login de usuários e encerramento de sessão.
*   **Solução:** Implementamos rotas de cadastro (`/register`), login (`/`) e encerramento de sessão de forma síncrona e segura.
*   **Arquivos Responsáveis:**
    *   **Páginas e Formulários:**
        *   Cadastro: [src/app/register/page.tsx](../src/app/register/page.tsx)
        *   Login: [src/app/page.tsx](../src/app/page.tsx)
    *   **Server Actions de Autenticação:**
        *   Registrar usuário: [src/app/register/actions.ts](../src/app/register/actions.ts)
        *   Autenticar usuário: [src/app/login-actions.ts](../src/app/login-actions.ts)
        *   Efetuar logout: [src/app/dashboard/actions.ts:L31-L36](../src/app/dashboard/actions.ts#L31-L36) (`logout`)

---

### 2. 🛡️ Segurança e Armazenamento de Senhas (Hashing)
*   **Problema/Requisito:** Senhas nunca podem ser armazenadas em texto puro no banco de dados para evitar vazamentos e invasões.
*   **Solução:** Uso do algoritmo `bcryptjs` de hashing com custo de criptografia `10` para encriptar todas as senhas criadas e redefinidas. As comparações são realizadas de forma assíncrona no servidor.
*   **Arquivos Responsáveis:**
    *   **Geração de Hash no Cadastro:** [src/app/register/actions.ts:L33](../src/app/register/actions.ts#L33) (`bcrypt.hash(password, 10)`)
    *   **Comparação no Login:** [src/app/login-actions.ts:L45](../src/app/login-actions.ts#L45) (`bcrypt.compare(password, user.passwordHash)`)
    *   **Validação na Alteração de Dados:** [src/app/dashboard/actions.ts:L157-L177](../src/app/dashboard/actions.ts#L157-L177) (Exige a senha atual do usuário, hasheada, para autorizar alterações críticas)

---

### 3. 🚧 Proteção de Rotas e Persistência de Sessão
*   **Problema/Requisito:** Bloquear o acesso de usuários anônimos ao Dashboard ou áreas privadas.
*   **Solução:** Criação de um sistema de sessão baseado em cookies `HTTP-Only`. O cookie `userId` é gravado no navegador com propriedades de segurança restritas. A página principal do Dashboard intercepta e valida a existência desse cookie antes de renderizar qualquer elemento.
*   **Arquivos Responsáveis:**
    *   **Validação na Entrada do Dashboard:** [src/app/dashboard/page.tsx:L18-L21](../src/app/dashboard/page.tsx#L18-L21) (Redireciona para o login se `userId` for nulo)
    *   **Gravação do Cookie no Login:** [src/app/login-actions.ts:L49-L56](../src/app/login-actions.ts#L49-L56) (Define o cookie com `httpOnly: true`, `secure: production` e expiração de 7 dias)

---

### 4. 🎯 Escolha e Edição de Interesses (Preferências)
*   **Problema/Requisito:** O usuário deve ser capaz de selecionar seus tópicos de interesse (ex: Tecnologia, Esportes, Negócios) e editá-los a qualquer momento.
*   **Solução:**
    *   **Onboarding:** Ao se cadastrar, o usuário passa pela tela de escolha de interesses obrigatória. Se tentar acessar o Dashboard sem ter nenhum interesse salvo, o sistema o redireciona automaticamente de volta.
    *   **Edição no Dashboard:** Na aba "Perfil", o usuário pode marcar/desmarcar interesses em tempo real e atualizar a lista instantaneamente com feedback visual.
*   **Arquivos Responsáveis:**
    *   **Onboarding de Preferências:** [src/app/interests/page.tsx](../src/app/interests/page.tsx)
    *   **Redirecionamento Preventivo:** [src/app/dashboard/page.tsx:L54-L55](../src/app/dashboard/page.tsx#L54-L55) (Bloqueia dashboard se `user.preferences.length === 0`)
    *   **Atualização de Interesses:** [src/app/dashboard/actions.ts:L85-L107](../src/app/dashboard/actions.ts#L85-L107) (`updateUserPreferences`)
    *   **Interface de Edição:** [src/app/dashboard/DashboardClient.tsx:L1329-L1347](../src/app/dashboard/DashboardClient.tsx#L1329-L1347) (Lista de interesses do perfil)

---

### 5. 🔌 Consumo de APIs e Resiliência Híbrida (Triple Failover)
*   **Problema/Requisito:** Consumir notícias de uma API externa para montar o feed.
*   **Solução:** Criamos um motor de busca com **tripla camada de tolerância a falhas**. O sistema tenta consumir a **NewsAPI.org** (Titular). Se ela falhar (limite de cota atingido ou instabilidade), a chamada avança automaticamente para a **GNews.io** (Reserva). Se ambas falharem, o sistema consome os artigos de fallback offline salvos no banco local (`CachedArticle`). Além disso, artigos do inglês usam a **The Guardian API**.
*   **Arquivos Responsáveis:**
    *   **Motor Orquestrador:** [src/lib/news.ts](../src/lib/news.ts)
    *   **Busca com Fallback:** [src/lib/news.ts:L157-L230](../src/lib/news.ts#L157-L230) (`fetchNewsWithFilters`)
    *   **Chamadas NewsAPI:** [src/lib/news.ts:L240-L290](../src/lib/news.ts#L240-L290) (`fetchFromNewsApi`)
    *   **Chamadas GNews:** [src/lib/news.ts:L295-L330](../src/lib/news.ts#L295-L330) (`fetchFromGNews`)
    *   **Chamadas The Guardian:** [src/lib/news.ts:L335-L370](../src/lib/news.ts#L335-L370) (`fetchFromTheGuardian`)

---

### 6. 🔐 Segurança de Chaves e Variáveis de Ambiente
*   **Problema/Requisito:** As chaves privadas das APIs nunca devem vazar para o navegador do cliente.
*   **Solução:** Isolamento absoluto. Toda a busca de notícias e processamentos externos são feitos do lado do servidor através de Next.js **Server Actions** e chamadas de API internas (`fetch` do Node.js). O cliente apenas chama a função do servidor e recebe o JSON puro tratado. As variáveis de ambiente do arquivo `.env` nunca são prefixadas com `NEXT_PUBLIC_` (exceto a chave do reCAPTCHA).
*   **Arquivos Responsáveis:**
    *   **Configurações de Ambiente:** [.env.example](../.env.example) (Configuração das variáveis no escopo privado)
    *   **Motor de Backend:** [src/lib/news.ts](../src/lib/news.ts) (Roda 100% no servidor, consumindo `process.env`)
    *   **Server Actions do Painel:** [src/app/dashboard/actions.ts](../src/app/dashboard/actions.ts) (Camada segura que conecta o cliente ao backend)

---

### 7. 🏷️ Purismo do Feed Personalizado por Preferências
*   **Problema/Requisito:** O feed principal do usuário deve trazer notícias correspondentes *exclusivamente* aos interesses que ele configurou.
*   **Solução:** Criamos uma regra lógica rígida chamada "Purista". O banco de dados armazena as preferências do usuário. Ao chamar `fetchNewsWithFilters`, o motor constrói uma query composta contendo as palavras-chave correspondentes apenas às categorias ativas. Para garantir que nenhuma notícia externa vaze, os artigos passam por uma classificação rigorosa (classificação rápida por heurística + classificação semântica com Inteligência Artificial via Google Gemini 2.0 Flash) e são estritamente filtrados antes de ir para a tela.
*   **Arquivos Responsáveis:**
    *   **Busca Personalizada:** [src/app/dashboard/page.tsx:L176-L179](../src/app/dashboard/page.tsx#L176-L179) (Busca apenas as categorias salvas do usuário no banco)
    *   **Classificação Automática por IA:** [src/lib/news.ts:L455-L515](../src/lib/news.ts#L455-L515) (`categorizeWithGeminiBatch`)
    *   **Filtragem Rígida:** [src/lib/news.ts:L196-L200](../src/lib/news.ts#L196-L200) (Filtra a lista dedobrada pelas categorias selecionadas)

---

### 8. 📱 UI/UX Responsivo, Busca, Carregamento e Tratamentos
*   **Problema/Requisito:** A aplicação deve ser elegante, adaptável a dispositivos móveis, e tratar graciosamente carregamentos e ausência de resultados.
*   **Solução:**
    *   **Responsividade:** Desenvolvido no modelo Mobile-First usando grid dinâmico do Tailwind CSS.
    *   **Carregamento:** skeletons estruturados (`NewsSkeletonGrid`) com efeito pulsante durante as transições de carregamento.
    *   **Ausência de Resultados (Empty State):** Interface estilizada `<EmptyState />` contendo ilustrações explicativas e passos de resolução para pesquisas vazias.
*   **Arquivos Responsáveis:**
    *   **Interface Principal:** [src/app/dashboard/DashboardClient.tsx](../src/app/dashboard/DashboardClient.tsx)
    *   **Skeleton Animado:** [src/app/dashboard/DashboardClient.tsx:L1364-L1398](../src/app/dashboard/DashboardClient.tsx#L1364-L1398) (`NewsSkeletonGrid`)
    *   **Ausência de Resultados:** [src/app/dashboard/DashboardClient.tsx:L1436-L1444](../src/app/dashboard/DashboardClient.tsx#L1436-L1444) (`EmptyState`)
    *   **Barra de Pesquisa Global:** [src/app/dashboard/Header.tsx](../src/app/dashboard/Header.tsx)

---

## 🌟 Diferenciais Além do Exigido (Destaque do Projeto)

Para elevar o nível do projeto a um patamar comercializável (SaaS), incluímos funcionalidades premium adicionais:

1.  **🤖 Inteligência Artificial Híbrida:** Classificação semântica em lote usando a API do Google Gemini 2.0 Flash para rotular perfeitamente todas as notícias do "Feed Descobrir".
2.  **📧 Verificação de E-mail com PIN (2FA):** Sistema integrado com a API do **Resend** para validar contas enviando códigos numéricos temporários.
3.  **🩹 UX Inteligente com Alertas Glow:** Banners dinâmicos e avisos com brilho de aviso surgem na tela de perfil se o usuário alterar informações e esquecer de clicar em salvar.
4.  **📊 Histórico de Leitura Detalhado:** Painel com estatísticas em tempo real mostrando a distribuição de leitura por interesse baseado nos cliques do usuário.
5.  **🔐 Proteção Anti-Bot reCAPTCHA:** Formulários protegidos com Google reCAPTCHA v2 ativo em ambiente de produção.
