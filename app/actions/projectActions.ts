"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProject(data: any) {
  await prisma.project.create({ data });
  revalidatePath("/admin/projects");
  revalidatePath("/");
}

export async function updateProject(id: string, data: any) {
  await prisma.project.update({ where: { id }, data });
  revalidatePath("/admin/projects");
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  revalidatePath("/");
}
