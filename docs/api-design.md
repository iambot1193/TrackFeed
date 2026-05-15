# Design de Comunicação (Server Actions) - TrackFeed

O TrackFeed aboliu o uso de API Routes (REST `/api/*`) tradicionais em favor de **Next.js Server Actions** e **Server Components**. Isso garante comunicação direta, tipada e segura (sem expor endpoints ou chaves de API).

## 1. Módulo Central de Notícias (`src/lib/news.ts`)
Responsável pela lógica pesada (Integração com NewsAPI, GNews, Gemini AI e Prisma).
- **`fetchNewsWithFilters(options)`**: Função Core. Executa a orquestração de failover e classificação em lote via Inteligência Artificial.
- **`getApiStatus()`**: Retorna as cotas restantes.

## 2. Ações do Usuário (`src/app/dashboard/actions.ts`)
Todas as ações executáveis pelo cliente. Requerem que o usuário possua um cookie de sessão válido (`userId`).
- **`toggleFavorite(article)`**: Adiciona ou remove uma notícia dos favoritos do usuário.
- **`getUserFavorites(userId)`**: Retorna a lista de favoritos.
- **`addToHistory(article)`**: Registra o clique/leitura de uma notícia (Histórico).
- **`updateUserProfile(data)`**: Atualiza avatar, nome ou senha (com validação estrita).
- **`updateUserPreferences(categories)`**: Substitui as preferências selecionadas.
- **`deleteAccountAction(password)`**: Limpa todos os dados de cascata e apaga o perfil (Requer verificação da hash da senha).
- **`resendVerificationEmailAction()`**: Gera um novo código de 6 dígitos e despacha via Resend.
- **`logout()`**: Remove o cookie de sessão.

## 3. Ações de Autenticação (`src/app/actions.ts`)
- **`loginUser(email, password)`**: Autentica o usuário e injeta o cookie.
- **`registerUser(...)`**: Valida a senha contra regras rígidas e despacha o e-mail de verificação.
- **`verifyEmailAction(email, code)`**: Checa o PIN de verificação de conta.
