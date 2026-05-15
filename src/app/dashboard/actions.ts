'use server'

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { sendVerificationEmail } from "@/lib/mail";

/**
 * Alterna o estado de favorito de um artigo.
 * Blindado com validação de sessão e tratamento de erros.
 */
export async function toggleFavorite(article: {
  title: string;
  url: string;
  urlToImage: string;
  sourceName: string;
  publishedAt: string;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) return { error: "Sessão expirada. Por favor, faça login novamente." };

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_url: {
          userId,
          url: article.url
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return { success: true, action: "removed" };
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          title: article.title,
          url: article.url,
          imageUrl: article.urlToImage || "",
          source: article.sourceName,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
          savedAt: new Date()
        }
      });
      return { success: true, action: "added" };
    }
  } catch (error: any) {
    console.error(">>> ERRO FAVORITOS:", error);
    if (error.code === 'P2002') return { success: true, action: "added" };
    return { error: "Não foi possível processar sua solicitação agora." };
  }
}

/**
 * Busca os favoritos de um usuário.
 */
export async function getUserFavorites(userIdParam: string) {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("userId")?.value;
  if (!sessionUserId || sessionUserId !== userIdParam) return [];

  try {
    return await prisma.favorite.findMany({
      where: { userId: sessionUserId },
      orderBy: { savedAt: 'desc' }
    });
  } catch (error) {
    return [];
  }
}

/**
 * Adiciona uma notícia ao histórico de leitura do usuário.
 */
export async function addToHistory(article: { title: string; url: string; imageUrl?: string }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return;

  try {
    await prisma.history.create({
      data: {
        userId,
        title: article.title,
        url: article.url,
        imageUrl: article.imageUrl || ""
      }
    });
  } catch (error) {}
}

/**
 * Atualiza o perfil do usuário (Nome, Foto, Senha).
 * Didático: Aplica as mesmas regras rígidas de segurança do Cadastro.
 */
export async function updateUserProfile(data: { name?: string; avatarUrl?: string; password?: string, currentPassword?: string }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return { error: "Usuário não autenticado." };

  try {
    // 1. Busca dados atuais para validação cruzada
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) return { error: "Usuário não encontrado." };

    // 1.5 VERIFICAÇÃO DE SENHA ATUAL (Obrigatória para trocar senha)
    if (data.password) {
      if (!data.currentPassword) return { error: "Você precisa informar sua senha atual para definir uma nova." };
      const isCurrentValid = await bcrypt.compare(data.currentPassword, currentUser.passwordHash);
      if (!isCurrentValid) return { error: "A senha atual informada está incorreta." };
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    
    // 2. Validação Rígida de Senha (Se fornecida)
    if (data.password) {
      const cleanPassword = data.password.toLowerCase();
      const cleanName = (data.name || currentUser.name || "").toLowerCase();
      const cleanEmail = currentUser.email.toLowerCase();
      const emailPart = cleanEmail.split('@')[0];

      if (data.password.length < 6) {
        return { error: "A nova senha deve ter pelo menos 6 caracteres." };
      }

      if (cleanPassword === cleanEmail || cleanPassword.includes(emailPart) || cleanEmail.includes(cleanPassword)) {
        return { error: "A senha não pode ser parecida com o seu e-mail." };
      }

      if (cleanName && (cleanPassword === cleanName || cleanPassword.includes(cleanName) || cleanName.includes(cleanPassword))) {
        return { error: "A senha não pode ser parecida com o seu nome." };
      }

      // Se passou em tudo, criptografa
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(">>> ERRO UPDATE PROFILE:", error);
    return { error: "Falha ao atualizar perfil." };
  }
}

/**
 * Atualiza as preferências de categorias do usuário.
 */
export async function updateUserPreferences(categories: string[]) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return { error: "Sessão expirada." };

  try {
    // 1. Remove as preferências antigas
    await prisma.preference.deleteMany({
      where: { userId }
    });

    // 2. Cria as novas preferências
    await prisma.preference.createMany({
      data: categories.map(cat => ({
        userId,
        categoryName: cat
      }))
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(">>> ERRO UPDATE PREFERENCES:", error);
    return { error: "Falha ao salvar preferências." };
  }
}

/**
 * Deleta a conta do usuário permanentemente.
 * Exige a senha para confirmação final.
 */
export async function deleteAccountAction(password: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return { error: "Sessão expirada." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado." };

    // 1. Verifica se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { error: "Senha incorreta. Não foi possível deletar a conta." };

    // 2. Deleta dados relacionados (O Prisma cuidará se houver Cascade, mas vamos garantir)
    await prisma.$transaction([
      prisma.preference.deleteMany({ where: { userId } }),
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.history.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    // 3. Limpa Cookie e Redireciona
    cookieStore.delete("userId");
    
    return { success: true };
  } catch (error) {
    console.error(">>> ERRO AO DELETAR CONTA:", error);
    return { error: "Erro crítico ao processar exclusão. Tente novamente." };
  }
}

/**
 * Busca o status atual da cota da API (para atualizações em tempo real no cliente).
 */
export async function getApiStatusAction() {
  const { getApiStatus } = await import("@/lib/news");
  const status = await getApiStatus();
  return {
    newsApiRemaining: status.newsApiQuota,
    newsApiQuota: status.newsApiQuota,
    gnewsQuota: status.gnewsQuota,
    lastUpdated: status.lastUpdated.toISOString()
  };
}

/**
 * Realiza o Logout removendo o cookie de sessão.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  return { success: true };
}

/**
 * Reenvia o código de verificação para o usuário logado.
 */
export async function resendVerificationEmailAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return { error: "Sessão expirada." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado." };
    if (user.emailVerified) return { error: "Sua conta já está verificada." };

    // Gera novo código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.user.update({
      where: { id: userId },
      data: { verificationCode: code }
    });

    await sendVerificationEmail(user.email, user.name || "Usuário", code);
    
    return { success: true };
  } catch (error) {
    console.error(">>> ERRO REENVIAR EMAIL:", error);
    return { error: "Falha ao enviar e-mail. Tente novamente mais tarde." };
  }
}

/**
 * AI SMART DIGEST: Gera um resumo da notícia sob demanda.
 */
export async function summarizeNewsAction(title: string, description: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return { error: "Sessão expirada." };

  const { summarizeArticle } = await import("@/lib/news");
  const summary = await summarizeArticle(title, description);
  return { summary };
}
