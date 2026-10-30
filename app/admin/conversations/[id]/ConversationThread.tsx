"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, BookPlus, Lock, LockOpen, Send, Trash2, UserRound } from "lucide-react";
import type { ChatMessage, Conversation } from "@prisma/client";
import {
  deleteConversation,
  markConversationRead,
  replyToConversation,
  updateConversationStatus,
} from "@/app/actions/conversationActions";
import { confirmDelete, runAdminAction, showError, showSuccess } from "@/lib/adminFeedback";
import { StatusBadge } from "../StatusBadge";
import { primaryButtonClass, secondaryButtonClass } from "../../formStyles";

type ConversationView = Omit<Conversation, "visitorTokenHash">;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** The first admin reply after a visitor message (used to prefill "Add to FAQ"). */
function replyAfter(messages: ChatMessage[], index: number): ChatMessage | undefined {
  for (let i = index + 1; i < messages.length; i++) {
    if (messages[i].role === "visitor") return undefined;
    if (messages[i].role === "admin") return messages[i];
  }
  return undefined;
}

export default function ConversationThread({
  conversation,
  messages,
  ownerName,
}: {
  conversation: ConversationView;
  messages: ChatMessage[];
  ownerName: string;
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  // Opening the conversation marks it as read.
  useEffect(() => {
    if (conversation.unreadByAdmin) {
      void markConversationRead(conversation.id).then((r) => r.ok && router.refresh());
    }
  }, [conversation.id, conversation.unreadByAdmin, router]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await replyToConversation({ conversationId: conversation.id, content: reply });
      if (result.ok) {
        setReply("");
        if (result.emailNote) showError(result.emailNote);
        else showSuccess(result.emailed ? "Reply sent and emailed to the visitor" : "Reply sent");
        router.refresh();
      } else {
        showError(result.error);
      }
    } catch {
      showError("Request failed. Your session may have expired; please sign in again.");
    }
    setBusy(false);
  };

  const setStatus = async (action: "close" | "reopen" | "hand_back", label: string) => {
    setBusy(true);
    if (await runAdminAction(() => updateConversationStatus(conversation.id, action), label)) {
      router.refresh();
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!(await confirmDelete("this conversation"))) return;
    setBusy(true);
    if (await runAdminAction(() => deleteConversation(conversation.id), "Conversation deleted")) {
      router.push("/admin/conversations");
      router.refresh();
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <header className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
              {conversation.visitorName ?? "Visitor"} <StatusBadge status={conversation.status} />
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {conversation.visitorEmail ? (
                <a
                  href={`mailto:${conversation.visitorEmail}`}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {conversation.visitorEmail}
                </a>
              ) : (
                "No email left"
              )}{" "}
              · started {dateFormatter.format(new Date(conversation.createdAt))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {conversation.status === "human" || conversation.status === "needs_human" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void setStatus("hand_back", "Handed back to the bot")}
                className={`${secondaryButtonClass} inline-flex items-center gap-1.5 text-sm`}
              >
                <Bot size={16} aria-hidden="true" /> Hand back to bot
              </button>
            ) : null}
            {conversation.status === "closed" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void setStatus("reopen", "Conversation reopened")}
                className={`${secondaryButtonClass} inline-flex items-center gap-1.5 text-sm`}
              >
                <LockOpen size={16} aria-hidden="true" /> Reopen
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void setStatus("close", "Conversation closed")}
                className={`${secondaryButtonClass} inline-flex items-center gap-1.5 text-sm`}
              >
                <Lock size={16} aria-hidden="true" /> Close
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <Trash2 size={16} aria-hidden="true" /> Delete
            </button>
          </div>
        </div>
      </header>

      <ol aria-label="Messages" className="space-y-3">
        {messages.map((m, index) => {
          const time = dateFormatter.format(new Date(m.createdAt));
          if (m.role === "visitor") {
            const answer = replyAfter(messages, index);
            return (
              <li key={m.id} className="flex flex-col items-start">
                <div
                  className={`max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 ${
                    m.unanswered
                      ? "border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "bg-white shadow-sm dark:bg-gray-800"
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Visitor · {time}
                    {m.unanswered && (
                      <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-amber-900">
                        Unanswered
                      </span>
                    )}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
                {(m.unanswered || answer) && (
                  <Link
                    href={`/admin/faq?q=${encodeURIComponent(m.content.slice(0, 300))}${
                      answer ? `&a=${encodeURIComponent(answer.content.slice(0, 4000))}` : ""
                    }`}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <BookPlus size={12} aria-hidden="true" /> Add to FAQ
                  </Link>
                )}
              </li>
            );
          }
          const isAdmin = m.role === "admin";
          return (
            <li key={m.id} className="flex justify-end">
              <div
                className={`max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 ${
                  isAdmin
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-50 text-gray-900 dark:bg-indigo-950/50 dark:text-gray-100"
                }`}
              >
                <p
                  className={`mb-1 flex items-center gap-1 text-xs font-semibold ${
                    isAdmin ? "text-emerald-100" : "text-indigo-700 dark:text-indigo-300"
                  }`}
                >
                  {isAdmin ? (
                    <UserRound size={12} aria-hidden="true" />
                  ) : (
                    <Bot size={12} aria-hidden="true" />
                  )}
                  {isAdmin ? ownerName : "Bot"} · {time}
                </p>
                {/* Plain text only: never render stored chat content as HTML or Markdown. */}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <form
        onSubmit={sendReply}
        className="space-y-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
      >
        <label htmlFor="reply" className="block text-sm font-medium">
          Reply as {ownerName}
        </label>
        <textarea
          id="reply"
          rows={4}
          maxLength={4000}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="block w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700"
          placeholder="The visitor sees this in the chat (and by email if they left one)."
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Replying takes over from the bot until you hand the conversation back.
          </p>
          <button
            type="submit"
            disabled={busy || !reply.trim()}
            className={`${primaryButtonClass} inline-flex items-center gap-2`}
          >
            <Send size={16} aria-hidden="true" /> Send reply
          </button>
        </div>
      </form>
    </div>
  );
}
