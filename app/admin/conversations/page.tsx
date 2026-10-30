import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "./StatusBadge";

export const dynamic = "force-dynamic";

const FILTERS = {
  all: { label: "All", where: {} },
  needs_reply: {
    label: "Needs reply",
    where: { OR: [{ unreadByAdmin: true }, { status: "needs_human" }] },
  },
  unanswered: { label: "Unanswered", where: { messages: { some: { unanswered: true } } } },
  closed: { label: "Closed", where: { status: "closed" } },
} satisfies Record<string, { label: string; where: Prisma.ConversationWhereInput }>;
type FilterKey = keyof typeof FILTERS;

const isFilter = (value: unknown): value is FilterKey =>
  typeof value === "string" && value in FILTERS;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter: FilterKey = isFilter(searchParams.filter) ? searchParams.filter : "all";

  const [conversations, counts] = await Promise.all([
    prisma.conversation.findMany({
      where: FILTERS[filter].where,
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: { where: { unanswered: true } } } },
      },
    }),
    Promise.all(
      (Object.keys(FILTERS) as FilterKey[]).map(
        async (key) =>
          [key, await prisma.conversation.count({ where: FILTERS[key].where })] as const,
      ),
    ),
  ]);
  const countFor = Object.fromEntries(counts) as Record<FilterKey, number>;

  return (
    <div className="max-w-5xl space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Chat conversations</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Conversations from the &quot;Ask about me&quot; chat. They are deleted automatically 90 days
        after the last message.
      </p>

      <nav aria-label="Filter conversations" className="flex flex-wrap gap-1">
        {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
          <Link
            key={key}
            href={key === "all" ? "/admin/conversations" : `/admin/conversations?filter=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === key
                ? "bg-indigo-600 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {FILTERS[key].label} ({countFor[key]})
          </Link>
        ))}
      </nav>

      {conversations.length === 0 ? (
        <p className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm dark:bg-gray-800">
          No conversations here.
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const last = c.messages[0];
            const needsAttention = c.unreadByAdmin || c.status === "needs_human";
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/conversations/${c.id}`}
                  className={`block rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 ${
                    needsAttention ? "border-l-4 border-indigo-600" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={needsAttention ? "font-bold" : "font-medium"}>
                        {c.visitorName ?? "Visitor"}
                        {c.visitorEmail ? (
                          <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                            ({c.visitorEmail})
                          </span>
                        ) : null}
                        {c.unreadByAdmin && <span className="sr-only"> (unread)</span>}
                      </span>
                      <StatusBadge status={c.status} />
                      {c._count.messages > 0 && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {c._count.messages} unanswered
                        </span>
                      )}
                    </div>
                    <time
                      dateTime={c.lastMessageAt.toISOString()}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {dateFormatter.format(c.lastMessageAt)}
                    </time>
                  </div>
                  {last && (
                    <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">
                        {last.role === "visitor" ? "Visitor" : last.role === "bot" ? "Bot" : "You"}:
                      </span>{" "}
                      {last.content}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
