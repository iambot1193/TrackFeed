'use server'

import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/mail";
import crypto from "crypto";
import { forgotPasswordSchema } from "@/lib/validations";

type PasswordResetState = { error?: string; success?: boolean };

export async function requestPasswordReset(prevState: PasswordResetState | null, formData: FormData): Promise<PasswordResetState> {
  const rawEmail = formData.get("email") as string;
  const validated = forgotPasswordSchema.safeParse({ email: rawEmail });

  if (!validated.success) {
    return { error: "Por favor, digite um e-mail válido." };
  }

  const { email } = validated.data;

  // Resposta genérica sempre igual: não revela se o e-mail existe na base
  const genericSuccess = { success: true };

  try {
    // 1. Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return genericSuccess;
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
    // NEXT_PUBLIC_APP_URL deve ser o domínio público real (VERCEL_URL é a URL do deploy específico, não o domínio de produção)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // 6. Envia o e-mail
    await sendResetPasswordEmail(user.email, user.name || "Usuário", resetLink);

    return genericSuccess;

  } catch (error) {
    console.error(">>> ERRO NO PEDIDO DE RECUPERAÇÃO:", error);
    // Mesmo em erro interno, não vazamos detalhes que ajudem enumeração
    return genericSuccess;
  }
}
