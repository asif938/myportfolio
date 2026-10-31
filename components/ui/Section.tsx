import { cn } from "./cn";

type Props = React.HTMLAttributes<HTMLElement> & { id: string };

export default function Section({ id, className, children, ...rest }: Props) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 py-20 sm:py-28", className)} {...rest}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
