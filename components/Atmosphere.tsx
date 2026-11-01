/**
 * Decorative background graphics for a section (hero). Purely visual:
 * aria-hidden, pointer-events-none, CSS + tiny hand-written SVG, colors from --atm-* tokens.
 * Light and dark variants are both in the markup and switched with the `dark:` class
 * (no JS, so no flash). Float animations are transform-only and freeze under reduced motion.
 *
 * Adding a palette = add a case to VARIANTS with its own light/dark pieces.
 */

type PaletteId = "prism";

const fill = (v: string) => ({ fill: `var(${v})` });
const stop = (v: string, o = 1) => ({ stopColor: `var(${v})`, stopOpacity: o });

/* ───────── shared pieces ───────── */

/** Faceted crystal. Facets are lighter on the left/top, darker on the right/bottom. */
function Crystal({ id, a, b, className }: { id: string; a: string; b: string; className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={stop(a)} />
          <stop offset="1" style={stop(b)} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <polygon points="40,0 4,28 26,28" opacity=".95" />
        <polygon points="40,0 26,28 54,28" opacity=".7" />
        <polygon points="40,0 54,28 76,28" opacity=".5" />
        <polygon points="4,28 26,28 40,100" opacity=".6" />
        <polygon points="26,28 54,28 40,100" opacity=".85" />
        <polygon points="54,28 76,28 40,100" opacity=".4" />
      </g>
      <polygon points="40,0 76,28 40,100 4,28" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
    </svg>
  );
}

/** Folded paper plane. */
function PaperPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden focusable="false">
      <polygon points="4,40 116,4 52,58" style={fill("--atm-d")} opacity=".95" />
      <polygon points="52,58 116,4 62,86" style={fill("--atm-c")} opacity=".9" />
      <polygon points="52,58 62,86 68,64" style={fill("--atm-a")} opacity=".95" />
    </svg>
  );
}

const STARS = [
  [6, 12], [14, 34], [22, 8], [31, 22], [43, 10], [57, 28], [66, 9], [74, 20], [83, 12], [91, 30], [96, 8], [49, 36],
];

/* ───────── Prism · dark (Night) ───────── */

function PrismNight() {
  return (
    <div className="absolute inset-0 hidden dark:block">
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, #000 10%, transparent 75%)",
          maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, #000 10%, transparent 75%)",
        }}
      />
      {/* top glows */}
      <div
        className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--glow-1), transparent)" }}
      />
      <div
        className="absolute -right-24 top-20 h-[26rem] w-[26rem] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--glow-2), transparent)", opacity: 0.55 }}
      />

      {/* stars */}
      <svg className="absolute inset-x-0 top-0 h-1/2 w-full" aria-hidden focusable="false">
        {STARS.map(([x, y], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i % 3 === 0 ? 1.6 : 1} style={fill("--atm-star")} opacity={i % 2 ? 0.5 : 0.8} />
        ))}
      </svg>

      {/* crystals + plane */}
      <Crystal id="cr1" a="--atm-b" b="--atm-a" className="float-a absolute right-[7%] top-[16%] hidden w-14 drop-shadow-[0_0_24px_var(--glow-2)] md:block lg:w-20" />
      <Crystal id="cr2" a="--atm-c" b="--atm-a" className="float-b absolute left-[5%] top-[30%] hidden w-10 drop-shadow-[0_0_20px_var(--glow-1)] md:block lg:left-[48%] lg:top-[62%] lg:w-14" />
      <Crystal id="cr3" a="--atm-d" b="--atm-c" className="float-c absolute right-[3%] top-[58%] hidden w-8 drop-shadow-[0_0_18px_var(--glow-1)] sm:block sm:w-10 lg:w-12" />
      <Crystal id="cr4" a="--atm-b" b="--atm-c" className="float-b absolute right-[36%] top-[12%] hidden w-7 opacity-80 lg:block" />
      <PaperPlane className="float-a absolute right-4 top-[calc(var(--nav-h,6rem)-0.25rem)] w-10 drop-shadow-[0_0_18px_var(--glow-1)] sm:right-auto sm:left-[3%] sm:top-[11%] sm:w-16 lg:left-[49%] lg:top-[20%] lg:w-20" />
    </div>
  );
}

/* ───────── Prism · light (Pastel Day) ───────── */

