'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations";

export async function resetPassword(prevState: unknown, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validated = resetPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { token, password } = validated.data;

  try {
    // 1. Busca o usuário pelo token e verifica se ainda é válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date() // Tem que ser maior que "agora"
        }
      }
    });

    if (!user) {
      return { error: "Este link de recuperação expirou ou é inválido. Peça um novo." };
    }

    // 2. Validações extras (Didática: não pode ser igual ao e-mail)
    const emailPart = user.email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailPart)) {
      return { error: "A senha não pode conter partes do seu e-mail por segurança." };
    }

    // 3. Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Atualiza o usuário, limpa os campos de recuperação e revoga sessões antigas
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        sessionVersion: { increment: 1 }
      }
    });

    return { success: true };

  } catch (error) {
    console.error(">>> ERRO NA REDEFINIÇÃO DE SENHA:", error);
    return { error: "Ocorreu um erro ao trocar sua senha. Tente novamente." };
  }
}
