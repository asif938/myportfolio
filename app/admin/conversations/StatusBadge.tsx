import type { ConversationStatus } from "@prisma/client";

const STYLES: Record<ConversationStatus, { label: string; className: string }> = {
  bot: {
    label: "Bot",
    className: "bg-bg-2 text-fg  ",
  },
  needs_human: {
    label: "Needs you",
    className: "bg-danger-bg text-danger  ",
  },
  human: {
    label: "You're handling it",
    className: "bg-success-bg text-success  ",
  },
  closed: {
    label: "Closed",
    className: "bg-surface-2 text-muted  ",
  },
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  const style = STYLES[status];
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}
