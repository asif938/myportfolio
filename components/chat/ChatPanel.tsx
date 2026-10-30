"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";
import { RotateCcw, Send, Sparkles, Square, Trash2, X } from "lucide-react";

const MAX_HISTORY = 10;
const MAX_CHARS = 1000;

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** Body sent to /api/chat: the last 10 text messages, each at most 1000 characters. */
function toRequestMessages(messages: UIMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: textOf(m).slice(0, MAX_CHARS) }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_HISTORY);
}

/** The API returns JSON like {"error": "..."} for 4xx/5xx; show that text to the visitor. */
function friendlyError(error: Error): string {
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof parsed.error === "string"
    ) {
      return parsed.error;
    }
  } catch {
    // Not JSON: a streaming error message or a network failure.
  }
  if (/failed to fetch|network/i.test(error.message)) {
    return "Couldn't reach the assistant. Check your connection and try again.";
  }
  return error.message.length < 200 ? error.message : "Something went wrong. Please try again.";
}

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

export default function ChatPanel({
  open,
  onClose,
  ownerName,
}: {
  open: boolean;
  onClose: () => void;
  ownerName: string;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages: toRequestMessages(messages) },
        }),
      }),
    [],
  );
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({
    transport,
  });

  const [input, setInput] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const waitingForFirstToken =
    status === "submitted" ||
    (status === "streaming" && lastMessage?.role === "assistant" && textOf(lastMessage) === "");

  const starters = [
    "What's his tech stack?",
    "Show me his best project",
    "Is he available for work?",
    "উনি কোন কোন technology তে কাজ করেন?",
  ];

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [messages, status]);

  // Announce finished replies to screen readers (not every streamed token).
  useEffect(() => {
    if (status === "ready" && lastMessage?.role === "assistant") {
      setAnnouncement(`Assistant: ${textOf(lastMessage)}`);
    }
  }, [status, lastMessage, ownerName]);

  const send = (text: string) => {
    const trimmed = text.trim().slice(0, MAX_CHARS);
    if (!trimmed || busy) return;
    clearError();
    void sendMessage({ text: trimmed });
    setInput("");
  };

  /** Resend the last question after an error. */
  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const text = textOf(lastUser);
    setMessages(messages.slice(0, messages.lastIndexOf(lastUser)));
    clearError();
    void sendMessage({ text });
  };

  const clearChat = () => {
    void stop();
    setMessages([]);
    clearError();
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div
      id="chat-panel"
      role="dialog"
      aria-labelledby="chat-title"
      hidden={!open}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      className="fixed inset-0 z-[70] flex flex-col bg-white text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100 sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(600px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-gray-700"
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
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              aria-label="Clear chat"
              title="Clear chat"
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <Trash2 size={18} aria-hidden="true" />
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
              {starters.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
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
          const text = textOf(m);
          if (!text) return null;
          return m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-indigo-600 px-3.5 py-2 text-sm text-white">
                <span className="sr-only">You: </span>
                {text}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start">
              <div className="prose prose-sm max-w-[85%] break-words rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-gray-900 dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 dark:bg-gray-800 dark:text-gray-100">
                <span className="sr-only">Assistant: </span>
                <ReactMarkdown
                  components={markdownComponents}
                  skipHtml
                  disallowedElements={["img"]}
                >
                  {text}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        {waitingForFirstToken && (
          <div className="flex justify-start" aria-label="Assistant is typing">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400 motion-reduce:animate-none"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            <p>{friendlyError(error)}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 inline-flex items-center gap-1.5 font-medium underline underline-offset-2"
            >
              <RotateCcw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-gray-200 p-3 dark:border-gray-700"
      >
        <div className="flex items-end gap-2">
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
                send(input);
              }
            }}
            placeholder="Ask a question…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label="Stop generating"
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
        </div>
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Answers are AI-generated and may be imperfect.
          {input.length > MAX_CHARS - 100 && ` ${input.length}/${MAX_CHARS}`}
        </p>
      </form>
    </div>
  );
}
