# 🛠️ TrackFeed: Command Helper & Terminal Guide

Este guia é a sua central de referência rápida para gerenciar o ecossistema do **TrackFeed**. Ele contém todos os comandos essenciais para desenvolvimento local, banco de dados, testes, e publicação (deploy).

---

## ⌨️ 1. Comandos de Desenvolvimento Local

Use estes comandos no dia a dia para rodar o projeto localmente no seu computador.

| Comando | Descrição | Quando usar? |
| :--- | :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento local. | Ao programar e testar recursos em tempo real. |
| `npm run build` | Compila o projeto Next.js para produção. | Para verificar se existem erros de digitação, TypeScript ou build. |
| `npx next start` | Inicia o servidor local de produção. | Após rodar o build, para testar a performance final localmente. |

---

## 🗄️ 2. Gerenciamento de Banco de Dados (Prisma)

Estes comandos realizam a comunicação entre o seu código e o banco de dados PostgreSQL (Supabase).

| Comando | Descrição | Quando usar? |
| :--- | :--- | :--- |
| `npx prisma db push` | Sincroniza o arquivo `schema.prisma` com o banco online. <br>*(⚠️ Requer arquivo `.env` configurado com `DATABASE_URL` ativo).* | Sempre que adicionar, remover ou alterar tabelas ou campos no banco. |
| `npx prisma generate` | Regenera o cliente TypeScript do Prisma. | Após atualizar tabelas do banco ou instalar novas dependências. |
| `npx prisma studio` | Abre um painel administrativo visual no navegador (`http://localhost:5555`). | Para visualizar, criar, editar ou excluir registros do banco de dados manualmente. |

---

## 🧪 3. Scripts de Teste e Alimentação (Seed)

Scripts utilitários para popular dados ou conferir limites de chamadas de APIs externas.

| Comando | Descrição | Quando usar? |
| :--- | :--- | :--- |
| `node scripts/check-db-quota.js` | Consulta o status e limites restantes das APIs de notícias. | Sempre que desconfiar que o limite diário da NewsAPI ou GNews acabou. |
| `npx tsx scripts/re-tag.ts` | Reclassifica via Gemini todos os artigos já cacheados no banco. | Depois de mexer nas categorias/keywords, para recategorizar o acervo existente. |

---

## 🚀 4. Publicação e Deploy (Vercel)

Comandos para colocar as suas alterações online para os usuários finais.

| Comando | Descrição | Quando usar? |
| :--- | :--- | :--- |
| `npx vercel` | Faz um deploy de visualização (Ambiente de Teste/Preview). | Para gerar um link temporário e testar o app online antes de ir para a versão oficial. |
| `npx vercel --prod` | Envia as atualizações diretamente para o site oficial (Ambiente de Produção). | Quando as alterações locais estiverem 100% testadas e prontas. |

---

## 💡 Dicas e Soluções Rápidas de Terminal

### 🔴 O Prisma diz "EPERM: operation not permitted"
Isso acontece no Windows quando você tenta rodar `prisma generate` enquanto o servidor `npm run dev` está ativo (pois ele trava os arquivos do driver). 
* **Solução:** Feche o terminal do `npm run dev` (Ctrl + C) e depois execute o comando do Prisma.

### 🟢 Como rodar o utilitário de cotas
Basta executar na raiz do projeto:
```bash
node scripts/check-db-quota.js
```
O console exibirá um relatório formatado das cotas salvas no banco de dados.
