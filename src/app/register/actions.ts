'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { registerSchema } from "@/lib/validations";
import { verifyRecaptcha } from "@/lib/captcha";
import { setSessionCookie } from "@/lib/session";

export async function registerUser(prevState: unknown, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    
    // VALIDAÇÃO COM ZOD
    const validated = registerSchema.safeParse(rawData);
    
    if (!validated.success) {
        return { 
            error: validated.error.errors[0].message,
            name: rawData.name as string,
            email: rawData.email as string,
            timestamp: Date.now()
        };
    }

    const { name, email, password } = validated.data;
    const captchaToken = formData.get("g-recaptcha-response") as string;
    
    // VERIFICAÇÃO RECAPTCHA (GOOGLE)
    // Ignoramos em desenvolvimento
    if (process.env.NODE_ENV === "production") {
        const isValid = await verifyRecaptcha(captchaToken);

        if (!isValid) {
            return { 
                error: "Verificação de segurança falhou. Tente novamente.",
                name,
                email,
                timestamp: Date.now()
            };
        }
    }


    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { 
                error: "Este e-mail já está em uso.",
                name,
                email,
                timestamp: Date.now()
            };
        }

        const existingName = await prisma.user.findFirst({
            where: { name }
        });

        if (existingName) {
            return { 
                error: "Este nome de usuário já está sendo usado.",
                name,
                email,
                timestamp: Date.now()
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Gera código de 6 dígitos (RNG criptográfico, não Math.random)
        const verificationCode = crypto.randomInt(100000, 1000000).toString();

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                verificationCode: verificationCode,
                verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        // Envia o e-mail
        const { sendVerificationEmail } = await import("@/lib/mail");
        await sendVerificationEmail(email, name, verificationCode);

        // Autentica o usuário automaticamente após o cadastro
        await setSessionCookie(newUser.id, newUser.sessionVersion);

    } catch (error) {
        console.error(">>> ERRO NO CADASTRO:", error);
        return { 
            error: "Ocorreu um erro inesperado. Tente novamente.",
            name,
            email,
            timestamp: Date.now()
        };
    }

    // Após cadastro, vai para a escolha de verificação
    redirect(`/verify-choice?email=${encodeURIComponent(email)}`);
}
