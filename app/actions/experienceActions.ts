"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { nextOrder, runReorder, runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, experienceSchema, type ActionResult } from "@/lib/validations";

function revalidateExperience() {
  revalidatePath("/admin/experience");
  revalidateTag(CACHE_TAGS.experience);
}

export async function addExperience(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(experienceSchema, input, async (data) => {
    const { _max } = await prisma.experience.aggregate({ _max: { order: true } });
    await prisma.experience.create({ data: { ...data, order: nextOrder(_max.order) } });
  });
  if (result.ok) revalidateExperience();
  return result;
}

export async function updateExperience(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runValidated(experienceSchema, input, (data) =>
    prisma.experience.update({ where: { id: parsedId.data }, data }),
  );
  if (result.ok) revalidateExperience();
  return result;
}

export async function deleteExperience(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.experience.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateExperience();
  return result;
}

export async function reorderExperience(ids: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runReorder(
    ids,
    (id, order) => prisma.experience.update({ where: { id }, data: { order } }),
    (ops) => prisma.$transaction(ops),
  );
  if (result.ok) revalidateExperience();
  return result;
}
