import { prisma } from "@/lib/prisma";
import ProfileAdminForm from "./ProfileAdminForm";

export const revalidate = 0;

export default async function ProfilePage() {
  const profile = await prisma.profile.findFirst();
  
  return (
    <div>
      <ProfileAdminForm initialProfile={profile} />
    </div>
  );
}
