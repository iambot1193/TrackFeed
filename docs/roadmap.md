# 🚀 Roadmap de Desenvolvimento - TrackFeed

Acompanhamento de progresso e histórico de desenvolvimento do ecossistema do **TrackFeed**.

---

## 🏁 Sprint 1: Fundação & Planejamento [CONCLUÍDO]
*   [x] Definição de Arquitetura Limpa e Stack Tecnológica.
*   [x] Escrita da documentação técnica inicial (`/docs`).
*   [x] Inicialização do projeto Next.js 16 (App Router + Turbopack).
*   [x] Modelagem do banco de dados relacional.
*   [x] Configuração inicial do Prisma ORM e SQLite local.

---

## 🔑 Sprint 2: Autenticação & Preferências [CONCLUÍDO]
*   [x] Sistema de Registro e Login com criptografia `bcryptjs`.
*   [x] Interface "Premium" (Cyber-Glass) para escolha inicial de categorias e interesses.
*   [x] Criação de Server Actions para salvar e recuperar preferências do usuário.

---

## 📰 Sprint 3: Integração & Feed Pessoal [CONCLUÍDO]
*   [x] Desenvolvimento do serviço core de notícias (`src/lib/news.ts`).
*   [x] Integração multiplataforma com as APIs **NewsAPI** e **GNews**.
*   [x] Criação do algoritmo de cache e banco local offline para economia de cotas.
*   [x] Layout editorial e responsivo de Grid de Cards de Notícias (Aparência Luxury-Cinematic).
*   [x] Tratamento robusto de loading states e skeletons animados.

---

## 🔍 Sprint 4: Busca & Coleções do Usuário [CONCLUÍDO]
*   [x] Barra de busca de notícias em tempo real no radar.
*   [x] Sistema de favoritar notícias com persistência em banco.
*   [x] Registro automático de logs de leitura (Histórico).
*   [x] Paginação limpa com carregamento assíncrono ("Carregar Mais").

---

## 👤 Sprint 5: Gestão de Perfil & Normalização [CONCLUÍDO]
*   [x] Painel de Perfil completo (Edição de Nome, Senha, Foto/Avatar).
*   [x] Algoritmo secundário de categorização rápida baseado em Regex (Palavras-Chave).
*   [x] Correção de caching internacional e filtros de idiomas (`pt` e `en`).
*   [x] Implementação do controle dinâmico de cotas de APIs (`ApiStatus`).

---

## 🧠 Sprint 6: A Grande Atualização (IA Semântica & Purismo) [CONCLUÍDO]
*   [x] **Filtro Purista (Confiança na API):** Garantia de 100% de relevância ao clicar em categorias específicas (Música, Games, Cripto), removendo ruídos.
*   [x] **IA do Google Gemini (1.5 Flash):** Integração para classificar e etiquetar semanticamente lotes de notícias de APIs genéricas.
*   [x] **Motor de Backup Triplo (Alta Disponibilidade):** Fallback robusto (`NewsAPI` ➡️ `GNews` ➡️ `Banco de Dados Offline`), garantindo no mínimo 6 notícias na tela sempre.
*   [x] Animações refinadas e Skeletons aprimorados.

---

## 🚀 Sprint 7: Deploy Online & Segurança Transacional [CONCLUÍDO]
*   [x] Migração transparente e bem-sucedida do banco de SQLite para **PostgreSQL (Supabase)**.
*   [x] **E-mail Transacional (Resend):** Envio automático de PIN numérico de 6 dígitos para verificação de e-mail.
*   [x] Fluxo de segurança avançado para alteração de e-mail e recuperação de senha.
*   [x] Publicação em produção no ar na plataforma **Vercel** com otimização completa de memória e compilação do Next.js.

---

## 🎨 Sprint 8: Correções Críticas & Refinamento de UX [CONCLUÍDO]
*   [x] **Correção de Escopo do Perfil:** Resolvido o travamento (`ReferenceError`) na aba de Perfil passando os novos estados de verificação como propriedades ativas.
*   [x] **Fim das Notícias Misturadas (F5 Bug):** Implementação de reset de página ao trocar de aba e controle por referência (`lastTabRef`) para limpar completamente o cache da tela, resolvendo a mistura de notícias.
*   [x] **Radar Descobrir Purista:** Exclusão inteligente e automática de todas as notícias que o usuário já leu ou favoritou na aba Descobrir.
*   [x] **Transição Lida sob Demanda:** Artigos lidos no Descobrir não somem na hora do clique para conforto visual, mas são limpos na próxima transição de aba/recarregamento.

---

## 🔧 Sprint 9: Polimento Visual & Correções de Produto [CONCLUÍDO]
*   [x] **Coesão Visual da Logo TF:** Gradiente do ícone `TF` na Sidebar e na tela de Interesses unificado com a identidade da tela de Login (roxo → índigo → azul com neon glow).
*   [x] **Sugestão Inteligente de Salvar Alterações:** Banners neon pulsantes em ciano aparecem dinamicamente nos campos de Nome/Avatar (perfil), Nova Senha (modal) e Novo E-mail (modal) assim que o usuário começa a digitar, guiando-o a salvar antes de sair.
*   [x] **Renomeação "Zona de Perigo" → "Deletar Conta":** Título do card de exclusão de conta atualizado para linguagem direta e clara.
*   [x] **Correção da Busca por Texto no Fallback:** O sistema de busca local (banco de dados offline) agora filtra corretamente por título e descrição usando o termo digitado — anteriormente ignorava o `query` e retornava notícias aleatórias da categoria.
*   [x] **Estabilização do Next.js:** Travamento do `--no-turbo` (flag removida no Next.js 15.1.9) identificado e resolvido com downgrade para versão estável compatível com a Vercel.

---

## 📖 Sprint 10: Documentação Premium & README [CONCLUÍDO]
*   [x] **Reestruturação completa do README:** Adição de capa de projeto, player de vídeo de apresentação (entregável do desafio), galeria de screenshots em grade HTML 3-3-1 (7 telas) com legendas técnicas.
*   [x] **Galeria de Telas (3-3-1):** Ordem: Login → Cadastro → Escolha de Interesses → Verificação de PIN → Feed Principal → Perfil (dados) → Perfil (alertas). Última imagem centralizada sozinha.
*   [x] **Auditoria e atualização de todos os Docs:** Todos os 6 arquivos em `docs/` revisados e atualizados para refletir o estado atual do projeto.

---

**Status Final**: 100% Concluído. Sistema operando em produção com estabilidade máxima, segurança transacional e IA ativa!

