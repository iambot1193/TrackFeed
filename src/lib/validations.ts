import { z } from "zod";

export const passwordSchema = z.string()
  .min(6, "A senha deve ter pelo menos 6 caracteres")
  .max(50, "A senha é muito longa");

export const emailSchema = z.string()
  .email("E-mail inválido")
  .toLowerCase();

export const nameSchema = z.string()
  .min(3, "O nome deve ter pelo menos 3 caracteres")
  .max(20, "O nome pode ter no máximo 20 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "O nome de usuário pode conter apenas letras, números e underscores");

/**
 * Avatar aceito: URL http(s) ou data URL de imagem. O limite de tamanho existe porque
 * a foto é persistida como string no banco e lida a cada render da dashboard.
 */
export const avatarUrlSchema = z.string()
  .max(3_000_000, "A imagem é muito grande. Use um arquivo de até 2MB.")
  .refine(
    (v) => /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(v) || /^https?:\/\//.test(v),
    "Formato de imagem inválido."
  );

/**
 * Esquema de Validação para Registro
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
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
  email: emailSchema,
});

/**
 * Esquema de Validação para Redefinição de Senha
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token de recuperação ausente."),
  password: passwordSchema,
});
