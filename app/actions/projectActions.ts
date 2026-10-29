"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { ActionError, nextOrder, runReorder, runSafely, runValidated } from "@/lib/actionHelpers";
import { slugify, uniqueSlug } from "@/lib/slug";
import { idSchema, projectSchema, type ActionResult } from "@/lib/validations";

function revalidateProjects() {
  revalidatePath("/admin/projects");
  revalidateTag(CACHE_TAGS.projects);
}

async function slugTakenByOther(slug: string, ownId?: string): Promise<boolean> {
  const existing = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  return existing !== null && existing.id !== ownId;
}

export async function addProject(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(projectSchema, input, async ({ slug, ...data }) => {
    let finalSlug: string;
    if (slug) {
      if (await slugTakenByOther(slug)) {
        throw new ActionError(`The slug "${slug}" is already used by another project.`);
      }
      finalSlug = slug;
    } else {
      finalSlug = await uniqueSlug(slugify(data.name), (s) => slugTakenByOther(s));
    }

    const { _max } = await prisma.project.aggregate({ _max: { order: true } });
    await prisma.project.create({
      data: { ...data, slug: finalSlug, order: nextOrder(_max.order) },
    });
  });
  if (result.ok) revalidateProjects();
  return result;
}

export async function updateProject(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };
  const projectId = parsedId.data;

  const result = await runValidated(projectSchema, input, async ({ slug, ...data }) => {
    // An empty slug keeps the current one, so existing links don't break by accident.
    if (slug && (await slugTakenByOther(slug, projectId))) {
      throw new ActionError(`The slug "${slug}" is already used by another project.`);
    }
    await prisma.project.update({
      where: { id: projectId },
      data: slug ? { ...data, slug } : data,
    });
  });
  if (result.ok) revalidateProjects();
  return result;
}

export async function deleteProject(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const result = await runSafely(() => prisma.project.delete({ where: { id: parsedId.data } }));
  if (result.ok) revalidateProjects();
  return result;
}

export async function reorderProjects(ids: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runReorder(
    ids,
    (id, order) => prisma.project.update({ where: { id }, data: { order } }),
    (ops) => prisma.$transaction(ops),
  );
  if (result.ok) revalidateProjects();
  return result;
}
