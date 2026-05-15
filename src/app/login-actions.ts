'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validations";
import { verifyRecaptcha } from "@/lib/captcha";

export async function loginUser(prevState: any, formData: FormData) {
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


  // 1. Tenta achar o usuário
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { name: identifier }
      ]
    },
    include: {
      preferences: true // Carregamos as preferências para saber onde redirecionar
    }
  });

  // SE NÃO EXISTIR: Não devolvemos o identifier (limpa tudo)
  if (!user) {
    return { 
        error: "Usuário ou e-mail não encontrado.",
        timestamp: Date.now() 
    };
  }

  // 2. Verifica a senha
  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

  // SE SENHA INCORRETA: Devolvemos o identifier (mantém o usuário, limpa só a senha)
  if (!isPasswordCorrect) {
    return { 
        error: "Senha incorreta. Tente novamente.",
        identifier: identifier,
        timestamp: Date.now() 
    };
  }

  // 3. Sucesso! Configura o Cookie de Sessão
  const cookieStore = await cookies();
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: "/",
  });

  // 4. Redirecionamento Inteligente
  if (user.preferences.length === 0) {
    redirect("/interests");
  } else {
    redirect("/dashboard");
  }
}
