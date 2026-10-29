"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";
import { runSafely, runValidated } from "@/lib/actionHelpers";
import { idSchema, projectSchema, type ActionResult } from "@/lib/validations";

function revalidateProject() {
  revalidatePath("/admin/projects");
  revalidatePath("/", "layout");
}

export async function addProject(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(projectSchema, input, (data) => prisma.project.create({ data }));
  if (result.ok) revalidateProject();
  return result;
}

export async function updateProject(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runValidated(projectSchema, input, (data) =>
    prisma.project.update({ where: { id: parsedId.data }, data }),
  );
  if (result.ok) revalidateProject();
  return result;
}

export async function deleteProject(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.project.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateProject();
  return result;
}
