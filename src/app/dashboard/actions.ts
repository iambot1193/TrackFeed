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
export async function addToHistory(data: { title: string; url: string; imageUrl?: string }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return;

  try {
    const existing = await prisma.history.findFirst({
      where: { userId, url: data.url }
    });

    if (existing) {
      await prisma.history.update({
        where: { id: existing.id },
        data: { 
          viewedAt: new Date(),
          clickCount: { increment: 1 } // Incrementa o contador de cliques
        }
      });
    } else {
      await prisma.history.create({
        data: {
          userId,
          title: data.title,
          url: data.url,
          imageUrl: data.imageUrl || ""
        }
      });
    }

    revalidatePath("/dashboard");
    console.log(`>>> LOG: Sucesso ao salvar histórico para URL: ${data.url}`);
  } catch (error) {
    console.error(">>> ERRO CRÍTICO AO SALVAR HISTÓRICO:", error);
  }
}

/**
 * Atualiza o perfil do usuário (Nome, Foto, Senha).
 * Didático: Aplica as mesmas regras rígidas de segurança do Cadastro.
 */
export async function updateUserProfile(data: { 
  name?: string; 
  avatarUrl?: string; 
  password?: string; 
  currentPassword?: string;
  interests?: string[]; // Adicionado campo de categorias
  email?: string; // Suporte para e-mail
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return { error: "Usuário não autenticado." };

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) return { error: "Usuário não encontrado." };

    // Senha é obrigatória tanto para mudar a senha quanto para mudar o email
    if (data.password || data.email) {
      if (!data.currentPassword) return { error: "Você precisa informar sua senha atual para autorizar esta alteração crítica." };
      const isCurrentValid = await bcrypt.compare(data.currentPassword, currentUser.passwordHash);
      if (!isCurrentValid) return { error: "A senha informada está incorreta." };
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    
    if (data.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId }
        }
      });
      if (emailExists) return { error: "Este e-mail já está sendo utilizado por outro usuário." };
      updateData.email = data.email;
    }

    if (data.password) {
      if (data.password.length < 6) return { error: "A nova senha deve ter pelo menos 6 caracteres." };
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    // ATUALIZAÇÃO UNIFICADA: Perfil + Interesses
    await prisma.$transaction(async (tx) => {
      // Atualiza Nome/Senha
      await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      // Atualiza Categorias (se enviadas)
      if (data.interests) {
        await tx.preference.deleteMany({ where: { userId } });
        await tx.preference.createMany({
          data: data.interests.map(cat => ({
            userId,
            categoryName: cat
          }))
        });
      }
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
