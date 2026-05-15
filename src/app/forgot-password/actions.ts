'use server'

import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/mail";
import crypto from "crypto";

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Por favor, digite seu e-mail." };
  }

  try {
    // 1. Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Segurança: Mesmo que o e-mail não exista, podemos fingir que enviamos 
    // para evitar que descubram quais e-mails estão cadastrados. 
    // Mas para facilitar o seu teste, vamos avisar se não existir.
    if (!user) {
      return { error: "Não encontramos nenhuma conta com esse e-mail." };
    }

    // 2. Gera um token seguro de 32 caracteres
    const token = crypto.randomBytes(32).toString("hex");
    
    // 3. Define expiração (1 hora a partir de agora)
    const expires = new Date(Date.now() + 3600000);

    // 4. Salva no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires
      }
    });

    // 5. Constrói o link de recuperação
    // Em produção, você usaria o domínio real. Aqui usamos localhost.
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.VERCEL_URL || "localhost:3000";
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

    // 6. Envia o e-mail
    await sendResetPasswordEmail(user.email, user.name || "Usuário", resetLink);

    return { success: true };

  } catch (error) {
    console.error(">>> ERRO NO PEDIDO DE RECUPERAÇÃO:", error);
    return { error: "Ocorreu um erro ao processar seu pedido. Tente novamente." };
  }
}
