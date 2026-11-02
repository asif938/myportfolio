"use client";

import { m } from "framer-motion";

/**
 * Fades and slides its children in once when they scroll into view.
 * With "reduce motion" enabled, MotionConfig (see Providers) skips the movement.
 * Content stays visible without JavaScript thanks to the <noscript> rule in the root layout.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const Component = m[as];
  return (
    <Component
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Component>
  );
}
