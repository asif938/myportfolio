import type { Profile } from "@prisma/client";
import { Github, Linkedin, Facebook } from "lucide-react";

const socials = [
  { key: "githubUrl", label: "GitHub", Icon: Github },
  { key: "linkedinUrl", label: "LinkedIn", Icon: Linkedin },
  { key: "facebookUrl", label: "Facebook", Icon: Facebook },
] as const;

export default function Footer({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg-2">
      {/* gradient hairline on top */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-brand-gradient" />

      {/* giant outlined wordmark behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-0.12em] select-none whitespace-nowrap text-center font-display text-[min(10.5vw,9rem)] font-bold leading-none opacity-[0.08]"
        style={{ color: "transparent", WebkitTextStroke: "1.5px var(--fg)" }}
      >
        {profile.name}
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 pb-24 pt-12 sm:px-6 sm:pb-28 lg:px-8">
        <ul className="flex gap-3">
          {socials.map(({ key, label, Icon }) =>
            profile[key] ? (
              <li key={key}>
                <a
                  href={profile[key] ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-fg backdrop-blur-md transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand"
                >
                  <Icon size={19} aria-hidden />
                </a>
              </li>
            ) : null,
          )}
        </ul>
        <p className="text-center text-sm text-muted">
          &copy; {year} {profile.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
