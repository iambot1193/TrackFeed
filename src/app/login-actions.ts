'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validations";
import { verifyRecaptcha } from "@/lib/captcha";
import { setSessionCookie } from "@/lib/session";

const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

export async function loginUser(prevState: unknown, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  // VALIDAÇÃO COM ZOD
  const validated = loginSchema.safeParse(rawData);
  
  if (!validated.success) {
    return { 
        error: validated.error.errors[0].message,
        identifier: rawData.identifier as string,
        timestamp: Date.now() 
    };
  }

  const { identifier, password } = validated.data;
  const normalizedIdentifier = identifier.toLowerCase();
  const captchaToken = formData.get("g-recaptcha-response") as string;
  
  // VERIFICAÇÃO RECAPTCHA (GOOGLE)
  // Ignoramos em desenvolvimento para evitar erro de 'Host local não autorizado'
  if (process.env.NODE_ENV === "production") {
    const isValid = await verifyRecaptcha(captchaToken);

    if (!isValid) {
      return { 
          error: "Verificação de segurança falhou. Tente novamente.",
          identifier: identifier,
          timestamp: Date.now() 
      };
    }
  }

  // Rate limit por identificador: trava após MAX_LOGIN_FAILURES erros seguidos.
  // Fica no banco (e não em memória) porque a app roda serverless — cada instância
  // teria o próprio contador e o limite não valeria nada.
  const attempt = await prisma.loginAttempt.findUnique({ where: { identifier: normalizedIdentifier } });
  if (attempt && attempt.failedCount >= MAX_LOGIN_FAILURES) {
    const elapsed = Date.now() - attempt.lastFailAt.getTime();
    if (elapsed < LOGIN_LOCK_MS) {
      return {
        error: `Muitas tentativas. Tente novamente em ${Math.ceil((LOGIN_LOCK_MS - elapsed) / 60000)} min.`,
        identifier,
        timestamp: Date.now()
      };
    }
  }

  // 1. Tenta achar o usuário (identifier normalizado evita falha de login com e-mail em maiúsculas)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier },
        { name: identifier }
      ]
    },
    include: {
      preferences: true // Carregamos as preferências para saber onde redirecionar
    }
  });

  // Mensagem genérica: não revela se o problema foi usuário inexistente ou senha errada
  const invalidCredentials = {
    error: "Usuário/e-mail ou senha incorretos.",
    identifier: identifier,
    timestamp: Date.now()
  };

  if (!user) {
    await registerLoginFailure(normalizedIdentifier);
    return invalidCredentials;
  }

  // 2. Verifica a senha
  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordCorrect) {
    await registerLoginFailure(normalizedIdentifier);
    return invalidCredentials;
  }

  // Login válido zera o histórico de falhas
  await prisma.loginAttempt.deleteMany({ where: { identifier: normalizedIdentifier } });

  // 3. Sucesso! Configura o Cookie de Sessão assinado
  await setSessionCookie(user.id, user.sessionVersion);

  // 4. Redirecionamento Inteligente
  if (user.preferences.length === 0) {
    redirect("/interests");
  } else {
    redirect("/dashboard");
  }
}

async function registerLoginFailure(identifier: string) {
  // Descarta registros já fora da janela de bloqueio. Sem isso a tabela cresceria
  // sem limite — qualquer identificador inexistente tentado vira uma linha permanente.
  await prisma.loginAttempt.deleteMany({
    where: { lastFailAt: { lt: new Date(Date.now() - LOGIN_LOCK_MS) } }
  });

  const existing = await prisma.loginAttempt.findUnique({ where: { identifier } });
  // Se a janela de bloqueio já passou, o contador recomeça do zero
  const expired = existing && Date.now() - existing.lastFailAt.getTime() >= LOGIN_LOCK_MS;
  await prisma.loginAttempt.upsert({
    where: { identifier },
    update: { failedCount: expired ? 1 : { increment: 1 }, lastFailAt: new Date() },
    create: { identifier, failedCount: 1, lastFailAt: new Date() }
  });
}
