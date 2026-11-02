import { cn } from "./cn";

type Props = React.HTMLAttributes<HTMLElement> & { id: string; backdrop?: React.ReactNode };

/**
 * Page section. Focusable programmatically (tabIndex -1) because the navbar moves focus
 * to the target section after a jump link.
 */
export default function Section({ id, className, children, backdrop, ...rest }: Props) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className={cn(
        "relative scroll-mt-24 py-20 outline-none sm:py-28",
        backdrop ? "overflow-hidden" : "",
        className,
      )}
      {...rest}
    >
      {backdrop}
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
