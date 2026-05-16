# TrackFeed - Cinematic AI News Dashboard 🚀

O **TrackFeed** é um dashboard de notícias de última geração, projetado para oferecer uma experiência cinematográfica e inteligente de consumo de informação. Ele combina o poder do **Next.js 15**, **Prisma** e **Google Gemini AI** para categorizar, resumir e apresentar notícias com uma interface "Cyber-Glass" de altíssima fidelidade.

![TrackFeed Preview](https://github.com/user-attachments/assets/your-preview-link)

## ✨ Funcionalidades "State-of-the-Art"

- **Visual Cinematic Cyber-Glass**: Interface imersiva com efeitos de desfoque, gradientes em movimento e profundidade 3D (parallax) que reage ao mouse.
- **AI Smart Digest (Fase 1)**: Resumos instantâneos de notícias em 3 tópicos gerados por IA, economizando tempo e trazendo clareza imediata.
- **Modo Imersivo de Leitura**: Um ambiente livre de distrações para leitura cinematográfica das notícias no radar.
- **Heat System (Hot Now)**: Notícias que estão bombando ganham indicadores visuais de "calor" (glow e animações pulsantes).
- **Categorização Híbrida**: Motor que combina regras heurísticas com classificação semântica via Gemini AI.
- **Contingência Inteligente**: Gerenciamento de cotas de API com fallback automático para cache local e fontes secundárias.
- **Três Modos Editoriais**:
  - **Gemini (Home)**: Layout equilibrado e editorial.
  - **ChatGPT (Explore)**: Foco em descoberta com grandes destaques visuais.
  - **Grok (Favorites)**: Interface orientada a ação e salvamento.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) com [Prisma ORM](https://www.prisma.io/)
- **AI Engine**: [Google Gemini 1.5/2.0 Flash](https://ai.google.dev/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **News Sources**: NewsAPI, GNews, The Guardian

## 🚀 Como Começar

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/track2feed.git
cd track2feed
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
- **E-mail (Opcional)**: Configurações de SMTP para verificação de conta.

### 4. Sincronização do Banco de Dados (Prisma)
Para preparar o banco de dados e gerar o cliente do ORM:
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

## 📈 Roadmap

- [x] **Fase 1**: Smart Digest, Modo Imersivo, Background Parallax.
- [ ] **Fase 2**: Track de Hype com gráficos, Gamificação e Áudio Digest.
- [ ] **Fase 3**: Temas dinâmicos por categoria e Radar de Temas (Mapa Mental).

---
Desenvolvido por Felipe Gonçalves
