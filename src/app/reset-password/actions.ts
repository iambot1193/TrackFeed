'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function resetPassword(prevState: any, formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token) {
    return { error: "Token de recuperação ausente." };
  }

  if (!password || password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

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

    // 4. Atualiza o usuário e limpa os campos de recuperação
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    return { success: true };

  } catch (error) {
    console.error(">>> ERRO NA REDEFINIÇÃO DE SENHA:", error);
    return { error: "Ocorreu um erro ao trocar sua senha. Tente novamente." };
  }
}
