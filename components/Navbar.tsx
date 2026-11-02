"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import SkipLink from "@/components/SkipLink";
import ThemeToggle from "@/components/ThemeToggle";

type NavLink = { name: string; id: string };

/** Section id currently in the middle of the viewport (home page only). */
function useActiveSection(ids: string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!enabled) return;
    const sections = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // A section is "active" while it crosses a thin band just above the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [key, enabled]);

  return enabled ? active : null;
}

function initials(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const PILL_BASE_WIDTH = 100;

export default function Navbar({
  showExperience = false,
  name,
}: {
  showExperience?: boolean;
  name?: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: NavLink[] = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Skills", id: "skills" },
    ...(showExperience ? [{ name: "Experience", id: "experience" }] : []),
    { name: "Education", id: "education" },
    { name: "Projects", id: "projects" },
    { name: "Contact", id: "contact" },
  ];

  const activeSection = useActiveSection(
    navLinks.map((l) => l.id),
    isHome,
  );
  const activeId = isHome ? activeSection : pathname.startsWith("/projects") ? "projects" : null;

  // Sliding active pill: moved with transform only (translate + scale), no layout animation.
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = activeId ? linkRefs.current[activeId] : null;
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeId, showExperience]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  /**
   * On the home page, scroll to the section ourselves: smooth (unless reduced motion),
   * offset by scroll-margin-top, and move keyboard focus to the section.
   * On other pages the link navigates to "/#id" normally.
   */
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    setIsMobileMenuOpen(false);
    if (!isHome) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
    window.history.replaceState(null, "", `#${id}`);
  };

  const ariaCurrent = (id: string) =>
    activeId === id ? (isHome ? ("location" as const) : ("page" as const)) : undefined;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-4">
      <SkipLink />
      <div className="mx-auto max-w-6xl">
        <div className="flex h-14 items-center justify-between gap-2 rounded-full border border-line-strong bg-[var(--nav-bg)] py-1.5 pl-2 pr-2 shadow-card backdrop-blur-xl sm:h-16 sm:pl-3 sm:pr-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-full pr-2">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient-deep font-display text-sm font-bold text-white"
            >
              {initials(name)}
            </span>
            {/* The accessible name comes from this text (no aria-label to disagree with the visible label). */}
            <span className="sr-only">{name ?? "Portfolio"} – home</span>
            <span
              aria-hidden
              className="hidden font-display text-base font-bold tracking-tight text-fg xl:block"
            >
              {name?.split(" ")[0] ?? "Portfolio"}
              <span className="text-accent">.</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="relative flex items-center gap-0.5">
              {pill && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-highlight transition-transform duration-300 ease-out"
                  style={{
                    width: PILL_BASE_WIDTH,
                    transformOrigin: "left center",
                    transform: `translateX(${pill.x}px) scaleX(${pill.w / PILL_BASE_WIDTH})`,
                  }}
                />
              )}
              {navLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/#${link.id}`}
                    ref={(el) => {
                      linkRefs.current[link.id] = el;
                    }}
                    onClick={(e) => handleNavClick(e, link.id)}
                    aria-current={ariaCurrent(link.id)}
                    className={`relative block rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      activeId === link.id ? "text-highlight-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              href="/#contact"
              size="sm"
              onClick={(e) => handleNavClick(e, "contact")}
              className="hidden xl:inline-flex"
            >
              Let&apos;s talk
            </Button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface text-fg lg:hidden"
            >
              {isMobileMenuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="mt-2 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-line-strong bg-[var(--nav-bg)] p-3 shadow-card backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    aria-current={ariaCurrent(link.id)}
                    className={`flex min-h-12 items-center rounded-2xl px-4 text-base font-medium ${
                      activeId === link.id
                        ? "bg-highlight text-highlight-fg"
                        : "text-fg hover:bg-surface-2"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Button
              href="/#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="mt-3 w-full"
            >
              Let&apos;s talk
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
