import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

const MAX_ATTEMPTS = 5;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export type VerificationResult = { success?: boolean; error?: string };

export async function verifyEmailCode(userId: string, code: string): Promise<VerificationResult> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado." };
    if (user.emailVerified) return { error: "Sua conta já está verificada." };

    if (user.verificationAttempts >= MAX_ATTEMPTS) {
      return { error: "Muitas tentativas incorretas. Peça um novo código." };
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return { error: "Este código expirou. Peça um novo código." };
    }

    if (user.verificationCode !== code) {
      await prisma.user.update({
        where: { id: userId },
        data: { verificationAttempts: { increment: 1 } }
      });
      return { error: "Código incorreto. Verifique seu e-mail e tente novamente." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        verificationCode: null,
        verificationCodeExpires: null,
        verificationAttempts: 0
      }
    });

    return { success: true };
  } catch (error) {
    console.error(">>> ERRO NA VERIFICAÇÃO:", error);
    return { error: "Ocorreu um erro no servidor. Tente novamente." };
  }
}

export async function resendVerificationCode(userId: string): Promise<VerificationResult> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado." };
    if (user.emailVerified) return { error: "Sua conta já está verificada." };

    // Cooldown derivado do timestamp de envio (expires - TTL), sem coluna extra
    if (user.verificationCodeExpires) {
      const sentAt = user.verificationCodeExpires.getTime() - CODE_TTL_MS;
      const elapsed = Date.now() - sentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return { error: `Aguarde ${wait}s antes de pedir um novo código.` };
      }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + CODE_TTL_MS),
        verificationAttempts: 0
      }
    });

    const result = await sendVerificationEmail(user.email, user.name || "Usuário", code);
    if (!result.success) return { error: "Erro ao enviar e-mail. Verifique a chave da API." };

    return { success: true };
  } catch (error) {
    console.error(">>> ERRO NO REENVIO:", error);
    return { error: "Falha ao reenviar e-mail." };
  }
}
