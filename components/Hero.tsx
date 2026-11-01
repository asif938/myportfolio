import type { Profile } from "@prisma/client";
import Image from "next/image";
import { Download, Github, Linkedin, Facebook } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Button from "@/components/ui/Button";
import Highlight from "@/components/ui/Highlight";

const socials = [
  { key: "githubUrl", label: "GitHub", Icon: Github },
  { key: "linkedinUrl", label: "LinkedIn", Icon: Linkedin },
  { key: "facebookUrl", label: "Facebook", Icon: Facebook },
] as const;

export default function Hero({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  return (
    <section
      id="home"
      tabIndex={-1}
      className="relative flex min-h-screen min-h-[100svh] scroll-mt-16 items-start md:items-center overflow-hidden py-[var(--nav-h)] outline-none [--nav-h:6rem] sm:[--nav-h:7rem]"
    >
      <Atmosphere />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 md:items-center md:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div className="order-1 space-y-8 md:order-2 lg:order-1">
            <div className="space-y-5">
              <p className="cursor text-sm font-semibold uppercase tracking-[0.18em] text-accent">Hello, I am</p>
              <h1 className="text-hero font-bold text-fg">{profile.name}</h1>
              <p className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                <Highlight>&lt; {profile.designation} &gt;</Highlight>
              </p>
              {profile.tagline && (
                <p className="max-w-xl whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">
                  {profile.tagline}
                </p>
              )}
              {profile.availability && (
                <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm font-medium text-fg backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-highlight ring-2 ring-line-strong" aria-hidden="true" />
                  {profile.availability}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              {profile.resumeUrl ? (
                <Button href={profile.resumeUrl} external chipIcon={Download}>
                  Download Resume
                </Button>
              ) : (
                <Button variant="secondary" disabled>
                  Resume Coming Soon
                </Button>
              )}
              <Button href="#projects" variant="secondary">
                View Work
              </Button>
            </div>

            <ul className="flex gap-3 pt-2">
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
                      <Icon size={20} aria-hidden />
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          </div>

          <div className="order-2 flex justify-center md:order-1 lg:order-2 lg:justify-end">
            <div className="relative w-[min(70%,280px)] md:w-[min(64vw,26rem)] lg:w-[min(36vw,28rem)]">
              <div
                aria-hidden
                className="absolute -inset-8 rounded-full"
                style={{ background: "radial-gradient(closest-side, var(--glow-2), transparent)", opacity: 0.7 }}
              />
              <div className="relative rounded-[2.75rem] bg-brand-gradient p-1 shadow-glow">
                <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-surface-2">
                  {profile.heroPhotoUrl ? (
                    <Image
                      src={profile.heroPhotoUrl}
                      alt={profile.name}
                      fill
                      priority
                      sizes="(min-width: 1024px) 448px, (min-width: 768px) 64vw, 280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted">No Image Available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
