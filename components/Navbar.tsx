"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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

export default function Navbar({ showExperience = false }: { showExperience?: boolean }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const linkClass = (id: string, mobile: boolean) => {
    const active = activeId === id;
    if (mobile) {
      return `block rounded-md px-3 py-2 text-base font-medium ${
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
      }`;
    }
    return `relative rounded-sm py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-indigo-600 after:transition-transform dark:after:bg-indigo-400 ${
      active
        ? "text-indigo-600 after:scale-x-100 dark:text-indigo-400"
        : "text-gray-700 after:scale-x-0 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
    }`;
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "bg-white/90 shadow-md backdrop-blur-md dark:bg-gray-950/90"
          : "bg-transparent"
      }`}
    >
      <SkipLink />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex-shrink-0 rounded-sm text-2xl font-extrabold tracking-tighter text-indigo-600 dark:text-indigo-400"
          >
            Portfolio<span className="text-gray-900 dark:text-white">.</span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <nav aria-label="Main">
              <ul className="flex gap-6 xl:gap-8">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={`/#${link.id}`}
                      onClick={(e) => handleNavClick(e, link.id)}
                      aria-current={
                        activeId === link.id ? (isHome ? "location" : "page") : undefined
                      }
                      className={linkClass(link.id, false)}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 dark:text-gray-300"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto bg-white px-2 pb-3 pt-2 shadow-lg dark:bg-gray-900 lg:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={`/#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              aria-current={activeId === link.id ? (isHome ? "location" : "page") : undefined}
              className={linkClass(link.id, true)}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
