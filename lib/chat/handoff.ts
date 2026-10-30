import "server-only";
import { stepCountIs, tool } from "ai";
import { z } from "zod";
import { requestHandoff } from "@/lib/chat/conversations";

/**
 * The `request_human_help` tool. When the model calls it, the conversation is flagged for
 * the owner (status needs_human), the visitor's message is marked unanswered and the owner
 * is notified. The model then writes one more step: its reply to the visitor.
 */
export function buildHandoffTool(context: {
  conversationId: string;
  visitorMessageId: string;
  visitorMessage: string;
}) {
  return {
    tool: tool({
      description:
        "Hand the conversation over to the portfolio owner. Use it when the visitor asks to talk to the owner directly, or asks something important (hiring, rates, availability details, collaboration) that the knowledge base cannot answer.",
      inputSchema: z.object({
        reason: z
          .string()
          .max(300)
          .describe("One short sentence: why the owner should reply personally."),
      }),
      execute: async ({ reason }) => {
        await requestHandoff(context.conversationId, {
          reason,
          visitorMessageId: context.visitorMessageId,
          visitorMessage: context.visitorMessage,
          source: "assistant",
        });
        return {
          ok: true,
          note: "The owner has been notified and will reply in this chat. The visitor can leave an email address in the chat to get the reply by email.",
        };
      },
    }),
    stopWhen: stepCountIs(2),
  };
}
