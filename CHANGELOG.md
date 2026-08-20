# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [2.1.0] — 2026-08-20

Rodada de endurecimento de segurança, qualidade de código e documentação. Todas as mudanças foram validadas com `tsc`, `eslint`, build de produção, um self-check da assinatura de sessão, um smoke test ponta a ponta no navegador e um pentest básico contra um Postgres local.

### Segurança

- **Sessão assinada por HMAC** substituindo o cookie `userId` cru: o valor passa a carregar `userId`, versão da sessão e timestamp de emissão, tudo assinado (`src/lib/session.ts`). Um cookie forjado ou assinado com outro segredo é rejeitado.
- **Expiração de sessão validada no servidor**, não apenas pelo `maxAge` do navegador.
- **Revogação de sessão via `sessionVersion`**: trocar a senha (perfil ou reset) invalida as sessões antigas; a sessão atual é reemitida.
- **Rate limit de login** (`LoginAttempt`): 5 falhas por identificador travam por 15 min, persistido no banco. Falhas contadas para usuário inexistente e senha errada, sem abrir enumeração. Limpeza oportunista dos registros expirados.
- **Correção de bypass de verificação de e-mail**: trocar o e-mail agora descarta o código de verificação pendente, que fora enviado ao endereço antigo.
- **Mensagens genéricas** em login e recuperação de senha (não revelam existência da conta).
- **Validação nos trust boundaries**: `updateUserProfile` revalida nome, e-mail, senha e categorias com os schemas Zod compartilhados; e-mail normalizado para minúsculas; guardas contra apagar todas as preferências.
- **Middleware** protege as rotas privadas com checagem de assinatura no edge; a checagem autoritativa de versão fica nas Server Actions.
- **Headers de segurança HTTP** em `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` desativado.

### Adicionado

- `src/lib/session.ts`, `src/lib/verification.ts`, `src/lib/preferences.ts` — módulos compartilhados que eliminam lógica duplicada entre a dashboard e as telas dedicadas.
- `src/middleware.ts` — proteção de rotas.
- Cooldown de 60s no reenvio de código de verificação.
- CI em `.github/workflows/ci.yml` (lint + typecheck + self-check).
- `scripts/session-selfcheck.mjs` (`npm run test:session`) — cobre ida-e-volta, cookie adulterado, versão forjada, expiração e segredo errado.
- `LICENSE`.

### Alterado

- **Refactor de `DashboardClient.tsx`**: 1475 → ~1147 linhas. Componentes `PremiumNewsCard`, `ProfileSection`, `NewsSkeletonGrid`, `HistoryStats` e `EmptyState` extraídos para arquivos próprios; `tagColors`/`ALL_POSSIBLE_CATEGORIES` movidos para `categories.ts`.
- **`src/lib/news.ts`**: query morta removida, cota de API agora usa `decrement` atômico (corrige race condition), catches silenciosos passaram a logar, payloads das APIs externas tipados.
- Expiração do código de verificação: 24h → 10 min.
- Documentação sincronizada (`docs/api-design.md`, `docs/desafio.md`, `docs/database-schema.md`, `docs/command_helper.md`, README).
- Warnings de lint: 71 → 37 (restantes são `any` de props e `<img>`, aceitos como débito).

### Removido

- Feature morta "AI Smart Digest" (estado, handler, action e endpoint Gemini órfão).
- `deleteAccountAction` simplificado para usar o `onDelete: Cascade` do schema em vez de deletar cada relação manualmente.
- Colunas/props sem uso e imports mortos.
