"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { MessageSquarePlus, Send, Sparkles, Square, UserRound, X } from "lucide-react";
import type { ChatStatus, ChatThreadMessage } from "@/lib/chat/protocol";
import {
  ChatRequestError,
  clearSession,
  fetchThread,
  loadSession,
  requestHumanHelp,
  saveSession,
  sendChatMessage,
  type ChatSession,
} from "@/components/chat/chatClient";

const MAX_CHARS = 1000;
const POLL_MS = 8000;

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
    >
      {children}
    </a>
  ),
};

/** Append messages whose ids we don't have yet, keeping chronological order. */
function mergeMessages(current: ChatThreadMessage[], incoming: ChatThreadMessage[]) {
  const known = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !known.has(m.id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const latestTime = (messages: ChatThreadMessage[]) =>
  messages.reduce<string | undefined>(
    (max, m) => (!m.id.startsWith("local-") && (!max || m.createdAt > max) ? m.createdAt : max),
    undefined,
  );

export default function ChatPanel({
  open,
  onClose,
  ownerName,
  onSeen,
}: {
  open: boolean;
  onClose: () => void;
  ownerName: string;
  /** Called whenever the visitor has seen the newest message (clears the unread dot). */
  onSeen: () => void;
}) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatThreadMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("bot");
  const [hasEmail, setHasEmail] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; retry?: string } | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffName, setHandoffName] = useState("");
  const [handoffEmail, setHandoffEmail] = useState("");
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<ChatSession | null>(null);
  sessionRef.current = session;
  const messagesRef = useRef<ChatThreadMessage[]>([]);
  messagesRef.current = messages;

  const persistSession = useCallback((next: ChatSession | null) => {
    setSession(next);
    if (next) saveSession(next);
  }, []);

  const resetConversation = useCallback(() => {
    abortRef.current?.abort();
    clearSession();
    setSession(null);
    setMessages([]);
    setStatus("bot");
    setHasEmail(false);
    setError(null);
    setHandoffOpen(false);
  }, []);

  /** Load (or refresh) the whole thread from the server. */
  const syncThread = useCallback(
    async (current: ChatSession) => {
      try {
        const thread = await fetchThread(current);
        setMessages(thread.messages);
        setStatus(thread.status);
        setHasEmail(thread.hasEmail);
      } catch (e) {
        if (e instanceof ChatRequestError && e.status === 404) resetConversation();
      }
    },
    [resetConversation],
  );

  // Restore the previous conversation once.
  useEffect(() => {
    const stored = loadSession();
    if (stored) {
      setSession(stored);
      void syncThread(stored);
    }
  }, [syncThread]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Mark everything as seen while the panel is open.
  useEffect(() => {
    if (!open || !session) return;
    const newest = latestTime(messages);
    if (newest && newest !== session.lastSeenAt) {
      persistSession({ ...session, lastSeenAt: newest });
    }
    onSeen();
  }, [open, messages, session, persistSession, onSeen]);

  // Poll for owner replies every 8s while the panel is open and the tab is visible.
  useEffect(() => {
    if (!open || !session) return;
    const poll = async () => {
      const current = sessionRef.current;
      if (!current || document.visibilityState !== "visible") return;
      try {
        const thread = await fetchThread(current, latestTime(messagesRef.current));
        if (thread.messages.length > 0) {
          setMessages((prev) => mergeMessages(prev, thread.messages));
          const fromOwner = thread.messages.filter((m) => m.role === "admin");
          if (fromOwner.length > 0) {
            setAnnouncement(`${ownerName}: ${fromOwner[fromOwner.length - 1].content}`);
          }
        }
        setStatus(thread.status);
        setHasEmail(thread.hasEmail);
      } catch (e) {
        if (e instanceof ChatRequestError && e.status === 404) resetConversation();
      }
    };
    const timer = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, session, ownerName, resetConversation]);

  // Keep the newest message in view.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [messages, sending, status]);

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, MAX_CHARS);
    if (!text || sending) return;
    setError(null);
    setInput("");
    setSending(true);

    const localVisitorId = `local-visitor-${Date.now()}`;
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: localVisitorId, role: "visitor", content: text, createdAt: now },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    let botId: string | null = null;
    let replyText = "";
    let current = sessionRef.current;

    try {
      const result = await sendChatMessage({
        session: current,
        text,
        signal: controller.signal,
        onStart: (start) => {
          if (start.session) {
            current = start.session;
            persistSession(start.session);
          }
          if (start.status) setStatus(start.status);
          botId = start.botMessageId;
          setMessages((prev) => [
            ...prev.map((m) =>
              m.id === localVisitorId && start.visitorMessageId
                ? { ...m, id: start.visitorMessageId }
                : m,
            ),
            ...(start.botMessageId
              ? [
                  {
                    id: start.botMessageId,
                    role: "bot" as const,
                    content: "",
                    createdAt: new Date().toISOString(),
                  },
                ]
              : []),
          ]);
          setStreamingId(start.botMessageId);
        },
        onText: (chunk) => {
          replyText += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, content: m.content + chunk } : m)),
          );
        },
      });

      const reply = replyText;
      if (result.botMessageId && !reply.trim() && !controller.signal.aborted) {
        setError({
          text: `The assistant couldn't answer just now. Try again, or talk to ${ownerName}.`,
          retry: text,
        });
      } else if (reply) {
        setAnnouncement(`Assistant: ${reply}`);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        // Not saved on the server: take the optimistic message back out.
        setMessages((prev) => prev.filter((m) => m.id !== localVisitorId));
        if (e instanceof ChatRequestError && e.status === 401) resetConversation();
        setError({
          text:
            e instanceof ChatRequestError
              ? e.message
              : "Couldn't reach the assistant. Check your connection and try again.",
          retry: text,
        });
      }
    } finally {
      setSending(false);
      setStreamingId(null);
      abortRef.current = null;
      // The server is the source of truth (ids, status changes from a handoff, saved reply).
      if (current) await syncThread(current);
    }
  };

  const submitHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setHandoffBusy(true);
    setError(null);
    try {
      const result = await requestHumanHelp({
        session: sessionRef.current,
        name: handoffName.trim() || undefined,
        email: handoffEmail.trim() || undefined,
      });
      if (result.session) persistSession(result.session);
      setStatus(result.status);
      setHasEmail(result.hasEmail);
      setHandoffOpen(false);
      setAnnouncement(`${ownerName} has been notified.`);
    } catch (err) {
      setError({ text: err instanceof Error ? err.message : "Something went wrong." });
    }
    setHandoffBusy(false);
  };

  const ownerInvolved = status === "needs_human" || status === "human";
  const showEmailPrompt = ownerInvolved && !hasEmail;

  const handoffForm = (askName: boolean) => (
    <form onSubmit={submitHandoff} className="space-y-2">
      {askName && (
        <>
          <label htmlFor="handoff-name" className="sr-only">
            Your name (optional)
          </label>
          <input
            id="handoff-name"
            value={handoffName}
            maxLength={100}
            onChange={(e) => setHandoffName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </>
      )}
      <label htmlFor="handoff-email" className="sr-only">
        Your email (optional)
      </label>
      <input
        id="handoff-email"
        type="email"
        value={handoffEmail}
        maxLength={254}
        onChange={(e) => setHandoffEmail(e.target.value)}
        placeholder="Your email (optional)"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      <button
        type="submit"
        disabled={handoffBusy}
        className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {handoffBusy ? "Sending…" : askName ? `Notify ${ownerName}` : "Save email"}
      </button>
    </form>
  );

  return (
    <div
      id="chat-panel"
      role="dialog"
      aria-labelledby="chat-title"
      hidden={!open}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      // Tailwind's `flex` would override the `hidden` attribute, so toggle the display class too.
      className={`${open ? "flex" : "hidden"} fixed inset-0 z-[70] flex-col bg-white text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100 sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-gray-700`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <h2 id="chat-title" className="font-semibold">
            Ask about me
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {session && (
            <button
              type="button"
              onClick={resetConversation}
              aria-label="Start a new conversation"
              title="Start a new conversation"
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <MessageSquarePlus size={18} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Hi! I can answer questions about {ownerName}&apos;s skills, experience and projects.
              Try one of these:
            </p>
            <ul className="flex flex-col items-start gap-2">
              {[
                "What's his tech stack?",
                "Show me his best project",
                "Is he available for work?",
                "উনি কোন কোন technology তে কাজ করেন?",
              ].map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-left text-sm text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) => {
          if (m.role === "visitor") {
            return (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-indigo-600 px-3.5 py-2 text-sm text-white">
                  <span className="sr-only">You: </span>
                  {m.content}
                </p>
              </div>
            );
          }
          if (m.role === "admin") {
            return (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <UserRound size={12} aria-hidden="true" /> {ownerName}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            );
          }
          if (!m.content && m.id !== streamingId) return null;
          return (
            <div key={m.id} className="flex justify-start">
              <div className="prose prose-sm max-w-[85%] break-words rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-gray-900 dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 dark:bg-gray-800 dark:text-gray-100">
                <span className="sr-only">Assistant: </span>
                {m.content ? (
                  <ReactMarkdown
                    components={markdownComponents}
                    skipHtml
                    disallowedElements={["img"]}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <span className="flex gap-1 py-1" aria-label="Assistant is typing">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400 motion-reduce:animate-none"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {status === "human" && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {ownerName} has joined the chat and will answer personally.
          </p>
        )}
        {status === "needs_human" && (
          <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100">
            {ownerName} has been notified and will reply here.
          </p>
        )}
        {status === "closed" && (
          <p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            This conversation was closed. Send a message to continue.
          </p>
        )}

        {showEmailPrompt && (
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="mb-2 text-sm">
              Leave your email to also get the reply by email (optional):
            </p>
            {handoffForm(false)}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            <p>{error.text}</p>
            {error.retry && (
              <button
                type="button"
                onClick={() => void send(error.retry ?? "")}
                className="mt-2 font-medium underline underline-offset-2"
              >
                Try again
              </button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        {!ownerInvolved &&
          (handoffOpen ? (
            <div className="mb-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Talk to {ownerName}</p>
                <button
                  type="button"
                  onClick={() => setHandoffOpen(false)}
                  aria-label="Cancel"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              {handoffForm(true)}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHandoffOpen(true)}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
            >
              <UserRound size={14} aria-hidden="true" /> Talk to {ownerName}
            </button>
          ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Your question
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={status === "human" ? `Message ${ownerName}…` : "Ask a question…"}
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />
          {sending ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              aria-label="Stop"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              <Square size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          )}
        </form>
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Answers are AI-generated and may be imperfect. Conversations are saved so {ownerName} can
          follow up.
          {input.length > MAX_CHARS - 100 && ` ${input.length}/${MAX_CHARS}`}
        </p>
      </div>
    </div>
  );
}
