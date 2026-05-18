# TrackFeed - Cinematic AI News Dashboard 🚀

> 🌐 **Deploy de Produção:** [Acesse o TrackFeed Online (Vercel)](https://trackfeed-inspo.vercel.app)
>
> 🔑 **Acesso de Teste Rápido:**
> *   **E-mail/Usuário:** `teste@example.com` (ou crie um novo no cadastro!)
> *   **Senha:** `123456`

---

## 🖼️ Capa do Projeto

![TrackFeed Preview](./public/preview.png)

---

## 🎬 Demonstração em Vídeo & Pitch (Entregável do Desafio)

> [!IMPORTANT]
> **Assista abaixo à apresentação completa do projeto**, demonstrando o design Cyber-Glass em ação, a categorização em tempo real alimentada pelo Gemini AI e o fluxo de login e redefinição de perfil:

<div align="center">
  <video src="./public/screenshots/apresentacao.mp4" controls width="100%" style="border-radius: 2rem; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.8);"></video>
  <p><i>Caso o player de vídeo acima não carregue no seu navegador, você também pode <a href="./public/screenshots/apresentacao.mp4"><b>baixar o vídeo diretamente clicando aqui</b></a>!</i></p>
</div>

---

## 🖥️ Galeria de Telas (Cyber-Glass Grid)

Para garantir uma leitura limpa e elegante, organizamos as capturas de tela das principais interfaces do sistema em uma grade:

| 🔐 Tela de Login | 📝 Tela de Cadastro | 🎯 Escolha de Interesses |
| :---: | :---: | :---: |
| ![Login Screen](./public/screenshots/login.png) | ![Register Screen](./public/screenshots/cadastro.png) | ![Interests Choice](./public/screenshots/interesse.png) |
| *Autenticação segura com cookies nativos.* | *Criação de conta com proteção anti-bot.* | *Seleção obrigatória de temas no onboarding.* |

| 📧 Verificação de E-mail | 🔮 Feed Principal | 🧑‍💻 Perfil do Usuário |
| :---: | :---: | :---: |
| ![Email Verification](./public/screenshots/escolha.png) | ![Dashboard Feed](./public/screenshots/feed.png) | ![User Profile](./public/screenshots/usuario0.png) |
| *Segurança em duas etapas via código PIN por e-mail.* | *Dashboard imersivo com efeito Cyber-Glass e Hot News.* | *Edição de dados, senha, avatar e preferências.* |

---

## ✨ Funcionalidades "State-of-the-Art"

- **Visual Cinematic Cyber-Glass**: Interface imersiva com efeitos de desfoque, gradientes em movimento e profundidade 3D (parallax) que reage ao mouse.
- **Heat System (Hot Now)**: Notícias quentes ganham indicadores visuais de "calor" (glow e animações pulsantes).
- **Categorização Híbrida por IA**: Motor que combina regras heurísticas com classificação semântica via Google Gemini 2.0 Flash.
- **Três Modos Editoriais**:
  - **Gemini (Home)**: Layout equilibrado e editorial.
  - **ChatGPT (Explore)**: Foco em descoberta com grandes destaques visuais.
  - **Grok (Favorites)**: Interface orientada a ação e salvamento dos favoritos.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router rodando sobre Webpack estável)
