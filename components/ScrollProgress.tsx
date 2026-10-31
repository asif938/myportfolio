"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin reading-progress bar at the very top of the page.
 * Drives a single `transform: scaleX()` from a rAF-throttled scroll listener (no React
 * re-renders, no layout work). Hidden on admin and login screens.
 */
export default function ScrollProgress() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/login");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hidden) return;
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Page height changes as images load and sections reveal.
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver.disconnect();
    };
  }, [hidden, pathname]);

  if (hidden) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{ background: "var(--progress-bg)", transform: "scaleX(0)" }}
      />
    </div>
  );
}
