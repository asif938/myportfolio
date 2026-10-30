import Link from "next/link";
import {
  Bot,
  Briefcase,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Mail,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { loadSettingsRowFresh, resolveSettings } from "@/lib/ai/getSettings";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminDashboard() {
  const [projects, featured, skills, experience, education, unread, totalMessages, latest, aiRow] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { featured: true } }),
      prisma.skill.count(),
      prisma.experience.count(),
      prisma.education.count(),
      prisma.message.count({ where: { read: false } }),
      prisma.message.count(),
      prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      loadSettingsRowFresh(),
    ]);
  const chatbotLive = resolveSettings(aiRow).enabled;

  const stats = [
    {
      label: "Projects",
      value: projects,
      detail: featured > 0 ? `${featured} featured` : "none featured",
      href: "/admin/projects",
      icon: FolderGit2,
    },
    { label: "Skills", value: skills, href: "/admin/skills", icon: Wrench },
    { label: "Experiences", value: experience, href: "/admin/experience", icon: Briefcase },
    { label: "Education", value: education, href: "/admin/education", icon: GraduationCap },
    {
      label: "Unread messages",
      value: unread,
      detail: `${totalMessages} total`,
      href: "/admin/messages",
      icon: Mail,
      highlight: unread > 0,
    },
  ];

  const quickLinks = [
    { label: "Edit profile & hero", href: "/admin/profile", icon: UserRound },
    { label: "Add a project", href: "/admin/projects", icon: FolderGit2 },
    { label: "Add experience", href: "/admin/experience", icon: Briefcase },
    { label: "Read messages", href: "/admin/messages", icon: Mail },
    { label: "AI chatbot settings", href: "/admin/ai", icon: Bot },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>

      <section aria-label="Content overview">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Link
                href={stat.href}
                className={`block h-full rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md ${
                  stat.highlight
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                <stat.icon
                  size={20}
                  aria-hidden="true"
                  className={
                    stat.highlight ? "text-indigo-100" : "text-indigo-600 dark:text-indigo-400"
                  }
                />
                <p className="mt-3 text-3xl font-bold">{stat.value}</p>
                <p
                  className={`text-sm ${stat.highlight ? "text-indigo-100" : "text-gray-600 dark:text-gray-300"}`}
                >
                  {stat.label}
                </p>
                {stat.detail && (
                  <p
                    className={`mt-1 text-xs ${stat.highlight ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {stat.detail}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="latest-messages"
          className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 id="latest-messages" className="text-lg font-semibold">
              Latest messages
            </h3>
            <Link
              href="/admin/messages"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View all
            </Link>
          </div>
          {latest.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No messages yet. Messages from the contact form will show up here.
            </p>
          ) : (
            <ul className="divide-y dark:divide-gray-700">
              {latest.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/admin/messages#message-${m.id}`}
                    className="flex items-start gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-transparent" : "bg-indigo-600"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-3">
                        <span className={m.read ? "font-medium" : "font-bold"}>
                          {m.name}
                          {!m.read && <span className="sr-only"> (unread)</span>}
                        </span>
                        <time
                          dateTime={m.createdAt.toISOString()}
                          className="shrink-0 text-xs text-gray-500 dark:text-gray-400"
                        >
                          {dateFormatter.format(m.createdAt)}
                        </time>
                      </span>
                      <span className="block truncate text-sm text-gray-600 dark:text-gray-300">
                        {m.subject}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section
            aria-labelledby="quick-links"
            className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
          >
            <h3 id="quick-links" className="mb-3 text-lg font-semibold">
              Quick links
            </h3>
            <ul className="space-y-1">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <link.icon
                      size={16}
                      aria-hidden="true"
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <ExternalLink
                    size={16}
                    aria-hidden="true"
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                  View the website
                </a>
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="chatbot-status"
            className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
          >
            <h3 id="chatbot-status" className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <Sparkles
                size={18}
                aria-hidden="true"
                className="text-indigo-600 dark:text-indigo-400"
              />
              AI chatbot
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {chatbotLive ? "Live on the website." : "Hidden (not enabled or not configured)."}{" "}
              <Link
                href="/admin/ai"
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Settings
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
