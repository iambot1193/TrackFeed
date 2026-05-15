# Desafio Técnico: Trackland (Plataforma de Notícias Personalizadas)

Este documento centraliza todos os objetivos propostos pelo desafio técnico original e comprova a execução de cada um no projeto TrackFeed.

## 🎯 Objetivo Principal
Desenvolver uma aplicação Web "Full-stack" onde o usuário possa criar uma conta, selecionar tópicos de interesse e visualizar um feed de notícias personalizado consumido de uma API externa.

---

## ✅ Requisitos Obrigatórios (Completados 100%)

### 1. Autenticação e Gestão de Conta
- [x] **Cadastro e Login:** Sistema completo com validação rigorosa (nome, e-mail e senha segura).
- [x] **Segurança de Senhas:** Senhas nunca são salvas em texto puro (Uso de `bcrypt` para hash).
- [x] **Proteção de Rotas:** O Dashboard é bloqueado para usuários anônimos (Uso de Cookies JWT / Sessão).

### 2. Personalização de Preferências
- [x] **Seleção de Interesses:** Durante ou após o cadastro, o usuário pode escolher categorias (ex: Tecnologia, Esportes, Negócios).
- [x] **Edição Flexível:** O usuário pode alterar as categorias escolhidas a qualquer momento pela interface.

### 3. Integração com API de Notícias
- [x] **Consumo de API Externa:** Integração robusta com a **NewsAPI**.
- [x] **Segurança de Chaves:** A chave da API de notícias NUNCA fica exposta no frontend (Uso estrito de Server Actions e `.env`).
- [x] **Feed Personalizado:** A tela inicial traz *apenas* as notícias correspondentes aos tópicos que o usuário escolheu.

### 4. Interface e Experiência do Usuário (UI/UX)
- [x] **Design Responsivo:** A aplicação é 100% utilizável em Celulares, Tablets e Desktops (Tailwind CSS).
- [x] **Feedback Visual:** Implementação de Skeletons (telas de carregamento) e tratamentos de erro (ex: limite de API ou senha incorreta).
- [x] **Busca de Notícias:** Barra de busca funcional para encontrar artigos específicos.

---

## 🚀 Diferenciais e Extras (Onde Fomos Além do Exigido)

O projeto TrackFeed não apenas cumpre os requisitos, como entrega arquiteturas de nível empresarial (Enterprise-grade) não solicitadas, mas altamente valorizadas:

1. **Inteligência Artificial (Cérebro Gemini)** 🧠
   - Classificação em lote via NLP (Natural Language Processing) usando a API do Google Gemini para garantir tags perfeitas e coloridas no "Feed Descobrir".

2. **Alta Disponibilidade Híbrida (Failover)** ⚙️
   - Prevenção do erro clássico da NewsAPI (bloqueio gratuito). Se a API Titular cair, o **GNews** assume. Se o GNews cair, o **Cache Local** assume. A tela do usuário nunca fica vazia.

3. **Garantia de Conteúdo e Purismo de Tags** 🛡️
   - Sistema lógico avançado ("Confiança na API") que assegura que as pesquisas diretas tenham relevância absoluta de conteúdo, sempre retornando no mínimo 6 cards.

4. **Banco de Dados Real e Escalável** 🗄️
   - Embora o desafio permitisse mock ou SQLite simples, o TrackFeed utiliza Prisma ORM integrado ao PostgreSQL, pronto para escala mundial.

5. **Engajamento Adicional (Favoritos & Histórico)** 🔖
   - Funcionalidade completa para salvar notícias (Favoritos) e rastrear o histórico automático das últimas leituras.

6. **Validação Rigorosa de Usuários** ✉️
   - Recuperação de contas e verificação em 2 etapas com o disparo de E-mails com código PIN (via Resend).

---
**Conclusão do Desafio:** O escopo exigido foi atendido em sua totalidade, e a arquitetura expandida transformou o MVP em um produto comercializável (SaaS).
