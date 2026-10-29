"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";
import { runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, educationSchema, type ActionResult } from "@/lib/validations";

function revalidateEducation() {
  revalidatePath("/admin/education");
  revalidatePath("/", "layout");
}

export async function addEducation(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(educationSchema, input, (data) => prisma.education.create({ data }));
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
