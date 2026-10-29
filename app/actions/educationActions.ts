"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { nextOrder, runReorder, runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, educationSchema, type ActionResult } from "@/lib/validations";

function revalidateEducation() {
  revalidatePath("/admin/education");
  revalidateTag(CACHE_TAGS.education);
}

export async function addEducation(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(educationSchema, input, async (data) => {
    const { _max } = await prisma.education.aggregate({ _max: { order: true } });
    await prisma.education.create({ data: { ...data, order: nextOrder(_max.order) } });
  });
  if (result.ok) revalidateEducation();
  return result;
}

export async function updateEducation(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runValidated(educationSchema, input, (data) =>
    prisma.education.update({ where: { id: parsedId.data }, data }),
  );
  if (result.ok) revalidateEducation();
  return result;
}

export async function deleteEducation(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.education.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateEducation();
  return result;
}

export async function reorderEducation(ids: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runReorder(
    ids,
    (id, order) => prisma.education.update({ where: { id }, data: { order } }),
    (ops) => prisma.$transaction(ops),
  );
  if (result.ok) revalidateEducation();
  return result;
}
