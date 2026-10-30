import { prisma } from "@/lib/prisma";
import MessagesAdminClient from "./MessagesAdminClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

export default async function MessagesPage() {
  const [messages, total] = await Promise.all([
    prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: PAGE_SIZE }),
    prisma.message.count(),
  ]);

  return <MessagesAdminClient messages={messages} total={total} />;
}
