import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

/**
 * Utilitário de E-mail do TrackFeed
 * 
 * Se houver uma RESEND_API_KEY no .env, envia o e-mail real.
 * Caso contrário, apenas loga o código no terminal para desenvolvimento.
 */
export async function sendVerificationEmail(email: string, userName: string, code: string) {
  const subject = "Confirme seu e-mail - TrackFeed";
  
  let recipient = email;
  let sandboxNote = "";

  const sandboxEmail = process.env.RESEND_SANDBOX_EMAIL;

  // Redirecionamento dinâmico de Sandbox do Resend para evitar falhas de envio local/testes
  if (sandboxEmail && email.toLowerCase() !== sandboxEmail.toLowerCase()) {
    recipient = sandboxEmail;
    sandboxNote = `<p style="color: #ef4444; font-size: 11px; text-align: center; font-weight: bold; background: #fee2e2; padding: 8px; border-radius: 8px; margin-bottom: 15px; font-family: sans-serif;">⚠️ MODO SANDBOX RESEND: Destinatário original era <b>${email}</b></p>`;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      ${sandboxNote}
      <h2 style="color: #7c3aed; text-align: center;">Olá, ${userName}! 👋</h2>
      <p style="color: #374151; font-size: 16px; text-align: center;">Bem-vindo ao <b>TrackFeed</b>. Para finalizar seu cadastro e garantir o selo de verificação, use o código abaixo:</p>
      <div style="background: #f9fafb; border: 2px dashed #7c3aed; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #111827;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">
        Este código expira em 10 minutos. Se você não solicitou este e-mail, pode ignorá-lo com segurança.
      </p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Equipe de Segurança TrackFeed</p>
    </div>
  `;

  if (!resend) {
    // Modo de desenvolvimento: exibe o código no terminal
    console.log(`[DEV] Código de verificação para ${email}: ${code}`);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TrackFeed <onboarding@resend.dev>',
      to: [recipient],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("[RESEND] Erro ao enviar verificação:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[RESEND] Exceção:", err);
    return { success: false, error: err };
  }
}

/**
 * Envia e-mail de Recuperação de Senha
 */
export async function sendResetPasswordEmail(email: string, userName: string, resetLink: string) {
  const subject = "Recuperação de Senha - TrackFeed";

  let recipient = email;
  let sandboxNote = "";

  const sandboxEmail = process.env.RESEND_SANDBOX_EMAIL;

  // Redirecionamento dinâmico de Sandbox do Resend para evitar falhas de envio local/testes
  if (sandboxEmail && email.toLowerCase() !== sandboxEmail.toLowerCase()) {
    recipient = sandboxEmail;
    sandboxNote = `<p style="color: #ef4444; font-size: 11px; text-align: center; font-weight: bold; background: #fee2e2; padding: 8px; border-radius: 8px; margin-bottom: 15px; font-family: sans-serif;">⚠️ MODO SANDBOX RESEND: Destinatário original era <b>${email}</b></p>`;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      ${sandboxNote}
      <h2 style="color: #7c3aed; text-align: center;">Olá, ${userName}!</h2>
      <p style="color: #374151; font-size: 16px; text-align: center;">Recebemos um pedido para redefinir a sua senha no TrackFeed.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: #7c3aed; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Redefinir Minha Senha
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Se você não solicitou isso, pode ignorar este e-mail com segurança. Sua senha atual permanecerá a mesma.
      </p>
    </div>
  `;

  if (!resend) {
    console.log(`[DEV] Link de reset para ${email}: ${resetLink}`);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TrackFeed <onboarding@resend.dev>',
      to: [recipient],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("[RESEND] Erro ao enviar reset:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[RESEND] Exceção:", err);
    return { success: false, error: err };
  }
}
