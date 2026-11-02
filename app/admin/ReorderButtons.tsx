"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

/** Return the ids in their new order after moving the item at `index` by `delta` (-1 or +1). */
export function moveId(ids: string[], index: number, delta: -1 | 1): string[] {
  const target = index + delta;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function ReorderButtons({
  label,
  index,
  count,
  disabled,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  disabled?: boolean;
  onMove: (delta: -1 | 1) => void;
}) {
  const buttonClass =
    "rounded p-1 text-muted hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30   ";
  return (
    <div className="flex gap-1">
      <button
        type="button"
        aria-label={`Move ${label} up`}
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
        className={buttonClass}
      >
        <ArrowUp size={16} />
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(1)}
        className={buttonClass}
      >
        <ArrowDown size={16} />
      </button>
    </div>
  );
}