- **Database**: [PostgreSQL](https://www.postgresql.org/) com [Prisma ORM](https://www.prisma.io/)
- **AI Engine**: [Google Gemini 2.0 Flash](https://ai.google.dev/) (Classificação semântica em lote)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Transações de E-mail**: [Resend API](https://resend.com/) (Com redirecionamentos dinâmicos de sandbox e suporte a qualquer domínio externo)
- **Icons**: [Lucide React](https://lucide.dev/)
- **News Sources**: NewsAPI, GNews, The Guardian

---

## 🚀 Como Começar (Dev Local)

### 1. Clone o repositório
```bash
git clone https://github.com/iambot1193/TrackFeed.git
cd TrackFeed
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configuração do Ambiente (.env)
Crie um arquivo `.env` na raiz do projeto e copie o conteúdo de `.env.example`. Você precisará configurar:
- **Banco de Dados**: `DATABASE_URL` (PostgreSQL).
- **IA**: `GEMINI_API_KEY` (Google AI Studio).
- **Notícias**: `NEWS_API_KEY`, `GNEWS_API_KEY` e `GUARDIAN_API_KEY`.
- **E-mail**: `RESEND_API_KEY` e o e-mail de sandbox `RESEND_SANDBOX_EMAIL`.

### 4. Sincronização do Banco de Dados (Prisma)
```bash
# Gera o cliente Prisma baseado no schema
npx prisma generate

# Sincroniza o schema diretamente com o banco (Ideal para Dev/Testes)
npx prisma db push
```

### 5. Inicie o Servidor
```bash
npm run dev
```
O dashboard estará disponível em `http://localhost:3000`.

---

## Como Hospedar Online (Deploy em Produção)

Para colocar o **TrackFeed** ativo no ar na nuvem (Vercel + Supabase):

### 1. Banco de Dados na Nuvem (Supabase)
1. Crie uma conta gratuita em [Supabase.com](https://supabase.com/).
2. Crie um novo projeto PostgreSQL.
3. Vá em **Project Settings -> Database**, copie a **Connection String** em formato `URI` (ex: `postgresql://...`) e preencha a variável `DATABASE_URL` nas configurações do seu servidor de hospedagem.

### 2. E-mail Transacional de PIN (Resend)
1. Crie uma conta gratuita em [Resend.com](https://resend.com/).
2. Acesse a aba **API Keys**, gere uma nova chave de acesso e configure a variável `RESEND_API_KEY` na Vercel.
3. Defina a variável `RESEND_SANDBOX_EMAIL` para o seu e-mail cadastrado na conta caso esteja testando no ambiente gratuito de Sandbox. Em produção (com domínio verificado), remova essa variável para entregar os e-mails diretamente aos usuários!

> [!WARNING]
> **ATENÇÃO AO MODO SANDBOX DO RESEND!**
> Se a sua conta da Resend for nova ou gratuita (sem domínio próprio verificado), a Resend **SÓ permite enviar e-mails para o e-mail cadastrado na sua própria conta**. 
> Para que os testes funcionem perfeitamente na Vercel, você **DEVE** adicionar a variável `RESEND_SANDBOX_EMAIL` nas variáveis de ambiente da Vercel apontando para o seu e-mail da Resend. Caso contrário, qualquer tentativa de cadastro com outro e-mail falhará com erro de API!
>
> **Cuidado para não confundir as chaves!** A `RESEND_API_KEY` deve começar obrigatoriamente com `re_`. Não a confunda com a chave secreta do reCAPTCHA (`6Lff...`).

### 3. Proteção Anti-Bot (Google reCAPTCHA v2)
1. Acesse o console do [Google reCAPTCHA](https://www.google.com/recaptcha/admin).
2. Registre um novo site escolhendo **reCAPTCHA v2 (caixa de seleção "Não sou um robô")**.
3. Adicione o seu domínio oficial da Vercel (ex: `seu-app.vercel.app`) nos domínios autorizados.
4. Copie a **Site Key** (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) e a **Secret Key** (`RECAPTCHA_SECRET_KEY`) e adicione-as às variáveis de ambiente na Vercel.

### 4. Deploy no Servidor (Vercel)
1. Conecte o seu repositório do GitHub diretamente na [Vercel](https://vercel.com).
2. > [!IMPORTANT]
   > **Criação Obrigatória das Variáveis de Ambiente na Vercel:**
   > Para que as funcionalidades do site (como envio de e-mails via Resend, classificação por IA via Gemini e reCAPTCHA) funcionem no deploy automático, você **DEVE** cadastrar manualmente **todas** as variáveis do seu `.env` na aba **Settings > Environment Variables** no painel da Vercel. Se elas não forem criadas lá, o site apresentará falhas nas telas de login, cadastro e verificação!
3. Adicione **todas** as variáveis do arquivo `.env` (Seção A e Seção B) nas configurações de **Environment Variables** do projeto na Vercel.
4. A Vercel executará o comando de build (`npm run build`) que gera automaticamente o cliente Prisma, aplica as otimizações do Next.js e disponibiliza o seu site online em segundos!

---

## 🎯 Avaliação Técnica e Requisitos

Para facilitar a revisão deste projeto pelos avaliadores, preparamos um documento de mapeamento detalhado. Nele, cruzamos todos os critérios exigidos no desafio com os arquivos exatos onde foram implementados na nossa arquitetura.

👉 **[Clique aqui para acessar o Checklist de Critérios de Avaliação (docs/desafio.md)](./docs/desafio.md)**

---
Desenvolvido por Felipe Gonçalves.
