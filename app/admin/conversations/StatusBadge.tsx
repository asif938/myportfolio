import type { ConversationStatus } from "@prisma/client";

const STYLES: Record<ConversationStatus, { label: string; className: string }> = {
  bot: {
    label: "Bot",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  },
  needs_human: {
    label: "Needs you",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  human: {
    label: "You're handling it",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
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
