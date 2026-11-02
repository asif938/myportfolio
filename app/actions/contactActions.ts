"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/data";
import { notifyNewMessage } from "@/lib/notify";
import { getClientKey, getRateLimiter } from "@/lib/rateLimit";
import { contactSchema, type ActionResult } from "@/lib/validations";

/**
 * Public Server Action for the contact form (no admin session required).
 * Next.js already rejects Server Action calls from other origins.
 */
export async function sendContactMessage(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { botcheck, ...data } = parsed.data;

  // Honeypot filled in: pretend it worked so bots don't learn anything.
  if (botcheck) return { ok: true };

  const clientKey = getClientKey(new Headers(headers()));
  const [burst, daily] = await Promise.all([
    getRateLimiter({ prefix: "contact-hour", limit: 5, window: "1 h" }).limit(clientKey),
    getRateLimiter({ prefix: "contact-day", limit: 10, window: "1 d" }).limit(clientKey),
  ]);
  if (!burst.success || !daily.success) {
    return {
      ok: false,
      error: "You've sent several messages already. Please try again later or email me directly.",
    };
  }

  try {
    await prisma.message.create({
      data: { name: data.name, email: data.email, subject: data.subject, body: data.message },
    });
  } catch (error) {
    console.error("[contact] could not save message:", error instanceof Error ? error.name : error);
    return { ok: false, error: "Sorry, your message couldn't be sent. Please try again later." };
  }

  revalidatePath("/admin", "layout");

  // The message is saved; the email notification is best effort.
  const profile = await getProfile().catch(() => null);
  const result = await notifyNewMessage({
    ...data,
    to: process.env.CONTACT_NOTIFY_EMAIL?.trim() || profile?.email || null,
  });
  if (!result.sent) console.warn("[contact] email notification not sent:", result.reason);

  return { ok: true };
}
