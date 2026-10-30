import { getAiSettings } from "@/lib/ai/getSettings";
import { authorizeConversation, requestHandoff, startConversation } from "@/lib/chat/conversations";
import { CHAT_HEADERS, CHAT_TOKEN_HEADER } from "@/lib/chat/protocol";
import { getClientKey, getRateLimiter } from "@/lib/rateLimit";
import { chatHandoffSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Talk to <owner>" and "leave your email": flags the conversation for the owner
 * (creating one if needed) and stores the optional name/email.
 */
export async function POST(req: Request) {
  const settings = await getAiSettings().catch(() => null);
  if (!settings?.enabled) {
    return Response.json({ error: "The chat is not available right now." }, { status: 503 });
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && new URL(origin).host !== host) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = await getRateLimiter({ prefix: "chat-handoff", limit: 5, window: "1 h" }).limit(
    getClientKey(req.headers),
  );
  if (!limit.success) {
    return Response.json(
      { error: "Too many requests. Please use the contact form instead." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = chatHandoffSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const headers = new Headers();
  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const found = await authorizeConversation(conversationId, req.headers.get(CHAT_TOKEN_HEADER));
    if (!found) {
      return Response.json(
        { error: "This conversation has expired. Please start a new one." },
        { status: 401 },
      );
    }
  } else {
    const started = await startConversation();
    conversationId = started.conversation.id;
    headers.set(CHAT_HEADERS.token, started.token);
  }
  headers.set(CHAT_HEADERS.conversationId, conversationId);

  const updated = await requestHandoff(conversationId, {
    source: "visitor",
    reason: "The visitor asked to talk to you.",
    email: parsed.data.email,
    name: parsed.data.name,
  });
  if (!updated) return Response.json({ error: "Not found." }, { status: 404 });

  headers.set(CHAT_HEADERS.status, updated.status);
  return Response.json(
    { conversationId, status: updated.status, hasEmail: Boolean(updated.visitorEmail) },
    { headers },
  );
}
