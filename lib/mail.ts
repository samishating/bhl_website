import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetPasswordEmail(email: string, token: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Mail] RESEND_API_KEY is not defined. Email will not be sent.');
    return { success: false, error: 'RESEND_API_KEY is missing' };
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'Brotherhood Legacy <noreply@brotherhoodlegacy.com>',
      to: email,
      subject: 'Reset your Brotherhood Legacy password',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 2rem; border-radius: 12px; border: 1px solid #222;">
          <h1 style="color: #ff0055; text-align: center; font-family: 'Rajdhani', sans-serif; letter-spacing: 2px;">BROTHERHOOD LEGACY</h1>
          <p style="font-size: 1.1rem; line-height: 1.6; color: #e0e0e0;">You requested a password reset for your Brotherhood Legacy account.</p>
          <p style="color: #888; margin-bottom: 2rem;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(90deg, #ff0055, #cc0000); color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 0, 85, 0.3);">Reset Password</a>
          </div>
          <p style="margin-top: 2rem; font-size: 0.85rem; color: #666; text-align: center;">
            Or copy and paste this link: <br/>
            <a href="${resetUrl}" style="color: #555; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('[Mail] Error sending reset email:', error);
    return { success: false, error };
  }
}
