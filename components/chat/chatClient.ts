import {
  CHAT_HEADERS,
  CHAT_TOKEN_HEADER,
  type ChatStatus,
  type ChatThreadResponse,
} from "@/lib/chat/protocol";

/** What the widget remembers between visits (localStorage). */
export type ChatSession = { conversationId: string; token: string; lastSeenAt?: string };

const STORAGE_KEY = "portfolio-chat-session";

export function loadSession(): ChatSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "conversationId" in value &&
      "token" in value &&
      typeof value.conversationId === "string" &&
      typeof value.token === "string"
    ) {
      const lastSeenAt =
        "lastSeenAt" in value && typeof value.lastSeenAt === "string"
          ? value.lastSeenAt
          : undefined;
      return { conversationId: value.conversationId, token: value.token, lastSeenAt };
    }
  } catch {
    // Storage blocked or corrupt: behave like a first visit.
  }
  return null;
}

export function saveSession(session: ChatSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the conversation just won't survive a reload.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export class ChatRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ChatRequestError";
  }
}

async function errorFrom(response: Response): Promise<ChatRequestError> {
  let message = "Something went wrong. Please try again.";
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      message = body.error;
    }
  } catch {
    // not JSON
  }
  return new ChatRequestError(message, response.status);
}

/** Read the conversation headers; a new token only comes with a new conversation. */
function sessionFrom(response: Response, previous: ChatSession | null): ChatSession | null {
  const conversationId = response.headers.get(CHAT_HEADERS.conversationId);
  const token = response.headers.get(CHAT_HEADERS.token) ?? previous?.token;
  if (!conversationId || !token) return previous;
  return { conversationId, token, lastSeenAt: previous?.lastSeenAt };
}

export type SendResult = {
  session: ChatSession | null;
  visitorMessageId: string | null;
  botMessageId: string | null;
  status: ChatStatus | null;
};

/**
 * Send a visitor message. Calls `onStart` once the response headers arrive (ids known)
 * and `onText` for every streamed chunk of the bot's reply.
 */
export async function sendChatMessage(options: {
  session: ChatSession | null;
  text: string;
  signal: AbortSignal;
  onStart: (result: SendResult) => void;
  onText: (chunk: string) => void;
}): Promise<SendResult> {
  const { session, text, signal, onStart, onText } = options;
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { [CHAT_TOKEN_HEADER]: session.token } : {}),
    },
    body: JSON.stringify({ conversationId: session?.conversationId, message: text }),
    signal,
  });
  if (!response.ok) throw await errorFrom(response);

  const status = response.headers.get(CHAT_HEADERS.status);
  const result: SendResult = {
    session: sessionFrom(response, session),
    visitorMessageId: response.headers.get(CHAT_HEADERS.visitorMessageId),
    botMessageId: response.headers.get(CHAT_HEADERS.botMessageId),
    status:
      status === "bot" || status === "needs_human" || status === "human" || status === "closed"
        ? status
        : null,
  };
  onStart(result);

  if (response.body && result.botMessageId) {
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) onText(value);
    }
  }
  return result;
}

/** The thread (or only messages after `after`). Throws ChatRequestError(404) if it's gone. */
export async function fetchThread(
  session: ChatSession,
  after?: string,
): Promise<ChatThreadResponse> {
  const query = after ? `?after=${encodeURIComponent(after)}` : "";
  const response = await fetch(`/api/chat/${session.conversationId}/messages${query}`, {
    headers: { [CHAT_TOKEN_HEADER]: session.token },
    cache: "no-store",
  });
  if (!response.ok) throw await errorFrom(response);
  return (await response.json()) as ChatThreadResponse;
}

/** "Talk to …" / leave an email. Creates a conversation when there is none yet. */
export async function requestHumanHelp(options: {
  session: ChatSession | null;
  name?: string;
  email?: string;
}): Promise<{ session: ChatSession | null; status: ChatStatus; hasEmail: boolean }> {
  const { session, name, email } = options;
  const response = await fetch("/api/chat/handoff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { [CHAT_TOKEN_HEADER]: session.token } : {}),
    },
    body: JSON.stringify({ conversationId: session?.conversationId, name, email }),
  });
  if (!response.ok) throw await errorFrom(response);
  const body = (await response.json()) as { status: ChatStatus; hasEmail: boolean };
  return { session: sessionFrom(response, session), status: body.status, hasEmail: body.hasEmail };
}
