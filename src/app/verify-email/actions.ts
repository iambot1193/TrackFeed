'use server'

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { verifyEmailCode, resendVerificationCode } from "@/lib/verification";

export async function verifyEmail(prevState: unknown, formData: FormData) {
  const code = formData.get("code") as string;

  if (!code || code.length < 6) {
    return { error: "Código inválido. Digite os 6 dígitos." };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/"); // Se não estiver logado, manda pro login
  }

  return verifyEmailCode(userId, code);
}

export async function resendVerificationAction() {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sessão expirada. Tente logar novamente." };
  return resendVerificationCode(userId);
}
