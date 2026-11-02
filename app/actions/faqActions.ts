"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { KNOWLEDGE_TAG } from "@/lib/ai/buildKnowledge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { nextOrder, runReorder, runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, faqSchema, type ActionResult } from "@/lib/validations";

/** FAQs only feed the chatbot, so only the knowledge cache needs rebuilding. */
function revalidateFaqs() {
  revalidatePath("/admin/faq");
  revalidateTag(KNOWLEDGE_TAG);
}

export async function addFaq(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(faqSchema, input, async (data) => {
    const { _max } = await prisma.faq.aggregate({ _max: { order: true } });
    await prisma.faq.create({ data: { ...data, order: nextOrder(_max.order) } });
  });
  if (result.ok) revalidateFaqs();
  return result;
}

export async function updateFaq(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runValidated(faqSchema, input, (data) =>
    prisma.faq.update({ where: { id: parsedId.data }, data }),
  );
  if (result.ok) revalidateFaqs();
  return result;
}

export async function deleteFaq(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.faq.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateFaqs();
  return result;
}

export async function reorderFaqs(ids: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runReorder(
    ids,
    (id, order) => prisma.faq.update({ where: { id }, data: { order } }),
    (ops) => prisma.$transaction(ops),
  );
  if (result.ok) revalidateFaqs();
  return result;
}
