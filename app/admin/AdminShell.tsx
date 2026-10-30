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
  { href: "/admin/profile", label: "Profile & Hero" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <SkipLink />
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 lg:hidden">
        <span className="text-lg font-bold">Admin Panel</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-md transition-transform duration-200 dark:bg-gray-800 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700 lg:justify-center">
          <span className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close admin menu"
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 lg:hidden"
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
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive(link.href)
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            View site <ExternalLink size={14} />
          </Link>
        </nav>
        <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-700">
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
