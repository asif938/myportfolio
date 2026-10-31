"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Menu, X } from "lucide-react";
import LogoutButton from "./LogoutButton";
import SkipLink from "@/components/SkipLink";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/conversations", label: "Conversations" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/profile", label: "Profile & Hero" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/ai", label: "AI Chatbot" },
];

export default function AdminShell({
  children,
  unreadMessages = 0,
  unreadConversations = 0,
}: {
  children: React.ReactNode;
  unreadMessages?: number;
  unreadConversations?: number;
}) {
  const badges: Record<string, number> = {
    "/admin/messages": unreadMessages,
    "/admin/conversations": unreadConversations,
  };
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-bg-2 text-fg">
      <SkipLink />
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface-2 px-4 lg:hidden">
        <span className="text-lg font-bold">Admin Panel</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            className="rounded-md p-2 text-fg hover:bg-surface-2"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface-2 shadow-card transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 lg:justify-center">
          <span className="text-xl font-bold text-fg">Admin Panel</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close admin menu"
            className="rounded-md p-2 text-fg hover:bg-surface-2 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                isActive(link.href) ? "bg-surface-2 text-accent" : "text-fg hover:bg-surface-2"
              }`}
            >
              {link.label}
              {(badges[link.href] ?? 0) > 0 && (
                <span className="rounded-full bg-brand-gradient-deep px-2 py-0.5 text-xs font-semibold text-white">
                  {badges[link.href]}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2"
          >
            View site <ExternalLink size={14} />
          </Link>
        </nav>
        <div className="shrink-0 border-t border-line p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <LogoutButton />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 p-4 outline-none sm:p-6 lg:ml-64 lg:p-8"
      >
        {children}
      </main>
    </div>
  );
}
