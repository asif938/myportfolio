import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/data";
import ConversationThread from "./ConversationThread";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const id = z.uuid().safeParse(params.id);
  if (!id.success) notFound();

  const [conversation, profile] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id: id.data },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 500 } },
    }),
    getProfile(),
  ]);
  if (!conversation) notFound();

  const { messages, visitorTokenHash: _hash, ...rest } = conversation;
  return (
    <div className="max-w-4xl space-y-4">
      <Link
        href="/admin/conversations"
        className="inline-flex items-center gap-1 text-sm text-muted hover:opacity-80"
      >
        <ArrowLeft size={14} aria-hidden="true" /> All conversations
      </Link>
      <ConversationThread
        conversation={rest}
        messages={messages}
        ownerName={profile?.name ?? "You"}
      />
    </div>
  );
}
