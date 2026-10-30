"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data";
import { KNOWLEDGE_TAG } from "@/lib/ai/buildKnowledge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { nextOrder, runReorder, runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, skillSchema, type ActionResult } from "@/lib/validations";

function revalidateSkills() {
  revalidatePath("/admin/skills");
  revalidateTag(CACHE_TAGS.skills);
  revalidateTag(KNOWLEDGE_TAG);
}

export async function addSkill(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(skillSchema, input, async (data) => {
    const { _max } = await prisma.skill.aggregate({ _max: { order: true } });
    await prisma.skill.create({ data: { ...data, order: nextOrder(_max.order) } });
  });
  if (result.ok) revalidateSkills();
  return result;
}

export async function updateSkill(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runValidated(skillSchema, input, (data) =>
    prisma.skill.update({ where: { id: parsedId.data }, data }),
  );
  if (result.ok) revalidateSkills();
  return result;
}

export async function deleteSkill(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.skill.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateSkills();
  return result;
}

export async function reorderSkills(ids: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runReorder(
    ids,
    (id, order) => prisma.skill.update({ where: { id }, data: { order } }),
    (ops) => prisma.$transaction(ops),
  );
  if (result.ok) revalidateSkills();
  return result;
}
