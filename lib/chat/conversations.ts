import "server-only";
import type { ChatMessage, Conversation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateVisitorToken, verifyVisitorToken } from "@/lib/chat/token";
import { nextStatus, visitorMessageNeedsOwner, type ConversationEvent } from "@/lib/chat/status";
import { notifyHandoff } from "@/lib/chat/notifyHandoff";

/** Messages returned to the visitor when (re)loading a thread. */
export const VISITOR_THREAD_LIMIT = 50;

export type VisitorMessage = {
  id: string;
  role: ChatMessage["role"];
  content: string;
  createdAt: string;
};

export function toVisitorMessage(m: ChatMessage): VisitorMessage {
  return { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() };
}

/** Create a conversation and return it with the plaintext token (shown to the visitor once). */
export async function startConversation(): Promise<{ conversation: Conversation; token: string }> {
  const { token, hash } = generateVisitorToken();
  const conversation = await prisma.conversation.create({ data: { visitorTokenHash: hash } });
  return { conversation, token };
}

/** The conversation if `token` belongs to it, otherwise null. */
export async function authorizeConversation(
  id: string,
  token: string | null,
): Promise<Conversation | null> {
  if (!token) return null;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || !verifyVisitorToken(token, conversation.visitorTokenHash)) return null;
  return conversation;
}

/** Apply a status event and return the new status (does not write). */
export function statusAfter(conversation: Conversation, event: ConversationEvent) {
  return nextStatus(conversation.status, event);
}

/**
 * Save a visitor message. The role is always "visitor" (set here, never from the client).
 * Updates status (a closed thread reopens), lastMessageAt and the admin's unread flag.
 */
export async function addVisitorMessage(conversation: Conversation, content: string) {
  const status = statusAfter(conversation, "visitor_message");
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "visitor", content },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status,
        lastMessageAt: new Date(),
        unreadByAdmin: conversation.unreadByAdmin || visitorMessageNeedsOwner(status),
      },
    }),
  ]);
  return { message, status };
}

/** Save the assistant's reply under an id chosen before streaming started. */
export async function addBotMessage(conversationId: string, id: string, content: string) {
  await prisma.$transaction([
    prisma.chatMessage.create({ data: { id, conversationId, role: "bot", content } }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
}

export function markUnanswered(messageId: string) {
  return prisma.chatMessage.update({ where: { id: messageId }, data: { unanswered: true } });
}

/** Stored messages for building the model's context (oldest first). */
export async function loadRecentMessages(conversationId: string, take = 20) {
  const rows = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take,
    select: { role: true, content: true },
  });
  return rows.reverse();
}

/** Messages for the visitor: everything after `after`, or the latest thread. */
export async function listVisitorMessages(conversationId: string, after?: Date) {
  const rows = after
    ? await prisma.chatMessage.findMany({
        where: { conversationId, createdAt: { gt: after } },
        orderBy: { createdAt: "asc" },
        take: VISITOR_THREAD_LIMIT,
      })
    : (
        await prisma.chatMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: VISITOR_THREAD_LIMIT,
        })
      ).reverse();
  return rows.map(toVisitorMessage);
}

/**
 * Flag a conversation for the owner: status -> needs_human (or stays human),
 * unread for the admin, and the triggering visitor message marked unanswered.
 * Notifies the owner when the conversation newly needs them or the visitor left an email.
 * Returns the updated conversation, or null if it no longer exists.
 */
export async function requestHandoff(
  conversationId: string,
  details: {
    reason?: string | null;
    visitorMessageId?: string | null;
    visitorMessage?: string | null;
    source: "assistant" | "visitor";
    email?: string | null;
    name?: string | null;
  },
): Promise<Conversation | null> {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;

  const status = statusAfter(conversation, "handoff_requested");
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status,
      unreadByAdmin: true,
      ...(details.email ? { visitorEmail: details.email } : {}),
      ...(details.name ? { visitorName: details.name } : {}),
    },
  });
  if (details.visitorMessageId) {
    await markUnanswered(details.visitorMessageId).catch(() => {});
  }

  const newlyNeedsOwner = conversation.status !== "needs_human" && conversation.status !== "human";
  const newEmail = Boolean(details.email) && details.email !== conversation.visitorEmail;
  if (newlyNeedsOwner || newEmail) {
    await notifyHandoff(updated, {
      reason: details.reason ?? null,
      visitorMessage: details.visitorMessage ?? null,
      source: details.source,
    });
  }
  return updated;
}
