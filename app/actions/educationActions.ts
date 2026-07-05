"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addEducation(data: any) {
  await prisma.education.create({ data });
  revalidatePath("/admin/education");
  revalidatePath("/");
}

export async function updateEducation(id: string, data: any) {
  await prisma.education.update({ where: { id }, data });
  revalidatePath("/admin/education");
  revalidatePath("/");
}

export async function deleteEducation(id: string) {
  await prisma.education.delete({ where: { id } });
  revalidatePath("/admin/education");
  revalidatePath("/");
}
