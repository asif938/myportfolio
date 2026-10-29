"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data";
import { requireAdmin } from "@/lib/requireAdmin";
import { runValidated } from "@/lib/actionHelpers";
import { profileSchema, type ActionResult } from "@/lib/validations";

export async function updateProfile(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(profileSchema, input, async (data) => {
    const profile = await prisma.profile.findFirst({ select: { id: true } });
    if (profile) {
      await prisma.profile.update({ where: { id: profile.id }, data });
    } else {
      await prisma.profile.create({ data });
    }
  });

  if (result.ok) {
    revalidateTag(CACHE_TAGS.profile);
    revalidatePath("/admin/profile");
  }
  return result;
}
