import type { ConversationStatus } from "@prisma/client";

/**
 * Conversation status rules in one place.
 *
 *   bot          the assistant answers
 *   needs_human  the assistant asked for the owner (or the visitor did); it keeps answering
 *   human        the owner replied; the assistant stays silent until handed back
 *   closed       finished; a new visitor message reopens it with the assistant
 */
export type ConversationEvent =
  "visitor_message" | "handoff_requested" | "admin_reply" | "hand_back" | "close" | "reopen";

export function nextStatus(
  current: ConversationStatus,
  event: ConversationEvent,
): ConversationStatus {
  switch (event) {
    case "visitor_message":
      return current === "closed" ? "bot" : current;
    case "handoff_requested":
      // Already with the owner: stay there.
      return current === "human" ? "human" : "needs_human";
    case "admin_reply":
      return "human";
    case "hand_back":
      return "bot";
    case "close":
      return "closed";
    case "reopen":
      return current === "closed" ? "bot" : current;
  }
}

/** The assistant replies unless the owner has taken over (or the thread is closed). */
export function botCanReply(status: ConversationStatus): boolean {
  return status === "bot" || status === "needs_human";
}

/** A visitor message should flag the conversation for the owner in these states. */
export function visitorMessageNeedsOwner(status: ConversationStatus): boolean {
  return status === "needs_human" || status === "human";
}
