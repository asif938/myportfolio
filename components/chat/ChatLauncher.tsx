"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
import { fetchThread, loadSession } from "@/components/chat/chatClient";

// The panel (Markdown renderer, chat UI) is only downloaded when first needed.
const loadPanel = () => import("@/components/chat/ChatPanel");
const ChatPanel = dynamic(loadPanel, { ssr: false });

export default function ChatLauncher({ ownerName }: { ownerName: string }) {
  const [open, setOpen] = useState(false);
  // Keep the panel mounted after the first open so the conversation survives closing it.
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Returning visitor: one check for owner replies since they last looked.
  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    fetchThread(session, session.lastSeenAt)
      .then((thread) => {
        if (thread.messages.some((m) => m.role === "admin")) setUnread(true);
      })
      .catch(() => {});
  }, []);

  const openPanel = () => {
    setMounted(true);
    setOpen(true);
  };

  const closePanel = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const markSeen = useCallback(() => setUnread(false), []);

  // Full-screen sheet on small screens: stop the page behind it from scrolling.
  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 640px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        onPointerEnter={() => void loadPanel()}
        onFocus={() => void loadPanel()}
        aria-label={
          open ? "Close chat" : `Open chat: ask about ${ownerName}${unread ? " (new reply)" : ""}`
        }
        aria-expanded={open}
        aria-controls="chat-panel"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full text-cta-fg shadow-glow transition-transform duration-200 ease-out [background:var(--cta-bg)] hover:-translate-y-0.5"
      >
        {/* one subtle attention pulse after load (stops by itself; static under reduced motion) */}
        <span
          aria-hidden="true"
          className="ring-pulse pointer-events-none absolute inset-0 rounded-full bg-brand opacity-0"
        />
        {open ? <X size={24} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
        {unread && !open && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-bg bg-success"
          />
        )}
      </button>
      {mounted && (
        <ChatPanel open={open} onClose={closePanel} ownerName={ownerName} onSeen={markSeen} />
      )}
    </>
  );
}
