import { cn } from "./cn";

type Props = React.HTMLAttributes<HTMLSpanElement> & { tinted?: boolean };

/** `tinted` chips must sit inside an element carrying a `tint-N` class. */
export default function Chip({ tinted, className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium",
        tinted ? "border-t-border bg-t-bg text-t-fg" : "border-line bg-surface text-fg",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
