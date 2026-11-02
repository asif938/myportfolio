"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import type { Message } from "@prisma/client";
import { deleteMessage, markAllMessagesRead, setMessageRead } from "@/app/actions/messageActions";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import { secondaryButtonClass } from "../formStyles";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Filter = "all" | "unread";

export default function MessagesAdminClient({
  messages,
  total,
}: {
  messages: Message[];
  total: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const unreadCount = messages.filter((m) => !m.read).length;
  const visible = filter === "unread" ? messages.filter((m) => !m.read) : messages;

  const setRead = async (message: Message, read: boolean, quiet = false) => {
    setBusyId(message.id);
    const ok = await runAdminAction(
      () => setMessageRead(message.id, read),
      read ? "Marked as read" : "Marked as unread",
      { quiet },
    );
    if (ok) router.refresh();
    setBusyId(null);
  };

  const toggleOpen = (message: Message) => {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    // Opening an unread message marks it as read.
    if (opening && !message.read) void setRead(message, true, true);
  };

  const handleDelete = async (message: Message) => {
    if (!(await confirmDelete(`the message from ${message.name}`))) return;
    setBusyId(message.id);
    if (await runAdminAction(() => deleteMessage(message.id), "Message deleted")) {
      if (openId === message.id) setOpenId(null);
      router.refresh();
    }
    setBusyId(null);
  };

  const handleMarkAll = async () => {
    if (await runAdminAction(() => markAllMessagesRead(), "All messages marked as read")) {
      router.refresh();
    }
  };

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active ? "bg-brand-gradient-deep text-white" : "text-fg hover:bg-surface-2  "
    }`;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-fg">
          Messages{" "}
          {unreadCount > 0 && (
            <span className="ml-1 rounded-full bg-brand-gradient-deep px-2.5 py-0.5 align-middle text-sm text-white">
              {unreadCount} unread
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Filter messages" className="flex gap-1">
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              className={tabClass(filter === "all")}
            >
              All ({messages.length})
            </button>
            <button
              type="button"
              aria-pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
              className={tabClass(filter === "unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAll} className={secondaryButtonClass}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {total > messages.length && (
        <p className="text-sm text-muted">
          Showing the newest {messages.length} of {total} messages.
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-lg bg-surface p-8 text-center text-muted shadow-sm">
          {filter === "unread" ? "No unread messages." : "No messages yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((message) => {
            const open = openId === message.id;
            const busy = busyId === message.id;
            return (
              <li
                key={message.id}
                id={`message-${message.id}`}
                className={`rounded-lg bg-surface shadow-sm ${
                  message.read ? "" : "border-l-4 border-line-strong"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(message)}
                  aria-expanded={open}
                  aria-controls={`message-body-${message.id}`}
                  className="flex w-full items-start gap-3 rounded-lg p-4 text-left"
                >
                  {message.read ? (
                    <MailOpen size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  ) : (
                    <Mail size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className={message.read ? "font-medium" : "font-bold"}>
                        {message.name}
                        {!message.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      <time
                        dateTime={new Date(message.createdAt).toISOString()}
                        className="text-xs text-muted"
                      >
                        {dateFormatter.format(new Date(message.createdAt))}
                      </time>
                    </span>
                    <span className="block truncate text-sm text-fg">{message.subject}</span>
                    {!open && (
                      <span className="block truncate text-sm text-muted">{message.body}</span>
                    )}
                  </span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div id={`message-body-${message.id}`} className="border-t px-4 pb-4 pt-3">
                    <p className="mb-3 text-sm text-muted">
                      From{" "}
                      <a href={`mailto:${message.email}`} className="text-accent hover:underline">
                        {message.email}
                      </a>
                    </p>
                    <p className="whitespace-pre-wrap break-words text-fg">{message.body}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        <Reply size={14} aria-hidden="true" /> Reply by email
                      </a>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setRead(message, !message.read)}
                        className="inline-flex items-center gap-1 text-fg hover:underline disabled:opacity-50"
                      >
                        {message.read ? (
                          <>
                            <Mail size={14} aria-hidden="true" /> Mark as unread
                          </>
                        ) : (
                          <>
                            <MailOpen size={14} aria-hidden="true" /> Mark as read
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(message)}
                        className="inline-flex items-center gap-1 text-danger hover:underline disabled:opacity-50"
                      >
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
