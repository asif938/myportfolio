import Image from "next/image";

/** Edit the chip copy here. */
const ABOUT_CHIPS = {
  status: "Open to work",
  role: "Full Stack Developer",
} as const;

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/**
 * About picture: gradient circle + orbit ring, a transparent-background portrait cut round at the
 * bottom (head and shoulders rise above the circle), spark and two glass chips. Styles: .about-* in
 * globals.css, colors from the --about-* tokens. Decorative parts are aria-hidden.
 */
export default function AboutPhoto({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="about-stage">
      <div className="about-circ" aria-hidden />
      <div className="about-orb" aria-hidden />

      <div className="about-cut">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${name} portrait`}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 430px, 360px"
            className="object-cover"
            style={{ objectPosition: "center bottom" }}
          />
        ) : (
          <span className="about-initials" role="img" aria-label={`${name} portrait`}>
            {initialsOf(name)}
          </span>
        )}
      </div>

      <svg className="about-spark" viewBox="0 0 24 24" aria-hidden focusable="false">
        <defs>
          <linearGradient id="about-spark-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--about-spark-a)" />
            <stop offset="1" stopColor="var(--about-spark-b)" />
          </linearGradient>
        </defs>
        <path
          d="M12 0c.9 6.4 5.6 11.1 12 12-6.4.9-11.1 5.6-12 12-.9-6.4-5.6-11.1-12-12C6.4 11.1 11.1 6.4 12 0Z"
          fill="url(#about-spark-g)"
        />
      </svg>

      <p className="about-chip about-chip-1">
        <span className="about-dot" aria-hidden />
        {ABOUT_CHIPS.status}
      </p>
      <p className="about-chip about-chip-2">{ABOUT_CHIPS.role}</p>
    </div>
  );
}
