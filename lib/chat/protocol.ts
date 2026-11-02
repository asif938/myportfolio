/** Shared between the chat API routes and the widget (no server imports). */

/** Response headers set by POST /api/chat. */
export const CHAT_HEADERS = {
  conversationId: "X-Chat-Conversation-Id",
  token: "X-Chat-Token",
  visitorMessageId: "X-Chat-Visitor-Message-Id",
  botMessageId: "X-Chat-Bot-Message-Id",
  status: "X-Chat-Status",
} as const;

/** Request header carrying the visitor token. */
export const CHAT_TOKEN_HEADER = "x-chat-token";

export type ChatStatus = "bot" | "needs_human" | "human" | "closed";
export type ChatMessageRole = "visitor" | "bot" | "admin";

export type ChatThreadMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

/** Body of GET /api/chat/[id]/messages. */
export type ChatThreadResponse = {
  status: ChatStatus;
  hasEmail: boolean;
  messages: ChatThreadMessage[];
};
