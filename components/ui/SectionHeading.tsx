import Highlight from "./Highlight";
import { cn } from "./cn";

type Props = {
  /** Small label above the heading; gets the blinking underscore. */
  eyebrow: string;
  /** Full heading text. */
  title: string;
  /** Exactly one word/phrase inside `title` to highlight. */
  highlight?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeading({ eyebrow, title, highlight, align = "center", className }: Props) {
  const parts = highlight && title.includes(highlight) ? title.split(highlight) : null;
  return (
    <div className={cn("mb-12 sm:mb-16", align === "center" ? "text-center" : "text-left", className)}>
      <p className="cursor mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h2 className="text-h2 font-bold text-fg">
        {parts ? (
          <>
            {parts[0]}
            <Highlight>{highlight}</Highlight>
            {parts.slice(1).join(highlight)}
          </>
        ) : (
          title
        )}
      </h2>
    </div>
  );
}
