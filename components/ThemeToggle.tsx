"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const ORDER = ["system", "light", "dark"] as const;
type ThemeChoice = (typeof ORDER)[number];

const LABELS: Record<ThemeChoice, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

const ICONS = { system: Monitor, light: Sun, dark: Moon };

function isThemeChoice(value: string | undefined): value is ThemeChoice {
  return ORDER.some((t) => t === value);
}

/** Cycles System -> Light -> Dark. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The stored theme is only known in the browser; render a placeholder until then
  // so the server and client HTML match.
  useEffect(() => setMounted(true), []);

  const baseClass = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-fg transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand ${className}`;

  if (!mounted) {
    return <span aria-hidden="true" className={baseClass} />;
  }

  const current: ThemeChoice = isThemeChoice(theme) ? theme : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICONS[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${LABELS[current]}. Switch to ${LABELS[next].toLowerCase()}`}
      title={`${LABELS[current]} (click for ${LABELS[next].toLowerCase()})`}
      className={baseClass}
    >
      {/* key restarts the icon-pop swap animation whenever the mode changes */}
      <Icon key={current} size={18} aria-hidden="true" className="icon-pop" />
    </button>
  );
}
