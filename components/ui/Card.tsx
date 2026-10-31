import { cn } from "./cn";

const TINTS = ["tint-1", "tint-2", "tint-3", "tint-4", "tint-5", "tint-6"] as const;

/** Maps any index (0-based) onto the six palette tints. */
export function tintClass(index: number) {
  return TINTS[((index % 6) + 6) % 6];
}

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** 0-based index; cycles through the palette tints. Omit for a neutral card. */
  tint?: number;
};

export default function Card({ tint, className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-6 shadow-card transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1",
        tint === undefined ? "border-line bg-surface" : cn(tintClass(tint), "border-t-border bg-t-bg text-t-fg"),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
