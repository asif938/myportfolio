"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Keeps the browser UI color (<meta name="theme-color">) in step with the page background token,
 * including when the visitor overrides the OS setting with the theme toggle.
 * The server-rendered values in app/layout.tsx cover the first paint.
 */
export default function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (!bg) return;
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute("content", bg));
    });
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  return null;
}
