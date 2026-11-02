import { randomUUID } from "node:crypto";
import { streamText, type SystemModelMessage } from "ai";
import type { Conversation } from "@prisma/client";
import { getAiSettings } from "@/lib/ai/getSettings";
import { createModel } from "@/lib/ai/providers";
import { getKnowledge } from "@/lib/ai/buildKnowledge";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { sanitizeProviderError } from "@/lib/ai/sanitizeError";
import { recordUsage } from "@/lib/ai/usage";
import { botCanReply } from "@/lib/chat/status";
import { toModelTurns } from "@/lib/chat/history";
import {
  addBotMessage,
  addVisitorMessage,
  authorizeConversation,
  loadRecentMessages,
  markUnanswered,
  startConversation,
} from "@/lib/chat/conversations";
import { buildHandoffTool } from "@/lib/chat/handoff";
import { CHAT_HEADERS, CHAT_TOKEN_HEADER } from "@/lib/chat/protocol";
import { getClientKey, getRateLimiter } from "@/lib/rateLimit";
import { chatRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const json = (body: { error: string }, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

/** Reject cross-site browser requests (other sites embedding this endpoint). */
function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; still rate limited
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let settings;
  try {
    settings = await getAiSettings();
  } catch (error) {
    console.error("[chat] could not load settings:", error instanceof Error ? error.name : "error");
    return json({ error: "The assistant is not available right now." }, 503);
  }
  if (!settings.enabled || !settings.provider || !settings.apiKey) {
    return json({ error: "The assistant is not available right now." }, 503);
  }
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);

  // Rate limits (per hashed IP) from the admin settings.
  const clientKey = getClientKey(req.headers);
  const [perMinute, perDay] = await Promise.all([
    getRateLimiter({ prefix: "chat-minute", limit: settings.perMinuteLimit, window: "1 m" }).limit(
      clientKey,
    ),
    getRateLimiter({ prefix: "chat-day", limit: settings.dailyLimit, window: "1 d" }).limit(
      clientKey,
    ),
  ]);
  if (!perMinute.success || !perDay.success) {
    void recordUsage({ rateLimited: 1 });
    const reset = !perDay.success ? perDay.reset : perMinute.reset;
    return json(
      {
        error: !perDay.success
          ? "You've reached today's message limit. Please use the contact form to get in touch."
          : "You're sending messages a bit too fast. Please wait a moment and try again.",
      },
      429,
      { "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid request." }, 400);

  // Find (and authorize) or start the conversation.
  const headers = new Headers();
  let conversation: Conversation;
  if (parsed.data.conversationId) {
    const found = await authorizeConversation(
      parsed.data.conversationId,
      req.headers.get(CHAT_TOKEN_HEADER),
    );
    if (!found) {
      return json({ error: "This conversation has expired. Please start a new one." }, 401);
    }
    conversation = found;
  } else {
    const started = await startConversation();
    conversation = started.conversation;
    headers.set(CHAT_HEADERS.token, started.token);
  }
  headers.set(CHAT_HEADERS.conversationId, conversation.id);

  // Persist the visitor message before calling the model.
  const { message: visitorMessage, status } = await addVisitorMessage(
    conversation,
    parsed.data.message,
  );
  headers.set(CHAT_HEADERS.visitorMessageId, visitorMessage.id);
  headers.set(CHAT_HEADERS.status, status);

  // The owner has taken over: no bot reply.
  if (!botCanReply(status)) {
    return new Response(null, { status: 200, headers });
  }

  const [knowledge, stored] = await Promise.all([
    getKnowledge(),
    loadRecentMessages(conversation.id),
  ]);
  const instructions: SystemModelMessage = {
    role: "system",
    content: buildSystemPrompt({
      ownerName: knowledge.ownerName,
      email: knowledge.email,
      knowledge: knowledge.markdown,
      extraInstructions: settings.extraInstructions,
    }),
    // Anthropic needs an explicit cache breakpoint; OpenAI and Gemini cache long
    // identical prefixes automatically.
    ...(settings.provider === "anthropic"
      ? { providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }
      : {}),
  };

  const botMessageId = randomUUID();
  headers.set(CHAT_HEADERS.botMessageId, botMessageId);
  const apiKey = settings.apiKey;
  void recordUsage({ requests: 1 });

  const handoff = buildHandoffTool({
    conversationId: conversation.id,
    visitorMessageId: visitorMessage.id,
    visitorMessage: parsed.data.message,
  });

  const result = streamText({
    model: createModel(settings.provider, apiKey, settings.model),
    instructions,
    messages: toModelTurns(stored, knowledge.ownerName),
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    maxRetries: 1,
    abortSignal: req.signal,
    tools: { request_human_help: handoff.tool },
    // One step for a tool call, one for the reply after it.
    stopWhen: handoff.stopWhen,
    onEnd: async ({ text, totalUsage }) => {
      await recordUsage({
        inputTokens: totalUsage.inputTokens,
        outputTokens: totalUsage.outputTokens,
        cachedInputTokens: totalUsage.inputTokenDetails?.cacheReadTokens,
      });
      if (text.trim()) {
        await addBotMessage(conversation.id, botMessageId, text.trim());
      } else {
        await markUnanswered(visitorMessage.id);
      }
    },
    onError: async ({ error }) => {
      console.error("[chat] provider error:", sanitizeProviderError(error, apiKey));
      await recordUsage({ errors: 1 });
      await markUnanswered(visitorMessage.id).catch(() => {});
    },
  });

  return result.toTextStreamResponse({ headers });
}
