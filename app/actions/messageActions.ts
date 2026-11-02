"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { runSafely } from "@/lib/actionHelpers";
import { idSchema, type ActionResult } from "@/lib/validations";

function revalidateMessages() {
  // The admin layout shows the unread badge, so refresh the whole admin tree.
  revalidatePath("/admin", "layout");
}

export async function setMessageRead(id: unknown, read: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  const parsedRead = z.boolean().safeParse(read);
  if (!parsedId.success || !parsedRead.success) return { ok: false, error: "Invalid request" };

  const result = await runSafely(() =>
    prisma.message.update({ where: { id: parsedId.data }, data: { read: parsedRead.data } }),
  );
  if (result.ok) revalidateMessages();
  return result;
}

export async function markAllMessagesRead(): Promise<ActionResult> {
  await requireAdmin();

  const result = await runSafely(() =>
    prisma.message.updateMany({ where: { read: false }, data: { read: true } }),
  );
  if (result.ok) revalidateMessages();
  return result;
}

export async function deleteMessage(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.message.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateMessages();
  return result;
}
