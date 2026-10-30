import type { ChatRole } from "@prisma/client";

export type StoredMessage = { role: ChatRole; content: string };
export type ModelTurn = { role: "user" | "assistant"; content: string };

/** Messages sent to the model per request (the newest ones). */
export const HISTORY_LIMIT = 10;

/**
 * Turn stored messages (roles set by the server) into model turns.
 * - visitor -> user, bot -> assistant
 * - admin replies are shown to the model as assistant turns, labelled as the owner's own words
 * - keeps the newest HISTORY_LIMIT turns and drops leading non-visitor turns, so the window
 *   always starts with a user turn
 */
export function toModelTurns(messages: StoredMessage[], ownerName: string): ModelTurn[] {
  const turns: ModelTurn[] = messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) =>
      m.role === "visitor"
        ? { role: "user", content: m.content }
        : m.role === "admin"
          ? { role: "assistant", content: `[${ownerName} replied personally]: ${m.content}` }
          : { role: "assistant", content: m.content },
    );
  const window = turns.slice(-HISTORY_LIMIT);
  const firstUser = window.findIndex((t) => t.role === "user");
  return firstUser === -1 ? [] : window.slice(firstUser);
}
