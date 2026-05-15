/**
 * Verifica o token do Google reCAPTCHA v2 no servidor.
 */
export async function verifyRecaptcha(token: string) {
  if (!token) return false;

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error(">>> [CAPTCHA] RECAPTCHA_SECRET_KEY não configurada!");
    return true; // Falha segura em desenvolvimento se não houver chave
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(">>> [CAPTCHA ERROR]:", error);
    return false;
  }
}
