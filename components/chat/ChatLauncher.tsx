"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";

// The panel (chat SDK, Markdown renderer) is only downloaded when first needed.
const loadPanel = () => import("@/components/chat/ChatPanel");
const ChatPanel = dynamic(loadPanel, { ssr: false });

export default function ChatLauncher({ ownerName }: { ownerName: string }) {
  const [open, setOpen] = useState(false);
  // Keep the panel mounted after the first open so the conversation survives closing it.
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const openPanel = () => {
    setMounted(true);
    setOpen(true);
  };

  const closePanel = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

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
        aria-label={open ? "Close chat" : `Open chat: ask about ${ownerName}`}
        aria-expanded={open}
        aria-controls="chat-panel"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 hover:bg-indigo-500"
      >
        {open ? <X size={24} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
      </button>
      {mounted && <ChatPanel open={open} onClose={closePanel} ownerName={ownerName} />}
    </>
  );
}
