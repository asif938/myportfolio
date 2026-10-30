import "server-only";
import type { Conversation } from "@prisma/client";
import { redactSecrets } from "@/lib/ai/sanitizeError";
import { getProfile } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

const TIMEOUT_MS = 5_000;

type HandoffDetails = {
  reason: string | null;
  visitorMessage: string | null;
  source: "assistant" | "visitor";
};

function summary(conversation: Conversation, details: HandoffDetails) {
  const who = conversation.visitorName ?? "A visitor";
  const lines = [
    details.source === "assistant"
      ? `${who} needs you: the assistant handed the chat over.`
      : `${who} asked to talk to you in the chat.`,
    details.reason ? `Reason: ${details.reason}` : null,
    details.visitorMessage ? `Message: "${details.visitorMessage.slice(0, 500)}"` : null,
    conversation.visitorEmail ? `Email: ${conversation.visitorEmail}` : "No email left yet.",
    `Reply: ${absoluteUrl(`/admin/conversations/${conversation.id}`)}`,
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

async function post(url: string, init: RequestInit): Promise<void> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/** Email the owner via Resend (RESEND_API_KEY). */
async function viaEmail(text: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  const to = process.env.CONTACT_NOTIFY_EMAIL?.trim() || (await getProfile())?.email;
  if (!to) return null;
  await post("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM?.trim() || "Portfolio <onboarding@resend.dev>",
      to: [to],
      subject: "Portfolio chat: a visitor needs you",
      text,
    }),
  });
  return "email";
}

/** Telegram bot message (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID). */
async function viaTelegram(text: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  await post(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  return "telegram";
}

/** ntfy push notification (NTFY_TOPIC_URL, optional NTFY_TOKEN). */
async function viaNtfy(text: string): Promise<string | null> {
  const url = process.env.NTFY_TOPIC_URL?.trim();
  if (!url || !/^https:\/\//.test(url)) return null;
  const token = process.env.NTFY_TOKEN?.trim();
  await post(url, {
    method: "POST",
    headers: {
      Title: "Portfolio chat: a visitor needs you",
      Tags: "speech_balloon",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: text,
  });
  return "ntfy";
}

/**
 * Tell the owner a conversation needs them. Every channel is optional and env-configured.
 * Never throws: a failed notification must not break the chat.
 */
export async function notifyHandoff(
  conversation: Conversation,
  details: HandoffDetails,
): Promise<void> {
  const text = summary(conversation, details);
  const results = await Promise.allSettled([viaEmail(text), viaTelegram(text), viaNtfy(text)]);
  const secrets = [
    process.env.RESEND_API_KEY,
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.NTFY_TOKEN,
  ];
  for (const result of results) {
    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : "unknown error";
      console.warn("[handoff] notification failed:", redactSecrets(message, secrets));
    }
  }
  if (results.every((r) => r.status === "fulfilled" && r.value === null)) {
    console.info(
      "[handoff] no notification channel configured (RESEND_API_KEY, TELEGRAM_*, NTFY_TOPIC_URL).",
    );
  }
}

/**
 * Email the owner's reply to the visitor (Resend). Returns null when sent, otherwise a short
 * reason. Note: without a verified domain, Resend only delivers to your own address.
 */
export async function emailVisitorReply(
  conversation: Conversation,
  reply: string,
  ownerName: string,
): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return "RESEND_API_KEY is not set.";
  if (!conversation.visitorEmail) return "The visitor left no email.";
  try {
    await post("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM?.trim() || "Portfolio <onboarding@resend.dev>",
        to: [conversation.visitorEmail],
        reply_to: process.env.CONTACT_NOTIFY_EMAIL?.trim() || undefined,
        subject: `${ownerName} replied to your question`,
        text: [
          `Hi${conversation.visitorName ? ` ${conversation.visitorName}` : ""},`,
          "",
          `${ownerName} replied to your chat on the portfolio website:`,
          "",
          reply,
          "",
          `You can continue the conversation at ${absoluteUrl("/")}`,
        ].join("\n"),
      }),
    });
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return redactSecrets(message, [apiKey]);
  }
}
