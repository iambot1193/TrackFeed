# 🎓 Masterclass TrackFeed: Da Simplificação ao Deploy Profissional

Esta aula foi desenhada para transformar você em um mestre da arquitetura do **TrackFeed**, entendendo não apenas *como* o código funciona, mas *por que* ele foi feito dessa forma.

---

## 🏗️ Parte 1: O Que Poderia Ser Simplificado?
Antes de mergulharmos no código atual, vamos analisar como poderíamos ter feito o projeto de forma ainda mais simples (ideal para um MVP ou protótipo rápido):

1.  **Menos Modelos no Banco**: Em vez de ter uma tabela para `Category`, poderíamos ter usado apenas uma lista fixa (`Enum` ou `String[]`) no código. Isso eliminaria erros de sincronização de tabelas.
2.  **Auth sem Senha (Magic Links)**: Poderíamos usar serviços como o NextAuth.js com envio de e-mail por link. Isso removeria toda a lógica de `passwordHash`, `bcrypt` e `verify-email`.
3.  **Client-Side Fetching**: Em vez de buscar notícias no servidor (`page.tsx`), poderíamos buscar direto no navegador. Isso tornaria a Dashboard mais rápida para carregar inicialmente, embora pior para o SEO.
4.  **Estilização Centralizada**: O uso de bibliotecas de componentes prontos (como Shadcn completo) evita escrever CSS personalizado, o que acelera o design mas diminui a exclusividade visual.

---

## 📂 Parte 2: Anatomia do Projeto (Arquivo por Arquivo)

### 1. A Camada de Dados (`prisma/schema.prisma`)
O coração do projeto. Aqui definimos os "moldes" das informações.
*   **User**: Guarda nome, e-mail e segurança.
*   **Preference**: O elo entre o usuário e seus interesses.
*   **CachedArticle**: Nossa "biblioteca local" de notícias. É aqui que salvamos as notícias para evitar depender 100% da API.
*   **Category**: Onde guardamos as palavras-chave que a IA/Algoritmo usa para identificar temas.

### 2. O Cérebro das Notícias (`src/lib/news.ts`)
Este é o arquivo mais complexo e importante. Ele gerencia o fluxo de **Alta Disponibilidade**:
**Cache Local Ultra-Recente ➡️ NewsAPI ➡️ GNews (Failover) ➡️ Banco de Dados Offline**.

As funções principais são:
*   **`categorizeBatchWithAI`**: O diferencial do projeto. Pega pacotes de dezenas de notícias genéricas e usa o modelo **Google Gemini** para entender o contexto e carimbar a tag correta (ex: Design, IA, Crypto) em cada uma.
*   **A "Confiança na API"**: Uma regra arquitetural onde, se o usuário clica numa tag específica (ex: Música), o sistema confia cegamente que as notícias trazidas da API pertencem a essa tag, ignorando o filtro por palavras-chave. Isso garante um feed sempre robusto.
*   **`fetchNewsWithFilters`**: A função orquestradora. Ela garante que, no mínimo, 6 notícias sempre serão exibidas na tela, preenchendo falhas da API com dados salvos no banco.

### 3. A Interface Viva (`src/app/dashboard/DashboardClient.tsx`)
Um componente gigante e interativo que gerencia:
*   **Filtros**: Quando você clica em uma tag, ele atualiza a URL.
*   **Sidebar**: Navegação fluida entre "Meu Feed", "Descobrir" e "Favoritos".
*   **News Cards**: O design "Premium" das notícias com efeitos de hover e imagens vibrantes.

### 4. O Servidor (`src/app/dashboard/page.tsx`)
Ele é quem recebe o pedido do navegador, lê o banco de dados e as APIs (usando o `news.ts`) e entrega as informações prontas para o `DashboardClient` renderizar.

---

## 🚀 Parte 3: Deploy Online e Comandos de Terminal

### 📦 Como Colocar Online (Vercel)
1.  **Conexão**: O projeto é conectado ao GitHub.
2.  **Variáveis de Ambiente**: No painel da Vercel, você deve configurar as chaves:
    *   `DATABASE_URL`: Link do Supabase.
    *   `NEWS_API_KEY`: Sua chave do NewsAPI.
    *   `RESEND_API_KEY`: Para envio de e-mails.
3.  **Comando de Deploy**:
    *   `vercel.cmd --prod`: Empurra as mudanças locais direto para o site oficial.

### ⌨️ Dicionário de Comandos Essenciais

| Comando | O que faz? | Quando usar? |
| :--- | :--- | :--- |
| `npm run dev` | Inicia o site no seu computador. | Durante toda a fase de criação. |
| `npx prisma db push` | Sincroniza o código com o banco de dados. | Sempre que mudar o `schema.prisma`. |
| `npx prisma generate` | Atualiza o "vocabulário" do Prisma. | Após mudar o banco ou instalar dependências. |
| `npx tsx scratch/master-seed.ts` | Injeta notícias de teste no banco. | Se o feed estiver vazio e você quiser testar. |
| `node check-db-quota.js` | Consulta as cotas de API restantes no banco de dados. | Sempre que quiser conferir se o GNews ou NewsAPI estourou o limite. |
| `vercel.cmd --prod` | Atualiza o site na internet. | Sempre que terminar uma correção ou recurso novo. |

### 📊 Como Auditar e Monitorar Cotas de API

Para evitar surpresas com limites de requisições esgotadas nas APIs de notícias gratuitas (GNews e NewsAPI), criamos um utilitário de auditoria rápida na raiz do projeto chamado `check-db-quota.js`.

Você pode rodá-lo a qualquer momento no seu terminal:
```bash
node check-db-quota.js
```

#### 📝 Código Fonte do Utilitário (`check-db-quota.js`)
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const status = await prisma.apiStatus.findUnique({ where: { id: "singleton" } });
  console.log("\n=== API QUOTA STATUS IN DATABASE ===");
  if (!status) {
    console.log("Nenhum registro de apiStatus encontrado no banco.");
  } else {
    console.log(`NewsAPI Quota Restante: \${status.newsApiQuota}`);
    console.log(`GNews Quota Restante: \${status.gnewsQuota}`);
    console.log(`Última Atualização: \${status.lastUpdated}`);
  }
  console.log("=====================================\\n");
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Erro ao verificar cota no banco:", err);
  process.exit(1);
});
```

---

## 💡 Dica Final do Professor
Mantenha o seu código **normalizado**. Se o banco espera minúsculas, garanta que o frontend envie minúsculas. A maioria dos erros de "dados que não aparecem" vem de uma letra maiúscula onde não deveria estar!

---
*TrackFeed Masterclass - Versão 1.0*