function PrismDay() {
  return (
    <div className="absolute inset-0 dark:hidden">
      {/* pastel blobs (radial gradients: cheap to paint, no blur filter) */}
      <div
        className="absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full opacity-35"
        style={{ background: "radial-gradient(closest-side, var(--atm-blob-1), transparent)" }}
      />
      <div
        className="absolute -right-32 top-10 h-[32rem] w-[32rem] rounded-full opacity-30"
        style={{ background: "radial-gradient(closest-side, var(--atm-blob-2), transparent)" }}
      />
      <div
        className="absolute bottom-[-8rem] left-1/3 h-[28rem] w-[28rem] rounded-full opacity-30"
        style={{ background: "radial-gradient(closest-side, var(--atm-blob-3), transparent)" }}
      />
      <div className="dot-matrix absolute inset-0" />

      {/* tiny geometric bits */}
      <svg className="float-a absolute left-[3%] top-[24%] hidden w-6 xl:block" viewBox="0 0 24 24" aria-hidden focusable="false">
        <rect x="3" y="3" width="18" height="18" rx="3" style={fill("--atm-a")} opacity=".8" transform="rotate(14 12 12)" />
      </svg>
      <svg className="float-b absolute right-[9%] top-[18%] w-7" viewBox="0 0 24 24" aria-hidden focusable="false">
        <polygon points="12,3 22,21 2,21" style={fill("--atm-b")} opacity=".75" />
      </svg>
      <svg className="float-c absolute bottom-[16%] left-[48%] hidden w-5 md:block" viewBox="0 0 24 24" aria-hidden focusable="false">
        <rect x="3" y="3" width="18" height="18" rx="3" style={fill("--atm-c")} opacity=".85" transform="rotate(-18 12 12)" />
      </svg>
      <svg className="float-a absolute bottom-[12%] right-[6%] hidden w-6 sm:block" viewBox="0 0 24 24" aria-hidden focusable="false">
        <polygon points="12,3 22,21 2,21" style={fill("--atm-d")} opacity=".9" />
      </svg>

      {/* hand-drawn scribble */}
      <svg className="absolute bottom-[10%] left-[3%] hidden w-28 md:block" viewBox="0 0 120 30" fill="none" aria-hidden focusable="false">
        <path
          d="M3 20 C 14 6, 22 6, 30 18 S 46 28, 56 14 S 74 4, 84 16 S 102 26, 117 8"
          style={{ stroke: "var(--atm-scribble)" }}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* Quieter backdrop for non-hero sections. `side` mirrors the composition. */
function PrismSoft({ side }: { side: "left" | "right" }) {
  const pos = side === "left" ? "-left-40" : "-right-40";
  const pos2 = side === "left" ? "-right-32" : "-left-32";
  return (
    <>
      <div className="absolute inset-0 dark:hidden">
        <div
          className={`absolute ${pos} top-0 h-[30rem] w-[30rem] rounded-full opacity-30`}
          style={{ background: "radial-gradient(closest-side, var(--atm-blob-1), transparent)" }}
        />
        <div
          className={`absolute ${pos2} bottom-0 h-[28rem] w-[28rem] rounded-full opacity-25`}
          style={{ background: "radial-gradient(closest-side, var(--atm-blob-2), transparent)" }}
        />
        <div className="dot-matrix absolute inset-0 opacity-70" />
      </div>
      <div className="absolute inset-0 hidden dark:block">
        <div
          className={`absolute ${pos} top-10 h-[30rem] w-[30rem] rounded-full opacity-60`}
          style={{ background: "radial-gradient(closest-side, var(--glow-1), transparent)" }}
        />
        <div
          className={`absolute ${pos2} bottom-0 h-[26rem] w-[26rem] rounded-full opacity-40`}
          style={{ background: "radial-gradient(closest-side, var(--glow-2), transparent)" }}
        />
      </div>
    </>
  );
}

type Variant = "hero" | "soft";
type Side = "left" | "right";

const VARIANTS: Record<PaletteId, (p: { variant: Variant; side: Side }) => React.JSX.Element> = {
  prism: ({ variant, side }) =>
    variant === "soft" ? (
      <PrismSoft side={side} />
    ) : (
      <>
        <PrismDay />
        <PrismNight />
      </>
    ),
};

export default function Atmosphere({
  palette = "prism",
  variant = "hero",
  side = "left",
}: {
  palette?: PaletteId;
  variant?: Variant;
  side?: Side;
}) {
  const Pick = VARIANTS[palette];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Pick variant={variant} side={side} />
    </div>
  );
}
