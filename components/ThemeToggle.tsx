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

  const baseClass = `inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400 ${className}`;

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
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
