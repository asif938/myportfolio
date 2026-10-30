import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { CONVERSATION_RETENTION_DAYS } from "@/lib/chat/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(req.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Daily retention job (scheduled in vercel.json). Vercel Cron sends
 * "Authorization: Bearer <CRON_SECRET>". Deletes conversations (and, by cascade,
 * their messages) whose last message is older than the retention period.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - CONVERSATION_RETENTION_DAYS * 86_400_000);
  const { count } = await prisma.conversation.deleteMany({
    where: { lastMessageAt: { lt: cutoff } },
  });
  console.info(
    `[cron] deleted ${count} conversation(s) older than ${CONVERSATION_RETENTION_DAYS} days`,
  );
  return Response.json({ deleted: count, cutoff: cutoff.toISOString() });
}
