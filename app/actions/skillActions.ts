"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";
import { runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, skillSchema, type ActionResult } from "@/lib/validations";

function revalidateSkill() {
  revalidatePath("/admin/skills");
  revalidatePath("/", "layout");
}

export async function addSkill(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(skillSchema, input, (data) => prisma.skill.create({ data }));
  if (result.ok) revalidateSkill();
  return result;
}

export async function updateSkill(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runValidated(skillSchema, input, (data) =>
    prisma.skill.update({ where: { id: parsedId.data }, data }),
  );
  if (result.ok) revalidateSkill();
  return result;
}

export async function deleteSkill(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.skill.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateSkill();
  return result;
}
