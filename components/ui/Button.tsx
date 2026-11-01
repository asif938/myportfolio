import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Common = {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
  /** Icon inside the round chip (primary only). */
  chipIcon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
};
type AsLink = Common & { href: string; external?: boolean } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;
type AsButton = Common & { href?: undefined; external?: undefined } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

const base =
  "group relative inline-flex items-center justify-center gap-3 rounded-full text-sm font-semibold " +
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 " +
  "disabled:pointer-events-none disabled:opacity-60";

const styles = {
  primary: {
    md: "h-12 pl-6 pr-1.5 [background:var(--cta-bg)] text-cta-fg shadow-glow",
    sm: "h-10 pl-5 pr-1 [background:var(--cta-bg)] text-cta-fg shadow-glow",
  },
  secondary: {
    md: "h-12 px-6 border border-line-strong bg-surface text-fg backdrop-blur-md hover:border-brand",
    sm: "h-10 px-5 border border-line-strong bg-surface text-fg backdrop-blur-md hover:border-brand",
  },
};

/** Round chip with two arrows: one leaves, one enters on hover. */
function Chip({ Icon, small }: { Icon: LucideIcon; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative grid ${small ? "h-8 w-8" : "h-9 w-9"} shrink-0 place-items-center overflow-hidden rounded-full bg-cta-chip text-cta-chip-fg`}
    >
      <Icon
        size={18}
        className="transition-transform duration-300 ease-out group-hover:-translate-y-6 group-hover:translate-x-6"
      />
      <Icon
        size={18}
        className="absolute -translate-x-6 translate-y-6 transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0"
      />
    </span>
  );
}

export default function Button(props: AsLink | AsButton) {
  const {
    variant = "primary",
    size = "md",
    chipIcon = ArrowRight,
    className,
    children,
    ...rest
  } = props;
  const cls = cn(base, styles[variant][size], className);
  const content = (
    <>
      <span>{children}</span>
      {variant === "primary" && <Chip Icon={chipIcon} small={size === "sm"} />}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, external, ...anchor } = rest as Omit<AsLink, keyof Common>;
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...anchor}>
        {content}
      </a>
    ) : (
      <Link href={href} className={cls} {...anchor}>
        {content}
      </Link>
    );
  }
  const { href: _h, external: _e, ...button } = rest as Omit<AsButton, keyof Common>;
  return (
    <button type="button" className={cls} {...button}>
      {content}
    </button>
  );
}
