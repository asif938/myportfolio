import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type ModelMessage,
  type SystemModelMessage,
} from "ai";
import { getAiSettings } from "@/lib/ai/getSettings";
import { createModel } from "@/lib/ai/providers";
import { getKnowledge } from "@/lib/ai/buildKnowledge";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { sanitizeProviderError } from "@/lib/ai/sanitizeError";
import { recordUsage } from "@/lib/ai/usage";
import { getClientIp, getRateLimiter } from "@/lib/rateLimit";
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

  if (!isSameOrigin(req)) {
    return json({ error: "Forbidden" }, 403);
  }

  // Rate limits (per IP) from the admin settings.
  const ip = getClientIp(req.headers);
  const [perMinute, perDay] = await Promise.all([
    getRateLimiter({ prefix: "chat-minute", limit: settings.perMinuteLimit, window: "1 m" }).limit(
      ip,
    ),
    getRateLimiter({ prefix: "chat-day", limit: settings.dailyLimit, window: "1 d" }).limit(ip),
  ]);
  if (!perMinute.success || !perDay.success) {
    void recordUsage({ rateLimited: 1 });
    const reset = !perDay.success ? perDay.reset : perMinute.reset;
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return json(
      {
        error: !perDay.success
          ? "You've reached today's message limit. Please use the contact form to get in touch."
          : "You're sending messages a bit too fast. Please wait a moment and try again.",
      },
      429,
      { "Retry-After": String(retryAfter) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid request." }, 400);
  }

  const knowledge = await getKnowledge();
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
  const messages: ModelMessage[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const apiKey = settings.apiKey;
  void recordUsage({ requests: 1 });

  const result = streamText({
    model: createModel(settings.provider, apiKey, settings.model),
    instructions,
    messages,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    maxRetries: 1,
    abortSignal: req.signal,
    onEnd: ({ totalUsage }) =>
      recordUsage({
        inputTokens: totalUsage.inputTokens,
        outputTokens: totalUsage.outputTokens,
        cachedInputTokens: totalUsage.inputTokenDetails?.cacheReadTokens,
      }),
    onError: ({ error }) => {
      console.error("[chat] provider error:", sanitizeProviderError(error, apiKey));
      void recordUsage({ errors: 1 });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // Visitors get a generic message; details (sanitized) are only in the server log.
      onError: () => "Sorry, the assistant ran into a problem. Please try again.",
    }),
  });
}
