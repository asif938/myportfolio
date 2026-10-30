import { authorizeConversation, listVisitorMessages } from "@/lib/chat/conversations";
import { CHAT_TOKEN_HEADER, type ChatThreadResponse } from "@/lib/chat/protocol";
import { getClientKey, getRateLimiter } from "@/lib/rateLimit";
import { chatPollSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * New messages in a conversation for the visitor (polling), or the latest thread when
 * `after` is omitted. Authenticated by the visitor token.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const limit = await getRateLimiter({ prefix: "chat-poll", limit: 40, window: "1 m" }).limit(
    getClientKey(req.headers),
  );
  if (!limit.success) {
    return Response.json({ error: "Too many requests." }, { status: 429, headers: noStore });
  }

  const parsed = chatPollSchema.safeParse({
    id: params.id,
    after: new URL(req.url).searchParams.get("after") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400, headers: noStore });
  }

  const conversation = await authorizeConversation(
    parsed.data.id,
    req.headers.get(CHAT_TOKEN_HEADER),
  );
  if (!conversation) {
    return Response.json({ error: "Not found." }, { status: 404, headers: noStore });
  }

  const body: ChatThreadResponse = {
    status: conversation.status,
    hasEmail: Boolean(conversation.visitorEmail),
    messages: await listVisitorMessages(
      conversation.id,
      parsed.data.after ? new Date(parsed.data.after) : undefined,
    ),
  };
  return Response.json(body, { headers: noStore });
}
