import { env } from "../config/env";
import { ApiError } from "./ApiError";

export class EmailService {
  async sendOtp(email: string, code: string) {
    if (!env.resendApiKey) {
      throw new ApiError(503, "Email verification is not configured. Add RESEND_API_KEY and MAIL_FROM on the server.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.mailFrom,
        to: email,
        subject: "Your Maintainex verification code",
        text: `Your Maintainex verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your Maintainex verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
      })
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string };
      throw new ApiError(response.status, error.message ?? "Could not send verification email.");
    }

    return { sent: true };
  }
}
