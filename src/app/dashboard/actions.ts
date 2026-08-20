'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSessionUserId, clearSessionCookie, setSessionCookie } from "@/lib/session";
import { setUserPreferences, sanitizeCategories } from "@/lib/preferences";
import { verifyEmailCode, resendVerificationCode } from "@/lib/verification";
import { nameSchema, avatarUrlSchema, passwordSchema, emailSchema } from "@/lib/validations";

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
  const userId = await getSessionUserId();

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
export async function getUserFavorites() {
  const userId = await getSessionUserId();
  if (!userId) return [];

  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' }
  });
}

/**
 * Adiciona uma notícia ao histórico de leitura do usuário.
 */
export async function addToHistory(data: { title: string; url: string; imageUrl?: string }) {
  const userId = await getSessionUserId();
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
  const userId = await getSessionUserId();
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

    if (data.name) {
      // Mesmas regras de formato do cadastro — Server Action é endpoint público
      const validName = nameSchema.safeParse(data.name);
      if (!validName.success) return { error: validName.error.errors[0].message };

      const nameExists = await prisma.user.findFirst({
        where: { name: validName.data, NOT: { id: userId } }
      });
      if (nameExists) return { error: "Este nome de usuário já está sendo usado." };
      updateData.name = validName.data;
    }

    if (data.avatarUrl) {
      const validAvatar = avatarUrlSchema.safeParse(data.avatarUrl);
      if (!validAvatar.success) return { error: validAvatar.error.errors[0].message };
      updateData.avatarUrl = validAvatar.data;
    }

    if (data.email) {
      const validEmail = emailSchema.safeParse(data.email);
      if (!validEmail.success) return { error: validEmail.error.errors[0].message };
      const normalizedEmail = validEmail.data;
      const emailExists = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: userId }
        }
      });
      if (emailExists) return { error: "Este e-mail já está sendo utilizado por outro usuário." };
      updateData.email = normalizedEmail;
      // Trocar o e-mail invalida a verificação anterior. É obrigatório descartar também o
      // código pendente: ele foi enviado para o endereço ANTIGO e, se continuasse válido,
      // permitiria verificar o endereço novo sem nunca ter acesso à caixa de entrada dele.
      updateData.emailVerified = null;
      updateData.verificationCode = null;
      updateData.verificationCodeExpires = null;
      updateData.verificationAttempts = 0;
    }

    if (data.password) {
      const validPassword = passwordSchema.safeParse(data.password);
      if (!validPassword.success) return { error: validPassword.error.errors[0].message };
      updateData.passwordHash = await bcrypt.hash(validPassword.data, 10);
      // Revoga qualquer outra sessão aberta com a senha antiga
      updateData.sessionVersion = { increment: 1 };
    }

    // Salvar interesses vazios apagaria todas as preferências e expulsaria o usuário
    // da dashboard (que redireciona para /interests quando não há nenhuma).
    if (data.interests && sanitizeCategories(data.interests).length < 1) {
      return { error: "Selecione pelo menos 1 interesse válido." };
    }

    // ATUALIZAÇÃO UNIFICADA: Perfil + Interesses
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      if (data.interests) {
        await setUserPreferences(userId, data.interests, tx);
      }

      return updated;
    });

    // Reemite o cookie com a nova versão para não derrubar a sessão atual
    if (data.password) {
      await setSessionCookie(userId, updatedUser.sessionVersion);
    }

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
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sessão expirada." };

  if (sanitizeCategories(categories).length < 1) {
    return { error: "Selecione pelo menos 1 interesse válido." };
  }

  try {
    await setUserPreferences(userId, categories);
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
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sessão expirada." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado." };

    // 1. Verifica se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return { error: "Senha incorreta. Não foi possível deletar a conta." };

    // 2. Deleta o usuário — Preference/Favorite/History têm onDelete: Cascade no schema
    await prisma.user.delete({ where: { id: userId } });

    // 3. Limpa Cookie e Redireciona
    await clearSessionCookie();

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
  await clearSessionCookie();
  return { success: true };
}

/**
 * Reenvia o código de verificação para o usuário logado.
 */
export async function resendVerificationEmailAction() {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sessão expirada." };
  return resendVerificationCode(userId);
}

/**
 * Verifica o código de e-mail enviado diretamente da dashboard.
 */
export async function verifyEmailInDashboardAction(code: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sessão expirada." };
  return verifyEmailCode(userId, code);
}
