import "server-only";
import { redactSecrets } from "@/lib/ai/sanitizeError";

export type ContactNotification = {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Where to send the notification (the site owner). */
  to: string | null;
};

export type NotifyResult =
  { sent: true; via: "resend" | "web3forms" } | { sent: false; reason: string };

const TIMEOUT_MS = 10_000;

function plainTextBody(n: ContactNotification): string {
  return [
    `New message from your portfolio contact form`,
    ``,
    `From: ${n.name} <${n.email}>`,
    `Subject: ${n.subject}`,
    ``,
    n.message,
    ``,
    `Reply to this email to answer ${n.name} directly.`,
  ].join("\n");
}

/** Resend: https://resend.com/docs/api-reference/emails/send-email */
async function sendWithResend(n: ContactNotification, apiKey: string): Promise<NotifyResult> {
  if (!n.to) return { sent: false, reason: "No recipient (set CONTACT_NOTIFY_EMAIL)." };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM?.trim() || "Portfolio <onboarding@resend.dev>",
      to: [n.to],
      reply_to: n.email,
      subject: `Portfolio contact: ${n.subject}`,
      text: plainTextBody(n),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = redactSecrets((await response.text()).slice(0, 200), [apiKey]);
    return { sent: false, reason: `Resend responded ${response.status}: ${detail}` };
  }
  return { sent: true, via: "resend" };
}

/**
 * Web3Forms from the server. Note: Web3Forms only allows server-side submissions on a paid
 * plan with whitelisted server IPs, so this is opt-in via WEB3FORMS_ACCESS_KEY.
 */
async function sendWithWeb3Forms(n: ContactNotification, accessKey: string): Promise<NotifyResult> {
  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `Portfolio contact: ${n.subject}`,
      from_name: "Portfolio",
      name: n.name,
      email: n.email,
      message: n.message,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    return { sent: false, reason: `Web3Forms responded ${response.status}` };
  }
  return { sent: true, via: "web3forms" };
}

/**
 * Email the site owner about a new contact message.
 * Order: Resend (RESEND_API_KEY) -> Web3Forms server-side (WEB3FORMS_ACCESS_KEY) -> none.
 * Never throws: the message is already saved, so a failed email must not fail the form.
 */
export async function notifyNewMessage(n: ContactNotification): Promise<NotifyResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();
  try {
    if (resendKey) return await sendWithResend(n, resendKey);
    if (web3formsKey) return await sendWithWeb3Forms(n, web3formsKey);
    return { sent: false, reason: "No email provider configured (set RESEND_API_KEY)." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { sent: false, reason: redactSecrets(message, [resendKey, web3formsKey]) };
  }
}
