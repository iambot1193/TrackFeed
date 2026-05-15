import { z } from "zod";

/**
 * Esquema de Validação para Registro
 */
export const registerSchema = z.object({
  name: z.string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(20, "O nome pode ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "O nome de usuário pode conter apenas letras, números e underscores"),
  
  email: z.string()
    .email("E-mail inválido")
    .toLowerCase()
    .refine(email => email.endsWith("@gmail.com"), {
      message: "Por enquanto, aceitamos apenas e-mails do @gmail.com"
    }),
  
  password: z.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(50, "A senha é muito longa"),
}).refine(data => {
  // Validações de similaridade
  const emailPart = data.email.split('@')[0].toLowerCase();
  const pass = data.password.toLowerCase();
  const name = data.name.toLowerCase();

  return !pass.includes(emailPart) && !pass.includes(name) && !emailPart.includes(pass) && !name.includes(pass);
}, {
  message: "A senha é muito parecida com seu e-mail ou nome de usuário",
  path: ["password"]
});

/**
 * Esquema de Validação para Login
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, "O e-mail ou usuário é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

/**
 * Esquema de Validação para Recuperação de Senha
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase(),
});
