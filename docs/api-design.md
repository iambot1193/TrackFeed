# 🔌 Design de Comunicação (Server Actions) - TrackFeed

O TrackFeed aboliu o uso de API Routes (REST `/api/*`) tradicionais em favor de **Next.js Server Actions** e **Server Components**. Isso garante comunicação direta, fortemente tipada e segura (sem expor endpoints ou chaves de API para o navegador).

---

## 🧠 1. Módulo Central de Notícias (`src/lib/news.ts`)

Responsável pela lógica pesada de integração e caching (NewsAPI, GNews, The Guardian, Gemini AI e Prisma). 
*Estas são funções executadas puramente no lado do servidor:*

*   **`fetchNewsWithFilters(options)`**: Função Core do motor. Executa a orquestração do backup triplo (failover) e categorização semântica via modelo de Inteligência Artificial Google Gemini.
*   **`getApiStatus()`**: Consulta o banco e retorna o status atualizado e cotas restantes da NewsAPI e GNews.

---

## 👤 2. Ações de Dashboard e Usuário (`src/app/dashboard/actions.ts`)

Lida com todas as interações executadas pelo cliente autenticado. Todas as ações resolvem a sessão via `getSessionUserId()` (`src/lib/session.ts`), que valida a assinatura HMAC do cookie, a expiração e a versão da sessão no banco antes de devolver o `userId`.

*   **`toggleFavorite(article)`**: Adiciona ou remove uma notícia da coleção de favoritos do usuário.
*   **`getUserFavorites(userIdParam)`**: Retorna a lista completa de artigos favoritados pelo usuário.
*   **`addToHistory(data)`**: Registra o log de leitura de um artigo no histórico, incluindo incremento de contadores (`clickCount`).
*   **`updateUserProfile(data)`**: Atualiza dados pessoais básicos (Nome, Avatar) ou credenciais críticas (Senha e E-mail) sob revalidação por senha atual.
*   **`updateUserPreferences(categories)`**: Substitui as categorias e interesses selecionadas pelo usuário no perfil.
*   **`deleteAccountAction(password)`**: Exclui permanentemente todos os registros do usuário (perfil, favoritos, histórico e preferências) em cascata no banco.
*   **`getApiStatusAction()`**: Ação envelopadora usada pelo client-side para atualizar cotas na UI em tempo real.
*   **`logout()`**: Remove o cookie de sessão (`session`) do navegador e desconecta o usuário.
*   **`resendVerificationEmailAction()`**: Gera um novo PIN numérico de 6 dígitos e despacha para o e-mail do usuário via Resend.
*   **`verifyEmailInDashboardAction(code)`**: Confirma o PIN de verificação de conta digitado pelo usuário diretamente no modal da dashboard.

---

## 🔒 3. Ações de Autenticação e Fluxo de Entrada

Para manter o código desacoplado e modular, as Server Actions de autenticação foram distribuídas próximas de suas respectivas rotas/telas de origem:

### A. Autenticação de Login (`src/app/login-actions.ts`)
*   **`loginUser(prevState, formData)`**: Autentica o usuário validando o hash da senha via `bcryptjs` e emite o cookie de sessão assinado (HMAC) contendo `userId`, versão da sessão e timestamp de emissão.

### B. Registro de Conta (`src/app/register/actions.ts`)
*   **`registerUser(prevState, formData)`**: Valida a complexidade da senha, cria a conta do usuário no banco com status pendente de verificação, gera um PIN numérico e despacha o e-mail de boas-vindas e confirmação via Resend.

### C. Verificação de E-mail (`src/app/verify-email/actions.ts`)
*   **`verifyEmail(prevState, formData)`**: Checa se o código PIN enviado bate com o do banco de dados para ativar formalmente a conta.
*   **`resendVerificationAction()`**: Reenvia o e-mail de validação para o usuário logado (com cooldown de 60s entre pedidos).

---

## 🧩 4. Módulos Compartilhados (`src/lib/`)

Lógica reaproveitada entre rotas, para que a dashboard e as telas dedicadas não mantenham cópias divergentes das mesmas regras:

*   **`session.ts`**: Emissão e validação do cookie de sessão assinado (`createSessionValue`, `verifySessionValue`, `getSessionUserId`, `setSessionCookie`, `clearSessionCookie`).
*   **`verification.ts`**: Regras de verificação de e-mail (`verifyEmailCode`, `resendVerificationCode`) — expiração, limite de tentativas e cooldown de reenvio.
*   **`preferences.ts`**: Whitelist de categorias válidas e escrita de preferências (`sanitizeCategories`, `setUserPreferences`).
*   **`validations.ts`**: Schemas Zod de registro, login, recuperação e redefinição de senha.

> `src/middleware.ts` faz uma checagem rápida de assinatura/expiração nas rotas privadas (edge runtime, sem acesso ao banco); a checagem autoritativa de versão de sessão acontece em `getSessionUserId`.
