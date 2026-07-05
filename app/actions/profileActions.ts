"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: any) {
  const profile = await prisma.profile.findFirst();
  
  if (profile) {
    await prisma.profile.update({
      where: { id: profile.id },
      data,
    });
  } else {
    await prisma.profile.create({ data });
  }
  
  revalidatePath("/");
  revalidatePath("/admin/profile");
}
