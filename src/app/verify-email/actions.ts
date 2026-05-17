'use server'

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function verifyEmail(prevState: any, formData: FormData) {
  const code = formData.get("code") as string;
  
  if (!code || code.length < 6) {
    return { error: "Código inválido. Digite os 6 dígitos." };
  }

  // 1. Pega o ID do usuário dos cookies
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/"); // Se não estiver logado, manda pro login
  }

  try {
    // 2. Busca o usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { error: "Usuário não encontrado." };
    }

    // 3. Verifica se o código bate
    if (user.verificationCode !== code) {
      return { error: "Código incorreto. Verifique seu e-mail e tente novamente." };
    }

    // 4. Sucesso! Marca como verificado e limpa o código
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        verificationCode: null // Limpa para segurança
      }
    });

    return { success: true };

  } catch (error) {
    console.error(">>> ERRO NA VERIFICAÇÃO:", error);
    return { error: "Ocorreu um erro no servidor. Tente novamente." };
  }
}

export async function resendVerificationAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) return { error: "Sessão expirada. Tente logar novamente." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return { error: "Usuário não encontrado." };

    // Gera um novo código e atualiza no banco
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: userId },
      data: { verificationCode: newCode }
    });

    // Envia o e-mail
    const { sendVerificationEmail } = await import("@/lib/mail");
    const result = await sendVerificationEmail(user.email, user.name, newCode);

    if (!result.success) {
      console.error(">>> ERRO RESEND:", result.error);
      return { error: "Erro ao enviar e-mail. Verifique a chave da API." };
    }

    return { success: "E-mail reenviado com sucesso!" };
  } catch (error) {
    console.error(">>> ERRO NO REENVIO:", error);
    return { error: "Falha ao reenviar e-mail." };
  }
}
