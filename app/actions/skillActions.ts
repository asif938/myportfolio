"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addSkill(data: { name: string; category: string; imageUrl?: string }) {
  await prisma.skill.create({ data });
  revalidatePath("/admin/skills");
  revalidatePath("/");
}

export async function updateSkill(id: string, data: { name: string; category: string; imageUrl?: string }) {
  await prisma.skill.update({ where: { id }, data });
  revalidatePath("/admin/skills");
  revalidatePath("/");
}

export async function deleteSkill(id: string) {
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/admin/skills");
  revalidatePath("/");
}
