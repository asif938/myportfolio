"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { runSafely } from "@/lib/actionHelpers";
import { getProfile } from "@/lib/data";
import { nextStatus } from "@/lib/chat/status";
import { emailVisitorReply } from "@/lib/chat/notifyHandoff";
import { firstIssue, type ActionResult } from "@/lib/validations";

const conversationIdSchema = z.uuid("Invalid conversation");
const replySchema = z.object({
  conversationId: conversationIdSchema,
  content: z
    .string()
    .trim()
    .min(1, "Write a reply first")
    .max(4000, "Replies can be at most 4000 characters"),
});
const statusActionSchema = z.enum(["close", "reopen", "hand_back"]);

function revalidateConversations(id?: string) {
  // The admin layout shows the badge, so refresh the whole admin tree.
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/conversations/${id}`);
}

export type ReplyResult =
  { ok: true; emailed: boolean; emailNote: string | null } | { ok: false; error: string };

/**
 * Reply as the owner: saves an admin message, sets status=human (the bot stops replying),
 * clears the unread flag and the "unanswered" marks, and emails the visitor if possible.
 */
export async function replyToConversation(input: unknown): Promise<ReplyResult> {
  await requireAdmin();

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { conversationId, content } = parsed.data;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return { ok: false, error: "That conversation no longer exists." };

  const saved = await runSafely(() =>
    prisma.$transaction([
      prisma.chatMessage.create({ data: { conversationId, role: "admin", content } }),
      prisma.chatMessage.updateMany({
        where: { conversationId, unanswered: true },
        data: { unanswered: false },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: nextStatus(conversation.status, "admin_reply"),
          unreadByAdmin: false,
          lastMessageAt: new Date(),
        },
      }),
    ]),
  );
  if (!saved.ok) return saved;
  revalidateConversations(conversationId);

  if (!conversation.visitorEmail) return { ok: true, emailed: false, emailNote: null };
  const ownerName = (await getProfile())?.name ?? "The site owner";
  const emailError = await emailVisitorReply(conversation, content, ownerName);
  return {
    ok: true,
    emailed: emailError === null,
    emailNote: emailError ? `Reply saved, but the email was not sent: ${emailError}` : null,
  };
}

/** Close, reopen, or hand the conversation back to the assistant. */
export async function updateConversationStatus(
  id: unknown,
  action: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = conversationIdSchema.safeParse(id);
  const parsedAction = statusActionSchema.safeParse(action);
  if (!parsedId.success || !parsedAction.success) return { ok: false, error: "Invalid request" };

  const result = await runSafely(async () => {
    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { id: parsedId.data },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: nextStatus(conversation.status, parsedAction.data),
        // Closing or handing back means nothing is waiting for the owner any more.
        ...(parsedAction.data === "reopen" ? {} : { unreadByAdmin: false }),
      },
    });
  });
  if (result.ok) revalidateConversations(parsedId.data);
  return result;
}

export async function markConversationRead(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = conversationIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() =>
    prisma.conversation.update({ where: { id: parsedId.data }, data: { unreadByAdmin: false } }),
  );
  if (result.ok) revalidateConversations(parsedId.data);
  return result;
}

export async function deleteConversation(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = conversationIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  // Messages are removed by the database (onDelete: Cascade).
  const result = await runSafely(() =>
    prisma.conversation.delete({ where: { id: parsedId.data } }),
  );
  if (result.ok) revalidateConversations();
  return result;
}
